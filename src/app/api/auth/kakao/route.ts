import { NextResponse } from 'next/server';
import { kakaoClientId, kakaoConfigured, kakaoRedirectUri } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/**
 * 카카오 로그인 시작.
 *
 * 동의항목을 지정하지 않는다 — 회원번호만 필요하고, 그건 기본 제공이라
 * 별도 신청 없이 쓸 수 있다. (닉네임·프로필은 신청 대상이라 받지 않는다)
 */
export async function GET() {
  if (!kakaoConfigured()) {
    /*
     * 어느 변수가 비었는지 이름으로 말해준다.
     *
     * "설정하세요" 까지만 적혀 있으면, 대시보드에는 값이 멀쩡히 보이는데
     * 서버는 못 읽는 상황에서 아무 단서가 없다. 값은 절대 싣지 않지만
     * *이름*은 비밀이 아니고, 이 한 줄이 원인 찾는 시간을 줄인다.
     */
    const missing = (
      [
        ['KAKAO_CLIENT_ID', kakaoClientId()],
        ['KAKAO_REDIRECT_URI', kakaoRedirectUri()],
      ] as const
    )
      .filter(([, value]) => !value)
      .map(([name]) => name);

    return NextResponse.json(
      {
        error: `카카오 앱이 아직 연결되지 않았어요. 서버가 못 읽은 환경변수: ${missing.join(', ')}`,
        missing,
        // 지금까지 이 셋 말고 다른 원인이었던 적이 없다
        checklist: [
          '값을 넣은 뒤 재배포했는지 (환경변수는 빌드 때 주입된다)',
          '변수를 Production 환경에도 체크했는지 (Preview 에만 걸려 있는 경우가 많다)',
          '변수 이름이나 값에 앞뒤 공백이 섞이지 않았는지',
        ],
      },
      { status: 501 }
    );
  }

  const url = new URL('https://kauth.kakao.com/oauth/authorize');
  url.searchParams.set('client_id', kakaoClientId());
  url.searchParams.set('redirect_uri', kakaoRedirectUri());
  url.searchParams.set('response_type', 'code');

  return NextResponse.redirect(url.toString());
}
