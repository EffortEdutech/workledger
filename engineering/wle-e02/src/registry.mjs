/** WLE-E02 CANDIDATE: server-only, synthetic transaction adapter.
 * Never import into a browser; no real Supabase/database access here.
 * Authorization and evidence validation MUST be implemented by trusted services.
 */
import {createHash, randomUUID} from 'node:crypto';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA=/^[0-9a-f]{64}$/;
const INSTANT=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/;
const DATE=/^\d{4}-\d\d-\d\d$/;
const NAMESPACE=/^[a-z][a-z0-9_-]{1,63}$/;
const CAP=Object.freeze({register:'construction.contract.revision_create',seal:'construction.contract.revision_seal',map:'construction.contract.source_map'});
const BASE=['command_id','idempotency_key','organization_id','project_id','contract_id','acting_appointment_id','expected_version','reason'];
const EXTRA={register:['revision_id','revision_no','form_code','timezone','key_dates','party_ids','source_document_sha256','source_document_reference'],seal:['revision_id','signed_evidence_id','signed_document_sha256','signed_by_party_id'],map:['revision_id','source_system','source_instance_id','source_entity_type','source_record_id','source_revision']};
const isUuid=v=>typeof v==='string'&&UUID.test(v);
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
const freeze=v=>Object.freeze(structuredClone(v));
export class RegistryError extends Error{constructor(code,status=400){super(code);this.name='RegistryError';this.code=code;this.status=status;}}
const fail=(code,status=400)=>{throw new RegistryError(code,status)};
function textField(v,min=1,max=250){return typeof v==='string'&&v.length<=max&&v.trim().length>=min&&v===v.trim();}
function isDate(v){if(typeof v!=='string'||!DATE.test(v))return false;const d=new Date(v+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;}
function isInstant(v){return typeof v==='string'&&INSTANT.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().startsWith(v.slice(0,19));}
function validate(kind,c){
 if(!Object.hasOwn(EXTRA,kind)||!c||typeof c!=='object'||Array.isArray(c))fail('invalid_input');
 const allowed=new Set([...BASE,...EXTRA[kind]]);
 if(Object.keys(c).some(k=>!allowed.has(k))||[...BASE,...EXTRA[kind]].some(k=>!Object.hasOwn(c,k)))fail('invalid_input');
 for(const k of ['command_id','organization_id','project_id','contract_id','acting_appointment_id','revision_id',...(kind==='seal'?['signed_evidence_id','signed_by_party_id']:[])])if(!isUuid(c[k]))fail('invalid_input');
 if(!textField(c.idempotency_key,8,128)||!Number.isSafeInteger(c.expected_version)||c.expected_version<0||!textField(c.reason,8,2000))fail('invalid_input');
 if(kind==='register'){
  if(c.expected_version!==0||!Number.isSafeInteger(c.revision_no)||c.revision_no<1)fail('invalid_input');
  if(c.form_code!==null&&!textField(c.form_code,1,100))fail('invalid_input');
  if(!textField(c.timezone,3,100)||!Intl.supportedValuesOf('timeZone').includes(c.timezone))fail('invalid_input');
  if(!c.key_dates||typeof c.key_dates!=='object'||Array.isArray(c.key_dates)||Object.keys(c.key_dates).length>30)fail('invalid_input');
  for(const [k,v] of Object.entries(c.key_dates))if(!/^[a-z][a-z0-9_]{1,63}$/.test(k)||v!==null&&!isDate(v))fail('invalid_input');
  if(!Array.isArray(c.party_ids)||!c.party_ids.length||c.party_ids.length>50||c.party_ids.some(v=>!isUuid(v))||new Set(c.party_ids).size!==c.party_ids.length)fail('invalid_input');
  if(!SHA.test(c.source_document_sha256)||!textField(c.source_document_reference,8,512))fail('invalid_input');
 }
 if(kind==='seal'){
  if(c.expected_version!==1||!SHA.test(c.signed_document_sha256))fail('invalid_input');
 }
 if(kind==='map'){
  if(c.expected_version!==0||!NAMESPACE.test(c.source_system)||!NAMESPACE.test(c.source_instance_id)||!NAMESPACE.test(c.source_entity_type)||!textField(c.source_record_id,1,200)||!textField(c.source_revision,1,120))fail('invalid_input');
 }
 return c;
}
async function authenticate(verifier,authorization){
 if(typeof authorization!=='string'||!/^Bearer [A-Za-z0-9._~+\/-]+=*$/.test(authorization))fail('unauthenticated',401);
 let principal;try{principal=await verifier(authorization.slice(7));}catch{fail('unauthenticated',401)}
 if(!isUuid(principal?.id))fail('unauthenticated',401);
 return principal.id;
}
function scopeOf(c){return {organization_id:c.organization_id,project_id:c.project_id,contract_id:c.contract_id};}
function sameScope(a,c){return a?.organization_id===c.organization_id&&a?.project_id===c.project_id&&a?.contract_id===c.contract_id;}
/** ContractRegistry is an executable reference. Storage must supply real transaction isolation
 * and verified actor checks in the same database transaction in any future production adapter.
 */
export function createContractRegistry({verifyAccessToken,authorizeCapability,verifyDocumentEvidence,store}){
 if([verifyAccessToken,authorizeCapability,verifyDocumentEvidence].some(x=>typeof x!=='function')||typeof store?.transaction!=='function')throw new Error('trusted server dependencies required');
 return Object.freeze({
  async execute({authorization,kind,command}){
   const c=validate(kind,command);
   const actor=await authenticate(verifyAccessToken,authorization);
   return store.transaction(async tx=>{
    // Authorization occurs in the transaction and on every replay. Read is not write authority.
    if(await authorizeCapability({tx,actor_user_id:actor,acting_appointment_id:c.acting_appointment_id,...scopeOf(c),capability:CAP[kind]})!==true)fail('forbidden',403);
    const receiptKey=JSON.stringify([c.organization_id,actor,kind,c.revision_id,c.idempotency_key]);
    const fingerprint=hash({kind,command:Object.fromEntries(Object.entries(c).filter(([k])=>k!=='command_id'))});
    const previous=tx.receipts.get(receiptKey);
    if(previous){if(previous.hash!==fingerprint)fail('idempotency_conflict',409);return freeze(previous.value);}
    const revisionKey=JSON.stringify([c.organization_id,c.project_id,c.contract_id,c.revision_id]);
    let result,eventName;
    if(kind==='register'){
     // Parent/party relationships are storage-provided DB-owned assertions, not client claims.
     if(!tx.contractExists(scopeOf(c))||!c.party_ids.every(id=>tx.partyExists({...scopeOf(c),party_id:id})))fail('scope_not_found',404);
     if(tx.revisions.has(revisionKey)||[...tx.revisions.values()].some(r=>sameScope(r,c)&&r.revision_no===c.revision_no))fail('revision_conflict',409);
     const revision={...scopeOf(c),revision_id:c.revision_id,revision_no:c.revision_no,form_code:c.form_code,timezone:c.timezone,
      key_dates:structuredClone(c.key_dates),party_ids:[...c.party_ids],source_document_sha256:c.source_document_sha256,
      source_document_reference:c.source_document_reference,created_by:actor,created_at:tx.now(),aggregate_version:1};
     tx.revisions.set(revisionKey,freeze(revision));
     eventName='contract.revision_registered.v1';
     result={revision_id:c.revision_id,revision_no:c.revision_no,status:'registered_unsealed',version:1};
    }else if(kind==='seal'){
     const r=tx.revisions.get(revisionKey);
     if(!r)fail('scope_not_found',404);
     if(tx.seals.has(revisionKey))fail('immutable_revision',409);
     if(!r.party_ids.includes(c.signed_by_party_id))fail('party_scope_mismatch',403);
     // This is a verified evidence *receipt*, not a legal opinion on signature validity.
     const proof=await verifyDocumentEvidence({tx,actor_user_id:actor,evidence_id:c.signed_evidence_id,sha256:c.signed_document_sha256,
      signed_by_party_id:c.signed_by_party_id,...scopeOf(c)});
     if(!proof||proof.verified!==true||proof.sha256!==c.signed_document_sha256||!sameScope(proof,c)||proof.party_id!==c.signed_by_party_id||!isInstant(proof.verified_at))fail('evidence_unverified',403);
     const seal={...scopeOf(c),revision_id:c.revision_id,revision_no:r.revision_no,signed_evidence_id:c.signed_evidence_id,
      signed_document_sha256:c.signed_document_sha256,signed_by_party_id:c.signed_by_party_id,
      evidence_verified_at:proof.verified_at,sealed_by:actor,sealed_at:tx.now()};
     tx.seals.set(revisionKey,freeze(seal));
     eventName='contract.signed_evidence_recorded.v1';
     result={revision_id:c.revision_id,revision_no:r.revision_no,status:'sealed_evidence_recorded',version:1};
    }else if(kind==='map'){
     if(!tx.revisions.has(revisionKey))fail('scope_not_found',404);
     const sourceKey=JSON.stringify([c.source_system,c.source_instance_id,c.source_entity_type,c.source_record_id,c.source_revision]);
     const existing=tx.mappings.get(sourceKey);
     if(existing){if(existing.revision_key!==revisionKey)fail('source_crosswalk_conflict',409);
      // A new key with same mapping is a no-op, but still produces a receipt.
      eventName='contract.source_mapping_confirmed.v1';
     }else{
      tx.mappings.set(sourceKey,freeze({source_system:c.source_system,source_instance_id:c.source_instance_id,
       source_entity_type:c.source_entity_type,source_record_id:c.source_record_id,source_revision:c.source_revision,
       revision_key:revisionKey,created_by:actor,created_at:tx.now()}));
      eventName='contract.source_mapping_created.v1';
     }
     result={revision_id:c.revision_id,source_system:c.source_system,source_instance_id:c.source_instance_id,
      source_record_id:c.source_record_id,source_revision:c.source_revision,status:'mapped',version:1};
    }
    // Event, pending outbox and replay receipt are written atomically in the same transaction.
    const event_id=randomUUID();const event=freeze({event_id,event_name:eventName,actor_user_id:actor,...scopeOf(c),
      revision_id:c.revision_id,recorded_at:tx.now(),payload:{kind,reason:c.reason,command_id:c.command_id}});
    tx.events.push(event);
    tx.outbox.push(freeze({event_id,event_name:eventName,organization_id:c.organization_id,contract_id:c.contract_id,
      payload_sha256:hash(event),dispatch_state:'pending'}));
    const answer=freeze({...result,event_id});
    tx.receipts.set(receiptKey,{hash:fingerprint,value:answer});
    return answer;
   });
  }
 });
}

/** Purely in-memory TEST adapter; deliberately lacks PostgreSQL/RLS and cannot be used in production. */
export function createSyntheticStore({contracts=[],parties=[],now=()=>new Date().toISOString(),beforeCommit=async()=>{}}={}){
 const cloned=()=>({revisions:new Map(state.revisions),seals:new Map(state.seals),mappings:new Map(state.mappings),
  receipts:new Map(state.receipts),events:[...state.events],outbox:[...state.outbox]});
 let state={revisions:new Map(),seals:new Map(),mappings:new Map(),receipts:new Map(),events:[],outbox:[]};
 let pending=Promise.resolve();
 return Object.freeze({
  async transaction(work){
   let release;const next=new Promise(resolve=>release=resolve);const prev=pending;pending=next;await prev;
   try{
    const snapshot=cloned();
    const tx={...snapshot,now,contractExists:s=>contracts.some(x=>sameScope(x,s)),
     partyExists:s=>parties.some(x=>sameScope(x,s)&&x.party_id===s.party_id)};
    const value=await work(tx);await beforeCommit(tx);state=snapshot;return value;
   }finally{release();}
  },
  snapshot(){return structuredClone({revisions:[...state.revisions.values()],seals:[...state.seals.values()],
   mappings:[...state.mappings.values()],receipts:[...state.receipts.values()],events:state.events,outbox:state.outbox});}
 });
}
export const E02_CAPABILITIES=CAP;
