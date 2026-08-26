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
  /** 실제 체결된 매수·매도 횟수. 0이면 눈팅개미 */
  tradeCount: number;
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

/**
 * 등급 7단. 경계는 코스피200 실측 알파 분포에 맞춰 잡았다(대략 3/10/19/14/6/34/14%).
 * '존버개미'가 정확히 한가운데인 게 핵심 — 존버의 알파가 0% 라 이 자리에 떨어진다.
 *
 * needsProfit: 존버를 이겼더라도 **내 돈이 늘지 않았으면** 주지 않는다.
 *   알파는 존버 하나만 기준으로 삼기 때문에, 현금만 들고 있으면 하락장에서
 *   아무 판단 없이도 알파가 커진다. 실측 결과 전부 관망한 판의 39%가
 *   상위 등급을 받고 있었다. 이 조건이 그걸 막는다.
 */
const RANK_TABLE: { min: number; key: string; label: string; needsProfit: boolean }[] = [
  { min: 0.3, key: 'MOGUL', label: '세력', needsProfit: true },
  { min: 0.15, key: 'WHALE', label: '고래', needsProfit: true },
  { min: 0.05, key: 'PRO', label: '고수', needsProfit: true },
  { min: 0.01, key: 'BIGANT', label: '왕개미', needsProfit: true },
  { min: -0.01, key: 'HODLANT', label: '존버개미', needsProfit: false },
  { min: -0.2, key: 'DONOR', label: '기부개미', needsProfit: false },
  { min: -Infinity, key: 'ANT', label: '개미', needsProfit: false },
];

/**
 * @param alpha      존버 대비 초과수익
 * @param myReturn   내 수익률 (상위 등급의 문턱)
 * @param tradeCount 실제 체결된 매수·매도 횟수
 */
export function rankOf(alpha: number, myReturn: number, tradeCount: number): Rank {
  // 한 번도 사지 않은 판은 등급이 아니라 이름표를 붙인다. 자리로는 존버개미와 같다
  if (tradeCount === 0) return { key: 'WATCHER', label: '눈팅개미' };

  const found = RANK_TABLE.find((r) => alpha >= r.min && (!r.needsProfit || myReturn > 0))!;
  return { key: found.key, label: found.label };
}
