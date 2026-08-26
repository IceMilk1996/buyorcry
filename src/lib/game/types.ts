/** 캔들 하나 (일봉 또는 주봉) */
export type Candle = {
  /** YYYY-MM-DD */
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export type Interval = 'D' | 'W';

/** 한 종목의 전체 시계열 */
export type Series = {
  symbol: string;
  /** 결과 공개 전까지 절대 클라이언트로 보내지 않는다 */
  name: string;
  interval: Interval;
  candles: Candle[];
};

export type Action = 'BUY' | 'SELL' | 'HOLD';

export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

/** 한 판의 문제 정의 */
export type Puzzle = {
  id: string;
  symbol: string;
  name: string;
  interval: Interval;
  /** Series.candles 안에서 사전공개 구간이 시작되는 인덱스 */
  startIndex: number;
  difficulty: Difficulty;
  holdReturn: number;
  volatility: number;
};

export type GameState = {
  turn: number;
  cash: number;
  qty: number;
  actions: Action[];
  /** 매 턴 종료 시점의 총자산 */
  equityCurve: number[];
};

export type GameResult = {
  finalEquity: number;
  myReturn: number;
  holdReturn: number;
  /** 초과수익 — 이 게임의 진짜 점수 */
  alpha: number;
  rank: Rank;
  actions: Action[];
};

export const INITIAL_CAPITAL = 1_000_000;
/** 편도 수수료. 매 턴 뇌동매매를 억제하는 유일한 장치 */
export const FEE_RATE = 0.0005;
/** 시작 전 미리 보여주는 봉 수 */
export const REVEAL_COUNT = 20;
/** 플레이하는 턴 수 */
export const PLAY_COUNT = 30;
export const WINDOW_SIZE = REVEAL_COUNT + PLAY_COUNT;

export type Rank = { key: string; label: string };

const RANK_TABLE: { min: number; key: string; label: string }[] = [
  { min: 0.2, key: 'MOGUL', label: '세력' },
  { min: 0.05, key: 'PRO', label: '고수' },
  { min: -0.05, key: 'HOLDER', label: '존버와 동급' },
  { min: -0.2, key: 'DONOR', label: '수수료 기부자' },
  { min: -Infinity, key: 'ANT', label: '개미' },
];

export function rankOf(alpha: number): Rank {
  const found = RANK_TABLE.find((r) => alpha >= r.min)!;
  return { key: found.key, label: found.label };
}
