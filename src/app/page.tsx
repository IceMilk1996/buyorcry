import Link from 'next/link';
import { Mascot } from '@/components/Mascot';
import { ModeChoice } from '@/components/ModeChoice';
import { TopBar } from '@/components/TopBar';

/**
 * 진입 화면.
 *
 * 순서가 곧 위계다 — 무슨 게임인지(제목) → 어떻게 생겼는지(캐릭터) →
 * 뭘 하는지(3줄) → 제일 놀라는 규칙(전 재산) → 시작.
 *
 * 설명이 카드 하나로 뭉쳐 있으면 "읽어야 할 덩어리" 로 보여서 건너뛴다.
 * 줄마다 왼쪽에 그림을 세우면 훑기만 해도 들어온다.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
      <TopBar brand />

      <header className="anim-rise mt-3">
        <h1 className="text-[30px] font-extrabold leading-[1.15] tracking-[-0.035em]">
          그때 살껄,
          <br />
          그때 팔껄!
        </h1>
        <p className="mt-2 text-[14px] font-medium leading-relaxed text-ink2">
          가려진 차트를 보고 다음 칸을 맞혀요.
        </p>
      </header>

      {/* 캐릭터는 분위기 담당이라 자리를 많이 쓰지 않는다 */}
      <div className="anim-pop mt-6 flex justify-center" style={{ animationDelay: '80ms' }}>
        <div className="flex items-end gap-3.5">
          <Mascot mood="worried" tone="down" size={40} className="anim-bob" />
          <Mascot mood="party" tone="up" size={58} className="anim-bob" />
          <Mascot mood="neutral" tone="flat" size={38} className="anim-bob" />
        </div>
      </div>

      <section
        className="anim-rise mt-6 rounded-card border border-line bg-card p-4"
        style={{ animationDelay: '150ms' }}
      >
        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <StepChart />
            <span className="text-[13.5px] font-semibold leading-snug text-ink2">
              다음 칸이 <b className="font-extrabold text-up">오를지</b>{' '}
              <b className="font-extrabold text-down">내릴지</b> 예측하고
            </span>
          </li>
          <li className="flex items-center gap-3">
            <StepButtons />
            <span className="text-[13.5px] font-semibold leading-snug text-ink2">
              매수 · 관망 · 매도 중 하나를 골라요
            </span>
          </li>
          <li className="flex items-center gap-3">
            <StepCompare />
            <span className="text-[13.5px] font-semibold leading-snug text-ink2">
              30턴 뒤, 안 팔고 버틴 결과와 비교해요
            </span>
          </li>
        </ul>
      </section>

      {/*
        전 재산 룰만 따로 띄운다. 규칙 목록에 한 줄로 끼워두면 묻히는데,
        실제로 사람들이 제일 자주 놀라는 지점이라 미리 말해줘야 한다.
      */}
      <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-warn/30 bg-warnweak px-3.5 py-2.5">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-warn)" strokeWidth="1.7" strokeLinecap="round" aria-hidden className="shrink-0">
          <circle cx="8" cy="8" r="6.3" />
          <path d="M8 5v3.6M8 11.1v.1" />
        </svg>
        <p className="text-[12.5px] font-bold leading-snug text-warn">
          살 때도 팔 때도 <span className="font-extrabold">늘 전 재산</span>이 오가요
        </p>
      </div>

      <div className="flex-1" />

      <div className="mt-5">
        <ModeChoice />
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <Link
          href="/how"
          className="pressable border-b border-line pb-0.5 text-[12.5px] font-bold text-ink2"
        >
          게임 방법 보기
        </Link>
        <p className="text-center text-[11px] leading-relaxed text-ink3">
          실제 과거 시세로 만든 게임이에요. 투자 조언이 아니에요.
        </p>
      </div>
    </main>
  );
}

/* ── 3줄 요약의 왼쪽 그림 ──────────────────────────────
   /how 의 큰 그림과 같은 뜻을 46×26 안에서 낸다. 이 크기에서는 캔들
   심지나 글자가 뭉개져서, 형태만 남기고 전부 덜어냈다. */

function StepChart() {
  return (
    <svg width="46" height="26" viewBox="0 0 46 26" className="shrink-0" aria-hidden>
      <rect x="2" y="14" width="5" height="8" rx="1" fill="var(--color-up)" />
      <rect x="11" y="9" width="5" height="9" rx="1" fill="var(--color-up)" />
      <rect x="20" y="6" width="5" height="8" rx="1" fill="var(--color-up)" />
      <rect x="29" y="9" width="5" height="7" rx="1" fill="var(--color-down)" />
      <rect
        x="38.5"
        y="3"
        width="6"
        height="20"
        rx="2"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.4"
        strokeDasharray="2.5 2"
      />
    </svg>
  );
}

function StepButtons() {
  return (
    <span className="flex w-[46px] shrink-0 gap-[3px]">
      <span className="h-[17px] flex-1 rounded border border-up/55 bg-up/15" />
      <span className="h-[17px] flex-1 rounded border border-ink3/45 bg-ink3/12" />
      <span className="h-[17px] flex-1 rounded border border-down/55 bg-down/15" />
    </span>
  );
}

function StepCompare() {
  return (
    <span className="flex w-[46px] shrink-0 flex-col gap-1">
      <span className="h-[7px] rounded-full bg-mint" />
      <span className="h-[7px] w-[55%] rounded-full bg-ink3 opacity-45" />
    </span>
  );
}
