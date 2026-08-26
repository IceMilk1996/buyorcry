'use client';

/**
 * 오늘의 챌린지 진행 상태를 브라우저에 기록한다.
 *
 * 회원가입도 로그인도 없이 "하루 한 판"을 유지하기 위한 최소 장치다.
 * 시크릿 모드로 우회하는 건 막을 수 없지만, 그건 자기 게임을 스포일링하는 것이라
 * 굳이 막을 이유가 없다. (리더보드 상위권 검증이 필요해지면 그때 서버에서 다룬다)
 */

export type DailyDone = {
  date: string;
  shareId: string | null;
  alpha: number;
  rankLabel: string;
  place: number;
  total: number;
  percentile: number;
};

const KEY = 'cg:daily';
const NICK_KEY = 'cg:nick';

export function readNick(): string {
  try {
    return localStorage.getItem(NICK_KEY) ?? '';
  } catch {
    return '';
  }
}

export function writeNick(v: string): void {
  try {
    localStorage.setItem(NICK_KEY, v.trim().slice(0, 12));
  } catch {
    /* 저장 실패해도 이번 판 순위표에는 이미 반영된다 */
  }
}

/** 한국 시간 기준 오늘 (YYYY-MM-DD) */
export function todayKST(): string {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
}

/** 한국 시간 기준 다음 자정까지 남은 초 */
export function secondsUntilTomorrow(): number {
  const kst = Date.now() + 9 * 3600_000;
  return Math.max(0, Math.ceil((86_400_000 - (kst % 86_400_000)) / 1000));
}

export function formatCountdown(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function readDailyDone(): DailyDone | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as DailyDone;
    return v.date === todayKST() ? v : null;
  } catch {
    return null;
  }
}

export function writeDailyDone(v: DailyDone): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* 사파리 프라이빗 모드 등 — 기록만 안 남고 게임은 정상 동작 */
  }
}
