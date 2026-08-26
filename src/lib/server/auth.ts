import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * 로그인.
 *
 * 오늘의 챌린지는 순위가 매겨지므로 **"이 사람이 그 사람"과 "한 번만 했다"** 를
 * 보장해야 한다. 그건 계정 없이는 불가능하다 — 비회원으로 한 판 돌려 차트를 외운 뒤
 * 로그인해서 다시 하면 순위표가 통째로 무의미해진다.
 *
 * 카카오에서는 **회원번호만** 받는다. 닉네임·프로필은 동의항목이라 별도 신청이
 * 필요한데, 순위표에 쓸 이름은 우리가 직접 입력받으면 되므로 받을 이유가 없다.
 * 동의항목 0개 = 검수 불필요.
 */

export type User = { id: string; nick: string | null; provider: 'kakao' | 'dev' };

const COOKIE = 'cg_uid';
const MAX_AGE = 60 * 60 * 24 * 180;

const g = globalThis as typeof globalThis & { __users?: Map<string, User> };
const users: Map<string, User> = (g.__users ??= new Map());

/**
 * 쿠키는 반드시 서명한다. 서명이 없으면 아무나 남의 회원번호를 쿠키에 써넣고
 * 그 사람 행세를 할 수 있다 — 로그인을 붙이는 의미가 사라진다.
 */
function secret(): string {
  return process.env.AUTH_SECRET ?? 'dev-only-insecure-secret';
}

function sign(id: string): string {
  const mac = createHmac('sha256', secret()).update(id).digest('base64url');
  return `${id}.${mac}`;
}

function unsign(raw: string): string | null {
  const i = raw.lastIndexOf('.');
  if (i < 1) return null;
  const id = raw.slice(0, i);
  const got = Buffer.from(raw.slice(i + 1));
  const want = Buffer.from(createHmac('sha256', secret()).update(id).digest('base64url'));
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  return id;
}

export async function currentUser(): Promise<User | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const id = unsign(raw);
  return id ? (users.get(id) ?? null) : null;
}

export async function signIn(provider: 'kakao' | 'dev', providerId: string): Promise<User> {
  const id = `${provider}:${providerId}`;
  const user = users.get(id) ?? { id, nick: null, provider };
  users.set(id, user);

  (await cookies()).set(COOKIE, sign(id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
  return user;
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export function setNick(id: string, nick: string): User | null {
  const u = users.get(id);
  if (!u) return null;
  u.nick = nick.trim().slice(0, 12);
  return u;
}

/** 카카오 앱 등록이 끝났는지 */
export function kakaoConfigured(): boolean {
  return Boolean(process.env.KAKAO_CLIENT_ID && process.env.KAKAO_REDIRECT_URI);
}

/**
 * 카카오 앱 등록 전에도 화면과 순위표를 만져볼 수 있어야 해서 둔 문. 
 * 운영에서는 절대 열리지 않는다.
 */
export function devLoginAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' && !kakaoConfigured();
}

export function newDevId(): string {
  return randomUUID().slice(0, 8);
}
