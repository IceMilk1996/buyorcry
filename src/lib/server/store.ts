import { Candle, GameState, Interval } from '../game/types';
import { getJSON, setJSON } from './kv';

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

/** 한 판은 길어야 몇 분이다. 2시간이면 넉넉하고, 버려진 세션은 알아서 사라진다 */
const TTL_SEC = 2 * 60 * 60;

const key = (id: string) => `sess:${id}`;

export async function putSession(rec: SessionRecord): Promise<void> {
  await setJSON(key(rec.id), rec, TTL_SEC);
}

export async function getSession(id: string): Promise<SessionRecord | null> {
  return getJSON<SessionRecord>(key(id));
}

export function newSessionId(): string {
  return crypto.randomUUID();
}
