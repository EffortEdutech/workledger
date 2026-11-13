import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {createDiaryService,createSyntheticDiaryStore,DiaryError,DIARY_CAPABILITIES} from '../src/diary.mjs';
import {createOfflineDiaryQueue} from '../src/offlineQueue.mjs';
const I={org:'11111111-1111-4111-8111-111111111111',project:'22222222-2222-4222-8222-222222222222',contract:'33333333-3333-4333-8333-333333333333',
 diary:'44444444-4444-4444-8444-444444444444',otherDiary:'55555555-5555-4555-8555-555555555555',submitter:'66666666-6666-4666-8666-666666666666',reviewer:'77777777-7777-4777-8777-777777777777',
 appointment:'88888888-8888-4888-8888-888888888888',otherOrg:'99999999-9999-4999-8999-999999999999',otherContract:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',evidence:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',outsider:'cccccccc-cccc-4ccc-8ccc-cccccccccccc'};
const S={organization_id:I.org,project_id:I.project,contract_id:I.contract};
const FACTS={weather_conditions:'Rainy',site_conditions:'Wet working surface',work_progress:'Installed formwork at Level 2',manpower:[{trade:'Carpenter',count:4,hours:'8.0'}],equipment:[{type:'Crane',count:1}],materials_delivered:[{material:'Concrete',unit:'m3',quantity:'12.500'}],issues_delays:'Temporary pause due to rainfall'};
const base=(extras={})=>({...S,diary_id:I.diary,acting_appointment_id:I.appointment,expected_version:0,reason:'Documented daily site diary factual update',idempotency_key:randomUUID(),command_id:randomUUID(),...extras});
const draft=(extras={})=>base({diary_date:'2026-11-12',shift_code:'day',facts:structuredClone(FACTS),...extras});
const attach=(v,extras={})=>base({expected_version:v,evidence_id:I.evidence,evidence_sha256:'a'.repeat(64),...extras});
const submit=(v,extras={})=>base({expected_version:v,...extras});
const ack=(v,extras={})=>base({expected_version:v,acknowledgement_note:'Received and acknowledged as factual diary',...extras});
function fixture(opts={}){
 const store=createSyntheticDiaryStore({contractScopes:[S,...(opts.sibling?[{...S,contract_id:I.otherContract}]:[])],beforeCommit:opts.beforeCommit,clock:()=> '2026-11-13T00:00:00Z'});
 const tokens={submitter:I.submitter,reviewer:I.reviewer,outsider:I.outsider};
 const svc=createDiaryService({store,verifyAccessToken:async t=>{if(!tokens[t])throw Error('bad token');return {id:tokens[t]};},
  authorizeCapability:async a=>opts.auth?opts.auth(a):a.actor_user_id===I.submitter?{allowed:true,capacity:'subcontractor_submitter'}:
    a.actor_user_id===I.reviewer?{allowed:true,capacity:'main_contractor_reviewer'}:{allowed:false,capacity:null},
  verifyEvidence:async a=>opts.verifyEvidence?opts.verifyEvidence(a):({...a,evidence_id:a.evidence_id,sha256:a.sha256,verified:true,byte_integrity_verified:true})});
 const run=(kind,command,who='submitter')=>svc.execute({kind,command,authorization:'Bearer '+who});
 const create=()=>run('sync_draft',draft());
 return {store,svc,run,create};
}
const reject=(p,code)=>assert.rejects(p,e=>e instanceof DiaryError&&e.code===code);
test('01: draft creates scoped record, event, pending outbox, receipt',async()=>{const f=fixture(),r=await f.create(),s=f.store.snapshot();assert.equal(r.status,'draft');assert.equal(r.version,1);assert.equal(s.diaries.length,1);assert.equal(s.events.length,1);assert.equal(s.outbox[0].dispatch_state,'pending');assert.equal(s.receipts.length,1);});
test('02: diary fields preserve detailed manpower equipment materials weather',async()=>{const f=fixture();await f.create();assert.deepEqual(f.store.snapshot().diaries[0].facts,FACTS);});
test('03: exact idempotency replay produces same receipt/event',async()=>{const f=fixture(),c=draft(),a=await f.run('sync_draft',c),b=await f.run('sync_draft',{...c,command_id:randomUUID()});assert.deepEqual(a,b);assert.equal(f.store.snapshot().events.length,1);});
test('04: same idempotency key changed payload is conflict',async()=>{const f=fixture(),c=draft();await f.run('sync_draft',c);await reject(f.run('sync_draft',{...c,facts:{...FACTS,work_progress:'Altered'}}),'idempotency_conflict');});
test('05: cannot create duplicate contract/date/shift',async()=>{const f=fixture();await f.create();await reject(f.run('sync_draft',draft({diary_id:I.otherDiary})),'date_shift_conflict');});
test('06: different shift on same contract/date is a distinct diary candidate',async()=>{const f=fixture();await f.create();await f.run('sync_draft',draft({diary_id:I.otherDiary,shift_code:'night'}));assert.equal(f.store.snapshot().diaries.length,2);});
test('07: cross-org deny',async()=>{const f=fixture();await reject(f.run('sync_draft',draft({organization_id:I.otherOrg})),'scope_not_found');});
test('08: sibling contract mismatch deny',async()=>{const f=fixture();await reject(f.run('sync_draft',draft({contract_id:I.otherContract})),'scope_not_found');});
test('09: forged actor field denied',async()=>{const f=fixture();await reject(f.run('sync_draft',draft({actor_user_id:I.submitter})),'invalid_input');});
test('10: forged capacity or privilege field denied',async()=>{const f=fixture();await reject(f.run('sync_draft',draft({is_admin:true})),'invalid_input');});
test('11: invalid token denied',async()=>{const f=fixture();await reject(f.run('sync_draft',draft(),'nobody'),'unauthenticated');});
test('12: reviewer cannot submitter-sync draft',async()=>{const f=fixture();await reject(f.run('sync_draft',draft(),'reviewer'),'forbidden');});
test('13: read-only capability denied',async()=>{const f=fixture({auth:()=>({allowed:false,capacity:'subcontractor_submitter'})});await reject(f.create(),'forbidden');});
test('14: revoked appointment denies on replay',async()=>{let active=true;const f=fixture({auth:a=>({allowed:active,capacity:'subcontractor_submitter'})}),c=draft();await f.run('sync_draft',c);active=false;await reject(f.run('sync_draft',c),'forbidden');});
test('15: initial version cannot be nonzero',async()=>{const f=fixture();await reject(f.run('sync_draft',draft({expected_version:1})),'stale_version');});
test('16: draft patch with correct optimistic version succeeds',async()=>{const f=fixture();await f.create();const r=await f.run('sync_draft',draft({expected_version:1,facts:{...FACTS,work_progress:'New measurable site note'}}));assert.equal(r.version,2);});
test('17: stale version conflicting offline edit rejected and existing text retained',async()=>{const f=fixture();await f.create();await reject(f.run('sync_draft',draft({expected_version:0,facts:{...FACTS,work_progress:'Stale edit'}})),'stale_version');assert.equal(f.store.snapshot().diaries[0].facts.work_progress,FACTS.work_progress);});
test('18: diary date cannot be silently changed',async()=>{const f=fixture();await f.create();await reject(f.run('sync_draft',draft({expected_version:1,diary_date:'2026-11-11'})),'identity_immutable');});
test('19: invalid nonexistent calendar day rejected',async()=>{const f=fixture();await reject(f.run('sync_draft',draft({diary_date:'2026-02-30'})),'invalid_input');});
test('20: inconsistent manpower quantities rejected',async()=>{const f=fixture();await reject(f.run('sync_draft',draft({facts:{...FACTS,manpower:[{trade:'Mason',count:-1,hours:'8'}]}})),'invalid_facts');});
test('21: numeric float material quantity rejected',async()=>{const f=fixture();await reject(f.run('sync_draft',draft({facts:{...FACTS,materials_delivered:[{material:'Cement',unit:'bag',quantity:1.7}]}})),'invalid_facts');});
test('22: submit requires weather',async()=>{const f=fixture();await f.run('sync_draft',draft({facts:{...FACTS,weather_conditions:null}}));await reject(f.run('submit',submit(1)),'incomplete_diary');});
test('23: submit requires work progress text',async()=>{const f=fixture();await f.run('sync_draft',draft({facts:{...FACTS,work_progress:null}}));await reject(f.run('submit',submit(1)),'incomplete_diary');});
test('24: draft submit locks data, immutable snapshot status and version',async()=>{const f=fixture();await f.create();const r=await f.run('submit',submit(1));assert.equal(r.status,'submitted');assert.equal(r.version,2);const s=f.store.snapshot().diaries[0];assert.equal(s.submitted_by,I.submitter);assert.ok(s.submitted_at);});
test('25: submitted diary cannot be edited',async()=>{const f=fixture();await f.create();await f.run('submit',submit(1));await reject(f.run('sync_draft',draft({expected_version:2})),'locked_diary');});
test('26: submitted diary cannot be submitted twice with fresh key',async()=>{const f=fixture();await f.create();await f.run('submit',submit(1));await reject(f.run('submit',submit(2)),'invalid_transition');});
test('27: reviewer cannot submit diary',async()=>{const f=fixture();await f.create();await reject(f.run('submit',submit(1),'reviewer'),'forbidden');});
test('28: trusted E03 evidence scope and digest attaches before submission',async()=>{const f=fixture();await f.create();const r=await f.run('attach_evidence',attach(1));assert.equal(r.version,2);assert.deepEqual(f.store.snapshot().diaries[0].evidence_ids,[I.evidence]);});
test('29: evidence verifier false denies',async()=>{const f=fixture({verifyEvidence:()=>({verified:false})});await f.create();await reject(f.run('attach_evidence',attach(1)),'evidence_unverified');});
test('30: evidence verifier wrong tenant denies',async()=>{const f=fixture({verifyEvidence:a=>({...a,organization_id:I.otherOrg,verified:true,byte_integrity_verified:true})});await f.create();await reject(f.run('attach_evidence',attach(1)),'evidence_unverified');});
test('31: evidence verifier wrong hash denies',async()=>{const f=fixture({verifyEvidence:a=>({...a,sha256:'b'.repeat(64),verified:true,byte_integrity_verified:true})});await f.create();await reject(f.run('attach_evidence',attach(1)),'evidence_unverified');});
test('32: evidence verifier not byte-verified denies',async()=>{const f=fixture({verifyEvidence:a=>({...a,verified:true,byte_integrity_verified:false})});await f.create();await reject(f.run('attach_evidence',attach(1)),'evidence_unverified');});
test('33: duplicate evidence attachment denied',async()=>{const f=fixture();await f.create();await f.run('attach_evidence',attach(1));await reject(f.run('attach_evidence',attach(2)),'evidence_already_linked');});
test('34: cannot attach evidence after submission',async()=>{const f=fixture();await f.create();await f.run('submit',submit(1));await reject(f.run('attach_evidence',attach(2)),'locked_diary');});
test('35: reviewer acknowledges submitted diary with independent actor',async()=>{const f=fixture();await f.create();await f.run('submit',submit(1));const r=await f.run('acknowledge',ack(2),'reviewer');assert.equal(r.version,3);assert.equal(r.status,'acknowledged');assert.equal(f.store.snapshot().diaries[0].acknowledged_by,I.reviewer);});
test('36: submitter cannot acknowledge even with capability spoof',async()=>{const f=fixture();await f.create();await f.run('submit',submit(1));await reject(f.run('acknowledge',ack(2)),'forbidden');});
test('37: same submitter with reviewer role still cannot self-acknowledge',async()=>{const f=fixture({auth:a=>({allowed:true,capacity:a.capability===DIARY_CAPABILITIES.acknowledge?'main_contractor_reviewer':'subcontractor_submitter'})});await f.create();await f.run('submit',submit(1));await reject(f.run('acknowledge',ack(2)),'separation_of_duties');});
test('38: cannot acknowledge draft',async()=>{const f=fixture();await f.create();await reject(f.run('acknowledge',ack(1),'reviewer'),'invalid_transition');});
test('39: acknowledged diary cannot change',async()=>{const f=fixture();await f.create();await f.run('submit',submit(1));await f.run('acknowledge',ack(2),'reviewer');await reject(f.run('sync_draft',draft({expected_version:3})),'locked_diary');});
test('40: receipt replay on acknowledge is exact and no extra event',async()=>{const f=fixture();await f.create();await f.run('submit',submit(1));const c=ack(2),a=await f.run('acknowledge',c,'reviewer'),b=await f.run('acknowledge',{...c,command_id:randomUUID()},'reviewer');assert.deepEqual(a,b);assert.equal(f.store.snapshot().events.length,3);});
test('41: audit events form deterministic linked chain within scope',async()=>{const f=fixture();await f.create();await f.run('submit',submit(1));await f.run('acknowledge',ack(2),'reviewer');const [a,b,c]=f.store.snapshot().events;assert.equal(a.previous_event_sha256,null);assert.equal(b.previous_event_sha256,a.event_sha256);assert.equal(c.previous_event_sha256,b.event_sha256);});
test('42: fault injection rolls back diary, audit and receipt',async()=>{const f=fixture({beforeCommit:()=>{throw Error('synthetic outbox failure')}});await assert.rejects(f.create());const s=f.store.snapshot();assert.equal(s.diaries.length,0);assert.equal(s.events.length,0);assert.equal(s.receipts.length,0);});
test('43: in-process concurrent duplicate draft attempts collapse to one event',async()=>{const f=fixture(),c=draft(),r=await Promise.all(Array.from({length:12},()=>f.run('sync_draft',{...c,command_id:randomUUID()})));assert.equal(new Set(r.map(x=>x.event_id)).size,1);assert.equal(f.store.snapshot().events.length,1);});
test('44: no payment certificate/CIPAA authority in diary capabilities',()=>{assert.ok(!JSON.stringify(DIARY_CAPABILITIES).includes('certificate'));assert.ok(!JSON.stringify(DIARY_CAPABILITIES).includes('cipaa'));});
test('45: offline queue captures drafts without auth/token',()=>{const q=createOfflineDiaryQueue(),r=q.queueDraft({...S,diary_id:I.diary,diary_date:'2026-11-12',shift_code:'day',facts:FACTS});assert.equal(r.expected_version,0);assert.equal(q.pending().queued.length,1);assert.ok(!JSON.stringify(q.pending()).includes('Bearer'));});
test('46: offline draft record is stable and has no online authority',()=>{const q=createOfflineDiaryQueue(),a=q.queueDraft({...S,diary_id:I.diary,diary_date:'2026-11-12',shift_code:'day',facts:FACTS});const c=q.buildForOnlineSync(a.local_operation_id,I.appointment);assert.equal(c.kind,'sync_draft');assert.equal(c.command.expected_version,0);assert.equal(c.command.acting_appointment_id,I.appointment);assert.ok(!('actor_user_id' in c.command));});
test('47: offline successive drafts carry monotonically rising expected versions',()=>{const q=createOfflineDiaryQueue();const d={...S,diary_id:I.diary,diary_date:'2026-11-12',shift_code:'day',facts:FACTS};q.queueDraft(d);const b=q.queueDraft(d);assert.equal(b.expected_version,1);});
test('48: failed sync retains queue item and conflict status',()=>{const q=createOfflineDiaryQueue();const a=q.queueDraft({...S,diary_id:I.diary,diary_date:'2026-11-12',shift_code:'day',facts:FACTS});q.markDispatched(a.local_operation_id);q.markConflict(a.local_operation_id);assert.equal(q.pending().queued[0].state,'conflict');});
test('49: sync ack requires exact diary and next version',()=>{const q=createOfflineDiaryQueue();const a=q.queueDraft({...S,diary_id:I.diary,diary_date:'2026-11-12',shift_code:'day',facts:FACTS});assert.throws(()=>q.markSynced(a.local_operation_id,{diary_id:I.diary,version:99,status:'draft'}));assert.equal(q.pending().queued.length,1);});
test('50: only acknowledged server draft clears queue',()=>{const q=createOfflineDiaryQueue();const a=q.queueDraft({...S,diary_id:I.diary,diary_date:'2026-11-12',shift_code:'day',facts:FACTS});assert.equal(q.readyForServerSubmission(I.diary),false);q.markSynced(a.local_operation_id,{diary_id:I.diary,version:1,status:'draft'});assert.equal(q.pending().queued.length,0);assert.equal(q.readyForServerSubmission(I.diary),true);});
test('51: local evidence intent hashes actual bytes and keeps bytes local',()=>{const q=createOfflineDiaryQueue();const bytes=Buffer.from('photo-a'),e=q.stageEvidenceIntent({...S,diary_id:I.diary,filename:'photo.jpg',bytes});assert.equal(e.sha256,createHash('sha256').update(bytes).digest('hex'));assert.deepEqual(q.getLocalEvidenceBytes(e.evidence_intent_id),bytes);assert.equal(q.readyForServerSubmission(I.diary),false);});
test('52: local evidence intent refuses wrong E03 proof',()=>{const q=createOfflineDiaryQueue();const e=q.stageEvidenceIntent({...S,diary_id:I.diary,filename:'photo.jpg',bytes:Buffer.from('photo-a')});assert.throws(()=>q.markEvidencePreserved(e.evidence_intent_id,{verified:true,byte_integrity_verified:true,sha256:'0'.repeat(64),...S,evidence_id:I.evidence}));assert.equal(q.readyForServerSubmission(I.diary),false);});
test('53: valid preservation proof clears local staged bytes',()=>{const q=createOfflineDiaryQueue();const e=q.stageEvidenceIntent({...S,diary_id:I.diary,filename:'photo.jpg',bytes:Buffer.from('photo-a')});q.markEvidencePreserved(e.evidence_intent_id,{verified:true,byte_integrity_verified:true,sha256:e.sha256,...S,evidence_id:I.evidence});assert.throws(()=>q.getLocalEvidenceBytes(e.evidence_intent_id));});
test('54: offline queue cannot request submit or acknowledgement',()=>{const q=createOfflineDiaryQueue();assert.equal(typeof q.submit,'undefined');assert.equal(typeof q.acknowledge,'undefined');});
test('55: offline evidence path traversal denied',()=>{const q=createOfflineDiaryQueue();assert.throws(()=>q.stageEvidenceIntent({...S,diary_id:I.diary,filename:'../../secret',bytes:Buffer.from('a')}));});
test('56: attachment or submit never works with empty or forged bearer',async()=>{const f=fixture();await f.create();await reject(f.run('attach_evidence',attach(1),'unknown'),'unauthenticated');await reject(f.run('submit',submit(1),'unknown'),'unauthenticated');});

test('57: locally preserved evidence still blocks submission until diary linkage is confirmed',()=>{
 const q=createOfflineDiaryQueue();const e=q.stageEvidenceIntent({...S,diary_id:I.diary,filename:'photo.jpg',bytes:Buffer.from('photo-a')});
 q.markEvidencePreserved(e.evidence_intent_id,{verified:true,byte_integrity_verified:true,sha256:e.sha256,...S,evidence_id:I.evidence});
 assert.equal(q.readyForServerSubmission(I.diary),false);
 assert.throws(()=>q.markEvidenceLinked(e.evidence_intent_id,{diary_id:I.otherDiary,version:2}));
 q.markEvidenceLinked(e.evidence_intent_id,{diary_id:I.diary,version:2});assert.equal(q.readyForServerSubmission(I.diary),true);
});
test('58: wrong E03 evidence ID after preservation cannot be linked by user-selected metadata',()=>{
 const q=createOfflineDiaryQueue();const e=q.stageEvidenceIntent({...S,diary_id:I.diary,filename:'photo.jpg',bytes:Buffer.from('photo-a')});
 assert.throws(()=>q.markEvidencePreserved(e.evidence_intent_id,{verified:true,byte_integrity_verified:true,sha256:e.sha256,...S,evidence_id:'not_uuid'}));
});
