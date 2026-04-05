/**
 * WorkLedger — Sync Service
 *
 * SESSION 19 FIX — created_by null guard in _pushWorkEntry:
 *   When entries are created offline, workEntryService calls getUser() which
 *   makes a live network request. This request fails offline (ERR_NAME_NOT_RESOLVED)
 *   → user = null → created_by = null stored in IndexedDB.
 *   On sync, Supabase rejects the null (NOT NULL constraint).
 *
 *   Fix: before pushing, if created_by is null, resolve it from getSession()
 *   which reads the JWT from localStorage — no network needed.
 *
 *   The permanent fix is in workEntryService.js (getUser→getSession). This
 *   guard handles entries already stored with created_by=null.
 *
 * @module services/offline/syncService
 * File destination: src/services/offline/syncService.js
 */

import { db, SYNC_STATUS } from './db';
import { supabase } from '../supabase/client';

const MAX_RETRIES = 3;
const ENTRY_WINDOW = 30;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (str) => typeof str === 'string' && UUID_REGEX.test(str);

// ── Helper: get current user ID from local session (no network) ───────────────
async function getSessionUserId() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

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

  // Ground truth: entries with no remoteId haven't reached Supabase
  async getPendingCount() {
    try {
      return await db.workEntries.filter(e => !e.remoteId && !e.deleted_at).count();
    } catch { return 0; }
  },

  // ── PUSH ─────────────────────────────────────────────────────────────────

  async pushPendingEntries() {
    try {
      await this._requeueOrphanedEntries();

      const pending = await db.syncQueue
        .where('sync_status').equals(SYNC_STATUS.PENDING)
        .toArray();

      if (!pending.length) { console.log('📭 Nothing to push'); return; }
      console.log(`📤 Pushing ${pending.length} item(s)...`);
      for (const item of pending) await this._pushSingleItem(item);
    } catch (e) { console.error('❌ pushPendingEntries failed:', e); }
  },

  async _requeueOrphanedEntries() {
    try {
      const unsynced = await db.workEntries.filter(e => !e.remoteId && !e.deleted_at).toArray();
      for (const entry of unsynced) {
        const live = await db.syncQueue.filter(q =>
          q.entity_type === 'work_entry' &&
          q.entity_local_id === entry.localId &&
          q.sync_status !== 'done'
        ).first();

        if (!live) {
          await db.syncQueue.add({
            entity_type: 'work_entry', entity_local_id: entry.localId,
            action: 'create', sync_status: SYNC_STATUS.PENDING,
            retry_count: 0, created_at: new Date().toISOString(),
          });
          await db.workEntries.update(entry.localId, { sync_status: SYNC_STATUS.PENDING });
          console.log(`🔁 Re-queued orphaned entry (localId: ${entry.localId})`);
        }
      }
    } catch (e) { console.warn('⚠️ _requeueOrphanedEntries failed:', e.message); }
  },

  async _pushSingleItem(queueItem) {
    try {
      await db.syncQueue.update(queueItem.id, { sync_status: SYNC_STATUS.SYNCING });
      if (queueItem.entity_type === 'work_entry') await this._pushWorkEntry(queueItem);
    } catch (e) {
      console.error(`❌ Push failed (queue ${queueItem.id}):`, e.message);
      const retries = (queueItem.retry_count || 0) + 1;
      await db.syncQueue.update(queueItem.id, {
        sync_status: SYNC_STATUS.PENDING,
        retry_count: retries,
        last_error: e.message,
      });
      if (queueItem.entity_type === 'work_entry') {
        await db.workEntries.update(queueItem.entity_local_id, { sync_error: e.message }).catch(() => {});
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // _pushWorkEntry
  //
  // Strip Dexie-local fields and send everything else to Supabase — mirrors
  // the online createWorkEntry path exactly.
  //
  // Guards:
  //   1. created_by null — resolve from local session (no network).
  //      Entries created offline had getUser() fail (network call, offline
  //      = ERR_NAME_NOT_RESOLVED) → created_by was stored as null.
  //      getSession() reads the JWT from localStorage — always works offline.
  //
  //   2. template_id not UUID — resolve text slug to UUID via IndexedDB scan.
  //      Text slugs fail Supabase FK constraint.
  // ─────────────────────────────────────────────────────────────────────────
  async _pushWorkEntry(queueItem) {
    const local = await db.workEntries.get(queueItem.entity_local_id);

    if (!local) {
      await db.syncQueue.delete(queueItem.id);
      return;
    }

    if (local.remoteId) {
      await db.syncQueue.update(queueItem.id, { sync_status: 'done' });
      console.log(`⏭️ Already synced (remoteId: ${local.remoteId})`);
      return;
    }

    // Strip Dexie-local fields — send everything else
    const { localId, remoteId, sync_status, sync_error, ...supabasePayload } = local;

    // ── GUARD 1: created_by must not be null ─────────────────────────────
    if (!supabasePayload.created_by) {
      console.warn('⚠️ created_by is null — resolving from local session...');
      const userId = await getSessionUserId();

      if (!userId) {
        throw new Error(
          'created_by is null and no session available. ' +
          'Log in to WorkLedger while online so the session is cached, then retry.'
        );
      }

      supabasePayload.created_by = userId;

      // Fix permanently in IndexedDB so future syncs don't hit this again
      await db.workEntries.update(localId, { created_by: userId });
      console.log(`✅ Resolved created_by from session: ${userId}`);
    }

    // ── GUARD 2: template_id must be a UUID ──────────────────────────────
    if (!isUUID(supabasePayload.template_id)) {
      console.warn(`⚠️ template_id "${supabasePayload.template_id}" is not a UUID — resolving...`);

      const tpl = await db.templates.get(supabasePayload.template_id)
        ?? await db.templates.filter(t => t.template_id === supabasePayload.template_id).first()
        ?? await db.contractTemplates.filter(r =>
            r.template?.template_id === supabasePayload.template_id && r.template?.id
          ).first().then(r => r?.template);

      if (tpl?.id && isUUID(tpl.id)) {
        supabasePayload.template_id = tpl.id;
        await db.workEntries.update(localId, { template_id: tpl.id });
        console.log(`✅ Resolved template_id → ${tpl.id}`);
      } else {
        throw new Error(
          `template_id "${local.template_id}" is not a UUID and could not be resolved. ` +
          `Connect to the internet, open WorkLedger to refresh template cache, then retry.`
        );
      }
    }

    console.log(`📤 Pushing entry (localId: ${localId}, date: ${supabasePayload.entry_date}, status: ${supabasePayload.status}, created_by: ${supabasePayload.created_by})`);

    const { data, error } = await supabase
      .from('work_entries')
      .insert(supabasePayload)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Supabase insert failed:', {
        code: error.code, message: error.message,
        details: error.details, hint: error.hint,
        created_by: supabasePayload.created_by,
        template_id: supabasePayload.template_id,
      });
      throw new Error(`${error.message}${error.hint ? ` — ${error.hint}` : ''}`);
    }

    await db.workEntries.update(localId, {
      remoteId: data.id,
      sync_status: SYNC_STATUS.SYNCED,
      sync_error: null,
    });
    await db.syncQueue.update(queueItem.id, { sync_status: 'done' });
    console.log(`✅ Entry pushed → remoteId: ${data.id}`);
  },

  // ── PULL ──────────────────────────────────────────────────────────────────

  async pullFromSupabase() {
    try {
      // Use getSession() — no network call, reads local JWT
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { orgId, mode } = await this._resolveUserContext(user.id);
      if (!orgId) { console.warn('⚠️ Cannot pull — no orgId resolved'); return; }

      console.log(`📥 Pulling for org ${orgId} (mode: ${mode})`);
      const contracts = await this._pullContracts(orgId);
      if (contracts.length > 0) await this._pullContractTemplates(contracts.map(c => c.id));
      await this._pullWorkEntries(user.id, orgId, mode);
    } catch (e) { console.error('❌ pullFromSupabase failed:', e); }
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
    } catch (e) { return { orgId: null, mode: 'member' }; }
  },

  async _pullOrgMembership(userId) {
    try {
      const { data, error } = await supabase
        .from('org_members').select('organization_id').eq('user_id', userId).eq('is_active', true).limit(1).single();
      if (error || !data) return null;
      const { data: org } = await supabase
        .from('organizations').select('id, name, slug, settings').eq('id', data.organization_id).single();
      if (org) await db.organizations.put(org);
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

  async pruneOldData() {
    try {
      const c30 = new Date(); c30.setDate(c30.getDate() - 30); const cut30 = c30.toISOString().split('T')[0];
      const c7  = new Date(); c7.setDate(c7.getDate() - 7);    const cut7  = c7.toISOString().split('T')[0];

      const toDelete = await db.workEntries.filter(e => {
        if (!e.remoteId) return false;
        if (e.status === 'approved' && e.entry_date < cut7)  return true;
        if (e.entry_date < cut30) return true;
        return false;
      }).primaryKeys();
      if (toDelete.length) { await db.workEntries.bulkDelete(toDelete); console.log(`🧹 Pruned ${toDelete.length} old entries`); }

      await db.syncQueue.where('sync_status').equals('done').delete();

      const failed = await db.syncQueue.where('sync_status').equals(SYNC_STATUS.FAILED).toArray();
      for (const item of failed) {
        if (item.entity_type === 'work_entry') {
          const entry = await db.workEntries.get(item.entity_local_id);
          if (entry && !entry.remoteId) {
            await db.syncQueue.update(item.id, { sync_status: SYNC_STATUS.PENDING, retry_count: 0 });
          } else {
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
