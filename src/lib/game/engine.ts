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
 * @param price 이번 턴 캔들의 종가 = 체결가
 *
 * 불가능한 액션(보유 중 매수 등)은 조용히 HOLD로 기록된다.
 * UI에서는 해당 버튼을 비활성화할 것.
 */
export function step(s: GameState, action: Action, price: number): GameState {
  let { cash, qty } = s;
  let applied: Action = 'HOLD';

  if (action === 'BUY' && canApply(s, 'BUY')) {
    qty = (cash * (1 - FEE_RATE)) / price;
    cash = 0;
    applied = 'BUY';
  } else if (action === 'SELL' && canApply(s, 'SELL')) {
    cash = qty * price * (1 - FEE_RATE);
    qty = 0;
    applied = 'SELL';
  }

  return {
    turn: s.turn + 1,
    cash,
    qty,
    actions: [...s.actions, applied],
    equityCurve: [...s.equityCurve, cash + qty * price],
  };
}

/**
 * 홀드(존버) 수익률.
 * 1턴 종가에 사서 마지막 턴 종가에 파는 것과 동일하게, 왕복 수수료를 포함한다.
 * 이래야 플레이어와 같은 조건에서 비교된다.
 */
export function holdReturnOf(playCandles: Candle[]): number {
  const first = playCandles[0].c;
  const last = playCandles[playCandles.length - 1].c;
  const qty = (INITIAL_CAPITAL * (1 - FEE_RATE)) / first;
  const equity = qty * last * (1 - FEE_RATE);
  return equity / INITIAL_CAPITAL - 1;
}

export function finalize(s: GameState, playCandles: Candle[]): GameResult {
  const lastPrice = playCandles[playCandles.length - 1].c;
  const finalEquity = equityAt(s, lastPrice);
  const myReturn = finalEquity / INITIAL_CAPITAL - 1;
  const holdReturn = holdReturnOf(playCandles);
  const alpha = myReturn - holdReturn;

  return {
    finalEquity,
    myReturn,
    holdReturn,
    alpha,
    rank: rankOf(alpha),
    actions: s.actions,
  };
}

/** 액션 시퀀스를 통째로 돌린다 (시뮬레이션용) */
export function playAll(playCandles: Candle[], actions: Action[]): GameResult {
  let s = createGame();
  playCandles.forEach((candle, i) => {
    s = step(s, actions[i] ?? 'HOLD', candle.c);
  });
  return finalize(s, playCandles);
}
