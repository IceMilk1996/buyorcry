'use client';

import { Mascot, moodFor } from './Mascot';

export function fmtWon(n: number): string {
  return Math.round(n).toLocaleString('ko-KR');
}
export function fmtPct(x: number, digits = 1): string {
  return `${x >= 0 ? '+' : ''}${(x * 100).toFixed(digits)}%`;
}

/**
 * 상단 상태.
 *
 * 토스의 숫자 위계를 따른다 — 금액은 크고 굵게, 단위는 작게, 부가정보는 회색.
 * 봉이 표정이 수익률을 따라가서 숫자를 안 읽어도 상태가 보인다.
 */
export function StatHeader({
  equity,
  pnl,
  turn,
  totalTurns,
  holding,
}: {
  equity: number;
  pnl: number;
  turn: number;
  totalTurns: number;
  holding: boolean;
}) {
  const { mood, tone } = moodFor(pnl);
  const pnlColor = pnl > 0 ? 'text-up' : pnl < 0 ? 'text-down' : 'text-ink3';

  return (
    <div className="shrink-0 px-5 pt-3">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[13px] font-medium text-ink3">내 자산</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[34px] font-bold leading-none tracking-tight">
              {fmtWon(equity)}
            </span>
            <span className="text-[17px] font-semibold text-ink2">원</span>
          </div>
          <div className={`mt-1.5 text-[15px] font-semibold ${pnlColor}`}>
            {fmtPct(pnl)}
            <span className="ml-1.5 text-[13px] font-medium text-ink3">
              {holding ? '보유 중' : '현금'}
            </span>
          </div>
        </div>

        <Mascot mood={mood} tone={tone} size={54} className="anim-bob shrink-0" />
      </div>

      {/* 턴 진행바 */}
      <div className="mt-3 flex items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out"
            style={{ width: `${(turn / totalTurns) * 100}%` }}
          />
        </div>
        <span className="text-[12px] font-semibold text-ink3">
          {turn}/{totalTurns}
        </span>
      </div>
    </div>
  );
}
