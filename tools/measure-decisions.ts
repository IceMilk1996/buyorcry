/**
 * 30턴 중 실제로 '결정'인 턴은 몇 개인가.
 *
 * 가설: 대부분의 턴은 관망 연타이고, 진짜 판단이 필요한 턴은 몇 개 안 된다.
 * 맞다면 지루함의 원인은 선택지 부족이 아니라 결정 밀도이고,
 * 처방은 비중 조절 추가가 아니라 턴 수 축소다.
 *
 *   npx tsx tools/measure-decisions.ts [--samples 800]
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  Candle,
  FEE_RATE,
  INITIAL_CAPITAL,
  REVEAL_COUNT,
  Series,
  WINDOW_SIZE,
} from '../src/lib/game/types';
import { makeRng, validateWindow } from '../src/lib/game/puzzle';
import { holdReturnOf, playAll } from '../src/lib/game/engine';
import { alwaysHold, meanReversion, random, smaCross } from '../src/lib/game/strategies';

const argv = process.argv.slice(2);
const SAMPLES = argv.includes('--samples') ? Number(argv[argv.indexOf('--samples') + 1]) : 800;

/**
 * 완전정보 최적해 (동적계획법).
 *
 * a[t] = 턴 t 시작 시점에 '현금 1원'이 최종적으로 얼마가 되는지의 최댓값
 * b[t] = 턴 t 시작 시점에 '1주 보유'가 최종적으로 얼마가 되는지의 최댓값
 *
 * 체결은 그 턴 봉의 시가(engine.step 규칙과 동일).
 * 두 선택지의 가치 차이가 곧 그 턴의 '후회(regret)' — 잘못 골랐을 때 잃는 비율이다.
 * 후회가 0에 가까운 턴은 뭘 눌러도 결과가 같은 턴, 즉 결정이 아니다.
 */
function oracle(play: Candle[]) {
  const n = play.length;
  const f = FEE_RATE;
  const a = new Array<number>(n + 1).fill(0);
  const b = new Array<number>(n + 1).fill(0);
  a[n] = 1;
  b[n] = play[n - 1].c;

  const buyBetter = new Array<boolean>(n).fill(false);
  const sellBetter = new Array<boolean>(n).fill(false);
  const regretCash = new Array<number>(n).fill(0);
  const regretHold = new Array<number>(n).fill(0);

  for (let t = n - 1; t >= 0; t--) {
    const p = play[t].o;

    const stayCash = a[t + 1];
    const doBuy = ((1 - f) / p) * b[t + 1];
    a[t] = Math.max(stayCash, doBuy);
    buyBetter[t] = doBuy > stayCash;
    regretCash[t] = Math.abs(doBuy - stayCash) / a[t];

    const stayHold = b[t + 1];
    const doSell = p * (1 - f) * a[t + 1];
    b[t] = Math.max(stayHold, doSell);
    sellBetter[t] = doSell > stayHold;
    regretHold[t] = Math.abs(doSell - stayHold) / b[t];
  }

  // 최적 경로를 따라가며 매매 횟수와 턴별 후회를 모은다
  let holding = false;
  let trades = 0;
  const regrets: number[] = [];
  for (let t = 0; t < n; t++) {
    if (!holding) {
      regrets.push(regretCash[t]);
      if (buyBetter[t]) {
        holding = true;
        trades++;
      }
    } else {
      regrets.push(regretHold[t]);
      if (sellBetter[t]) {
        holding = false;
        trades++;
      }
    }
  }

  return {
    alpha: a[0] - 1 - holdReturnOf(play),
    trades,
    regrets,
  };
}

function loadSeries(): Series[] {
  const dir = path.join(process.cwd(), 'data', 'series');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as Series);
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

function main() {
  const all = loadSeries();
  const rng = makeRng(20260826);
  const plays: Candle[][] = [];

  for (let i = 0; i < SAMPLES * 6 && plays.length < SAMPLES; i++) {
    const s = all[Math.floor(rng() * all.length)];
    const maxStart = s.candles.length - WINDOW_SIZE;
    if (maxStart <= 0) continue;
    const st = Math.floor(rng() * maxStart);
    if (validateWindow(s.candles, st, s.interval).ok) {
      plays.push(s.candles.slice(st + REVEAL_COUNT, st + WINDOW_SIZE));
    }
  }

  const N = plays[0].length;
  console.log(`\n표본 ${plays.length}판 · ${N}턴\n`);

  const or = plays.map(oracle);

  console.log('─── 완전정보 최적해가 실제로 매매하는 횟수 ───');
  const trades = or.map((o) => o.trades);
  console.log(`  평균 ${mean(trades).toFixed(1)}회   중앙 ${med(trades)}회   최소 ${Math.min(...trades)}   최대 ${Math.max(...trades)}`);
  console.log(`  → 나머지 ${(N - mean(trades)).toFixed(1)}턴은 최적해도 '관망'이다`);

  console.log('\n─── 턴별 후회(잘못 고르면 잃는 비율) 분포 ───');
  for (const th of [0.005, 0.01, 0.02, 0.05]) {
    const counts = or.map((o) => o.regrets.filter((r) => r > th).length);
    console.log(
      `  후회 > ${(th * 100).toFixed(1).padStart(4)}%  인 턴: 평균 ${mean(counts).toFixed(1)}개 / ${N}턴  (${((mean(counts) / N) * 100).toFixed(0)}%)`
    );
  }
  const nearZero = or.map((o) => o.regrets.filter((r) => r <= 0.005).length);
  console.log(`\n  뭘 눌러도 결과가 0.5% 미만으로 갈리는 턴: 평균 ${mean(nearZero).toFixed(1)}개 (${((mean(nearZero) / N) * 100).toFixed(0)}%)`);

  console.log('\n─── 참고: 최적해 알파 (인간이 도달 불가능한 상한) ───');
  console.log(`  평균 +${(mean(or.map((o) => o.alpha)) * 100).toFixed(1)}%`);

  console.log('\n─── 기준 전략들의 매매 횟수 ───');
  const srng = makeRng(7);
  for (const [name, st] of [
    ['존버', alwaysHold],
    ['무작위', random],
    ['이평교차', smaCross(5, 20)],
    ['역추세', meanReversion(0.02)],
  ] as const) {
    const t = plays.map((p) => playAll(p, st(p, srng)).actions.filter((a) => a !== 'HOLD').length);
    console.log(`  ${name.padEnd(6)} 평균 ${mean(t).toFixed(1)}회`);
  }

  console.log(`
─── 읽는 법 ───
  · 최적해 매매 횟수가 3~4회면, 30턴 중 실제 결정은 그 정도라는 뜻이다
  · '후회 > 1%' 턴이 5개 미만이면 나머지 25턴은 눌러도 안 눌러도 같은 턴이다
  · 그렇다면 지루함의 원인은 선택지 부족이 아니라 결정 밀도이고,
    처방은 비중 조절이 아니라 턴 수 축소다
`);
}

main();
