'use client';

import { useEffect, useState } from 'react';
import { nickProblem } from '@/lib/nick';

export type NickCheck =
  | { state: 'idle' }
  | { state: 'invalid'; message: string }
  | { state: 'checking' }
  | { state: 'ok' }
  | { state: 'taken'; message: string };

/**
 * 입력하는 동안 이름을 쓸 수 있는지 물어본다.
 *
 * 한 글자마다 서버를 부르지 않는다. 400ms 쉬면 그때 한 번 묻고, 그 사이
 * 또 바뀌면 앞의 요청은 버린다(AbortController). 안 그러면 "권" 을 지우고
 * "김" 을 쳤을 때 늦게 도착한 "권" 의 답이 화면을 덮어쓴다.
 *
 * '확인 중' 을 state 로 두지 않는 게 핵심이다. 지금 값과 마지막으로 답을
 * 받은 값이 다르면 그게 곧 확인 중이다. 효과 안에서 setState 를 부르지
 * 않아도 되고, 값이 되돌아왔을 때(다시 원래 이름으로) 헛돌지도 않는다.
 */
export function useNickCheck(value: string): NickCheck {
  const [answer, setAnswer] = useState<{ for: string; available: boolean; reason: string } | null>(
    null
  );

  const trimmed = value.trim();

  useEffect(() => {
    if (!trimmed || nickProblem(trimmed)) return;

    const ac = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/me/nick/check?nick=${encodeURIComponent(trimmed)}`, {
          signal: ac.signal,
        });
        const data = await res.json();
        setAnswer({
          for: trimmed,
          available: Boolean(data.available),
          reason: data.reason ?? '',
        });
      } catch {
        /* 확인은 편의 기능이다. 실패하면 조용히 두고 저장 때 판정한다 */
      }
    }, 400);

    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [trimmed]);

  if (!trimmed) return { state: 'idle' };

  const problem = nickProblem(trimmed);
  if (problem) return { state: 'invalid', message: problem };

  if (answer?.for !== trimmed) return { state: 'checking' };
  return answer.available
    ? { state: 'ok' }
    : { state: 'taken', message: answer.reason || '이미 누가 쓰고 있는 이름이에요.' };
}
