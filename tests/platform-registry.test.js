import test from "node:test";
import assert from "node:assert/strict";
import {GAMES,PLATFORMS,isValidPair,getGame,getPlatform} from "../src/core/platform-registry.js";

test("declares the two supported game routes",()=>{
  assert.deepEqual(Object.keys(GAMES).sort(),["aviator","aviator2"]);
});
test("maps each game to the intended platform and database key",()=>{
  assert.equal(GAMES.aviator.platform,"7a7");
  assert.equal(GAMES.aviator.databaseKey,"aviator");
  assert.equal(GAMES.aviator2.platform,"betdopovo");
  assert.equal(GAMES.aviator2.databaseKey,"aviator2");
});
test("accepts only supported platform and game combinations",()=>{
  assert.equal(isValidPair("7a7","aviator"),true);
  assert.equal(isValidPair("betdopovo","aviator2"),true);
  assert.equal(isValidPair("betdopovo","unsupported-game"),false);
  assert.equal(isValidPair("betdopovo","aviator"),false);
  assert.equal(isValidPair("unknown","aviator"),false);
});
test("returns null for unknown registry entries",()=>{
  assert.equal(getGame("unknown"),null);
  assert.equal(getPlatform("unknown"),null);
});
