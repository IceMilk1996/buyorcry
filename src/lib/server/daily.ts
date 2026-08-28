import { Rank } from '../game/types';
import { hGetJSON, hSetJSON, hValuesJSON } from './kv';

/**
 * 오늘의 챌린지 집계와 순위표.
 *
 * 데일리는 전원이 같은 차트를 풀기 때문에 순위 비교가 성립한다.
 * (무한 모드는 사람마다 차트가 달라 수익률도 알파도 줄 세울 수 없다.)
 *
 * 저장 구조는 날짜별 해시 하나다 — daily:{날짜} 의 필드가 회원번호.
 * 통짜 배열 하나로 두지 않은 이유: 두 사람이 동시에 결과를 내면
 * 읽고-고쳐-쓰는 사이에 한쪽 기록이 사라진다. 해시는 각자 자기 필드만
 * 건드리므로 그 경합 자체가 없다.
 */

export type DailyEntry = {
  /** 로그인한 사용자. 하루 1회 강제와 닉네임 갱신의 기준 */
  userId: string;
  nick: string | null;
  alpha: number;
  myReturn: number;
  rank: Rank;
  at: number;
  /** 그날 결과를 다시 열 수 있는 링크. 없던 시절 기록은 undefined */
  shareId?: string;
};

export type BoardRow = {
  place: number;
  nick: string;
  alpha: number;
  rankLabel: string;
  isMe: boolean;
  /** 이 줄 앞에 "…" 를 그릴지 (상위권과 내 주변 사이가 끊긴 자리) */
  gapBefore: boolean;
};

export type DailyStanding = {
  place: number;
  total: number;
  /** 상위 몇 퍼센트인지 (1 = 최상위). 참가자가 적으면 null — percentileOf 참조 */
  percentile: number | null;
  /** 순위표 — 상위 3명 + 내 주변, 합쳐서 최대 10줄 */
  rows: BoardRow[];
  /** 등급별 인원 */
  spread: { label: string; count: number }[];
};

const TOP = 3;
const ROWS = 10;

/** 지난 순위표를 영원히 들고 있을 이유는 없다 */
const TTL_SEC = 14 * 24 * 60 * 60;

const key = (date: string) => `daily:${date}`;

/** 이 사람이 오늘 이미 했는지 — 서버가 판단해야 우회가 막힌다 */
export async function findTodayEntry(
  date: string,
  userId: string
): Promise<DailyEntry | null> {
  return hGetJSON<DailyEntry>(key(date), userId);
}

export async function submitDaily(date: string, entry: DailyEntry): Promise<DailyStanding> {
  await hSetJSON(key(date), entry.userId, entry, TTL_SEC);
  return standingOf(date, entry.userId);
}

/** 결과를 낸 뒤에 닉네임을 정한 경우. 오늘 기록에 바로 반영된다 */
export async function setDailyNick(
  date: string,
  userId: string,
  nick: string
): Promise<DailyStanding | null> {
  const found = await findTodayEntry(date, userId);
  if (!found) return null;
  await hSetJSON(key(date), userId, { ...found, nick: nick.slice(0, 12) }, TTL_SEC);
  return standingOf(date, userId);
}

export async function standingOf(date: string, userId: string): Promise<DailyStanding> {
  const list = (await hValuesJSON<DailyEntry>(key(date))).sort((a, b) => b.alpha - a.alpha);

  /*
   * 내 기록이 없으면 -1 이다. 전에는 Math.max(0, ...) 로 0 으로 만들었는데,
   * 그러면 남의 1등 줄에 "나" 강조가 붙고 나는 1등으로 표시된다.
   * 오류를 감추는 대신 거짓말을 하는 형태라, 아예 순위표에서 빼는 편이 낫다.
   */
  const idx = list.findIndex((e) => e.userId === userId);
  const total = Math.max(1, list.length);
  const place = idx >= 0 ? idx + 1 : total;

  const counts = new Map<string, number>();
  for (const e of list) counts.set(e.rank.label, (counts.get(e.rank.label) ?? 0) + 1);

  return {
    place,
    total,
    percentile: percentileOf(place, total),
    rows: buildRows(list, idx),
    spread: [...counts.entries()].map(([label, count]) => ({ label, count })),
  };
}

/** 백분위를 보여줄 최소 인원 */
const PERCENTILE_MIN = 20;

/**
 * 상위 몇 퍼센트인지. 사람이 적으면 아예 주지 않는다(null).
 *
 * 백분위를 쓰는 이유는 "873등" 이 아무 의미가 없어서인데(기획서 4.1),
 * 참가자가 몇 명뿐이면 백분위 쪽이 오히려 아무 의미가 없다. 혼자 참가하면
 * "1등 · 상위 100%" 가 되고, 몇 명이든 꼴찌는 항상 "상위 100%" 다.
 * 그럴 땐 "3명 중 1등" 만으로 충분히 읽힌다.
 */
function percentileOf(place: number, total: number): number | null {
  if (total < PERCENTILE_MIN) return null;
  return Math.max(1, Math.ceil((place / total) * 100));
}

/**
 * 상위 3명은 늘 보여주고, 나머지 자리는 내 주변으로 채운다.
 *
 * 내가 12등이면 1·2·3위 다음에 9~15위가 나와서 내가 가운데에 선다.
 * 바로 위를 누구까지 따라잡아야 하는지, 바로 아래가 누구인지가 동시에 보여야
 * 다시 할 이유가 생긴다. 내 줄이 맨 끝이면 '따라잡을 대상'만 보이고 끝난다.
 */
function buildRows(sorted: DailyEntry[], myIdx: number): BoardRow[] {
  const n = sorted.length;
  const row = (i: number, gapBefore = false): BoardRow => ({
    place: i + 1,
    nick: sorted[i].nick ?? '익명',
    alpha: sorted[i].alpha,
    rankLabel: sorted[i].rank.label,
    isMe: i === myIdx,
    gapBefore,
  });

  if (n <= ROWS) return sorted.map((_, i) => row(i));
  if (myIdx < ROWS) return Array.from({ length: ROWS }, (_, i) => row(i));

  const around = ROWS - TOP;
  let start = myIdx - Math.floor((around - 1) / 2);
  start = Math.min(Math.max(start, TOP), n - around);

  return [
    ...Array.from({ length: TOP }, (_, i) => row(i)),
    ...Array.from({ length: around }, (_, k) => row(start + k, k === 0)),
  ];
}

/** 한국 시간 기준 다음 자정까지 남은 밀리초 */
export function msUntilNextKST(now = Date.now()): number {
  const kst = now + 9 * 3600_000;
  return 86_400_000 - (kst % 86_400_000);
}
