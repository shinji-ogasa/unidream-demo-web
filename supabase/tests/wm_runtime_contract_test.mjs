/** Feed an explicitly synthetic, freshly timed HF bridge/_project fixture to real PostgreSQL. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const { PGlite } = await import(process.env.PGLITE_IMPORT ?? '@electric-sql/pglite');
if(!process.env.WM_RUNTIME_FIXTURE) throw Error('WM_RUNTIME_FIXTURE must name a current synthetic HF runtime fixture; no clock overrides');
const bytes=await readFile(process.env.WM_RUNTIME_FIXTURE),fixture=JSON.parse(bytes);
assert.equal(fixture.diagnostic_only,true);
const sh=x=>createHash('sha256').update(x).digest('hex');
const migrations=await Promise.all(['20260906054107_btc_research_demo.sql','20260906073004_wm_research_demo.sql','20260906110000_wm_historical_backfill.sql'].map(async name=>({name,body:await readFile(new URL('../migrations/'+name,import.meta.url),'utf8')})));
const cases=[];
for(const [name,{previous,transition:p}]of Object.entries(fixture.cases)){
 assert.ok(Date.now()<Date.parse(p.event_ts)+900000,'fixture expired: regenerate a fresh synthetic origin');
 const db=new PGlite();await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');
 for(const m of migrations)await db.exec(m.body);
 const r=fixture.registered_run;
 await db.query('insert into btc_demo_runs(run_id,bundle_id,bundle_sha256,feature_contract_sha256,execution_contract_sha256,manifest) values($1,$2,$3,$4,$5,$6)',[r.run_id,r.bundle_id,r.bundle_sha256,r.feature_contract_sha256,r.execution_contract_sha256,r.manifest]);
 // Only the prior persisted fixture is seeded; all current writes go through the RPC.
 if(previous)await db.query('insert into btc_demo_state(run_id,version,last_open_ts,state) values($1,$2,$3,$4)',[r.run_id,previous.version,previous.last_open_ts,previous]);
 await db.exec('set role service_role');
 const call=async()=>(await db.query('select record_wm_demo_transition($1::jsonb) result',[p])).rows[0].result;
 const responses=await Promise.all([call(),call()]);
 assert.deepEqual(responses.map(x=>x.status),['applied','already_processed']);
 const stored=(await db.query('select state from btc_demo_state where run_id=$1',[r.run_id])).rows[0].state;
 assert.deepEqual(stored,p.state);
 const forecast=(await db.query('select target,mu,variance,forecast_kind,diagnostics from btc_demo_forecasts')).rows[0];
 assert.equal(forecast.forecast_kind,'wm_rl_actor');assert.equal(forecast.mu,null);assert.equal(forecast.variance,null);assert.equal(forecast.target,p.forecast.target);assert.deepEqual(forecast.diagnostics,p.forecast.diagnostics);
 const snapshots=(await db.query('select count(*)::int n from btc_demo_snapshots')).rows[0].n;
 const events=(await db.query('select count(*)::int n from btc_demo_events')).rows[0].n;
 assert.equal(snapshots,p.snapshots.length);assert.equal(events,p.events.length);
 cases.push({name,status:'pass',state_exact:true,forecast_diagnostics_exact:true,idempotent:true,snapshots,events,ns_transport:'canonical decimal strings',event_ts:p.event_ts});await db.close();
}
const report={status:'pass',scope:'synthetic HF bridge/_project -> JSON -> actual local WM RPC; no production model/economics/deployment',fixture_sha256:sh(bytes),migrations:Object.fromEntries(migrations.map(m=>[m.name,sh(m.body)])),cases};
if(process.env.WM_RUNTIME_REPORT)await writeFile(process.env.WM_RUNTIME_REPORT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
