'use client';

import { ActionBar } from '@/components/ActionBar';
import { ActionTrail } from '@/components/ActionTrail';
import { Bar, CandleChart } from '@/components/CandleChart';
import { StatHeader } from '@/components/StatHeader';
import { Action } from '@/lib/game/types';

/**
 * 설명용으로 멈춰 세운 플레이 화면.
 *
 * 스크린샷 이미지를 쓰지 않는다. 이미지는 다크모드가 안 되고, 무엇보다
 * 버튼 문구 하나만 고쳐도 설명이 조용히 낡는다. 진짜 컴포넌트를 그대로
 * 쓰면 UI 가 바뀌는 순간 이 페이지도 같이 바뀐다.
 *
 * ⚠️ 프레임 높이를 % 나 aspect-ratio 로 주지 말 것.
 *   상단/하단은 높이가 고정이고 차트만 늘어나는 구조라, 폭이 바뀌면
 *   세로 비율이 통째로 달라진다. 그러면 %로 찍어둔 번호 핀이 엉뚱한 데
 *   가서 붙는다. 높이를 px 로 고정해야 핀의 세로 위치가 고정된다.
 */

/** 6턴째까지 진행한 한 판. 실제 시세가 아니라 설명용으로 고른 모양이다 */
const DEMO: Bar[] = [
  { o: 16.2, h: 27, l: 14.3, c: 25 },
  { o: 25, h: 27.1, l: 22.8, c: 24.9 },
  { o: 24.9, h: 26.5, l: 24.9, c: 26.5 },
  { o: 26.5, h: 28.5, l: 24.4, c: 26.4 },
  { o: 26.4, h: 28.7, l: 22.4, c: 24.7 },
  { o: 24.7, h: 26.5, l: 17.1, c: 18.9 },
  { o: 18.9, h: 23.7, l: 1.1, c: 5.7 },
  { o: 5.7, h: 9.1, l: 2.6, c: 6 },
  { o: 6, h: 15.5, l: 0, c: 9.5 },
  { o: 9.5, h: 9.9, l: 5.5, c: 5.8 },
  { o: 5.8, h: 21.3, l: 5.5, c: 20.9 },
  { o: 20.9, h: 46.7, l: 7, c: 32.5 },
  { o: 32.5, h: 57, l: 26.3, c: 50.6 },
  { o: 50.6, h: 68, l: 42.4, c: 59.6 },
  { o: 59.6, h: 68, l: 49.6, c: 58 },
  { o: 58, h: 66, l: 55, c: 63 },
  { o: 63, h: 64.7, l: 58.2, c: 59.9 },
  { o: 59.9, h: 82.8, l: 53.4, c: 76.1 },
  { o: 76.1, h: 100, l: 64.1, c: 87.7 },
  { o: 87.7, h: 96.8, l: 73.8, c: 82.9 },
  { o: 82.9, h: 85.7, l: 74.7, c: 77.5 },
  { o: 77.5, h: 84.8, l: 62.4, c: 69.7 },
  { o: 69.7, h: 76.5, l: 61.7, c: 68.6 },
  { o: 68.6, h: 91.5, l: 58, c: 80.7 },
  { o: 80.7, h: 91, l: 75.3, c: 85.5 },
  { o: 85.5, h: 92.9, l: 72.4, c: 79.8 },
];

const REVEAL = 20;
const TOTAL = 30;
const ENTRY = 77.5;
const ACTIONS: Action[] = ['HOLD', 'BUY', 'HOLD', 'HOLD', 'HOLD', 'HOLD'];
const HOLD_MASK = [false, true, true, true, true, true];
/** 100만으로 77.5에 전량 매수해 79.8까지 들고 온 상태 (수수료 0.05% 반영) */
const EQUITY = 1_029_162;

/** 프레임 안에 찍는 번호 핀. 좌표는 프레임 크기에 대한 % */
const PINS: { n: number; x: number; y: number }[] = [
  { n: 1, x: 64, y: 8.5 },
  { n: 2, x: 12, y: 54 },
  { n: 3, x: 53, y: 55 },
  { n: 4, x: 21, y: 37 },
  { n: 5, x: 25, y: 78 },
  { n: 6, x: 34, y: 92 },
];

const NOTES: { n: number; title: string; body: string }[] = [
  { n: 1, title: '내 자산', body: '100만으로 시작해요. 밑에 수익률과 지금 현금인지 보유 중인지가 같이 나와요.' },
  { n: 2, title: '지나간 구간', body: '판이 시작되기 전 이미 지나간 구간이에요. 흐리게 칠해뒀고, 여기선 매매할 수 없어요.' },
  { n: 3, title: '다음 봉', body: '지금 고른 주문이 체결될 자리예요. 이 봉이 어떻게 생겼는지는 아직 아무도 몰라요.' },
  { n: 4, title: '내 평단', body: '보유 중일 때만 나와요. 이 선보다 위면 이익, 아래면 손실이에요.' },
  { n: 5, title: '내 행동', body: '지금까지 뭘 했는지가 한 줄로 남아요. 빨강이 매수, 파랑이 매도, 회색이 관망이에요.' },
  { n: 6, title: '매수 · 관망 · 매도', body: '매수와 매도는 늘 전량이에요. 보유 중일 땐 매수가, 현금일 땐 매도가 꺼져 있어요.' },
];

export function HowScreen() {
  return (
    <div className="mt-6">
      {/*
        진짜 화면을 그대로 쓰기 때문에 버튼이 눌리는 것처럼 보인다.
        눌러도 아무 일이 없으면 고장으로 읽히므로 아예 입력을 막고,
        의미는 아래 목록이 전달하니 스크린리더에서도 숨긴다.
      */}
      <div
        aria-hidden
        className="pointer-events-none relative h-[600px] w-full select-none overflow-hidden rounded-card border border-line bg-bg"
      >
        <div className="flex h-full flex-col">
          <StatHeader
            equity={EQUITY}
            pnl={EQUITY / 1_000_000 - 1}
            turn={ACTIONS.length}
            totalTurns={TOTAL}
            holding
          />

          <div className="mt-3 min-h-0 flex-1 px-4">
            <div className="h-full rounded-card bg-card px-2 py-3">
              <CandleChart
                bars={DEMO}
                revealCount={REVEAL}
                holdMask={HOLD_MASK}
                slots={REVEAL + TOTAL}
                entryPrice={ENTRY}
                markNext
              />
            </div>
          </div>

          <div className="mt-3 mb-1">
            <ActionTrail actions={ACTIONS} total={TOTAL} />
          </div>

          <ActionBar holding disabled={false} onAction={() => {}} />
        </div>

        {PINS.map((p) => (
          <span
            key={p.n}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            className="absolute flex h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-white ring-[3px] ring-bg"
          >
            {p.n}
          </span>
        ))}
      </div>

      <ol className="mt-5 space-y-3.5">
        {NOTES.map((s) => (
          <li key={s.n} className="flex gap-2.5">
            <span className="mt-[3px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
              {s.n}
            </span>
            <span className="text-[14px] leading-relaxed text-ink2">
              <b className="font-bold text-ink">{s.title}</b>
              <br />
              {s.body}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
