'use client';

import { useEffect, useState } from 'react';

/**
 * 첫 판 첫 턴의 손잡이 안내.
 *
 * 원래는 화면을 덮는 시트에 세 줄을 적어뒀다. 그런데 게임을 시작하고도
 * 뭘 해야 할지 몰라 뒤로 나갔다가 홈에서야 설명을 봤다는 사람이 있었다.
 * 시트는 분명히 떴는데도 그랬다 — 팝업은 읽는 것이 아니라 치우는 것이기
 * 때문이다. 큰 파란 버튼이 있으면 손가락이 먼저 누른다.
 *
 * 그래서 글을 읽히는 대신 **화면의 진짜 요소를 하나씩 가리킨다.** 한 번에
 * 한 곳만 밝히고 나머지는 어둡게 덮으면, 읽지 않아도 어디를 보라는 건지는
 * 전달된다. 마지막 단계가 '?' 버튼인 것은 의도다 — 다시 막혔을 때 뒤로가기
 * 말고 갈 데가 있다는 걸 알려주는 게 이 안내의 진짜 목적이다.
 */

type Step = { target: string; title: string; body: string };

const STEPS: Step[] = [
  {
    target: 'chart',
    title: '왼쪽은 이미 지나간 부분이에요',
    body: '파란 점선 자리가 다음에 열릴 칸이에요. 어떻게 될지는 아직 아무도 몰라요.',
  },
  {
    target: 'actions',
    title: '여기서 하나 고르면 칸이 하나 열려요',
    body: '지금 누르면 바로 안 돼요. 다음 칸이 열릴 때 그 값으로 처리돼요. 살 때도 팔 때도 늘 전 재산이에요.',
  },
  {
    target: 'score',
    title: '점수는 번 돈이 아니에요',
    body: '처음에 사서 끝까지 안 판 사람보다 많이 벌면 이겨요. 그 사람을 존버라고 불러요.',
  },
  {
    target: 'help',
    title: '막히면 여기를 누르세요',
    body: '판을 잃지 않고 그 자리에서 설명을 다시 볼 수 있어요.',
  },
];

export function Coach({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const step = STEPS[i];

  useEffect(() => {
    const el = document.querySelector<HTMLElement>(`[data-coach="${step.target}"]`);
    if (!el) {
      // 가리킬 것이 없으면 조용히 넘어간다. 안내 때문에 게임이 막히면 안 된다
      return;
    }
    el.classList.add('coach-lit');

    /*
     * setState 를 effect 본문에서 바로 부르지 않는다. 그리기가 끝난 뒤에
     * 재야 위치가 맞고, 연쇄 렌더도 생기지 않는다.
     */
    const measure = () => setRect(el.getBoundingClientRect());
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      el.classList.remove('coach-lit');
    };
  }, [step.target]);

  const last = i === STEPS.length - 1;
  const next = () => (last ? onDone() : setI((n) => n + 1));

  /*
   * 말풍선은 밝힌 곳을 가리지 않는 쪽에 붙인다. 화면 위쪽 요소면 아래에,
   * 아래쪽 요소면 위에.
   */
  const vh = typeof window === 'undefined' ? 0 : window.innerHeight;
  const below = rect ? rect.top < vh * 0.5 : true;
  const pos = rect
    ? below
      ? { top: Math.min(rect.bottom + 14, vh - 200) }
      : { bottom: Math.min(vh - rect.top + 14, vh - 200) }
    : { bottom: 24 };

  return (
    <div className="fixed inset-0 z-50 bg-black/65">
      {rect && (
        <div className="anim-rise absolute left-4 right-4 rounded-card bg-card p-5" style={pos}>
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, n) => (
              <span
                key={n}
                className={`h-1.5 rounded-full transition-all ${
                  n === i ? 'w-5 bg-brand' : 'w-1.5 bg-line'
                }`}
              />
            ))}
          </div>

          <h2 className="mt-3 text-[18px] font-bold leading-snug tracking-tight">{step.title}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink2">{step.body}</p>

          <div className="mt-4 flex items-center gap-2">
            {!last && (
              <button
                type="button"
                onClick={onDone}
                className="pressable h-[50px] flex-1 rounded-btn bg-bg text-[15px] font-bold text-ink3"
              >
                건너뛰기
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="pressable h-[50px] flex-[2] rounded-btn bg-brand text-[16px] font-bold text-white"
            >
              {last ? '시작할게요' : '다음'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
