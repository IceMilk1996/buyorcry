import {
  Candle,
  Difficulty,
  Interval,
  Puzzle,
  Series,
  PLAY_COUNT,
  REVEAL_COUNT,
  WINDOW_SIZE,
} from './types';
import { holdReturnOf } from './engine';

/**
 * 문제 생성과 필터.
 *
 * 무작위 구간을 그냥 뽑으면 절반은 재미가 없다. 필터가 이 게임의 재미를 만든다.
 * (기획서 5장)
 */

export const FILTERS = {
  /** 너무 횡보하면 아무 판단도 필요 없어 지루하다 */
  minRangeRatio: 1.15,
  /** 한 방 폭등·폭락은 찍기 게임이 된다 */
  maxRangeRatio: 3.0,
  minHoldReturn: -0.4,
  maxHoldReturn: 0.8,
  /** 오르내림이 다 있어야 한다 — 이 두 조건이 가장 중요 */
  minDrawdown: 0.08,
  minRunup: 0.08,
  /**
   * 인접봉 변동률 상한 — 미조정 주가(액면분할 등) 탐지기. 반드시 봉 간격별로 다르다.
   *
   * 일봉: 국내 주식은 가격제한폭이 ±30%라 정상 데이터가 32%를 넘을 수 없다.
   *       실측에서도 197종목 일봉 최대값이 정확히 30.0%였다. 오탐 없는 탐지기.
   * 주봉: 5거래일 합산이라 정상적으로도 91%까지 나온다(실측). 일봉과 같은 기준을 걸면
   *       멀쩡한 구간이 무더기로 탈락한다. 분할 검증은 일봉이 담당하므로 느슨하게 둔다.
   */
  maxBarMove: { D: 0.32, W: 1.0 } as Record<Interval, number>,
};

export type WindowStats = {
  holdReturn: number;
  rangeRatio: number;
  maxDrawdown: number;
  maxRunup: number;
  volatility: number;
  maxBarMove: number;
};

export type Validation = {
  ok: boolean;
  reasons: string[];
  stats: WindowStats;
};

function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
}

export function computeStats(play: Candle[]): WindowStats {
  const closes = play.map((c) => c.c);
  const highs = play.map((c) => c.h);
  const lows = play.map((c) => c.l);

  const rangeRatio = Math.max(...highs) / Math.min(...lows);

  // 고점 대비 최대 낙폭, 저점 대비 최대 상승폭
  let peak = closes[0];
  let trough = closes[0];
  let maxDrawdown = 0;
  let maxRunup = 0;
  for (const c of closes) {
    peak = Math.max(peak, c);
    trough = Math.min(trough, c);
    maxDrawdown = Math.max(maxDrawdown, 1 - c / peak);
    maxRunup = Math.max(maxRunup, c / trough - 1);
  }

  const rets: number[] = [];
  let maxBarMove = 0;
  for (let i = 1; i < closes.length; i++) {
    const r = closes[i] / closes[i - 1] - 1;
    rets.push(Math.log(closes[i] / closes[i - 1]));
    maxBarMove = Math.max(maxBarMove, Math.abs(r));
  }

  return {
    holdReturn: holdReturnOf(play),
    rangeRatio,
    maxDrawdown,
    maxRunup,
    volatility: stdev(rets),
    maxBarMove,
  };
}

export function validateWindow(
  candles: Candle[],
  startIndex: number,
  interval: Interval = 'D'
): Validation {
  const window = candles.slice(startIndex, startIndex + WINDOW_SIZE);
  const reasons: string[] = [];

  if (window.length < WINDOW_SIZE) {
    return {
      ok: false,
      reasons: ['TOO_SHORT'],
      stats: {
        holdReturn: 0,
        rangeRatio: 0,
        maxDrawdown: 0,
        maxRunup: 0,
        volatility: 0,
        maxBarMove: 0,
      },
    };
  }

  const play = window.slice(REVEAL_COUNT);
  const stats = computeStats(play);

  if (window.some((c) => !(c.o > 0 && c.h > 0 && c.l > 0 && c.c > 0))) reasons.push('BAD_PRICE');
  if (stats.rangeRatio < FILTERS.minRangeRatio) reasons.push('TOO_FLAT');
  if (stats.rangeRatio > FILTERS.maxRangeRatio) reasons.push('TOO_WILD');
  if (stats.holdReturn < FILTERS.minHoldReturn) reasons.push('HOLD_TOO_LOW');
  if (stats.holdReturn > FILTERS.maxHoldReturn) reasons.push('HOLD_TOO_HIGH');
  if (stats.maxDrawdown < FILTERS.minDrawdown) reasons.push('NO_DIP');
  if (stats.maxRunup < FILTERS.minRunup) reasons.push('NO_RALLY');
  // 미조정 주가(액면분할 등) 의심 — 기획서 6.2
  if (stats.maxBarMove > FILTERS.maxBarMove[interval]) reasons.push('SUSPECT_UNADJUSTED');

  return { ok: reasons.length === 0, reasons, stats };
}

/**
 * 난이도 임계값 (구간 로그수익률 표준편차 기준). 반드시 봉 간격별로 따로 둔다.
 *
 * 주봉은 일봉보다 구조적으로 변동성이 크다 (실측 p33: 주봉 4.2% vs 일봉 2.7%).
 * 하나의 기준으로 재면 주봉이 전부 HARD로 몰린다.
 *
 * 아래 값은 코스피200 197종목 실측 분위수(p33 / p67).
 * 종목 풀을 바꾸면 `npm run simulate` 의 "변동성 분위" 출력으로 다시 맞출 것.
 */
export const DIFFICULTY_THRESHOLDS: Record<Interval, { easy: number; normal: number }> = {
  D: { easy: 0.0255, normal: 0.0338 },
  W: { easy: 0.0401, normal: 0.0554 },
};

export function difficultyOf(volatility: number, interval: Interval = 'D'): Difficulty {
  const t = DIFFICULTY_THRESHOLDS[interval];
  if (volatility < t.easy) return 'EASY';
  if (volatility < t.normal) return 'NORMAL';
  return 'HARD';
}

/** 결정적 난수 — 데일리 문제를 전 세계가 동일하게 받으려면 시드가 필요하다 */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 'YYYY-MM-DD' -> 시드 */
export function dailySeed(dateStr: string): number {
  let h = 2166136261;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function makePuzzle(series: Series, startIndex: number): Puzzle {
  const play = series.candles.slice(startIndex + REVEAL_COUNT, startIndex + WINDOW_SIZE);
  const stats = computeStats(play);
  return {
    id: `${series.symbol}-${series.interval}-${startIndex}`,
    symbol: series.symbol,
    name: series.name,
    interval: series.interval,
    startIndex,
    difficulty: difficultyOf(stats.volatility, series.interval),
    holdReturn: stats.holdReturn,
    volatility: stats.volatility,
  };
}

/**
 * 필터를 통과하는 구간이 나올 때까지 뽑는다.
 *
 * 봉 간격을 먼저 균등하게 고르는 것이 중요하다. 종목 풀에서 그냥 무작위로 뽑으면
 * 주봉이 변동성 조건을 더 쉽게 통과해 실측상 문제의 2/3가 주봉이 됐다.
 * 주봉 30봉은 약 7개월, 일봉 30봉은 약 6주라 게임 성격이 전혀 다르므로 비율을 통제한다.
 */
export function pickPuzzle(
  all: Series[],
  rng: () => number,
  maxTries = 500
): { puzzle: Puzzle; series: Series } | null {
  const byInterval: Record<Interval, Series[]> = {
    D: all.filter((s) => s.interval === 'D'),
    W: all.filter((s) => s.interval === 'W'),
  };

  // 간격은 루프 밖에서 한 번만 고른다. 루프 안에서 매번 다시 고르면
  // 필터를 더 잘 통과하는 쪽(주봉)이 계속 이겨서 편향이 그대로 남는다.
  const interval: Interval = rng() < 0.5 ? 'D' : 'W';
  const pool = byInterval[interval].length > 0 ? byInterval[interval] : all;

  for (let i = 0; i < maxTries; i++) {
    const series = pool[Math.floor(rng() * pool.length)];
    const maxStart = series.candles.length - WINDOW_SIZE;
    if (maxStart <= 0) continue;
    const startIndex = Math.floor(rng() * maxStart);
    if (validateWindow(series.candles, startIndex, series.interval).ok) {
      return { puzzle: makePuzzle(series, startIndex), series };
    }
  }
  return null;
}

export { PLAY_COUNT, REVEAL_COUNT, WINDOW_SIZE };
