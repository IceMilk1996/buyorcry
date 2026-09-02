'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NickField } from './NickField';
import { useNickCheck } from '@/lib/client/useNickCheck';
import { nickProblem } from '@/lib/nick';

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
  const check = useNickCheck(value);

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
        <span className="text-[13px] font-bold text-accent">{nick ? '바꾸기' : '정하기'}</span>
      </button>
    );
  }

  return (
    <div className="rounded-btn bg-card px-4 py-3.5">
      <label className="text-[12px] font-medium text-ink3">순위표에 쓸 이름</label>
      <div className="mt-2">
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
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setValue(nick ?? '');
            setError('');
          }}
          className="pressable h-[46px] flex-1 rounded-btn bg-bg text-[15px] font-bold text-ink2"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy || Boolean(nickProblem(value)) || check.state === 'taken'}
          className="pressable h-[46px] flex-1 rounded-btn bg-brand text-[15px] font-bold text-onbrand disabled:bg-bg disabled:text-ink3"
        >
          {busy ? '저장 중…' : '저장'}
        </button>
      </div>
    </div>
  );
}
