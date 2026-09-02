'use client';

import { useEffect, useRef, useState } from 'react';

const DEFAULT_MS = 520;
/* easeOutCubic — 처음엔 빠르게 훑고 끝에서 천천히 멎는다. 자릿수가 큰 쪽부터
   자리를 잡고 뒷자리가 마지막까지 구르는, 계기판 같은 느낌이 난다 */
const ease = (t: number) => 1 - (1 - t) ** 3;

/**
 * 숫자가 이전 값에서 새 값으로 굴러간다.
 *
 * 값이 바뀔 때마다 화면에 바로 찍으면 자산이 얼마나, 어느 쪽으로 움직였는지
 * 알 수 없다. 1,000,000 이 1,029,162 로 순간이동하면 "달라졌다" 만 남는다.
 * 굴러가는 동안 눈이 방향과 크기를 같이 읽는다.
 *
 * 애니메이션 중에 값이 또 바뀌면(빠르게 연타) 튀지 않도록 '지금 보이는 값'
 * 에서 이어서 굴린다.
 */
export function useCountUp(value: number, durationMs = DEFAULT_MS): number {
  const [shown, setShown] = useState(value);
  /* 다음 트윈의 출발점. 진행 중이면 매 프레임 갱신된다 */
  const fromRef = useRef(value);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;

    /* 움직임을 줄여달라고 한 사람에게는 한 프레임 만에 도착시킨다 */
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ms = reduce ? 0 : durationMs;
    const start = performance.now();

    const tick = (now: number) => {
      const t = ms <= 0 ? 1 : Math.min(1, (now - start) / ms);
      const v = t >= 1 ? value : from + (value - from) * ease(t);
      fromRef.current = v;
      setShown(v);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, durationMs]);

  return shown;
}
