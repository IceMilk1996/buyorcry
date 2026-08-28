import { NextResponse } from 'next/server';
import { COOKIE, signOut } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/**
 * 로그아웃은 쿠키를 지우는 것이 전부다. 저장소의 계정은 남긴다 —
 * 같은 카카오 회원번호로 다시 들어오면 닉네임과 오늘 기록을 그대로 이어야 한다.
 * 하다 만 판도 회원번호에 묶여 있어서, 다시 로그인하면 그 자리부터 이어진다.
 */
export async function POST() {
  await signOut();
  const res = NextResponse.json({ ok: true });
  // 직접 만든 응답에도 확실히 실리도록 한 번 더 지운다 (콜백 라우트의 주석 참조)
  res.cookies.set(COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
