import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(new URL("../collector/TheLord_CaptureCore-Universal-Collector.user.js",import.meta.url),"utf8");

test("BetDoPovo root is identified as aviator2 and 7a7 as aviator",()=>{
  assert.match(source,/if\s*\(isBetDoPovoUrl\(value\)\)\s*\{\s*return\s*'aviator2'/);
  assert.match(source,/if\s*\(is7a7Url\(value\)\)\s*return\s*'aviator'/);
});

test("unknown iframe origin never defaults to the 7a7 stream",()=>{
  assert.match(source,/if\s*\(!parsed\)\s*return\s*null/);
  assert.match(source,/if\s*\(GAME\s*!==\s*'aviator'\s*&&\s*GAME\s*!==\s*'aviator2'\)\s*return/);
  assert.doesNotMatch(source,/else\s+resolve\('aviator'\)/);
});

test("root page rejects iframe rounds classified for another game",()=>{
  assert.match(source,/if\s*\(rootGame\s*&&\s*data\.data\?\.game\s*===\s*rootGame\)\s*sendToDashboard/);
});
