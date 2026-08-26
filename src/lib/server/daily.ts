import { Rank } from '../game/types';

/**
 * 오늘의 챌린지 집계와 순위표.
 *
 * 데일리는 전원이 같은 차트를 풀기 때문에 순위 비교가 성립한다.
 * (무한 모드는 사람마다 차트가 달라 수익률도 알파도 줄 세울 수 없다.)
 *
 * ⚠️ 지금은 프로세스 메모리다. 랭킹은 '여러 사람의 결과가 한곳에 모이는 것'이
 *    전부라서, 서버리스로 배포하면 인스턴스마다 다른 순위가 나온다.
 *    배포 전에 Vercel KV 로 옮겨야 한다. 외부에서 쓰는 함수는 아래 넷뿐이므로
 *    그 안쪽만 바꾸면 된다.
 */

export type DailyEntry = {
  id: string;
  /** 로그인한 사용자. 하루 1회 강제와 닉네임 갱신의 기준 */
  userId: string;
  nick: string | null;
  alpha: number;
  myReturn: number;
  rank: Rank;
  at: number;
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
  entryId: string;
  place: number;
  total: number;
  /** 상위 몇 퍼센트인지 (1 = 최상위) */
  percentile: number;
  /** 순위표 — 상위 3명 + 내 주변, 합쳐서 최대 10줄 */
  rows: BoardRow[];
  /** 등급별 인원 */
  spread: { label: string; count: number }[];
};

const TOP = 3;
const ROWS = 10;

const g = globalThis as typeof globalThis & { __daily?: Map<string, DailyEntry[]> };
const boards: Map<string, DailyEntry[]> = (g.__daily ??= new Map());

function sweep() {
  if (boards.size <= 14) return;
  const keys = [...boards.keys()].sort();
  while (keys.length > 14) boards.delete(keys.shift()!);
}

/** 이 사람이 오늘 이미 했는지 — 서버가 판단해야 우회가 막힌다 */
export function findTodayEntry(date: string, userId: string): DailyEntry | undefined {
  return boards.get(date)?.find((e) => e.userId === userId);
}

export function submitDaily(
  date: string,
  entry: Omit<DailyEntry, 'id'> & { id?: string }
): DailyStanding {
  sweep();
  const rec: DailyEntry = { ...entry, id: entry.id ?? crypto.randomUUID().slice(0, 12) };
  const list = boards.get(date) ?? [];
  list.push(rec);
  boards.set(date, list);
  return standingOf(date, rec.id);
}

/** 결과를 낸 뒤에 닉네임을 정한 경우. 오늘 기록에 바로 반영된다 */
export function setDailyNick(date: string, userId: string, nick: string): DailyStanding | null {
  const found = findTodayEntry(date, userId);
  if (!found) return null;
  found.nick = nick.slice(0, 12);
  return standingOf(date, found.id);
}

export function standingOf(date: string, entryId: string): DailyStanding {
  const list = (boards.get(date) ?? []).slice().sort((a, b) => b.alpha - a.alpha);
  const idx = Math.max(0, list.findIndex((e) => e.id === entryId));
  const total = Math.max(1, list.length);
  const place = idx + 1;

  const counts = new Map<string, number>();
  for (const e of list) counts.set(e.rank.label, (counts.get(e.rank.label) ?? 0) + 1);

  return {
    entryId,
    place,
    total,
    percentile: Math.max(1, Math.round((place / total) * 100)),
    rows: buildRows(list, idx),
    spread: [...counts.entries()].map(([label, count]) => ({ label, count })),
  };
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
