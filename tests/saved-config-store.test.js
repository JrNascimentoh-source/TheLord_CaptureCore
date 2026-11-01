import test from "node:test";
import assert from "node:assert/strict";
import {SavedConfigStore} from "../src/core/saved-config-store.js";

function installStorage(){
  const values=new Map();
  globalThis.localStorage={
    getItem:key=>values.has(key)?values.get(key):null,
    setItem:(key,value)=>values.set(key,String(value)),
    removeItem:key=>values.delete(key)
  };
  return values;
}

test("saves a configured screen and avoids duplicate profiles",()=>{
  installStorage();
  const store=new SavedConfigStore();
  const config={platformId:"betdopovo",gameId:"aviator2",screenName:"Tela principal",sourceUrl:"https://example.com/game"};
  const first=store.save(config), second=store.save(config);
  assert.equal(first.id,second.id);
  assert.equal(store.list().length,1);
  assert.equal(store.has(config),true);
});

test("removes a saved profile without touching instance storage",()=>{
  const values=installStorage();
  const store=new SavedConfigStore();
  const saved=store.save({platformId:"7a7",gameId:"aviator",screenName:"Tela 1",sourceUrl:"https://example.com"});
  values.set("thelord_capturecore_instances_v1",'[{"id":"instance-1"}]');
  assert.equal(store.remove(saved.id),true);
  assert.equal(store.list().length,0);
  assert.equal(values.get("thelord_capturecore_instances_v1"),'[{"id":"instance-1"}]');
});
