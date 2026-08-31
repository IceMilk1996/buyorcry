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
 * 껄무새 표정이 수익률을 따라가서 숫자를 안 읽어도 상태가 보인다.
 */
export function StatHeader({
  equity,
  pnl,
  holdPnl,
  turn,
  totalTurns,
  holding,
  onHelp,
}: {
  equity: number;
  pnl: number;
  /** 같은 시점의 존버 수익률. 첫 봉이 열리기 전에는 둘 다 0이다 */
  holdPnl: number;
  turn: number;
  totalTurns: number;
  holding: boolean;
  onHelp?: () => void;
}) {
  const { mood, tone } = moodFor(pnl);
  const pnlColor = pnl > 0 ? 'text-up' : pnl < 0 ? 'text-down' : 'text-ink3';

  /*
   * 이 게임의 점수는 수익률이 아니라 존버와의 차이다. 그런데 지금까지는
   * 그 차이를 결과 화면에서 처음 봤다 — 30턴 내내 이기고 있는지 지고 있는지
   * 모른 채 버튼을 누르는 셈이었다. "규칙 3번"을 글로 읽히는 것보다
   * 매 턴 숫자로 보여주는 편이 훨씬 빨리 이해된다.
   *
   * 스포일러가 아니다. 존버 수익률은 지금 화면에 그려진 캔들에서 그대로
   * 계산되는 값이라, 우리는 뺄셈을 대신 해줄 뿐이다.
   */
  const alpha = pnl - holdPnl;
  const ahead = alpha > 0.0005;
  const behind = alpha < -0.0005;

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
              {holding ? '주식 있음' : '현금'}
            </span>
          </div>
        </div>

        <Mascot mood={mood} tone={tone} size={54} className="anim-bob shrink-0" />
      </div>

      {/* 점수판. 결과 화면과 같은 말("존버보다 … 잘했어요")을 쓴다 */}
      <div
        data-coach="score"
        className="mt-2.5 flex items-center justify-between gap-2 rounded-2xl bg-card px-3.5 py-2"
      >
        <span className="text-[13px] font-semibold text-ink2">
          {ahead || behind ? (
            <>
              존버보다{' '}
              <span className={ahead ? 'text-up' : 'text-down'}>{fmtPct(alpha)}</span>
              {ahead ? ' 잘하는 중' : ' 못하는 중'}
            </>
          ) : (
            '존버와 비슷하게 가는 중'
          )}
        </span>
        <span className="shrink-0 text-[12px] font-medium text-ink3">
          존버 {fmtPct(holdPnl)}
        </span>
      </div>

      {/* 턴 진행바 */}
      <div className="mt-2.5 flex items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out"
            style={{ width: `${(turn / totalTurns) * 100}%` }}
          />
        </div>
        <span className="text-[12px] font-semibold text-ink3">
          {turn}/{totalTurns}
        </span>
        {/*
          플레이 화면에서 나갈 수 있는 길이 뒤로가기뿐이었다. 실제로 어떻게
          하는지 몰라 뒤로 갔다가 홈에서야 설명을 본 사람이 있었다. 판을 잃지
          않고 그 자리에서 열 수 있어야 한다.
        */}
        {onHelp && (
          <button
            type="button"
            onClick={onHelp}
            aria-label="게임 방법"
            data-coach="help"
            className="pressable flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-card text-[13px] font-bold text-ink3"
          >
            ?
          </button>
        )}
      </div>
    </div>
  );
}
