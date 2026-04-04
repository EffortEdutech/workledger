/**
 * WorkLedger — Sync Service (Session 18 — BJ Staff Active-Org Aware)
 *
 * A. PUSH  — Sends pending local mutations to Supabase
 * B. PULL  — Fetches fresh Supabase data into IndexedDB
 * C. CONFLICT — Last-write-wins, server is final authority
 * D. PRUNE — Removes old entries to keep IndexedDB lean
 *
 * KEY DESIGN DECISIONS:
 *
 *   Regular users / technicians:
 *     - Pull org via org_members
 *     - Pull own work entries only
 *
 *   BJ Staff / Super Admin:
 *     - Pull org via localStorage active org: wl_active_org_id
 *     - Pull work entries for the ACTIVE org (not all orgs)
 *     - Keeps offline cache aligned with the org switcher
 *
 * SESSION 19 FIX — _pullContracts now fetches BOTH:
 *   A. Contracts the org OWNS      (organization_id = orgId)
 *   B. Contracts the org PERFORMS  (performing_org_id = orgId)
 *
 *   Before this fix, FEST ENT technicians saw zero contracts offline because
 *   all their contracts have organization_id = MTSB (the owner), with
 *   performing_org_id = FEST ENT. The sync was caching zero rows for them.
 *
 * @module services/offline/syncService
 * @created March 4, 2026 — Session 18
 * @revised March 4, 2026 — Active-org-aware staff sync
 * @revised April 4, 2026 — Session 19: performing_org_id contract pull fix
 *
 * File destination: src/services/offline/syncService.js
 */

import { db, SYNC_STATUS } from './db';
import { supabase } from '../supabase/client';

const MAX_RETRIES = 3;
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

  async pushPendingEntries() {
    try {
      const pendingItems = await db.syncQueue
        .where('sync_status')
        .equals(SYNC_STATUS.PENDING)
        .toArray();

      if (pendingItems.length === 0) {
        console.log('📭 Nothing to push');
        return;
      }

      console.log(`📤 Pushing ${pendingItems.length} pending item(s)...`);
      for (const item of pendingItems) {
        await this._pushSingleItem(item);
      }
    } catch (error) {
      console.error('❌ pushPendingEntries failed:', error);
    }
  },

  async _pushSingleItem(queueItem) {
    try {
      // Mark as syncing
      await db.syncQueue.update(queueItem.id, { sync_status: SYNC_STATUS.SYNCING });

      if (queueItem.entity_type === 'work_entry') {
        await this._pushWorkEntry(queueItem);
      }
      // Future: attachments, etc.

    } catch (error) {
      console.error(`❌ _pushSingleItem failed for queue id ${queueItem.id}:`, error);

      const retryCount = (queueItem.retry_count || 0) + 1;
      if (retryCount >= MAX_RETRIES) {
        await db.syncQueue.update(queueItem.id, {
          sync_status: SYNC_STATUS.FAILED,
          retry_count: retryCount,
        });
      } else {
        await db.syncQueue.update(queueItem.id, {
          sync_status: SYNC_STATUS.PENDING,
          retry_count: retryCount,
        });
      }
    }
  },

  async _pushWorkEntry(queueItem) {
    const localEntry = await db.workEntries.get(queueItem.entity_local_id);
    if (!localEntry) {
      // Entry deleted locally — remove from queue
      await db.syncQueue.delete(queueItem.id);
      return;
    }

    // Build payload for Supabase — strip local-only fields
    const { localId, remoteId, sync_status, ...payload } = localEntry;

    const { data, error } = await supabase
      .from('work_entries')
      .insert(payload)
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    // Success — update local entry with remoteId and mark synced
    await db.workEntries.update(queueItem.entity_local_id, {
      remoteId:    data.id,
      sync_status: SYNC_STATUS.SYNCED,
    });

    // Mark queue item as done
    await db.syncQueue.update(queueItem.id, { sync_status: 'done' });
    console.log(`✅ Work entry pushed (remoteId: ${data.id})`);
  },

  async pullFromSupabase() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { orgId, mode } = await this._resolveUserContext(user.id);
      if (!orgId) {
        console.warn('⚠️ Cannot pull — no orgId resolved');
        return;
      }

      console.log(`📥 Pulling data for org ${orgId} (mode: ${mode})`);

      // Step 1: contracts → returns categories found
      const categories = await this._pullContracts(orgId);

      // Step 2: templates for those categories
      if (categories.length > 0) {
        await this._pullTemplatesForCategories(categories);
      }

      // Step 3: user's own work entries (last ENTRY_WINDOW days)
      await this._pullWorkEntries(user.id, orgId, mode);

    } catch (error) {
      console.error('❌ pullFromSupabase failed:', error);
    }
  },

  async _resolveUserContext(userId) {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('global_role')
        .eq('id', userId)
        .single();

      const isStaff = profile?.global_role === 'super_admin'
        || profile?.global_role === 'bina_jaya_staff';

      if (isStaff) {
        // BJ Staff: use the active org from localStorage (org switcher)
        const activeOrgId = localStorage.getItem('wl_active_org_id');
        if (!activeOrgId) {
          console.warn('⚠️ BJ Staff: no active org set in localStorage');
          return { orgId: null, mode: 'staff', globalRole: profile?.global_role };
        }
        return { orgId: activeOrgId, mode: 'staff', globalRole: profile?.global_role };
      }

      const orgId = await this._pullOrgMembership(userId);
      return { orgId, mode: 'member', globalRole: profile?.global_role ?? null };

    } catch (e) {
      console.warn('⚠️ _resolveUserContext failed:', e.message);
      return { orgId: null, mode: 'member', globalRole: null };
    }
  },

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

  // ─────────────────────────────────────────────────────────────────────────
  // _pullContracts — SESSION 19 FIX
  //
  // Previous version only fetched contracts where organization_id = orgId.
  // This meant FEST ENT (a performing org / subcontractor) never got their
  // contracts cached because those contracts have:
  //   organization_id   = MTSB (owner)
  //   performing_org_id = FEST ENT (performer)
  //
  // Fix: run two queries in parallel —
  //   Query A: contracts the org OWNS      (organization_id = orgId)
  //   Query B: contracts the org PERFORMS  (performing_org_id = orgId)
  // Merge + deduplicate, then bulkPut the union into IndexedDB.
  //
  // @param {string} orgId
  // @returns {string[]} Unique contract categories found (for template pull)
  // ─────────────────────────────────────────────────────────────────────────
  async _pullContracts(orgId) {
    try {
      const SELECT_COLS =
        'id, project_id, contract_number, contract_name, contract_type, ' +
        'contract_category, reporting_frequency, requires_approval, status, ' +
        'organization_id, performing_org_id, contract_role, ' +
        'valid_from, valid_until, created_by, created_at, updated_at, deleted_at';

      const baseFilter = (q) =>
        q.eq('status', 'active').is('deleted_at', null);

      // Run both queries in parallel
      const [resultOwned, resultPerforming] = await Promise.all([
        baseFilter(
          supabase.from('contracts').select(SELECT_COLS).eq('organization_id', orgId)
        ),
        baseFilter(
          supabase.from('contracts').select(SELECT_COLS).eq('performing_org_id', orgId)
        ),
      ]);

      const owned     = resultOwned.data     || [];
      const performing = resultPerforming.data || [];

      if (resultOwned.error) {
        console.warn('⚠️ _pullContracts owned query error:', resultOwned.error.message);
      }
      if (resultPerforming.error) {
        console.warn('⚠️ _pullContracts performing query error:', resultPerforming.error.message);
      }

      // Deduplicate by id (a contract could appear in both if org is both owner + performer)
      const seen = new Set();
      const merged = [];
      for (const c of [...owned, ...performing]) {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          merged.push(c);
        }
      }

      if (merged.length === 0) {
        console.log('📭 No active contracts to cache for org:', orgId);
        return [];
      }

      await db.contracts.bulkPut(merged);
      console.log(
        `📥 ${merged.length} contracts cached ` +
        `(${owned.length} owned + ${performing.length} performing, after dedup)`
      );

      // Return unique categories so caller can pull matching templates
      return [...new Set(merged.map((c) => c.contract_category).filter(Boolean))];

    } catch (e) {
      console.warn('⚠️ _pullContracts failed:', e.message);
      return [];
    }
  },

  async _pullTemplatesForCategories(categories) {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select(
          'id, template_id, template_name, industry, contract_category, report_type, ' +
          'fields_schema, validation_rules, pdf_layout, version, is_locked, is_public, ' +
          'organization_id, created_at, updated_at'
        )
        .in('contract_category', categories)
        .is('deleted_at', null);

      if (error || !data?.length) return;

      await db.templates.bulkPut(data);
      console.log(
        `📥 ${data.length} templates cached (categories: ${categories.join(', ')})`
      );
    } catch (e) {
      console.warn('⚠️ _pullTemplatesForCategories failed:', e.message);
    }
  },

  async _pullWorkEntries(userId, orgId, mode = 'member') {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - ENTRY_WINDOW);
      const cutoff = cutoffDate.toISOString().split('T')[0];

      let query = supabase
        .from('work_entries')
        .select(`
          id, contract_id, template_id, entry_date, shift, data, status,
          organization_id, created_by, created_at, updated_at,
          submitted_at, submitted_by, approved_at, approved_by, approval_remarks,
          rejected_at, rejected_by, rejection_reason
        `)
        .gte('entry_date', cutoff)
        .is('deleted_at', null)
        .order('entry_date', { ascending: false });

      // Technicians / members: only their own entries
      if (mode === 'member') {
        query = query.eq('created_by', userId);
      } else {
        // BJ Staff: all entries for the active org
        query = query.eq('organization_id', orgId);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('⚠️ _pullWorkEntries query error:', error.message);
        return;
      }

      if (!data?.length) {
        console.log('📭 No work entries to cache');
        return;
      }

      // Upsert into IndexedDB by remoteId
      // For entries that already exist locally (pending sync), don't overwrite
      for (const entry of data) {
        const existing = await db.workEntries.where('remoteId').equals(entry.id).first();

        if (existing && existing.sync_status === SYNC_STATUS.PENDING) {
          // Local version is pending push — server version is older, keep local
          console.log(`⏭️  Skipping server overwrite for pending entry: ${entry.id}`);
          continue;
        }

        if (existing) {
          await db.workEntries.update(existing.localId, {
            ...entry,
            remoteId:    entry.id,
            sync_status: SYNC_STATUS.SYNCED,
          });
        } else {
          await db.workEntries.add({
            ...entry,
            remoteId:    entry.id,
            sync_status: SYNC_STATUS.SYNCED,
          });
        }
      }

      console.log(`📥 ${data.length} work entries cached/updated`);

    } catch (e) {
      console.warn('⚠️ _pullWorkEntries failed:', e.message);
    }
  },

  async pruneOldData() {
    try {
      const cutoff30days = new Date();
      cutoff30days.setDate(cutoff30days.getDate() - 30);
      const cutoff30 = cutoff30days.toISOString().split('T')[0];

      const cutoff7days = new Date();
      cutoff7days.setDate(cutoff7days.getDate() - 7);
      const cutoff7 = cutoff7days.toISOString().split('T')[0];

      const toDelete = await db.workEntries
        .filter(entry => {
          if (entry.sync_status === SYNC_STATUS.PENDING || entry.sync_status === SYNC_STATUS.SYNCING) {
            return false; // Never prune pending entries
          }
          if (entry.status === 'approved' && entry.entry_date < cutoff7) return true;
          if (entry.entry_date < cutoff30) return true;
          return false;
        })
        .primaryKeys();

      if (toDelete.length > 0) {
        await db.workEntries.bulkDelete(toDelete);
        console.log(`🧹 Pruned ${toDelete.length} old entries from IndexedDB`);
      }

      // Clean up completed/failed sync queue items
      await db.syncQueue.where('sync_status').anyOf(['done', SYNC_STATUS.FAILED]).delete();

    } catch (e) {
      console.warn('⚠️ pruneOldData failed:', e.message);
    }
  },

  async getPendingCount() {
    try {
      return await db.syncQueue.where('sync_status').equals(SYNC_STATUS.PENDING).count();
    } catch {
      return 0;
    }
  },
};

export default syncService;
