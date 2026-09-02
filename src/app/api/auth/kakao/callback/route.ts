import { NextResponse } from 'next/server';
import {
  kakaoClientId,
  kakaoClientSecret,
  loginBlockers,
  kakaoRedirectUri,
  signIn,
  signedCookieValue,
  COOKIE,
  cookieOptions,
} from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/**
 * 실패해도 사용자는 홈으로 돌아갈 뿐이라, 무엇이 잘못됐는지 남기지 않으면
 * 화면만 보고는 알 길이 없다. 실제로 카카오가 클라이언트 시크릿을 기본 ON 으로
 * 발급하도록 바뀐 걸 모르고, 토큰 요청이 조용히 실패하는 걸 세 번 되짚었다.
 * 그래서 실패 지점을 로그로 남기고, 주소에도 어디서 막혔는지 붙인다.
 */
function fail(req: Request, where: string, detail?: unknown): NextResponse {
  console.error(`[kakao] ${where}`, detail ?? '');
  return NextResponse.redirect(new URL(`/?login=fail&at=${where}`, req.url));
}

/** 카카오가 코드를 들고 돌아오는 자리. 토큰으로 바꾼 뒤 회원번호만 꺼낸다 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  // 사용자가 동의를 취소하면 code 대신 error 가 온다
  const denied = url.searchParams.get('error');
  if (denied) return fail(req, 'denied', denied);
  const blockers = loginBlockers();
  if (blockers.length > 0) return fail(req, 'not-configured', blockers.join(', '));
  if (!code) return fail(req, 'no-code');

  let token: { access_token?: string; error?: string; error_description?: string };
  try {
    token = await fetch('https://kauth.kakao.com/oauth/token', {
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
  } catch (e) {
    return fail(req, 'token-request', e);
  }

  if (!token.access_token) {
    // 카카오는 실패 이유를 error_description 에 한국어로 준다.
    // 예: "client_secret is required" -> 콘솔에서 시크릿을 켜둔 상태
    return fail(req, 'token', `${token.error}: ${token.error_description}`);
  }

  let me: { id?: number };
  try {
    // 동의항목이 없으므로 여기서 오는 건 사실상 회원번호(id) 뿐이다
    me = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    }).then((r) => r.json());
  } catch (e) {
    return fail(req, 'userinfo-request', e);
  }

  if (!me.id) return fail(req, 'userinfo', me);

  try {
    const user = await signIn('kakao', String(me.id));
    /*
     * 쿠키를 응답에 직접 한 번 더 붙인다.
     * signIn 안에서 next/headers 의 cookies().set 을 부르지만, 여기처럼 직접
     * 만든 리다이렉트 응답을 반환할 때도 그게 실리는지는 보장돼 있지 않다.
     * 안 실리면 "로그인은 됐는데 다음 요청에서 다시 비회원" 이 되고,
     * 화면만 봐서는 토큰 실패와 구분이 안 된다. 한 줄로 막을 수 있는 일이다.
     */
    /*
     * 홈으로 돌려보낸다. 바로 /play?mode=daily 로 보내면 로그인했다는 이유만으로
     * 판이 시작되는데, 오늘의 챌린지는 하루 한 번뿐이라 그 한 번을 실수로 쓰게 된다.
     * 시작은 사용자가 명시적으로 눌러야 한다.
     */
    /*
     * 이름이 없으면 홈에서 한 번 물어보게 표를 단다.
     *
     * 홈이 스스로 판단하게 하지 않는 이유: 그러면 이름 없는 사람은 홈에
     * 들어올 때마다 매번 모달을 보게 된다. 물어볼 자리는 '방금 로그인한
     * 직후' 한 번이면 충분하고, 나중에 정할 곳은 마이페이지에 있다.
     */
    const dest = user.nick ? '/' : '/?welcome=nick';
    const res = NextResponse.redirect(new URL(dest, req.url));
    res.cookies.set(COOKIE, signedCookieValue(user.id), cookieOptions());
    return res;
  } catch (e) {
    return fail(req, 'signin', e);
  }
}
