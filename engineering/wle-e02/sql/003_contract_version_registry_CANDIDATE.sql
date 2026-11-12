-- WLE-E02 candidate v0.1. NOT approved migration; NEVER run in production.
-- Dependency: E01 and E01B candidates + externally provisioned LEAST-PRIVILEGED
-- wle_e02_writer role (no LOGIN in this SQL, no BYPASSRLS, no browser/API exposure).
-- DBA must review target Supabase project, grants, role inheritance, IAM, RLS and DDL.
BEGIN;
CREATE SCHEMA wle_e02;
REVOKE ALL ON SCHEMA wle_e02 FROM PUBLIC;

CREATE TABLE wle_e02.contract_revision_records (
 revision_id uuid PRIMARY KEY,
 organization_id uuid NOT NULL,
 project_id uuid NOT NULL,
 contract_id uuid NOT NULL,
 revision_no integer NOT NULL CHECK (revision_no >= 1),
 form_code text CHECK (form_code IS NULL OR length(btrim(form_code)) BETWEEN 1 AND 100),
 project_timezone text NOT NULL CHECK (length(btrim(project_timezone)) BETWEEN 3 AND 100),
 key_dates jsonb NOT NULL CHECK (jsonb_typeof(key_dates)='object'),
 source_document_sha256 text NOT NULL CHECK (source_document_sha256 ~ '^[0-9a-f]{64}$'),
 source_document_reference text NOT NULL CHECK (length(btrim(source_document_reference)) BETWEEN 8 AND 512),
 created_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 aggregate_version integer NOT NULL DEFAULT 1 CHECK (aggregate_version=1),
 UNIQUE (organization_id,project_id,contract_id,revision_id),
 UNIQUE (organization_id,project_id,contract_id,revision_no),
 FOREIGN KEY (organization_id,project_id,contract_id)
    REFERENCES wle_e01.construction_contracts(organization_id,project_id,contract_id),
 FOREIGN KEY (organization_id,created_by)
    REFERENCES wle_e01.organization_memberships(organization_id,user_id)
);
CREATE TABLE wle_e02.contract_revision_parties (
 organization_id uuid NOT NULL,
 project_id uuid NOT NULL,
 contract_id uuid NOT NULL,
 revision_id uuid NOT NULL,
 party_id uuid NOT NULL,
 PRIMARY KEY(revision_id,party_id),
 FOREIGN KEY(organization_id,project_id,contract_id,revision_id)
    REFERENCES wle_e02.contract_revision_records(organization_id,project_id,contract_id,revision_id),
 FOREIGN KEY(organization_id,project_id,contract_id,party_id)
    REFERENCES wle_e01.contract_parties(organization_id,project_id,contract_id,party_id)
);
-- A seal is INSERT ONLY. No update/delete rights for runtime writer.
-- The evidence ID is NOT claimed to be independently verified by this DDL;
-- E03 trusted evidence integration & legal signer checks are separate gates.
CREATE TABLE wle_e02.contract_signed_evidence_seals (
 organization_id uuid NOT NULL,
 project_id uuid NOT NULL,
 contract_id uuid NOT NULL,
 revision_id uuid PRIMARY KEY,
 signed_evidence_id uuid NOT NULL,
 signed_document_sha256 text NOT NULL CHECK(signed_document_sha256 ~ '^[0-9a-f]{64}$'),
 signed_by_party_id uuid NOT NULL,
 evidence_verified_at timestamptz NOT NULL,
 sealed_by uuid NOT NULL,
 sealed_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,project_id,contract_id,revision_id)
    REFERENCES wle_e02.contract_revision_records(organization_id,project_id,contract_id,revision_id),
 FOREIGN KEY(revision_id,signed_by_party_id)
    REFERENCES wle_e02.contract_revision_parties(revision_id,party_id),
 FOREIGN KEY(organization_id,sealed_by)
    REFERENCES wle_e01.organization_memberships(organization_id,user_id)
);
CREATE TABLE wle_e02.contract_source_crosswalk (
 source_system text NOT NULL,
 source_instance_id text NOT NULL,
 source_entity_type text NOT NULL,
 source_record_id text NOT NULL,
 source_revision text NOT NULL,
 organization_id uuid NOT NULL,
 project_id uuid NOT NULL,
 contract_id uuid NOT NULL,
 revision_id uuid NOT NULL,
 recorded_by uuid NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(source_system,source_instance_id,source_entity_type,source_record_id,source_revision),
 FOREIGN KEY(organization_id,project_id,contract_id,revision_id)
    REFERENCES wle_e02.contract_revision_records(organization_id,project_id,contract_id,revision_id)
);
CREATE TABLE wle_e02.contract_registry_events (
 event_id uuid PRIMARY KEY,
 organization_id uuid NOT NULL,
 project_id uuid NOT NULL,
 contract_id uuid NOT NULL,
 revision_id uuid NOT NULL,
 actor_user_id uuid NOT NULL,
 event_name text NOT NULL CHECK(event_name IN (
  'contract.revision_registered.v1','contract.signed_evidence_recorded.v1',
  'contract.source_mapping_created.v1','contract.source_mapping_confirmed.v1')),
 payload jsonb NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,project_id,contract_id,revision_id)
    REFERENCES wle_e02.contract_revision_records(organization_id,project_id,contract_id,revision_id)
);
CREATE TABLE wle_e02.contract_registry_outbox (
 event_id uuid PRIMARY KEY REFERENCES wle_e02.contract_registry_events(event_id),
 organization_id uuid NOT NULL,
 contract_id uuid NOT NULL,
 event_name text NOT NULL,
 payload_sha256 text NOT NULL CHECK(payload_sha256 ~ '^[0-9a-f]{64}$'),
 dispatch_state text NOT NULL DEFAULT 'pending' CHECK(dispatch_state='pending'),
 recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE wle_e02.contract_registry_receipts (
 organization_id uuid NOT NULL,
 actor_user_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('register','seal','map')),
 revision_id uuid NOT NULL,
 idempotency_key text NOT NULL CHECK(length(idempotency_key) BETWEEN 8 AND 128),
 command_sha256 text NOT NULL CHECK(command_sha256 ~ '^[0-9a-f]{64}$'),
 receipt jsonb NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(organization_id,actor_user_id,kind,revision_id,idempotency_key)
);
CREATE INDEX idx_e02_revisions_scope ON wle_e02.contract_revision_records(organization_id,project_id,contract_id,revision_no);
CREATE INDEX idx_e02_events_scope ON wle_e02.contract_registry_events(organization_id,contract_id,recorded_at);
CREATE INDEX idx_e02_outbox_pending ON wle_e02.contract_registry_outbox(recorded_at) WHERE dispatch_state='pending';
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['contract_revision_records','contract_revision_parties',
 'contract_signed_evidence_seals','contract_source_crosswalk','contract_registry_events',
 'contract_registry_outbox','contract_registry_receipts'] LOOP
  EXECUTE format('ALTER TABLE wle_e02.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE wle_e02.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON TABLE wle_e02.%I FROM PUBLIC',t);
 END LOOP;
END $$;
-- The E01 can_act function is SECURITY INVOKER. Its four base reads need
-- isolated E02 writer RLS access; no policy permits an unauthorised tenant.
CREATE POLICY e02_org_read ON wle_e01.organizations FOR SELECT TO wle_e02_writer
 USING(organization_id::text=current_setting('wle_e02.scope_org',true) AND status='active');
CREATE POLICY e02_membership_read ON wle_e01.organization_memberships FOR SELECT TO wle_e02_writer
 USING(organization_id::text=current_setting('wle_e02.scope_org',true)
  AND user_id=wle_e01.current_actor() AND status='active' AND effective_from<=now()
  AND (effective_until IS NULL OR effective_until>now()));
CREATE POLICY e02_appointment_read ON wle_e01.contract_appointments FOR SELECT TO wle_e02_writer
 USING(organization_id::text=current_setting('wle_e02.scope_org',true)
  AND contract_id::text=current_setting('wle_e02.scope_contract',true)
  AND appointee_user_id=wle_e01.current_actor());
CREATE POLICY e02_capability_read ON wle_e01.appointment_capabilities FOR SELECT TO wle_e02_writer
 USING(EXISTS(SELECT 1 FROM wle_e01.contract_appointments a WHERE a.appointment_id=appointment_capabilities.appointment_id));
CREATE POLICY e02_contract_read ON wle_e01.construction_contracts FOR SELECT TO wle_e02_writer
 USING(organization_id::text=current_setting('wle_e02.scope_org',true)
  AND contract_id::text=current_setting('wle_e02.scope_contract',true));
CREATE POLICY e02_parties_read ON wle_e01.contract_parties FOR SELECT TO wle_e02_writer
 USING(organization_id::text=current_setting('wle_e02.scope_org',true)
  AND contract_id::text=current_setting('wle_e02.scope_contract',true));
-- SQL policies depend on trusted server transaction scope and current_actor;
-- caller-supplied GUCs do not authenticate. E02 DB creds MUST stay private.
CREATE POLICY e02_revision_read ON wle_e02.contract_revision_records FOR SELECT TO wle_e02_writer
 USING(organization_id::text=current_setting('wle_e02.scope_org',true)
  AND contract_id::text=current_setting('wle_e02.scope_contract',true)
  AND wle_e01.can_act(organization_id,project_id,contract_id,
   current_setting('wle_e02.acting_appointment',true)::uuid,'construction.contract.read'));
CREATE POLICY e02_revision_insert ON wle_e02.contract_revision_records FOR INSERT TO wle_e02_writer
 WITH CHECK(organization_id::text=current_setting('wle_e02.scope_org',true)
  AND contract_id::text=current_setting('wle_e02.scope_contract',true)
  AND created_by=wle_e01.current_actor()
  AND wle_e01.can_act(organization_id,project_id,contract_id,
   current_setting('wle_e02.acting_appointment',true)::uuid,'construction.contract.revision_create'));
CREATE POLICY e02_partylink_read ON wle_e02.contract_revision_parties FOR SELECT TO wle_e02_writer
 USING(EXISTS(SELECT 1 FROM wle_e02.contract_revision_records r WHERE r.revision_id=contract_revision_parties.revision_id));
CREATE POLICY e02_partylink_insert ON wle_e02.contract_revision_parties FOR INSERT TO wle_e02_writer
 WITH CHECK(EXISTS(SELECT 1 FROM wle_e02.contract_revision_records r WHERE r.revision_id=contract_revision_parties.revision_id
   AND wle_e01.can_act(r.organization_id,r.project_id,r.contract_id,
   current_setting('wle_e02.acting_appointment',true)::uuid,'construction.contract.revision_create')));
CREATE POLICY e02_seal_read ON wle_e02.contract_signed_evidence_seals FOR SELECT TO wle_e02_writer
 USING(organization_id::text=current_setting('wle_e02.scope_org',true)
 AND contract_id::text=current_setting('wle_e02.scope_contract',true));
CREATE POLICY e02_seal_insert ON wle_e02.contract_signed_evidence_seals FOR INSERT TO wle_e02_writer
 WITH CHECK(organization_id::text=current_setting('wle_e02.scope_org',true)
 AND contract_id::text=current_setting('wle_e02.scope_contract',true)
 AND sealed_by=wle_e01.current_actor()
 AND wle_e01.can_act(organization_id,project_id,contract_id,
   current_setting('wle_e02.acting_appointment',true)::uuid,'construction.contract.revision_seal'));
CREATE POLICY e02_crosswalk_read ON wle_e02.contract_source_crosswalk FOR SELECT TO wle_e02_writer
 USING(organization_id::text=current_setting('wle_e02.scope_org',true)
  AND contract_id::text=current_setting('wle_e02.scope_contract',true));
CREATE POLICY e02_crosswalk_insert ON wle_e02.contract_source_crosswalk FOR INSERT TO wle_e02_writer
 WITH CHECK(organization_id::text=current_setting('wle_e02.scope_org',true)
 AND contract_id::text=current_setting('wle_e02.scope_contract',true)
 AND recorded_by=wle_e01.current_actor()
 AND wle_e01.can_act(organization_id,project_id,contract_id,
  current_setting('wle_e02.acting_appointment',true)::uuid,'construction.contract.source_map'));
-- Events/outbox are append-only and have no runtime SELECT policy until E03.
CREATE POLICY e02_event_insert ON wle_e02.contract_registry_events FOR INSERT TO wle_e02_writer
 WITH CHECK(organization_id::text=current_setting('wle_e02.scope_org',true)
 AND contract_id::text=current_setting('wle_e02.scope_contract',true)
 AND actor_user_id=wle_e01.current_actor());
CREATE POLICY e02_outbox_insert ON wle_e02.contract_registry_outbox FOR INSERT TO wle_e02_writer
 WITH CHECK(organization_id::text=current_setting('wle_e02.scope_org',true)
 AND contract_id::text=current_setting('wle_e02.scope_contract',true) AND dispatch_state='pending');
CREATE POLICY e02_receipt_read ON wle_e02.contract_registry_receipts FOR SELECT TO wle_e02_writer
 USING(organization_id::text=current_setting('wle_e02.scope_org',true)
 AND actor_user_id=wle_e01.current_actor());
CREATE POLICY e02_receipt_insert ON wle_e02.contract_registry_receipts FOR INSERT TO wle_e02_writer
 WITH CHECK(organization_id::text=current_setting('wle_e02.scope_org',true)
 AND actor_user_id=wle_e01.current_actor());
GRANT USAGE ON SCHEMA wle_e01,wle_e02 TO wle_e02_writer;
GRANT SELECT ON wle_e01.organizations,wle_e01.organization_memberships,
 wle_e01.construction_contracts,wle_e01.contract_parties,wle_e01.contract_appointments,
 wle_e01.appointment_capabilities TO wle_e02_writer;
GRANT SELECT ON wle_e02.contract_revision_records,wle_e02.contract_revision_parties,
 wle_e02.contract_signed_evidence_seals,wle_e02.contract_source_crosswalk,
 wle_e02.contract_registry_receipts TO wle_e02_writer;
GRANT INSERT ON wle_e02.contract_revision_records,wle_e02.contract_revision_parties,
 wle_e02.contract_signed_evidence_seals,wle_e02.contract_source_crosswalk,
 wle_e02.contract_registry_events,wle_e02.contract_registry_outbox,
 wle_e02.contract_registry_receipts TO wle_e02_writer;
GRANT EXECUTE ON FUNCTION wle_e01.current_actor(),
 wle_e01.can_act(uuid,uuid,uuid,uuid,text) TO wle_e02_writer;
COMMIT;
