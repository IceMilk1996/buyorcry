import Link from 'next/link';
import { DailyPreview } from '@/components/DailyPreview';
import { ModeChoice } from '@/components/ModeChoice';
import { NickPrompt } from '@/components/NickPrompt';
import { TopBar } from '@/components/TopBar';

/**
 * 진입 화면.
 *
 * 첫 화면이 설명뿐이라 "칙칙하고 흥미가 안 생긴다" 는 얘기를 들었다.
 * 규칙을 세 줄로 나눠 적고 줄마다 그림까지 붙였는데도 그랬다 — 잘 읽히는
 * 설명과 하고 싶어지는 화면은 다른 문제였다.
 *
 * 그래서 역할을 나눈다. **첫 화면은 호기심만 맡는다.** 오늘 실제로 풀
 * 차트를 그려서 "이 다음은 어떻게 될까" 를 묻는 게 전부다. 규칙 설명은
 * '게임 방법 보기' 와 게임 시작 직후의 첫 안내가 맡는다 — 그 둘은 이미
 * 튼튼해졌으니 여기서 같은 말을 세 번 할 이유가 없다.
 *
 * 남기는 설명은 딱 둘이다. 제목 밑 한 줄(무슨 게임인지)과 전 재산 룰
 * (제일 자주 놀라는 지점이라 시작 전에 말해줘야 한다).
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
      <TopBar brand />

      {/* 로그인 직후 한 번. 주소에 표가 없으면 아무것도 그리지 않는다 */}
      <NickPrompt />

      <header className="anim-rise mt-3">
        <h1 className="text-[30px] font-extrabold leading-[1.15] tracking-[-0.01em]">
          그때 살껄,
          <br />
          그때 팔껄!
        </h1>
        <p className="mt-2 text-[14px] font-medium leading-relaxed text-ink2">
          가려진 차트를 보고 다음 칸을 맞혀요.
        </p>
      </header>

      {/*
        남는 세로 공간을 한자리에 몰지 않고 위아래로 나눈다. 아래쪽을 더
        크게 잡아서 시작 버튼은 계속 엄지 쪽에 남긴다.
      */}
      <div className="flex-[0.85]" />

      <div className="mt-5">
        <DailyPreview />
      </div>

      {/*
        전 재산 룰만 남긴다. 사고팔 때 절반이 없다는 건 실제로 사람들이
        제일 자주 놀라는 지점이라, 시작 전에 한 번은 말해줘야 한다.

        노란 경고 톤이었는데 무채색으로 바꿨다. 화면에 색이 초록·빨강·파랑
        셋뿐이어야 하는데 노랑이 넷째로 끼어 있었고, 그렇다고 이게 위험을
        경고하는 것도 아니다 — 그냥 규칙이다.
      */}
      <div className="mt-2.5 flex items-center gap-2.5 rounded-btn border border-line px-3.5 py-2.5">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="var(--color-ink3)"
          strokeWidth="1.7"
          strokeLinecap="round"
          aria-hidden
          className="shrink-0"
        >
          <circle cx="8" cy="8" r="6.3" />
          <path d="M8 5v3.6M8 11.1v.1" />
        </svg>
        <p className="text-[12.5px] font-semibold leading-snug text-ink2">
          살 때도 팔 때도 <span className="font-bold text-ink">늘 전 재산</span>이 오가요
        </p>
      </div>

      {/*
        행동이 아니라 설명이라 빈 칸 위쪽(설명 덩어리)에 붙여 둔다. 아래 두
        버튼과 한 줄로 서면 "세 개 중 뭘 눌러야 하지" 가 된다.
      */}
      <Link
        href="/how"
        className="pressable mt-2.5 flex h-[46px] items-center justify-center gap-1.5 rounded-btn bg-brandweak text-[14px] font-bold text-accent"
      >
        게임 방법 보기
        <span aria-hidden>→</span>
      </Link>

      <div className="flex-1" />

      <div className="mt-5">
        <ModeChoice />
      </div>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-ink3">
        실제 과거 시세로 만든 게임이에요. 투자 조언이 아니에요.
      </p>
    </main>
  );
}
