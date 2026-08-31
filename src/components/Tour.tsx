'use client';

import { useEffect, useState } from 'react';

/**
 * 첫 판 첫 턴에 한 번 뜨는 안내.
 *
 * 원래는 한 곳씩 순서대로 짚는 방식이었다. 그런데 그건 네 번 눌러야 끝나고,
 * 끝나고 나면 "슬라이드를 넘겼다"는 기억만 남는다. 한 장에 이름표를 전부
 * 얹으면 탭 한 번으로 닫히고, 화면 전체가 지도처럼 머리에 남는다.
 *
 * 이미지로 만들지 않는다. 이런 안내를 스크린샷 위에 그려 붙이는 앱이 많은데,
 * 그러면 다크모드가 깨지고 폰 크기마다 어긋나고 UI 를 고칠 때마다 조용히
 * 낡는다. 대신 진짜 요소의 위치를 재서 이름표와 화살표를 그린다.
 */

type Side = 'above' | 'below' | 'right';

type Note = {
  /** [data-coach="..."] 로 찾는다 */
  target: string;
  side: Side;
  align: 'left' | 'right' | 'center';
  lines: string[];
  tilt?: number;
};

const GAP = 44;

const NOTES: Note[] = [
  {
    /*
     * 위가 아니라 아래에 붙인다. 위에는 자산 금액이 제일 큰 글씨로 있어서
     * 이름표를 얹으면 둘 다 안 읽힌다. 아래는 차트 윗부분이라 비어 있다.
     */
    target: 'score',
    side: 'below',
    align: 'left',
    lines: ['존버보다 잘하고 있는지', '여기서 봐요'],
    tilt: -1.5,
  },
  {
    target: 'next',
    side: 'right',
    align: 'left',
    lines: ['여기가 다음 칸이에요', '고른 게 여기서 처리돼요'],
    tilt: -1,
  },
  {
    target: 'actions',
    side: 'above',
    align: 'center',
    lines: ['오를 것 같으면 매수,', '내릴 것 같으면 매도를 눌러요'],
  },
  {
    target: 'help',
    side: 'below',
    align: 'right',
    lines: ['막히면 여기를 눌러요'],
    tilt: 1.5,
  },
];

type Placed = { note: Note; r: DOMRect };

export function Tour({ onDone }: { onDone: () => void }) {
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [vp, setVp] = useState({ w: 0, h: 0 });

  useEffect(() => {
    /*
     * setState 를 effect 본문에서 바로 부르지 않는다. 그리기가 끝난 뒤에
     * 재야 위치가 맞고, 연쇄 렌더도 생기지 않는다.
     */
    const measure = () => {
      setVp({ w: window.innerWidth, h: window.innerHeight });
      setPlaced(
        NOTES.map((note) => {
          const el = document.querySelector(`[data-coach="${note.target}"]`);
          return el ? { note, r: el.getBoundingClientRect() } : null;
        }).filter((x): x is Placed => x !== null)
      );
    };
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div
      /*
       * 너무 어두우면 정작 가리키는 대상이 안 보인다. 이름표만 남고 화면이
       * 사라지면 "무엇을 가리키는지" 를 알 수 없어서 안내의 의미가 없다.
       * 이름표 그림자는 아주 옅게만 둔다 — 밝은 곳에 걸쳤을 때 글자가
       * 뭉개지지 않을 정도면 되고, 진하면 글씨에 검은 테를 두른 것처럼 보인다.
       */
      className="fixed inset-0 z-50 bg-black/45"
      onClick={onDone}
      role="button"
      tabIndex={0}
      aria-label="안내 닫고 시작하기"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onDone();
      }}
    >
      {placed.length > 0 && (
        <>
          {/* 화살표는 이름표와 대상 사이의 빈 구간에만 그린다 */}
          <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${vp.w} ${vp.h}`} aria-hidden>
            {placed.map(({ note, r }) => (
              <Arrow key={note.target} note={note} r={r} />
            ))}
          </svg>

          {placed.map(({ note, r }) => (
            <p
              key={note.target}
              style={{ ...labelStyle(note, r, vp), transform: `rotate(${note.tilt ?? 0}deg)` }}
              className="absolute text-[13.5px] font-semibold leading-snug text-[#ffe9a8] [text-shadow:0_1px_2px_rgba(0,0,0,0.35),0_0_8px_rgba(0,0,0,0.28)]"
            >
              {note.lines.map((l, i) => (
                <span key={i} className="block">
                  {l}
                </span>
              ))}
            </p>
          ))}

          <p className="absolute inset-x-0 top-[max(10px,env(safe-area-inset-top))] text-center text-[12.5px] font-semibold text-white/60">
            아무 데나 탭하면 시작해요
          </p>
        </>
      )}
    </div>
  );
}

/** 이름표 위치. 세로로 붙일 땐 위/아래, 가로로 붙일 땐 오른쪽 빈 자리에 */
function labelStyle(note: Note, r: DOMRect, vp: { w: number; h: number }): React.CSSProperties {
  if (note.side === 'right') {
    return {
      left: Math.min(r.right + GAP, vp.w - 150),
      top: r.top + r.height / 2,
      translate: '0 -50%',
      maxWidth: 190,
    };
  }
  const vertical =
    note.side === 'below' ? { top: r.bottom + GAP } : { bottom: vp.h - (r.top - GAP) };
  const horizontal =
    note.align === 'right'
      ? { right: Math.max(16, vp.w - r.right), textAlign: 'right' as const }
      : note.align === 'center'
        ? { left: 16, right: 16, textAlign: 'center' as const }
        : { left: Math.max(16, r.left) };
  return { ...vertical, ...horizontal };
}

/** 이름표에서 대상으로 휘어 들어가는 짧은 화살표 */
function Arrow({ note, r }: { note: Note; r: DOMRect }) {
  /*
   * 이름표보다 화살표를 조금 진하게 둔다. 글자는 면이라 옅어도 읽히지만
   * 화살표는 2px 선이라 같이 낮추면 사라진다.
   */
  const C = '#f2c94c';

  if (note.side === 'right') {
    const y = r.top + r.height / 2;
    const x1 = r.right + GAP - 8;
    const x2 = r.right + 7;
    return (
      <g>
        <path
          d={`M${x1} ${y} Q${(x1 + x2) / 2} ${y - 12} ${x2} ${y}`}
          fill="none"
          stroke={C}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d={`M${x2} ${y} l9 -4 l-1 8 z`} fill={C} />
      </g>
    );
  }

  const x =
    note.align === 'center'
      ? r.left + r.width / 2
      : note.align === 'right'
        ? r.right - 22
        : r.left + 26;
  const below = note.side === 'below';
  const y1 = below ? r.bottom + GAP - 8 : r.top - GAP + 8;
  const y2 = below ? r.bottom + 7 : r.top - 7;
  const bend = note.align === 'right' ? -14 : 14;
  return (
    <g>
      <path
        d={`M${x} ${y1} Q${x + bend} ${(y1 + y2) / 2} ${x} ${y2}`}
        fill="none"
        stroke={C}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d={below ? `M${x} ${y2} l-4 9 l8 -1 z` : `M${x} ${y2} l-4 -9 l8 1 z`}
        fill={C}
      />
    </g>
  );
}
