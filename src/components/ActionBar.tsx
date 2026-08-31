'use client';

import { Action } from '@/lib/game/types';

/**
 * 하단 액션바.
 *
 * 30턴을 엄지로 연타하는 화면이라 버튼이 크고 균등해야 한다.
 * 지금 상태에서 불가능한 액션은 눌리지 않게 막는다 —
 * 엔진은 조용히 HOLD로 처리하지만, 사용자가 눌렀는데 아무 일도 안 나는 건 나쁘다.
 *
 * ⚠️ 버튼을 2개로 줄이지 말 것.
 *   매수/관망/매도 세 자리가 30턴 내내 고정되어야 한다. 비활성인 쪽을 감추면
 *   같은 자리의 의미가 매수↔매도로 뒤집히거나 관망 버튼이 좌우로 움직인다.
 *   연타하다 자리를 외운 손가락이 정반대 주문을 내게 되고, 이 게임에서
 *   매수↔매도 오조작은 결과를 통째로 뒤집는다.
 *   비활성 버튼은 눌러도 아무 일이 없으므로 그 자체가 안전장치다.
 *
 * 비활성 스타일은 '회색 배경 + 옅은 색 글자'다. 색 배경을 쓰면 못 누르는 버튼이
 * 시선을 가져가고, 무채색으로만 두면 매수 버튼이라는 정체성이 사라진다.
 */
export function ActionBar({
  holding,
  disabled,
  onAction,
}: {
  holding: boolean;
  disabled: boolean;
  onAction: (a: Action) => void;
}) {
  return (
    <div
      className="shrink-0 border-t border-line bg-card/85 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl"
    >
      <p className="mb-2 text-center text-[12px] font-medium text-ink3">
        지금 고른 건 <span className="font-bold text-brand">다음 칸</span>이 열릴 때 처리돼요
      </p>
      <div className="flex gap-2">
        <Btn
          label="매수"
          hint="전량"
          disabled={disabled || holding}
          onClick={() => onAction('BUY')}
          className="bg-up text-white disabled:bg-bg disabled:text-up/40"
        />
        <Btn
          label="관망"
          hint="그대로"
          disabled={disabled}
          onClick={() => onAction('HOLD')}
          className="bg-bg text-ink2 disabled:text-ink3/45"
        />
        <Btn
          label="매도"
          hint="전량"
          disabled={disabled || !holding}
          onClick={() => onAction('SELL')}
          className="bg-down text-white disabled:bg-bg disabled:text-down/40"
        />
      </div>
    </div>
  );
}

function Btn({
  label,
  hint,
  disabled,
  onClick,
  className,
}: {
  label: string;
  hint: string;
  disabled: boolean;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`pressable flex h-[62px] flex-1 flex-col items-center justify-center gap-0.5 rounded-btn text-[17px] font-bold ${className}`}
    >
      <span>{label}</span>
      <span className="text-[11px] font-medium opacity-70">{hint}</span>
    </button>
  );
}
