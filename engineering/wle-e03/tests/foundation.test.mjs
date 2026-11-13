import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {createEvidenceFoundation,createSyntheticEvidenceStore,EvidenceError,canonicalDigest,E03_CAPABILITIES} from '../src/foundation.mjs';
const ids={org:'11111111-1111-4111-8111-111111111111',project:'22222222-2222-4222-8222-222222222222',contract:'33333333-3333-4333-8333-333333333333',
 otherOrg:'99999999-9999-4999-8999-999999999999',otherContract:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',actor:'66666666-6666-4666-8666-666666666666',
 reviewer:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',appointment:'77777777-7777-4777-8777-777777777777',evidence:'88888888-8888-4888-8888-888888888888',parent:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
 hold:'ffffffff-ffff-4fff-8fff-ffffffffffff',export:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',party:'cccccccc-cccc-4ccc-8ccc-cccccccccccc'};
const original=Buffer.from('%PDF-1.4\nE03 ORIGINAL CONTRACT EVIDENCE\n%%EOF','utf8');
const redacted=Buffer.from('%PDF-1.4\nE03 REDACTED DERIVATIVE\n%%EOF','utf8');
const hash=b=>createHash('sha256').update(b).digest('hex');
const scope={organization_id:ids.org,project_id:ids.project,contract_id:ids.contract};
const base=()=>({...scope,acting_appointment_id:ids.appointment,command_id:randomUUID(),idempotency_key:randomUUID(),reason:'Evidence custody action with documented business purpose'});
const preserve=(extra={})=>({...base(),evidence_id:ids.evidence,source_record_type:'contract_revision',source_record_id:'rev-1',
 original_filename:'contract.pdf',declared_media_type:'application/pdf',expected_sha256:hash(original),captured_at:null,occurred_at:'2026-11-12T09:00:00Z',
 retention_class:'unassigned',visibility_scope:'restricted',provenance_source:'direct_upload',...extra});
const redact=(extra={})=>({...base(),evidence_id:ids.parent,parent_evidence_id:ids.evidence,original_filename:'redacted.pdf',
 declared_media_type:'application/pdf',redaction_reason:'Remove personal information for disclosure',...extra});
const hold=(extra={})=>({...base(),evidence_id:ids.evidence,hold_id:ids.hold,case_reference:'CASE-2026-001',hold_class:'legal',...extra});
const release=(extra={})=>({...base(),evidence_id:ids.evidence,hold_id:ids.hold,review_reference:'APPROVAL-REVIEW-001',...extra});
const exp=(extra={})=>({...base(),export_id:ids.export,evidence_ids:[ids.evidence],purpose:'Contract evidence audit export',...extra});
function fixture({allowed=()=>true,review=()=>true,signer=null,beforeCommit=null,otherContract=false,actor=ids.actor}={}){
 const store=createSyntheticEvidenceStore({contractScopes:[scope,...(otherContract?[{...scope,contract_id:ids.otherContract}]:[])],beforeCommit});
 const engine=createEvidenceFoundation({store,verifyAccessToken:async token=>{if(token==='valid')return {id:actor};throw Error('bad token')},
 authorizeCapability:async data=>allowed(data),approveHoldRelease:review,verifyPartySigner:signer});
 const run=(kind,command,bytes,authorization='Bearer valid')=>engine.execute({kind,command,bytes,authorization});
 const ready=()=>run('preserve',preserve(),original);
 return {store,engine,run,ready};
}
const deny=(p,code)=>assert.rejects(p,e=>e instanceof EvidenceError && e.code===code);
test('01 original bytes are SHA-256 verified and preserved with scoped storage key',async()=>{
 const f=fixture(),r=await f.ready(),s=f.store.snapshot();assert.equal(r.sha256,hash(original));
 assert.equal(r.size_bytes,original.length);assert.equal(s.assets.length,1);
 assert.ok(s.assets[0].storage_object_key.includes(ids.contract));assert.equal(s.assets[0].sha256,hash(original));
});
test('02 authoritative hash rejects mismatched client claim',async()=>{
 const f=fixture();await deny(f.run('preserve',preserve({expected_sha256:'0'.repeat(64)}),original),'digest_mismatch');
 assert.equal(f.store.snapshot().assets.length,0);
});
test('03 no bytes is rejected',async()=>{await deny(fixture().run('preserve',preserve()),'invalid_bytes')});
test('04 empty bytes are rejected',async()=>{await deny(fixture().run('preserve',preserve(),Buffer.alloc(0)),'invalid_bytes')});
test('05 wrong organization contract is refused',async()=>{await deny(fixture().run('preserve',preserve({organization_id:ids.otherOrg}),original),'scope_not_found')});
test('06 sibling contract not registered in scope is refused',async()=>{await deny(fixture().run('preserve',preserve({contract_id:ids.otherContract}),original),'scope_not_found')});
test('07 read-only appointment does not grant preserve',async()=>{await deny(fixture({allowed:q=>q.capability===E03_CAPABILITIES.verify}).ready(),'forbidden')});
test('08 forged actor ID in command is rejected',async()=>{await deny(fixture().run('preserve',preserve({actor_user_id:ids.actor}),original),'invalid_input')});
test('09 invalid bearer rejected',async()=>{await deny(fixture().run('preserve',preserve(),original,'Bearer forged'),'unauthenticated')});
test('10 no bearer rejected',async()=>{await deny(fixture().run('preserve',preserve(),original,'invalid'),'unauthenticated')});
test('11 untrusted storage key in payload rejected',async()=>{await deny(fixture().run('preserve',preserve({storage_object_key:'outside'}),original),'invalid_input')});
test('12 filename path traversal rejected',async()=>{await deny(fixture().run('preserve',preserve({original_filename:'../../etc/passwd'}),original),'invalid_input')});
test('13 conflicting evidence UUID is not overwritten',async()=>{const f=fixture();await f.ready();await deny(f.run('preserve',preserve(),original),'evidence_conflict')});
test('14 exact retry returns original receipt without duplicate audit',async()=>{
 const f=fixture(),cmd=preserve();const a=await f.run('preserve',cmd,original);const b=await f.run('preserve',{...cmd,command_id:randomUUID()},original);
 assert.deepEqual(a,b);assert.equal(f.store.snapshot().events.length,1);
});
test('15 identical key altered bytes fail idempotency',async()=>{
 const f=fixture(),cmd=preserve();await f.run('preserve',cmd,original);
 await deny(f.run('preserve',{...cmd,expected_sha256:hash(redacted)},redacted),'idempotency_conflict');
});
test('16 duplicate retry concurrency creates one event',async()=>{
 const f=fixture(),cmd=preserve();const x=await Promise.all(Array.from({length:12},()=>f.run('preserve',{...cmd,command_id:randomUUID()},original)));
 assert.equal(new Set(x.map(y=>y.event_id)).size,1);assert.equal(f.store.snapshot().events.length,1);
});
test('17 event and outbox and receipt are atomic in synthetic engine',async()=>{
 const f=fixture();await f.ready();const s=f.store.snapshot();assert.equal(s.events.length,1);assert.equal(s.outbox.length,1);
 assert.equal(s.receipts.length,1);assert.equal(s.outbox[0].dispatch_state,'pending');
});
test('18 injected commit failure rolls back both bytes and metadata synthetic',async()=>{
 const f=fixture({beforeCommit:()=>{throw Error('fault')}});
 await assert.rejects(f.ready());const s=f.store.snapshot();assert.equal(s.assets.length,0);assert.equal(s.object_count,0);
 assert.equal(s.events.length,0);assert.equal(s.outbox.length,0);assert.equal(s.receipts.length,0);
});
test('19 online verification recomputes digest of stored original',async()=>{
 const f=fixture();await f.ready();const result=await f.engine.verifyOriginal({authorization:'Bearer valid',...scope,acting_appointment_id:ids.appointment,evidence_id:ids.evidence});
 assert.equal(result.byte_integrity_verified,true);assert.equal(result.signature_validity,'not_assessed');
});
test('20 unauthorized read denied even when evidence exists',async()=>{
 const f=fixture({allowed:({capability})=>capability!==E03_CAPABILITIES.verify});await f.ready();
 await deny(f.engine.verifyOriginal({authorization:'Bearer valid',...scope,acting_appointment_id:ids.appointment,evidence_id:ids.evidence}),'forbidden');
});
test('21 wrong tenant read refused',async()=>{
 const f=fixture();await f.ready();await deny(f.engine.verifyOriginal({authorization:'Bearer valid',...scope,organization_id:ids.otherOrg,acting_appointment_id:ids.appointment,evidence_id:ids.evidence}),'evidence_not_found');
});
test('22 corrupt bytes are caught by rehash on every read',async()=>{
 const f=fixture();await f.ready();const k=f.store.snapshot().assets[0].storage_object_key;f.store.tamperBlobForTest(k,redacted);
 await deny(f.engine.verifyOriginal({authorization:'Bearer valid',...scope,acting_appointment_id:ids.appointment,evidence_id:ids.evidence}),'integrity_failed');
});
test('23 redaction produces separate new bytes, never overwrites original',async()=>{
 const f=fixture();await f.ready();const r=await f.run('redact',redact(),redacted);
 assert.equal(r.sha256,hash(redacted));const s=f.store.snapshot();assert.equal(s.assets.length,2);assert.equal(s.object_count,2);
 assert.equal(s.assets.find(a=>a.evidence_id===ids.evidence).sha256,hash(original));
 assert.equal(s.assets.find(a=>a.evidence_id===ids.parent).redaction_parent_id,ids.evidence);
});
test('24 identical bytes cannot be called redacted derivative',async()=>{const f=fixture();await f.ready();await deny(f.run('redact',redact(),original),'redaction_unchanged')});
test('25 redaction of sibling-contract parent refused',async()=>{const f=fixture({otherContract:true});await f.ready();await deny(f.run('redact',redact({contract_id:ids.otherContract}),redacted),'evidence_not_found')});
test('26 original bytes are checked before redacting',async()=>{
 const f=fixture();await f.ready();f.store.tamperBlobForTest(f.store.snapshot().assets[0].storage_object_key,redacted);
 await deny(f.run('redact',redact(),Buffer.from('another redaction')),'integrity_failed');
});
test('27 a legal hold is appended and visible in a read, not default retention',async()=>{
 const f=fixture();await f.ready();await f.run('place_hold',hold());const s=f.store.snapshot();assert.equal(s.holds[0].status,'active');
 assert.equal((await f.engine.verifyOriginal({authorization:'Bearer valid',...scope,acting_appointment_id:ids.appointment,evidence_id:ids.evidence})).active_holds,1);
 assert.equal(s.assets[0].retention_class,'unassigned');
});
test('28 placing a hold requires explicit capability',async()=>{const f=fixture({allowed:q=>q.capability!==E03_CAPABILITIES.place_hold});await f.ready();await deny(f.run('place_hold',hold()),'forbidden')});
test('29 cannot place duplicate hold UUID',async()=>{const f=fixture();await f.ready();await f.run('place_hold',hold());await deny(f.run('place_hold',hold()),'hold_conflict')});
test('30 cannot release own hold',async()=>{const f=fixture();await f.ready();await f.run('place_hold',hold());await deny(f.run('release_hold',release()),'separation_of_duties')});
test('31 independent reviewer required to release',async()=>{
 const f=fixture({review:()=>false});await f.ready();await f.run('place_hold',hold());
 // reviewer has a separate verified identity/appointment via test fixture override
 const separate=createEvidenceFoundation({store:f.store,verifyAccessToken:async()=>({id:ids.reviewer}),authorizeCapability:async()=>true,approveHoldRelease:()=>false});
 await deny(separate.execute({authorization:'Bearer valid',kind:'release_hold',command:release()}),'independent_review_required');
});
test('32 separate reviewer can release with independent policy; history remains',async()=>{
 const f=fixture();await f.ready();await f.run('place_hold',hold());
 const sep=createEvidenceFoundation({store:f.store,verifyAccessToken:async()=>({id:ids.reviewer}),authorizeCapability:async()=>true,approveHoldRelease:()=>true});
 const r=await sep.execute({authorization:'Bearer valid',kind:'release_hold',command:release()});assert.equal(r.status,'released');
 const s=f.store.snapshot();assert.equal(s.holds.length,1);assert.equal(s.holds[0].placed_by,ids.actor);assert.equal(s.holds[0].released_by,ids.reviewer);
 assert.equal(s.events.length,3);
});
test('33 second hold release is prohibited',async()=>{
 const f=fixture();await f.ready();await f.run('place_hold',hold());
 const sep=createEvidenceFoundation({store:f.store,verifyAccessToken:async()=>({id:ids.reviewer}),authorizeCapability:async()=>true,approveHoldRelease:()=>true});
 await sep.execute({authorization:'Bearer valid',kind:'release_hold',command:release()});await deny(sep.execute({authorization:'Bearer valid',kind:'release_hold',command:release()}),'hold_already_released');
});
test('34 missing hold release fails',async()=>{const f=fixture();await f.ready();await deny(f.run('release_hold',release()),'hold_not_found')});
test('35 export manifest hashes exact scoped items and audit chain head',async()=>{
 const f=fixture();await f.ready();await f.run('place_hold',hold());const r=await f.run('export_manifest',exp());
 assert.equal(r.item_count,1);assert.equal(r.manifest_sha256,canonicalDigest(r.manifest));
 assert.equal(r.manifest.items[0].active_hold_ids[0],ids.hold);assert.equal(r.manifest.items[0].sha256,hash(original));
});
test('36 export rejects missing cross-contract evidence',async()=>{const f=fixture();await f.ready();await deny(f.run('export_manifest',exp({evidence_ids:[ids.parent]})),'evidence_not_found')});
test('37 export rehash detects corruption',async()=>{
 const f=fixture();await f.ready();f.store.tamperBlobForTest(f.store.snapshot().assets[0].storage_object_key,redacted);
 await deny(f.run('export_manifest',exp()),'integrity_failed');
});
test('38 audit chain verifies deterministic event hash links',async()=>{
 const f=fixture();await f.ready();await f.run('place_hold',hold());await f.run('export_manifest',exp());
 const v=await f.engine.verifyAuditChain(scope);assert.equal(v.valid,true);assert.equal(v.count,3);assert.equal(v.head,f.store.snapshot().events.at(-1).event_hash);
});
test('39 audit chain is tenant-scoped',async()=>{const f=fixture();await f.ready();const v=await f.engine.verifyAuditChain({...scope,organization_id:ids.otherOrg});assert.equal(v.count,0)});
test('40 E02 port refuses signer verification when no signer provider',async()=>{
 const f=fixture();await f.ready();let proof;
 await f.store.transaction(async tx=>{proof=await f.engine.verifyForE02({tx,actor_user_id:ids.actor,evidence_id:ids.evidence,sha256:hash(original),signed_by_party_id:ids.party,...scope})});
 assert.equal(proof.verified,false);
});
test('41 E02 port refuses wrong file digest',async()=>{
 const f=fixture({signer:()=>({verified:true,party_id:ids.party,...scope,verified_at:'2026-11-13T00:00:00Z'})});await f.ready();let proof;
 await f.store.transaction(async tx=>{proof=await f.engine.verifyForE02({tx,actor_user_id:ids.actor,evidence_id:ids.evidence,sha256:'d'.repeat(64),signed_by_party_id:ids.party,...scope})});
 assert.equal(proof.verified,false);
});
test('42 E02 port refuses wrong signer-party scope',async()=>{
 const f=fixture({signer:()=>({verified:true,party_id:ids.reviewer,...scope,verified_at:'2026-11-13T00:00:00Z'})});await f.ready();let proof;
 await f.store.transaction(async tx=>{proof=await f.engine.verifyForE02({tx,actor_user_id:ids.actor,evidence_id:ids.evidence,sha256:hash(original),signed_by_party_id:ids.party,...scope})});
 assert.equal(proof.verified,false);
});
test('43 E02 port returns scoped evidence only with independent party proof; no legal claim',async()=>{
 const f=fixture({signer:()=>({verified:true,party_id:ids.party,...scope,verified_at:'2026-11-13T00:00:00Z'})});await f.ready();let proof;
 await f.store.transaction(async tx=>{proof=await f.engine.verifyForE02({tx,actor_user_id:ids.actor,evidence_id:ids.evidence,sha256:hash(original),signed_by_party_id:ids.party,...scope})});
 assert.equal(proof.verified,true);assert.equal(proof.signature_validity,'not_assessed');assert.equal(proof.byte_integrity_verified,true);
});
test('44 duplicate export UUID cannot overwrite',async()=>{const f=fixture();await f.ready();await f.run('export_manifest',exp());await deny(f.run('export_manifest',exp()),'export_conflict')});
test('45 unrelated paid/commercial/legal service power is absent',()=>{assert.ok(!Object.values(E03_CAPABILITIES).some(v=>/certif|payment|service_notice|cipaa/.test(v)))});
