/**
 * 봉 간격별 변동성·인접봉 변동 분포 측정. 임계값 재보정용.
 *   npx tsx tools/probe-intervals.ts
 */
import { Series, REVEAL_COUNT, WINDOW_SIZE } from '../src/lib/game/types';
import { computeStats, makeRng, validateWindow } from '../src/lib/game/puzzle';
import { loadAllSeries } from '../src/lib/server/series';

const all: Series[] = loadAllSeries();

const q = (xs: number[], p: number) => [...xs].sort((a,b)=>a-b)[Math.min(xs.length-1, Math.floor(xs.length*p))];

for (const iv of ['D','W'] as const) {
  const pool = all.filter(s => s.interval === iv);
  const rng = makeRng(777);
  const vols: number[] = [], bars: number[] = [];
  let n = 0, susp = 0;
  for (let i = 0; i < 4000 && n < 1200; i++) {
    const s = pool[Math.floor(rng()*pool.length)];
    const max = s.candles.length - WINDOW_SIZE;
    if (max <= 0) continue;
    const st = Math.floor(rng()*max);
    const v = validateWindow(s.candles, st);
    const play = s.candles.slice(st+REVEAL_COUNT, st+WINDOW_SIZE);
    const stats = computeStats(play);
    bars.push(stats.maxBarMove);
    if (v.reasons.includes('SUSPECT_UNADJUSTED')) susp++;
    if (v.ok) { vols.push(stats.volatility); n++; }
  }
  console.log(`\n[${iv}] 종목 ${pool.length}  통과표본 ${vols.length}`);
  console.log(`  변동성  p33 ${q(vols,0.33).toFixed(4)}  p67 ${q(vols,0.67).toFixed(4)}  p95 ${q(vols,0.95).toFixed(4)}`);
  console.log(`  인접봉  p95 ${(q(bars,0.95)*100).toFixed(1)}%  p99 ${(q(bars,0.99)*100).toFixed(1)}%  max ${(q(bars,1)*100).toFixed(1)}%  / 40%초과 표본 ${susp}`);
}
