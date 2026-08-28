'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 순위표에 쓸 이름.
 *
 * 전에는 오늘의 챌린지를 완주한 결과 화면에서만 정할 수 있었다. 그래서
 * 데일리를 한 번도 끝내지 않은 사람은 계속 '익명' 이면서 고칠 데가 없었다.
 * 여기서도 정할 수 있게 둔다.
 */
export function NickEditor({ nick }: { nick: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nick ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    const v = value.trim();
    if (!v || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/me/nick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick: v }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? '저장하지 못했어요.');
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="pressable flex w-full items-center justify-between rounded-btn bg-card px-4 py-3.5 text-left"
      >
        <span className="flex flex-col items-start">
          <span className="text-[12px] font-medium text-ink3">순위표에 쓸 이름</span>
          <span className={`mt-0.5 text-[15px] font-bold ${nick ? 'text-ink' : 'text-ink3'}`}>
            {nick ?? '아직 안 정했어요'}
          </span>
        </span>
        <span className="text-[13px] font-bold text-brand">{nick ? '바꾸기' : '정하기'}</span>
      </button>
    );
  }

  return (
    <div className="rounded-btn bg-card px-4 py-3.5">
      <label className="text-[12px] font-medium text-ink3">순위표에 쓸 이름</label>
      <div className="mt-2 flex gap-2">
        <input
          autoFocus
          value={value}
          maxLength={12}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void save()}
          placeholder="12자까지"
          className="h-[46px] min-w-0 flex-1 rounded-btn bg-bg px-3.5 text-[15px] font-semibold outline-none"
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={!value.trim() || busy}
          className="pressable h-[46px] shrink-0 rounded-btn bg-brand px-5 text-[15px] font-bold text-white disabled:bg-bg disabled:text-ink3"
        >
          저장
        </button>
      </div>
      {error && <p className="mt-2 text-[12px] text-up">{error}</p>}
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setValue(nick ?? '');
          setError('');
        }}
        className="mt-2 text-[12px] font-medium text-ink3"
      >
        취소
      </button>
    </div>
  );
}
