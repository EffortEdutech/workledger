/** WLE-E01B candidate. SERVER ONLY: trusted getUser(token) + restricted writer connection.
 * This module is intentionally NOT imported into the WorkLedger Standard Vite app.
 * All writes to appointment, audit event, outbox and receipt share one transaction.
 * SQL GUCs are only server-context hints; they are NOT cryptographic auth tokens.
 */
import {createHash, randomUUID} from 'node:crypto';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA=/^[0-9a-f]{64}$/;
const CAPS=Object.freeze({
  subcontractor_submitter:['construction.contract.read','construction.diary.submit'],
  main_contractor_submitter:['construction.contract.read','construction.diary.submit'],
  main_contractor_reviewer:['construction.contract.read','construction.diary.acknowledge'],
  auditor:['construction.contract.read']
});
const ALLOW=Object.freeze({request:'construction.appointment.request',approve:'construction.appointment.approve',activate:'construction.appointment.grant',revoke:'construction.appointment.revoke'});
const BASE=['command_id','idempotency_key','organization_id','project_id','contract_id','acting_appointment_id','expected_version','reason'];
const ADD={request:['request_id','party_id','appointee_user_id','capacity','capabilities','effective_from','effective_until'],approve:['request_id'],activate:['request_id'],revoke:['appointment_id']};
const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(canon(v))).digest('hex');
export class CommandError extends Error{
 constructor(code,status){super(code);this.name='CommandError';this.code=code;this.status=status;}
}
const fail=(code,status=400)=>{throw new CommandError(code,status)};
function validate(kind,cmd){
 if(!Object.hasOwn(ADD,kind)||!cmd||typeof cmd!=='object'||Array.isArray(cmd))fail('invalid_input');
 const allowed=new Set([...BASE,...ADD[kind]]);
 if(Object.keys(cmd).some(k=>!allowed.has(k)))fail('invalid_input');
 for(const k of ['command_id','organization_id','project_id','contract_id','acting_appointment_id',...ADD[kind].filter(k=>k.endsWith('_id'))]){
  if(typeof cmd[k]!=='string'||!UUID.test(cmd[k]))fail('invalid_input');
 }
 if(typeof cmd.idempotency_key!=='string'||cmd.idempotency_key.length<8||cmd.idempotency_key.length>128)fail('invalid_input');
 if(!Number.isInteger(cmd.expected_version)||cmd.expected_version<0)fail('invalid_input');
 if(typeof cmd.reason!=='string'||cmd.reason.trim().length<8||cmd.reason.length>2000)fail('invalid_input');
 if(kind==='request'){
  if(cmd.expected_version!==0)fail('stale_version',409);
  if(!(cmd.capacity in CAPS))fail('forbidden',403);
  if(!Array.isArray(cmd.capabilities)||!cmd.capabilities.length||new Set(cmd.capabilities).size!==cmd.capabilities.length||
   cmd.capabilities.some(c=>!CAPS[cmd.capacity].includes(c)))fail('forbidden',403);
  if(!cmd.capabilities.includes('construction.contract.read'))fail('invalid_input');
  if(typeof cmd.effective_from!=='string'||!/^\d{4}-\d\d-\d\dT/.test(cmd.effective_from)||!Number.isFinite(Date.parse(cmd.effective_from)))fail('invalid_input');
  if(cmd.effective_until!==null && (typeof cmd.effective_until!=='string'||!Number.isFinite(Date.parse(cmd.effective_until))||Date.parse(cmd.effective_until)<=Date.parse(cmd.effective_from)))fail('invalid_input');
  if(Date.parse(cmd.effective_from)<Date.now()-60000)fail('invalid_input'); // no retroactive grant
 }
 return cmd;
}
async function verified(verifier,header){
 if(typeof header!=='string'||!/^Bearer [A-Za-z0-9._~+\/-]+=*$/.test(header))fail('unauthenticated',401);
 let principal;try{principal=await verifier(header.slice(7));}catch{fail('unauthenticated',401)}
 if(!principal||!UUID.test(principal.id||''))fail('unauthenticated',401);
 return principal.id;
}
async function one(client,sql,args=[]){const r=await client.query(sql,args);return r.rows?.[0]||null;}
async function checkPermission(client,cmd,cap){
 const manager=await one(client,`SELECT capacity FROM wle_e01.contract_appointments
  WHERE appointment_id=$1 AND organization_id=$2 AND project_id=$3 AND contract_id=$4`,
  [cmd.acting_appointment_id,cmd.organization_id,cmd.project_id,cmd.contract_id]);
 if(manager?.capacity!=='contract_admin')fail('forbidden',403);
 const r=await one(client,'SELECT wle_e01.can_act($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5::text) AS permitted',
  [cmd.organization_id,cmd.project_id,cmd.contract_id,cmd.acting_appointment_id,cap]);
 if(r?.permitted!==true)fail('forbidden',403);
}
async function addEvent(client,{cmd,actor,kind,eventId,payload,appointmentId=null}){
 const eventName='appointment.'+({request:'requested',approve:'approved',activate:'granted',revoke:'revoked'}[kind])+'.v1';
 const safe=canon({...payload,command_id:cmd.command_id,acting_appointment_id:cmd.acting_appointment_id,reason:cmd.reason});
 const sha=digest(safe);
 await client.query('INSERT INTO wle_e01.authority_events (event_id,organization_id,project_id,contract_id,appointment_id,actor_user_id,event_name,payload) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)',
  [eventId,cmd.organization_id,cmd.project_id,cmd.contract_id,appointmentId,actor,eventName,JSON.stringify(safe)]);
 await client.query('INSERT INTO wle_e01.authority_outbox (event_id,organization_id,contract_id,event_name,payload_sha256) VALUES ($1,$2,$3,$4,$5)',
  [eventId,cmd.organization_id,cmd.contract_id,eventName,sha]);
 return eventName;
}
async function commandLogic(client,kind,cmd,actor,eventId){
 if(kind==='request'){
  if(cmd.appointee_user_id===actor)fail('separation_of_duties',403);
  const target=await one(client,`SELECT 1 FROM wle_e01.organization_memberships WHERE organization_id=$1 AND user_id=$2 AND status='active'
   AND effective_from<=now() AND (effective_until IS NULL OR effective_until>now())`,[cmd.organization_id,cmd.appointee_user_id]);
  if(!target)fail('invalid_appointee',403);
  const party=await one(client,'SELECT 1 FROM wle_e01.contract_parties WHERE organization_id=$1 AND project_id=$2 AND contract_id=$3 AND party_id=$4',
   [cmd.organization_id,cmd.project_id,cmd.contract_id,cmd.party_id]);
  if(!party)fail('not_found',404);
  const grant=await one(client,`INSERT INTO wle_e01.appointment_requests
   (request_id,organization_id,project_id,contract_id,party_id,appointee_user_id,capacity,capabilities,effective_from,effective_until,request_reason,requester_user_id)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12) RETURNING version,status`,
   [cmd.request_id,cmd.organization_id,cmd.project_id,cmd.contract_id,cmd.party_id,cmd.appointee_user_id,cmd.capacity,
    JSON.stringify(cmd.capabilities),cmd.effective_from,cmd.effective_until,cmd.reason,actor]);
  await addEvent(client,{cmd,actor,kind,eventId,payload:{request_id:cmd.request_id,target_user_id:cmd.appointee_user_id,capacity:cmd.capacity}});
  return {request_id:cmd.request_id,status:grant.status,version:grant.version,event_id:eventId};
 }
 if(kind==='approve'){
  const req=await one(client,'SELECT * FROM wle_e01.appointment_requests WHERE request_id=$1 AND organization_id=$2 AND contract_id=$3 FOR UPDATE',
    [cmd.request_id,cmd.organization_id,cmd.contract_id]);
  if(!req)fail('not_found',404);
  if(req.status!=='pending')fail('invalid_transition',409);
  if(req.version!==cmd.expected_version)fail('stale_version',409);
  if(req.requester_user_id===actor||req.appointee_user_id===actor)fail('separation_of_duties',403);
  const updated=await one(client,`UPDATE wle_e01.appointment_requests SET status='approved',version=version+1,
    reviewer_user_id=$2,reviewer_appointment_id=$3,approved_at=now()
    WHERE request_id=$1 AND status='pending' AND version=$4 RETURNING version`,
   [cmd.request_id,actor,cmd.acting_appointment_id,cmd.expected_version]);
  if(!updated)fail('stale_version',409);
  await addEvent(client,{cmd,actor,kind,eventId,payload:{request_id:cmd.request_id,requester_user_id:req.requester_user_id}});
  return {request_id:cmd.request_id,status:'approved',version:updated.version,event_id:eventId};
 }
 if(kind==='activate'){
  const req=await one(client,'SELECT * FROM wle_e01.appointment_requests WHERE request_id=$1 AND organization_id=$2 AND contract_id=$3 FOR UPDATE',
    [cmd.request_id,cmd.organization_id,cmd.contract_id]);
  if(!req)fail('not_found',404);
  if(req.status!=='approved')fail('invalid_transition',409);
  if(req.version!==cmd.expected_version)fail('stale_version',409);
  if(req.requester_user_id!==actor||req.appointee_user_id===actor)fail('separation_of_duties',403);
  // Reviewer must STILL be eligible; a once-valid approval is not permanent authority.
  const reviewer=await one(client,`SELECT 1 FROM wle_e01.contract_appointments a
    JOIN wle_e01.organization_memberships m ON m.organization_id=a.organization_id AND m.user_id=a.appointee_user_id
    JOIN wle_e01.appointment_capabilities cp ON cp.appointment_id=a.appointment_id
    WHERE a.appointment_id=$1 AND a.appointee_user_id=$2 AND a.organization_id=$3 AND a.project_id=$4 AND a.contract_id=$5
     AND a.status='active' AND a.effective_from<=now() AND (a.effective_until IS NULL OR a.effective_until>now())
     AND m.status='active' AND m.effective_from<=now() AND (m.effective_until IS NULL OR m.effective_until>now())
     AND a.capacity='contract_admin' AND cp.capability='construction.appointment.approve'`,
   [req.reviewer_appointment_id,req.reviewer_user_id,cmd.organization_id,cmd.project_id,cmd.contract_id]);
  if(!reviewer)fail('approval_invalidated',403);
  const target=await one(client,`SELECT 1 FROM wle_e01.organization_memberships WHERE organization_id=$1 AND user_id=$2
    AND status='active' AND effective_from<=now() AND (effective_until IS NULL OR effective_until>now())`,
    [cmd.organization_id,req.appointee_user_id]);
  if(!target)fail('invalid_appointee',403);
  const appointmentId=randomUUID();
  const made=await one(client,`INSERT INTO wle_e01.contract_appointments
   (appointment_id,organization_id,project_id,contract_id,party_id,appointee_user_id,capacity,status,effective_from,effective_until,grant_event_id)
   VALUES ($1,$2,$3,$4,$5,$6,$7,'active',$8,$9,$10) RETURNING version`,
   [appointmentId,cmd.organization_id,cmd.project_id,cmd.contract_id,req.party_id,req.appointee_user_id,req.capacity,
    req.effective_from,req.effective_until,eventId]);
  for(const cap of req.capabilities){await client.query('INSERT INTO wle_e01.appointment_capabilities (appointment_id,capability) VALUES ($1,$2)',[appointmentId,cap]);}
  await client.query("UPDATE wle_e01.appointment_requests SET status='activated',version=version+1,activated_appointment_id=$2 WHERE request_id=$1 AND version=$3",
   [cmd.request_id,appointmentId,cmd.expected_version]);
  await addEvent(client,{cmd,actor,kind,eventId,appointmentId,payload:{request_id:cmd.request_id,appointment_id:appointmentId,reviewer_user_id:req.reviewer_user_id}});
  return {request_id:cmd.request_id,appointment_id:appointmentId,status:'active',version:made.version,event_id:eventId};
 }
 if(kind==='revoke'){
  const target=await one(client,`SELECT * FROM wle_e01.contract_appointments WHERE appointment_id=$1
   AND organization_id=$2 AND project_id=$3 AND contract_id=$4 FOR UPDATE`,
   [cmd.appointment_id,cmd.organization_id,cmd.project_id,cmd.contract_id]);
  if(!target)fail('not_found',404);
  if(target.appointee_user_id===actor)fail('separation_of_duties',403);
  if(target.status!=='active')fail('invalid_transition',409);
  if(target.version!==cmd.expected_version)fail('stale_version',409);
  const revoked=await one(client,`UPDATE wle_e01.contract_appointments SET status='revoked',revoked_at=now(),version=version+1
    WHERE appointment_id=$1 AND version=$2 AND status='active' RETURNING version`,[cmd.appointment_id,cmd.expected_version]);
  if(!revoked)fail('stale_version',409);
  await addEvent(client,{cmd,actor,kind,eventId,appointmentId:cmd.appointment_id,payload:{appointment_id:cmd.appointment_id,reason:cmd.reason}});
  return {appointment_id:cmd.appointment_id,status:'revoked',version:revoked.version,event_id:eventId};
 }
 fail('invalid_input');
}
/** The dedicated pool MUST hold one restricted PostgreSQL session for the entire transaction.
 * Never use postgres/service_role/superuser nor expose this module to browser routes.
 * The actual Supabase pool and two-identity JWT verification remain a staging acceptance gate.
 */
export function createAppointmentCommands({verifyAccessToken,pool}){
 if(typeof verifyAccessToken!=='function'||typeof pool?.connect!=='function')throw Error('server verifier + restricted writer pool required');
 return Object.freeze({
  async execute({authorization,kind,command}){
   const cmd=validate(kind,command);
   const actor=await verified(verifyAccessToken,authorization);
   let client;
   try{client=await pool.connect();}catch{fail('command_unavailable',503)}
   let begun=false;
   try{
    await client.query('BEGIN'); begun=true;
    await client.query("SELECT set_config('wle_e01.verified_user_id',$1,true)",[actor]);
    await client.query("SELECT set_config('wle_e01.admin_scope_org',$1,true)",[cmd.organization_id]);
    await client.query("SELECT set_config('wle_e01.admin_scope_contract',$1,true)",[cmd.contract_id]);
    await checkPermission(client,cmd,ALLOW[kind]);
    const hash=digest({kind,command:Object.fromEntries(Object.entries(cmd).filter(([k])=>k!=='command_id'))});
    const existing=await one(client,`SELECT command_sha256,receipt FROM wle_e01.authority_command_receipts
     WHERE organization_id=$1 AND actor_user_id=$2 AND idempotency_key=$3`,
     [cmd.organization_id,actor,cmd.idempotency_key]);
    if(existing){if(existing.command_sha256!==hash)fail('idempotency_conflict',409);
      await client.query('COMMIT');begun=false;return Object.freeze(existing.receipt);
    }
    const eventId=randomUUID();
    const receipt=await commandLogic(client,kind,cmd,actor,eventId);
    await client.query(`INSERT INTO wle_e01.authority_command_receipts
       (organization_id,actor_user_id,idempotency_key,command_type,command_sha256,receipt)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
       [cmd.organization_id,actor,cmd.idempotency_key,kind,hash,JSON.stringify(receipt)]);
    await client.query('COMMIT');begun=false;
    return Object.freeze(receipt);
   }catch(e){if(begun){try{await client.query('ROLLBACK')}catch{/* retain original */}}
    if(e instanceof CommandError)throw e;
    throw new CommandError('command_unavailable',503);
   }finally{client?.release()}
  }
 });
}
