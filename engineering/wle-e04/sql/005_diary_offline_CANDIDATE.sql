-- WLE-E04 v0.1 — PRIVATE DDL DESIGN ONLY. NOT AN APPROVED MIGRATION.
-- Requires independently reviewed E01/E01B/E02/E03 schemas and authorised isolated staging.
-- DO NOT EXECUTE in production, shared projects, Aircond Care, FireMan or unapproved staging.
-- No runtime role, GRANT or RLS POLICY is defined: deployment MUST remain default deny.
-- Never grant service_role/postgres/browser/anon/authenticated access to this private schema.
BEGIN;
CREATE SCHEMA wle_e04;
REVOKE ALL ON SCHEMA wle_e04 FROM PUBLIC;

CREATE TABLE wle_e04.diary_records (
 diary_id uuid PRIMARY KEY,
 organization_id uuid NOT NULL,
 project_id uuid NOT NULL,
 contract_id uuid NOT NULL,
 diary_date date NOT NULL,
 shift_code text NOT NULL CHECK (shift_code IN ('day','night')),
 facts jsonb NOT NULL CHECK (jsonb_typeof(facts)='object'),
 author_user_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','acknowledged')),
 aggregate_version integer NOT NULL CHECK (aggregate_version >= 1),
 created_at timestamptz NOT NULL DEFAULT now(),
 submitted_by uuid,
 submitted_at timestamptz,
 acknowledged_by uuid,
 acknowledged_at timestamptz,
 acknowledgement_note text,
 UNIQUE(organization_id,project_id,contract_id,diary_id),
 UNIQUE(organization_id,project_id,contract_id,diary_date,shift_code),
 FOREIGN KEY (organization_id,project_id,contract_id)
  REFERENCES wle_e01.construction_contracts(organization_id,project_id,contract_id),
 FOREIGN KEY (organization_id,author_user_id)
  REFERENCES wle_e01.organization_memberships(organization_id,user_id),
 FOREIGN KEY (organization_id,submitted_by)
  REFERENCES wle_e01.organization_memberships(organization_id,user_id),
 FOREIGN KEY (organization_id,acknowledged_by)
  REFERENCES wle_e01.organization_memberships(organization_id,user_id),
 CHECK ((status='draft' AND submitted_by IS NULL AND submitted_at IS NULL AND acknowledged_by IS NULL AND acknowledged_at IS NULL)
   OR (status='submitted' AND submitted_by IS NOT NULL AND submitted_at IS NOT NULL AND acknowledged_by IS NULL AND acknowledged_at IS NULL)
   OR (status='acknowledged' AND submitted_by IS NOT NULL AND submitted_at IS NOT NULL AND acknowledged_by IS NOT NULL AND acknowledged_at IS NOT NULL)),
 CHECK (acknowledged_by IS NULL OR acknowledged_by <> submitted_by)
);
CREATE INDEX e04_diaries_scope_status ON wle_e04.diary_records(organization_id,project_id,contract_id,status,diary_date);

-- A diary links an E03-preserved object by exact composite scope.
-- This FK presumes the candidate E03 physical table exists; no live schema is assumed.
CREATE TABLE wle_e04.diary_evidence_links (
 organization_id uuid NOT NULL,
 project_id uuid NOT NULL,
 contract_id uuid NOT NULL,
 diary_id uuid NOT NULL,
 evidence_id uuid NOT NULL,
 evidence_sha256 text NOT NULL CHECK(evidence_sha256 ~ '^[0-9a-f]{64}$'),
 linked_by uuid NOT NULL,
 linked_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (organization_id,project_id,contract_id,diary_id,evidence_id),
 FOREIGN KEY (organization_id,project_id,contract_id,diary_id)
  REFERENCES wle_e04.diary_records(organization_id,project_id,contract_id,diary_id),
 FOREIGN KEY (organization_id,project_id,contract_id,evidence_id)
  REFERENCES wle_e03.evidence_assets(organization_id,project_id,contract_id,evidence_id),
 FOREIGN KEY (organization_id,linked_by)
  REFERENCES wle_e01.organization_memberships(organization_id,user_id)
);
CREATE INDEX e04_evidence_scope ON wle_e04.diary_evidence_links(organization_id,contract_id,evidence_id);

CREATE TABLE wle_e04.diary_audit_events (
 event_id uuid PRIMARY KEY,
 organization_id uuid NOT NULL,
 project_id uuid NOT NULL,
 contract_id uuid NOT NULL,
 diary_id uuid NOT NULL,
 actor_user_id uuid NOT NULL,
 acting_appointment_id uuid NOT NULL,
 command_id uuid NOT NULL,
 event_name text NOT NULL CHECK (event_name IN (
  'diary.draft_synced.v1','diary.evidence_linked.v1','diary.submitted.v1','diary.acknowledged.v1')),
 diary_version integer NOT NULL CHECK (diary_version>=1),
 event_payload jsonb NOT NULL,
 previous_event_sha256 text CHECK (previous_event_sha256 ~ '^[0-9a-f]{64}$'),
 event_sha256 text NOT NULL CHECK (event_sha256 ~ '^[0-9a-f]{64}$'),
 reason text NOT NULL CHECK (length(btrim(reason))>=8),
 recorded_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (organization_id,project_id,contract_id,diary_id)
  REFERENCES wle_e04.diary_records(organization_id,project_id,contract_id,diary_id)
);
CREATE INDEX e04_events_scope ON wle_e04.diary_audit_events(organization_id,contract_id,recorded_at,event_id);

CREATE TABLE wle_e04.diary_outbox (
 event_id uuid PRIMARY KEY REFERENCES wle_e04.diary_audit_events(event_id),
 organization_id uuid NOT NULL,
 contract_id uuid NOT NULL,
 event_name text NOT NULL,
 event_sha256 text NOT NULL CHECK(event_sha256 ~ '^[0-9a-f]{64}$'),
 dispatch_state text NOT NULL DEFAULT 'pending' CHECK(dispatch_state='pending'),
 recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX e04_outbox_pending ON wle_e04.diary_outbox(recorded_at) WHERE dispatch_state='pending';

CREATE TABLE wle_e04.diary_command_receipts (
 organization_id uuid NOT NULL,
 actor_user_id uuid NOT NULL,
 command_kind text NOT NULL CHECK (command_kind IN ('sync_draft','attach_evidence','submit','acknowledge')),
 diary_id uuid NOT NULL,
 idempotency_key text NOT NULL CHECK(length(idempotency_key) BETWEEN 8 AND 128),
 command_sha256 text NOT NULL CHECK(command_sha256 ~ '^[0-9a-f]{64}$'),
 receipt jsonb NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(organization_id,actor_user_id,command_kind,diary_id,idempotency_key)
);

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['diary_records','diary_evidence_links','diary_audit_events','diary_outbox','diary_command_receipts'] LOOP
  EXECUTE format('ALTER TABLE wle_e04.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE wle_e04.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON TABLE wle_e04.%I FROM PUBLIC',t);
 END LOOP;
END $$;
-- SECURITY HOLD: no CREATE POLICY or GRANT to any runtime role; no gateway migration.
-- Only after DBA-authorised staging should reviewed PRIVATE, least-privileged commands
-- write through a single transaction with verified JWT actor and current E01 appointment.
-- E03 file preservation is not transactionally coupled to this schema; use custody
-- reconciliation/orphan recovery rather than claiming cross-system atomicity.
-- Actual state immutability must also be enforced by reviewed permissions/triggers.
COMMIT;
