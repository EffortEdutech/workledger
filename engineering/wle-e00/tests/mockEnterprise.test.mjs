import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MockEnterprise, DomainError } from '../src/mockEnterprise.mjs';

const fixture = (name) => JSON.parse(readFileSync(new URL(`../fixtures/valid/${name}.json`, import.meta.url)));
const ORG='11111111-1111-4111-8111-111111111111', PROJECT='22222222-2222-4222-8222-222222222222';
const CONTRACT='33333333-3333-4333-8333-333333333333', BOQ='66666666-6666-4666-8666-666666666666';
const DIARY='77777777-7777-4777-8777-777777777777';
const SUB_USER='01010101-0101-4101-8101-010101010101', REV_USER='55555555-5555-4555-8555-555555555555';
const QS_USER='02020202-0202-4202-8202-020202020202', APPROVER_USER='03030303-0303-4303-8303-030303030303';
const SUB_AP='11111111-2222-4333-8444-555555555555', REV_AP='44444444-4444-4444-8444-444444444444';
const QS_AP='22222222-3333-4444-8555-666666666666', APPROVER_AP='33333333-4444-4555-8666-777777777777';
const ORG_B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', PROJECT_B='bbbbbbbb-bbbb-4bbb-8bbb-aaaaaaaaaaaa';
const CONTRACT_B='bbbbbbbb-bbbb-4bbb-8bbb-cccccccccccc', OUTSIDER='abababab-abab-4bab-8bab-abababababab';
const hash='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const principal=(userId=REV_USER, organizationId=ORG)=>({userId,organizationId});
const baseCommand=(appointmentId, type, id, version, key, payload={})=>({
 command_id:'99999999-9999-4999-8999-999999999999', idempotency_key:key, organization_id:ORG,
 project_id:PROJECT, contract_id:CONTRACT, aggregate_type:type, aggregate_id:id,
 expected_version:version, acting_appointment_id:appointmentId, requested_at:'2026-11-12T10:00:00Z',payload
});
const ap=(id,user,capacity,capabilities)=>({
 appointment_id:id, organization_id:ORG, project_id:PROJECT, contract_id:CONTRACT,
 appointee_user_id:user, capacity, capabilities, status:'active', effective_from:'2026-11-01T00:00:00Z',effective_until:null
});
const err=(code)=>e=>e instanceof DomainError && e.code===code;
function setup(){
 const e=new MockEnterprise();
 e.seedContract({organization_id:ORG,project_id:PROJECT,contract_id:CONTRACT,boq_version_id:BOQ,boq_source_sha256:hash});
 e.seedContract({organization_id:ORG_B,project_id:PROJECT_B,contract_id:CONTRACT_B,boq_version_id:BOQ,boq_source_sha256:hash});
 e.seedAppointment(ap(SUB_AP,SUB_USER,'subcontractor_submitter',['construction.diary.submit']));
 e.seedAppointment(ap(REV_AP,REV_USER,'main_contractor_reviewer',['construction.diary.acknowledge']));
 e.seedAppointment(ap(QS_AP,QS_USER,'appointed_qs',['construction.programme.import']));
 e.seedAppointment(ap(APPROVER_AP,APPROVER_USER,'client_representative',['construction.programme.accept']));
 e.seedDiary({id:DIARY,organization_id:ORG,project_id:PROJECT,contract_id:CONTRACT,author_user_id:SUB_USER});
 const m=fixture('programme-baseline');
 e.seedExternalReference({source_system:'qs-service',source_instance:m.source_instance,external_entity_type:'project',external_id:String(m.external_project_id),source_revision:m.source_revision,canonical_entity_type:'project',canonical_entity_id:PROJECT,organization_id:ORG,mapping_status:'verified'});
 e.seedExternalReference(fixture('external-reference'));
 return {e,m};
}
const submit=()=>baseCommand(SUB_AP,'diary',DIARY,0,'e00-submit-0001',{work_description:'Site task'});
const acknowledge=()=>baseCommand(REV_AP,'diary',DIARY,1,'e00-ack-00001',{});
const acceptReq=(id)=>({import_id:id,contract_id:CONTRACT,organization_id:ORG,project_id:PROJECT,expected_version:0,idempotency_key:'e00-accept-0001',acting_appointment_id:APPROVER_AP});

test('E00-01: frozen schema version is candidate 1.0.0-rc1',()=>assert.equal(fixture('programme-baseline').schema_version,'1.0.0-rc1'));
test('E00-02: submission produces a single auditable business event',()=>{
 const {e}=setup(); const r=e.submitDiary(submit(),principal(SUB_USER));
 assert.equal(r.status,'submitted'); assert.equal(r.version,1); assert.equal(e.audit.length,1);
 assert.equal(e.audit[0].actor_user_id,SUB_USER);
});
test('E00-03: repeated submission with same idempotency key has no duplicate effect',()=>{
 const {e}=setup(),cmd=submit(); assert.deepEqual(e.submitDiary(cmd,principal(SUB_USER)),e.submitDiary(cmd,principal(SUB_USER)));
 assert.equal(e.audit.length,1);
});
test('E00-04: idempotency key reused for altered payload is rejected',()=>{
 const {e}=setup(),cmd=submit(); e.submitDiary(cmd,principal(SUB_USER));
 assert.throws(()=>e.submitDiary({...cmd,payload:{work_description:'Tampered'}},principal(SUB_USER)),err('idempotency_conflict'));
});
test('E00-05: cannot acknowledge diary before submitted',()=>{
 const {e}=setup(); assert.throws(()=>e.acknowledgeDiary({...acknowledge(),expected_version:0},principal()),err('invalid_transition'));
});
test('E00-06: only main-contractor reviewer with appointment may acknowledge',()=>{
 const {e}=setup();e.submitDiary(submit(),principal(SUB_USER));
 assert.throws(()=>e.acknowledgeDiary({...acknowledge(),acting_appointment_id:SUB_AP},principal(SUB_USER)),err('forbidden'));
 const r=e.acknowledgeDiary(acknowledge(),principal());assert.equal(r.status,'acknowledged');assert.equal(e.audit.length,2);
});
test('E00-07: no second acknowledgement, even with other key',()=>{
 const {e}=setup();e.submitDiary(submit(),principal(SUB_USER));e.acknowledgeDiary(acknowledge(),principal());
 assert.throws(()=>e.acknowledgeDiary({...acknowledge(),expected_version:2,idempotency_key:'other-ack-00001'},principal()),err('invalid_transition'));
});
test('E00-08: stale expected version conflicts',()=>{
 const {e}=setup();e.submitDiary(submit(),principal(SUB_USER));
 assert.throws(()=>e.acknowledgeDiary({...acknowledge(),expected_version:0},principal()),err('conflict'));
});
test('E00-09: outsider cannot view another tenant contract',()=>{
 const {e}=setup();assert.throws(()=>e.progressReport({organization_id:ORG,project_id:PROJECT,contract_id:CONTRACT},principal(OUTSIDER,ORG_B)),err('not_found'));
});
test('E00-10: tenant owner without active contract appointment cannot access report',()=>{
 const {e}=setup();assert.throws(()=>e.progressReport({organization_id:ORG,project_id:PROJECT,contract_id:CONTRACT},principal(OUTSIDER)),err('forbidden'));
});
test('E00-11: expired or revoked appointment cannot acknowledge',()=>{
 const {e}=setup();e.submitDiary(submit(),principal(SUB_USER)); e.revokeAppointment(REV_AP);
 assert.throws(()=>e.acknowledgeDiary(acknowledge(),principal()),err('forbidden'));
});
test('E00-12: replay after revocation is denied, even if prior result was cached',()=>{
 const {e}=setup();const cmd=submit(); e.submitDiary(cmd,principal(SUB_USER));e.revokeAppointment(SUB_AP);
 assert.throws(()=>e.submitDiary(cmd,principal(SUB_USER)),err('forbidden'));
});
test('E00-13: client-injected authoritative actor is rejected',()=>{
 const {e}=setup();assert.throws(()=>e.submitDiary({...submit(),actor_user_id:REV_USER},principal(SUB_USER)),err('actor_injection'));
 assert.throws(()=>e.submitDiary({...submit(),payload:{approved_by:REV_USER}},principal(SUB_USER)),err('actor_injection'));
});
test('E00-14: appointee and authenticated principal must match',()=>{
 const {e}=setup();assert.throws(()=>e.submitDiary(submit(),principal(OUTSIDER)),err('forbidden'));
});
test('E00-15: QS accepted manifest only imported after crosswalk and professional review',()=>{
 const {e,m}=setup();const r=e.importQsManifest(m,principal(QS_USER),QS_AP);
 assert.equal(r.status,'imported');assert.equal(r.tasks_count,3);assert.equal(e.activeBaselines.size,0);
 assert.equal(r.import_id,fixture('external-reference').canonical_entity_id);
});
test('E00-16: QS manifest draft rejected',()=>{
 const {e,m}=setup();assert.throws(()=>e.importQsManifest({...m,programme_status:'draft'},principal(QS_USER),QS_AP),err('invalid_manifest'));
});
test('E00-17: missing QS reviewer rejects import',()=>{
 const {e,m}=setup();assert.throws(()=>e.importQsManifest({...m,review:null},principal(QS_USER),QS_AP),err('review_required'));
});
test('E00-18: changed BOQ source hash rejects import',()=>{
 const {e,m}=setup();assert.throws(()=>e.importQsManifest({...m,boq_source_sha256:'b'.repeat(64)},principal(QS_USER),QS_AP),err('boq_mismatch'));
});
test('E00-19: crosswalk cannot be used for different tenant',()=>{
 const {e,m}=setup();e.crosswalk.get(e._externalKey(m.source_instance,'project',m.external_project_id,m.source_revision)).organization_id=ORG_B;
 assert.throws(()=>e.importQsManifest(m,principal(QS_USER),QS_AP),err('unverified_crosswalk'));
});
test('E00-20: unverified QS programme crosswalk is rejected',()=>{
 const {e,m}=setup();e.crosswalk.get(e._externalKey(m.source_instance,'programme',m.external_programme_id,m.source_revision)).mapping_status='pending';
 assert.throws(()=>e.importQsManifest(m,principal(QS_USER),QS_AP),err('unverified_crosswalk'));
});
test('E00-21: duplicate QS manifest delivery has only one import event',()=>{
 const {e,m}=setup();const a=e.importQsManifest(m,principal(QS_USER),QS_AP),b=e.importQsManifest(m,principal(QS_USER),QS_AP);
 assert.deepEqual(a,b);assert.equal(e.audit.length,1);
});
test('E00-22: mutated payload under same QS external ID fails',()=>{
 const {e,m}=setup();e.importQsManifest(m,principal(QS_USER),QS_AP);
 assert.throws(()=>e.importQsManifest({...m,timezone:'UTC'},principal(QS_USER),QS_AP),err('manifest_conflict'));
});
test('E00-23: programme import and contractual acceptance are separate acts',()=>{
 const {e,m}=setup();const imp=e.importQsManifest(m,principal(QS_USER),QS_AP);
 assert.equal(e.progressReport({organization_id:ORG,project_id:PROJECT,contract_id:CONTRACT},principal(REV_USER)).programme_tasks,0);
 const r=e.acceptProgramme(acceptReq(imp.import_id),principal(APPROVER_USER));
 assert.equal(r.status,'active');assert.equal(e.activeBaselines.get(CONTRACT),imp.import_id);
});
test('E00-24: appointed QS cannot self-accept without contract appointment',()=>{
 const {e,m}=setup();const imp=e.importQsManifest(m,principal(QS_USER),QS_AP);
 assert.throws(()=>e.acceptProgramme({...acceptReq(imp.import_id),acting_appointment_id:QS_AP},principal(QS_USER)),err('forbidden'));
});
test('E00-25: acceptance replay safe; prevents second active baseline',()=>{
 const {e,m}=setup();const imp=e.importQsManifest(m,principal(QS_USER),QS_AP),cmd=acceptReq(imp.import_id);
 const r=e.acceptProgramme(cmd,principal(APPROVER_USER));assert.deepEqual(r,e.acceptProgramme(cmd,principal(APPROVER_USER)));
 assert.equal(e.audit.length,2);
 assert.throws(()=>e.acceptProgramme({...cmd,idempotency_key:'new-accept-key',expected_version:1},principal(APPROVER_USER)),err('invalid_transition'));
});
test('E00-26: task ID duplication rejected',()=>{
 const {e,m}=setup();const bad=structuredClone(m); bad.tasks.push({...bad.tasks[0]});
 assert.throws(()=>e.importQsManifest(bad,principal(QS_USER),QS_AP),err('invalid_tasks'));
});
test('E00-27: invalid QS task dependency rejected',()=>{
 const {e,m}=setup();const bad=structuredClone(m); bad.dependencies[0].from_external_task_id=99999;
 assert.throws(()=>e.importQsManifest(bad,principal(QS_USER),QS_AP),err('invalid_dependencies'));
});
test('E00-28: synthetic diary to active programme report has explicit provenance',()=>{
 const {e,m}=setup();e.submitDiary(submit(),principal(SUB_USER));e.acknowledgeDiary(acknowledge(),principal());
 const imp=e.importQsManifest(m,principal(QS_USER),QS_AP);e.acceptProgramme(acceptReq(imp.import_id),principal(APPROVER_USER));
 const report=e.progressReport({organization_id:ORG,project_id:PROJECT,contract_id:CONTRACT},principal(REV_USER));
 assert.equal(report.acknowledged_diaries,1);assert.equal(report.programme_tasks,3);
 assert.equal(report.provenance.source,'synthetic_mock_only');
});

test('E00-29: same business operation can replay with a different transport command ID',()=>{
 const {e}=setup(),cmd=submit();const first=e.submitDiary(cmd,principal(SUB_USER));
 const second=e.submitDiary({...cmd,command_id:'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',requested_at:'2026-11-12T10:02:00Z'},principal(SUB_USER));
 assert.deepEqual(first,second);assert.equal(e.audit.length,1);
});
test('E00-30: wrongly scoped diary foreign contract is inaccessible',()=>{
 const {e}=setup(); const cmd={...submit(),contract_id:CONTRACT_B};
 assert.throws(()=>e.submitDiary(cmd,principal(SUB_USER)),err('not_found'));
});
test('E00-31: submit cannot modify diary written by another appointee',()=>{
 const {e}=setup(); e.diaries.get(DIARY).author_user_id=REV_USER;
 assert.throws(()=>e.submitDiary(submit(),principal(SUB_USER)),err('forbidden'));
});
test('E00-32: acceptance command with stale version cannot activate',()=>{
 const {e,m}=setup();const imp=e.importQsManifest(m,principal(QS_USER),QS_AP);
 assert.throws(()=>e.acceptProgramme({...acceptReq(imp.import_id),expected_version:3},principal(APPROVER_USER)),err('conflict'));
});
test('E00-33: conflicting tenant crosswalk with another numeric source instance cannot be reused',()=>{
 const {e,m}=setup();const altered={...m,source_instance:'another-qs-service'};
 assert.throws(()=>e.importQsManifest(altered,principal(QS_USER),QS_AP),err('unverified_crosswalk'));
});
