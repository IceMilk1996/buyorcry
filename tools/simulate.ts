/**
 * 1주차의 목표는 "플레이 가능한 화면"이 아니라
 * "이 필터가 재미있는 구간을 뽑는가"를 확인하는 것이다. (기획서 14장)
 *
 * 실행:  npm run simulate
 *        npm run simulate -- --samples 2000
 *
 * data/series/*.json 이 있으면 실데이터로, 없으면 합성 데이터로 돈다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Series, REVEAL_COUNT, WINDOW_SIZE } from '../src/lib/game/types';
import { validateWindow, makeRng, computeStats, difficultyOf, DIFFICULTY_THRESHOLDS } from '../src/lib/game/puzzle';
import { playAll } from '../src/lib/game/engine';
import { makeSampleUniverse } from '../src/lib/game/sample';
import { allCash, alwaysHold, meanReversion, random, smaCross, Strategy } from '../src/lib/game/strategies';

const argv = process.argv.slice(2);
function arg(name: string, dflt: number): number {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? Number(argv[i + 1]) : dflt;
}

const SAMPLES = arg('samples', 1000);
const SEED = arg('seed', 20260825);

function loadSeries(): { data: Series[]; source: string } {
  const dir = path.join(process.cwd(), 'data', 'series');
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
    if (files.length > 0) {
      const data = files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as Series);
      return { data, source: `실데이터 ${files.length}종목` };
    }
  }
  return { data: makeSampleUniverse(), source: '합성 데이터 (실데이터 없음)' };
}

function pct(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

function summarize(name: string, xs: number[]): string {
  const s = [...xs].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(s.length * p))] ?? 0;
  const mean = xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
  return `${name.padEnd(14)} 평균 ${pct(mean).padStart(7)}   p10 ${pct(q(0.1)).padStart(7)}   중앙 ${pct(q(0.5)).padStart(7)}   p90 ${pct(q(0.9)).padStart(7)}`;
}

function main() {
  const { data, source } = loadSeries();
  console.log(`\n데이터: ${source}\n샘플 ${SAMPLES}구간, 시드 ${SEED}\n`);

  const rng = makeRng(SEED);
  const rejects: Record<string, number> = {};
  const accepted: { series: Series; startIndex: number }[] = [];

  for (let i = 0; i < SAMPLES; i++) {
    const series = data[Math.floor(rng() * data.length)];
    const maxStart = series.candles.length - WINDOW_SIZE;
    if (maxStart <= 0) continue;
    const startIndex = Math.floor(rng() * maxStart);
    const v = validateWindow(series.candles, startIndex, series.interval);
    if (v.ok) accepted.push({ series, startIndex });
    else v.reasons.forEach((r) => (rejects[r] = (rejects[r] ?? 0) + 1));
  }

  console.log('─── 필터 통과율 ───');
  console.log(`통과 ${accepted.length} / ${SAMPLES}  (${pct(accepted.length / SAMPLES)})\n`);
  console.log('탈락 사유 (중복 집계)');
  Object.entries(rejects)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, n]) => console.log(`  ${k.padEnd(20)} ${n}`));

  if (accepted.length === 0) {
    console.log('\n통과한 구간이 없습니다. FILTERS 값을 확인하세요.');
    return;
  }

  // 난이도 분포
  const diff: Record<string, number> = {};
  for (const a of accepted) {
    const play = a.series.candles.slice(a.startIndex + REVEAL_COUNT, a.startIndex + WINDOW_SIZE);
    const d = difficultyOf(computeStats(play).volatility, a.series.interval);
    diff[d] = (diff[d] ?? 0) + 1;
  }
  console.log('\n─── 난이도 분포 ───');
  Object.entries(diff).forEach(([k, n]) => console.log(`  ${k.padEnd(8)} ${n} (${pct(n / accepted.length)})`));

  // 난이도 임계값 재보정용 — 봉 간격별로 나눠서 봐야 한다
  console.log('\n  변동성 분위 (이 값을 puzzle.ts DIFFICULTY_THRESHOLDS 에 넣으면 3등분됨)');
  for (const iv of ['D', 'W'] as const) {
    const vols = accepted
      .filter((a) => a.series.interval === iv)
      .map((a) => computeStats(a.series.candles.slice(a.startIndex + REVEAL_COUNT, a.startIndex + WINDOW_SIZE)).volatility)
      .sort((x, y) => x - y);
    if (vols.length === 0) continue;
    const vq = (p: number) => vols[Math.min(vols.length - 1, Math.floor(vols.length * p))];
    const t = DIFFICULTY_THRESHOLDS[iv];
    console.log(
      `    ${iv}  n=${String(vols.length).padStart(5)}   p33 ${vq(0.33).toFixed(4)}   p67 ${vq(0.67).toFixed(4)}` +
        `   (현재 ${t.easy} / ${t.normal})`
    );
  }

  // 전략별 초과수익
  const strategies: [string, Strategy][] = [
    ['존버', alwaysHold],
    ['현금보유', allCash],
    ['무작위', random],
    ['이평교차', smaCross(5, 20)],
    ['역추세', meanReversion(0.02)],
  ];

  console.log('\n─── 전략별 초과수익(알파) ───');
  const srng = makeRng(SEED + 1);
  for (const [name, strat] of strategies) {
    const alphas = accepted.map((a) => {
      const play = a.series.candles.slice(a.startIndex + REVEAL_COUNT, a.startIndex + WINDOW_SIZE);
      return playAll(play, strat(play, srng)).alpha;
    });
    console.log('  ' + summarize(name, alphas));
  }

  console.log(`
─── 판정 기준 ───
  · '존버' 알파는 0%에 붙어야 정상 (수수료만큼 미세한 음수)
  · '무작위'와 '이평교차'의 중앙값이 서로 크게 다르면 → 판단이 결과를 바꾼다 = 좋은 구간
  · 모든 전략의 p10~p90이 좁게 뭉치면 → 뭘 해도 똑같다 = 지루한 구간, 필터를 조일 것
`);
}

main();
