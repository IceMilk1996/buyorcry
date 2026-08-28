import { NextResponse } from 'next/server';
import { PLAY_COUNT, REVEAL_COUNT, WINDOW_SIZE, INITIAL_CAPITAL } from '@/lib/game/types';
import { createGame } from '@/lib/game/engine';
import { dailySeed, makeRng } from '@/lib/game/puzzle';
import { pickPuzzleServer, todayKST } from '@/lib/server/data';
import {
  findDailyProgress,
  newSessionId,
  putSession,
  type SessionRecord,
} from '@/lib/server/store';
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
    if (await findTodayEntry(todayKST(), user.id)) {
      return NextResponse.json(
        { error: '오늘은 이미 참여하셨어요.', alreadyPlayed: true },
        { status: 409 }
      );
    }

    /*
     * 하다 만 판이 있으면 새로 뽑지 않고 그 자리로 돌려보낸다.
     * 뒤로 가기나 재로그인으로 화면을 벗어나는 건 흔한데, 오늘의 챌린지는
     * 하루 한 번뿐이라 그때마다 그날 몫을 날리게 된다.
     * 이어하기는 공정성도 해치지 않는다 — 차트를 다시 뽑을 수도, 이미 본 봉을
     * 안 본 걸로 만들 수도 없으니 나갔다 오는 게 이득이 되지 않는다.
     */
    const going = await findDailyProgress(todayKST(), user.id);
    if (going) return NextResponse.json(snapshot(going));
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
  const rec: SessionRecord = {
    id,
    symbol: puzzle.symbol,
    name: puzzle.name,
    interval: puzzle.interval,
    difficulty: puzzle.difficulty,
    mode,
    date: todayKST(),
    userId: user?.id ?? null,
    nick: user?.nick ?? null,
    window,
    state: createGame(),
    done: false,
    createdAt: Date.now(),
  };
  await putSession(rec);

  return NextResponse.json(snapshot(rec));
}

/**
 * 화면이 판을 그리는 데 필요한 전부. 새 판이든 이어하기든 같은 모양이라
 * 클라이언트는 둘을 구분하지 않아도 된다.
 *
 * ⚠️ 진행된 만큼만 잘라 보낸다. window 를 통째로 보내면 개발자도구에
 *    미래 봉이 그대로 보인다(기획서 7.1).
 */
function snapshot(s: SessionRecord) {
  const shown = REVEAL_COUNT + s.state.turn;

  // 턴마다 보유 중이었는지 — 차트의 보유 구간 음영에 쓴다.
  // 기록된 액션은 이미 '실제로 적용된' 것이라 그대로 되짚으면 된다(engine.step 참조)
  let held = false;
  const holdMask = s.state.actions.map(
    (a) => (held = a === 'BUY' ? true : a === 'SELL' ? false : held)
  );

  return {
    sessionId: s.id,
    mode: s.mode,
    date: s.date,
    difficulty: s.difficulty,
    // 종목명·날짜·절대가격은 결과 공개 전까지 내려가지 않는다
    candles: s.window.slice(0, shown).map(strip),
    revealCount: REVEAL_COUNT,
    turn: s.state.turn,
    totalTurns: PLAY_COUNT,
    cash: s.state.cash,
    qty: s.state.qty,
    equity: s.state.equityCurve[s.state.equityCurve.length - 1] ?? INITIAL_CAPITAL,
    entryPrice: s.entryPrice ?? null,
    actions: s.state.actions,
    holdMask,
    resumed: s.state.turn > 0,
  };
}

/** 날짜를 지우고 가격만 남긴다 */
function strip(c: { o: number; h: number; l: number; c: number }) {
  return { o: c.o, h: c.h, l: c.l, c: c.c };
}
