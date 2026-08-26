/**
 * pickPuzzle 이 뽑는 문제의 봉간격·난이도 분포 확인.
 *   npx tsx tools/check-picker.ts
 */
import fs from 'node:fs'; import path from 'node:path';
import { Series } from '../src/lib/game/types';
import { pickPuzzle, makeRng } from '../src/lib/game/puzzle';
const dir = path.join(process.cwd(),'data','series');
const all: Series[] = fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')));
const rng = makeRng(42); const cnt: Record<string,number> = {}; const diff: Record<string,number> = {};
let fail = 0;
for (let i=0;i<800;i++){ const r = pickPuzzle(all, rng); if(!r){fail++;continue;} cnt[r.puzzle.interval]=(cnt[r.puzzle.interval]??0)+1; diff[r.puzzle.difficulty]=(diff[r.puzzle.difficulty]??0)+1; }
console.log('pickPuzzle 800회 — 실패', fail);
console.log('  봉간격', cnt); console.log('  난이도', diff);
