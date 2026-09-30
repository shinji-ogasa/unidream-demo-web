const assert = require('node:assert/strict');
const {decisionSummary,latestExecution}=require('../src/lib/btc-execution.ts');
const now=Date.parse('2026-09-30T08:30:00Z');
const base={decision_ts:'2026-09-30T08:15:00Z',available:true,action_eligible:true,reason:'actor_intent',diagnostics:{execution_plan:{schema:'wm-paper-execution-plan-v1',quantity_unit:'BTC_per_initial_1_USDT',status:'hold',side:'NONE',quantity_btc:0,reason:'inside_no_trade_band'}}};
assert.match(decisionSummary(base,now,true).label,/HOLD/);
assert.equal(decisionSummary(base,now,true).quantity,0);
assert.equal(decisionSummary({...base,decision_ts:'2026-09-17T07:15:00Z'},now,true).quantity,null);
assert.match(decisionSummary({...base,decision_ts:'2026-09-17T07:15:00Z'},now,true).label,/更新停止/);
assert.equal(decisionSummary(base,now,false).quantity,null);
assert.equal(decisionSummary({...base,diagnostics:{}},now,true).quantity,null);
assert.equal(decisionSummary({...base,available:false},now,true).quantity,0);
for(const side of ['BUY','SELL']) {
 const f={...base,diagnostics:{execution_plan:{...base.diagnostics.execution_plan,status:'trade',side,quantity_btc:.00001}}};
 assert.equal(decisionSummary(f,now,true).quantity,.1);
 assert.match(decisionSummary(f,now,true).label,new RegExp(side));
}
const event={kind:'account',timestamp:base.decision_ts,details:{fill:{status:'deadband_hold',trade_value:0}}};
assert.equal(latestExecution([event]).quantity,0);
const filled={...event,details:{fill:{status:'filled',trade_value:-.1},bridge:{observed_open:100}}};
assert.equal(latestExecution([filled]).quantity,10);
assert.match(latestExecution([filled]).label,/SELL/);
assert.equal(latestExecution([{...filled,details:{fill:filled.details.fill}}]).quantity,null);
assert.equal(latestExecution([{...event,details:{fill:{status:'unknown'}}}]).quantity,null);
assert.equal(decisionSummary({...base,decision_ts:'2026-09-30T08:45:00Z'},now,true).quantity,null);
assert.equal(decisionSummary({...base,diagnostics:{execution_plan:{...base.diagnostics.execution_plan,quantity_unit:'wrong'}}},now,true).quantity,null);
console.log('btc execution UI: assertions passed');
