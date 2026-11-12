/**
 * WLE-E00: In-memory fixture-only domain mock. No HTTP, DB, Supabase or QS credentials.
 * Design target: WLE-P1B 1.0.0-rc1, not a substitute for server-side RLS or real QS verification.
 * This module must never be imported by the production WorkLedger application.
 */
import { createHash, randomUUID } from 'node:crypto';

export const CONTRACT_VERSION = '1.0.0-rc1';
const hex64 = /^[a-f0-9]{64}$/;
export class DomainError extends Error {
  constructor(code, detail = code) { super(detail); this.name = 'DomainError'; this.code = code; }
}
const fail = (code) => { throw new DomainError(code); };
const canonical = (obj) => Array.isArray(obj) ? obj.map(canonical) : obj && typeof obj === 'object' ? Object.fromEntries(Object.keys(obj).sort().map(k=>[k,canonical(obj[k])])) : obj;
const digest = (obj) => createHash('sha256').update(JSON.stringify(canonical(obj))).digest('hex');
const copy = (obj) => structuredClone(obj);
const invariant = (okay, code) => { if (!okay) fail(code); };

export class MockEnterprise {
  constructor({ now = () => new Date('2026-11-12T10:00:00Z').toISOString() } = {}) {
    this.now = now;
    this.contracts = new Map();
    this.appointments = new Map();
    this.crosswalk = new Map();
    this.diaries = new Map();
    this.imports = new Map();
    this.activeBaselines = new Map();
    this.audit = [];
    this.idempotency = new Map();
  }

  // SEEDING HELPERS: test setup only, never exposed as application commands.
  seedContract({ organization_id, project_id, contract_id, boq_version_id, boq_source_sha256 }) {
    invariant(hex64.test(boq_source_sha256), 'invalid_boq_hash');
    invariant(!this.contracts.has(contract_id), 'duplicate_contract');
    this.contracts.set(contract_id, { organization_id, project_id, contract_id, boq_version_id, boq_source_sha256 });
  }
  seedAppointment(appointment) {
    invariant(appointment.appointment_id && appointment.appointee_user_id, 'invalid_appointment');
    this.appointments.set(appointment.appointment_id, copy(appointment));
  }
  revokeAppointment(appointmentId) {
    const ap = this.appointments.get(appointmentId);
    invariant(ap, 'not_found');
    ap.status = 'revoked';
  }
  seedExternalReference(ref) {
    invariant(ref.source_system === 'qs-service' && ref.source_instance && ref.source_revision, 'invalid_reference');
    const key = this._externalKey(ref.source_instance, ref.external_entity_type, ref.external_id, ref.source_revision);
    invariant(!this.crosswalk.has(key), 'duplicate_external_reference');
    this.crosswalk.set(key, copy(ref));
  }
  seedDiary({ id, organization_id, project_id, contract_id, author_user_id, status = 'draft', version = 0, work_description = 'Synthetic site work' }) {
    this._checkScope({ organization_id, project_id, contract_id }, { userId: author_user_id, organizationId: organization_id });
    invariant(!this.diaries.has(id), 'duplicate_diary');
    this.diaries.set(id, { id, organization_id, project_id, contract_id, author_user_id, status, version, work_description });
  }
  _externalKey(instance, type, id, revision) { return [instance,type,String(id),revision].join('\u001f'); }
  _checkScope(fields, principal) {
    invariant(principal && principal.userId && principal.organizationId, 'unauthenticated');
    const c = this.contracts.get(fields.contract_id);
    // Mask existence of other tenants/contracts with the same error.
    invariant(c && c.organization_id === principal.organizationId && fields.organization_id === c.organization_id && fields.project_id === c.project_id, 'not_found');
    return c;
  }
  _authorized(fields, principal, appointmentId, capability, allowedCapacities) {
    const c = this._checkScope(fields, principal);
    const ap = this.appointments.get(appointmentId);
    const now = this.now();
    invariant(ap && ap.status === 'active' && ap.organization_id === c.organization_id && ap.project_id === c.project_id && ap.contract_id === c.contract_id && ap.appointee_user_id === principal.userId, 'forbidden');
    invariant(ap.effective_from <= now && (!ap.effective_until || ap.effective_until > now), 'forbidden');
    invariant(allowedCapacities.includes(ap.capacity) && ap.capabilities.includes(capability), 'forbidden');
    return ap;
  }
  _commandGuard(cmd, principal, capability, allowedCapacities, aggregateType) {
    invariant(cmd && typeof cmd === 'object' && !('actor_user_id' in cmd) && !('approved_by' in cmd) && !('acknowledged_by' in cmd), 'actor_injection');
    invariant(cmd.command_id && cmd.idempotency_key && Number.isInteger(cmd.expected_version) && cmd.expected_version >= 0, 'invalid_command');
    invariant(cmd.aggregate_type === aggregateType, 'invalid_aggregate');
    invariant(cmd.payload && !('actor_user_id' in cmd.payload) && !('approved_by' in cmd.payload) && !('acknowledged_by' in cmd.payload), 'actor_injection');
    this._authorized(cmd, principal, cmd.acting_appointment_id, capability, allowedCapacities);
  }
  _applyOnce(cmd, principal, action, makeReceipt) {
    const key = `${cmd.organization_id}:${principal.userId}:${cmd.idempotency_key}`;
    // Request IDs and timestamps may change on network replay; business identity must not.
    const { command_id: _ignoredCommandId, requested_at: _ignoredRequestedAt, ...businessCommand } = cmd;
    const fingerprint = digest({ action, cmd: businessCommand });
    const previous = this.idempotency.get(key);
    if (previous) {
      invariant(previous.fingerprint === fingerprint, 'idempotency_conflict');
      return copy(previous.receipt);
    }
    const receipt = makeReceipt();
    this.idempotency.set(key, { fingerprint, receipt: copy(receipt) });
    return copy(receipt);
  }
  _event(name, aggregateId, currentVersion, principal, appointmentId, contract) {
    const event = { event_id: randomUUID(), event_name: name, organization_id: contract.organization_id,
      contract_id: contract.contract_id, aggregate_id: aggregateId, aggregate_version: currentVersion,
      actor_user_id: principal.userId, acting_appointment_id: appointmentId, recorded_at: this.now() };
    this.audit.push(event);
    return event.event_id;
  }

  submitDiary(cmd, principal) {
    this._commandGuard(cmd, principal, 'construction.diary.submit', ['main_contractor_submitter','subcontractor_submitter'], 'diary');
    return this._applyOnce(cmd, principal, 'diary.submit', () => {
      const diary = this.diaries.get(cmd.aggregate_id);
      invariant(diary && diary.contract_id === cmd.contract_id && diary.organization_id === cmd.organization_id, 'not_found');
      invariant(diary.author_user_id === principal.userId, 'forbidden');
      invariant(diary.version === cmd.expected_version, 'conflict');
      invariant(diary.status === 'draft', 'invalid_transition');
      diary.status = 'submitted'; diary.version += 1;
      const event_id = this._event('diary.submitted.v1', diary.id, diary.version, principal, cmd.acting_appointment_id, diary);
      return { id: diary.id, status: diary.status, version: diary.version, event_id };
    });
  }
  acknowledgeDiary(cmd, principal) {
    this._commandGuard(cmd, principal, 'construction.diary.acknowledge', ['main_contractor_reviewer'], 'diary');
    return this._applyOnce(cmd, principal, 'diary.acknowledge', () => {
      const diary = this.diaries.get(cmd.aggregate_id);
      invariant(diary && diary.contract_id === cmd.contract_id && diary.organization_id === cmd.organization_id, 'not_found');
      invariant(diary.version === cmd.expected_version, 'conflict');
      invariant(diary.status === 'submitted', 'invalid_transition');
      diary.status = 'acknowledged'; diary.version += 1;
      const event_id = this._event('diary.acknowledged.v1', diary.id, diary.version, principal, cmd.acting_appointment_id, diary);
      return { id: diary.id, status: diary.status, version: diary.version, event_id };
    });
  }

  importQsManifest(manifest, principal, appointmentId) {
    invariant(manifest && manifest.schema_version === CONTRACT_VERSION && manifest.source_system === 'qs-service' && manifest.programme_status === 'confirmed', 'invalid_manifest');
    this._authorized(manifest, principal, appointmentId, 'construction.programme.import', ['appointed_qs','contract_admin']);
    const contract = this.contracts.get(manifest.contract_id);
    invariant(manifest.boq_version_id === contract.boq_version_id && manifest.boq_source_sha256 === contract.boq_source_sha256, 'boq_mismatch');
    invariant(manifest.review && manifest.review.decision_id && manifest.review.approved_at && manifest.review.approved_by_external_id && manifest.review.approved_by_capacity && manifest.review.decision_reason, 'review_required');
    invariant(Number.isInteger(manifest.external_project_id) && manifest.external_project_id > 0 && Number.isInteger(manifest.external_programme_id) && manifest.external_programme_id > 0, 'invalid_manifest');
    invariant(Array.isArray(manifest.tasks) && manifest.tasks.length > 0 && Array.isArray(manifest.dependencies), 'invalid_manifest');
    invariant(hex64.test(manifest.manifest_sha256), 'invalid_manifest');
    const seenTasks = new Set();
    for (const task of manifest.tasks) {
      invariant(Number.isInteger(task.external_task_id) && !seenTasks.has(task.external_task_id), 'invalid_tasks');
      seenTasks.add(task.external_task_id);
    }
    for (const link of manifest.dependencies) invariant(seenTasks.has(link.from_external_task_id) && seenTasks.has(link.to_external_task_id), 'invalid_dependencies');
    let programmeCrosswalk;
    for (const [type,id] of [['project',manifest.external_project_id],['programme',manifest.external_programme_id]]) {
      const ref = this.crosswalk.get(this._externalKey(manifest.source_instance, type, id, manifest.source_revision));
      invariant(ref && ref.mapping_status === 'verified' && ref.organization_id === contract.organization_id && ref.canonical_entity_type === (type === 'project' ? 'project' : 'programme_baseline') && (type !== 'project' || ref.canonical_entity_id === contract.project_id), 'unverified_crosswalk');
      if (type === 'programme') programmeCrosswalk = ref;
    }
    const externalKey = this._externalKey(manifest.source_instance, 'programme', manifest.external_programme_id, manifest.source_revision);
    const fp = digest(manifest);
    const previous = this.imports.get(externalKey);
    if (previous) {
      invariant(previous.payloadFingerprint === fp, 'manifest_conflict');
      // Revalidate access even on replay; import duplicates do not create events.
      return copy(previous.receipt);
    }
    const receipt = { import_id: programmeCrosswalk.canonical_entity_id, contract_id: manifest.contract_id, organization_id: manifest.organization_id,
      manifest_sha256: manifest.manifest_sha256, status: 'imported', version: 0, tasks_count: manifest.tasks.length };
    this.imports.set(externalKey, { payloadFingerprint: fp, receipt, manifest: copy(manifest) });
    this._event('programme.manifest_received.v1', receipt.import_id, 0, principal, appointmentId, contract);
    return copy(receipt);
  }
  acceptProgramme({ import_id, contract_id, organization_id, project_id, expected_version, idempotency_key, acting_appointment_id }, principal) {
    const fields = { organization_id, project_id, contract_id };
    this._authorized(fields, principal, acting_appointment_id, 'construction.programme.accept', ['appointed_qs','client_representative','contract_admin']);
    const cmd = { organization_id, project_id, contract_id, expected_version, idempotency_key, aggregate_id: import_id };
    invariant(import_id && idempotency_key && Number.isInteger(expected_version), 'invalid_command');
    return this._applyOnce(cmd, principal, 'programme.accept', () => {
      const entry = [...this.imports.values()].find(x=>x.receipt.import_id === import_id);
      invariant(entry && entry.receipt.contract_id === contract_id && entry.receipt.organization_id === organization_id, 'not_found');
      invariant(entry.receipt.version === expected_version, 'conflict');
      invariant(entry.receipt.status === 'imported', 'invalid_transition');
      invariant(!this.activeBaselines.has(contract_id), 'already_active');
      entry.receipt.version += 1; entry.receipt.status = 'active';
      this.activeBaselines.set(contract_id, import_id);
      const event_id = this._event('programme.baseline_accepted.v1', import_id, entry.receipt.version, principal, acting_appointment_id, this.contracts.get(contract_id));
      return { ...copy(entry.receipt), event_id };
    });
  }
  progressReport(fields, principal) {
    const contract = this._checkScope(fields, principal);
    invariant([...this.appointments.values()].some(ap => ap.appointee_user_id === principal.userId && ap.organization_id === contract.organization_id && ap.contract_id === contract.contract_id && ap.status === 'active' && ap.effective_from <= this.now() && (!ap.effective_until || ap.effective_until > this.now())), 'forbidden');
    const id = this.activeBaselines.get(contract.contract_id);
    const active = [...this.imports.values()].find(e=>e.receipt.import_id === id);
    return { contract_id: contract.contract_id, active_programme_import_id: id || null,
      programme_tasks: active?.manifest.tasks.length || 0,
      acknowledged_diaries: [...this.diaries.values()].filter(d=>d.contract_id===contract.contract_id && d.status==='acknowledged').length,
      provenance: { programme_sha256: active?.manifest.manifest_sha256 || null, source: 'synthetic_mock_only' } };
  }
}
