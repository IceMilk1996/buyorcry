import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/server/auth';
import { nickOwner } from '@/lib/server/nick';
import { nickProblem, normalizeNick } from '@/lib/nick';

export const dynamic = 'force-dynamic';

/**
 * 이 이름을 쓸 수 있는지 미리 물어본다.
 *
 * 이건 편의일 뿐 보장이 아니다. 여기서 "된다"고 답한 뒤 저장하기 전에 다른
 * 사람이 가져갈 수 있다. 진짜 판정은 POST 안의 선점(claimNick)이 한다.
 *
 * 로그인한 사람만 부를 수 있게 한다. 이름 존재 여부를 마음껏 캐물을 수 있는
 * 창구를 열어둘 이유가 없다.
 */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });

  const raw = new URL(req.url).searchParams.get('nick') ?? '';

  const problem = nickProblem(raw);
  if (problem) {
    return NextResponse.json(
      { available: false, reason: problem },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const owner = await nickOwner(raw);
  /* 지금 내가 쓰고 있는 이름이면 "쓸 수 있다" 가 맞다 */
  const mine = owner === user.id || normalizeNick(user.nick ?? '') === normalizeNick(raw);
  const available = !owner || mine;

  return NextResponse.json(
    { available, reason: available ? null : '이미 누가 쓰고 있는 이름이에요.' },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
