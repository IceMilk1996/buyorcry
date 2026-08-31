'use client';

import { useEffect, useRef, useState } from 'react';

export type Bar = { o: number; h: number; l: number; c: number; v?: number };

const W = 360;
/** viewBox 높이의 하한. 이보다 납작해지면 캔들을 읽을 수 없다 */
const MIN_H = 200;
const PAD_Y = 16;

/**
 * 캔들 차트 — 직접 그린다.
 *
 * 차트 라이브러리를 쓰지 않은 이유:
 *  · 줌·팬·십자선이 필요 없다. 봉이 하나씩 등장하는 것만 있으면 된다
 *  · 디자인 톤(라운드 캔들, 보유 구간 밴드, 스프링 등장)을 그대로 맞출 수 있다
 *  · 의존성 0
 *
 * 가격 축에 눈금이 없는 건 의도다. 절대값이 보이면 종목을 알아버린다(기획서 3.2).
 */
export function CandleChart({
  bars,
  revealCount,
  holdMask = [],
  slots,
  entryPrice,
  markNext = false,
  className = '',
}: {
  bars: Bar[];
  /** 앞의 몇 개가 '미리 보여준' 구간인지 */
  revealCount: number;
  /** 플레이 구간에서 각 턴에 보유(LONG) 중이었는지 */
  holdMask?: boolean[];
  /**
   * 가로를 몇 칸으로 나눌지. 기본은 현재 봉 수.
   *
   * 플레이 중에는 최종 봉 수(50)를 넘겨야 한다. 그래야 봉 폭이 매 턴 변하지 않고,
   * 남은 턴이 오른쪽 빈 공간으로 보인다.
   */
  slots?: number;
  /** 보유 중일 때의 체결가. 수평선으로 그린다 */
  entryPrice?: number | null;
  /** 다음에 열릴 칸을 표시할지 (플레이 중일 때만) */
  markNext?: boolean;
  className?: string;
}) {
  /*
   * 남은 세로 공간을 정확히 채우기 위해 컨테이너를 재서 viewBox 높이를 맞춘다.
   *
   * preserveAspectRatio="none" 으로 늘리는 방법도 있지만, 그러면 안에 있는
   * 텍스트("다음 봉", "내 평단")까지 세로로 찌그러진다. 가로:세로 배율을
   * 같게 유지해야 왜곡이 없다.
   */
  const boxRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(400 / 360);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setRatio(height / width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = Math.max(MIN_H, Math.round(W * ratio));

  if (bars.length === 0) return <div ref={boxRef} className={`h-full w-full ${className}`} />;

  const n = Math.max(slots ?? bars.length, bars.length);
  const lo = Math.min(...bars.map((b) => b.l));
  const hi = Math.max(...bars.map((b) => b.h));
  const span = hi - lo || 1;

  const slot = W / n;
  const bw = Math.max(2.5, Math.min(slot * 0.62, 13));
  const x = (i: number) => i * slot + slot / 2;
  const y = (p: number) => PAD_Y + (1 - (p - lo) / span) * (H - PAD_Y * 2);

  return (
    <div ref={boxRef} className={`h-full w-full ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="가격 차트"
      >
      {/* 보유하던 구간을 옅게 칠한다 — 연속 구간은 하나로 합쳐야 줄무늬가 안 생긴다 */}
      {mergeRuns(holdMask).map(([from, to]) => (
        <rect
          key={`h${from}`}
          x={(revealCount + from) * slot}
          y={0}
          width={(to - from + 1) * slot}
          height={H}
          fill="var(--color-up)"
          opacity="0.07"
          rx="6"
        />
      ))}

      {/* 앞으로 봉이 들어올 자리 — 비어 보이지 않게 아주 옅게 깔아준다 */}
      {bars.length < n && (
        <rect
          x={bars.length * slot}
          y={0}
          width={(n - bars.length) * slot}
          height={H}
          fill="var(--color-ink3)"
          opacity="0.045"
          rx="8"
        />
      )}

      {/*
        지금 고르는 액션이 어느 봉에 적용되는지 — 이게 없으면
        "내가 투자해야 하는 봉이 어떤 봉인지" 알 수가 없다.
      */}
      {markNext &&
        bars.length < n &&
        (() => {
          // 슬롯 하나(50칸이면 7px)는 너무 좁아 눈에 안 띈다. 최소 폭을 보장한다
          const mw = Math.max(slot, 11);
          const mx = Math.min(bars.length * slot + slot / 2 - mw / 2, W - mw);
          const top = 24;
          return (
            <g>
              <rect x={mx} y={top} width={mw} height={H - top - 10} fill="var(--color-brand)" opacity="0.11" rx="5" />
              <rect
                x={mx}
                y={top}
                width={mw}
                height={H - top - 10}
                fill="none"
                stroke="var(--color-brand)"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.75"
                rx="5"
              />
              {/* 아래를 가리키는 꼭지 — 여기다, 라는 신호 */}
              <path
                d={`M${mx + mw / 2 - 4} ${top - 6} L${mx + mw / 2 + 4} ${top - 6} L${mx + mw / 2} ${top - 1} Z`}
                fill="var(--color-brand)"
              />
              <text
                x={Math.min(Math.max(mx + mw / 2, 16), W - 16)}
                y={top - 10}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="var(--color-brand)"
              >
                다음 칸
              </text>
            </g>
          );
        })()}

      {/* 내 평단 — 지금 이익인지 손실인지가 선 하나로 보인다 */}
      {entryPrice != null && entryPrice >= lo && entryPrice <= hi && (
        <g>
          <line x1={0} y1={y(entryPrice)} x2={W} y2={y(entryPrice)} stroke="var(--color-up)" strokeWidth="1.2" strokeDasharray="5 4" opacity="0.75" />
          <text x={4} y={y(entryPrice) - 5} fontSize="10" fontWeight="700" fill="var(--color-up)" opacity="0.85">
            내가 산 값
          </text>
        </g>
      )}

      {/* 사전공개 구간이 뭔지 모르면 점선은 그냥 선이다 */}
      {revealCount > 2 && revealCount < n && (
        <text
          x={(revealCount * slot) / 2}
          y={13}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="var(--color-ink3)"
          opacity="0.75"
        >
          이미 지나간 부분
        </text>
      )}

      {/* 사전공개 / 플레이 경계 */}
      {revealCount > 0 && revealCount < n && (
        <line
          x1={revealCount * slot}
          y1={4}
          x2={revealCount * slot}
          y2={H - 4}
          stroke="var(--color-ink3)"
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity="0.45"
        />
      )}

      {bars.map((b, i) => {
        const up = b.c >= b.o;
        const color = up ? 'var(--color-up)' : 'var(--color-down)';
        const past = i < revealCount;
        const top = y(Math.max(b.o, b.c));
        const bottom = y(Math.min(b.o, b.c));
        const isLast = i === bars.length - 1;

        return (
          <g
            key={i}
            opacity={past ? 0.55 : 1}
            className={isLast && !past ? 'anim-candle' : undefined}
            style={
              isLast && !past
                ? { transformOrigin: `${x(i)}px ${(top + bottom) / 2}px` }
                : undefined
            }
          >
            <line
              x1={x(i)}
              y1={y(b.h)}
              x2={x(i)}
              y2={y(b.l)}
              stroke={color}
              strokeWidth={Math.max(1, bw * 0.16)}
              strokeLinecap="round"
            />
            <rect
              x={x(i) - bw / 2}
              y={top}
              width={bw}
              height={Math.max(1.6, bottom - top)}
              rx={Math.min(2.6, bw / 3)}
              fill={color}
            />
          </g>
        );
      })}
      </svg>
    </div>
  );
}

/** [true,true,false,true] -> [[0,1],[3,3]] */
function mergeRuns(mask: boolean[]): [number, number][] {
  const runs: [number, number][] = [];
  let start = -1;
  mask.forEach((on, i) => {
    if (on && start < 0) start = i;
    if (!on && start >= 0) {
      runs.push([start, i - 1]);
      start = -1;
    }
  });
  if (start >= 0) runs.push([start, mask.length - 1]);
  return runs;
}
