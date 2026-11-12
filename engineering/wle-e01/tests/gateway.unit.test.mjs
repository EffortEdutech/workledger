import test from 'node:test';
import assert from 'node:assert/strict';
import {AuthError,createAuthorisationGateway,createSupabaseVerifier} from '../src/gateway.mjs';
const ids={user:'10000000-0000-4000-8000-000000000001',org:'10000000-0000-4000-8000-000000000002',project:'10000000-0000-4000-8000-000000000003',contract:'10000000-0000-4000-8000-000000000004',appointment:'10000000-0000-4000-8000-000000000005'};
const scope={organization_id:ids.org,project_id:ids.project,contract_id:ids.contract,acting_appointment_id:ids.appointment,capability:'construction.diary.acknowledge'};
function fixture({allowed=true,verifier=async()=>({id:ids.user}),dbError=null}={}){
 const calls=[];let released=0;
 const client={query:async(sql,args=[])=>{calls.push({sql,args});if(dbError&&sql.includes('can_act'))throw dbError;return {rows:sql.includes('can_act')?[{permitted:allowed}]:[]};},release:()=>{released++;}};
 const pool={connect:async()=>client};
 const gateway=createAuthorisationGateway({verifyAccessToken:verifier,pool});
 return {gateway,calls,getReleased:()=>released};
}
async function denied(promise,code,status){await assert.rejects(promise,e=>e instanceof AuthError&&e.code===code&&e.status===status);}

test('E01-U01: verified bearer + exact appointment and capability grants',async()=>{
 const f=fixture(); const receipt=await f.gateway.authorize({authorization:'Bearer good.jwt.token',scope});
 assert.equal(receipt.actor_user_id,ids.user);assert.equal(receipt.capability,scope.capability);
 assert.deepEqual(f.calls.map(x=>x.sql),['BEGIN READ ONLY',"SELECT set_config('wle_e01.verified_user_id',$1,true)",'SELECT wle_e01.can_act($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5::text) AS permitted','COMMIT']);
 assert.deepEqual(f.calls[1].args,[ids.user]);assert.equal(f.getReleased(),1);
});
test('E01-U02: no bearer header rejected before DB connection',async()=>{const f=fixture();await denied(f.gateway.authorize({authorization:'',scope}),'unauthenticated',401);assert.equal(f.calls.length,0);});
test('E01-U03: case-sensitive Bearer format rejects Basic token',async()=>{const f=fixture();await denied(f.gateway.authorize({authorization:'Basic abc',scope}),'unauthenticated',401);});
test('E01-U04: verifier exception fails authentication closed',async()=>{const f=fixture({verifier:async()=>{throw Error('secret');}});await denied(f.gateway.authorize({authorization:'Bearer aaaa',scope}),'unauthenticated',401);});
test('E01-U05: verifier returning invalid user ID fails closed',async()=>{const f=fixture({verifier:async()=>({id:'not-a-uuid'})});await denied(f.gateway.authorize({authorization:'Bearer aaaa',scope}),'unauthenticated',401);});
test('E01-U06: DB denial maps to forbidden without leaking contracts',async()=>{const f=fixture({allowed:false});await denied(f.gateway.authorize({authorization:'Bearer aaaa',scope}),'forbidden',403);assert.equal(f.getReleased(),1);});
test('E01-U07: SQL error maps to generic unavailable and rolls back',async()=>{const f=fixture({dbError:Error('sensitive table contents')});await denied(f.gateway.authorize({authorization:'Bearer aaaa',scope}),'authority_unavailable',503);assert.equal(f.calls.at(-1).sql,'ROLLBACK');assert.equal(f.getReleased(),1);});
test('E01-U08: forged actor_user_id is rejected before verification',async()=>{const f=fixture();await denied(f.gateway.authorize({authorization:'Bearer aaaa',scope:{...scope,actor_user_id:ids.user}}),'invalid_input',400);assert.equal(f.calls.length,0);});
test('E01-U09: client-supplied role is rejected',async()=>{const f=fixture();await denied(f.gateway.authorize({authorization:'Bearer aaaa',scope:{...scope,role:'admin'}}),'invalid_input',400);});
test('E01-U10: client-supplied approved_by is rejected',async()=>{const f=fixture();await denied(f.gateway.authorize({authorization:'Bearer aaaa',scope:{...scope,approved_by:ids.user}}),'invalid_input',400);});
test('E01-U11: unexpected input keys are rejected',async()=>{const f=fixture();await denied(f.gateway.authorize({authorization:'Bearer aaaa',scope:{...scope,password:'x'}}),'invalid_input',400);});
test('E01-U12: missing contract_id is rejected',async()=>{const f=fixture();const {contract_id,...s}=scope;await denied(f.gateway.authorize({authorization:'Bearer aaaa',scope:s}),'invalid_input',400);});
test('E01-U13: invalid appointment UUID rejected',async()=>{const f=fixture();await denied(f.gateway.authorize({authorization:'Bearer aaaa',scope:{...scope,acting_appointment_id:'1'}}),'invalid_input',400);});
test('E01-U14: arbitrary capability key is rejected',async()=>{const f=fixture();await denied(f.gateway.authorize({authorization:'Bearer aaaa',scope:{...scope,capability:'construction.all.admin'}}),'invalid_input',400);});
test('E01-U15: approved capability other than diary is supported',async()=>{const f=fixture();const a=await f.gateway.authorize({authorization:'Bearer aaaa',scope:{...scope,capability:'construction.contract.read'}});assert.equal(a.capability,'construction.contract.read');});
test('E01-U16: bad gateway dependencies rejected',()=>assert.throws(()=>createAuthorisationGateway({verifyAccessToken:null,pool:{}})));
test('E01-U17: Supabase verifier uses getUser(token) server check',async()=>{const seen=[];const fn=createSupabaseVerifier({auth:{getUser:async(token)=>{seen.push(token);return {data:{user:{id:ids.user}},error:null};}}});assert.deepEqual(await fn('aaa'),{id:ids.user});assert.deepEqual(seen,['aaa']);});
test('E01-U18: Supabase verifier rejects auth errors',async()=>{const fn=createSupabaseVerifier({auth:{getUser:async()=>({data:{user:null},error:Error('denied')})}});await denied(fn('abc'),'unauthenticated',401);});
test('E01-U19: Supabase verifier must have a server auth client',()=>assert.throws(()=>createSupabaseVerifier({})));
test('E01-U20: frozen response cannot be mutated',async()=>{const f=fixture();const v=await f.gateway.authorize({authorization:'Bearer aaaa',scope});assert.equal(Object.isFrozen(v),true);});
