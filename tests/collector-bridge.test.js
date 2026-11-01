import test from "node:test";
import assert from "node:assert/strict";
import {CollectorBridge,COLLECTOR_MESSAGE_TYPE} from "../src/adapters/collector-bridge.js";

test("accepts events only from the popup registered for that instance",()=>{
  const bridge=new CollectorBridge();
  const popup={name:"game-window"},otherPopup={name:"other-window"};
  const received=[];
  bridge.register("screen-a",popup);
  bridge.onCollectorEvent(detail=>received.push(detail));
  bridge.handleMessage({source:otherPopup,data:{type:COLLECTOR_MESSAGE_TYPE,version:1,instanceId:"screen-a",kind:"heartbeat"}});
  assert.equal(received.length,0);
  bridge.handleMessage({source:popup,data:{type:COLLECTOR_MESSAGE_TYPE,version:1,instanceId:"screen-a",kind:"heartbeat",data:{game:"aviator"}}});
  assert.equal(received.length,1);
  assert.equal(received[0].instanceId,"screen-a");
  assert.equal(received[0].kind,"heartbeat");
});
test("rejects unknown event kinds and unregistered instances",()=>{
  const bridge=new CollectorBridge(),popup={};
  const received=[];
  bridge.register("screen-a",popup);
  bridge.onCollectorEvent(detail=>received.push(detail));
  bridge.handleMessage({source:popup,data:{type:COLLECTOR_MESSAGE_TYPE,version:1,instanceId:"screen-a",kind:"arbitrary"}});
  bridge.handleMessage({source:popup,data:{type:COLLECTOR_MESSAGE_TYPE,version:1,instanceId:"screen-b",kind:"round"}});
  assert.equal(received.length,0);
});
