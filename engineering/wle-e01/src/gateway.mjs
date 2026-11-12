/**
 * WLE-E01 private, server-only verification boundary.
 * This file does not create an HTTP route and MUST NOT be imported in browser code.
 * Database role: separate wle_e01_gateway with SELECT-only grants and RLS.
 * Identity GUC is set ONLY after getUser(token) (verified by Supabase Auth server).
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CAPABILITY = /^construction\.[a-z_]+\.[a-z_]+$/;
const KNOWN = new Set([
 'construction.contract.read','construction.contract.amend',
 'construction.boq.draft','construction.boq.accept',
 'construction.diary.draft','construction.diary.submit','construction.diary.acknowledge',
 'construction.programme.request','construction.programme.accept',
 'construction.quality.close','construction.commercial.claim_submit',
 'construction.commercial.certify','construction.payment.record',
 'construction.evidence.export','construction.dispute.prepare'
]);
export class AuthError extends Error {
 constructor(code,status,detail=code){super(detail);this.name='AuthError';this.code=code;this.status=status;}
}
function invalid(detail){throw new AuthError('invalid_input',400,detail);}
function unauth(){throw new AuthError('unauthenticated',401);}
function parseHeader(v){
 if(typeof v!=='string'||!/^Bearer [A-Za-z0-9._~+\/-]+=*$/.test(v))unauth();
 return v.slice(7);
}
function validateScope(input){
 if(!input||typeof input!=='object'||Array.isArray(input))invalid('scope must be object');
 const keys=['organization_id','project_id','contract_id','acting_appointment_id','capability'];
 const forbidden=['actor_user_id','approved_by','acknowledged_by','role','user_id'];
 if(forbidden.some(k=>Object.hasOwn(input,k)) || Object.keys(input).some(k=>!keys.includes(k)))invalid('untrusted authority fields');
 for(const k of keys.slice(0,4)){if(typeof input[k]!=='string'||!UUID.test(input[k]))invalid(k+' must be UUID');}
 if(typeof input.capability!=='string'||!CAPABILITY.test(input.capability)||!KNOWN.has(input.capability))invalid('unknown capability');
 return input;
}
export function createSupabaseVerifier(supabaseServerClient){
 if(!supabaseServerClient?.auth?.getUser)throw new Error('auth.getUser(token) adapter required');
 return async function verifyAccessToken(token){
   const {data,error}=await supabaseServerClient.auth.getUser(token);
   if(error||!data?.user?.id||!UUID.test(data.user.id))unauth();
   return {id:data.user.id};
 };
}
/**
 * pool.connect() MUST return a single transaction-bound client.
 * Supabase service_role / postgres administrative credentials are forbidden here.
 * app-specific verified identity GUC is not independently cryptographically secure:
 * enforce TLS, server-only role secret, authenticated verifier and inaccessible DB port.
 */
export function createAuthorisationGateway({verifyAccessToken,pool}){
 if(typeof verifyAccessToken!=='function'||typeof pool?.connect!=='function')throw new Error('real verifier and transaction pool required');
 return Object.freeze({
  async authorize({authorization,scope}){
   const token=parseHeader(authorization);
   const input=validateScope(scope);
   let identity;
   try { identity=await verifyAccessToken(token); } catch { unauth(); }
   if(!identity||!UUID.test(identity.id||''))unauth();
   const client=await pool.connect();
   let begun=false;
   try {
    await client.query('BEGIN READ ONLY');begun=true;
    await client.query("SELECT set_config('wle_e01.verified_user_id',$1,true)",[identity.id]);
    const {rows}=await client.query(
      'SELECT wle_e01.can_act($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5::text) AS permitted',
      [input.organization_id,input.project_id,input.contract_id,input.acting_appointment_id,input.capability]
    );
    await client.query('COMMIT');begun=false;
    if(rows?.[0]?.permitted!==true)throw new AuthError('forbidden',403);
    return Object.freeze({actor_user_id:identity.id,organization_id:input.organization_id,
      project_id:input.project_id,contract_id:input.contract_id,
      acting_appointment_id:input.acting_appointment_id,capability:input.capability});
   }catch(e){
    if(begun){try{await client.query('ROLLBACK');}catch{ /* preserve original error */ }}
    if(e instanceof AuthError)throw e;
    // Never expose SQL or tenant existence in error responses.
    throw new AuthError('authority_unavailable',503);
   }finally{client.release();}
  }
 });
}
