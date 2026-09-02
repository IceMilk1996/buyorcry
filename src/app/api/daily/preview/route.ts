import { NextResponse } from 'next/server';
import { REVEAL_COUNT } from '@/lib/game/types';
import { dailySeed, makeRng } from '@/lib/game/puzzle';
import { pickPuzzleServer, todayKST } from '@/lib/server/data';
import { countPlayed } from '@/lib/server/daily';

export const dynamic = 'force-dynamic';

/**
 * 홈에서 보여줄 오늘의 차트 맛보기.
 *
 * 사전공개 20봉만 내려간다. 게임을 시작하면 어차피 첫 화면에 그대로
 * 보이는 구간이라 아무것도 새지 않는다 — 매매할 30봉은 서버에만 있다.
 *
 * 이걸 홈에 두는 이유는 설명이 아니라 호기심이다. "다음은 어떻게 될까"가
 * 이 게임의 질문인데, 지금까지 첫 화면은 그 질문을 한 번도 던지지 않고
 * 규칙만 설명하고 있었다.
 */
export async function GET() {
  const date = todayKST();
  try {
    const picked = pickPuzzleServer(makeRng(dailySeed(date)));
    if (!picked) return NextResponse.json({ candles: [] }, { headers: noStore });

    const { puzzle, series } = picked;
    const candles = series.candles
      .slice(puzzle.startIndex, puzzle.startIndex + REVEAL_COUNT)
      .map((c) => ({ o: c.o, h: c.h, l: c.l, c: c.c }));

    return NextResponse.json(
      { date, candles, players: await countPlayed(date) },
      { headers: noStore }
    );
  } catch {
    /* 맛보기는 부가 기능이다. 실패해도 홈이 멈추면 안 된다 */
    return NextResponse.json({ candles: [] }, { headers: noStore });
  }
}

/** 날짜가 바뀌면 차트도 바뀐다. 참여자 수도 계속 는다 */
const noStore = { 'Cache-Control': 'no-store, max-age=0' };
