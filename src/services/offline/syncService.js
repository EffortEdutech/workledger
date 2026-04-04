/**
 * WorkLedger — Sync Service
 *
 * SESSION 19 FIXES:
 *   Fix A — _pullContracts fetches owned AND performing contracts
 *   Fix B — _pullContractTemplates replaces category-based template pull
 *            (category slug mismatch: 'preventive-maintenance' vs 'PMC')
 *            New: queries contract_templates junction WITH full fields_schema
 *            Stores junction rows in db.contractTemplates (Dexie v2)
 *
 * @module services/offline/syncService
 * File destination: src/services/offline/syncService.js
 */

import { db, SYNC_STATUS } from './db';
import { supabase } from '../supabase/client';

const MAX_RETRIES  = 3;
const ENTRY_WINDOW = 30;

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
    } catch (e) { console.error('❌ pushPendingEntries failed:', e); }
  },

  async _pushSingleItem(queueItem) {
    try {
      await db.syncQueue.update(queueItem.id, { sync_status: SYNC_STATUS.SYNCING });
      if (queueItem.entity_type === 'work_entry') await this._pushWorkEntry(queueItem);
    } catch (e) {
      console.error(`❌ push failed (queue id ${queueItem.id}):`, e);
      const retries = (queueItem.retry_count || 0) + 1;
      await db.syncQueue.update(queueItem.id, {
        sync_status: retries >= MAX_RETRIES ? SYNC_STATUS.FAILED : SYNC_STATUS.PENDING,
        retry_count: retries,
      });
    }
  },

  async _pushWorkEntry(queueItem) {
    const local = await db.workEntries.get(queueItem.entity_local_id);
    if (!local) { await db.syncQueue.delete(queueItem.id); return; }

    const { localId, remoteId, sync_status, ...payload } = local;

    const { data, error } = await supabase
      .from('work_entries').insert(payload).select('id').single();

    if (error) throw new Error(error.message);

    await db.workEntries.update(queueItem.entity_local_id, {
      remoteId: data.id, sync_status: SYNC_STATUS.SYNCED,
    });
    await db.syncQueue.update(queueItem.id, { sync_status: 'done' });
    console.log(`✅ Work entry pushed → remoteId: ${data.id}`);
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
    } catch (e) { console.error('❌ pullFromSupabase failed:', e); }
  },

  async _resolveUserContext(userId) {
    try {
      const { data: profile } = await supabase
        .from('user_profiles').select('global_role').eq('id', userId).single();

      const isStaff = ['super_admin', 'bina_jaya_staff'].includes(profile?.global_role);

      if (isStaff) {
        const activeOrgId = localStorage.getItem('wl_active_org_id');
        if (!activeOrgId) { console.warn('⚠️ BJ Staff: no active org in localStorage'); return { orgId: null, mode: 'staff' }; }
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

  // ─────────────────────────────────────────────────────────────────────────
  // _pullContracts — FIX A
  // Fetches both owned (organization_id) and performing (performing_org_id)
  // ─────────────────────────────────────────────────────────────────────────
  async _pullContracts(orgId) {
    try {
      const COLS = 'id, project_id, contract_number, contract_name, contract_type, contract_category, reporting_frequency, requires_approval, status, organization_id, performing_org_id, contract_role, valid_from, valid_until, created_by, created_at, updated_at, deleted_at';
      const base = (q) => q.eq('status', 'active').is('deleted_at', null);

      const [rOwned, rPerforming] = await Promise.all([
        base(supabase.from('contracts').select(COLS).eq('organization_id', orgId)),
        base(supabase.from('contracts').select(COLS).eq('performing_org_id', orgId)),
      ]);

      if (rOwned.error)      console.warn('⚠️ owned contracts:', rOwned.error.message);
      if (rPerforming.error) console.warn('⚠️ performing contracts:', rPerforming.error.message);

      const seen = new Set();
      const merged = [];
      for (const c of [...(rOwned.data || []), ...(rPerforming.data || [])]) {
        if (!seen.has(c.id)) { seen.add(c.id); merged.push(c); }
      }

      if (!merged.length) { console.log('📭 No active contracts for org:', orgId); return []; }

      await db.contracts.bulkPut(merged);
      console.log(`📥 ${merged.length} contracts cached (${rOwned.data?.length || 0} owned + ${rPerforming.data?.length || 0} performing)`);
      return merged;
    } catch (e) { console.warn('⚠️ _pullContracts failed:', e.message); return []; }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // _pullContractTemplates — FIX B
  //
  // Replaces the old _pullTemplatesForCategories which failed because:
  //   contracts.contract_category = 'preventive-maintenance' (DB slug)
  //   templates.contract_category = 'PMC' (abbreviation)
  //   → category filter returned zero rows → "template not found" offline
  //
  // New approach: query contract_templates junction directly by contract UUID.
  // Includes the full template (with fields_schema) via PostgREST join.
  //
  // Stores:
  //   db.contractTemplates — junction rows mapping contract_id → template UUID
  //   db.templates         — full template objects (PK = template_id text slug)
  // ─────────────────────────────────────────────────────────────────────────
  async _pullContractTemplates(contractIds) {
    try {
      if (!contractIds.length) return;

      const { data, error } = await supabase
        .from('contract_templates')
        .select(`
          id,
          contract_id,
          template_id,
          label,
          sort_order,
          is_default,
          assigned_at,
          template:templates (
            id,
            template_id,
            template_name,
            industry,
            contract_category,
            report_type,
            fields_schema,
            validation_rules,
            pdf_layout,
            version,
            is_locked,
            is_public,
            organization_id,
            created_at,
            updated_at
          )
        `)
        .in('contract_id', contractIds)
        .order('sort_order', { ascending: true });

      if (error) { console.warn('⚠️ _pullContractTemplates failed:', error.message); return; }
      if (!data?.length) { console.log('📭 No contract_templates for these contracts'); return; }

      // Clear stale junction rows for these contracts
      await db.contractTemplates.where('contract_id').anyOf(contractIds).delete();

      // Store junction rows with full template inline
      const junctionRows = data.map(row => ({
        contract_id: row.contract_id,
        template_id: row.template_id,   // UUID — FK to templates.id
        label:       row.label,
        sort_order:  row.sort_order,
        is_default:  row.is_default,
        assigned_at: row.assigned_at,
        template:    row.template,       // full template object including fields_schema
      }));
      await db.contractTemplates.bulkAdd(junctionRows);

      // Also store templates by their text-slug PK (for getTemplateById fallback)
      const templates = data.map(r => r.template).filter(Boolean);
      const unique = [...new Map(templates.map(t => [t.template_id, t])).values()];
      if (unique.length) await db.templates.bulkPut(unique);

      console.log(`📥 ${junctionRows.length} junction rows + ${unique.length} templates cached (with fields_schema)`);
    } catch (e) { console.warn('⚠️ _pullContractTemplates failed:', e.message); }
  },

  // ── WORK ENTRIES ──────────────────────────────────────────────────────────

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
        if (existing?.sync_status === SYNC_STATUS.PENDING) continue; // don't overwrite pending local

        const record = { ...entry, remoteId: entry.id, sync_status: SYNC_STATUS.SYNCED };
        if (existing) await db.workEntries.update(existing.localId, record);
        else          await db.workEntries.add(record);
      }

      console.log(`📥 ${data.length} work entries cached/updated`);
    } catch (e) { console.warn('⚠️ _pullWorkEntries failed:', e.message); }
  },

  // ── PRUNE ─────────────────────────────────────────────────────────────────

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
