/** Generates a disconnected example factual report. All IDs/data synthetic. */
import {writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {createProgrammeActuals,createSyntheticActualsStore} from '../src/actuals.mjs';
const s={organization_id:'11111111-1111-4111-8111-111111111111',project_id:'22222222-2222-4222-8222-222222222222',contract_id:'33333333-3333-4333-8333-333333333333'};
const ids={baseline:'44444444-4444-4444-8444-444444444444',importId:'55555555-5555-4555-8555-555555555555',boq:'66666666-6666-4666-8666-666666666666',task:'77777777-7777-4777-8777-777777777777',diary:'99999999-9999-4999-8999-999999999999',app:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',recorder:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',reviewer:'dddddddd-dddd-4ddd-8ddd-dddddddddddd'};
const store=createSyntheticActualsStore({clock:()=> '2026-11-20T06:00:00Z'});
const svc=createProgrammeActuals({store,verifyAccessToken:async token=>({id:ids[token]}),authorizeCapability:async()=>({allowed:true,scope_verified:true}),verifyAcceptedBaseline:async()=>({...s,verified:true,baseline_id:ids.baseline,import_id:ids.importId,baseline_version:1,status:'active',manifest_sha256:'c'.repeat(64),boq_version_id:ids.boq,boq_snapshot_sha256:'b'.repeat(64),source_instance:'qs_service_synthetic',source_revision:'r1',external_programme_id:91,calendar:{timezone:'Asia/Kuala_Lumpur',working_days:[1,2,3,4,5,6]},tasks:[{canonical_task_id:ids.task,external_task_id:11,wbs_code:'A.11',title:'Synthetic civil work',start_date:'2026-11-13',finish_date:'2026-11-19',duration_days:'5',total_float_days:'0'}]}),verifyDiary:async()=>({...s,verified:true,diary_id:ids.diary,version:3,diary_date:'2026-11-18',status:'acknowledged',facts_sha256:'d'.repeat(64),evidence_ids:[]})});
const common=x=>({...s,command_id:randomUUID(),idempotency_key:randomUUID(),acting_appointment_id:ids.app,reason:'Synthetic construction site facts only',...x});
const m=common({measure_id:randomUUID(),baseline_id:ids.baseline,canonical_task_id:ids.task,diary_id:ids.diary,diary_version:3,observation_date:'2026-11-18',measure_type:'quantity',quantity:'2.5000',unit:'m3',completion_bp:null});
await svc.execute({kind:'record_actual',command:m,authorization:'recorder'});
await svc.execute({kind:'verify_actual',command:common({measure_id:m.measure_id,baseline_id:ids.baseline,expected_version:1}),authorization:'reviewer'});
const reportId=randomUUID();
await svc.execute({kind:'publish_report',command:common({report_id:reportId,baseline_id:ids.baseline,as_of_date:'2026-11-20',expected_event_sequence:store.snapshot().events.length}),authorization:'reviewer'});
const report=await svc.report({authorization:'reviewer',acting_appointment_id:ids.app,...s,report_id:reportId});
writeFileSync(new URL('../contracts/SYNTHETIC_PROGRESS_REPORT_EXAMPLE.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log('Synthetic factual report generated',reportId,'hash',report.report_sha256);
