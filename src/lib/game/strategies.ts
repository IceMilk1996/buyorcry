import { Action, Candle } from './types';

/**
 * 기준 전략들.
 *
 * 시뮬레이션에서 "필터가 재미있는 구간을 뽑는가"를 판정하는 데 쓴다.
 * 랜덤과 이평선 전략의 초과수익이 둘 다 0 근처에서 뭉치면,
 * 그 구간들은 어떤 판단을 해도 결과가 같다는 뜻 = 지루한 문제다.
 *
 * ⚠️ 턴 i 의 액션은 **i-1 번째 봉까지의 정보만** 보고 정해야 한다.
 *    플레이어가 보는 것이 딱 거기까지이고, 주문은 i 번째 봉 시가에 체결되기 때문이다.
 *    i 번째 봉의 종가를 보고 판단하면 아직 열리지도 않은 봉을 읽는 것이라
 *    기준선 자체가 망가진다. 실제로 역추세 전략이 중앙 -28% 까지 떨어졌었다.
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

/** 단기·장기 이동평균 교차. i-1 번째 봉까지만 본다 */
export function smaCross(shortN = 5, longN = 20): Strategy {
  return (play) => {
    const closes = play.map((c) => c.c);
    /** end 는 포함하지 않는 끝 인덱스 */
    const sma = (n: number, end: number) => {
      if (end < n) return null;
      let s = 0;
      for (let k = end - n; k < end; k++) s += closes[k];
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

/** 직전 봉이 크게 빠지면 사고, 크게 오르면 판다. i-1 번째 봉까지만 본다 */
export function meanReversion(threshold = 0.02): Strategy {
  return (play) =>
    play.map((_, i) => {
      if (i < 2) return 'HOLD';
      const r = play[i - 1].c / play[i - 2].c - 1;
      if (r < -threshold) return 'BUY';
      if (r > threshold) return 'SELL';
      return 'HOLD';
    });
}
