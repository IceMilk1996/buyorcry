import { Action, Candle } from './types';

/**
 * 기준 전략들.
 *
 * 시뮬레이션에서 "필터가 재미있는 구간을 뽑는가"를 판정하는 데 쓴다.
 * 랜덤과 이평선 전략의 초과수익이 둘 다 0 근처에서 뭉치면,
 * 그 구간들은 어떤 판단을 해도 결과가 같다는 뜻 = 지루한 문제다.
 */

export type Strategy = (play: Candle[], rng: () => number) => Action[];

/** 1턴에 사서 끝까지 보유 — 홀드와 동일. 초과수익이 0에 수렴해야 정상 */
export const alwaysHold: Strategy = (play) =>
  play.map((_, i) => (i === 0 ? 'BUY' : 'HOLD'));

/** 아무것도 안 함 — 현금 보유 */
export const allCash: Strategy = (play) => play.map(() => 'HOLD');

/** 무작위 매매 */
export const random: Strategy = (play, rng) =>
  play.map(() => {
    const r = rng();
    if (r < 0.2) return 'BUY';
    if (r < 0.4) return 'SELL';
    return 'HOLD';
  });

/** 단기·장기 이동평균 교차 */
export function smaCross(shortN = 5, longN = 20): Strategy {
  return (play) => {
    const closes = play.map((c) => c.c);
    const sma = (n: number, i: number) => {
      if (i + 1 < n) return null;
      let s = 0;
      for (let k = i - n + 1; k <= i; k++) s += closes[k];
      return s / n;
    };
    return closes.map((_, i) => {
      const s = sma(shortN, i);
      const l = sma(longN, i);
      if (s === null || l === null) return 'HOLD';
      return s > l ? 'BUY' : 'SELL';
    });
  };
}

/** 직전 봉이 크게 빠지면 사고, 크게 오르면 판다 */
export function meanReversion(threshold = 0.02): Strategy {
  return (play) =>
    play.map((c, i) => {
      if (i === 0) return 'HOLD';
      const r = c.c / play[i - 1].c - 1;
      if (r < -threshold) return 'BUY';
      if (r > threshold) return 'SELL';
      return 'HOLD';
    });
}
