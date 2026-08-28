import { NextResponse } from 'next/server';
import { currentUser, setNick } from '@/lib/server/auth';
import { setDailyNick } from '@/lib/server/daily';
import { todayKST } from '@/lib/server/data';

export const dynamic = 'force-dynamic';

/**
 * 순위표에 쓸 이름을 정한다.
 *
 * 계정에 저장하는 게 먼저고, 오늘 친 기록이 있으면 거기에도 반영한다.
 * 예전에는 오늘 기록이 없으면 404 를 돌려줬는데, 계정에는 이미 저장한 뒤라
 * "저장은 됐는데 실패했다고 말하는" 상태였다. 그리고 데일리를 한 번도
 * 완주하지 않은 사람은 이름을 정할 방법 자체가 없었다 — 마이페이지에
 * "익명님의 전적" 이라고 뜨는데 고칠 수가 없었던 이유다.
 *
 * 이름의 소유권은 카카오 계정이 보장하므로 사칭은 불가능하다.
 */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });

  const { nick } = (await req.json().catch(() => ({}))) as { nick?: string };
  const clean = (nick ?? '').trim().slice(0, 12);
  if (!clean) return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 });

  const updated = await setNick(user.id, clean);
  const standing = await setDailyNick(todayKST(), user.id, clean);

  return NextResponse.json({ nick: updated?.nick ?? clean, standing });
}
