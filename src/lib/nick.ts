/**
 * 순위표 이름의 규칙. 서버와 화면이 같은 파일을 본다.
 *
 * 두 벌로 나눠 쓰면 반드시 어긋난다 — 화면은 통과시켰는데 저장에서 거절당하고,
 * 사용자는 왜 안 되는지 알 수 없다.
 */

export const NICK_MIN = 2;
export const NICK_MAX = 12;

/**
 * 눈에 안 보이는데 글자 수에는 들어가는 것들.
 *
 * 이걸 막지 않으면 남의 이름 뒤에 폭 없는 공백 하나를 붙여서, 화면상 완전히
 * 똑같은데 중복 검사는 통과하는 이름을 만들 수 있다. 사칭이 된다.
 */
const INVISIBLE =
  /[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/;

/**
 * 중복 비교에 쓸 형태.
 *
 * 대소문자·앞뒤 공백·중간 공백 개수를 무시한다. 'abc' 와 'ABC',
 * '홍 길동' 과 '홍  길동' 이 같은 이름으로 취급되어야 사칭이 어려워진다.
 * NFC 로 먼저 합치는 이유: 한글은 자모를 따로 쓴 문자열도 눈에는 똑같다.
 */
export function normalizeNick(raw: string): string {
  return raw.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** 화면에 그대로 보여줄 형태. 중간 공백만 정리하고 대소문자는 살린다 */
export function displayNick(raw: string): string {
  return [...raw.normalize('NFC').trim().replace(/\s+/g, ' ')].slice(0, NICK_MAX).join('');
}

/** 문제가 있으면 사람이 읽을 문장을, 없으면 null */
export function nickProblem(raw: string): string | null {
  const v = raw.normalize('NFC').trim();
  if (!v) return '이름을 입력해주세요.';
  if (INVISIBLE.test(raw)) return '보이지 않는 문자는 쓸 수 없어요.';
  /* 이모지·한글은 코드 유닛이 2개라 length 로 세면 안 된다 */
  const len = [...v.replace(/\s+/g, ' ')].length;
  if (len < NICK_MIN) return `${NICK_MIN}자 이상으로 지어주세요.`;
  if (len > NICK_MAX) return `${NICK_MAX}자까지만 쓸 수 있어요.`;
  return null;
}
