import { NextResponse } from 'next/server';
import { kakaoClientId, kakaoRedirectUri, loginBlockers } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/**
 * 카카오 로그인 시작.
 *
 * 동의항목을 지정하지 않는다 — 회원번호만 필요하고, 그건 기본 제공이라
 * 별도 신청 없이 쓸 수 있다. (닉네임·프로필은 신청 대상이라 받지 않는다)
 */
export async function GET() {
  /*
   * 카카오 키만 보고 통과시키면 안 된다. AUTH_SECRET 이 없으면 카카오까지
   * 다녀온 뒤 마지막 쿠키 서명에서 죽어서, 사용자는 로그인을 다 마치고 나서야
   * 실패를 본다. 여기서 막으면 왕복 한 번이 줄고 원인도 여기 적힌다.
   */
  const missing = loginBlockers();
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: `로그인이 아직 준비되지 않았어요. 서버가 못 읽은 환경변수: ${missing.join(', ')}`,
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
