import { kvDel, kvGet, kvSetNX } from './kv';
import { normalizeNick } from '../nick';

/**
 * 이름의 주인 색인.
 *
 * user:<id> 안의 nick 만 있으면 "이 이름을 누가 쓰고 있나"를 물어볼 수가 없다.
 * 전부 훑어보는 수밖에 없는데, 사람이 늘면 그건 못 하는 일이다. 반대 방향
 * 색인을 하나 더 둔다.
 *
 * 키는 정규화한 이름이다 — 'ABC' 로 잡아둔 자리를 'abc' 가 다시 가져가면
 * 안 되므로(nick.ts 의 normalizeNick 참조).
 */
const key = (norm: string) => `nickowner:${norm}`;

export async function nickOwner(raw: string): Promise<string | null> {
  const norm = normalizeNick(raw);
  if (!norm) return null;
  return kvGet(key(norm));
}

export type ClaimResult =
  | { ok: true }
  | { ok: false; reason: 'taken' };

/**
 * 이름을 선점한다. 이미 쓰고 있는 사람이 있으면 실패.
 *
 * 검사와 저장을 SETNX 하나로 묶는다. 읽고 나서 쓰면 그 틈에 다른 사람이
 * 같은 이름을 저장할 수 있고, 그러면 순위표에 같은 이름이 둘 남는다.
 *
 * 이름을 바꾸는 경우 옛 이름을 놓아준다. 안 그러면 한 번 썼던 이름이
 * 아무도 안 쓰는 채로 영영 잠긴다.
 */
export async function claimNick(
  userId: string,
  raw: string,
  previous?: string | null
): Promise<ClaimResult> {
  const norm = normalizeNick(raw);
  if (!norm) return { ok: false, reason: 'taken' };

  const prevNorm = previous ? normalizeNick(previous) : '';
  /* 대소문자만 바꾸는 경우. 자리는 이미 내 것이니 선점할 게 없다 */
  if (prevNorm && prevNorm === norm) return { ok: true };

  if (!(await kvSetNX(key(norm), userId))) {
    /*
     * 누군가 이미 잡고 있다. 그게 나일 수도 있다 — 저장이 중간에 끊겼거나,
     * /api/auth/me 가 미리 채워둔 경우다. 내 것이면 통과시킨다.
     */
    const owner = await kvGet(key(norm));
    if (owner !== userId) return { ok: false, reason: 'taken' };
  }

  if (prevNorm) {
    /* 내 것이 맞을 때만 지운다. 남의 자리를 지우면 그 사람 이름이 풀린다 */
    const owner = await kvGet(key(prevNorm));
    if (owner === userId) await kvDel(key(prevNorm));
  }
  return { ok: true };
}

/**
 * 이미 이름을 쓰고 있는데 색인에는 없는 사람을 뒤늦게 채워 넣는다.
 *
 * 중복 검사를 나중에 붙였기 때문에, 그 전에 이름을 정한 사람들은 색인에
 * 자리가 없다. 그대로 두면 남이 그 이름을 가져갈 수 있다. 홈을 한 번만
 * 열어도 채워지도록 /api/auth/me 에서 부른다 — SETNX 한 번이라 싸다.
 */
export async function backfillNickClaim(userId: string, nick: string | null): Promise<void> {
  const norm = normalizeNick(nick ?? '');
  if (!norm) return;
  await kvSetNX(key(norm), userId);
}
