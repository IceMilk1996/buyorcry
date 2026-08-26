'use client';

import { Action } from '@/lib/game/types';

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
          return (
            <span
              key={i}
              className={`h-2.5 flex-1 rounded-full ${
                a === 'BUY'
                  ? 'bg-up'
                  : a === 'SELL'
                    ? 'bg-down'
                    : a === 'HOLD'
                      ? 'bg-line'
                      : 'bg-line/40'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
