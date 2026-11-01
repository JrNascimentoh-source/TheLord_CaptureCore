import test from "node:test";
import assert from "node:assert/strict";
import {SupabaseVelaRelay} from "../src/adapters/supabase-vela-relay.js";

function storageMock(){
  const values=new Map();
  return {
    getItem:key=>values.has(key)?values.get(key):null,
    setItem:(key,value)=>values.set(key,String(value)),
    values
  };
}

test("sends 7a7 and BetDoPovo candles using separate canonical game keys",async()=>{
  const storage=storageMock(),bodies=[];
  const relay=new SupabaseVelaRelay({storage,fetchImpl:async(_url,options)=>{
    bodies.push(JSON.parse(options.body));
    return {ok:true,status:201};
  }});
  await relay.enqueue({game:"aviator",value:2.4,detectedAt:"2026-11-01T12:00:00.000Z"});
  await relay.enqueue({game:"aviator2",value:18.7,detectedAt:"2026-11-01T12:01:00.000Z"});
  assert.deepEqual(bodies.map(item=>item.game),["aviator","aviator2"]);
  assert.deepEqual(bodies.map(item=>item.value),[2.4,18.7]);
  assert.equal(JSON.parse(storage.values.get("thelord_capturecore_pending_velas_v1")).length,0);
});

test("rejects unknown games and invalid values without sending",async()=>{
  const storage=storageMock();let calls=0;
  const relay=new SupabaseVelaRelay({storage,fetchImpl:async()=>{calls++;return {ok:true,status:201};}});
  assert.equal((await relay.enqueue({game:"betdopovo",value:3})).reason,"invalid-payload");
  assert.equal((await relay.enqueue({game:"aviator2",value:0})).reason,"invalid-payload");
  assert.equal(calls,0);
});

test("keeps unsent candles queued after an API failure and retries them",async()=>{
  const storage=storageMock();let fail=true;const bodies=[];
  const relay=new SupabaseVelaRelay({storage,fetchImpl:async(_url,options)=>{
    bodies.push(JSON.parse(options.body));
    if(fail)return {ok:false,status:503};
    return {ok:true,status:201};
  }});
  const first=await relay.enqueue({game:"aviator",value:7.2,detectedAt:"2026-11-01T12:00:00.000Z"});
  assert.equal(first.ok,false);
  assert.equal(JSON.parse(storage.values.get("thelord_capturecore_pending_velas_v1")).length,1);
  fail=false;
  const second=await relay.flush();
  assert.equal(second.ok,true);
  assert.equal(second.sent,1);
  assert.equal(JSON.parse(storage.values.get("thelord_capturecore_pending_velas_v1")).length,0);
});
