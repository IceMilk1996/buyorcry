'use client';

import { NICK_MAX } from '@/lib/nick';
import type { NickCheck } from '@/lib/client/useNickCheck';

/**
 * 이름 입력칸 하나. 모달과 마이페이지가 같은 걸 쓴다.
 *
 * 상태 줄의 높이를 늘 잡아둔다. 글자를 칠 때마다 문구가 생겼다 사라지면
 * 그 밑의 버튼이 위아래로 움직여서, 누르려던 손가락이 헛짚는다.
 */
export function NickField({
  value,
  check,
  onChange,
  onEnter,
  autoFocus,
  error,
}: {
  value: string;
  /*
   * 검사는 부모가 돌린다. 저장 버튼도 같은 결과를 봐야 하는데(이미 쓰는
   * 이름이면 눌리면 안 된다), 훅을 여기 안에 두면 부모가 그걸 못 본다.
   */
  check: NickCheck;
  onChange: (v: string) => void;
  onEnter?: () => void;
  autoFocus?: boolean;
  /** 저장에 실패한 이유. 실시간 확인보다 우선한다 */
  error?: string;
}) {
  return (
    <div>
      <input
        autoFocus={autoFocus}
        value={value}
        maxLength={NICK_MAX}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        placeholder={`${NICK_MAX}자까지`}
        className={`h-[52px] w-full rounded-btn bg-bg px-4 text-[16px] font-semibold outline-none ring-1 transition-colors ${
          error || check.state === 'taken' || check.state === 'invalid'
            ? 'ring-up/60'
            : check.state === 'ok'
              ? 'ring-brand/70'
              : 'ring-transparent'
        }`}
      />
      <p className="mt-2 min-h-[18px] text-[12.5px] font-semibold">
        <Status check={check} error={error} />
      </p>
    </div>
  );
}

function Status({ check, error }: { check: NickCheck; error?: string }) {
  if (error) return <span className="text-up">{error}</span>;
  switch (check.state) {
    case 'idle':
      return <span className="text-ink3">순위표에 이 이름으로 올라가요.</span>;
    case 'invalid':
      return <span className="text-up">{check.message}</span>;
    case 'checking':
      return <span className="text-ink3">확인하는 중…</span>;
    case 'ok':
      return <span className="text-accent">쓸 수 있는 이름이에요.</span>;
    case 'taken':
      return <span className="text-up">{check.message}</span>;
  }
}
