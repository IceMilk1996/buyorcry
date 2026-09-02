/**
 * 화면 테마.
 *
 * CSS 미디어쿼리(prefers-color-scheme)만 쓰면 사용자가 고를 수가 없다.
 * 그래서 어떤 테마를 쓸지는 스크립트가 정하고, CSS 는 html 의
 * data-theme 만 본다. 값 목록이 한 군데(:root[data-theme='dark'])에만
 * 있어서, 미디어쿼리용과 수동선택용으로 색을 두 벌 관리하지 않아도 된다.
 *
 * 첫 칠하기 전에 정해야 하므로 실제 적용은 layout 의 인라인 스크립트가 한다.
 * 이 파일은 화면(메뉴)에서 읽고 바꾸는 쪽만 맡는다.
 */

export type ThemePref = 'system' | 'light' | 'dark';

const KEY = 'buyorcry:theme';

const listeners = new Set<() => void>();

export function subscribeTheme(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function readThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

/** 서버에는 localStorage 가 없다. 첫 렌더는 늘 '시스템' 으로 둔다 */
export function serverThemePref(): ThemePref {
  return 'system';
}

export function setThemePref(pref: ThemePref): void {
  try {
    if (pref === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    /* 저장이 막혀도 이번 세션에는 적용돼야 한다 */
  }
  const dark =
    pref === 'dark' ||
    (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  listeners.forEach((cb) => cb());
}
