import { Candle, Difficulty, GameState, Interval } from '../game/types';
import { getJSON, setJSON } from './kv';
import { msUntilNextKST } from './daily';

/**
 * 세션 저장소.
 *
 * ⚠️ 미래 캔들을 클라이언트로 보내지 않는 것이 이 게임의 핵심 규칙이다(기획서 7.1).
 *    그래서 전체 구간과 자산 계산은 반드시 서버가 소유한다.
 *    클라이언트가 보내온 점수는 절대 믿지 않는다.
 *
 * 저장은 kv.ts 를 거친다 — 서버리스에서는 요청마다 인스턴스가 달라질 수 있어서
 * 프로세스 메모리에 두면 방금 만든 세션을 다음 요청이 못 찾는다.
 */

export type SessionRecord = {
  id: string;
  symbol: string;
  name: string;
  interval: Interval;
  difficulty: Difficulty;
  /** 'daily' 면 판이 끝날 때 오늘의 순위표에 올린다 */
  mode: 'daily' | 'endless';
  /** 데일리 문제의 날짜 (KST) */
  date: string;
  /** 데일리일 때의 로그인 사용자 */
  userId: string | null;
  nick: string | null;
  /** 사전공개 + 플레이 구간 전체. 클라이언트에는 진행된 만큼만 잘라서 보낸다 */
  window: Candle[];
  state: GameState;
  /** 보유 중일 때의 체결가. 차트에 평단선을 그리는 데 쓴다 */
  entryPrice?: number;
  done: boolean;
  createdAt: number;
};

/** 무한 모드는 길어야 몇 분이다. 버려진 세션은 알아서 사라진다 */
const ENDLESS_TTL_SEC = 2 * 60 * 60;

/**
 * 오늘의 챌린지는 하루 한 번뿐이라, 하다가 나가면 그 한 번을 날리게 된다.
 * 그래서 자정(KST)까지 살려둔다 — 그날 안에 돌아오면 하던 곳부터 이어서 한다.
 * 날이 바뀌면 어차피 다른 문제이므로 같이 사라지는 게 맞다.
 */
function ttlOf(rec: SessionRecord): number {
  if (rec.mode !== 'daily') return ENDLESS_TTL_SEC;
  return Math.ceil(msUntilNextKST() / 1000) + 60;
}

const key = (id: string) => `sess:${id}`;

/** 회원번호로 "오늘 하던 판"을 찾기 위한 이정표 */
const progressKey = (date: string, userId: string) => `progress:${date}:${userId}`;

export async function putSession(rec: SessionRecord): Promise<void> {
  const ttl = ttlOf(rec);
  await setJSON(key(rec.id), rec, ttl);
  if (rec.mode === 'daily' && rec.userId) {
    await setJSON(progressKey(rec.date, rec.userId), rec.id, ttl);
  }
}

export async function getSession(id: string): Promise<SessionRecord | null> {
  return getJSON<SessionRecord>(key(id));
}

/**
 * 오늘 하다 만 판. 끝난 판은 돌려주지 않는다 —
 * 그건 재도전이 되어 하루 1회 규칙이 무너진다.
 */
export async function findDailyProgress(
  date: string,
  userId: string
): Promise<SessionRecord | null> {
  const id = await getJSON<string>(progressKey(date, userId));
  if (!id) return null;
  const s = await getSession(id);
  return s && !s.done ? s : null;
}

export function newSessionId(): string {
  return crypto.randomUUID();
}
