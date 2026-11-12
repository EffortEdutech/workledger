import test from 'node:test';
import assert from 'node:assert/strict';
import {createContractRegistry,createSyntheticStore,RegistryError,E02_CAPABILITIES} from '../src/registry.mjs';
const ids={org:'11111111-1111-4111-8111-111111111111',project:'22222222-2222-4222-8222-222222222222',
 contract:'33333333-3333-4333-8333-333333333333',revision:'44444444-4444-4444-8444-444444444444',
 party:'55555555-5555-4555-8555-555555555555',actor:'66666666-6666-4666-8666-666666666666',
 appointment:'77777777-7777-4777-8777-777777777777',evidence:'88888888-8888-4888-8888-888888888888',
 otherOrg:'99999999-9999-4999-8999-999999999999',otherParty:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 otherRevision:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'};
const SHA='c'.repeat(64), SHA2='d'.repeat(64);
const base=()=>({command_id:crypto.randomUUID(),idempotency_key:crypto.randomUUID(),
 organization_id:ids.org,project_id:ids.project,contract_id:ids.contract,acting_appointment_id:ids.appointment,
 expected_version:0,reason:'Controlled contract registration reviewed by authorised administrator'});
import crypto from 'node:crypto';
function register(extra={}){return {...base(),revision_id:ids.revision,revision_no:1,form_code:null,timezone:'Asia/Kuala_Lumpur',
 key_dates:{contract_date:'2026-11-12',commencement_date:null},party_ids:[ids.party],
 source_document_sha256:SHA,source_document_reference:'synthetic://source/contract-001',...extra};}
function seal(extra={}){return {...base(),expected_version:1,revision_id:ids.revision,
 signed_evidence_id:ids.evidence,signed_document_sha256:SHA2,signed_by_party_id:ids.party,...extra};}
function map(extra={}){return {...base(),revision_id:ids.revision,source_system:'contract_diary',source_instance_id:'cdp_dev_1',
 source_entity_type:'contract',source_record_id:'87',source_revision:'v1',...extra};}
function fixture(opts={}){
 const store=createSyntheticStore({contracts:[{organization_id:ids.org,project_id:ids.project,contract_id:ids.contract}],
  parties:[{organization_id:ids.org,project_id:ids.project,contract_id:ids.contract,party_id:ids.party}],
  beforeCommit:opts.beforeCommit});
 const allowed=opts.allowed??(()=>true);
 const registry=createContractRegistry({store,
  verifyAccessToken:async token=>{if(token==='valid')return {id:ids.actor};throw Error('bad token')},
  authorizeCapability:async q=>allowed(q),
  verifyDocumentEvidence:async q=>opts.evidence?.(q)??({verified:true,sha256:q.sha256,
   organization_id:q.organization_id,project_id:q.project_id,contract_id:q.contract_id,
   party_id:q.signed_by_party_id,verified_at:'2026-11-12T09:00:00Z'})});
 return {registry,store,run:(kind,command,authorization='Bearer valid')=>registry.execute({kind,command,authorization})};
}
async function reject(promise,code){await assert.rejects(promise,e=>e instanceof RegistryError&&e.code===code)}

test('01 register immutable, scoped candidate revision with pending audit/outbox/receipt',async()=>{
 const f=fixture(),r=await f.run('register',register());
 assert.equal(r.status,'registered_unsealed');assert.equal(f.store.snapshot().revisions.length,1);
 assert.equal(f.store.snapshot().events.length,1);assert.equal(f.store.snapshot().outbox.length,1);
 assert.equal(f.store.snapshot().outbox[0].dispatch_state,'pending');assert.equal(f.store.snapshot().receipts.length,1);
});
test('02 exact idempotent replay returns same event and no duplicate',async()=>{
 const f=fixture(),c=register(),first=await f.run('register',c);
 const replay=await f.run('register',{...c,command_id:crypto.randomUUID()});
 assert.deepEqual(first,replay);assert.equal(f.store.snapshot().events.length,1);
});
test('03 same key different payload denies conflict',async()=>{
 const f=fixture(),c=register();await f.run('register',c);
 await reject(f.run('register',{...c,reason:'A different reason for a different business command'}),'idempotency_conflict');
});
test('04 duplicate revision number in same contract denied',async()=>{
 const f=fixture();await f.run('register',register());await reject(f.run('register',register({revision_id:ids.otherRevision})),'revision_conflict');
});
test('05 duplicate revision UUID denied',async()=>{
 const f=fixture();await f.run('register',register());await reject(f.run('register',register()),'revision_conflict');
});
test('06 cross-tenant contract registration denied',async()=>{
 const f=fixture();await reject(f.run('register',register({organization_id:ids.otherOrg})),'scope_not_found');
});
test('07 unregistered party denied',async()=>{
 const f=fixture();await reject(f.run('register',register({party_ids:[ids.otherParty]})),'scope_not_found');
});
test('08 read capability does NOT grant revision create',async()=>{
 const f=fixture({allowed:q=>q.capability==='construction.contract.read'});
 await reject(f.run('register',register()),'forbidden');
});
test('09 actor ID cannot be supplied by browser command',async()=>{
 const f=fixture();await reject(f.run('register',register({actor_user_id:ids.actor})),'invalid_input');
});
test('10 reject invalid/forged bearer token',async()=>{
 const f=fixture();await reject(f.run('register',register(),'Bearer forged'),'unauthenticated');
 await reject(f.run('register',register(),'no bearer'),'unauthenticated');
});
test('11 reject malformed dates without inventing legal calendar defaults',async()=>{
 const f=fixture();await reject(f.run('register',register({key_dates:{contract_date:'2026-02-30'}})),'invalid_input');
});
test('12 reject float amount or unknown field in signed-revision metadata',async()=>{
 const f=fixture();await reject(f.run('register',register({contract_sum:100.2})),'invalid_input');
});
test('13 reject invalid timezone',async()=>{
 const f=fixture();await reject(f.run('register',register({timezone:'Mars/Utopia'})),'invalid_input');
});
test('14 reject version mismatch on register',async()=>{
 const f=fixture();await reject(f.run('register',register({expected_version:1})),'invalid_input');
});
test('15 seal fails if revision absent',async()=>{
 const f=fixture();await reject(f.run('seal',seal()),'scope_not_found');
});
test('16 trusted evidence receipt required, not client hash alone',async()=>{
 const f=fixture({evidence:()=>({verified:false})});await f.run('register',register());
 await reject(f.run('seal',seal()),'evidence_unverified');assert.equal(f.store.snapshot().seals.length,0);
});
test('17 wrong verified digest denied',async()=>{
 const f=fixture({evidence:q=>({verified:true,sha256:SHA,
 organization_id:q.organization_id,project_id:q.project_id,contract_id:q.contract_id,
 party_id:q.signed_by_party_id,verified_at:'2026-11-12T09:00:00Z'})});
 await f.run('register',register());await reject(f.run('seal',seal()),'evidence_unverified');
});
test('18 verified evidence for a different tenant denied',async()=>{
 const f=fixture({evidence:q=>({verified:true,sha256:q.sha256,organization_id:ids.otherOrg,
 project_id:q.project_id,contract_id:q.contract_id,party_id:q.signed_by_party_id,verified_at:'2026-11-12T09:00:00Z'})});
 await f.run('register',register());await reject(f.run('seal',seal()),'evidence_unverified');
});
test('19 seal creates immutable linked snapshot and audit record',async()=>{
 const f=fixture();await f.run('register',register());const result=await f.run('seal',seal());
 assert.equal(result.status,'sealed_evidence_recorded');assert.equal(f.store.snapshot().seals.length,1);
 assert.equal(f.store.snapshot().events.length,2);
});
test('20 second seal for same revision denied without replacement',async()=>{
 const f=fixture();await f.run('register',register());await f.run('seal',seal());
 await reject(f.run('seal',seal({signed_document_sha256:SHA})),'immutable_revision');
 assert.equal(f.store.snapshot().seals[0].signed_document_sha256,SHA2);
});
test('21 signed-by party must belong to exact contract revision',async()=>{
 const f=fixture();await f.run('register',register());await reject(f.run('seal',seal({signed_by_party_id:ids.otherParty})),'party_scope_mismatch');
});
test('22 source mapping preserves source instance namespace',async()=>{
 const f=fixture();await f.run('register',register());await f.run('map',map());
 await f.run('map',map({source_instance_id:'cdp_dev_2'}));assert.equal(f.store.snapshot().mappings.length,2);
});
test('23 duplicate mapping exact target is idempotent even with a new command key',async()=>{
 const f=fixture();await f.run('register',register());await f.run('map',map());await f.run('map',map());
 assert.equal(f.store.snapshot().mappings.length,1);
});
test('24 existing source key cannot map to another canonical revision',async()=>{
 const f=fixture();await f.run('register',register());await f.run('register',register({revision_id:ids.otherRevision,revision_no:2}));
 await f.run('map',map());await reject(f.run('map',map({revision_id:ids.otherRevision})),'source_crosswalk_conflict');
});
test('25 mapping cannot refer to other contract revision',async()=>{
 const f=fixture();await f.run('register',register());await reject(f.run('map',map({revision_id:ids.otherRevision})),'scope_not_found');
});
test('26 event failure rolls back all transactional records',async()=>{
 const f=fixture({beforeCommit:async()=>{throw Error('synthetic outbox failure')}});
 await assert.rejects(f.run('register',register()));assert.equal(f.store.snapshot().revisions.length,0);
 assert.equal(f.store.snapshot().events.length,0);assert.equal(f.store.snapshot().receipts.length,0);
});
test('27 parallel replay is serialised and produces exactly one event',async()=>{
 const f=fixture();const c=register();const r=await Promise.all(Array.from({length:10},()=>f.run('register',{...c,command_id:crypto.randomUUID()})));
 assert(r.every(x=>x.event_id===r[0].event_id));assert.equal(f.store.snapshot().events.length,1);
});
test('28 revocation between original and replay refuses new readback',async()=>{
 let active=true;const f=fixture({allowed:()=>active});const c=register();await f.run('register',c);active=false;
 await reject(f.run('register',c),'forbidden');
});
test('29 mapping input rejects empty source identity or extra privilege flags',async()=>{
 const f=fixture();await reject(f.run('map',map({source_record_id:''})),'invalid_input');
 await reject(f.run('map',map({is_owner:true})),'invalid_input');
});
test('30 capabilities have no commercial approval or legal service grants',()=>{
 assert.deepEqual(Object.keys(E02_CAPABILITIES).sort(),['map','register','seal']);
 assert(Object.values(E02_CAPABILITIES).every(s=>!s.includes('certificate')&&!s.includes('payment')&&!s.includes('legal')));
});
