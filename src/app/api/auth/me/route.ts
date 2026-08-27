import { NextResponse } from 'next/server';
import { currentUser, devLoginAllowed, kakaoConfigured } from '@/lib/server/auth';
import { findTodayEntry, standingOf } from '@/lib/server/daily';
import { todayKST } from '@/lib/server/data';

export const dynamic = 'force-dynamic';

/** 홈이 무엇을 보여줄지 정하는 데 필요한 것 전부 */
export async function GET() {
  const user = await currentUser();
  const date = todayKST();
  const today = user ? await findTodayEntry(date, user.id) : null;

  return NextResponse.json({
    user: user ? { id: user.id, nick: user.nick } : null,
    kakaoReady: kakaoConfigured(),
    devLogin: devLoginAllowed(),
    // 오늘 이미 했으면 홈에서 결과를 보여준다 (기기가 바뀌어도 유지된다)
    today:
      today && user
        ? { standing: await standingOf(date, user.id), rankLabel: today.rank.label }
        : null,
  });
}
