-- WLE-E07 PRIVATE SCHEMA DESIGN ONLY — NEVER EXECUTE UNREVIEWED.
-- No physical schema reconciliation, live staging, credential or production authority.
-- Referenced wle_e01/e04/e06 keys are PROPOSED and must be checked against
-- independently approved actual physical schema and composite unique indexes.
-- Default-deny: NO runtime GRANT, POLICY, SECURITY DEFINER or bypass role.
BEGIN;
CREATE SCHEMA wle_e07;
REVOKE ALL ON SCHEMA wle_e07 FROM PUBLIC;

CREATE TABLE wle_e07.progress_measurements (
  measure_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL, project_id uuid NOT NULL, contract_id uuid NOT NULL,
  baseline_id uuid NOT NULL, baseline_version integer NOT NULL CHECK(baseline_version>=1),
  import_id uuid NOT NULL,
  manifest_sha256 text NOT NULL CHECK(manifest_sha256 ~ '^[a-f0-9]{64}$'),
  boq_version_id uuid NOT NULL,
  boq_snapshot_sha256 text NOT NULL CHECK(boq_snapshot_sha256 ~ '^[a-f0-9]{64}$'),
  source_instance text NOT NULL, source_revision text NOT NULL,
  external_programme_id bigint NOT NULL CHECK(external_programme_id>0),
  canonical_task_id uuid NOT NULL, external_task_id bigint NOT NULL CHECK(external_task_id>0),
  diary_id uuid NOT NULL, diary_version integer NOT NULL CHECK(diary_version>=1),
  diary_facts_sha256 text NOT NULL CHECK(diary_facts_sha256 ~ '^[a-f0-9]{64}$'),
  diary_evidence_ids uuid[] NOT NULL DEFAULT '{}',
  observation_date date NOT NULL,
  measure_type text NOT NULL CHECK(measure_type IN ('quantity','completion')),
  quantity numeric(16,4), unit text, completion_bp integer,
  reason text NOT NULL,
  recorded_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  review_status text NOT NULL CHECK(review_status IN ('pending_review','verified','rejected')),
  reviewed_by uuid, review_reason text, reviewed_at timestamptz,
  verified_sequence bigint, voided_by uuid, void_reason text, void_sequence bigint,
  aggregate_version integer NOT NULL DEFAULT 1 CHECK(aggregate_version>=1),
  source_event_sequence bigint NOT NULL,
  UNIQUE(organization_id,project_id,contract_id,baseline_id,measure_id),
  FOREIGN KEY(organization_id,project_id,contract_id,baseline_id)
    REFERENCES wle_e06.enterprise_programme_baselines(organization_id,project_id,contract_id,baseline_id),
  FOREIGN KEY(organization_id,project_id,contract_id,diary_id)
    REFERENCES wle_e04.diary_records(organization_id,project_id,contract_id,diary_id),
  FOREIGN KEY(organization_id,project_id,contract_id)
    REFERENCES wle_e01.construction_contracts(organization_id,project_id,contract_id),
  CHECK (
    (measure_type='quantity' AND quantity>0 AND unit IS NOT NULL AND length(trim(unit))>0 AND completion_bp IS NULL)
    OR
    (measure_type='completion' AND quantity IS NULL AND unit IS NULL AND completion_bp BETWEEN 0 AND 10000)
  ),
  CHECK (reviewed_by IS NULL OR reviewed_by <> recorded_by),
  CHECK (voided_by IS NULL OR voided_by <> recorded_by),
  CHECK (void_sequence IS NULL OR (review_status='verified' AND verified_sequence IS NOT NULL)),
  CHECK ((review_status='verified' AND verified_sequence IS NOT NULL) OR review_status<>'verified')
);

CREATE INDEX e07_measure_scope_baseline_task_date ON wle_e07.progress_measurements
  (organization_id,project_id,contract_id,baseline_id,canonical_task_id,observation_date);
CREATE INDEX e07_measure_diary ON wle_e07.progress_measurements
  (organization_id,project_id,contract_id,diary_id,diary_version);

-- Review and correction decisions are append-only ledger records. The
-- source measurement row is a candidate projection, not the source of
-- regulatory audit authority. Enforce no destructive delete with a vetted
-- non-bypass writer / trigger / event custody in approved staging.
CREATE TABLE wle_e07.measurement_decisions (
  decision_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,project_id uuid NOT NULL,contract_id uuid NOT NULL,
  baseline_id uuid NOT NULL,measure_id uuid NOT NULL,
  decision_type text NOT NULL CHECK(decision_type IN ('verified','rejected','voided')),
  reviewer_id uuid NOT NULL, reason text NOT NULL,
  observed_measure_version integer NOT NULL CHECK(observed_measure_version>=1),
  decision_sequence bigint NOT NULL, decided_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,project_id,contract_id,baseline_id,decision_sequence),
  FOREIGN KEY(organization_id,project_id,contract_id,baseline_id,measure_id)
   REFERENCES wle_e07.progress_measurements(organization_id,project_id,contract_id,baseline_id,measure_id)
);

-- Reports are immutable snapshots. `report_payload` includes exact source
-- task IDs, accepted manifest and BOQ revision hashes, diary and measure
-- links, as_of_date, event_sequence, and null for unassessed completion.
CREATE TABLE wle_e07.published_reports (
  report_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,project_id uuid NOT NULL,contract_id uuid NOT NULL,
  baseline_id uuid NOT NULL,baseline_version integer NOT NULL CHECK(baseline_version>=1),
  import_id uuid NOT NULL,
  manifest_sha256 text NOT NULL CHECK(manifest_sha256 ~ '^[a-f0-9]{64}$'),
  boq_snapshot_sha256 text NOT NULL CHECK(boq_snapshot_sha256 ~ '^[a-f0-9]{64}$'),
  as_of_date date NOT NULL, source_event_sequence bigint NOT NULL,
  report_payload jsonb NOT NULL,
  report_sha256 text NOT NULL CHECK(report_sha256 ~ '^[a-f0-9]{64}$'),
  produced_by uuid NOT NULL, produced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,project_id,contract_id,baseline_id,report_id),
  FOREIGN KEY(organization_id,project_id,contract_id,baseline_id)
    REFERENCES wle_e06.enterprise_programme_baselines(organization_id,project_id,contract_id,baseline_id)
);
CREATE INDEX e07_report_scope_date ON wle_e07.published_reports
  (organization_id,project_id,contract_id,baseline_id,as_of_date,source_event_sequence);

CREATE TABLE wle_e07.idempotent_receipts (
  organization_id uuid NOT NULL,project_id uuid NOT NULL,contract_id uuid NOT NULL,
  actor_user_id uuid NOT NULL, operation text NOT NULL, idempotency_key text NOT NULL,
  command_sha256 text NOT NULL CHECK(command_sha256 ~ '^[a-f0-9]{64}$'),
  response_payload jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id,project_id,contract_id,actor_user_id,operation,idempotency_key)
);
CREATE TABLE wle_e07.actual_events (
  event_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,project_id uuid NOT NULL,contract_id uuid NOT NULL,
  event_sequence bigint NOT NULL, event_type text NOT NULL,
  actor_user_id uuid NOT NULL, event_payload jsonb NOT NULL,
  event_hash text NOT NULL CHECK(event_hash ~ '^[a-f0-9]{64}$'),
  previous_hash text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,project_id,contract_id,event_sequence)
);
-- Approved implementation must add durable outbox, serial sequence/CAS,
-- typed FK task crosswalk, audit immutability, granular privileges and
-- DB triggers verifying reviewer <> submitter, monotonic task progress,
-- report digest, unchanged diary source bytes and stable E06 baseline.
-- None of those controls are actually enforced merely by this sketch.

ALTER TABLE wle_e07.progress_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE wle_e07.progress_measurements FORCE ROW LEVEL SECURITY;
ALTER TABLE wle_e07.measurement_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wle_e07.measurement_decisions FORCE ROW LEVEL SECURITY;
ALTER TABLE wle_e07.published_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE wle_e07.published_reports FORCE ROW LEVEL SECURITY;
ALTER TABLE wle_e07.idempotent_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wle_e07.idempotent_receipts FORCE ROW LEVEL SECURITY;
ALTER TABLE wle_e07.actual_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE wle_e07.actual_events FORCE ROW LEVEL SECURITY;
COMMIT;
-- DBA to reconcile: E06 baseline scoped UNIQUE index may be missing in its
-- candidate DDL. This SQL is NOT executable/approved without that review.
