/**
 * WorkLedger — Sync Service
 *
 * SESSION 19 FIX — Push payload hardening:
 *   _pushWorkEntry now:
 *   1. Validates template_id is a UUID (not a text slug) — text slugs fail
 *      Supabase's UUID FK constraint silently. If slug detected, attempts to
 *      resolve to UUID via db.templates scan before pushing.
 *   2. Logs the exact Supabase error so failures are diagnosable in DevTools.
 *   3. Strips ALL local-only fields cleanly (localId, remoteId, sync_status).
 *   4. Guards against duplicate push (remoteId already set → skip).
 *
 * @module services/offline/syncService
 * File destination: src/services/offline/syncService.js
 */

import { db, SYNC_STATUS } from './db';
import { supabase } from '../supabase/client';

const MAX_RETRIES  = 3;
const ENTRY_WINDOW = 30;

// UUID v4 pattern — used to detect text slugs vs real UUIDs
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

  async getPendingCount() {
    try {
      return await db.syncQueue.where('sync_status').equals(SYNC_STATUS.PENDING).count();
    } catch { return 0; }
  },

  // ── PUSH ─────────────────────────────────────────────────────────────────

  async pushPendingEntries() {
    try {
      const pending = await db.syncQueue.where('sync_status').equals(SYNC_STATUS.PENDING).toArray();
      if (!pending.length) { console.log('📭 Nothing to push'); return; }

      console.log(`📤 Pushing ${pending.length} pending item(s)...`);
      for (const item of pending) await this._pushSingleItem(item);
    } catch (e) {
      console.error('❌ pushPendingEntries failed:', e);
    }
  },

  async _pushSingleItem(queueItem) {
    try {
      await db.syncQueue.update(queueItem.id, { sync_status: SYNC_STATUS.SYNCING });

      if (queueItem.entity_type === 'work_entry') {
        await this._pushWorkEntry(queueItem);
      }
    } catch (e) {
      console.error(`❌ Push failed (queue id ${queueItem.id}):`, e.message);

      const retries = (queueItem.retry_count || 0) + 1;
      await db.syncQueue.update(queueItem.id, {
        sync_status: retries >= MAX_RETRIES ? SYNC_STATUS.FAILED : SYNC_STATUS.PENDING,
        retry_count: retries,
      });

      if (retries >= MAX_RETRIES) {
        console.warn(`⚠️ Queue item ${queueItem.id} permanently failed after ${retries} retries`);
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // _pushWorkEntry — SESSION 19 HARDENED
  //
  // Key changes from original:
  //   1. Guard: if remoteId already set, entry was already synced — just
  //      mark queue item done and skip the insert (prevents duplicates).
  //   2. template_id validation: if it looks like a text slug (not UUID),
  //      scan db.templates to find the real UUID. Text slug was the most
  //      common cause of "invalid input syntax for type uuid" Supabase errors.
  //   3. Supabase error is logged clearly with the full error object so it's
  //      visible in DevTools → easier to diagnose future failures.
  //   4. Only Supabase-allowed columns in payload (no local-only fields).
  // ─────────────────────────────────────────────────────────────────────────
  async _pushWorkEntry(queueItem) {
    const local = await db.workEntries.get(queueItem.entity_local_id);

    if (!local) {
      // Entry deleted locally — remove orphaned queue item
      await db.syncQueue.delete(queueItem.id);
      console.log(`🗑️ Removed orphaned queue item ${queueItem.id} (entry not found)`);
      return;
    }

    // Guard: already synced (e.g. push succeeded but queue cleanup failed last time)
    if (local.remoteId) {
      await db.syncQueue.update(queueItem.id, { sync_status: 'done' });
      console.log(`⏭️ Entry already synced (remoteId: ${local.remoteId}) — marking done`);
      return;
    }

    // ── Build clean payload ───────────────────────────────────────────────
    // Strip ALL local-only fields before sending to Supabase.
    // Only include columns that exist in the work_entries table.
    let { template_id } = local;

    // Validate template_id is a UUID — text slugs fail Supabase FK constraint
    if (!isUUID(template_id)) {
      console.warn(`⚠️ template_id "${template_id}" is not a UUID — attempting to resolve...`);

      // Try to find the real UUID by scanning db.templates for the slug
      const tpl = await db.templates.get(template_id) // PK is text slug
        ?? await db.templates.filter(t => t.template_id === template_id).first();

      if (tpl?.id && isUUID(tpl.id)) {
        template_id = tpl.id;
        console.log(`✅ Resolved template_id slug → UUID: ${template_id}`);
        // Also fix in workEntries so future syncs don't need to resolve again
        await db.workEntries.update(queueItem.entity_local_id, { template_id });
      } else {
        throw new Error(
          `Cannot push work entry: template_id "${local.template_id}" is not a valid UUID ` +
          `and could not be resolved. Open the entry online to re-save with correct template.`
        );
      }
    }

    // Build payload with only Supabase-side columns
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

    // ── Push to Supabase ──────────────────────────────────────────────────
    console.log(`📤 Pushing work entry (localId: ${local.localId}, status: ${payload.status})...`);

    const { data, error } = await supabase
      .from('work_entries')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      // Log full Supabase error for DevTools diagnosis
      console.error('❌ Supabase insert failed:', {
        code:    error.code,
        message: error.message,
        details: error.details,
        hint:    error.hint,
        payload, // log payload so we can see what was sent
      });
      throw new Error(`Supabase error ${error.code}: ${error.message}`);
    }

    // ── Success: update local entry with remote ID ─────────────────────────
    await db.workEntries.update(queueItem.entity_local_id, {
      remoteId:    data.id,
      sync_status: SYNC_STATUS.SYNCED,
    });

    // Mark queue item done
    await db.syncQueue.update(queueItem.id, { sync_status: 'done' });

    console.log(`✅ Work entry pushed successfully → remoteId: ${data.id}`);
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

      if (contracts.length > 0) {
        await this._pullContractTemplates(contracts.map(c => c.id));
      }

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
        if (!activeOrgId) { return { orgId: null, mode: 'staff' }; }
        return { orgId: activeOrgId, mode: 'staff' };
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
      if (org) { await db.organizations.put(org); console.log(`📥 Org cached: ${org.name}`); }

      return data.organization_id;
    } catch (e) { console.warn('⚠️ _pullOrgMembership failed:', e.message); return null; }
  },

  async _pullContracts(orgId) {
    try {
      const COLS = 'id, project_id, contract_number, contract_name, contract_type, contract_category, reporting_frequency, requires_approval, status, organization_id, performing_org_id, contract_role, valid_from, valid_until, created_by, created_at, updated_at, deleted_at';
      const base = (q) => q.eq('status', 'active').is('deleted_at', null);

      const [rOwned, rPerforming] = await Promise.all([
        base(supabase.from('contracts').select(COLS).eq('organization_id', orgId)),
        base(supabase.from('contracts').select(COLS).eq('performing_org_id', orgId)),
      ]);

      const seen = new Set();
      const merged = [];
      for (const c of [...(rOwned.data || []), ...(rPerforming.data || [])]) {
        if (!seen.has(c.id)) { seen.add(c.id); merged.push(c); }
      }

      if (!merged.length) { console.log('📭 No active contracts for org:', orgId); return []; }

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
        .select(`
          id, contract_id, template_id, label, sort_order, is_default, assigned_at,
          template:templates (
            id, template_id, template_name, industry, contract_category, report_type,
            fields_schema, validation_rules, pdf_layout, version, is_locked, is_public,
            organization_id, created_at, updated_at
          )
        `)
        .in('contract_id', contractIds)
        .order('sort_order', { ascending: true });

      if (error) { console.warn('⚠️ _pullContractTemplates failed:', error.message); return; }
      if (!data?.length) { console.log('📭 No contract_templates for these contracts'); return; }

      await db.contractTemplates.where('contract_id').anyOf(contractIds).delete();

      const junctionRows = data.map(row => ({
        contract_id: row.contract_id,
        template_id: row.template_id,
        label:       row.label,
        sort_order:  row.sort_order,
        is_default:  row.is_default,
        assigned_at: row.assigned_at,
        template:    row.template,
      }));
      await db.contractTemplates.bulkAdd(junctionRows);

      const templates = data.map(r => r.template).filter(Boolean);
      const unique = [...new Map(templates.map(t => [t.template_id, t])).values()];
      if (unique.length) await db.templates.bulkPut(unique);

      console.log(`📥 ${junctionRows.length} junction rows + ${unique.length} templates cached`);
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
        .gte('entry_date', cutoffStr)
        .is('deleted_at', null)
        .order('entry_date', { ascending: false });

      q = mode === 'member' ? q.eq('created_by', userId) : q.eq('organization_id', orgId);

      const { data, error } = await q;
      if (error) { console.warn('⚠️ _pullWorkEntries error:', error.message); return; }
      if (!data?.length) { console.log('📭 No work entries to cache'); return; }

      for (const entry of data) {
        const existing = await db.workEntries.where('remoteId').equals(entry.id).first();
        if (existing?.sync_status === SYNC_STATUS.PENDING) continue;

        const record = { ...entry, remoteId: entry.id, sync_status: SYNC_STATUS.SYNCED };
        if (existing) await db.workEntries.update(existing.localId, record);
        else          await db.workEntries.add(record);
      }

      console.log(`📥 ${data.length} work entries cached/updated`);
    } catch (e) { console.warn('⚠️ _pullWorkEntries failed:', e.message); }
  },

  async pruneOldData() {
    try {
      const c30 = new Date(); c30.setDate(c30.getDate() - 30);
      const c7  = new Date(); c7.setDate(c7.getDate() - 7);
      const cut30 = c30.toISOString().split('T')[0];
      const cut7  = c7.toISOString().split('T')[0];

      const toDelete = await db.workEntries.filter(e => {
        if (e.sync_status === SYNC_STATUS.PENDING || e.sync_status === SYNC_STATUS.SYNCING) return false;
        if (e.status === 'approved' && e.entry_date < cut7)  return true;
        if (e.entry_date < cut30) return true;
        return false;
      }).primaryKeys();

      if (toDelete.length) {
        await db.workEntries.bulkDelete(toDelete);
        console.log(`🧹 Pruned ${toDelete.length} old entries`);
      }
      await db.syncQueue.where('sync_status').anyOf(['done', SYNC_STATUS.FAILED]).delete();
    } catch (e) { console.warn('⚠️ pruneOldData failed:', e.message); }
  },
};

export default syncService;
