import { Candle, Series } from './types';
import { makeRng } from './puzzle';

/**
 * 합성 캔들 생성기.
 *
 * 실제 주가 데이터를 받기 전에 엔진과 필터를 돌려보기 위한 것.
 * 국면(상승/하락/횡보)이 바뀌는 랜덤워크라 필터가 실제로 걸러내는지 확인할 수 있다.
 * 실데이터가 들어오면 이 파일은 테스트용으로만 남는다.
 */

type Regime = { drift: number; vol: number; len: number };

/**
 * 국면 비중은 실제 주식시장에 맞춰 완만한 우상향이 되도록 잡았다.
 *
 * 상승·하락을 대칭으로 두면 변동성 드래그 때문에 장기 기대수익이 음수가 되고,
 * 그러면 "아무것도 안 하고 현금 보유"가 존버를 이기는 왜곡이 생긴다.
 * 실데이터에서는 나타나지 않는 합성 데이터만의 문제라 여기서 보정한다.
 */
function nextRegime(rng: () => number): Regime {
  const r = rng();
  const len = 15 + Math.floor(rng() * 60);
  const vol = 0.012 + rng() * 0.02;
  // 변동성 드래그(vol^2/2)를 상쇄하고 약간의 우상향을 남긴다
  const carry = (vol * vol) / 2 + 0.0004;
  if (r < 0.42) return { drift: carry + 0.0025 + rng() * 0.004, vol, len };
  if (r < 0.72) return { drift: carry - (0.003 + rng() * 0.004), vol, len };
  return { drift: carry + (rng() - 0.5) * 0.001, vol: 0.008 + rng() * 0.012, len };
}

function gauss(rng: () => number): number {
  const u = 1 - rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function makeSampleSeries(symbol: string, name: string, length: number, seed: number): Series {
  const rng = makeRng(seed);
  const candles: Candle[] = [];
  let price = 10_000 + rng() * 90_000;
  let regime = nextRegime(rng);
  let left = regime.len;

  const start = new Date('2015-01-02T00:00:00Z');

  for (let i = 0; i < length; i++) {
    if (left-- <= 0) {
      regime = nextRegime(rng);
      left = regime.len;
    }
    const open = price;
    const ret = regime.drift + regime.vol * gauss(rng);
    const close = Math.max(100, open * (1 + ret));
    const wick = Math.abs(regime.vol * gauss(rng)) * 0.6;
    const high = Math.max(open, close) * (1 + wick);
    const low = Math.min(open, close) * (1 - wick);

    const d = new Date(start.getTime() + i * 86400000);
    candles.push({
      t: d.toISOString().slice(0, 10),
      o: round(open),
      h: round(high),
      l: round(low),
      c: round(close),
      v: Math.floor(100_000 + rng() * 2_000_000),
    });
    price = close;
  }

  return { symbol, name, interval: 'D', candles };
}

function round(x: number): number {
  return Math.round(x * 100) / 100;
}

export function makeSampleUniverse(count = 30, length = 1500, seed = 20260825): Series[] {
  const rng = makeRng(seed);
  return Array.from({ length: count }, (_, i) =>
    makeSampleSeries(
      `SAMPLE${String(i + 1).padStart(3, '0')}`,
      `합성종목${i + 1}`,
      length,
      Math.floor(rng() * 1e9)
    )
  );
}
