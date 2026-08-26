import fs from 'node:fs';
import path from 'node:path';
import { Candle, Series } from '../game/types';

/**
 * 캔들 파일(컬럼 포맷) 로더.
 *
 * data/series/{종목코드}.json 은 일봉만, 그것도 배열 다발로 들어있다:
 *   {"s":"005930","n":"삼성전자","t":[20150102,...],"o":[...],"h":[...],"l":[...],"c":[...]}
 *
 * 캔들마다 객체를 쓰면 키 이름이 봉 수만큼 반복돼 45MB 가 됐다. 컬럼 포맷은
 * 17MB 라서 저장소에 그냥 올릴 수 있다. 거래량은 어디서도 안 써서 뺐다.
 *
 * 주봉 파일이 따로 없는 것도 같은 이유다 — 일봉을 금요일 기준으로 묶으면
 * 그대로 나온다(toWeekly 참고). 원본 수집 스크립트의 pandas
 * `resample("W-FRI")` 과 같은 구간(토요일~금요일, 라벨은 그 주 금요일)이다.
 */

export type ColumnarSeries = {
  s: string;
  n: string;
  t: number[];
  o: number[];
  h: number[];
  l: number[];
  c: number[];
};

/** 20150102 -> "2015-01-02" */
export function fmtDate(t: number): string {
  const s = String(t);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function toCandles(col: ColumnarSeries): Candle[] {
  const out: Candle[] = new Array(col.t.length);
  for (let i = 0; i < col.t.length; i++) {
    out[i] = { t: fmtDate(col.t[i]), o: col.o[i], h: col.h[i], l: col.l[i], c: col.c[i] };
  }
  return out;
}

/** 그 날짜가 속한 주의 금요일(YYYY-MM-DD). 토요일은 다음 주로 넘어간다. */
function fridayOf(t: number): string {
  const y = Math.floor(t / 10000);
  const m = Math.floor(t / 100) % 100;
  const d = t % 100;
  const ms = Date.UTC(y, m - 1, d);
  const add = (5 - new Date(ms).getUTCDay() + 7) % 7;
  return new Date(ms + add * 86_400_000).toISOString().slice(0, 10);
}

/** 일봉 -> 주봉. 거래가 없는 주는 만들지 않는다. */
export function toWeekly(col: ColumnarSeries): Candle[] {
  const out: Candle[] = [];
  let key = '';
  for (let i = 0; i < col.t.length; i++) {
    const k = fridayOf(col.t[i]);
    if (k !== key) {
      out.push({ t: k, o: col.o[i], h: col.h[i], l: col.l[i], c: col.c[i] });
      key = k;
    } else {
      const w = out[out.length - 1];
      if (col.h[i] > w.h) w.h = col.h[i];
      if (col.l[i] < w.l) w.l = col.l[i];
      w.c = col.c[i];
    }
  }
  return out;
}

/** 파일 하나 -> 일봉/주봉 두 개의 Series */
export function expand(col: ColumnarSeries): { D: Series; W: Series } {
  return {
    D: { symbol: col.s, name: col.n, interval: 'D', candles: toCandles(col) },
    W: { symbol: col.s, name: col.n, interval: 'W', candles: toWeekly(col) },
  };
}

export function readSeriesFile(dir: string, file: string): { D: Series; W: Series } {
  return expand(JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')) as ColumnarSeries);
}

/**
 * 전 종목을 일봉·주봉 모두 펼쳐서 반환한다. 측정 도구(tools/*.ts) 전용 —
 * 서버 런타임에서는 절대 쓰지 말 것. 200종목이면 수백 MB 다.
 */
export function loadAllSeries(dir = path.join(process.cwd(), 'data', 'series')): Series[] {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  const out: Series[] = [];
  for (const f of files) {
    const { D, W } = readSeriesFile(dir, f);
    out.push(D, W);
  }
  return out;
}
