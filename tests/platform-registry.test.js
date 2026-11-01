import test from "node:test";
import assert from "node:assert/strict";
import {GAMES,PLATFORMS,isValidPair,getGame,getPlatform} from "../src/core/platform-registry.js";

test("declares the three agreed game routes",()=>{
  assert.deepEqual(Object.keys(GAMES).sort(),["aviator","aviator2","aviatorvip"]);
});
test("maps each game to the intended platform and database key",()=>{
  assert.equal(GAMES.aviator.platform,"7a7");
  assert.equal(GAMES.aviator.databaseKey,"aviator");
  assert.equal(GAMES.aviator2.platform,"betdopovo");
  assert.equal(GAMES.aviator2.databaseKey,"aviator2");
  assert.equal(GAMES.aviatorvip.platform,"betdopovo");
  assert.equal(GAMES.aviatorvip.databaseKey,"aviatorvip");
});
test("accepts only supported platform and game combinations",()=>{
  assert.equal(isValidPair("7a7","aviator"),true);
  assert.equal(isValidPair("betdopovo","aviator2"),true);
  assert.equal(isValidPair("betdopovo","aviatorvip"),true);
  assert.equal(isValidPair("7a7","aviatorvip"),false);
  assert.equal(isValidPair("betdopovo","aviator"),false);
  assert.equal(isValidPair("unknown","aviator"),false);
});
test("returns null for unknown registry entries",()=>{
  assert.equal(getGame("unknown"),null);
  assert.equal(getPlatform("unknown"),null);
});
