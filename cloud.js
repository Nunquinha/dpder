/* Shared authenticated storage. IndexedDB is a recoverable cache, never the TPU authority. */
window.DPCloud=(()=>{
 let version=0,busy=false,timer,queue=Promise.resolve();
 const serial=fn=>{const result=queue.then(fn);queue=result.catch(()=>{});return result};
 const api=(path,data)=>DPAccess.api(path,data);
 async function table(){
  const result=await api('tpu/get',{version});
  if(!result.tpu&&!result.unchanged){
   if(!DPAccess.isAdmin())throw Error('Aguarde o administrador publicar a TPU compartilhada.');
   const local=await request('settings','readonly',s=>s.get('tpu'))||await fetch('tpu.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Não foi possível carregar a TPU.');return r.json()});
   await api('tpu/save',{tpu:local,seed:true,version:0});return table();
  }
  if(result.tpu){tpu=result.tpu;version=result.version;await request('settings','readwrite',s=>s.put({...tpu,cloudTpuVersion:version},'tpu'))}
  return tpu;
 }
 async function refresh(){
  if(busy)return;busy=true;
  try{
   await table();
   const remote=await api('records/list'),local=await request('records','readonly',s=>s.getAll()),byId=new Map(remote.records.map(r=>[r.id,r])),deleted=new Set(remote.deleted);
   for(const r of local){
    if(deleted.has(r.id)){await request('records','readwrite',s=>s.delete(r.id));continue}
    if(!r.cloudVersion||r.pendingSync){
     try{const result=await api('records/save',{record:r,migrate:!r.cloudVersion});byId.set(r.id,result.record);if(!result.existing){const saved={...r,cloudVersion:result.record.cloudVersion,updatedAt:result.record.updatedAt,updatedBy:result.record.updatedBy};delete saved.pendingSync;await request('records','readwrite',s=>s.put(saved))}}
     catch(err){if(err.status===401||err.status===403)throw err;byId.set(r.id,{...r,pendingSync:true,syncError:err.message});}
    }
   }
   const current=await request('records','readonly',s=>s.getAll()),cached=new Map(current.map(r=>[r.id,r]));
   for(const r of byId.values()){const c=cached.get(r.id);if(!c||(!c.pendingSync&&c.cloudVersion!==r.cloudVersion))await request('records','readwrite',s=>s.put(r))}
   records=[...byId.values()];
  }finally{busy=false}
 }
 async function start(){await serial(refresh);clearInterval(timer);timer=setInterval(()=>{if(DPAccess.allowed()&&!document.hidden)serial(refresh).catch(()=>{})},60000)}
 async function save(snapshot){
  if(snapshot.cloudSummary)throw Error('Reabra a ocorrência antes de salvar.');
  const draft={...structuredClone(snapshot),syncWriteId:crypto.randomUUID(),pendingSync:true};await request('records','readwrite',s=>s.put(draft));
  try{const result=await api('records/save',{record:draft});const saved={...draft,cloudVersion:result.record.cloudVersion,updatedAt:result.record.updatedAt,updatedBy:result.record.updatedBy};delete saved.pendingSync;await request('records','readwrite',s=>s.put(saved));records=records.filter(r=>r.id!==saved.id).concat(result.record);return saved}
  catch(err){records=records.filter(r=>r.id!==draft.id).concat(draft);throw Error('Cópia local preservada; ainda não salva na base central. '+err.message)}
 }
 async function open(r){
  const local=await request('records','readonly',s=>s.get(r.id));
  if(local?.pendingSync||!local?.cloudVersion&&local)return local;
  const full=await api('records/get',{id:r.id});await request('records','readwrite',s=>s.put(full));return full;
 }
 async function remove(r){if(!DPAccess.isAdmin())throw Error('Somente o administrador pode excluir.');await api('records/delete',{id:r.id,version:r.cloudVersion||0});await request('records','readwrite',s=>s.delete(r.id));records=records.filter(x=>x.id!==r.id)}
 async function replaceTable(candidate){if(!DPAccess.isAdmin())throw Error('Somente o administrador pode atualizar a TPU.');await api('tpu/save',{tpu:candidate,version});version=0;await table()}
 return {start,refresh:()=>serial(refresh),open:r=>serial(()=>open(r)),save:r=>{const snapshot=structuredClone(r);return serial(()=>save(snapshot))},remove:r=>serial(()=>remove(r)),replaceTable:t=>serial(()=>replaceTable(t)),table:()=>serial(table)};
})();
