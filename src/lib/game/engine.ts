import {
  Action,
  Candle,
  GameResult,
  GameState,
  FEE_RATE,
  INITIAL_CAPITAL,
  rankOf,
} from './types';

/**
 * 게임 엔진 — 전부 순수 함수.
 *
 * 화면과 완전히 분리되어 있어야 한다. 그래야 밸런싱 시뮬레이션을
 * 렌더링 없이 수천 판 돌릴 수 있다. (기획서 11장 1주차)
 */

export function createGame(): GameState {
  return { turn: 0, cash: INITIAL_CAPITAL, qty: 0, actions: [], equityCurve: [] };
}

export function equityAt(s: GameState, price: number): number {
  return s.cash + s.qty * price;
}

export function isLong(s: GameState): boolean {
  return s.qty > 0;
}

/** 현재 상태에서 실제로 의미 있는 액션인지 */
export function canApply(s: GameState, action: Action): boolean {
  if (action === 'BUY') return s.qty === 0 && s.cash > 0;
  if (action === 'SELL') return s.qty > 0;
  return true;
}

/**
 * 한 턴 진행.
 *
 * @param execPrice 체결가 — 이번 턴에 새로 열리는 봉의 **시가**
 * @param markPrice 평가가 — 그 봉의 **종가**
 *
 * 체결가와 평가가를 나누는 이유:
 *   플레이어는 다음 봉이 어떻게 될지 모르는 상태에서 액션을 고른다.
 *   그 주문이 다음 봉 시가에 체결되어야, 자기가 고른 직후의 봉 움직임에
 *   그대로 참여하게 된다. 종가에 체결하면 방금 나타난 봉의 등락에서 제외되어
 *   "샀는데 이 봉이 오른 게 나랑 무슨 상관이지?" 하는 상태가 된다.
 *
 * 불가능한 액션(보유 중 매수 등)은 조용히 HOLD로 기록된다.
 * UI에서는 해당 버튼을 비활성화할 것.
 */
export function step(
  s: GameState,
  action: Action,
  execPrice: number,
  markPrice: number = execPrice
): GameState {
  let { cash, qty } = s;
  let applied: Action = 'HOLD';

  if (action === 'BUY' && canApply(s, 'BUY')) {
    qty = (cash * (1 - FEE_RATE)) / execPrice;
    cash = 0;
    applied = 'BUY';
  } else if (action === 'SELL' && canApply(s, 'SELL')) {
    cash = qty * execPrice * (1 - FEE_RATE);
    qty = 0;
    applied = 'SELL';
  }

  return {
    turn: s.turn + 1,
    cash,
    qty,
    actions: [...s.actions, applied],
    equityCurve: [...s.equityCurve, cash + qty * markPrice],
  };
}

/**
 * 홀드(존버) 수익률.
 * 1턴에 매수(= 첫 봉 시가 체결)해서 마지막 봉 종가까지 들고 간 것과 동일하게,
 * 왕복 수수료를 포함한다. 이래야 플레이어와 정확히 같은 조건에서 비교된다.
 */
export function holdReturnOf(playCandles: Candle[]): number {
  const first = playCandles[0].o;
  const last = playCandles[playCandles.length - 1].c;
  const qty = (INITIAL_CAPITAL * (1 - FEE_RATE)) / first;
  const equity = qty * last * (1 - FEE_RATE);
  return equity / INITIAL_CAPITAL - 1;
}

export function finalize(s: GameState, playCandles: Candle[]): GameResult {
  const lastPrice = playCandles[playCandles.length - 1].c;

  /*
   * 마지막에 보유 중이면 종가에 청산한다 — 매도 수수료를 포함해서.
   *
   * 예전에는 그냥 `현금 + 수량 × 종가` 로 끝내서 매도 수수료를 면제했다.
   * 그런데 존버 기준선(holdReturnOf)은 왕복 수수료를 문다. 그래서 1턴에 사서
   * 끝까지 든 사람은 아무 이득 없이 알파가 항상 +0.05% 쯤 나왔고,
   * "존버 알파는 0에 붙는다"는 전제가 미세하게 깨져 있었다.
   * 1주차 검증에서 존버 알파가 +0.1% 로 나온 게 이 편향이었다.
   */
  const finalEquity =
    s.qty > 0 ? s.cash + s.qty * lastPrice * (1 - FEE_RATE) : equityAt(s, lastPrice);
  const myReturn = finalEquity / INITIAL_CAPITAL - 1;
  const holdReturn = holdReturnOf(playCandles);
  const alpha = myReturn - holdReturn;

  const tradeCount = s.actions.filter((a) => a !== 'HOLD').length;

  return {
    finalEquity,
    myReturn,
    holdReturn,
    alpha,
    rank: rankOf(alpha, myReturn, tradeCount),
    actions: s.actions,
    tradeCount,
  };
}

/** 액션 시퀀스를 통째로 돌린다 (시뮬레이션용) */
export function playAll(playCandles: Candle[], actions: Action[]): GameResult {
  let s = createGame();
  playCandles.forEach((candle, i) => {
    s = step(s, actions[i] ?? 'HOLD', candle.o, candle.c);
  });
  return finalize(s, playCandles);
}
