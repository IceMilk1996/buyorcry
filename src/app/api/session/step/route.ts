import { NextResponse } from 'next/server';
import { Action, PLAY_COUNT, REVEAL_COUNT } from '@/lib/game/types';
import { finalize, step } from '@/lib/game/engine';
import { getSession, putSession } from '@/lib/server/store';
import { newShareId, putShare } from '@/lib/server/share';
import { submitDaily, type DailyStanding } from '@/lib/server/daily';

export const dynamic = 'force-dynamic';

const VALID: Action[] = ['BUY', 'SELL', 'HOLD'];

/**
 * 한 턴 진행. 캔들을 하나만 내려준다.
 * 자산 계산은 서버가 한다 — 클라이언트가 보내는 건 액션뿐이다.
 */
export async function POST(req: Request) {
  const { sessionId, action } = (await req.json().catch(() => ({}))) as {
    sessionId?: string;
    action?: Action;
  };

  if (!sessionId || !action || !VALID.includes(action)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const s = getSession(sessionId);
  if (!s) {
    return NextResponse.json(
      { error: '세션을 찾을 수 없습니다. 새로 시작해주세요.' },
      { status: 404 }
    );
  }
  if (s.done) {
    return NextResponse.json({ error: '이미 끝난 판입니다.' }, { status: 409 });
  }

  const candle = s.window[REVEAL_COUNT + s.state.turn];
  // 체결은 새로 열리는 봉의 시가, 평가는 그 봉의 종가 (engine.step 주석 참조)
  s.state = step(s.state, action, candle.o, candle.c);

  const applied = s.state.actions[s.state.actions.length - 1];
  if (applied === 'BUY') s.entryPrice = candle.o;
  else if (applied === 'SELL') s.entryPrice = undefined;

  const done = s.state.turn >= PLAY_COUNT;
  s.done = done;
  putSession(s);

  const equity = s.state.equityCurve[s.state.equityCurve.length - 1];
  const play = s.window.slice(REVEAL_COUNT);

  // 판이 끝나면 공유용 기록을 만들어 짧은 링크를 준다.
  // 공개 범위는 share.ts 가 정한다 — 여기서는 전부 넘기기만 한다.
  let shareId: string | null = null;
  let standing: DailyStanding | null = null;
  if (done) {
    const r = finalize(s.state, play);
    shareId = newShareId();

    // 데일리만 순위가 성립한다 — 전원이 같은 차트를 풀기 때문
    if (s.mode === 'daily' && s.userId) {
      standing = submitDaily(s.date, {
        userId: s.userId,
        nick: s.nick,
        alpha: r.alpha,
        myReturn: r.myReturn,
        rank: r.rank,
        at: Date.now(),
      });
    }

    putShare({
      id: shareId,
      createdAt: Date.now(),
      alpha: r.alpha,
      rank: r.rank,
      actions: r.actions,
      interval: s.interval,
      difficulty: 'NORMAL',
      myReturn: r.myReturn,
      holdReturn: r.holdReturn,
      finalEquity: r.finalEquity,
      symbol: s.symbol,
      name: s.name,
      from: s.window[REVEAL_COUNT].t,
      to: s.window[s.window.length - 1].t,
    });
  }

  return NextResponse.json({
    candle: { o: candle.o, h: candle.h, l: candle.l, c: candle.c },
    appliedAction: applied,
    entryPrice: s.entryPrice ?? null,
    turn: s.state.turn,
    totalTurns: PLAY_COUNT,
    cash: s.state.cash,
    qty: s.state.qty,
    equity,
    done,
    shareId,
    standing,
    date: s.date,
    // 끝났을 때만 정체를 공개한다
    result: done
      ? {
          ...finalize(s.state, play),
          symbol: s.symbol,
          name: s.name,
          interval: s.interval,
          from: s.window[REVEAL_COUNT].t,
          to: s.window[s.window.length - 1].t,
          revealCandles: s.window.map((c) => ({
            t: c.t,
            o: c.o,
            h: c.h,
            l: c.l,
            c: c.c,
          })),
        }
      : null,
  });
}
