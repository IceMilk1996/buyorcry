/**
 * 첫 안내를 봤는지. localStorage 접근을 한자리로 모은다.
 *
 * 서버에는 localStorage 가 없으므로 서버 스냅샷은 '봤다'로 둔다. 그래야
 * 하이드레이션 첫 프레임에 안내가 번쩍였다 사라지지 않는다.
 */
const KEY = 'buyorcry:seen-hint';

/** useSyncExternalStore 용. 우리가 직접 끄는 값이라 구독할 외부 변화가 없다 */
export const noSubscribe = () => () => {};

export function readSeenHint(): boolean {
  try {
    return localStorage.getItem(KEY) != null;
  } catch {
    return true; // 시크릿 모드 등에서 막히면 안내를 띄우지 않는다
  }
}

export function serverSeenHint(): boolean {
  return true;
}

export function markHintSeen(): void {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* 저장이 막혀도 이번 판에서는 닫혀야 한다 — 그건 호출부가 상태로 처리한다 */
  }
}
