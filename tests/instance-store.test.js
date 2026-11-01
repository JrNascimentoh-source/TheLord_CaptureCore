import test from "node:test";
import assert from "node:assert/strict";
import {InstanceStore} from "../src/core/instance-store.js";

function installStorage(){
  const values=new Map();
  globalThis.localStorage={
    getItem:key=>values.has(key)?values.get(key):null,
    setItem:(key,value)=>values.set(key,String(value)),
    removeItem:key=>values.delete(key)
  };
  return values;
}

test("creates separate instances and records rounds per instance",()=>{
  installStorage();
  const store=new InstanceStore();
  const first=store.create({platformId:"7a7",gameId:"aviator",screenName:"Tela 1",sourceUrl:"https://example.com/game"});
  const second=store.create({platformId:"betdopovo",gameId:"aviator2",screenName:"Tela 2",sourceUrl:"https://example.org/game"});
  store.recordRound(first.id,{value:2.45,game:"aviator"});
  store.recordRound(first.id,{value:15.2,game:"aviator"});
  store.recordRound(second.id,{value:4.1,game:"aviator2"});
  const items=store.list();
  assert.equal(items.find(item=>item.id===first.id).roundCount,2);
  assert.equal(items.find(item=>item.id===first.id).lastValue,15.2);
  assert.equal(items.find(item=>item.id===second.id).roundCount,1);
  assert.equal(items.find(item=>item.id===second.id).lastValue,4.1);
});
test("rejects unsupported games and invalid captured values",()=>{
  installStorage();
  const store=new InstanceStore();
  assert.throws(()=>store.create({platformId:"betdopovo",gameId:"aviatorvip",screenName:"Tela inválida",sourceUrl:"https://example.com/game"}));
  const item=store.create({platformId:"betdopovo",gameId:"aviator2",screenName:"Tela 2",sourceUrl:"https://example.com/game"});
  assert.equal(store.recordRound(item.id,{value:0}),null);
  assert.equal(store.recordRound(item.id,{value:1000000}),null);
  assert.equal(store.list()[0].roundCount,0);
});
