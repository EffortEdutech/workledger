// PostgreSQL 18.6 WASM engine (PGlite) RLS verification, synthetic data ONLY.
// Not a substitute for live Supabase project RLS, network, IAM or storage tests.
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {PGlite} from '@electric-sql/pglite';
import {createAuthorisationGateway,AuthError} from '../src/gateway.mjs';
const dir=dirname(fileURLToPath(import.meta.url));
const sql=(p)=>readFileSync(resolve(dir,'..','sql',p),'utf8');
const U=(prefix,n)=>`${prefix}0000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const oA=U('1',1),oB=U('2',1),pA=U('1',2),pB=U('2',2),cA=U('1',3),cB=U('2',3),cA2=U('1',4);
const partyA=U('1',10),partyA2=U('1',11),partyB=U('2',10);
const userMC=U('1',20),userSub=U('1',21),userAdmin=U('1',22),userRev=U('1',23),userExp=U('1',24),userProp=U('1',25),userB=U('2',20),outsider=U('3',20);
const appMC=U('1',30),appSub=U('1',31),appRev=U('1',32),appExp=U('1',33),appProp=U('1',34),appB=U('2',30);
let pg;
async function as(actor,query,args=[]){
 await pg.exec('RESET ROLE');
 await pg.query("SELECT set_config('wle_e01.verified_user_id',$1,false)",[actor]);
 await pg.exec('SET ROLE wle_e01_gateway');
 try{return await pg.query(query,args);}finally{await pg.exec('RESET ROLE');await pg.exec('RESET wle_e01.verified_user_id');}
}
async function asRole(role,actor,query,args=[]){
 await pg.exec('RESET ROLE');
 await pg.query("SELECT set_config('wle_e01.verified_user_id',$1,false)",[actor]);
 await pg.exec(`SET ROLE ${role}`);
 try{return await pg.query(query,args);}finally{await pg.exec('RESET ROLE');await pg.exec('RESET wle_e01.verified_user_id');}
}
const can=(org,prj,c,app,cap='construction.contract.read')=>`SELECT wle_e01.can_act('${org}'::uuid,'${prj}'::uuid,'${c}'::uuid,'${app}'::uuid,'${cap}'::text) AS permitted`;

before(async()=>{
 pg=new PGlite();
 await pg.exec(sql('000_TEST_ONLY_create_roles.sql'));
 await pg.exec(sql('001_canonical_tenant_appointment_rls.sql'));
 await pg.exec(`
 INSERT INTO wle_e01.organizations (organization_id,display_name,status) VALUES
 ('${oA}','Contractor A','active'),('${oB}','Contractor B','active');
 INSERT INTO wle_e01.projects (organization_id,project_id,project_name) VALUES
 ('${oA}','${pA}','Project 1'),('${oB}','${pB}','Project 1');
 INSERT INTO wle_e01.construction_contracts VALUES
 ('${oA}','${pA}','${cA}','Contract A','active'),
 ('${oA}','${pA}','${cA2}','Contract A2','active'),
 ('${oB}','${pB}','${cB}','Contract B','active');
 INSERT INTO wle_e01.contract_parties VALUES
 ('${oA}','${pA}','${cA}','${partyA}','Main contractor'),
 ('${oA}','${pA}','${cA2}','${partyA2}','Main contractor'),
 ('${oB}','${pB}','${cB}','${partyB}','Main contractor');
 INSERT INTO wle_e01.organization_memberships VALUES
 ('${oA}','${userMC}','active','2020-01-01',NULL),
 ('${oA}','${userSub}','active','2020-01-01',NULL),
 ('${oA}','${userAdmin}','active','2020-01-01',NULL),
 ('${oA}','${userRev}','active','2020-01-01',NULL),
 ('${oA}','${userExp}','active','2020-01-01',NULL),
 ('${oA}','${userProp}','active','2020-01-01',NULL),
 ('${oB}','${userB}','active','2020-01-01',NULL);
 INSERT INTO wle_e01.contract_appointments
 (appointment_id,organization_id,project_id,contract_id,party_id,appointee_user_id,capacity,status,effective_from,effective_until,revoked_at)
 VALUES
 ('${appMC}','${oA}','${pA}','${cA}','${partyA}','${userMC}','main_contractor_reviewer','active','2020-01-01',NULL,NULL),
 ('${appSub}','${oA}','${pA}','${cA}','${partyA}','${userSub}','subcontractor_submitter','active','2020-01-01',NULL,NULL),
 ('${appRev}','${oA}','${pA}','${cA}','${partyA}','${userRev}','main_contractor_reviewer','revoked','2020-01-01',NULL,'2026-11-01'),
 ('${appExp}','${oA}','${pA}','${cA}','${partyA}','${userExp}','main_contractor_reviewer','active','2020-01-01','2021-01-01',NULL),
 ('${appProp}','${oA}','${pA}','${cA}','${partyA}','${userProp}','main_contractor_reviewer','proposed','2020-01-01',NULL,NULL),
 ('${appB}','${oB}','${pB}','${cB}','${partyB}','${userB}','main_contractor_reviewer','active','2020-01-01',NULL,NULL);
 INSERT INTO wle_e01.appointment_capabilities VALUES
 ('${appMC}','construction.contract.read'),('${appMC}','construction.diary.acknowledge'),
 ('${appSub}','construction.contract.read'),('${appSub}','construction.diary.submit'),
 ('${appRev}','construction.contract.read'),('${appRev}','construction.diary.acknowledge'),
 ('${appExp}','construction.contract.read'),('${appExp}','construction.diary.acknowledge'),
 ('${appProp}','construction.contract.read'),('${appProp}','construction.diary.acknowledge'),
 ('${appB}','construction.contract.read');
 `);
});
after(async()=>pg?.close());

test('E01-D01: all eight tables have FORCE RLS enabled',async()=>{const {rows}=await pg.query("SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='wle_e01' AND c.relkind='r'");assert.equal(rows.length,8);assert.ok(rows.every(x=>x.relrowsecurity&&x.relforcerowsecurity));});
test('E01-D02: both helpers are SECURITY INVOKER, not definer',async()=>{const {rows}=await pg.query("SELECT proname,prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='wle_e01'");assert.equal(rows.length,2);assert.ok(rows.every(x=>x.prosecdef===false));});
test('E01-D03: live appointed MC can read own contract',async()=>{const {rows}=await as(userMC,'SELECT contract_id FROM wle_e01.construction_contracts');assert.deepEqual(rows.map(x=>x.contract_id),[cA]);});
test('E01-D04: cross-tenant contract is not visible',async()=>{const {rows}=await as(userMC,'SELECT contract_id FROM wle_e01.construction_contracts WHERE contract_id=$1',[cB]);assert.equal(rows.length,0);});
test('E01-D05: same tenant other contract without appointment hidden',async()=>{const {rows}=await as(userMC,'SELECT contract_id FROM wle_e01.construction_contracts WHERE contract_id=$1',[cA2]);assert.equal(rows.length,0);});
test('E01-D06: org admin membership alone does not confer contract read',async()=>{const {rows}=await as(userAdmin,'SELECT * FROM wle_e01.construction_contracts');assert.equal(rows.length,0);});
test('E01-D07: valid MC reviewer can acknowledge exact contract',async()=>{const {rows}=await as(userMC,can(oA,pA,cA,appMC,'construction.diary.acknowledge'));assert.equal(rows[0].permitted,true);});
test('E01-D08: subcontractor cannot acknowledge',async()=>{const {rows}=await as(userSub,can(oA,pA,cA,appSub,'construction.diary.acknowledge'));assert.equal(rows[0].permitted,false);});
test('E01-D09: subcontractor can submit diary with own capability',async()=>{const {rows}=await as(userSub,can(oA,pA,cA,appSub,'construction.diary.submit'));assert.equal(rows[0].permitted,true);});
test('E01-D10: appointment cannot be used by different user',async()=>{const {rows}=await as(userSub,can(oA,pA,cA,appMC,'construction.diary.acknowledge'));assert.equal(rows[0].permitted,false);});
test('E01-D11: wrong project or organization denies',async()=>{const {rows:a}=await as(userMC,can(oB,pA,cA,appMC));const {rows:b}=await as(userMC,can(oA,pB,cA,appMC));assert.equal(a[0].permitted,false);assert.equal(b[0].permitted,false);});
test('E01-D12: revoked appointment denied',async()=>{const {rows}=await as(userRev,can(oA,pA,cA,appRev,'construction.diary.acknowledge'));assert.equal(rows[0].permitted,false);});
test('E01-D13: expired appointment denied',async()=>{const {rows}=await as(userExp,can(oA,pA,cA,appExp,'construction.diary.acknowledge'));assert.equal(rows[0].permitted,false);});
test('E01-D14: proposed appointment denied',async()=>{const {rows}=await as(userProp,can(oA,pA,cA,appProp,'construction.diary.acknowledge'));assert.equal(rows[0].permitted,false);});
test('E01-D15: outsider cannot read organisation or appointments',async()=>{const {rows:a}=await as(outsider,'SELECT * FROM wle_e01.organizations');const {rows:b}=await as(outsider,'SELECT * FROM wle_e01.contract_appointments');assert.equal(a.length,0);assert.equal(b.length,0);});
test('E01-D16: valid reviewer only sees their own appointment and caps',async()=>{const {rows:a}=await as(userMC,'SELECT appointment_id FROM wle_e01.contract_appointments');const {rows:b}=await as(userMC,'SELECT capability FROM wle_e01.appointment_capabilities');assert.equal(a.length,1);assert.equal(a[0].appointment_id,appMC);assert.equal(b.length,2);});
test('E01-D17: private browser authenticated role denied schema',async()=>{const {rows}=await pg.query("SELECT has_schema_privilege('authenticated','wle_e01','USAGE') AS granted");assert.equal(rows[0].granted,false);await assert.rejects(()=>asRole('authenticated',userMC,'SELECT * FROM wle_e01.construction_contracts'));});
test('E01-D18: gateway SELECT-only role cannot mutate appointment',async()=>{await assert.rejects(()=>as(userMC,"UPDATE wle_e01.contract_appointments SET status='revoked' WHERE appointment_id=$1",[appMC]));});
test('E01-D19: gateway cannot grant self payment authority',async()=>{await assert.rejects(()=>as(userMC,"INSERT INTO wle_e01.appointment_capabilities VALUES ($1,'construction.commercial.certify')",[appMC]));});
test('E01-D20: gateway cannot read audit events',async()=>{await assert.rejects(()=>as(userMC,'SELECT * FROM wle_e01.authority_events'));});
test('E01-D21: composite FK rejects cross-tenant contract mapping',async()=>{await assert.rejects(()=>pg.query('INSERT INTO wle_e01.construction_contracts VALUES ($1,$2,$3,$4,$5)',[oA,pB,U('1',55),'Forged','active']));});
test('E01-D22: composite FK rejects wrong-party appointment',async()=>{await assert.rejects(()=>pg.query(`INSERT INTO wle_e01.contract_appointments(appointment_id,organization_id,project_id,contract_id,party_id,appointee_user_id,capacity,status,effective_from) VALUES($1,$2,$3,$4,$5,$6,'auditor','active',now())`,[U('1',56),oA,pA,cA,partyB,userMC]));});
test('E01-D23: duplicate organisation membership cannot be silently added',async()=>{await assert.rejects(()=>pg.query("INSERT INTO wle_e01.organization_memberships VALUES($1,$2,'active',now(),NULL)",[oA,userMC]));});
test('E01-D24: accepted role sees only same-tenant project metadata',async()=>{const {rows}=await as(userMC,'SELECT project_id FROM wle_e01.projects');assert.deepEqual(rows.map(x=>x.project_id),[pA]);});
test('E01-D25: revoked membership immediately denies previously valid appointment',async()=>{const before=(await as(userMC,can(oA,pA,cA,appMC))).rows[0].permitted;assert.equal(before,true);await pg.query("UPDATE wle_e01.organization_memberships SET status='revoked' WHERE organization_id=$1 AND user_id=$2",[oA,userMC]);const after=(await as(userMC,can(oA,pA,cA,appMC))).rows[0].permitted;assert.equal(after,false);});
test('E01-D26: revoked membership also hides contract records',async()=>{const {rows}=await as(userMC,'SELECT * FROM wle_e01.construction_contracts');assert.equal(rows.length,0);});
test('E01-D27: contract same as another tenant mapped to different party is rejected by FK',async()=>{await assert.rejects(()=>pg.query('INSERT INTO wle_e01.contract_parties VALUES($1,$2,$3,$4,$5)',[oA,pA,cB,U('1',66),'Forged']));});


// Real PostgreSQL RLS + real gateway transaction, with a TEST-ONLY token verifier.
// No external JWT, HTTP endpoint, or production Supabase is exercised.
function makePgGateway(verifiedUser) {
 const pool={connect:async()=>({query:(query,args)=>pg.query(query,args),release:()=>{}})};
 return createAuthorisationGateway({verifyAccessToken:async()=>({id:verifiedUser}),pool});
}
async function gatewayAs(user,scope,shouldAllow) {
 await pg.exec('RESET ROLE');
 await pg.exec('SET ROLE wle_e01_gateway');
 try {
   const promise=makePgGateway(user).authorize({authorization:'Bearer synthetic.test.token',scope});
   if(shouldAllow) {
      const result=await promise;
      assert.equal(result.actor_user_id,user);
      assert.equal(result.contract_id,scope.contract_id);
   } else {
      await assert.rejects(promise,e=>e instanceof AuthError&&e.code==='forbidden'&&e.status===403);
   }
 }finally{await pg.exec('RESET ROLE');await pg.exec('RESET wle_e01.verified_user_id');}
}

test('E01-D28: actual gateway transaction allowed by PostgreSQL RLS',async()=>{
 await gatewayAs(userB,{organization_id:oB,project_id:pB,contract_id:cB,acting_appointment_id:appB,capability:'construction.contract.read'},true);
});
test('E01-D29: actual gateway transaction denied across tenants',async()=>{
 await gatewayAs(userB,{organization_id:oA,project_id:pA,contract_id:cA,acting_appointment_id:appMC,capability:'construction.contract.read'},false);
});
test('E01-D30: actual gateway denies formerly valid member after revocation',async()=>{
 await pg.query("UPDATE wle_e01.organization_memberships SET status='revoked' WHERE organization_id=$1 AND user_id=$2",[oB,userB]);
 await gatewayAs(userB,{organization_id:oB,project_id:pB,contract_id:cB,acting_appointment_id:appB,capability:'construction.contract.read'},false);
});
