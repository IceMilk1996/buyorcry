/**
 * 아주 작은 키·값 저장소.
 *
 * 세션·공유결과·순위표·계정은 전부 "요청 사이에 살아남아야 하는 것"이다.
 * 프로세스 메모리에 두면 로컬에서는 잘 돌지만 Vercel 에 올리는 순간 무너진다 —
 * 서버리스는 요청마다 다른 인스턴스에서 실행될 수 있어서, 방금 저장한 세션을
 * 다음 요청이 못 찾고, 순위표는 인스턴스마다 다른 값을 보여준다.
 *
 * 그래서 Upstash Redis 의 REST API 를 쓴다. SDK 없이 fetch 만으로 되고,
 * 연결 풀 개념이 없어서 서버리스와 맞고, 무료 등급이 있다.
 * 환경변수가 없으면 프로세스 메모리로 떨어진다 — 로컬 개발용이다.
 *
 * 필요한 연산이 7개뿐이라 명령어를 그대로 노출하지 않고 이만큼만 감쌌다.
 */

// trim 하는 이유는 auth.ts 의 env() 주석 참조 — 붙여넣기로 딸려온 공백에 당한 적이 있다
const URL_ = (
  process.env.UPSTASH_REDIS_REST_URL ??
  process.env.KV_REST_API_URL ??
  ''
).trim();
const TOKEN = (
  process.env.UPSTASH_REDIS_REST_TOKEN ??
  process.env.KV_REST_API_TOKEN ??
  ''
).trim();

export function kvRemote(): boolean {
  return Boolean(URL_ && TOKEN);
}

export function kvBackend(): 'upstash' | 'memory' {
  return kvRemote() ? 'upstash' : 'memory';
}

/**
 * 운영에서 메모리로 떨어지면 조용히 망가진다 — 세션은 요청마다 사라지고
 * 순위표는 인스턴스마다 다른 값을 보여준다. 눈에 띄게 남긴다.
 */
if (!kvRemote() && process.env.NODE_ENV === 'production') {
  console.warn(
    '[kv] UPSTASH_REDIS_REST_URL / _TOKEN 이 없어 메모리로 동작합니다. ' +
      '세션·순위표·공유링크가 정상 동작하지 않습니다.'
  );
}

/* ────────────────────────── 원격 (Upstash) ────────────────────────── */

type Cmd = (string | number)[];

async function send(cmds: Cmd[]): Promise<unknown[]> {
  const res = await fetch(`${URL_}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as ({ result: unknown } | { error: string })[];
  return body.map((r) => {
    if ('error' in r) throw new Error(`Upstash: ${r.error}`);
    return r.result;
  });
}

/* ────────────────────────── 대체 (메모리) ────────────────────────── */

/**
 * globalThis 에 매다는 이유: ① 개발 중 HMR 로 모듈이 다시 평가돼도 남아야 하고
 * ② Next.js 가 서버 컴포넌트와 라우트 핸들러를 다른 번들로 만들기 때문이다.
 * 모듈 스코프에 두면 /api 에서 저장한 걸 /r/[id] 페이지가 못 읽는다 —
 * 실제로 이것 때문에 공유 링크가 전부 '찾을 수 없음' 이 됐었다.
 */
type MemEntry = { v: string | Map<string, string>; exp: number };
const g = globalThis as typeof globalThis & { __kv?: Map<string, MemEntry> };
const mem: Map<string, MemEntry> = (g.__kv ??= new Map());

function memGet(key: string): MemEntry | undefined {
  const e = mem.get(key);
  if (!e) return undefined;
  if (e.exp && e.exp < Date.now()) {
    mem.delete(key);
    return undefined;
  }
  return e;
}

function memExp(ttlSec?: number): number {
  return ttlSec ? Date.now() + ttlSec * 1000 : 0;
}

/* ────────────────────────── 공개 API ────────────────────────── */

export async function kvGet(key: string): Promise<string | null> {
  if (kvRemote()) return ((await send([['GET', key]]))[0] as string | null) ?? null;
  const e = memGet(key);
  return typeof e?.v === 'string' ? e.v : null;
}

export async function kvSet(key: string, val: string, ttlSec?: number): Promise<void> {
  if (kvRemote()) {
    await send([ttlSec ? ['SET', key, val, 'EX', ttlSec] : ['SET', key, val]]);
    return;
  }
  mem.set(key, { v: val, exp: memExp(ttlSec) });
}

export async function kvHGet(key: string, field: string): Promise<string | null> {
  if (kvRemote()) return ((await send([['HGET', key, field]]))[0] as string | null) ?? null;
  const e = memGet(key);
  return e && e.v instanceof Map ? (e.v.get(field) ?? null) : null;
}

export async function kvHSet(
  key: string,
  field: string,
  val: string,
  ttlSec?: number
): Promise<void> {
  if (kvRemote()) {
    const cmds: Cmd[] = [['HSET', key, field, val]];
    if (ttlSec) cmds.push(['EXPIRE', key, ttlSec]);
    await send(cmds);
    return;
  }
  const e = memGet(key);
  const map = e && e.v instanceof Map ? e.v : new Map<string, string>();
  map.set(field, val);
  mem.set(key, { v: map, exp: e?.exp || memExp(ttlSec) });
}

export async function kvHGetAll(key: string): Promise<Record<string, string>> {
  if (kvRemote()) {
    const r = (await send([['HGETALL', key]]))[0];
    // Upstash 는 배열([f1,v1,f2,v2...]) 또는 객체로 준다 — 둘 다 받는다
    if (Array.isArray(r)) {
      const out: Record<string, string> = {};
      for (let i = 0; i + 1 < r.length; i += 2) out[String(r[i])] = String(r[i + 1]);
      return out;
    }
    return (r as Record<string, string>) ?? {};
  }
  const e = memGet(key);
  return e && e.v instanceof Map ? Object.fromEntries(e.v) : {};
}

/* JSON 편의 함수 — 저장하는 건 전부 객체다 */

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await kvGet(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function setJSON<T>(key: string, val: T, ttlSec?: number): Promise<void> {
  await kvSet(key, JSON.stringify(val), ttlSec);
}

export async function hGetJSON<T>(key: string, field: string): Promise<T | null> {
  const raw = await kvHGet(key, field);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function hSetJSON<T>(
  key: string,
  field: string,
  val: T,
  ttlSec?: number
): Promise<void> {
  await kvHSet(key, field, JSON.stringify(val), ttlSec);
}

export async function hValuesJSON<T>(key: string): Promise<T[]> {
  const all = await kvHGetAll(key);
  return Object.values(all).map((v) => JSON.parse(v) as T);
}
