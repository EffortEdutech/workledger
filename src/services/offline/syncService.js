/**
 * WorkLedger — Sync Service
 *
 * SESSION 19 CRITICAL FIXES:
 *
 *   FIX 1 — getPendingCount now counts db.workEntries WHERE remoteId IS NULL.
 *     The old version counted db.syncQueue WHERE pending — but after 3 failed
 *     retries the queue item was pruned (FAILED → deleted) while the entry in
 *     db.workEntries still had remoteId=null. Result: pendingCount → 0, banner
 *     disappeared, user thought sync succeeded. Entries were never pushed.
 *
 *   FIX 2 — _requeueOrphanedEntries (new).
 *     On every sync cycle, scan db.workEntries for entries with remoteId=null
 *     that have no live queue item. Re-add them to the queue so the next
 *     pushPendingEntries call picks them up. This breaks the "lost entry" state.
 *
 *   FIX 3 — pruneOldData: never prune FAILED queue items whose work entry
 *     still has remoteId=null. Those entries need to be retried.
 *     Only prune FAILED items where the entry is already synced (has remoteId).
 *
 *   FIX A — _pullContracts: fetches both owned + performing_org_id (Session 19)
 *   FIX B — _pullContractTemplates: junction-based (not category-based) (Session 19)
 *
 * @module services/offline/syncService
 * File destination: src/services/offline/syncService.js
 */

import { db, SYNC_STATUS } from './db';
import { supabase } from '../supabase/client';

const MAX_RETRIES  = 3;
const ENTRY_WINDOW = 30;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (str) => typeof str === 'string' && UUID_REGEX.test(str);

export const syncService = {

  async sync() {
    console.log('🔄 Sync starting...');
    try {
      await this.pushPendingEntries();
      await this.pullFromSupabase();
      await this.pruneOldData();
      console.log('✅ Sync complete');
    } catch (error) {
      console.error('❌ Sync cycle failed:', error);
      throw error;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // getPendingCount — FIX 1
  //
  // Ground truth: count workEntries WHERE remoteId IS NULL.
  // A null remoteId means the entry has never been pushed to Supabase.
  // Queue item state is unreliable (items get pruned after failures).
  // ─────────────────────────────────────────────────────────────────────────
  async getPendingCount() {
    try {
      const count = await db.workEntries
        .filter(e => !e.remoteId && !e.deleted_at)
        .count();
      return count;
    } catch {
      return 0;
    }
  },

  // ── PUSH ─────────────────────────────────────────────────────────────────

  async pushPendingEntries() {
    try {
      // FIX 2: Always re-queue orphaned entries FIRST
      await this._requeueOrphanedEntries();

      const pending = await db.syncQueue
        .where('sync_status').equals(SYNC_STATUS.PENDING)
        .toArray();

      if (!pending.length) {
        console.log('📭 Nothing to push');
        return;
      }

      console.log(`📤 Pushing ${pending.length} pending item(s)...`);
      for (const item of pending) await this._pushSingleItem(item);

    } catch (e) {
      console.error('❌ pushPendingEntries failed:', e);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // _requeueOrphanedEntries — FIX 2 (new method)
  //
  // Finds workEntries with remoteId=null that have no live sync queue item.
  // This happens when queue items exhaust retries → marked FAILED → pruned.
  // Re-adds them to the queue so the next push attempt finds them.
  //
  // Also resets sync_status on the work entry to 'pending' so the UI
  // correctly shows them as pending instead of stuck in some other state.
  // ─────────────────────────────────────────────────────────────────────────
  async _requeueOrphanedEntries() {
    try {
      const unsynced = await db.workEntries
        .filter(e => !e.remoteId && !e.deleted_at)
        .toArray();

      if (!unsynced.length) return;

      for (const entry of unsynced) {
        // Check for existing live queue item (any status except 'done')
        const liveQueueItem = await db.syncQueue
          .filter(q =>
            q.entity_type === 'work_entry' &&
            q.entity_local_id === entry.localId &&
            q.sync_status !== 'done'
          )
          .first();

        if (!liveQueueItem) {
          // No live queue item — this entry is orphaned. Re-queue it.
          await db.syncQueue.add({
            entity_type:     'work_entry',
            entity_local_id: entry.localId,
            action:          'create',
            sync_status:     SYNC_STATUS.PENDING,
            retry_count:     0,
            created_at:      new Date().toISOString(),
          });

          // Reset sync_status on the entry so UI shows correct state
          if (entry.sync_status !== SYNC_STATUS.PENDING) {
            await db.workEntries.update(entry.localId, {
              sync_status: SYNC_STATUS.PENDING,
            });
          }

          console.log(`🔁 Re-queued orphaned entry (localId: ${entry.localId}, date: ${entry.entry_date})`);
        }
      }
    } catch (e) {
      console.warn('⚠️ _requeueOrphanedEntries failed:', e.message);
    }
  },

  async _pushSingleItem(queueItem) {
    try {
      await db.syncQueue.update(queueItem.id, { sync_status: SYNC_STATUS.SYNCING });
      if (queueItem.entity_type === 'work_entry') await this._pushWorkEntry(queueItem);
    } catch (e) {
      console.error(`❌ Push failed (queue id ${queueItem.id}):`, e.message);

      const retries = (queueItem.retry_count || 0) + 1;
      await db.syncQueue.update(queueItem.id, {
        // FIX 3: Don't finalize as FAILED — keep as PENDING so _requeueOrphanedEntries
        // doesn't re-add a duplicate. Instead, increment retry_count but stay PENDING.
        // After MAX_RETRIES we keep it PENDING (not FAILED) so the next sync sees it.
        sync_status: SYNC_STATUS.PENDING,
        retry_count: retries,
      });

      if (retries >= MAX_RETRIES) {
        console.warn(
          `⚠️ Queue item ${queueItem.id} has failed ${retries} times — will keep retrying. ` +
          `Check DevTools console for error details.`
        );
      }
    }
  },

  async _pushWorkEntry(queueItem) {
    const local = await db.workEntries.get(queueItem.entity_local_id);

    if (!local) {
      await db.syncQueue.delete(queueItem.id);
      console.log(`🗑️ Removed orphaned queue item (entry not found)`);
      return;
    }

    // Guard: already synced — cleanup stale queue item
    if (local.remoteId) {
      await db.syncQueue.update(queueItem.id, { sync_status: 'done' });
      console.log(`⏭️ Entry already synced (remoteId: ${local.remoteId})`);
      return;
    }

    // Validate and resolve template_id to UUID
    let { template_id } = local;
    if (!isUUID(template_id)) {
      console.warn(`⚠️ template_id "${template_id}" is not a UUID — attempting to resolve...`);
      const tpl = await db.templates.get(template_id)
        ?? await db.templates.filter(t => t.template_id === template_id).first();
      if (tpl?.id && isUUID(tpl.id)) {
        template_id = tpl.id;
        await db.workEntries.update(queueItem.entity_local_id, { template_id });
        console.log(`✅ Resolved template_id → UUID: ${template_id}`);
      } else {
        throw new Error(
          `template_id "${local.template_id}" is not a valid UUID and could not be resolved. ` +
          `Entry cannot be pushed until template is re-cached.`
        );
      }
    }

    // Build clean Supabase payload
    const payload = {
      contract_id:     local.contract_id,
      template_id,
      organization_id: local.organization_id ?? null,
      entry_date:      local.entry_date,
      shift:           local.shift ?? null,
      data:            local.data ?? {},
      status:          local.status,
      created_by:      local.created_by,
      created_at:      local.created_at,
      submitted_at:    local.submitted_at ?? null,
      submitted_by:    local.status === 'submitted' ? local.created_by : null,
    };

    console.log(`📤 Pushing work entry (localId: ${local.localId}, date: ${payload.entry_date}, status: ${payload.status})...`);

    const { data, error } = await supabase
      .from('work_entries')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Supabase insert failed:', {
        code: error.code, message: error.message,
        details: error.details, hint: error.hint,
      });
      throw new Error(`Supabase ${error.code}: ${error.message}`);
    }

    // Success — update local entry with remote ID
    await db.workEntries.update(queueItem.entity_local_id, {
      remoteId:    data.id,
      sync_status: SYNC_STATUS.SYNCED,
    });
    await db.syncQueue.update(queueItem.id, { sync_status: 'done' });
    console.log(`✅ Entry pushed → remoteId: ${data.id}`);
  },

  // ── PULL ──────────────────────────────────────────────────────────────────

  async pullFromSupabase() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { orgId, mode } = await this._resolveUserContext(user.id);
      if (!orgId) { console.warn('⚠️ Cannot pull — no orgId resolved'); return; }

      console.log(`📥 Pulling for org ${orgId} (mode: ${mode})`);
      const contracts = await this._pullContracts(orgId);
      if (contracts.length > 0) await this._pullContractTemplates(contracts.map(c => c.id));
      await this._pullWorkEntries(user.id, orgId, mode);
    } catch (e) {
      console.error('❌ pullFromSupabase failed:', e);
    }
  },

  async _resolveUserContext(userId) {
    try {
      const { data: profile } = await supabase
        .from('user_profiles').select('global_role').eq('id', userId).single();
      const isStaff = ['super_admin', 'bina_jaya_staff'].includes(profile?.global_role);
      if (isStaff) {
        const activeOrgId = localStorage.getItem('wl_active_org_id');
        return { orgId: activeOrgId || null, mode: 'staff' };
      }
      const orgId = await this._pullOrgMembership(userId);
      return { orgId, mode: 'member' };
    } catch (e) {
      console.warn('⚠️ _resolveUserContext failed:', e.message);
      return { orgId: null, mode: 'member' };
    }
  },

  async _pullOrgMembership(userId) {
    try {
      const { data, error } = await supabase
        .from('org_members').select('organization_id').eq('user_id', userId).eq('is_active', true).limit(1).single();
      if (error || !data) return null;
      const { data: org } = await supabase
        .from('organizations').select('id, name, slug, settings').eq('id', data.organization_id).single();
      if (org) { await db.organizations.put(org); }
      return data.organization_id;
    } catch (e) { return null; }
  },

  async _pullContracts(orgId) {
    try {
      const COLS = 'id, project_id, contract_number, contract_name, contract_type, contract_category, reporting_frequency, requires_approval, status, organization_id, performing_org_id, contract_role, valid_from, valid_until, created_by, created_at, updated_at, deleted_at';
      const base = (q) => q.eq('status', 'active').is('deleted_at', null);
      const [rO, rP] = await Promise.all([
        base(supabase.from('contracts').select(COLS).eq('organization_id', orgId)),
        base(supabase.from('contracts').select(COLS).eq('performing_org_id', orgId)),
      ]);
      const seen = new Set(); const merged = [];
      for (const c of [...(rO.data || []), ...(rP.data || [])]) {
        if (!seen.has(c.id)) { seen.add(c.id); merged.push(c); }
      }
      if (!merged.length) return [];
      await db.contracts.bulkPut(merged);
      console.log(`📥 ${merged.length} contracts cached`);
      return merged;
    } catch (e) { console.warn('⚠️ _pullContracts failed:', e.message); return []; }
  },

  async _pullContractTemplates(contractIds) {
    try {
      if (!contractIds.length) return;
      const { data, error } = await supabase
        .from('contract_templates')
        .select(`id, contract_id, template_id, label, sort_order, is_default, assigned_at,
          template:templates (id, template_id, template_name, industry, contract_category, report_type,
            fields_schema, validation_rules, pdf_layout, version, is_locked, is_public, organization_id, created_at, updated_at)`)
        .in('contract_id', contractIds)
        .order('sort_order', { ascending: true });
      if (error || !data?.length) return;

      await db.contractTemplates.where('contract_id').anyOf(contractIds).delete();
      await db.contractTemplates.bulkAdd(data.map(row => ({
        contract_id: row.contract_id, template_id: row.template_id, label: row.label,
        sort_order: row.sort_order, is_default: row.is_default, assigned_at: row.assigned_at,
        template: row.template,
      })));

      const unique = [...new Map(data.map(r => r.template).filter(Boolean).map(t => [t.template_id, t])).values()];
      if (unique.length) await db.templates.bulkPut(unique);
      console.log(`📥 ${data.length} junction rows + ${unique.length} templates cached`);
    } catch (e) { console.warn('⚠️ _pullContractTemplates failed:', e.message); }
  },

  async _pullWorkEntries(userId, orgId, mode = 'member') {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - ENTRY_WINDOW);
      const cutoffStr = cutoff.toISOString().split('T')[0];

      let q = supabase
        .from('work_entries')
        .select('id, contract_id, template_id, entry_date, shift, data, status, organization_id, created_by, created_at, updated_at, submitted_at, submitted_by, approved_at, approved_by, approval_remarks, rejected_at, rejected_by, rejection_reason')
        .gte('entry_date', cutoffStr).is('deleted_at', null).order('entry_date', { ascending: false });
      q = mode === 'member' ? q.eq('created_by', userId) : q.eq('organization_id', orgId);

      const { data, error } = await q;
      if (error) { console.warn('⚠️ _pullWorkEntries error:', error.message); return; }
      if (!data?.length) return;

      for (const entry of data) {
        const existing = await db.workEntries.where('remoteId').equals(entry.id).first();
        if (existing?.sync_status === SYNC_STATUS.PENDING) continue;
        const record = { ...entry, remoteId: entry.id, sync_status: SYNC_STATUS.SYNCED };
        if (existing) await db.workEntries.update(existing.localId, record);
        else          await db.workEntries.add(record);
      }
      console.log(`📥 ${data.length} work entries synced`);
    } catch (e) { console.warn('⚠️ _pullWorkEntries failed:', e.message); }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // pruneOldData — FIX 3
  //
  // Changed: FAILED queue items are only pruned if the corresponding work
  // entry already has a remoteId (i.e. was successfully synced elsewhere).
  // If remoteId is still null, the FAILED item is reset to PENDING so the
  // entry gets re-tried on the next sync cycle.
  // ─────────────────────────────────────────────────────────────────────────
  async pruneOldData() {
    try {
      const c30 = new Date(); c30.setDate(c30.getDate() - 30);
      const c7  = new Date(); c7.setDate(c7.getDate() - 7);
      const cut30 = c30.toISOString().split('T')[0];
      const cut7  = c7.toISOString().split('T')[0];

      // Prune old SYNCED work entries
      const toDelete = await db.workEntries.filter(e => {
        if (!e.remoteId) return false; // Never prune unsynced entries
        if (e.sync_status === SYNC_STATUS.PENDING) return false;
        if (e.status === 'approved' && e.entry_date < cut7)  return true;
        if (e.entry_date < cut30) return true;
        return false;
      }).primaryKeys();

      if (toDelete.length) {
        await db.workEntries.bulkDelete(toDelete);
        console.log(`🧹 Pruned ${toDelete.length} old synced entries`);
      }

      // Prune only 'done' queue items (not FAILED — see FIX 3)
      await db.syncQueue.where('sync_status').equals('done').delete();

      // For FAILED items: reset to PENDING if entry still needs syncing
      const failedItems = await db.syncQueue.where('sync_status').equals(SYNC_STATUS.FAILED).toArray();
      for (const item of failedItems) {
        if (item.entity_type === 'work_entry') {
          const entry = await db.workEntries.get(item.entity_local_id);
          if (entry && !entry.remoteId) {
            // Entry still unsynced — reset to pending instead of deleting
            await db.syncQueue.update(item.id, {
              sync_status: SYNC_STATUS.PENDING,
              retry_count: 0, // reset retry count for fresh attempt
            });
            console.log(`🔄 Reset FAILED queue item ${item.id} → PENDING (entry still unsynced)`);
          } else {
            // Entry synced or deleted — safe to prune the FAILED item
            await db.syncQueue.delete(item.id);
          }
        } else {
          await db.syncQueue.delete(item.id);
        }
      }
    } catch (e) { console.warn('⚠️ pruneOldData failed:', e.message); }
  },
};

export default syncService;
