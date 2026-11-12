import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {createAppointmentCommands,CommandError} from '../src/appointmentCommands.mjs';
const dir=dirname(fileURLToPath(import.meta.url));
const own=n=>readFileSync(resolve(dir,'..','sql',n),'utf8');
const prior=n=>readFileSync(resolve(dir,'..','..','wle-e01','sql',n),'utf8');
const id=(p,n)=>p+'0000000-0000-4000-8000-'+String(n).padStart(12,'0');
const o=id('1',1),oB=id('2',1),p=id('1',2),pB=id('2',2),c=id('1',3),cB=id('2',3),party=id('1',10),partyB=id('2',10);
const requester=id('1',20),reviewer=id('1',21),target=id('1',22),outsider=id('2',20),memberNoGrant=id('1',23);
const aRequest=id('1',30),aReview=id('1',31),aB=id('2',31),aNo=id('1',32);
let pg, service;let actor=requester;
async function admin(sql,args=[]){await pg.exec('RESET ROLE');return pg.query(sql,args)}
function adapter(){return {connect:async()=>({query:async(sql,args=[])=>{
 if(sql==='BEGIN'){await pg.exec('BEGIN'); await pg.exec('SET LOCAL ROLE wle_e01_appointment_writer'); return {rows:[]};}
 return pg.query(sql,args);},release(){} })}}
function input(kind,override={}){
 const shared={command_id:randomUUID(),idempotency_key:'test-'+randomUUID(),organization_id:o,project_id:p,contract_id:c,acting_appointment_id:actor===reviewer?aReview:actor===outsider?aB:actor===memberNoGrant?aNo:aRequest,reason:'Approved operational purpose',expected_version:kind==='request'?0:kind==='approve'?1:kind==='activate'?2:1};
 const details=kind==='request'?{request_id:randomUUID(),party_id:party,appointee_user_id:target,capacity:'subcontractor_submitter',capabilities:['construction.contract.read','construction.diary.submit'],effective_from:new Date(Date.now()-1000).toISOString(),effective_until:null}:kind==='revoke'?{appointment_id:aNo}:{request_id:randomUUID()};
 return {...shared,...details,...override};
}
const run=(kind,command,who=requester)=>{actor=who;return service.execute({authorization:'Bearer test.token',kind,command:{...command,acting_appointment_id:who===reviewer?aReview:who===outsider?aB:who===memberNoGrant?aNo:aRequest}})};
const deny=async(promise,code)=>await assert.rejects(promise,e=>e instanceof CommandError&&e.code===code);
const count=async(table)=>Number((await admin('SELECT COUNT(*)::int AS n FROM wle_e01.'+table)).rows[0].n);
let req1,grant1;
before(async()=>{
 pg=new PGlite();
 await pg.exec(prior('000_TEST_ONLY_create_roles.sql'));
 await pg.exec(prior('001_canonical_tenant_appointment_rls.sql'));
 await pg.exec(own('000_TEST_ONLY_writer_role.sql'));
 await pg.exec(own('002_appointment_command_candidate.sql'));
 await pg.exec(`INSERT INTO wle_e01.organizations(organization_id,display_name,status) VALUES ('${o}','Test A','active'),('${oB}','Test B','active');
 INSERT INTO wle_e01.projects VALUES('${o}','${p}','Site A'),('${oB}','${pB}','Site B');
 INSERT INTO wle_e01.construction_contracts VALUES('${o}','${p}','${c}','Works A','active'),('${oB}','${pB}','${cB}','Works B','active');
 INSERT INTO wle_e01.contract_parties VALUES('${o}','${p}','${c}','${party}','Contractor A'),('${oB}','${pB}','${cB}','${partyB}','Contractor B');
 INSERT INTO wle_e01.organization_memberships VALUES
 ('${o}','${requester}','active','2020-01-01',NULL),('${o}','${reviewer}','active','2020-01-01',NULL),
 ('${o}','${target}','active','2020-01-01',NULL),('${o}','${memberNoGrant}','active','2020-01-01',NULL),
 ('${oB}','${outsider}','active','2020-01-01',NULL);
 INSERT INTO wle_e01.contract_appointments (appointment_id,organization_id,project_id,contract_id,party_id,appointee_user_id,capacity,status,effective_from) VALUES
 ('${aRequest}','${o}','${p}','${c}','${party}','${requester}','contract_admin','active','2020-01-01'),
 ('${aReview}','${o}','${p}','${c}','${party}','${reviewer}','contract_admin','active','2020-01-01'),
 ('${aNo}','${o}','${p}','${c}','${party}','${memberNoGrant}','contract_admin','active','2020-01-01'),
 ('${aB}','${oB}','${pB}','${cB}','${partyB}','${outsider}','contract_admin','active','2020-01-01');
 INSERT INTO wle_e01.appointment_capabilities VALUES
 ('${aRequest}','construction.appointment.request'),('${aRequest}','construction.appointment.grant'),('${aRequest}','construction.appointment.revoke'),
 ('${aReview}','construction.appointment.approve'),('${aReview}','construction.appointment.revoke'),
 ('${aB}','construction.appointment.request'),('${aNo}','construction.contract.read');
 `);
 service=createAppointmentCommands({verifyAccessToken:async()=>({id:actor}),pool:adapter()});
});
after(async()=>await pg?.close());

test('E01B-PG01 schema: 11 private FORCE RLS tables',async()=>{
 const rows=(await admin("SELECT relname,relrowsecurity,relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='wle_e01' AND relkind='r'")).rows;
 assert.equal(rows.length,11);assert.ok(rows.every(r=>r.relrowsecurity&&r.relforcerowsecurity));
});
test('E01B-PG02 a grant request writes one audit, outbox and receipt',async()=>{
 req1=input('request');const x=await run('request',req1);assert.equal(x.status,'pending');assert.equal(x.version,1);
 assert.equal(await count('appointment_requests'),1);assert.equal(await count('authority_events'),1);assert.equal(await count('authority_outbox'),1);assert.equal(await count('authority_command_receipts'),1);
});
test('E01B-PG03 replay same business command is idempotent',async()=>{
 const y=await run('request',{...req1,command_id:randomUUID()});assert.equal(y.request_id,req1.request_id);
 assert.equal(await count('authority_events'),1);assert.equal(await count('appointment_requests'),1);
});
test('E01B-PG04 key collision with changed payload fails',async()=>{
 await deny(run('request',{...req1,reason:'Changed operational justification'}),'idempotency_conflict');assert.equal(await count('authority_events'),1);
});
test('E01B-PG05 forged tenant rejected and cannot write',async()=>{
 await deny(run('request',input('request',{organization_id:oB,project_id:pB,contract_id:cB,party_id:partyB})),'forbidden');
 assert.equal(await count('authority_events'),1);
});
test('E01B-PG06 requester cannot request a grant to self',async()=>{
 await deny(run('request',input('request',{appointee_user_id:requester})),'separation_of_duties');
});
test('E01B-PG07 high risk privilege cannot be requested',async()=>{
 await deny(run('request',input('request',{capabilities:['construction.contract.read','construction.payment.record']})),'forbidden');
});
test('E01B-PG08 unappointed org member cannot create request',async()=>{
 await deny(run('request',input('request'),memberNoGrant),'forbidden');
});
test('E01B-PG09 requester cannot approve own request',async()=>{
 await deny(run('approve',input('approve',{request_id:req1.request_id}),requester),'forbidden');
});
test('E01B-PG10 independent reviewer approves exact pending request',async()=>{
 const a=await run('approve',input('approve',{request_id:req1.request_id}),reviewer);
 assert.equal(a.status,'approved');assert.equal(a.version,2);
 assert.equal(await count('authority_events'),2);assert.equal(await count('authority_outbox'),2);
});
test('E01B-PG11 stale approval fails closed',async()=>{
 await deny(run('approve',input('approve',{request_id:req1.request_id}),reviewer),'invalid_transition');
});
test('E01B-PG12 unauthorized outsider cannot activate',async()=>{
 await deny(run('activate',input('activate',{request_id:req1.request_id}),outsider),'forbidden');
});
test('E01B-PG13 original requester activates independently approved grant',async()=>{
 grant1=await run('activate',input('activate',{request_id:req1.request_id}),requester);
 assert.equal(grant1.status,'active');assert.ok(grant1.appointment_id);
 assert.equal(await count('authority_events'),3);assert.equal(await count('authority_outbox'),3);
 const row=(await admin('SELECT status,version FROM wle_e01.contract_appointments WHERE appointment_id=$1',[grant1.appointment_id])).rows[0];
 assert.equal(row.status,'active');assert.equal(row.version,1);
});
test('E01B-PG14 target has exactly requested granted caps',async()=>{
 const caps=(await admin('SELECT capability FROM wle_e01.appointment_capabilities WHERE appointment_id=$1 ORDER BY capability',[grant1.appointment_id])).rows.map(r=>r.capability);
 assert.deepEqual(caps,['construction.contract.read','construction.diary.submit']);
});
test('E01B-PG15 cannot activate same request twice',async()=>{
 await deny(run('activate',input('activate',{request_id:req1.request_id})),'invalid_transition');
});
test('E01B-PG16 requester revokes subject; event and outbox are atomic',async()=>{
 const a=await run('revoke',input('revoke',{appointment_id:grant1.appointment_id}));
 assert.equal(a.status,'revoked');assert.equal(a.version,2);
 assert.equal(await count('authority_events'),4);assert.equal(await count('authority_outbox'),4);
});
test('E01B-PG17 revocation is visible to restricted E01 gateway immediately',async()=>{
 await pg.query("SELECT set_config('wle_e01.verified_user_id',$1,false)",[target]);
 await pg.exec('SET ROLE wle_e01_gateway');
 try{const r=await pg.query('SELECT wle_e01.can_act($1,$2,$3,$4,$5) AS permitted',[o,p,c,grant1.appointment_id,'construction.diary.submit']);assert.equal(r.rows[0].permitted,false)}finally{await pg.exec('RESET ROLE');await pg.exec('RESET wle_e01.verified_user_id')}
});
test('E01B-PG18 second revocation rejected',async()=>{
 await deny(run('revoke',input('revoke',{appointment_id:grant1.appointment_id,expected_version:2})),'not_found');
});
test('E01B-PG19 writer role cannot delete immutable events/outbox',async()=>{
 await pg.exec('BEGIN');await pg.exec('SET LOCAL ROLE wle_e01_appointment_writer');
 await assert.rejects(()=>pg.query('DELETE FROM wle_e01.authority_events'));
 await pg.exec('ROLLBACK');
});
test('E01B-PG20 browser role cannot read private staging tables',async()=>{
 const rows=(await admin("SELECT has_schema_privilege('authenticated','wle_e01','USAGE') AS allowed")).rows;
 assert.equal(rows[0].allowed,false);
});
test('E01B-PG21 DB failure before outbox insert rolls back request and audit',async()=>{
 await pg.exec('RESET ROLE');
 await pg.exec(`CREATE FUNCTION wle_e01.fail_e01b_outbox() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic forced outbox failure'; END $$;
 CREATE TRIGGER e01b_fail_outbox BEFORE INSERT ON wle_e01.authority_outbox FOR EACH ROW EXECUTE FUNCTION wle_e01.fail_e01b_outbox();`);
 const before=[await count('appointment_requests'),await count('authority_events')];
 await deny(run('request',input('request')),'command_unavailable');
 await admin('DROP TRIGGER e01b_fail_outbox ON wle_e01.authority_outbox');
 assert.deepEqual([await count('appointment_requests'),await count('authority_events')],before);
});
test('E01B-PG22 approval invalidated when reviewer loses authority',async()=>{
 const request=input('request');await run('request',request);
 await run('approve',input('approve',{request_id:request.request_id}),reviewer);
 await admin("UPDATE wle_e01.contract_appointments SET status='revoked',revoked_at=now(),version=version+1 WHERE appointment_id=$1",[aReview]);
 await deny(run('activate',input('activate',{request_id:request.request_id})),'approval_invalidated');
 const state=(await admin('SELECT status FROM wle_e01.appointment_requests WHERE request_id=$1',[request.request_id])).rows[0];assert.equal(state.status,'approved');
});
test('E01B-PG23 revoke cannot target own appointment',async()=>{
 await deny(run('revoke',input('revoke',{appointment_id:aRequest})),'separation_of_duties');
});
test('E01B-PG24 no writer privilege to alter membership',async()=>{
 await pg.exec('BEGIN');await pg.exec('SET LOCAL ROLE wle_e01_appointment_writer');
 await assert.rejects(()=>pg.query("UPDATE wle_e01.organization_memberships SET status='active' WHERE user_id=$1",[target]));await pg.exec('ROLLBACK');
});


test('E01B-PG25 revoked grant rollback if outbox insert fails',async()=>{
 const eventsBefore=await count('authority_events');
 await pg.exec('RESET ROLE');
 await pg.exec(`CREATE TRIGGER e01b_fail_outbox BEFORE INSERT ON wle_e01.authority_outbox FOR EACH ROW EXECUTE FUNCTION wle_e01.fail_e01b_outbox()`);
 await deny(run('revoke',input('revoke',{appointment_id:aNo,expected_version:1})),'command_unavailable');
 await admin('DROP TRIGGER e01b_fail_outbox ON wle_e01.authority_outbox');
 const state=(await admin('SELECT status,version FROM wle_e01.contract_appointments WHERE appointment_id=$1',[aNo])).rows[0];
 assert.equal(state.status,'active');assert.equal(state.version,1);assert.equal(await count('authority_events'),eventsBefore);
});

test('E01B-PG26 activation rejects target whose membership became suspended',async()=>{
 await admin("UPDATE wle_e01.contract_appointments SET status='active',revoked_at=NULL WHERE appointment_id=$1",[aReview]); // disposable test admin setup only
 const pending=input('request');await run('request',pending);
 await run('approve',input('approve',{request_id:pending.request_id}),reviewer);
 await admin("UPDATE wle_e01.organization_memberships SET status='suspended' WHERE organization_id=$1 AND user_id=$2",[o,target]);
 await deny(run('activate',input('activate',{request_id:pending.request_id})),'invalid_appointee');
 const row=(await admin('SELECT status FROM wle_e01.appointment_requests WHERE request_id=$1',[pending.request_id])).rows[0];
 assert.equal(row.status,'approved');
 await admin("UPDATE wle_e01.organization_memberships SET status='active' WHERE organization_id=$1 AND user_id=$2",[o,target]);
});
test('E01B-PG27 backdated entitlement request is invalid',async()=>{
 await deny(run('request',input('request',{effective_from:'2020-01-01T00:00:00Z'})),'invalid_input');
});
