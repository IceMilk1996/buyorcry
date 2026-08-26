import { Candle, GameState, Interval } from '../game/types';

/**
 * 세션 저장소.
 *
 * ⚠️ 미래 캔들을 클라이언트로 보내지 않는 것이 이 게임의 핵심 규칙이다(기획서 7.1).
 *    그래서 전체 구간과 자산 계산은 반드시 서버가 소유한다.
 *    클라이언트가 보내온 점수는 절대 믿지 않는다.
 *
 * 지금은 프로세스 메모리다. 개발 중 HMR이나 재시작이면 날아가고,
 * 서버리스로 배포하면 인스턴스마다 따로 논다.
 * 데일리 리더보드를 붙이는 시점에 Vercel KV 로 옮길 것.
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

const TTL_MS = 2 * 60 * 60 * 1000;

/** globalThis 에 두는 이유는 share.ts 주석 참조 (HMR · 번들 분리) */
const g = globalThis as typeof globalThis & { __sessions?: Map<string, SessionRecord> };
const sessions: Map<string, SessionRecord> = (g.__sessions ??= new Map());

function sweep() {
  const cutoff = Date.now() - TTL_MS;
  for (const [id, s] of sessions) if (s.createdAt < cutoff) sessions.delete(id);
}

export function putSession(rec: SessionRecord): void {
  sweep();
  sessions.set(rec.id, rec);
}

export function getSession(id: string): SessionRecord | undefined {
  return sessions.get(id);
}

export function newSessionId(): string {
  return crypto.randomUUID();
}
