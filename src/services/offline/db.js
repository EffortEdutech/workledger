/**
 * WorkLedger — IndexedDB Schema (Dexie.js)
 * @module services/offline/db
 * @created March 4, 2026 — Session 18
 *
 * VERSIONING RULE (CRITICAL):
 * Never modify an existing version's schema.
 * Always bump the version number and add a migration.
 *
 * File destination: src/services/offline/db.js
 */

import Dexie from 'dexie';

export const db = new Dexie('WorkLedgerDB');

db.version(1).stores({
  // Reference data — cached on login/reconnect, read-only offline
  organizations: 'id, updated_at',
  projects:      'id, organization_id, updated_at',
  contracts:     'id, project_id, organization_id, updated_at',
  templates:     'template_id, contract_category, updated_at',

  // Main offline storage — all creates/updates go here first
  // ++localId = auto-increment integer offline PK (never shown to user)
  // remoteId  = Supabase UUID (null until synced)
  workEntries: '++localId, remoteId, contract_id, template_id, organization_id, created_by, entry_date, status, sync_status, created_at',

  // Attachments stored as base64 (avoids Safari IndexedDB blob issues)
  attachments: '++localId, remoteId, entry_local_id, entry_remote_id, field_id, attachment_type, sync_status, created_at',

  // Sync queue — every pending mutation goes here
  syncQueue: '++id, entity_type, entity_local_id, action, sync_status, retry_count, created_at',
});

export const SYNC_STATUS = {
  PENDING:  'pending',
  SYNCING:  'syncing',
  SYNCED:   'synced',
  FAILED:   'failed',
};

export default db;
