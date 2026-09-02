'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NickField } from './NickField';
import { useNickCheck } from '@/lib/client/useNickCheck';
import { nickProblem } from '@/lib/nick';

/**
 * 로그인 직후 딱 한 번 뜨는 이름 정하기.
 *
 * 카카오 콜백이 이름 없는 사람만 /?welcome=nick 으로 돌려보낸다. 그래서
 * 여기서는 물어볼 게 없다 — 주소에 표가 있으면 띄우면 된다. 홈이 매번
 * 로그인 상태를 한 번 더 확인할 이유가 없다.
 *
 * 건너뛸 수 있게 둔다. 이름을 안 정하면 순위표에 '익명' 으로 남을 뿐이고,
 * 첫 화면에서 못 빠져나가게 막으면 그 자리에서 이탈한다. 나중에 정할 곳은
 * 마이페이지에 있다.
 */
export function NickPrompt() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const check = useNickCheck(value);

  /*
   * 표를 확인하는 즉시 주소에서 지운다. 안 지우면 새로고침할 때마다 다시
   * 뜨고, 그 주소를 그대로 복사해 공유하면 남의 화면에도 뜬다.
   */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('welcome') !== 'nick') return;
    /*
     * 여는 것과 주소를 지우는 것을 한 프레임 뒤에 '같이' 한다.
     *
     * 한 프레임 미루는 건 효과 안에서 곧바로 setState 를 부르지 않기
     * 위해서다(react-hooks/set-state-in-effect). 시트는 어차피 올라오는
     * 애니메이션으로 등장하므로 한 프레임은 보이지 않는다.
     *
     * 주소를 먼저 지우면 안 된다 — 개발 모드(StrictMode)는 효과를 두 번
     * 실행하는데, 첫 번째가 주소를 지우고 예약을 취소당한 뒤 두 번째는
     * 표가 없어서 그냥 돌아가버린다. 모달이 영영 안 뜬다. 실제로 그렇게 됐다.
     */
    const id = requestAnimationFrame(() => {
      setOpen(true);
      window.history.replaceState(null, '', window.location.pathname);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  if (!open) return null;

  async function save() {
    const v = value.trim();
    if (busy || nickProblem(v)) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/me/nick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick: v }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? '저장하지 못했어요.');
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      {/* 바깥을 눌러도 안 닫는다 — 실수로 닫으면 다시 열 길이 여기엔 없다 */}
      <div className="absolute inset-0 bg-black/45" />
      <div className="anim-rise absolute bottom-0 w-full max-w-[480px] rounded-t-card bg-card px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto h-1 w-9 rounded-full bg-line" />

        <h2 className="mt-5 text-[19px] font-bold leading-snug">
          순위표에 쓸 이름을
          <br />
          정해주세요
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink2">
          오늘의 챌린지 순위표에 이 이름으로 올라가요. 나중에 마이페이지에서 바꿀 수 있어요.
        </p>

        <div className="mt-5">
          <NickField
            autoFocus
            check={check}
            value={value}
            onChange={(v) => {
              setValue(v);
              setError('');
            }}
            onEnter={() => void save()}
            error={error}
          />
        </div>

        <button
          type="button"
          onClick={() => void save()}
          /* 이미 쓰는 이름인 걸 알면서 누르게 두지 않는다. 확인 중에는
             막지 않는다 — 잠깐 멈추는 게 더 답답하고, 진짜 판정은 서버가 한다 */
          disabled={busy || Boolean(nickProblem(value)) || check.state === 'taken'}
          className="pressable mt-1 h-[56px] w-full rounded-btn bg-brand text-[16px] font-bold text-onbrand disabled:bg-bg disabled:text-ink3"
        >
          {busy ? '저장하는 중…' : '이 이름으로 할게요'}
        </button>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-2 h-[46px] w-full text-[14px] font-semibold text-ink3"
        >
          나중에 할게요
        </button>
      </div>
    </div>
  );
}
