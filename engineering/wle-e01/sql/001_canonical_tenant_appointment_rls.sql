-- WLE-E01 candidate 0.1: isolated, private PostgreSQL schema ONLY.
-- NEVER execute on production without approved staging schema reconciliation.
-- Requires wle_e01_gateway NOLOGIN role created separately by authorised DBA.
-- Table ownership stays with migration/admin role, not wle_e01_gateway.
BEGIN;
CREATE SCHEMA IF NOT EXISTS wle_e01;
REVOKE ALL ON SCHEMA wle_e01 FROM PUBLIC;

CREATE TABLE wle_e01.organizations (
  organization_id uuid PRIMARY KEY,
  display_name text NOT NULL CHECK (length(btrim(display_name)) BETWEEN 1 AND 250),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE wle_e01.organization_memberships (
  organization_id uuid NOT NULL REFERENCES wle_e01.organizations(organization_id),
  user_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('invited','active','suspended','revoked')),
  effective_from timestamptz NOT NULL,
  effective_until timestamptz,
  PRIMARY KEY (organization_id,user_id),
  CHECK (effective_until IS NULL OR effective_until > effective_from)
);
CREATE TABLE wle_e01.projects (
  organization_id uuid NOT NULL REFERENCES wle_e01.organizations(organization_id),
  project_id uuid NOT NULL,
  project_name text NOT NULL CHECK (length(btrim(project_name)) > 0),
  PRIMARY KEY (organization_id,project_id)
);
CREATE TABLE wle_e01.construction_contracts (
  organization_id uuid NOT NULL,
  project_id uuid NOT NULL,
  contract_id uuid NOT NULL,
  contract_label text NOT NULL CHECK (length(btrim(contract_label)) > 0),
  status text NOT NULL CHECK (status IN ('draft','active','suspended','completed','archived')),
  PRIMARY KEY (organization_id,project_id,contract_id),
  FOREIGN KEY (organization_id,project_id) REFERENCES wle_e01.projects(organization_id,project_id)
);
CREATE TABLE wle_e01.contract_parties (
  organization_id uuid NOT NULL,
  project_id uuid NOT NULL,
  contract_id uuid NOT NULL,
  party_id uuid NOT NULL,
  display_name text NOT NULL CHECK (length(btrim(display_name)) > 0),
  PRIMARY KEY (organization_id,project_id,contract_id,party_id),
  FOREIGN KEY (organization_id,project_id,contract_id)
    REFERENCES wle_e01.construction_contracts(organization_id,project_id,contract_id)
);
CREATE TABLE wle_e01.contract_appointments (
  appointment_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  project_id uuid NOT NULL,
  contract_id uuid NOT NULL,
  party_id uuid NOT NULL,
  appointee_user_id uuid NOT NULL,
  capacity text NOT NULL CHECK (capacity IN (
    'contract_admin','main_contractor_submitter','main_contractor_reviewer',
    'subcontractor_submitter','appointed_qs','certifier','finance_recorder',
    'client_representative','independent_quality_verifier','auditor','legal_counsel'
  )),
  status text NOT NULL CHECK (status IN ('proposed','active','revoked','expired')),
  effective_from timestamptz NOT NULL,
  effective_until timestamptz,
  revoked_at timestamptz,
  grant_event_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id,project_id,contract_id,appointment_id),
  CHECK (effective_until IS NULL OR effective_until > effective_from),
  CHECK (status <> 'revoked' OR revoked_at IS NOT NULL),
  FOREIGN KEY (organization_id,appointee_user_id)
    REFERENCES wle_e01.organization_memberships(organization_id,user_id),
  FOREIGN KEY (organization_id,project_id,contract_id,party_id)
    REFERENCES wle_e01.contract_parties(organization_id,project_id,contract_id,party_id)
);
CREATE TABLE wle_e01.appointment_capabilities (
  appointment_id uuid NOT NULL REFERENCES wle_e01.contract_appointments(appointment_id),
  capability text NOT NULL CHECK (capability ~ '^construction\.[a-z_]+\.[a-z_]+$'),
  PRIMARY KEY (appointment_id, capability)
);
CREATE TABLE wle_e01.authority_events (
  event_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  project_id uuid NOT NULL,
  contract_id uuid NOT NULL,
  appointment_id uuid,
  actor_user_id uuid NOT NULL,
  event_name text NOT NULL CHECK (event_name IN ('appointment.granted.v1','appointment.revoked.v1','appointment.expired.v1')),
  payload jsonb NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id,project_id,contract_id)
    REFERENCES wle_e01.construction_contracts(organization_id,project_id,contract_id),
  FOREIGN KEY (appointment_id) REFERENCES wle_e01.contract_appointments(appointment_id)
);
CREATE INDEX idx_e01_membership_user ON wle_e01.organization_memberships(user_id,organization_id);
CREATE INDEX idx_e01_appointment_user_scope ON wle_e01.contract_appointments(appointee_user_id,organization_id,contract_id,status);
CREATE INDEX idx_e01_appointment_time ON wle_e01.contract_appointments(effective_from,effective_until);
CREATE INDEX idx_e01_cap_lookup ON wle_e01.appointment_capabilities(capability,appointment_id);
CREATE INDEX idx_e01_events_scope ON wle_e01.authority_events(organization_id,contract_id,recorded_at);

-- The server is responsible for authenticating a real JWT first, obtaining the
-- user ID from the auth provider, and SET LOCAL wle_e01.verified_user_id.
-- Custom PostgreSQL GUCs are NOT a cryptographic identity proof; the restricted
-- server DB account must NEVER be reachable by clients. No client may SET this.
CREATE FUNCTION wle_e01.current_actor() RETURNS uuid
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
 SELECT CASE WHEN pg_catalog.current_setting('wle_e01.verified_user_id',true)
     ~* '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
   THEN pg_catalog.current_setting('wle_e01.verified_user_id',true)::uuid
   ELSE NULL::uuid END
$$;

-- Intentional SECURITY INVOKER: all subqueries obey the caller's RLS.
CREATE FUNCTION wle_e01.can_act(
  p_org uuid, p_project uuid, p_contract uuid,
  p_appointment uuid, p_capability text
) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM wle_e01.organizations o
    JOIN wle_e01.organization_memberships m ON m.organization_id=o.organization_id
    JOIN wle_e01.contract_appointments a ON a.organization_id=m.organization_id
      AND a.appointee_user_id=m.user_id
    JOIN wle_e01.appointment_capabilities ac ON ac.appointment_id=a.appointment_id
    WHERE o.organization_id=p_org AND o.status='active'
      AND m.user_id=wle_e01.current_actor() AND m.status='active'
      AND m.effective_from<=now() AND (m.effective_until IS NULL OR m.effective_until>now())
      AND a.organization_id=p_org AND a.project_id=p_project
      AND a.contract_id=p_contract AND a.appointment_id=p_appointment
      AND a.status='active' AND a.effective_from<=now()
      AND (a.effective_until IS NULL OR a.effective_until>now())
      AND ac.capability=p_capability
  )
$$;

-- Private schema, not exposed through browser PostgREST. All tables force RLS,
-- with SELECT-only policies for restricted server gateway role.
DO $$ DECLARE tbl text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['organizations','organization_memberships','projects','construction_contracts',
    'contract_parties','contract_appointments','appointment_capabilities','authority_events'] LOOP
    EXECUTE format('ALTER TABLE wle_e01.%I ENABLE ROW LEVEL SECURITY',tbl);
    EXECUTE format('ALTER TABLE wle_e01.%I FORCE ROW LEVEL SECURITY',tbl);
    EXECUTE format('REVOKE ALL ON TABLE wle_e01.%I FROM PUBLIC',tbl);
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION wle_e01.current_actor() FROM PUBLIC;
REVOKE ALL ON FUNCTION wle_e01.can_act(uuid,uuid,uuid,uuid,text) FROM PUBLIC;

CREATE POLICY org_select ON wle_e01.organizations FOR SELECT TO wle_e01_gateway USING (
 EXISTS (SELECT 1 FROM wle_e01.organization_memberships m
   WHERE m.organization_id=organizations.organization_id AND m.user_id=wle_e01.current_actor()
     AND m.status='active' AND m.effective_from<=now()
     AND (m.effective_until IS NULL OR m.effective_until>now()))
);
CREATE POLICY membership_self ON wle_e01.organization_memberships FOR SELECT TO wle_e01_gateway USING (
 user_id=wle_e01.current_actor() AND status='active'
 AND effective_from<=now() AND (effective_until IS NULL OR effective_until>now())
);
CREATE POLICY projects_member ON wle_e01.projects FOR SELECT TO wle_e01_gateway USING (
 EXISTS(SELECT 1 FROM wle_e01.organizations o
   WHERE o.organization_id=projects.organization_id AND o.status='active')
 AND EXISTS(SELECT 1 FROM wle_e01.organization_memberships m
   WHERE m.organization_id=projects.organization_id AND m.user_id=wle_e01.current_actor()
     AND m.status='active' AND m.effective_from<=now()
     AND (m.effective_until IS NULL OR m.effective_until>now()))
);
CREATE POLICY appointments_self ON wle_e01.contract_appointments FOR SELECT TO wle_e01_gateway USING (
 appointee_user_id=wle_e01.current_actor()
 AND EXISTS(SELECT 1 FROM wle_e01.organization_memberships m
     WHERE m.organization_id=contract_appointments.organization_id
       AND m.user_id=wle_e01.current_actor() AND m.status='active'
       AND m.effective_from<=now() AND (m.effective_until IS NULL OR m.effective_until>now()))
);
CREATE POLICY capabilities_self ON wle_e01.appointment_capabilities FOR SELECT TO wle_e01_gateway USING (
 EXISTS(SELECT 1 FROM wle_e01.contract_appointments a
   WHERE a.appointment_id=appointment_capabilities.appointment_id
     AND a.appointee_user_id=wle_e01.current_actor())
);
CREATE POLICY contract_read ON wle_e01.construction_contracts FOR SELECT TO wle_e01_gateway USING (
 EXISTS(SELECT 1 FROM wle_e01.organizations o
   WHERE o.organization_id=construction_contracts.organization_id AND o.status='active')
 AND EXISTS(SELECT 1 FROM wle_e01.contract_appointments a
  JOIN wle_e01.appointment_capabilities cap ON cap.appointment_id=a.appointment_id
  WHERE a.organization_id=construction_contracts.organization_id
    AND a.project_id=construction_contracts.project_id
    AND a.contract_id=construction_contracts.contract_id
    AND a.appointee_user_id=wle_e01.current_actor()
    AND a.status='active' AND a.effective_from<=now()
    AND (a.effective_until IS NULL OR a.effective_until>now())
    AND cap.capability='construction.contract.read')
);
CREATE POLICY party_read ON wle_e01.contract_parties FOR SELECT TO wle_e01_gateway USING (
 EXISTS(SELECT 1 FROM wle_e01.construction_contracts c
   WHERE c.organization_id=contract_parties.organization_id
     AND c.project_id=contract_parties.project_id
     AND c.contract_id=contract_parties.contract_id)
);
-- authority_events intentionally has no runtime SELECT policy until E03 audit viewer.

-- Fail closed: no INSERT/UPDATE/DELETE grants to runtime, no anon/authenticated grants.
GRANT USAGE ON SCHEMA wle_e01 TO wle_e01_gateway;
GRANT SELECT ON wle_e01.organizations,wle_e01.organization_memberships,
  wle_e01.projects,wle_e01.construction_contracts,wle_e01.contract_parties,
  wle_e01.contract_appointments,wle_e01.appointment_capabilities TO wle_e01_gateway;
GRANT EXECUTE ON FUNCTION wle_e01.current_actor() TO wle_e01_gateway;
GRANT EXECUTE ON FUNCTION wle_e01.can_act(uuid,uuid,uuid,uuid,text) TO wle_e01_gateway;
COMMIT;
