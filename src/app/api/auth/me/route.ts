import { NextResponse } from 'next/server';
import { currentUser, devLoginAllowed, loginReady } from '@/lib/server/auth';
import { findTodayEntry, standingOf } from '@/lib/server/daily';
import { todayKST } from '@/lib/server/data';

export const dynamic = 'force-dynamic';

/** 홈이 무엇을 보여줄지 정하는 데 필요한 것 전부 */
export async function GET() {
  const user = await currentUser();
  const date = todayKST();
  const today = user ? await findTodayEntry(date, user.id) : null;

  return NextResponse.json(
    {
      user: user ? { id: user.id, nick: user.nick } : null,
      // 카카오 키뿐 아니라 AUTH_SECRET 까지 있어야 실제로 로그인이 된다
      loginReady: loginReady(),
      devLogin: devLoginAllowed(),
      // 오늘 이미 했으면 홈에서 결과를 보여준다 (기기가 바뀌어도 유지된다)
      today:
        today && user
          ? {
              standing: await standingOf(date, user.id),
              rankLabel: today.rank.label,
              // 그날 결과를 다시 열 수 있게. 이게 없으면 홈에서 막다른 길이 된다
              shareId: today.shareId ?? null,
            }
          : null,
    },
    /*
     * 이 응답은 한 사람의 로그인 상태다. 한 번이라도 캐시되면
     * ① 남의 상태를 받아보거나 ② 설정을 고친 뒤에도 옛 답이 계속 돌아온다.
     * 실제로 카카오 환경변수를 고쳐 배포한 뒤에도 브라우저가 옛
     * kakaoReady:false 를 물고 있어서 "아직 연결되지 않았어요" 가 계속 떴다.
     */
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
