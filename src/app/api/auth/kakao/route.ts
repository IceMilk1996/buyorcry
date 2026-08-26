import { NextResponse } from 'next/server';
import { kakaoConfigured } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/**
 * 카카오 로그인 시작.
 *
 * 동의항목을 지정하지 않는다 — 회원번호만 필요하고, 그건 기본 제공이라
 * 별도 신청 없이 쓸 수 있다. (닉네임·프로필은 신청 대상이라 받지 않는다)
 */
export async function GET() {
  if (!kakaoConfigured()) {
    return NextResponse.json(
      { error: '카카오 앱이 아직 연결되지 않았어요. KAKAO_CLIENT_ID / KAKAO_REDIRECT_URI 를 설정하세요.' },
      { status: 501 }
    );
  }

  const url = new URL('https://kauth.kakao.com/oauth/authorize');
  url.searchParams.set('client_id', process.env.KAKAO_CLIENT_ID!);
  url.searchParams.set('redirect_uri', process.env.KAKAO_REDIRECT_URI!);
  url.searchParams.set('response_type', 'code');

  return NextResponse.redirect(url.toString());
}
