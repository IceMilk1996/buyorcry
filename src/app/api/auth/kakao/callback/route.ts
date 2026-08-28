import { NextResponse } from 'next/server';
import {
  kakaoClientId,
  kakaoClientSecret,
  kakaoConfigured,
  kakaoRedirectUri,
  signIn,
} from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/** 카카오가 코드를 들고 돌아오는 자리. 토큰으로 바꾼 뒤 회원번호만 꺼낸다 */
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get('code');
  if (!code || !kakaoConfigured()) {
    return NextResponse.redirect(new URL('/?login=fail', req.url));
  }

  try {
    const token = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: kakaoClientId(),
        redirect_uri: kakaoRedirectUri(),
        code,
        ...(kakaoClientSecret() ? { client_secret: kakaoClientSecret() } : {}),
      }),
    }).then((r) => r.json());

    if (!token.access_token) throw new Error('no token');

    // 동의항목이 없으므로 여기서 오는 건 사실상 회원번호(id) 뿐이다
    const me = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    }).then((r) => r.json());

    if (!me.id) throw new Error('no id');

    await signIn('kakao', String(me.id));
    return NextResponse.redirect(new URL('/play?mode=daily', req.url));
  } catch {
    return NextResponse.redirect(new URL('/?login=fail', req.url));
  }
}
