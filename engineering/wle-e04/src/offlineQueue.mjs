/**
 * WLE-E04 OFFLINE REFERENCE QUEUE (Node/in-memory only).
 * This is NOT persistent IndexedDB, encryption, background sync, or production PWA code.
 * Offline can queue factual DRAFTS and RAW EVIDENCE INTENTS, never submit/acknowledge.
 */
import {createHash, randomUUID} from 'node:crypto';
import {validateFacts} from './diary.mjs';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA=/^[0-9a-f]{64}$/;
const MAX_BYTES=16*1024*1024; // isolated-test limit, not a product quota
const isId=x=>typeof x==='string'&&UUID.test(x);
const key=x=>[x.organization_id,x.project_id,x.contract_id,x.diary_id].join('|');
const scope=x=>({organization_id:x.organization_id,project_id:x.project_id,contract_id:x.contract_id});
const fail=code=>{const e=new Error(code);e.code=code;throw e};
const freeze=x=>Object.freeze(structuredClone(x));
/** Call only from a user's local encrypted storage integration in future PWA.
 * No actor principal or credentials may be accepted/stored by this queue.
 */
export function createOfflineDiaryQueue({device_id=randomUUID()}={}){
 if(!isId(device_id))fail('invalid_device');
 const operations=[],intentBytes=new Map(),intents=new Map(),serverVersions=new Map();
 return Object.freeze({
  queueDraft({organization_id,project_id,contract_id,diary_id,diary_date,shift_code,facts,reason='Offline factual diary draft captured on site',base_version=0}){
   const s={organization_id,project_id,contract_id,diary_id};
   if(Object.values(s).some(x=>!isId(x))||!Number.isSafeInteger(base_version)||base_version<0||typeof diary_date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(diary_date)||!['day','night'].includes(shift_code))fail('invalid_draft');
   if(typeof reason!=='string'||reason.trim().length<8)fail('invalid_draft');
   const f=validateFacts(facts);const k=key(s);
   const pending=operations.filter(x=>key(x.command)===k&&x.state!=='synced');
   const previous=pending.at(-1);
   if(previous&&(previous.command.diary_date!==diary_date||previous.command.shift_code!==shift_code))fail('identity_immutable');
   const version=previous?previous.command.expected_version+1:(serverVersions.get(k)??base_version);
   const command={...s,diary_date,shift_code,facts:f,reason,acting_appointment_id:null,
    expected_version:version,command_id:randomUUID(),idempotency_key:randomUUID()};
   const operation={local_operation_id:randomUUID(),device_id,kind:'sync_draft',state:'queued',command};
   operations.push(operation);return freeze({local_operation_id:operation.local_operation_id,kind:operation.kind,expected_version:version});
  },
  markDispatched(local_operation_id){
   const op=operations.find(x=>x.local_operation_id===local_operation_id);
   if(!op||op.state!=='queued')fail('invalid_queue_transition');
   op.state='in_flight';return true;
  },
  buildForOnlineSync(local_operation_id,acting_appointment_id){
   if(!isId(acting_appointment_id))fail('invalid_appointment');
   const op=operations.find(x=>x.local_operation_id===local_operation_id);
   if(!op||!['queued','in_flight','conflict'].includes(op.state))fail('invalid_queue_transition');
   return freeze({kind:'sync_draft',command:{...op.command,acting_appointment_id}});
  },
  markSynced(local_operation_id,receipt){
   const op=operations.find(x=>x.local_operation_id===local_operation_id);
   if(!op||!['queued','in_flight','conflict'].includes(op.state)||receipt?.diary_id!==op.command.diary_id||receipt?.status!=='draft'||receipt.version!==op.command.expected_version+1)fail('invalid_receipt');
   op.state='synced';serverVersions.set(key(op.command),receipt.version);return true;
  },
  markConflict(local_operation_id){const op=operations.find(x=>x.local_operation_id===local_operation_id);if(!op||op.state==='synced')fail('invalid_queue_transition');op.state='conflict';return true;},
  stageEvidenceIntent({organization_id,project_id,contract_id,diary_id,filename,bytes}){
   const s={organization_id,project_id,contract_id,diary_id};
   if(Object.values(s).some(x=>!isId(x))||typeof filename!=='string'||!filename.trim()||filename.includes('/')||filename.includes('\\')||!Buffer.isBuffer(bytes)||bytes.length<1||bytes.length>MAX_BYTES)fail('invalid_evidence_intent');
   const evidence_intent_id=randomUUID(),sha256=createHash('sha256').update(bytes).digest('hex');
   const data={evidence_intent_id,...s,filename,sha256,size_bytes:bytes.length,state:'pending_preservation'};
   intentBytes.set(evidence_intent_id,Buffer.from(bytes));intents.set(evidence_intent_id,data);
   return freeze(data);
  },
  getLocalEvidenceBytes(evidence_intent_id){const b=intentBytes.get(evidence_intent_id);if(!b)fail('evidence_unavailable');return Buffer.from(b);},
  markEvidencePreserved(evidence_intent_id,receipt){
   const intent=intents.get(evidence_intent_id);
   if(!intent||intent.state!=='pending_preservation'||receipt?.verified!==true||receipt.byte_integrity_verified!==true||receipt.sha256!==intent.sha256||
    receipt.organization_id!==intent.organization_id||receipt.project_id!==intent.project_id||receipt.contract_id!==intent.contract_id||!isId(receipt.evidence_id))fail('unverified_evidence');
   intent.state='preserved_not_linked';intent.evidence_id=receipt.evidence_id;intentBytes.delete(evidence_intent_id);return true;
  },
  markEvidenceLinked(evidence_intent_id,receipt){
   const intent=intents.get(evidence_intent_id);
   if(!intent||intent.state!=='preserved_not_linked'||receipt?.diary_id!==intent.diary_id||!Number.isSafeInteger(receipt.version)||receipt.version<1)fail('invalid_attachment_receipt');
   intent.state='linked';return true;
  },
  readyForServerSubmission(diary_id){
   if(!isId(diary_id))fail('invalid_draft');
   return !operations.some(x=>x.command.diary_id===diary_id&&x.state!=='synced')&&
          ![...intents.values()].some(x=>x.diary_id===diary_id&&x.state!=='linked');
  },
  pending(){return freeze({device_id,queued:operations.filter(x=>x.state!=='synced').map(x=>({local_operation_id:x.local_operation_id,state:x.state,kind:x.kind,diary_id:x.command.diary_id,expected_version:x.command.expected_version})),
   evidence_intents:[...intents.values()].map(x=>({...x}))});}
 });
}
