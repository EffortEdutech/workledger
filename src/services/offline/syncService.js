/**
 * WorkLedger — Sync Service (Session 18 — Revised)
 *
 * A. PUSH  — Sends pending local mutations to Supabase
 * B. PULL  — Fetches fresh Supabase data into IndexedDB (SCOPED to user's data)
 * C. CONFLICT — Last-write-wins, server is final authority
 * D. PRUNE — Removes old entries to keep IndexedDB lean
 *
 * KEY DESIGN DECISIONS:
 *
 *   Pull is SCOPED, not global:
 *     - Only pulls contracts for user's own org
 *     - Only pulls templates for those specific contract categories
 *     - Only pulls own work entries, last 30 days, non-approved status
 *     This prevents each technician from caching the entire template library.
 *
 *   Memory ceiling per technician:
 *     Org + membership  ≈ 2KB
 *     Contracts (5-10)  ≈ 20KB
 *     Templates (2-3)   ≈ 150-450KB  (fields_schema JSONB is largest field)
 *     Work entries (60) ≈ 300KB      (30 days × 2/day, no photos)
 *     Sync queue        ≈ negligible
 *     Total ceiling     ≈ 0.5–1 MB   ✅ well within phone limits
 *
 * @module services/offline/syncService
 * @created March 4, 2026 — Session 18
 * @revised March 4, 2026 — Scoped pull + pruning
 *
 * File destination: src/services/offline/syncService.js
 */

import { db, SYNC_STATUS } from './db';
import { supabase } from '../supabase/client';

const MAX_RETRIES  = 3;
const ENTRY_WINDOW = 30; // days

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

  // ── A. PUSH ──────────────────────────────────────────────────────────────

  async pushPendingEntries() {
    try {
      const pendingItems = await db.syncQueue
        .where('sync_status').equals(SYNC_STATUS.PENDING)
        .toArray();

      if (pendingItems.length === 0) {
        console.log('📭 Nothing to push');
        return;
      }

      console.log(`📤 Pushing ${pendingItems.length} pending item(s)...`);
      for (const item of pendingItems) {
        await this._processQueueItem(item);
      }
    } catch (error) {
      console.error('❌ pushPendingEntries error:', error);
    }
  },

  async _processQueueItem(queueItem) {
    try {
      await db.syncQueue.update(queueItem.id, { sync_status: SYNC_STATUS.SYNCING });

      if (queueItem.entity_type === 'work_entry') {
        if (queueItem.action === 'create') await this._pushCreateWorkEntry(queueItem);
        else if (queueItem.action === 'update') await this._pushUpdateWorkEntry(queueItem);
      }
    } catch (error) {
      console.error(`❌ Queue item ${queueItem.id} failed:`, error.message);
      await this._handleQueueItemFailure(queueItem);
    }
  },

  async _handleQueueItemFailure(queueItem) {
    const newRetryCount = (queueItem.retry_count || 0) + 1;
    if (newRetryCount >= MAX_RETRIES) {
      await db.syncQueue.update(queueItem.id, {
        sync_status: SYNC_STATUS.FAILED,
        retry_count: newRetryCount,
      });
      console.warn(`⚠️ Queue item ${queueItem.id} permanently failed`);
    } else {
      await db.syncQueue.update(queueItem.id, {
        sync_status: SYNC_STATUS.PENDING,
        retry_count: newRetryCount,
      });
    }
  },

  async _pushCreateWorkEntry(queueItem) {
    const localEntry = await db.workEntries.get(queueItem.entity_local_id);
    if (!localEntry) { await db.syncQueue.update(queueItem.id, { sync_status: 'done' }); return; }
    if (localEntry.remoteId) { await db.syncQueue.update(queueItem.id, { sync_status: 'done' }); return; }

    // eslint-disable-next-line no-unused-vars
    const { localId, remoteId, sync_status, contract, template, ...payload } = localEntry;

    const { data: remoteData, error } = await supabase
      .from('work_entries').insert(payload).select().single();

    if (error) throw error;

    await db.workEntries.update(queueItem.entity_local_id, {
      remoteId: remoteData.id,
      sync_status: SYNC_STATUS.SYNCED,
    });
    await db.syncQueue.update(queueItem.id, { sync_status: 'done' });
    console.log(`✅ Pushed: local #${queueItem.entity_local_id} → remote ${remoteData.id}`);
  },

  async _pushUpdateWorkEntry(queueItem) {
    const localEntry = await db.workEntries.get(queueItem.entity_local_id);
    if (!localEntry) { await db.syncQueue.update(queueItem.id, { sync_status: 'done' }); return; }

    if (!localEntry.remoteId) {
      // Offline create + offline edit → convert to create
      await db.syncQueue.update(queueItem.id, {
        action: 'create', sync_status: SYNC_STATUS.PENDING, retry_count: 0,
      });
      return;
    }

    // eslint-disable-next-line no-unused-vars
    const { localId, remoteId, sync_status, contract, template, ...updates } = localEntry;

    const { error } = await supabase
      .from('work_entries').update(updates).eq('id', localEntry.remoteId);

    if (error) throw error;

    await db.workEntries.update(queueItem.entity_local_id, { sync_status: SYNC_STATUS.SYNCED });
    await db.syncQueue.update(queueItem.id, { sync_status: 'done' });
    console.log(`✅ Update pushed: remote ${localEntry.remoteId}`);
  },

  // ── B. PULL (SCOPED) ─────────────────────────────────────────────────────

  async pullFromSupabase() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.log('⏭️ Pull skipped — not authenticated');
        return;
      }

      console.log('📥 Starting scoped pull for user:', user.id);

      // Step 1: Pull org membership → get orgId
      const orgId = await this._pullOrgMembership(user.id);
      if (!orgId) {
        console.warn('⚠️ No org found for user — pull limited');
        return;
      }

      // Step 2: Pull active contracts for org → get categories
      const categories = await this._pullContracts(orgId);

      // Step 3: Pull templates scoped to those categories only
      if (categories.length > 0) {
        await this._pullTemplatesForCategories(categories);
      }

      // Step 4: Pull own work entries (30-day window, non-approved)
      await this._pullWorkEntries(user.id);

    } catch (error) {
      console.error('❌ pullFromSupabase error:', error);
    }
  },

  /**
   * Pull user's org membership. Returns organization_id.
   */
  async _pullOrgMembership(userId) {
    try {
      const { data, error } = await supabase
        .from('org_members')
        .select('organization_id, role')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error || !data) return null;

      // Cache the org record itself
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug, subscription_tier, settings')
        .eq('id', data.organization_id)
        .single();

      if (org) {
        await db.organizations.put(org);
        console.log(`📥 Org cached: ${org.name}`);
      }

      return data.organization_id;
    } catch (e) {
      console.warn('⚠️ _pullOrgMembership failed:', e.message);
      return null;
    }
  },

  /**
   * Pull active contracts for org. Returns unique contract categories.
   */
  async _pullContracts(orgId) {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('id, project_id, contract_number, contract_name, contract_type, contract_category, reporting_frequency, requires_approval, status, organization_id, performing_org_id, contract_role, valid_from, valid_until, created_by, created_at, updated_at, deleted_at')
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .is('deleted_at', null);

      if (error || !data?.length) return [];

      await db.contracts.bulkPut(data);
      console.log(`📥 ${data.length} contracts cached`);

      return [...new Set(data.map(c => c.contract_category).filter(Boolean))];
    } catch (e) {
      console.warn('⚠️ _pullContracts failed:', e.message);
      return [];
    }
  },

  /**
   * Pull templates ONLY for the discovered contract categories.
   * Avoids caching unused template types (saves 100-500KB per unused type).
   */
  async _pullTemplatesForCategories(categories) {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('id, template_id, template_name, industry, contract_category, report_type, fields_schema, validation_rules, pdf_layout, version, is_locked, is_public, organization_id, created_at, updated_at')
        .in('contract_category', categories)
        .is('deleted_at', null);

      if (error || !data?.length) return;

      await db.templates.bulkPut(data);
      console.log(`📥 ${data.length} templates cached (categories: ${categories.join(', ')})`);
    } catch (e) {
      console.warn('⚠️ _pullTemplatesForCategories failed:', e.message);
    }
  },

  /**
   * Pull own work entries — last 30 days, non-approved statuses only.
   * Server wins on conflict (newer updated_at overwrites local).
   */
  async _pullWorkEntries(userId) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - ENTRY_WINDOW);
      const cutoff = cutoffDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('work_entries')
        .select(`
          id, contract_id, template_id, entry_date, shift, data, status,
          organization_id, created_by, created_at, updated_at,
          submitted_at, submitted_by, approved_at, approved_by, approval_remarks,
          rejected_at, rejected_by, rejection_reason,
          contract:contracts (
            id, contract_number, contract_name, contract_category,
            project:projects ( id, project_name, client_name )
          ),
          template:templates ( id, template_name, contract_category )
        `)
        .eq('created_by', userId)
        .gte('entry_date', cutoff)
        .in('status', ['draft', 'submitted', 'rejected'])  // exclude approved
        .is('deleted_at', null)
        .order('entry_date', { ascending: false });

      if (error || !data?.length) {
        console.log(`📥 No work entries to pull (window: ${ENTRY_WINDOW} days)`);
        return;
      }

      for (const entry of data) {
        const existing = await db.workEntries.where('remoteId').equals(entry.id).first();
        const mapped   = { ...entry, remoteId: entry.id, sync_status: SYNC_STATUS.SYNCED };

        if (existing) {
          const serverIsNewer = !existing.updated_at
            || (entry.updated_at && entry.updated_at > existing.updated_at);
          if (serverIsNewer) await db.workEntries.update(existing.localId, mapped);
        } else {
          await db.workEntries.add(mapped);
        }
      }

      console.log(`📥 ${data.length} work entries cached (last ${ENTRY_WINDOW} days, non-approved)`);
    } catch (e) {
      console.warn('⚠️ _pullWorkEntries failed:', e.message);
    }
  },

  // ── D. PRUNE ─────────────────────────────────────────────────────────────

  async pruneOldData() {
    try {
      const cutoff30 = new Date();
      cutoff30.setDate(cutoff30.getDate() - 30);
      const cutoff30str = cutoff30.toISOString().split('T')[0];

      const cutoff7 = new Date();
      cutoff7.setDate(cutoff7.getDate() - 7);
      const cutoff7str = cutoff7.toISOString().split('T')[0];

      const toDelete = await db.workEntries
        .filter(entry => {
          // Never delete unsynced entries
          if (entry.sync_status === SYNC_STATUS.PENDING ||
              entry.sync_status === SYNC_STATUS.SYNCING) return false;
          // Approved: delete after 7 days (no offline action possible)
          if (entry.status === 'approved' && entry.entry_date < cutoff7str) return true;
          // Everything else: delete after 30 days
          return entry.entry_date < cutoff30str;
        })
        .primaryKeys();

      if (toDelete.length > 0) {
        await db.workEntries.bulkDelete(toDelete);
        console.log(`🧹 Pruned ${toDelete.length} old IndexedDB entries`);
      }

      // Clean completed sync queue items
      await db.syncQueue.where('sync_status').equals('done').delete();
    } catch (error) {
      console.warn('⚠️ pruneOldData (non-fatal):', error.message);
    }
  },

  // ── UTILITIES ────────────────────────────────────────────────────────────

  async getPendingCount() {
    try {
      return await db.syncQueue.where('sync_status').equals(SYNC_STATUS.PENDING).count();
    } catch { return 0; }
  },

  async getFailedCount() {
    try {
      return await db.syncQueue.where('sync_status').equals(SYNC_STATUS.FAILED).count();
    } catch { return 0; }
  },
};

export default syncService;
