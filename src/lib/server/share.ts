import { Action, Interval, Difficulty, Rank } from '../game/types';

/**
 * 공유된 결과 저장소.
 *
 * ⚠️ 스포일러 규칙이 이 파일의 존재 이유다.
 *
 * 데일리는 전 세계가 같은 차트를 푼다. 내 결과 링크를 아직 안 푼 친구가 열었을 때
 * 종목명·기간·차트가 보이면 그 친구의 게임은 끝난다. 워들의 이모지 격자가
 * 정답을 감춘 채 성적만 보여준 것과 같은 이유로, 여기서도 가려야 한다.
 *
 * 특히 **내 수익률과 존버 수익률을 함께 공개하면 안 된다.**
 * 둘의 차이가 알파이므로, 하나를 알면 나머지를 역산할 수 있고
 * 존버 수익률은 곧 "이 차트가 결국 올랐는가"라는 정답이다.
 * 그래서 공개하는 성적은 **알파 하나뿐**이다.
 */

export type ShareRecord = {
  id: string;
  createdAt: number;
  // ── 공개해도 되는 것 ──
  alpha: number;
  rank: Rank;
  actions: Action[];
  interval: Interval;
  difficulty: Difficulty;
  // ── 본인만 볼 수 있는 것 (스포일러) ──
  myReturn: number;
  holdReturn: number;
  finalEquity: number;
  symbol: string;
  name: string;
  from: string;
  to: string;
};

/** 링크를 연 사람에게 내려보내는 형태 */
export type PublicShare = Pick<
  ShareRecord,
  'id' | 'alpha' | 'rank' | 'actions' | 'interval' | 'difficulty' | 'createdAt'
>;

export function toPublic(r: ShareRecord): PublicShare {
  return {
    id: r.id,
    alpha: r.alpha,
    rank: r.rank,
    actions: r.actions,
    interval: r.interval,
    difficulty: r.difficulty,
    createdAt: r.createdAt,
  };
}

const TTL_MS = 30 * 24 * 60 * 60 * 1000;

/*
 * globalThis 에 매달아 두는 이유:
 *   ① 개발 중 HMR 로 모듈이 다시 평가되면 모듈 스코프 Map 은 초기화된다
 *   ② Next.js 는 서버 컴포넌트와 라우트 핸들러를 서로 다른 번들로 만든다.
 *      모듈 스코프에 두면 /api 에서 저장한 걸 /r/[id] 페이지가 못 읽는다.
 *      실제로 이것 때문에 공유 링크가 전부 '찾을 수 없음' 이 됐다.
 */
const g = globalThis as typeof globalThis & { __shares?: Map<string, ShareRecord> };
const shares: Map<string, ShareRecord> = (g.__shares ??= new Map());

/**
 * 지금은 프로세스 메모리다. 서버가 재시작하면 링크가 죽고,
 * 서버리스로 배포하면 인스턴스마다 따로 논다.
 * 링크 공유는 '다른 사람이 나중에 여는 것'이 전부이므로
 * 배포 전에 반드시 Vercel KV 같은 외부 저장소로 옮겨야 한다.
 */
export function putShare(rec: ShareRecord): void {
  const cutoff = Date.now() - TTL_MS;
  for (const [k, v] of shares) if (v.createdAt < cutoff) shares.delete(k);
  shares.set(rec.id, rec);
}

export function getShare(id: string): ShareRecord | undefined {
  return shares.get(id);
}

/** URL에 들어갈 짧은 id. 추측하기 어려우면 충분하다 */
export function newShareId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

/** 30턴을 10칸으로 압축. 길면 아무도 공유하지 않는다 */
export function compressActions(actions: Action[], cells = 10): Action[] {
  const size = Math.max(1, Math.ceil(actions.length / cells));
  const out: Action[] = [];
  for (let i = 0; i < actions.length; i += size) {
    const chunk = actions.slice(i, i + size);
    out.push(chunk.includes('BUY') ? 'BUY' : chunk.includes('SELL') ? 'SELL' : 'HOLD');
  }
  return out;
}
