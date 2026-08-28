import { Interval } from '../game/types';
import { getJSON, setJSON } from './kv';

/**
 * 회원번호별 전적.
 *
 * 순위표(daily.ts)로는 이걸 만들 수 없다 — 날짜별로 14일만 남고, 무한 모드는
 * 아예 안 들어가고, 남는 것도 알파 하나뿐이다. 그래서 판이 끝날 때마다
 * 따로 한 줄씩 쌓는다.
 *
 * 저장은 배열 하나다. 순위표는 여러 사람이 동시에 쓰기 때문에 해시로 나눴지만,
 * 여기는 한 사람이 자기 것만 쓰고 한 번에 한 판만 하므로 경합이 없다.
 */

export type HistoryEntry = {
  at: number;
  mode: 'daily' | 'endless';
  /** 문제의 날짜(KST). 데일리는 이게 곧 회차다 */
  date: string;
  alpha: number;
  myReturn: number;
  holdReturn: number;
  rankLabel: string;
  interval: Interval;
  /** 종목명 — 본인만 보는 화면이라 공개한다. 공유 링크에는 절대 넣지 않는다 */
  name: string;
  from: string;
  to: string;
  tradeCount: number;
  shareId: string;
};

export type Career = {
  total: number;
  daily: number;
  /** 존버를 이긴 판 수 */
  beatHold: number;
  avgAlpha: number;
  bestAlpha: number;
  bestRankLabel: string | null;
  entries: HistoryEntry[];
};

/**
 * 50판을 넘으면 오래된 것부터 버린다.
 * 통산 평균이 최근 50판 기준이 되지만, 전부 들고 있으면 한 번 읽을 때마다
 * 수백 KB를 옮기게 된다. 이 게임에서 반년 전 판의 평균 기여는 볼 이유가 없다.
 */
const MAX = 50;
const TTL_SEC = 365 * 24 * 60 * 60;

const key = (userId: string) => `history:${userId}`;

export async function addHistory(userId: string, e: HistoryEntry): Promise<void> {
  const list = (await getJSON<HistoryEntry[]>(key(userId))) ?? [];
  list.unshift(e);
  await setJSON(key(userId), list.slice(0, MAX), TTL_SEC);
}

export async function careerOf(userId: string): Promise<Career> {
  const entries = (await getJSON<HistoryEntry[]>(key(userId))) ?? [];
  if (entries.length === 0) {
    return {
      total: 0,
      daily: 0,
      beatHold: 0,
      avgAlpha: 0,
      bestAlpha: 0,
      bestRankLabel: null,
      entries: [],
    };
  }

  let sum = 0;
  let best = entries[0];
  let beatHold = 0;
  let daily = 0;
  for (const e of entries) {
    sum += e.alpha;
    if (e.alpha > best.alpha) best = e;
    // 존버를 이겼다고 하려면 알파가 양수인 것만으로는 부족하다.
    // 전부 관망해도 하락장이면 알파가 커진다 — 등급 규칙과 같은 이유다(기획서 3.5)
    if (e.alpha > 0 && e.myReturn > 0) beatHold++;
    if (e.mode === 'daily') daily++;
  }

  return {
    total: entries.length,
    daily,
    beatHold,
    avgAlpha: sum / entries.length,
    bestAlpha: best.alpha,
    bestRankLabel: best.rankLabel,
    entries,
  };
}
