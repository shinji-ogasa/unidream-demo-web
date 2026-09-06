import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.PGLITE_IMPORT ?? '@electric-sql/pglite');
const db=new PGlite();
await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
for(const name of ['20260906054107_btc_research_demo.sql','20260906073004_wm_research_demo.sql']) await db.exec(await readFile(new URL('../migrations/'+name,import.meta.url),'utf8'));
const run='btc-wm31-ac-20260906-paper-v1',bundle='btc-wm31-ac-20260906',family='wm_market31_ac';
const h='a'.repeat(64),f='b'.repeat(64),e='c'.repeat(64),bar=900000;
const t=Math.floor(Date.now()/bar)*bar,iso=x=>new Date(x).toISOString(),ns=x=>(BigInt(x)*1000000n).toString();
const contract={schema:'wm-rl-cash-units-v1',one_way_cost:.00055,borrow_annual:.1,max_step:.08,deadband:.01,intent_bounds:[.5,1.12],bars_per_year:35040,fill_delay_bars:1,initial_cash:0,initial_units:'1/initial_open',initial_equity:1,missing_next_open:'expire_pending_intent',decision_account_feedback:'previous_completed_bar',missing_close_hold_valuation:'last_known_mark_explicitly_stale'};
const account=(start,count=0)=>({initial_timestamp_ns:ns(start),initial_open:100,one_way_cost:.00055,borrow_annual:.1,cash:0,units:.01,last_bar_timestamp_ns:count?ns(start+(count-1)*bar):null,pending_target:null,pending_due_ns:null,last_mark:100,last_mark_timestamp_ns:ns(start),last_mark_source:'initial_open',last_close_observed:false,last_equity:null,last_exposure:null,last_fill_delta:0,turnover:0,fees:0,borrow:0,trades:0,bars_processed:count,insolvent:false});
function state(start=t,count=0){const at=start+count*bar;return {schema_version:2,run_id:run,bundle_id:bundle,bundle_sha256:h,version:count+1,last_open_ts:iso(at),started_at:iso(start),initial_open:100,initial_equity:1,cash:0,units:.01,benchmark_units:.01,equity:1,benchmark_equity:1,peak_equity:1,benchmark_peak_equity:1,max_drawdown:0,benchmark_max_drawdown:0,fees:0,borrow:0,turnover:0,trades:0,last_mark_ts:null,last_mark_price:null,current_open_equity:null,current_open_exposure:null,bridge_state:{schema:'wm-rl-live-bridge-v1',bundle_id:bundle,manifest_sha256:h,account:{schema:contract.schema,contract,account:account(start,count)},policy:{controller:[0,0,0,0],step_count:count+1,active_count:0,underweight_count:0,long_count:0,last_timestamp_ns:ns(at),physical_feedback:true},deferred:{origin:iso(at),intent:null,timely_current_open:100,open_observed:true,receipt:iso(at)}}};}
function envelope(s){return {ok:true,model_family:family,run_id:run,bundle_id:bundle,bundle_sha256:h,feature_contract_sha256:f,execution_contract_sha256:e,event_ts:s.last_open_ts,expected_state_version:s.version-1,state:s,snapshots:[],events:[],forecast:{kind:'wm_rl_actor',decision_ts:s.last_open_ts,available:true,action_eligible:true,reason:'actor_intent',mu:null,variance:null,target:s.bridge_state.deferred?.intent??null,estimated_utility_gain:null,estimated_turnover:null,known_open_exposure:null,diagnostics:{decision:{state:s.bridge_state.policy,target_intent:s.bridge_state.deferred?.intent??null,action_eligible:true,timestamp:s.last_open_ts,completed_at:s.last_open_ts,deadline:iso(Date.parse(s.last_open_ts)+bar)}}},data:{timely:true}};}
await db.query('insert into btc_demo_runs values($1,$2,$3,$4,$5,$6,now())',[run,bundle,h,f,e,{model_family:family}]);
const call=async p=>(await db.query('select record_wm_demo_transition($1::jsonb) result',[p])).rows[0].result;
let tests=0;const clone=structuredClone;
const rejects=async(p,pattern)=>{await assert.rejects(()=>call(p),pattern);tests++;};
await db.exec('set role service_role');
const initial=envelope(state());
assert.equal((await call(initial)).status,'applied');tests++;
assert.equal((await call(initial)).status,'already_processed');tests++;
assert.equal((await db.query('select forecast_kind,mu,variance from btc_demo_forecasts')).rows[0].forecast_kind,'wm_rl_actor');tests++;
const initialErrors=[
 ['bundle',p=>p.bundle_sha256='d'.repeat(64),/contract mismatch/],
 ['family',p=>p.model_family='ml',/contract mismatch/],
];
for(const [,mutate,re]of initialErrors){const p=clone(initial);mutate(p);await rejects(p,re);}
await db.exec('delete from btc_demo_forecasts;delete from btc_demo_state;');
const before=state(t-bar);before.bridge_state.deferred.intent=1.1;
await db.query('insert into btc_demo_state(run_id,version,last_open_ts,state) values($1,1,$2,$3)',[run,before.last_open_ts,before]);
const next=state(t-bar,1),a=next.bridge_state.account.account;
Object.assign(a,{pending_target:1.1,pending_due_ns:ns(t),last_mark:102,last_mark_timestamp_ns:ns(t),last_mark_source:'close',last_close_observed:true,last_equity:1.02,last_exposure:1});
Object.assign(next,{equity:1.02,benchmark_equity:1.02,peak_equity:1.02,benchmark_peak_equity:1.02,last_mark_ts:iso(t-bar),last_mark_price:102});
next.bridge_state.deferred.intent=1.12;
const p=envelope(next);p.forecast.target=1.12;
p.snapshots=[{timestamp:iso(t-bar),price:102,equity:1.02,benchmark_equity:1.02,exposure:1,cash:0,units:.01,fees:0,borrow:0,turnover:0,trades:0,max_drawdown:0,benchmark_max_drawdown:0}];
p.events=[{event_id:'intent-'+t,timestamp:iso(t),kind:'decision',details:{target:1.12,due_at:iso(t+bar)}}];
const bad=[
 [q=>q.expected_state_version=0,/clock or version/],
 [q=>q.state.version=3,/clock or version/],
 [q=>q.state.initial_open=101,/endowment changed/],
 [q=>q.state.schema_version=1,/clock or version/],
 [q=>q.state.bridge_state.policy.extra=1,/exact nested/],
 [q=>q.state.bridge_state.account.account.last_mark_timestamp_ns=null,/clocks disagree/],
 [q=>q.state.equity=1.5,/completed equity/],
 [q=>q.state.peak_equity=2,/performance projection/],
 [q=>q.forecast.diagnostics.decision.state={},/diagnostic decision/],
 [q=>q.forecast.diagnostics.decision.completed_at=iso(t+bar),/diagnostic decision/],
 [q=>q.snapshots[0].benchmark_equity=1.01,/benchmark arithmetic/],
 [q=>q.snapshots[0].max_drawdown=.1,/drawdown arithmetic/],
 [q=>q.state.bridge_state.manifest_sha256='d'.repeat(64),/bridge identity/],
 [q=>q.state.bridge_state.account.contract.borrow_annual=.2,/execution contract/],
 [q=>q.state.bridge_state.policy.last_timestamp_ns=Number(ns(t)),/clocks disagree/],
 [q=>q.state.bridge_state.account.account.last_mark_timestamp_ns=Number(ns(t)),/decimal strings/],
 [q=>q.state.bridge_state.policy.last_timestamp_ns='0'+ns(t),/clocks disagree/],
 [q=>q.state.bridge_state.policy.last_timestamp_ns=ns(t-bar),/clocks disagree/],
 [q=>q.state.bridge_state.account.account.last_bar_timestamp_ns=ns(t),/clocks disagree/],
 [q=>q.state.bridge_state.policy.step_count=1,/counter geometry/],
 [q=>q.state.bridge_state.policy.active_count=3,/counter geometry/],
 [q=>q.state.bridge_state.policy.controller=[0,0,0],/bridge identity/],
 [q=>q.state.bridge_state.policy.controller[2]=1.1,/controller/],
 [q=>q.state.bridge_state.policy.physical_feedback=false,/bridge identity/],
 [q=>q.state.bridge_state.account.account.pending_due_ns=ns(t+bar),/pending fill/],
 [q=>q.state.bridge_state.deferred.intent=1.1200000047683716,/canonical bounds/],
 [q=>q.state.bridge_state.deferred.origin=iso(t-bar),/deferred current bar/],
 [q=>q.state.bridge_state.deferred.receipt=iso(t+bar),/current open receipt/],
 [q=>q.state.bridge_state.deferred.open_observed=false,/cannot have a price/],
 [q=>q.state.cash=1,/projection differs/],
 [q=>q.state.current_open_equity=1,/manufacture current-open/],
 [q=>q.state.current_open_exposure=1,/manufacture current-open/],
 [q=>q.state.last_mark_ts=null,/state mark/],
 [q=>q.snapshots[0].timestamp=iso(t),/chronology/],
 [q=>q.forecast.target=1.1,/payload or deferred/],
 [q=>q.forecast.mu=0,/payload or deferred/],
 [q=>q.forecast.kind='ml_return_variance',/payload or deferred/],
 [q=>q.forecast.available=false,/payload or deferred/],
 [q=>q.events[0].kind='unsupported',/check constraint/],
];
for(const [mutate,re]of bad){const q=clone(p);mutate(q);await rejects(q,re);}
assert.equal((await db.query('select count(*)::int n from btc_demo_snapshots')).rows[0].n,0);tests++;
assert.equal((await db.query('select version from btc_demo_state')).rows[0].version,1);tests++;
assert.equal((await call(p)).status,'applied');tests++;
assert.equal((await call(p)).status,'already_processed');tests++;
assert.equal((await db.query('select state from btc_demo_state')).rows[0].state.bridge_state.policy.last_timestamp_ns,ns(t));tests++;
const stored=(await db.query('select diagnostics,forecast_kind from btc_demo_forecasts')).rows[0];assert.deepEqual(stored.diagnostics,p.forecast.diagnostics);tests++;
// Deadline is checked against real PostgreSQL clock for a new stale event.
await db.exec('delete from btc_demo_events;delete from btc_demo_forecasts;delete from btc_demo_snapshots;delete from btc_demo_state;');
await rejects(envelope(state(t-bar)),/next-open deadline/);
await rejects(envelope(state(t+bar)),/clock or version/);
// No new current open means no initial synthetic benchmark state.
const noOpen=envelope(state());Object.assign(noOpen.state.bridge_state.deferred,{open_observed:false,timely_current_open:null,receipt:null});await rejects(noOpen,/initial event/);
// Halted canonical accounting can persist zero display NAV without a fake snapshot.
await db.query('insert into btc_demo_state(run_id,version,last_open_ts,state) values($1,1,$2,$3)',[run,before.last_open_ts,before]);
const halt=state(t-bar,1);halt.bridge_state.deferred=null;halt.bridge_state.policy.step_count=1;halt.bridge_state.policy.last_timestamp_ns=ns(t-bar);
Object.assign(halt.bridge_state.account.account,{cash:-2,last_equity:-1,last_exposure:null,last_mark:100,last_mark_timestamp_ns:ns(t),last_mark_source:'close',last_close_observed:true,insolvent:true});
Object.assign(halt,{cash:-2,equity:0,max_drawdown:1});const hp=envelope(halt);hp.forecast.target=null;hp.forecast.available=false;hp.forecast.action_eligible=false;hp.forecast.diagnostics.decision.action_eligible=false;
assert.equal((await call(hp)).status,'applied');tests++;
assert.equal((await db.query('select count(*)::int n from btc_demo_snapshots')).rows[0].n,0);tests++;
const legacy='test-legacy-preserved';await db.query('insert into btc_demo_runs values($1,$1,$2,$3,$4,$5,now())',[legacy,h,f,e,{}]);
const ls=state();delete ls.bridge_state;Object.assign(ls,{schema_version:1,run_id:legacy,bundle_id:legacy,current_open_equity:1,current_open_exposure:1,pending_target:null,pending_due_at:null,pending_decision_ts:null});
const lp={...initial,run_id:legacy,bundle_id:legacy,state:ls,forecast:null};
assert.equal((await db.query('select record_btc_demo_transition($1::jsonb) result',[lp])).rows[0].result.status,'applied');tests++;
// RLS and service-only writes unchanged; old ML RPC still exists.
await db.exec('reset role;set role anon');
await assert.rejects(()=>call(initial),/permission denied/);tests++;
await assert.rejects(()=>db.query('delete from btc_demo_state'),/permission denied/);tests++;
await db.exec('reset role');
assert.equal((await db.query("select has_function_privilege('service_role','record_wm_demo_transition(jsonb)','EXECUTE') yes,has_function_privilege('authenticated','record_wm_demo_transition(jsonb)','EXECUTE') no")).rows[0].no,false);tests++;
assert.equal((await db.query("select count(*)::int n from pg_proc where proname in ('record_wm_demo_transition','record_btc_demo_transition')")).rows[0].n,2);tests++;
await assert.rejects(()=>db.query('insert into btc_demo_forecasts(run_id,decision_ts,available,action_eligible,mu,variance,bundle_sha256,feature_contract_sha256,execution_contract_sha256,data) values($1,now(),true,true,null,null,$2,$3,$4,$5)',[run,h,f,e,{}]),/check constraint/);tests++;
console.log(JSON.stringify({status:'pass',tests,engine:'PGlite PostgreSQL',scope:'both actual migrations; WM schema/deadline/clock/state/hash/rollback/idempotency/legacy constraints/RLS; no external mutation'}));await db.close();
