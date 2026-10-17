// Minimal PixelLab v2 client. Token comes from PIXELLAB_API_TOKEN in the environment; never written to disk.
// usage: node pl.mjs balance | create <out.json> | job <id> | char <id> | animate <out.json> | zip <id> <file>
import {readFileSync,writeFileSync} from 'node:fs';
const T=process.env.PIXELLAB_API_TOKEN;if(!T)throw new Error('PIXELLAB_API_TOKEN not set');
const B='https://api.pixellab.ai/v2';
async function api(method,path,body){const r=await fetch(B+path,{method,headers:{Authorization:`Bearer ${T}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const text=await r.text();let j;try{j=JSON.parse(text);}catch{j=text;}if(!r.ok)throw new Error(`${r.status} ${typeof j==='string'?j:JSON.stringify(j).slice(0,600)}`);return j;}
const sleep=ms=>new Promise(f=>setTimeout(f,ms));
async function waitJob(id){for(let i=0;i<240;i++){const j=await api('GET',`/background-jobs/${id}`);if(j.status==='completed')return j;if(j.status==='failed'||j.status==='cancelled')throw new Error('job '+j.status+': '+JSON.stringify(j).slice(0,500));await sleep(5000);}throw new Error('timeout');}
const [cmd,a,b]=process.argv.slice(2);
if(cmd==='balance')console.log(JSON.stringify(await api('GET','/balance')));
else if(cmd==='create'){const req=JSON.parse(readFileSync(a,'utf8'));const r=await api('POST','/create-character-with-8-directions',req);console.log('accepted',JSON.stringify(r).slice(0,400));const job=r.background_job_id??r.job_id;const done=job?await waitJob(job):r;writeFileSync(b??'created.json',JSON.stringify({request:r,result:done},null,1));console.log('character',r.character_id??done?.last_response?.character_id);}
else if(cmd==='animate'){const req=JSON.parse(readFileSync(a,'utf8'));const r=await api('POST','/characters/animations',req);console.log('accepted',JSON.stringify(r).slice(0,500));const jobs=r.background_job_ids??(r.background_job_id?[r.background_job_id]:[]);const out=[];for(const j of jobs)out.push(await waitJob(j));writeFileSync(b??'animated.json',JSON.stringify({request:r,results:out},null,1));console.log('done',jobs.length,'jobs');}
else if(cmd==='job')console.log(JSON.stringify(await api('GET',`/background-jobs/${a}`)).slice(0,2000));
else if(cmd==='char')console.log(JSON.stringify(await api('GET',`/characters/${a}`),null,1).slice(0,6000));
else if(cmd==='zip'){const r=await fetch(`${B}/characters/${a}/zip`,{headers:{Authorization:`Bearer ${T}`}});if(!r.ok)throw new Error(r.status+' '+await r.text());writeFileSync(b,Buffer.from(await r.arrayBuffer()));console.log('saved',b);}
else console.log('unknown command');
