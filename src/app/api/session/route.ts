import { NextResponse } from 'next/server';
import { PLAY_COUNT, REVEAL_COUNT, WINDOW_SIZE, INITIAL_CAPITAL } from '@/lib/game/types';
import { createGame } from '@/lib/game/engine';
import { dailySeed, makeRng } from '@/lib/game/puzzle';
import { pickPuzzleServer, todayKST } from '@/lib/server/data';
import { newSessionId, putSession } from '@/lib/server/store';
import { currentUser } from '@/lib/server/auth';
import { findTodayEntry } from '@/lib/server/daily';

export const dynamic = 'force-dynamic';

/** 새 판 시작. 사전공개 20봉만 내려준다 — 나머지는 서버가 들고 있는다. */
export async function POST(req: Request) {
  let mode: 'daily' | 'endless' = 'endless';
  try {
    const body = await req.json();
    if (body?.mode === 'daily') mode = 'daily';
  } catch {
    /* 본문 없으면 endless */
  }

  /*
   * 오늘의 챌린지는 로그인이 있어야 한다.
   * 비회원으로 한 판 돌려 차트를 외운 뒤 로그인해서 다시 하면
   * 순위표가 통째로 무의미해지기 때문이다. 무한 모드는 순위가 없으므로 열어둔다.
   */
  const user = mode === 'daily' ? await currentUser() : null;
  if (mode === 'daily') {
    if (!user) {
      return NextResponse.json(
        { error: '오늘의 챌린지는 로그인이 필요해요.', needLogin: true },
        { status: 401 }
      );
    }
    // 하루 1회는 서버가 막는다. 브라우저 기록으로는 시크릿 모드를 못 막는다
    if (findTodayEntry(todayKST(), user.id)) {
      return NextResponse.json(
        { error: '오늘은 이미 참여하셨어요.', alreadyPlayed: true },
        { status: 409 }
      );
    }
  }

  const seed = mode === 'daily' ? dailySeed(todayKST()) : (Math.random() * 2 ** 32) >>> 0;

  let picked;
  try {
    picked = pickPuzzleServer(makeRng(seed));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 503 });
  }
  if (!picked) {
    return NextResponse.json({ error: '조건에 맞는 구간을 찾지 못했습니다.' }, { status: 503 });
  }

  const { puzzle, series } = picked;
  const window = series.candles.slice(puzzle.startIndex, puzzle.startIndex + WINDOW_SIZE);

  const id = newSessionId();
  putSession({
    id,
    symbol: puzzle.symbol,
    name: puzzle.name,
    interval: puzzle.interval,
    mode,
    date: todayKST(),
    userId: user?.id ?? null,
    nick: user?.nick ?? null,
    window,
    state: createGame(),
    done: false,
    createdAt: Date.now(),
  });

  return NextResponse.json({
    sessionId: id,
    mode,
    date: todayKST(),
    difficulty: puzzle.difficulty,
    // 종목명·날짜·절대가격은 결과 공개 전까지 내려가지 않는다
    candles: window.slice(0, REVEAL_COUNT).map(strip),
    turn: 0,
    totalTurns: PLAY_COUNT,
    cash: INITIAL_CAPITAL,
    qty: 0,
    equity: INITIAL_CAPITAL,
  });
}

/** 날짜를 지우고 가격만 남긴다 */
function strip(c: { o: number; h: number; l: number; c: number; v: number }) {
  return { o: c.o, h: c.h, l: c.l, c: c.c, v: c.v };
}
