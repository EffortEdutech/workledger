-- TEST ONLY. In Supabase/staging, DBA provisions a separate restricted server role.
-- Never issue the role password to browsers or put it into a public environment variable.
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='wle_e01_gateway') THEN
   CREATE ROLE wle_e01_gateway NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='authenticated') THEN
   CREATE ROLE authenticated NOLOGIN;
 END IF;
END $$;
