'use client';

import { Action } from '@/lib/game/types';
import { Logo } from './Logo';

/**
 * 지금까지의 행동 자취.
 *
 * 공유되는 이모지 격자와 같은 정보를 게임 중에도 보여준다.
 * 자기 패턴이 눈에 보이면 "또 뇌동매매했네" 같은 자각이 생기고,
 * 그게 결과 화면의 메시지로 자연스럽게 이어진다.
 */
export function ActionTrail({ actions, total }: { actions: Action[]; total: number }) {
  const remain = total - actions.length;

  return (
    <div className="shrink-0 px-5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-ink3">내 행동</span>
        <span className="text-[12px] font-medium text-ink3">{remain}턴 남음</span>
      </div>
      {/* 남은 턴까지 전부 칸으로 깔아둔다. 초반에 왼쪽만 차 있으면 허전하다 */}
      <div className="mt-2 flex h-5 items-center gap-[3px]">
        {Array.from({ length: total }, (_, i) => {
          const a = actions[i];
          /* 지금 고르는 중인 칸. 여기에 껄무새가 서 있다 */
          const next = i === actions.length;
          return (
            <span
              key={i}
              className={`relative h-2.5 flex-1 rounded-full ${
                /* 열 칸마다 틈을 벌린다. 서른 개가 고르게 늘어서 있으면
                   '몇 번째' 를 세려면 하나씩 짚어야 한다 */
                i > 0 && i % 10 === 0 ? 'ml-[6px]' : ''
              } ${
                a === 'BUY'
                  ? 'bg-up'
                  : a === 'SELL'
                    ? 'bg-down'
                    : a === 'HOLD'
                      ? 'bg-trail'
                      : 'bg-line/60'
              }`}
            >
              {/*
                지금 고르는 칸에는 껄무새가 서 있다. 한 턴 넘길 때마다 한 칸씩
                오른쪽으로 옮겨간다 — 색 점보다 '내가 여기 있다' 가 분명하다.
                칸(8px)보다 크지만 자리를 차지하지 않게 띄워서 얹는다. 안 그러면
                이 칸만 넓어져서 서른 칸의 간격이 어긋난다.
              */}
              {next && (
                /*
                  자리 잡기와 등장 애니메이션을 다른 요소에 나눠 건다.
                  한 요소에 겹치면 -translate-x-1/2 과 pop-in 의 transform 이
                  서로를 덮어써서 껄무새가 반 칸 옆에 서거나 튀어나온다.
                */
                <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Logo
                    size={17}
                    className="anim-pop block text-accent drop-shadow-[0_0_3px_var(--color-bg)]"
                  />
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
