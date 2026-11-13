-- WLE-E06 QS Adapter / PRIVATE DDL DESIGN ONLY, NON-EXECUTABLE MIGRATION AUTHORITY.
-- MUST NOT EXECUTE against production, shared Supabase or unapproved staging.
-- Depends on independently reviewed E01/E05 physical schemas and DBA approval.
-- NO RUNTIME GRANTS, NO RLS POLICIES, NO SECURITY DEFINER: DEFAULT DENY.
-- Business rules (JCS, signer verification, task cycle, immutable baselines,
-- receipt idempotency, immutable source mapping) remain gateway/trigger work.
BEGIN;
CREATE SCHEMA wle_e06;
REVOKE ALL ON SCHEMA wle_e06 FROM PUBLIC;

CREATE TABLE wle_e06.qs_project_crosswalk (
 organization_id uuid NOT NULL, project_id uuid NOT NULL, contract_id uuid NOT NULL,
 source_instance text NOT NULL, qs_project_id bigint NOT NULL CHECK(qs_project_id>0),
 mapped_by uuid NOT NULL, mapped_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(organization_id,project_id,contract_id,source_instance),
 UNIQUE(source_instance,qs_project_id),
 FOREIGN KEY(organization_id,project_id,contract_id)
  REFERENCES wle_e01.construction_contracts(organization_id,project_id,contract_id),
 FOREIGN KEY(organization_id,mapped_by)
  REFERENCES wle_e01.organization_memberships(organization_id,user_id)
);

CREATE TABLE wle_e06.qs_generation_requests (
 request_id uuid PRIMARY KEY,
 organization_id uuid NOT NULL,project_id uuid NOT NULL,contract_id uuid NOT NULL,
 boq_id uuid NOT NULL, boq_version_id uuid NOT NULL,
 boq_snapshot_sha256 text NOT NULL CHECK(boq_snapshot_sha256 ~ '^[0-9a-f]{64}$'),
 source_instance text NOT NULL, qs_project_id bigint NOT NULL CHECK(qs_project_id>0),
 external_programme_id bigint CHECK(external_programme_id>0),
 state text NOT NULL CHECK(state IN ('queued','running','review_required','confirmed','reopened','rejected','failed','cancelled')),
 generation_stage text NOT NULL CHECK(generation_stage IN (
  'discipline_profiling','activity_mapping','wbs_structuring','sequencing','productivity_strategy',
  'cpm_review','programme_review','complete')),
 requested_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 dispatch_receipt jsonb,
 UNIQUE(organization_id,project_id,contract_id,request_id),
 FOREIGN KEY(organization_id,project_id,contract_id,source_instance)
  REFERENCES wle_e06.qs_project_crosswalk(organization_id,project_id,contract_id,source_instance),
 FOREIGN KEY(organization_id,project_id,contract_id,boq_id,boq_version_id)
  REFERENCES wle_e05.boq_revision_records(organization_id,project_id,contract_id,boq_id,revision_id),
 FOREIGN KEY(organization_id,requested_by)
  REFERENCES wle_e01.organization_memberships(organization_id,user_id)
);
CREATE INDEX e06_requests_scope ON wle_e06.qs_generation_requests(organization_id,project_id,contract_id,state,created_at);

CREATE TABLE wle_e06.qs_manifest_imports (
 import_id uuid PRIMARY KEY,request_id uuid NOT NULL,
 organization_id uuid NOT NULL,project_id uuid NOT NULL,contract_id uuid NOT NULL,
 source_instance text NOT NULL, external_programme_id bigint NOT NULL CHECK(external_programme_id>0),
 source_revision text NOT NULL,
 boq_id uuid NOT NULL,boq_version_id uuid NOT NULL,
 boq_snapshot_sha256 text NOT NULL CHECK(boq_snapshot_sha256 ~ '^[0-9a-f]{64}$'),
 manifest_sha256 text NOT NULL CHECK(manifest_sha256 ~ '^[0-9a-f]{64}$'),
 manifest_payload jsonb NOT NULL,
 imported_by uuid NOT NULL,imported_at timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL CHECK(status IN ('pending_acceptance','accepted','invalidated_reopened')),
 accepted_baseline_id uuid,
 UNIQUE(source_instance,external_programme_id,source_revision),
 UNIQUE(organization_id,project_id,contract_id,import_id),
 FOREIGN KEY(organization_id,project_id,contract_id,request_id)
  REFERENCES wle_e06.qs_generation_requests(organization_id,project_id,contract_id,request_id),
 FOREIGN KEY(organization_id,imported_by)
  REFERENCES wle_e01.organization_memberships(organization_id,user_id)
);

CREATE TABLE wle_e06.qs_task_crosswalk (
 source_instance text NOT NULL,external_programme_id bigint NOT NULL CHECK(external_programme_id>0),
 external_task_id bigint NOT NULL CHECK(external_task_id>0),
 organization_id uuid NOT NULL,project_id uuid NOT NULL,contract_id uuid NOT NULL,
 canonical_task_id uuid NOT NULL UNIQUE,
 PRIMARY KEY(source_instance,external_programme_id,external_task_id),
 FOREIGN KEY(organization_id,project_id,contract_id)
  REFERENCES wle_e01.construction_contracts(organization_id,project_id,contract_id)
);

CREATE TABLE wle_e06.enterprise_programme_baselines (
 baseline_id uuid PRIMARY KEY,import_id uuid NOT NULL UNIQUE,
 organization_id uuid NOT NULL,project_id uuid NOT NULL,contract_id uuid NOT NULL,
 baseline_version integer NOT NULL CHECK(baseline_version>=1),
 previous_baseline_id uuid REFERENCES wle_e06.enterprise_programme_baselines(baseline_id),
 accepted_by uuid NOT NULL,accepted_at timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL CHECK(status IN ('active','superseded')),
 UNIQUE(organization_id,project_id,contract_id,baseline_version),
 FOREIGN KEY(organization_id,project_id,contract_id,import_id)
  REFERENCES wle_e06.qs_manifest_imports(organization_id,project_id,contract_id,import_id),
 FOREIGN KEY(organization_id,accepted_by)
  REFERENCES wle_e01.organization_memberships(organization_id,user_id)
);
-- Uniqueness alone is insufficient: accept transaction must perform a
-- compare-and-swap on current baseline version and atomically supersede.
CREATE UNIQUE INDEX e06_one_active_per_contract
 ON wle_e06.enterprise_programme_baselines(organization_id,project_id,contract_id)
 WHERE status='active';

CREATE TABLE wle_e06.qs_inbox (
 source_instance text NOT NULL,source_event_id uuid NOT NULL,
 organization_id uuid NOT NULL,project_id uuid NOT NULL,contract_id uuid NOT NULL,
 event_sha256 text NOT NULL CHECK(event_sha256 ~ '^[0-9a-f]{64}$'),
 receipt jsonb NOT NULL,received_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(source_instance,source_event_id),
 FOREIGN KEY(organization_id,project_id,contract_id)
  REFERENCES wle_e01.construction_contracts(organization_id,project_id,contract_id)
);
CREATE TABLE wle_e06.qs_command_receipts (
 organization_id uuid NOT NULL,actor_user_id uuid NOT NULL,command_kind text NOT NULL,
 idempotency_key text NOT NULL,command_sha256 text NOT NULL CHECK(command_sha256 ~ '^[0-9a-f]{64}$'),
 receipt jsonb NOT NULL,recorded_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(organization_id,actor_user_id,command_kind,idempotency_key)
);
CREATE TABLE wle_e06.qs_audit_events (
 event_id uuid PRIMARY KEY,organization_id uuid NOT NULL,project_id uuid NOT NULL,contract_id uuid NOT NULL,
 event_name text NOT NULL,actor_ref text NOT NULL,event_payload jsonb NOT NULL,
 previous_event_sha256 text CHECK(previous_event_sha256 ~ '^[0-9a-f]{64}$'),
 event_sha256 text NOT NULL CHECK(event_sha256 ~ '^[0-9a-f]{64}$'),
 recorded_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,project_id,contract_id)
  REFERENCES wle_e01.construction_contracts(organization_id,project_id,contract_id)
);
CREATE TABLE wle_e06.qs_outbox (
 event_id uuid PRIMARY KEY REFERENCES wle_e06.qs_audit_events(event_id),
 organization_id uuid NOT NULL,project_id uuid NOT NULL,contract_id uuid NOT NULL,
 event_sha256 text NOT NULL CHECK(event_sha256 ~ '^[0-9a-f]{64}$'),
 dispatch_state text NOT NULL DEFAULT 'pending' CHECK(dispatch_state='pending'),
 recorded_at timestamptz NOT NULL DEFAULT now()
);
DO $$DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY[
  'qs_project_crosswalk','qs_generation_requests','qs_manifest_imports','qs_task_crosswalk',
  'enterprise_programme_baselines','qs_inbox','qs_command_receipts','qs_audit_events','qs_outbox'
 ] LOOP
  EXECUTE format('ALTER TABLE wle_e06.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE wle_e06.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON TABLE wle_e06.%I FROM PUBLIC',t);
 END LOOP;
END$$;
-- RLS policies / roles / non-bypass writer / immutable update protection / external
-- crypto / transaction gateway / outbox publisher all BLOCKED pending review.
COMMIT;
