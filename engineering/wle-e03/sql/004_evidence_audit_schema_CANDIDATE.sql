-- WLE-E03 v0.1 physical schema PROPOSAL ONLY — NOT AN AUTHORIZED MIGRATION.
-- Never execute in production, shared Supabase or the unrelated Aircond Care / FireMan projects.
-- Requires DBA-reviewed E01/E01B/E02 ordering, separately approved private schema, signer custody policy,
-- storage provider, non-bypass writer roles, project ownership, retention and migration ticket.
-- This file declares NO runtime role or policies: deny-by-default intentional. SQL/RLS NOT TESTED.
BEGIN;
CREATE SCHEMA wle_e03;
REVOKE ALL ON SCHEMA wle_e03 FROM PUBLIC;

CREATE TABLE wle_e03.evidence_assets (
  evidence_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  project_id uuid NOT NULL,
  contract_id uuid NOT NULL,
  source_record_type text NOT NULL,
  source_record_id text NOT NULL,
  original_filename text NOT NULL,
  declared_media_type text NOT NULL,
  detected_media_type text,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
  storage_object_key text NOT NULL UNIQUE,
  captured_at timestamptz,
  occurred_at timestamptz,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  uploader_user_id uuid NOT NULL,
  uploader_appointment_id uuid NOT NULL,
  asset_status text NOT NULL DEFAULT 'preserved' CHECK (asset_status = 'preserved'),
  retention_class text NOT NULL,
  provenance_source text NOT NULL,
  visibility_scope text NOT NULL CHECK (visibility_scope IN ('contract','restricted')),
  redaction_parent_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,project_id,contract_id,evidence_id),
  FOREIGN KEY(organization_id,project_id,contract_id)
    REFERENCES wle_e01.construction_contracts(organization_id,project_id,contract_id),
  FOREIGN KEY(organization_id,uploader_user_id)
    REFERENCES wle_e01.organization_memberships(organization_id,user_id),
  FOREIGN KEY(organization_id,project_id,contract_id,redaction_parent_id)
    REFERENCES wle_e03.evidence_assets(organization_id,project_id,contract_id,evidence_id),
  CHECK (redaction_parent_id IS NULL OR redaction_parent_id <> evidence_id)
);
CREATE INDEX e03_assets_scope ON wle_e03.evidence_assets(organization_id,project_id,contract_id,created_at);
CREATE INDEX e03_assets_parent ON wle_e03.evidence_assets(redaction_parent_id) WHERE redaction_parent_id IS NOT NULL;

-- Legal hold is a state projection, not an authorisation to delete or shred originals.
-- Any release requires independent, evidenced business review and append-only audit in same DB transaction.
CREATE TABLE wle_e03.evidence_hold_state (
  hold_id uuid PRIMARY KEY,
  evidence_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  project_id uuid NOT NULL,
  contract_id uuid NOT NULL,
  case_reference text NOT NULL,
  hold_class text NOT NULL CHECK (hold_class IN ('legal','audit','contractual')),
  hold_status text NOT NULL DEFAULT 'active' CHECK (hold_status IN ('active','released')),
  placed_by uuid NOT NULL,
  placed_at timestamptz NOT NULL DEFAULT now(),
  released_by uuid,
  released_at timestamptz,
  review_reference text,
  CHECK((hold_status='active' AND released_at IS NULL AND released_by IS NULL)
     OR (hold_status='released' AND released_at IS NOT NULL AND released_by IS NOT NULL
         AND placed_by<>released_by AND review_reference IS NOT NULL)),
  FOREIGN KEY(organization_id,project_id,contract_id,evidence_id)
    REFERENCES wle_e03.evidence_assets(organization_id,project_id,contract_id,evidence_id)
);
CREATE INDEX e03_active_holds ON wle_e03.evidence_hold_state(organization_id,contract_id,evidence_id)
  WHERE hold_status='active';

-- A hash-linked audit is tamper-evident only with trusted ordering, immutable permissions,
-- stable canonicalisation and separately anchored/trusted checkpoints.
CREATE TABLE wle_e03.evidence_audit_events (
  event_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  project_id uuid NOT NULL,
  contract_id uuid NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  aggregate_version integer NOT NULL CHECK(aggregate_version>=1),
  event_type text NOT NULL,
  actor_user_id uuid NOT NULL,
  acting_appointment_id uuid NOT NULL,
  authenticated_request_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  previous_state text,
  next_state text,
  reason text NOT NULL,
  correlation_id uuid NOT NULL,
  causation_id uuid,
  originating_device text,
  payload_schema_version text NOT NULL,
  payload jsonb NOT NULL,
  previous_event_hash text CHECK(previous_event_hash IS NULL OR previous_event_hash ~ '^[0-9a-f]{64}$'),
  event_hash text NOT NULL CHECK(event_hash ~ '^[0-9a-f]{64}$'),
  FOREIGN KEY(organization_id,project_id,contract_id)
    REFERENCES wle_e01.construction_contracts(organization_id,project_id,contract_id)
);
CREATE INDEX e03_audit_contract_order ON wle_e03.evidence_audit_events(organization_id,project_id,contract_id,recorded_at,event_id);

CREATE TABLE wle_e03.evidence_outbox (
  event_id uuid PRIMARY KEY REFERENCES wle_e03.evidence_audit_events(event_id),
  organization_id uuid NOT NULL,
  contract_id uuid NOT NULL,
  event_type text NOT NULL,
  event_payload_sha256 text NOT NULL CHECK(event_payload_sha256 ~ '^[0-9a-f]{64}$'),
  dispatch_state text NOT NULL DEFAULT 'pending' CHECK(dispatch_state='pending'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX e03_outbox_pending ON wle_e03.evidence_outbox(created_at) WHERE dispatch_state='pending';

CREATE TABLE wle_e03.evidence_command_receipts (
  organization_id uuid NOT NULL,
  actor_user_id uuid NOT NULL,
  command_kind text NOT NULL,
  idempotency_key text NOT NULL,
  command_digest text NOT NULL CHECK(command_digest ~ '^[0-9a-f]{64}$'),
  receipt jsonb NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id,actor_user_id,command_kind,idempotency_key)
);
CREATE TABLE wle_e03.evidence_export_manifests (
  export_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  project_id uuid NOT NULL,
  contract_id uuid NOT NULL,
  actor_user_id uuid NOT NULL,
  purpose text NOT NULL,
  manifest_version text NOT NULL,
  manifest jsonb NOT NULL,
  manifest_sha256 text NOT NULL CHECK(manifest_sha256 ~ '^[0-9a-f]{64}$'),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(organization_id,project_id,contract_id)
    REFERENCES wle_e01.construction_contracts(organization_id,project_id,contract_id)
);

-- All tables are private and default deny. No grant to PUBLIC / anon / authenticated / service_role.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['evidence_assets','evidence_hold_state','evidence_audit_events',
  'evidence_outbox','evidence_command_receipts','evidence_export_manifests'] LOOP
  EXECUTE format('ALTER TABLE wle_e03.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE wle_e03.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON TABLE wle_e03.%I FROM PUBLIC',t);
 END LOOP;
END $$;
-- Deliberately no CREATE POLICY or GRANT for writer yet: staging-specific E01/E02
-- role topology, authenticated transaction boundary, trigger immutability,
-- retention and two-phase object custody require approved implementation.
COMMIT;
