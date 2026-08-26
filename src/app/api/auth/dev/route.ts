import { NextResponse } from 'next/server';
import { devLoginAllowed, newDevId, signIn } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/**
 * 카카오 앱 등록 전에 화면과 순위표를 만져보기 위한 임시 로그인.
 * 운영 빌드이거나 카카오가 연결돼 있으면 닫힌다.
 */
export async function POST() {
  if (!devLoginAllowed()) {
    return NextResponse.json({ error: '사용할 수 없어요.' }, { status: 404 });
  }
  const user = await signIn('dev', newDevId());
  return NextResponse.json({ user });
}
