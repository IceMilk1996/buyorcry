import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { getJSON, setJSON } from './kv';

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

export const COOKIE = 'cg_uid';
export const MAX_AGE = 60 * 60 * 24 * 180;

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  };
}

/** 계정은 만료시키지 않는다 — 쿠키(180일)보다 오래 살아야 한다 */
const key = (id: string) => `user:${id}`;

/**
 * 쿠키는 반드시 서명한다. 서명이 없으면 아무나 남의 회원번호를 쿠키에 써넣고
 * 그 사람 행세를 할 수 있다 — 로그인을 붙이는 의미가 사라진다.
 */
function secret(): string {
  const s = env('AUTH_SECRET');
  if (s) return s;

  /*
   * 운영에서는 폴백을 주지 않고 멈춘다.
   *
   * 폴백 상수를 쓰면 서명 키가 공개된 값이 된다. 그러면 누구나 쿠키를 만들어
   * 임의의 회원번호로 행세할 수 있고, 매번 새 번호를 써서 오늘의 챌린지를
   * 무제한 반복하고 순위표를 원하는 만큼 채울 수 있다. 로그인을 붙인 의미가
   * 통째로 사라지는데, 화면상으로는 멀쩡히 돌아가서 알아채지도 못한다.
   * 조용히 규칙만 사라지는 것보다 500 이 낫다.
   */
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[config] AUTH_SECRET 이 없습니다. 쿠키 서명 키가 공개 상수가 되어 ' +
        '누구나 남의 회원번호로 행세할 수 있으므로 진행하지 않습니다.'
    );
  }
  return 'dev-only-insecure-secret';
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

/**
 * 쿠키 서명이 맞으면 그 회원번호는 우리가 발급한 것이다. 그러므로 저장소에
 * 기록이 없어도(만료·초기화) 로그인을 깨뜨리지 않고 그 자리에서 되살린다.
 * 예전처럼 저장소 조회 결과가 없다고 null 을 주면, 저장소가 한 번 비는
 * 순간 모든 사용자가 로그아웃된다.
 */
export async function currentUser(): Promise<User | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const id = unsign(raw);
  if (!id) return null;
  const found = await getJSON<User>(key(id));
  if (found) return found;
  const provider: User['provider'] = id.startsWith('dev:') ? 'dev' : 'kakao';
  const user: User = { id, nick: null, provider };
  await setJSON(key(id), user);
  return user;
}

export async function signIn(provider: 'kakao' | 'dev', providerId: string): Promise<User> {
  const id = `${provider}:${providerId}`;
  const user = (await getJSON<User>(key(id))) ?? { id, nick: null, provider };
  await setJSON(key(id), user);

  (await cookies()).set(COOKIE, sign(id), cookieOptions());
  return user;
}

/**
 * 쿠키에 넣을 서명된 값. 직접 만든 응답(리다이렉트 등)에 쿠키를 붙여야 할 때 쓴다 —
 * next/headers 의 cookies().set 이 그런 응답에도 실리는지는 보장돼 있지 않다.
 */
export function signedCookieValue(id: string): string {
  return sign(id);
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function setNick(id: string, nick: string): Promise<User | null> {
  const u = await getJSON<User>(key(id));
  if (!u) return null;
  const next: User = { ...u, nick: nick.trim().slice(0, 12) };
  await setJSON(key(id), next);
  return next;
}

/**
 * 환경변수는 반드시 이걸로 읽는다.
 *
 * 대시보드에 값을 붙여넣을 때 앞뒤 공백이 딸려 들어가는 일이 흔하다. 실제로
 * KAKAO_REDIRECT_URI 앞에 공백 3칸이 붙어서, 카카오가 "등록되지 않은
 * 리다이렉트 URI"로 막았다. 값은 화면에 멀쩡해 보이고 저장한 뒤에는 확인할
 * 방법도 없어서(Secret 타입), 원인을 찾는 데 한참 걸렸다.
 */
function env(name: string): string {
  return (process.env[name] ?? '').trim();
}

export function kakaoClientId(): string {
  return env('KAKAO_CLIENT_ID');
}

export function kakaoRedirectUri(): string {
  return env('KAKAO_REDIRECT_URI');
}

export function kakaoClientSecret(): string {
  return env('KAKAO_CLIENT_SECRET');
}

/** 카카오 앱 등록이 끝났는지 */
export function kakaoConfigured(): boolean {
  return Boolean(kakaoClientId() && kakaoRedirectUri());
}

/**
 * 로그인을 막고 있는 환경변수 이름들. 비어 있으면 로그인이 된다.
 *
 * 카카오 키만 보면 안 된다. AUTH_SECRET 이 없으면 카카오는 멀쩡히 다녀오고
 * 마지막 쿠키 서명에서 죽는다 — 사용자는 카카오 로그인까지 다 마친 뒤에야
 * "로그인을 마치지 못했어요" 를 보고, 화면에는 카카오 문제처럼 보인다.
 * 실제로 이것 때문에 한참 엉뚱한 데를 팠다. 문 앞에서 먼저 막는다.
 */
export function loginBlockers(): string[] {
  const missing: string[] = [];
  if (!kakaoClientId()) missing.push('KAKAO_CLIENT_ID');
  if (!kakaoRedirectUri()) missing.push('KAKAO_REDIRECT_URI');
  // 개발에서는 폴백 키가 있어서 없어도 로그인이 된다
  if (process.env.NODE_ENV === 'production' && !env('AUTH_SECRET')) missing.push('AUTH_SECRET');
  return missing;
}

/** 지금 로그인을 시도해도 되는 상태인지 */
export function loginReady(): boolean {
  return loginBlockers().length === 0;
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
