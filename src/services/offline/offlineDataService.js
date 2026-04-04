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
 * SESSION 19 FIX — getContractsForOrg:
 *   Previously only queried by organization_id, which is the OWNER org.
 *   For performing orgs / subcontractors (e.g. FEST ENT), their contracts have:
 *     organization_id   = MTSB (owner)
 *     performing_org_id = FEST ENT (performer)
 *   Result: zero contracts returned for FEST ENT technicians offline.
 *
 *   Fix: query by BOTH organization_id AND performing_org_id, then deduplicate.
 *   This mirrors the dual-query logic in contractService.getUserContracts() and
 *   the fixed syncService._pullContracts().
 *
 * @module services/offline/offlineDataService
 * @created March 4, 2026 — Session 18
 * @revised April 4, 2026 — Session 19: performing_org_id contract lookup fix
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
   * SESSION 19 FIX: queries by BOTH organization_id (owner) AND
   * performing_org_id (performer) so subcontractor orgs get their contracts.
   *
   * @param {string} orgId - organization_id (current active org)
   * @returns {Promise<Array>} Array of contract objects (may be empty if nothing cached)
   */
  async getContractsForOrg(orgId) {
    try {
      if (!orgId) return [];

      // Query A: contracts the org OWNS (organization_id = orgId)
      const owned = await db.contracts
        .where('organization_id').equals(orgId)
        .toArray();

      // Query B: contracts the org PERFORMS (performing_org_id = orgId)
      // Dexie requires the field to be indexed — performing_org_id is NOT in the
      // current Dexie schema indexes, so we do a full table filter instead.
      // This is acceptable: the contracts table stays small (scoped pull = 30 days).
      const allContracts = await db.contracts.toArray();
      const performing = allContracts.filter(
        c => c.performing_org_id === orgId && c.organization_id !== orgId
      );

      // Merge and deduplicate by id
      const seen = new Set();
      const merged = [];
      for (const c of [...owned, ...performing]) {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          merged.push(c);
        }
      }

      // Filter: active, not deleted
      const active = merged.filter(c => c.status === 'active' && !c.deleted_at);

      console.log(
        `📱 offlineDataService: ${active.length} contracts for org ${orgId} ` +
        `(${owned.length} owned, ${performing.length} performing, after dedup + filter)`
      );
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
   * Get a template by its UUID or text slug from IndexedDB.
   * Used in NewWorkEntry / WorkEntryDetail to render the form fields.
   *
   * Tries UUID (Dexie auto-key 'id') first, then falls back to the text
   * slug index ('template_id') — handles both online (UUID) and offline
   * (slug) callers transparently.
   *
   * @param {string} templateId - templates.id (UUID) OR templates.template_id (text slug)
   * @returns {Promise<Object|null>}
   */
  async getTemplateById(templateId) {
    try {
      if (!templateId) return null;

      // The Dexie primary key for templates is 'template_id' (text slug).
      // Try that first (most common offline caller path).
      let template = await db.templates.get(templateId);
      if (template) return template;

      // Fallback: caller may have passed a UUID — search by the 'id' field
      // (not the Dexie PK, so requires a full filter scan)
      const byUuid = await db.templates.filter(t => t.id === templateId).first();
      if (byUuid) return byUuid;

      console.warn('⚠️ offlineDataService.getTemplateById: not found:', templateId);
      return null;
    } catch (error) {
      console.error('❌ offlineDataService.getTemplateById:', error);
      return null;
    }
  },

  /**
   * Get templates assigned to a specific contract.
   * Reads from db.templates where the category matches the contract's category.
   *
   * The returned templates include their full fields_schema — DynamicForm
   * renders all field types (text, select, radio, checkbox, etc.) from this
   * schema, so all form dropdowns work offline once the template is cached.
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
        contracts:     contractCount,
        templates:     templateCount,
        workEntries:   workEntryCount,
        pendingSync:   pendingCount,
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
          if (entry.sync_status === 'pending' || entry.sync_status === 'syncing') {
            return false;
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

      await db.syncQueue.where('sync_status').anyOf(['done', 'failed']).delete();

      return toDelete.length;
    } catch (error) {
      console.error('❌ offlineDataService.pruneOldEntries:', error);
      return 0;
    }
  },
};

export default offlineDataService;
