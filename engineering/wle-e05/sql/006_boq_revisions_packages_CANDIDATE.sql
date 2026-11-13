-- WLE-E05 BOQ Revision and Work-Package Registry v0.1 — DESIGN ONLY.
-- No production/staging execution; must reconcile with E01/E02/E03/E04 candidate schemas.
-- Deny by default: no runtime GRANT, no RLS POLICY, no SECURITY DEFINER, no migration authority.
BEGIN;
CREATE SCHEMA wle_e05;
REVOKE ALL ON SCHEMA wle_e05 FROM PUBLIC;

CREATE TABLE wle_e05.boq_revision_records (
 revision_id uuid PRIMARY KEY,
 organization_id uuid NOT NULL, project_id uuid NOT NULL,contract_id uuid NOT NULL,boq_id uuid NOT NULL,
 revision_no integer NOT NULL CHECK(revision_no>=1),base_revision_id uuid,
 contract_revision_id uuid NOT NULL,source_evidence_id uuid NOT NULL,
 source_sha256 text NOT NULL CHECK(source_sha256 ~ '^[a-f0-9]{64}$'),
 currency text NOT NULL CHECK(currency='MYR'),
 status text NOT NULL CHECK(status IN ('draft','approved','locked')),
 aggregate_version integer NOT NULL CHECK(aggregate_version>=1),
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 approved_by uuid,approved_at timestamptz,locked_by uuid,locked_at timestamptz,
 UNIQUE(organization_id,project_id,contract_id,boq_id,revision_id),
 UNIQUE(organization_id,project_id,contract_id,boq_id,revision_no),
 FOREIGN KEY(organization_id,project_id,contract_id) REFERENCES wle_e01.construction_contracts(organization_id,project_id,contract_id),
 FOREIGN KEY(organization_id,project_id,contract_id,contract_revision_id) REFERENCES wle_e02.contract_revision_records(organization_id,project_id,contract_id,revision_id),
 FOREIGN KEY(organization_id,project_id,contract_id,source_evidence_id) REFERENCES wle_e03.evidence_assets(organization_id,project_id,contract_id,evidence_id),
 FOREIGN KEY(organization_id,created_by) REFERENCES wle_e01.organization_memberships(organization_id,user_id),
 FOREIGN KEY(organization_id,approved_by) REFERENCES wle_e01.organization_memberships(organization_id,user_id),
 FOREIGN KEY(organization_id,locked_by) REFERENCES wle_e01.organization_memberships(organization_id,user_id),
 CHECK ((revision_no=1 AND base_revision_id IS NULL) OR (revision_no>1 AND base_revision_id IS NOT NULL)),
 CHECK (approved_by IS NULL OR approved_by <> created_by),
 CHECK (locked_by IS NULL OR locked_by <> created_by)
);
-- Provisional self reference: depends on revision_no and locked predecessor business validation.
ALTER TABLE wle_e05.boq_revision_records ADD CONSTRAINT e05_baseline_predecessor_fk
 FOREIGN KEY(base_revision_id) REFERENCES wle_e05.boq_revision_records(revision_id);
CREATE INDEX e05_revision_scope_idx ON wle_e05.boq_revision_records(organization_id,project_id,contract_id,boq_id,revision_no);

CREATE TABLE wle_e05.boq_revision_items (
 organization_id uuid NOT NULL,project_id uuid NOT NULL,contract_id uuid NOT NULL,boq_id uuid NOT NULL,revision_id uuid NOT NULL,
 item_key uuid NOT NULL,item_code text NOT NULL,description text NOT NULL,section_code text NOT NULL,
 item_type text NOT NULL CHECK(item_type IN ('measured','lump_sum','provisional')),
 unit text NOT NULL,
 quantity numeric(16,4) NOT NULL CHECK(quantity>=0),
 unit_rate numeric(16,4) NOT NULL CHECK(unit_rate>=0),
 amount numeric(20,2) NOT NULL CHECK(amount>=0),
 PRIMARY KEY(revision_id,item_key),UNIQUE(revision_id,item_code),
 UNIQUE(organization_id,project_id,contract_id,boq_id,revision_id,item_key),
 FOREIGN KEY(organization_id,project_id,contract_id,boq_id,revision_id)
  REFERENCES wle_e05.boq_revision_records(organization_id,project_id,contract_id,boq_id,revision_id)
);

CREATE TABLE wle_e05.work_packages (
 organization_id uuid NOT NULL,project_id uuid NOT NULL,contract_id uuid NOT NULL,boq_id uuid NOT NULL,revision_id uuid NOT NULL,
 package_id uuid NOT NULL,package_code text NOT NULL,title text NOT NULL,discipline text NOT NULL,
 PRIMARY KEY(revision_id,package_id),UNIQUE(revision_id,package_code),
 UNIQUE(organization_id,project_id,contract_id,boq_id,revision_id,package_id),
 FOREIGN KEY(organization_id,project_id,contract_id,boq_id,revision_id)
  REFERENCES wle_e05.boq_revision_records(organization_id,project_id,contract_id,boq_id,revision_id)
);
CREATE TABLE wle_e05.package_allocations (
 organization_id uuid NOT NULL,project_id uuid NOT NULL,contract_id uuid NOT NULL,boq_id uuid NOT NULL,revision_id uuid NOT NULL,
 package_id uuid NOT NULL,item_key uuid NOT NULL,
 share_bp integer NOT NULL CHECK(share_bp BETWEEN 1 AND 10000),
 PRIMARY KEY(revision_id,package_id,item_key),
 FOREIGN KEY(organization_id,project_id,contract_id,boq_id,revision_id,package_id)
  REFERENCES wle_e05.work_packages(organization_id,project_id,contract_id,boq_id,revision_id,package_id),
 FOREIGN KEY(organization_id,project_id,contract_id,boq_id,revision_id,item_key)
  REFERENCES wle_e05.boq_revision_items(organization_id,project_id,contract_id,boq_id,revision_id,item_key)
);
-- Coverage SUM(share_bp)<=10000 cannot be guaranteed by CHECK; a DBA-reviewed
-- serialized transaction/constraint trigger MUST enforce it in staging.

CREATE TABLE wle_e05.boq_source_crosswalk (
 organization_id uuid NOT NULL,project_id uuid NOT NULL,contract_id uuid NOT NULL,
 source_system text NOT NULL,source_instance_id text NOT NULL,
 source_entity_type text NOT NULL CHECK(source_entity_type IN ('boq_header','boq_item')),
 source_record_id text NOT NULL,source_revision text NOT NULL,
 boq_id uuid NOT NULL,revision_id uuid NOT NULL,item_key uuid,
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(organization_id,project_id,contract_id,source_system,source_instance_id,source_entity_type,source_record_id,source_revision),
 FOREIGN KEY(organization_id,project_id,contract_id,boq_id,revision_id)
  REFERENCES wle_e05.boq_revision_records(organization_id,project_id,contract_id,boq_id,revision_id),
 FOREIGN KEY(organization_id,project_id,contract_id,boq_id,revision_id,item_key)
  REFERENCES wle_e05.boq_revision_items(organization_id,project_id,contract_id,boq_id,revision_id,item_key),
 CHECK ((source_entity_type='boq_header' AND item_key IS NULL) OR (source_entity_type='boq_item' AND item_key IS NOT NULL))
);
-- A nullable FK deliberately permits header mappings. Legacy CDP requires
-- boq_items.boq_id -> boq.id -> contract_id; never assume boq_items.contract_id exists.

CREATE TABLE wle_e05.boq_diary_package_references (
 organization_id uuid NOT NULL,project_id uuid NOT NULL,contract_id uuid NOT NULL,
 boq_id uuid NOT NULL,revision_id uuid NOT NULL,package_id uuid NOT NULL,diary_id uuid NOT NULL,
 observation_reference text NOT NULL,linked_by uuid NOT NULL,linked_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(organization_id,project_id,contract_id,boq_id,revision_id,package_id,diary_id),
 FOREIGN KEY(organization_id,project_id,contract_id,boq_id,revision_id,package_id)
  REFERENCES wle_e05.work_packages(organization_id,project_id,contract_id,boq_id,revision_id,package_id),
 FOREIGN KEY(organization_id,project_id,contract_id,diary_id)
  REFERENCES wle_e04.diary_records(organization_id,project_id,contract_id,diary_id)
);
-- This table references factual evidence only; it has no progress/valuation fields.

CREATE TABLE wle_e05.boq_events (
 event_id uuid PRIMARY KEY,organization_id uuid NOT NULL,project_id uuid NOT NULL,contract_id uuid NOT NULL,
 boq_id uuid NOT NULL,revision_id uuid NOT NULL,actor_user_id uuid NOT NULL,acting_appointment_id uuid NOT NULL,
 command_id uuid NOT NULL,event_kind text NOT NULL,revision_version integer NOT NULL,
 event_payload jsonb NOT NULL,previous_event_sha256 text,event_sha256 text NOT NULL,
 reason text NOT NULL,recorded_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,project_id,contract_id,boq_id,revision_id)
  REFERENCES wle_e05.boq_revision_records(organization_id,project_id,contract_id,boq_id,revision_id)
);
CREATE TABLE wle_e05.boq_outbox (
 event_id uuid PRIMARY KEY REFERENCES wle_e05.boq_events(event_id),
 dispatch_state text NOT NULL DEFAULT 'pending' CHECK(dispatch_state='pending'),recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE wle_e05.boq_command_receipts (
 organization_id uuid NOT NULL,actor_user_id uuid NOT NULL,command_kind text NOT NULL,
 boq_id uuid NOT NULL,revision_id uuid NOT NULL,idempotency_key text NOT NULL,
 command_sha256 text NOT NULL,receipt jsonb NOT NULL,recorded_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(organization_id,actor_user_id,command_kind,boq_id,revision_id,idempotency_key)
);
DO $$ DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['boq_revision_records','boq_revision_items','work_packages','package_allocations','boq_source_crosswalk','boq_diary_package_references','boq_events','boq_outbox','boq_command_receipts'] LOOP
 EXECUTE format('ALTER TABLE wle_e05.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE wle_e05.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON TABLE wle_e05.%I FROM PUBLIC',t);
 END LOOP;
END $$;
-- NO runtime GRANT/POLICY. DBA must implement immutable locked baselines, snapshots,
-- crosswalk non-repointing, unique item totals, exact decimal rounding, and two-tenant tests.
COMMIT;
