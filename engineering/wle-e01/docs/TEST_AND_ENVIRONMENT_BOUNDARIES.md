# Verification Boundaries

`npm test`: Node unit tests of gateway token validation, client-authority-field refusal, transaction scoping, SQL parameterization, errors and resource release. A stub verifier/pool does not prove live Supabase authentication.

`npm run test:rls`: executes migration and policy queries on PGlite's actual PostgreSQL engine compiled to WASM. This verifies SQL policy semantics under PostgreSQL roles, including FORCE RLS, security-invoker, composite FK and SELECT-only grants. It does **not** exercise networking, the Supabase Data API, actual JWT verification, production connection pooling, the user's project, PostgreSQL extensions, or object storage.

Existing E00 tests are independent and should be rerun against the commit. Existing WorkLedger Standard Vite build must pass at the E01 commit. Its known lint, dependency and Vercel preview failures are carried from P0B/E00 and must be reported independently, not attributed to this folder.
