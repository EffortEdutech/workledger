/**
 * WorkLedger — Offline Data Service
 *
 * Reads REFERENCE DATA from IndexedDB (Dexie) for use when offline.
 * This is the offline counterpart to contractService + templateService.
 *
 * USAGE in pages:
 *   import { offlineDataService } from '../services/offline/offlineDataService';
 *
 *   // Get contracts for NewWorkEntry dropdown
 *   const contracts = await offlineDataService.getContractsForOrg(orgId);
 *
 *   // Get template for form rendering
 *   const template = await offlineDataService.getTemplateById(templateId);
 *
 * NOTE: This service only READS. All writes go through workEntryService
 * (which handles both online push and offline queue).
 *
 * @module services/offline/offlineDataService
 * @created March 4, 2026 — Session 18
 *
 * File destination: src/services/offline/offlineDataService.js
 */

import { db } from './db';

export const offlineDataService = {

  // ── CONTRACTS ────────────────────────────────────────────────────────────

  /**
   * Get active contracts for an org from IndexedDB.
   * Used in NewWorkEntry contract picker when offline.
   *
   * @param {string} orgId - organization_id
   * @returns {Promise<Array>} Array of contract objects (may be empty if nothing cached)
   */
  async getContractsForOrg(orgId) {
    try {
      if (!orgId) return [];

      const contracts = await db.contracts
        .where('organization_id').equals(orgId)
        .toArray();

      // Filter active contracts (status field cached from Supabase)
      const active = contracts.filter(c =>
        c.status === 'active' && !c.deleted_at
      );

      console.log(`📱 offlineDataService: ${active.length} contracts for org ${orgId}`);
      return active;
    } catch (error) {
      console.error('❌ offlineDataService.getContractsForOrg:', error);
      return [];
    }
  },

  /**
   * Get a single contract by ID from IndexedDB.
   *
   * @param {string} contractId
   * @returns {Promise<Object|null>}
   */
  async getContractById(contractId) {
    try {
      const contract = await db.contracts.get(contractId);
      return contract || null;
    } catch (error) {
      console.error('❌ offlineDataService.getContractById:', error);
      return null;
    }
  },

  // ── TEMPLATES ────────────────────────────────────────────────────────────

  /**
   * Get a template by its UUID from IndexedDB.
   * Used in NewWorkEntry / WorkEntryDetail to render the form fields.
   *
   * @param {string} templateId - templates.id (UUID)
   * @returns {Promise<Object|null>}
   */
  async getTemplateById(templateId) {
    try {
      // Try by UUID primary key first
      let template = await db.templates.get(templateId);
      if (template) return template;

      // Fallback: try by template_id text key (some callers use the text slug)
      const results = await db.templates
        .where('template_id').equals(templateId)
        .toArray();
      return results[0] || null;
    } catch (error) {
      console.error('❌ offlineDataService.getTemplateById:', error);
      return null;
    }
  },

  /**
   * Get templates assigned to a specific contract.
   * Reads from db.templates where the category matches the contract's category.
   *
   * @param {string} contractCategory - e.g. 'preventive-maintenance'
   * @returns {Promise<Array>}
   */
  async getTemplatesForContractCategory(contractCategory) {
    try {
      if (!contractCategory) return [];

      const templates = await db.templates
        .where('contract_category').equals(contractCategory)
        .toArray();

      console.log(`📱 offlineDataService: ${templates.length} templates for category ${contractCategory}`);
      return templates;
    } catch (error) {
      console.error('❌ offlineDataService.getTemplatesForContractCategory:', error);
      return [];
    }
  },

  /**
   * Get all cached templates.
   * Fallback when category matching isn't possible.
   *
   * @returns {Promise<Array>}
   */
  async getAllTemplates() {
    try {
      return await db.templates.toArray();
    } catch (error) {
      console.error('❌ offlineDataService.getAllTemplates:', error);
      return [];
    }
  },

  // ── WORK ENTRIES (read from IndexedDB) ───────────────────────────────────

  /**
   * Get a single work entry from IndexedDB by its Supabase remote ID.
   * Used in WorkEntryDetail when offline.
   *
   * @param {string} remoteId - Supabase UUID (work_entries.id)
   * @returns {Promise<Object|null>}
   */
  async getWorkEntryByRemoteId(remoteId) {
    try {
      const entry = await db.workEntries.where('remoteId').equals(remoteId).first();
      return entry || null;
    } catch (error) {
      console.error('❌ offlineDataService.getWorkEntryByRemoteId:', error);
      return null;
    }
  },

  /**
   * Get work entries for offline list view.
   * Returns own entries in reverse-chronological order.
   *
   * @param {Object} filters - { contractId?, status?, startDate?, endDate? }
   * @returns {Promise<Array>}
   */
  async getWorkEntries(filters = {}) {
    try {
      let entries = await db.workEntries
        .orderBy('entry_date')
        .reverse()
        .toArray();

      if (filters.contractId) {
        entries = entries.filter(e => e.contract_id === filters.contractId);
      }
      if (filters.status) {
        entries = entries.filter(e => e.status === filters.status);
      }
      if (filters.startDate) {
        entries = entries.filter(e => e.entry_date >= filters.startDate);
      }
      if (filters.endDate) {
        entries = entries.filter(e => e.entry_date <= filters.endDate);
      }

      // Exclude deleted entries
      entries = entries.filter(e => !e.deleted_at);

      console.log(`📱 offlineDataService: ${entries.length} work entries from IndexedDB`);
      return entries;
    } catch (error) {
      console.error('❌ offlineDataService.getWorkEntries:', error);
      return [];
    }
  },

  // ── CACHE STATUS ─────────────────────────────────────────────────────────

  /**
   * Check how much data is cached — useful for debugging and showing
   * users what's available offline.
   *
   * @returns {Promise<Object>} counts of each cached table
   */
  async getCacheStatus() {
    try {
      const [
        contractCount,
        templateCount,
        workEntryCount,
        pendingCount,
      ] = await Promise.all([
        db.contracts.count(),
        db.templates.count(),
        db.workEntries.count(),
        db.syncQueue.where('sync_status').equals('pending').count(),
      ]);

      return {
        contracts:    contractCount,
        templates:    templateCount,
        workEntries:  workEntryCount,
        pendingSync:  pendingCount,
        hasCachedData: contractCount > 0 && templateCount > 0,
      };
    } catch (error) {
      return {
        contracts: 0, templates: 0, workEntries: 0,
        pendingSync: 0, hasCachedData: false,
      };
    }
  },

  // ── DATA PRUNING ──────────────────────────────────────────────────────────

  /**
   * Prune old work entries from IndexedDB.
   * Call this after every successful sync to keep IndexedDB lean.
   *
   * Rules:
   *   - Keep entries from the last 30 days
   *   - Keep all pending/syncing entries regardless of age
   *   - Delete approved entries older than 7 days (no offline action needed)
   *
   * @returns {Promise<number>} Number of entries pruned
   */
  async pruneOldEntries() {
    try {
      const cutoff30days = new Date();
      cutoff30days.setDate(cutoff30days.getDate() - 30);
      const cutoff30 = cutoff30days.toISOString().split('T')[0];

      const cutoff7days = new Date();
      cutoff7days.setDate(cutoff7days.getDate() - 7);
      const cutoff7 = cutoff7days.toISOString().split('T')[0];

      const toDelete = await db.workEntries
        .filter(entry => {
          // Never delete pending entries (not yet synced)
          if (entry.sync_status === 'pending' || entry.sync_status === 'syncing') {
            return false;
          }
          // Delete approved entries older than 7 days
          if (entry.status === 'approved' && entry.entry_date < cutoff7) {
            return true;
          }
          // Delete any other entries older than 30 days
          if (entry.entry_date < cutoff30) {
            return true;
          }
          return false;
        })
        .primaryKeys();

      if (toDelete.length > 0) {
        await db.workEntries.bulkDelete(toDelete);
        console.log(`🧹 Pruned ${toDelete.length} old entries from IndexedDB`);
      }

      // Also clean up done/failed sync queue entries
      await db.syncQueue.where('sync_status').anyOf(['done', 'failed']).delete();

      return toDelete.length;
    } catch (error) {
      console.error('❌ offlineDataService.pruneOldEntries:', error);
      return 0;
    }
  },
};

export default offlineDataService;
