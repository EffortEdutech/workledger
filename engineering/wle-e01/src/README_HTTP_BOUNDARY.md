E01 does not bind a server port or expose REST routes. Wire the gateway only through an
approved internal server-side handler. The handler must authenticate a real Supabase access
token via auth.getUser(token), then use a restricted PostgreSQL connection role scoped to
wle_e01_gateway. Never accept actor IDs from JSON or expose the role password to Vite.
Gateway.authorize() only returns an authorisation decision, not domain state mutation.
Provisioning/grants/revocation require a separately reviewed E01B command handler and audit.
