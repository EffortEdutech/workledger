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
 * @module services/offline/syncService
 * @created March 4, 2026 — Session 18
 * @revised March 4, 2026 — Active-org-aware staff sync
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
        await this._processQueueItem(item);
      }
    } catch (error) {
      console.error('❌ pushPendingEntries error:', error);
    }
  },

  async _processQueueItem(queueItem) {
    try {
      await db.syncQueue.update(queueItem.id, {
        sync_status: SYNC_STATUS.SYNCING,
      });

      if (queueItem.entity_type === 'work_entry') {
        if (queueItem.action === 'create') {
          await this._pushCreateWorkEntry(queueItem);
        } else if (queueItem.action === 'update') {
          await this._pushUpdateWorkEntry(queueItem);
        }
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

    if (!localEntry) {
      await db.syncQueue.update(queueItem.id, { sync_status: 'done' });
      return;
    }

    if (localEntry.remoteId) {
      await db.syncQueue.update(queueItem.id, { sync_status: 'done' });
      return;
    }

    // eslint-disable-next-line no-unused-vars
    const { localId, remoteId, sync_status, contract, template, ...payload } = localEntry;

    const { data: remoteData, error } = await supabase
      .from('work_entries')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    await db.workEntries.update(queueItem.entity_local_id, {
      remoteId: remoteData.id,
      sync_status: SYNC_STATUS.SYNCED,
    });

    await db.syncQueue.update(queueItem.id, { sync_status: 'done' });

    console.log(
      `✅ Pushed: local #${queueItem.entity_local_id} → remote ${remoteData.id}`
    );
  },

  async _pushUpdateWorkEntry(queueItem) {
    const localEntry = await db.workEntries.get(queueItem.entity_local_id);

    if (!localEntry) {
      await db.syncQueue.update(queueItem.id, { sync_status: 'done' });
      return;
    }

    if (!localEntry.remoteId) {
      await db.syncQueue.update(queueItem.id, {
        action: 'create',
        sync_status: SYNC_STATUS.PENDING,
        retry_count: 0,
      });
      return;
    }

    // eslint-disable-next-line no-unused-vars
    const { localId, remoteId, sync_status, contract, template, ...updates } = localEntry;

    const { error } = await supabase
      .from('work_entries')
      .update(updates)
      .eq('id', localEntry.remoteId);

    if (error) throw error;

    await db.workEntries.update(queueItem.entity_local_id, {
      sync_status: SYNC_STATUS.SYNCED,
    });

    await db.syncQueue.update(queueItem.id, { sync_status: 'done' });

    console.log(`✅ Update pushed: remote ${localEntry.remoteId}`);
  },

  async pullFromSupabase() {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.log('⏭️ Pull skipped — not authenticated');
        return;
      }

      console.log('📥 Starting scoped pull for user:', user.id);

      const scope = await this._resolveSyncScope(user.id);

      if (!scope?.orgId) {
        console.warn('⚠️ No sync org scope resolved');
        return;
      }

      console.log(
        `📌 Sync scope resolved → mode: ${scope.mode}, orgId: ${scope.orgId}`
      );

      const categories = await this._pullContracts(scope.orgId);

      if (categories.length > 0) {
        await this._pullTemplatesForCategories(categories);
      }

      await this._pullWorkEntries(user.id, scope.orgId, scope.mode);
    } catch (error) {
      console.error('❌ pullFromSupabase error:', error);
    }
  },

  async _resolveSyncScope(userId) {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, global_role')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const isBjStaff =
      profile?.global_role === 'super_admin' ||
      profile?.global_role === 'bina_jaya_staff';

    if (isBjStaff) {
      const activeOrgId = localStorage.getItem('wl_active_org_id');

      if (!activeOrgId) {
        return {
          orgId: null,
          mode: 'staff',
          globalRole: profile?.global_role ?? null,
        };
      }

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, slug, subscription_tier, settings')
        .eq('id', activeOrgId)
        .single();

      if (orgError) {
        console.warn('⚠️ Could not load active org for BJ staff:', orgError.message);
      }

      if (org) {
        await db.organizations.put(org);
        console.log(`📥 Active org cached for BJ staff: ${org.name}`);
      }

      return {
        orgId: activeOrgId,
        mode: 'staff',
        globalRole: profile?.global_role ?? null,
      };
    }

    const orgId = await this._pullOrgMembership(userId);

    return {
      orgId,
      mode: 'member',
      globalRole: profile?.global_role ?? null,
    };
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

  async _pullContracts(orgId) {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(
          'id, project_id, contract_number, contract_name, contract_type, contract_category, reporting_frequency, requires_approval, status, organization_id, performing_org_id, contract_role, valid_from, valid_until, created_by, created_at, updated_at, deleted_at'
        )
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .is('deleted_at', null);

      if (error || !data?.length) return [];

      await db.contracts.bulkPut(data);
      console.log(`📥 ${data.length} contracts cached`);

      return [...new Set(data.map((c) => c.contract_category).filter(Boolean))];
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
          'id, template_id, template_name, industry, contract_category, report_type, fields_schema, validation_rules, pdf_layout, version, is_locked, is_public, organization_id, created_at, updated_at'
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
          rejected_at, rejected_by, rejection_reason,
          contract:contracts (
            id, contract_number, contract_name, contract_category,
            project:projects ( id, project_name, client_name )
          ),
          template:templates ( id, template_name, contract_category )
        `)
        .gte('entry_date', cutoff)
        .in('status', ['draft', 'submitted', 'rejected'])
        .is('deleted_at', null)
        .order('entry_date', { ascending: false });

      if (mode === 'staff') {
        query = query.eq('organization_id', orgId);
      } else {
        query = query.eq('created_by', userId);
      }

      const { data, error } = await query;

      if (error || !data?.length) {
        console.log(`📥 No work entries to pull (window: ${ENTRY_WINDOW} days)`);
        return;
      }

      for (const entry of data) {
        const existing = await db.workEntries
          .where('remoteId')
          .equals(entry.id)
          .first();

        const mapped = {
          ...entry,
          remoteId: entry.id,
          sync_status: SYNC_STATUS.SYNCED,
        };

        if (existing) {
          const serverIsNewer =
            !existing.updated_at ||
            (entry.updated_at && entry.updated_at > existing.updated_at);

          if (serverIsNewer) {
            await db.workEntries.update(existing.localId, mapped);
          }
        } else {
          await db.workEntries.add(mapped);
        }
      }

      console.log(
        `📥 ${data.length} work entries cached (${mode} mode, last ${ENTRY_WINDOW} days, non-approved)`
      );
    } catch (e) {
      console.warn('⚠️ _pullWorkEntries failed:', e.message);
    }
  },

  async pruneOldData() {
    try {
      const cutoff30 = new Date();
      cutoff30.setDate(cutoff30.getDate() - 30);
      const cutoff30str = cutoff30.toISOString().split('T')[0];

      const cutoff7 = new Date();
      cutoff7.setDate(cutoff7.getDate() - 7);
      const cutoff7str = cutoff7.toISOString().split('T')[0];

      const toDelete = await db.workEntries
        .filter((entry) => {
          if (
            entry.sync_status === SYNC_STATUS.PENDING ||
            entry.sync_status === SYNC_STATUS.SYNCING
          ) {
            return false;
          }

          if (entry.status === 'approved' && entry.entry_date < cutoff7str) {
            return true;
          }

          return entry.entry_date < cutoff30str;
        })
        .primaryKeys();

      if (toDelete.length > 0) {
        await db.workEntries.bulkDelete(toDelete);
        console.log(`🧹 Pruned ${toDelete.length} old IndexedDB entries`);
      }

      await db.syncQueue.where('sync_status').equals('done').delete();
    } catch (error) {
      console.warn('⚠️ pruneOldData (non-fatal):', error.message);
    }
  },

  async getPendingCount() {
    try {
      return await db.syncQueue
        .where('sync_status')
        .equals(SYNC_STATUS.PENDING)
        .count();
    } catch {
      return 0;
    }
  },

  async getFailedCount() {
    try {
      return await db.syncQueue
        .where('sync_status')
        .equals(SYNC_STATUS.FAILED)
        .count();
    } catch {
      return 0;
    }
  },
};

export default syncService;
