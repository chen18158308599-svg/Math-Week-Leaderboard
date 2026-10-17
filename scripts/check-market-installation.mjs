// Read-only deployment verification. Run with node --env-file=.env.local.
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const service=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const anonymous=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false}});
const {data,error}=await service.rpc('market_action',{p_action:'state',p_input:{}});
assert.equal(error,null,error?.message);
assert.equal(data.stocks.length,3);
assert.equal(data.portfolio,null);
assert.ok(data.stocks.every(stock => stock.prices.length===24*(Math.max(data.day-1,data.settledDay)+1)));
const unauthorized=await anonymous.rpc('market_action',{p_action:'state',p_input:{}});
assert.ok(unauthorized.error,'Anonymous market RPC unexpectedly allowed');
for(const table of ['market_quotes','market_accounts','market_sessions','market_trades','market_settings','market_snapshots','market_admin_events']) {
  const result=await anonymous.from(table).select('*').limit(1);
  assert.ok(result.error,'Anonymous direct access unexpectedly allowed: '+table);
}
console.log(`PASS: installed market Day ${data.day}, ${data.phase}, settled through ${data.settledDay}; public RPC/table access denied; published history only. No test accounts, trades or resets created.`);
