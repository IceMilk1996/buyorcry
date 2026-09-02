import { NextResponse } from 'next/server';
import { currentUser, setNick } from '@/lib/server/auth';
import { claimNick } from '@/lib/server/nick';
import { setDailyNick } from '@/lib/server/daily';
import { todayKST } from '@/lib/server/data';
import { displayNick, nickProblem } from '@/lib/nick';

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
 * 이름은 먼저 선점하고 나서 저장한다. 순서가 반대면, 선점에 실패했는데
 * 계정에는 이미 새 이름이 들어간 상태가 된다.
 */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });

  const { nick } = (await req.json().catch(() => ({}))) as { nick?: string };
  const raw = nick ?? '';

  const problem = nickProblem(raw);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const clean = displayNick(raw);

  const claim = await claimNick(user.id, clean, user.nick);
  if (!claim.ok) {
    return NextResponse.json(
      { error: '이미 누가 쓰고 있는 이름이에요.', taken: true },
      { status: 409 }
    );
  }

  const updated = await setNick(user.id, clean);
  const standing = await setDailyNick(todayKST(), user.id, clean);

  return NextResponse.json({ nick: updated?.nick ?? clean, standing });
}
