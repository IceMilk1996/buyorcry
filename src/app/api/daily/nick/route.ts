import { NextResponse } from 'next/server';
import { setDailyNick } from '@/lib/server/daily';
import { currentUser, setNick } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/**
 * 결과를 낸 뒤에 닉네임을 정한다.
 *
 * 시작 전에 이름까지 요구하면 화면이 하나 더 늘어난다. 순위가 이미 나온 뒤에
 * "이름 남길래요?" 하고 묻는 편이 자연스럽고, 안 넣으면 '익명'으로 남는다.
 * 이름의 소유권은 카카오 계정이 보장하므로 사칭은 불가능하다.
 */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });

  const { date, nick } = (await req.json().catch(() => ({}))) as {
    date?: string;
    nick?: string;
  };
  const clean = (nick ?? '').trim().slice(0, 12);
  if (!date || !clean) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  await setNick(user.id, clean);
  const standing = await setDailyNick(date, user.id, clean);
  if (!standing) return NextResponse.json({ error: '기록을 찾을 수 없어요.' }, { status: 404 });

  return NextResponse.json({ standing });
}
