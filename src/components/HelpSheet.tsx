'use client';

import { SCREEN_NOTES } from './gameNotes';

/**
 * 플레이 중 여는 도움말.
 *
 * /how 페이지로 보내지 않는다. 그건 화면을 떠나는 일이고, 무한 모드에서는
 * 하던 판이 사라진다. 애초에 "몰라서 뒤로 나갔다"가 이 화면이 생긴 이유라,
 * 나가지 않고 그 자리에서 열려야 한다.
 */
export function HelpSheet({ onClose, onReplay }: { onClose: () => void; onReplay: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/45" onClick={onClose}>
      <div
        className="anim-rise max-h-[82dvh] overflow-y-auto rounded-t-card bg-card px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-1 w-9 rounded-full bg-line" />

        <h2 className="mt-4 text-[19px] font-bold tracking-tight">게임 방법</h2>

        <ol className="mt-3 space-y-2.5 text-[14px] leading-relaxed text-ink2">
          <Rule n={1}>
            차트를 보고 <b className="font-bold text-ink">오를지 내릴지</b> 예측해서{' '}
            <b className="font-bold text-up">매수</b> · 관망 ·{' '}
            <b className="font-bold text-down">매도</b> 중 하나를 골라요 — 사기 · 그대로 두기 ·
            팔기예요
          </Rule>
          <Rule n={2}>
            30턴이 끝나면 <b className="font-bold text-ink">그냥 사두고 끝까지 안 판 것</b>과
            비교해요. 그것보다 많이 벌면 이겨요 — 이 상대를 존버라고 불러요
          </Rule>
        </ol>

        <h3 className="mt-6 text-[13px] font-bold text-ink3">화면 보는 법</h3>
        <dl className="mt-2.5 space-y-2.5">
          {SCREEN_NOTES.map((s) => (
            <div key={s.n} className="text-[13.5px] leading-relaxed">
              <dt className="font-bold text-ink">{s.title}</dt>
              <dd className="text-ink2">{s.body}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onReplay}
            className="pressable h-[52px] flex-1 rounded-btn bg-bg text-[15px] font-bold text-ink2"
          >
            화면에서 짚어주기
          </button>
          <button
            type="button"
            onClick={onClose}
            className="pressable h-[52px] flex-1 rounded-btn bg-brand text-[16px] font-bold text-white"
          >
            계속하기
          </button>
        </div>
      </div>
    </div>
  );
}

function Rule({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-brandweak text-[11px] font-bold text-brand">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}
