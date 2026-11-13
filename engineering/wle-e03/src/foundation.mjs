/**
 * WLE-E03 Candidate v0.1 — SERVER-ONLY / SYNTHETIC.
 * No browser imports, real Supabase access, real signer verification, legal approval,
 * durable object storage, real PostgreSQL transactions or public signed URLs.
 * The synthetic in-memory transaction wraps metadata AND bytes only for testing;
 * production object storage is not transactionally coupled to PostgreSQL.
 */
import {createHash, randomUUID} from 'node:crypto';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA = /^[0-9a-f]{64}$/;
const INSTANT = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/;
const KEY = /^[a-z][a-z0-9_]{1,63}$/;
const MAX_BYTES = 16 * 1024 * 1024; // disposable test candidate ceiling, not product limit
const BASE = ['command_id','idempotency_key','organization_id','project_id','contract_id','acting_appointment_id','reason'];
const EXTRAS = Object.freeze({
  preserve: ['evidence_id','source_record_type','source_record_id','original_filename','declared_media_type','expected_sha256','captured_at','occurred_at','retention_class','visibility_scope','provenance_source'],
  redact: ['evidence_id','parent_evidence_id','original_filename','declared_media_type','redaction_reason'],
  place_hold: ['evidence_id','hold_id','case_reference','hold_class'],
  release_hold: ['evidence_id','hold_id','review_reference'],
  export_manifest: ['export_id','evidence_ids','purpose']
});
export const E03_CAPABILITIES = Object.freeze({
  preserve:'construction.evidence.preserve',
  redact:'construction.evidence.redact',
  place_hold:'construction.evidence.hold',
  release_hold:'construction.evidence.hold_release',
  export_manifest:'construction.evidence.export',
  verify:'construction.evidence.read'
});
const isId = v => typeof v === 'string' && UUID.test(v);
const sha256 = v => createHash('sha256').update(v).digest('hex');
const stable = value => Array.isArray(value) ? value.map(stable)
  : value && typeof value === 'object' && !Buffer.isBuffer(value) ?
    Object.fromEntries(Object.keys(value).sort().map(k => [k,stable(value[k])])) : value;
// Defined sorted-key JSON candidate. NOT RFC8785 JCS or a digital signature.
export const canonicalDigest = value => sha256(JSON.stringify(stable(value)));
export class EvidenceError extends Error {
  constructor(code, status=400){super(code);this.name='EvidenceError';this.code=code;this.status=status;}
}
const fail = (code,status=400)=>{throw new EvidenceError(code,status)};
function hasOnlyFields(v,fields){return v && typeof v==='object' && !Array.isArray(v) &&
  Object.keys(v).every(k=>fields.includes(k)) && fields.every(k=>Object.hasOwn(v,k));}
function txt(v,min=1,max=200){return typeof v==='string' && v===v.trim() && v.length<=max && v.length>=min && !/[\u0000-\u001F]/.test(v);}
function instant(v){return v===null || (typeof v==='string'&&INSTANT.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,19)===v.slice(0,19));}
function checkCommand(kind,c,bytes){
  if(!Object.hasOwn(EXTRAS,kind)||!hasOnlyFields(c,[...BASE,...EXTRAS[kind]]))fail('invalid_input');
  for(const k of ['command_id','organization_id','project_id','contract_id','acting_appointment_id',...(['preserve','redact'].includes(kind)?['evidence_id',...(kind==='redact'?['parent_evidence_id']:[])]:kind==='place_hold'||kind==='release_hold'?['evidence_id','hold_id']:['export_id'])])
    if(!isId(c[k]))fail('invalid_input');
  if(!txt(c.reason,8,2000)||!txt(c.idempotency_key,8,128))fail('invalid_input');
  if(['preserve','redact'].includes(kind)){
    if(!Buffer.isBuffer(bytes)||bytes.length<1||bytes.length>MAX_BYTES)fail('invalid_bytes');
    if(!txt(c.original_filename,1,180)||c.original_filename.includes('/')||c.original_filename.includes('\\')||
       !txt(c.declared_media_type,3,100)||!c.declared_media_type.includes('/'))fail('invalid_input');
  } else if(bytes!==undefined)fail('unexpected_bytes');
  if(kind==='preserve'){
    if(!KEY.test(c.source_record_type)||!txt(c.source_record_id,1,200)||!SHA.test(c.expected_sha256)||
       !instant(c.captured_at)||!instant(c.occurred_at)||!KEY.test(c.retention_class)||
       !['contract','restricted'].includes(c.visibility_scope)||
       !['direct_upload','contract_diary','qs_adapter'].includes(c.provenance_source))fail('invalid_input');
  }
  if(kind==='redact'&&!txt(c.redaction_reason,8,2000))fail('invalid_input');
  if(kind==='place_hold'&&(!txt(c.case_reference,4,200)||!['legal','audit','contractual'].includes(c.hold_class)))fail('invalid_input');
  if(kind==='release_hold'&&!txt(c.review_reference,8,200))fail('invalid_input');
  if(kind==='export_manifest'&&(!Array.isArray(c.evidence_ids)||!c.evidence_ids.length||c.evidence_ids.length>200||
    c.evidence_ids.some(x=>!isId(x))||new Set(c.evidence_ids).size!==c.evidence_ids.length||!txt(c.purpose,8,250)))fail('invalid_input');
  return c;
}
function extractScope(v){return {organization_id:v.organization_id,project_id:v.project_id,contract_id:v.contract_id};}
function matches(v,s){return v?.organization_id===s.organization_id && v?.project_id===s.project_id && v?.contract_id===s.contract_id;}
function objectKey(scope,id,hash,derivative=false){return `org/${scope.organization_id}/contract/${scope.contract_id}/${derivative?'derivative':'original'}/${id}/${hash}`;}
function cloneStore(s){return {
  assets:new Map([...s.assets].map(([k,v])=>[k,structuredClone(v)])),
  blobs:new Map([...s.blobs].map(([k,v])=>[k,Buffer.from(v)])),
  holds:new Map([...s.holds].map(([k,v])=>[k,structuredClone(v)])),
  events:s.events.map(x=>structuredClone(x)),
  outbox:new Map([...s.outbox].map(([k,v])=>[k,structuredClone(v)])),
  receipts:new Map([...s.receipts].map(([k,v])=>[k,structuredClone(v)])),
  exports:new Map([...s.exports].map(([k,v])=>[k,structuredClone(v)]))
};}
function state(){return {assets:new Map(),blobs:new Map(),holds:new Map(),events:[],outbox:new Map(),receipts:new Map(),exports:new Map()};}
/** In-memory serialized transactions represent test semantics, not PG or storage guarantees. */
export function createSyntheticEvidenceStore({contractScopes=[],beforeCommit=null,clock=()=>new Date().toISOString()}={}){
  let current=state(),tail=Promise.resolve();
  const contractSet=new Set(contractScopes.map(s=>JSON.stringify([s.organization_id,s.project_id,s.contract_id])));
  return Object.freeze({
    async transaction(fn){
      let release;const previous=tail;tail=new Promise(r=>release=r);await previous;
      const next=cloneStore(current);
      try{const tx={...next,now:clock,contractExists:s=>contractSet.has(JSON.stringify([s.organization_id,s.project_id,s.contract_id]))};
        const result=await fn(tx); if(beforeCommit)await beforeCommit(tx);
        current=next;return result;
      }finally{release()}
    },
    snapshot(){const v=cloneStore(current);return {assets:[...v.assets.values()],holds:[...v.holds.values()],events:v.events,
      outbox:[...v.outbox.values()],receipts:[...v.receipts.values()],exports:[...v.exports.values()],
      object_count:v.blobs.size};},
    tamperBlobForTest(key,bytes){if(!current.blobs.has(key))throw Error('fixture missing blob');current.blobs.set(key,Buffer.from(bytes));}
  });
}
async function authenticated(verifier,authorization){
  if(typeof authorization!=='string'||!/^Bearer [A-Za-z0-9._~+\/-]+=*$/.test(authorization))fail('unauthenticated',401);
  let who;try{who=await verifier(authorization.slice(7))}catch{fail('unauthenticated',401)}
  if(!isId(who?.id))fail('unauthenticated',401);return who.id;
}
async function permit(authorize,tx,actor,scope,appointment_id,capability){
  const okay=await authorize({tx,actor_user_id:actor,acting_appointment_id:appointment_id,...scope,capability});
  if(okay!==true)fail('forbidden',403);
}
function eventAppend(tx,{scope,actor,appointment_id,command,aggregate_id,aggregate_version,event_type,before,after,payload={}}){
  const scoped=tx.events.filter(e=>matches(e,scope));
  const prev=scoped.at(-1)?.event_hash??null;
  const body={event_id:randomUUID(),aggregate_type:'construction_evidence',aggregate_id,aggregate_version,
    ...scope,event_type,actor_user_id:actor,acting_appointment_id:appointment_id,
    authenticated_request_id:command.command_id,occurred_at:tx.now(),recorded_at:tx.now(),
    previous_state:before,next_state:after,reason:command.reason,
    correlation_id:command.command_id,causation_id:null,originating_device:null,
    schema_version:'1',payload,previous_event_hash:prev};
  const event={...body,event_hash:canonicalDigest(body)};
  tx.events.push(event);
  tx.outbox.set(event.event_id,{event_id:event.event_id,...scope,event_type,
    payload_sha256:canonicalDigest(event),dispatch_state:'pending',recorded_at:tx.now()});
  return event;
}
function fetchAsset(tx,s,evidence_id){const a=tx.assets.get(evidence_id);if(!a||!matches(a,s))fail('evidence_not_found',404);return a;}
function assertBlob(tx,a){const blob=tx.blobs.get(a.storage_object_key);
  if(!blob||blob.length!==a.size_bytes||sha256(blob)!==a.sha256)fail('integrity_failed',409);
  return blob;
}
function activeHolds(tx,evidence_id){return [...tx.holds.values()].filter(x=>x.evidence_id===evidence_id&&x.status==='active');}

export function createEvidenceFoundation({store,verifyAccessToken,authorizeCapability,approveHoldRelease=null,verifyPartySigner=null}){
  if(!store?.transaction||typeof verifyAccessToken!=='function'||typeof authorizeCapability!=='function')
    throw Error('trusted store, verifier and permission check required');
  return Object.freeze({
    async execute({kind,command,authorization,bytes}){
      const c=checkCommand(kind,command,bytes);const actor=await authenticated(verifyAccessToken,authorization);
      const scope=extractScope(c);
      return store.transaction(async tx=>{
        await permit(authorizeCapability,tx,actor,scope,c.acting_appointment_id,E03_CAPABILITIES[kind]);
        if(!tx.contractExists(scope))fail('scope_not_found',404);
        const fingerprint=canonicalDigest({kind,...c,command_id:undefined,content_sha256:bytes?sha256(bytes):null});
        const receiptKey=JSON.stringify([scope.organization_id,actor,kind,c.idempotency_key]);
        const old=tx.receipts.get(receiptKey);
        if(old){if(old.hash!==fingerprint)fail('idempotency_conflict',409);return structuredClone(old.result)}
        let result,ev;
        if(kind==='preserve'||kind==='redact'){
          const hash=sha256(bytes);
          if(kind==='preserve'&&hash!==c.expected_sha256)fail('digest_mismatch',409);
          if(tx.assets.has(c.evidence_id))fail('evidence_conflict',409);
          let parent=null;
          if(kind==='redact'){
            parent=fetchAsset(tx,scope,c.parent_evidence_id);
            assertBlob(tx,parent);
            if(parent.sha256===hash)fail('redaction_unchanged',409);
          }
          const key=objectKey(scope,c.evidence_id,hash,kind==='redact');
          if(tx.blobs.has(key))fail('object_conflict',409);
          tx.blobs.set(key,Buffer.from(bytes));
          const asset={evidence_id:c.evidence_id,...scope,source_record_type:parent?.source_record_type??c.source_record_type,
            source_record_id:parent?.source_record_id??c.source_record_id,
            original_filename:c.original_filename,declared_media_type:c.declared_media_type,
            detected_media_type:null,size_bytes:bytes.length,sha256:hash,storage_object_key:key,
            captured_at:parent?.captured_at??c.captured_at,occurred_at:parent?.occurred_at??c.occurred_at,
            uploaded_at:tx.now(),uploader_user_id:actor,uploader_capacity_id:c.acting_appointment_id,
            status:'preserved',retention_class:parent?.retention_class??c.retention_class,
            legal_hold:'derived_from_hold_ledger',provenance_source:parent?.provenance_source??c.provenance_source,
            visibility_scope:parent?.visibility_scope??c.visibility_scope,
            redaction_parent_id:parent?.evidence_id??null,superseded_by:null,created_at:tx.now()};
          tx.assets.set(c.evidence_id,asset);
          ev=eventAppend(tx,{scope,actor,appointment_id:c.acting_appointment_id,command:c,
            aggregate_id:c.evidence_id,aggregate_version:1,event_type:parent?'evidence.derivative_preserved.v1':'evidence.asset_preserved.v1',
            before:null,after:'preserved',payload:{content_sha256:hash,size_bytes:bytes.length,redaction_parent_id:parent?.evidence_id??null}});
          result={evidence_id:c.evidence_id,sha256:hash,size_bytes:bytes.length,status:'preserved',event_id:ev.event_id};
        } else if(kind==='place_hold'){
          const asset=fetchAsset(tx,scope,c.evidence_id);
          if(tx.holds.has(c.hold_id))fail('hold_conflict',409);
          tx.holds.set(c.hold_id,{hold_id:c.hold_id,evidence_id:c.evidence_id,...scope,
            case_reference:c.case_reference,hold_class:c.hold_class,status:'active',placed_by:actor,
            placed_at:tx.now(),released_by:null,released_at:null,review_reference:null});
          ev=eventAppend(tx,{scope,actor,appointment_id:c.acting_appointment_id,command:c,aggregate_id:asset.evidence_id,
            aggregate_version:1,event_type:'evidence.hold_placed.v1',before:'unheld_or_partially_held',after:'held',payload:{hold_id:c.hold_id,case_reference:c.case_reference}});
          result={evidence_id:c.evidence_id,hold_id:c.hold_id,status:'active',event_id:ev.event_id};
        }else if(kind==='release_hold'){
          const asset=fetchAsset(tx,scope,c.evidence_id);
          const hold=tx.holds.get(c.hold_id);
          if(!hold||!matches(hold,scope)||hold.evidence_id!==asset.evidence_id)fail('hold_not_found',404);
          if(hold.status!=='active')fail('hold_already_released',409);
          if(hold.placed_by===actor)fail('separation_of_duties',403);
          if(typeof approveHoldRelease!=='function'||await approveHoldRelease({tx,actor_user_id:actor,hold,review_reference:c.review_reference})!==true)fail('independent_review_required',403);
          const next={...hold,status:'released',released_by:actor,released_at:tx.now(),review_reference:c.review_reference};
          tx.holds.set(c.hold_id,next);
          ev=eventAppend(tx,{scope,actor,appointment_id:c.acting_appointment_id,command:c,aggregate_id:asset.evidence_id,
            aggregate_version:1,event_type:'evidence.hold_released.v1',before:'held',after:activeHolds(tx,asset.evidence_id).length?'held':'unheld',
            payload:{hold_id:c.hold_id,review_reference:c.review_reference}});
          result={evidence_id:c.evidence_id,hold_id:c.hold_id,status:'released',event_id:ev.event_id};
        }else if(kind==='export_manifest'){
          if(tx.exports.has(c.export_id))fail('export_conflict',409);
          const assets=c.evidence_ids.map(id=>fetchAsset(tx,scope,id));
          for(const asset of assets)assertBlob(tx,asset);
          const rows=assets.map(a=>({evidence_id:a.evidence_id,sha256:a.sha256,size_bytes:a.size_bytes,redaction_parent_id:a.redaction_parent_id,
            retention_class:a.retention_class,active_hold_ids:activeHolds(tx,a.evidence_id).map(h=>h.hold_id).sort()}))
            .sort((a,b)=>a.evidence_id.localeCompare(b.evidence_id));
          const last=tx.events.filter(e=>matches(e,scope)).at(-1)?.event_hash??null;
          const manifest={export_id:c.export_id,...scope,purpose:c.purpose,created_at:tx.now(),actor_user_id:actor,
            event_chain_head:last,items:rows,manifest_version:'1'};
          const manifest_sha256=canonicalDigest(manifest);
          tx.exports.set(c.export_id,{...manifest,manifest_sha256});
          ev=eventAppend(tx,{scope,actor,appointment_id:c.acting_appointment_id,command:c,aggregate_id:c.export_id,
            aggregate_version:1,event_type:'evidence.export_manifest_created.v1',before:null,after:'recorded',payload:{manifest_sha256,item_count:rows.length}});
          result={export_id:c.export_id,manifest_sha256,item_count:rows.length,event_id:ev.event_id,manifest};
        }
        tx.receipts.set(receiptKey,{hash:fingerprint,result:structuredClone(result),recorded_at:tx.now()});
        return structuredClone(result);
      });
    },
    async verifyOriginal({authorization,organization_id,project_id,contract_id,acting_appointment_id,evidence_id}){
      if(![organization_id,project_id,contract_id,acting_appointment_id,evidence_id].every(isId))fail('invalid_input');
      const actor=await authenticated(verifyAccessToken,authorization),scope={organization_id,project_id,contract_id};
      return store.transaction(async tx=>{await permit(authorizeCapability,tx,actor,scope,acting_appointment_id,E03_CAPABILITIES.verify);
        const asset=fetchAsset(tx,scope,evidence_id);assertBlob(tx,asset);
        return {evidence_id,sha256:asset.sha256,size_bytes:asset.size_bytes,byte_integrity_verified:true,
          signer_identity_verified:false,signature_validity:'not_assessed',active_holds:activeHolds(tx,evidence_id).length};
      });
    },
    /** Internal server port matching E02 verifyDocumentEvidence argument and response shape.
     * Must be called within a future combined authorised transaction, not HTTP.
     * Party evidence callback is required and is NOT proof of legal signature validity.
     */
    async verifyForE02({tx,actor_user_id,evidence_id,sha256:claimed,organization_id,project_id,contract_id,signed_by_party_id}){
      if(!tx||!isId(actor_user_id)||!isId(evidence_id)||!SHA.test(claimed)||!isId(signed_by_party_id))return {verified:false};
      const scope={organization_id,project_id,contract_id};
      const asset=tx.assets?.get(evidence_id);
      if(!matches(asset,scope)||asset.sha256!==claimed)return {verified:false};
      try{assertBlob(tx,asset)}catch{return {verified:false}}
      if(typeof verifyPartySigner!=='function')return {verified:false};
      const proof=await verifyPartySigner({tx,actor_user_id,evidence_id,signed_by_party_id,...scope});
      if(!proof||proof.verified!==true||proof.party_id!==signed_by_party_id||
         !matches(proof,scope)||typeof proof.verified_at!=='string'||!instant(proof.verified_at))return {verified:false};
      return {verified:true,sha256:asset.sha256,...scope,party_id:signed_by_party_id,
        verified_at:proof.verified_at,byte_integrity_verified:true,signature_validity:'not_assessed'};
    },
    async verifyAuditChain({organization_id,project_id,contract_id}){
      const scope={organization_id,project_id,contract_id};
      return store.transaction(async tx=>{
        let previous=null,count=0;
        for(const evt of tx.events.filter(e=>matches(e,scope))){
          const {event_hash,...body}=evt;
          if(body.previous_event_hash!==previous||canonicalDigest(body)!==event_hash)return {valid:false,count,head:previous};
          previous=event_hash;count++;
        }
        return {valid:true,count,head:previous};
      });
    }
  });
}
