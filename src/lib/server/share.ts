import { Action, Interval, Difficulty, Rank } from '../game/types';
import { getJSON, setJSON } from './kv';

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
  /**
   * 이 판을 친 사람. 본인이 링크를 열면 전체 결과를 다시 보여주기 위해 쓴다.
   * 남에게는 이 필드가 존재한다는 사실조차 나가지 않는다(toPublic 참조).
   */
  userId: string | null;
  mode: 'daily' | 'endless';
  date: string;
  /** 사전공개 + 플레이 구간 전체. 본인 재관람용 차트 */
  revealCandles: { t: string; o: number; h: number; l: number; c: number }[];
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

/** 링크는 오래 살아야 한다. 30일 뒤에는 알아서 사라진다 */
const TTL_SEC = 30 * 24 * 60 * 60;

const key = (id: string) => `share:${id}`;

export async function putShare(rec: ShareRecord): Promise<void> {
  await setJSON(key(rec.id), rec, TTL_SEC);
}

export async function getShare(id: string): Promise<ShareRecord | null> {
  return getJSON<ShareRecord>(key(id));
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
