-- WLE-E01B candidate delta; MUST be preceded by E01 migration in an approved isolated DB.
-- This is NOT a Supabase production migration. Requires dedicated, non-bypass role
-- wle_e01_appointment_writer provisioned separately by DBA. No browser credentials.
BEGIN;

ALTER TABLE wle_e01.contract_appointments
  ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK (version >= 1);
CREATE UNIQUE INDEX e01b_one_active_capacity_per_user ON wle_e01.contract_appointments
  (organization_id,project_id,contract_id,appointee_user_id,capacity)
  WHERE status='active';
ALTER TABLE wle_e01.authority_events DROP CONSTRAINT authority_events_event_name_check;
ALTER TABLE wle_e01.authority_events ADD CONSTRAINT authority_events_event_name_check
  CHECK (event_name IN (
   'appointment.requested.v1','appointment.approved.v1',
   'appointment.granted.v1','appointment.revoked.v1','appointment.expired.v1'));

CREATE TABLE wle_e01.appointment_requests (
 request_id uuid PRIMARY KEY,
 organization_id uuid NOT NULL,
 project_id uuid NOT NULL,
 contract_id uuid NOT NULL,
 party_id uuid NOT NULL,
 appointee_user_id uuid NOT NULL,
 capacity text NOT NULL CHECK (capacity IN ('main_contractor_submitter','main_contractor_reviewer','subcontractor_submitter','auditor')),
 capabilities jsonb NOT NULL CHECK (jsonb_typeof(capabilities)='array'),
 effective_from timestamptz NOT NULL,
 effective_until timestamptz,
 request_reason text NOT NULL CHECK (length(btrim(request_reason)) >= 8 AND length(request_reason) <= 2000),
 requester_user_id uuid NOT NULL,
 reviewer_user_id uuid,
 reviewer_appointment_id uuid,
 approved_at timestamptz,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','activated','cancelled')),
 version integer NOT NULL DEFAULT 1 CHECK (version BETWEEN 1 AND 3),
 activated_appointment_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (appointee_user_id <> requester_user_id),
 CHECK (effective_until IS NULL OR effective_until > effective_from),
 CHECK (status <> 'approved' OR (reviewer_user_id IS NOT NULL AND reviewer_appointment_id IS NOT NULL AND approved_at IS NOT NULL)),
 FOREIGN KEY (organization_id,project_id,contract_id,party_id)
   REFERENCES wle_e01.contract_parties(organization_id,project_id,contract_id,party_id),
 FOREIGN KEY (organization_id,appointee_user_id)
   REFERENCES wle_e01.organization_memberships(organization_id,user_id),
 FOREIGN KEY (organization_id,requester_user_id)
   REFERENCES wle_e01.organization_memberships(organization_id,user_id)
);
CREATE TABLE wle_e01.authority_outbox (
 event_id uuid PRIMARY KEY REFERENCES wle_e01.authority_events(event_id),
 organization_id uuid NOT NULL,
 contract_id uuid NOT NULL,
 event_name text NOT NULL,
 payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[0-9a-f]{64}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 dispatch_state text NOT NULL DEFAULT 'pending' CHECK (dispatch_state IN ('pending','dispatched','failed'))
);
CREATE TABLE wle_e01.authority_command_receipts (
 organization_id uuid NOT NULL REFERENCES wle_e01.organizations(organization_id),
 actor_user_id uuid NOT NULL,
 idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 8 AND 128),
 command_type text NOT NULL CHECK (command_type IN ('request','approve','activate','revoke')),
 command_sha256 text NOT NULL CHECK (command_sha256 ~ '^[0-9a-f]{64}$'),
 receipt jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (organization_id,actor_user_id,idempotency_key)
);
CREATE INDEX idx_e01b_requests_scope ON wle_e01.appointment_requests(organization_id,contract_id,status);
CREATE INDEX idx_e01b_outbox_pending ON wle_e01.authority_outbox(created_at) WHERE dispatch_state='pending';

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['appointment_requests','authority_outbox','authority_command_receipts'] LOOP
  EXECUTE format('ALTER TABLE wle_e01.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE wle_e01.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON wle_e01.%I FROM PUBLIC',t);
 END LOOP;
END $$;

-- RLS for the private command role relies on scope being set by a *trusted* server
-- in the very same transaction, after verification; GUCs are not signed claims.
CREATE POLICY admin_read_org ON wle_e01.organizations FOR SELECT TO wle_e01_appointment_writer
 USING (organization_id::text = pg_catalog.current_setting('wle_e01.admin_scope_org',true) AND status='active');
CREATE POLICY admin_read_membership ON wle_e01.organization_memberships FOR SELECT TO wle_e01_appointment_writer
 USING (organization_id::text = pg_catalog.current_setting('wle_e01.admin_scope_org',true));
CREATE POLICY admin_read_projects ON wle_e01.projects FOR SELECT TO wle_e01_appointment_writer
 USING (organization_id::text = pg_catalog.current_setting('wle_e01.admin_scope_org',true));
CREATE POLICY admin_read_contract ON wle_e01.construction_contracts FOR SELECT TO wle_e01_appointment_writer
 USING (organization_id::text = pg_catalog.current_setting('wle_e01.admin_scope_org',true) AND contract_id::text = pg_catalog.current_setting('wle_e01.admin_scope_contract',true));
CREATE POLICY admin_read_parties ON wle_e01.contract_parties FOR SELECT TO wle_e01_appointment_writer
 USING (organization_id::text = pg_catalog.current_setting('wle_e01.admin_scope_org',true) AND contract_id::text = pg_catalog.current_setting('wle_e01.admin_scope_contract',true));
CREATE POLICY admin_read_appointments ON wle_e01.contract_appointments FOR SELECT TO wle_e01_appointment_writer
 USING (organization_id::text = pg_catalog.current_setting('wle_e01.admin_scope_org',true) AND contract_id::text = pg_catalog.current_setting('wle_e01.admin_scope_contract',true));
CREATE POLICY admin_read_caps ON wle_e01.appointment_capabilities FOR SELECT TO wle_e01_appointment_writer
 USING (EXISTS(SELECT 1 FROM wle_e01.contract_appointments a WHERE a.appointment_id=appointment_capabilities.appointment_id));
CREATE POLICY admin_insert_appointment ON wle_e01.contract_appointments FOR INSERT TO wle_e01_appointment_writer
 WITH CHECK (organization_id::text = pg_catalog.current_setting('wle_e01.admin_scope_org',true) AND contract_id::text = pg_catalog.current_setting('wle_e01.admin_scope_contract',true)
 AND status='active' AND appointee_user_id <> wle_e01.current_actor());
CREATE POLICY admin_revoke_appointment ON wle_e01.contract_appointments FOR UPDATE TO wle_e01_appointment_writer
 USING (organization_id::text = pg_catalog.current_setting('wle_e01.admin_scope_org',true) AND contract_id::text = pg_catalog.current_setting('wle_e01.admin_scope_contract',true) AND status='active')
 WITH CHECK (organization_id::text = pg_catalog.current_setting('wle_e01.admin_scope_org',true) AND contract_id::text = pg_catalog.current_setting('wle_e01.admin_scope_contract',true) AND status='revoked');
CREATE POLICY admin_insert_capability ON wle_e01.appointment_capabilities FOR INSERT TO wle_e01_appointment_writer
 WITH CHECK (EXISTS(SELECT 1 FROM wle_e01.contract_appointments a WHERE a.appointment_id=appointment_capabilities.appointment_id));
CREATE POLICY admin_read_request ON wle_e01.appointment_requests FOR SELECT TO wle_e01_appointment_writer
 USING (organization_id::text=pg_catalog.current_setting('wle_e01.admin_scope_org',true) AND contract_id::text=pg_catalog.current_setting('wle_e01.admin_scope_contract',true));
CREATE POLICY admin_insert_request ON wle_e01.appointment_requests FOR INSERT TO wle_e01_appointment_writer
 WITH CHECK (organization_id::text=pg_catalog.current_setting('wle_e01.admin_scope_org',true) AND contract_id::text=pg_catalog.current_setting('wle_e01.admin_scope_contract',true)
 AND requester_user_id=wle_e01.current_actor() AND status='pending' AND version=1);
CREATE POLICY admin_update_request ON wle_e01.appointment_requests FOR UPDATE TO wle_e01_appointment_writer
 USING (organization_id::text=pg_catalog.current_setting('wle_e01.admin_scope_org',true) AND contract_id::text=pg_catalog.current_setting('wle_e01.admin_scope_contract',true))
 WITH CHECK (organization_id::text=pg_catalog.current_setting('wle_e01.admin_scope_org',true) AND contract_id::text=pg_catalog.current_setting('wle_e01.admin_scope_contract',true));
CREATE POLICY admin_insert_event ON wle_e01.authority_events FOR INSERT TO wle_e01_appointment_writer
 WITH CHECK (organization_id::text=pg_catalog.current_setting('wle_e01.admin_scope_org',true) AND contract_id::text=pg_catalog.current_setting('wle_e01.admin_scope_contract',true)
 AND actor_user_id=wle_e01.current_actor());
CREATE POLICY admin_insert_outbox ON wle_e01.authority_outbox FOR INSERT TO wle_e01_appointment_writer
 WITH CHECK (organization_id::text=pg_catalog.current_setting('wle_e01.admin_scope_org',true) AND contract_id::text=pg_catalog.current_setting('wle_e01.admin_scope_contract',true) AND dispatch_state='pending');
CREATE POLICY admin_read_receipt ON wle_e01.authority_command_receipts FOR SELECT TO wle_e01_appointment_writer
 USING (organization_id::text=pg_catalog.current_setting('wle_e01.admin_scope_org',true) AND actor_user_id=wle_e01.current_actor());
CREATE POLICY admin_insert_receipt ON wle_e01.authority_command_receipts FOR INSERT TO wle_e01_appointment_writer
 WITH CHECK (organization_id::text=pg_catalog.current_setting('wle_e01.admin_scope_org',true) AND actor_user_id=wle_e01.current_actor());

GRANT USAGE ON SCHEMA wle_e01 TO wle_e01_appointment_writer;
GRANT SELECT ON wle_e01.organizations,wle_e01.organization_memberships,wle_e01.projects,
 wle_e01.construction_contracts,wle_e01.contract_parties,wle_e01.contract_appointments,
 wle_e01.appointment_capabilities,wle_e01.appointment_requests,wle_e01.authority_command_receipts TO wle_e01_appointment_writer;
GRANT INSERT ON wle_e01.contract_appointments,wle_e01.appointment_capabilities,
 wle_e01.appointment_requests,wle_e01.authority_events,wle_e01.authority_outbox,
 wle_e01.authority_command_receipts TO wle_e01_appointment_writer;
GRANT UPDATE(status,revoked_at,version) ON wle_e01.contract_appointments TO wle_e01_appointment_writer;
GRANT UPDATE(status,version,reviewer_user_id,reviewer_appointment_id,approved_at,activated_appointment_id)
 ON wle_e01.appointment_requests TO wle_e01_appointment_writer;
GRANT EXECUTE ON FUNCTION wle_e01.current_actor(),wle_e01.can_act(uuid,uuid,uuid,uuid,text) TO wle_e01_appointment_writer;
COMMIT;
