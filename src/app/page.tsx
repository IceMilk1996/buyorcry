import Link from 'next/link';
import { CompareIllust, PredictIllust } from '@/components/illust';
import { Mascot } from '@/components/Mascot';
import { ModeChoice } from '@/components/ModeChoice';
import { TopBar } from '@/components/TopBar';
import { Logo } from '@/components/Logo';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
      <TopBar />
      <header className="anim-rise mt-4">
        <div className="flex items-center gap-2.5">
          <Logo size={38} className="text-mint" />
          <h1 className="text-[38px] font-bold leading-[1.15] tracking-tight">살껄팔껄!</h1>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-ink2">
          종목을 가린 차트의 <b className="font-bold text-ink">주가를 예측</b>하여 맞혀보세요.
        </p>
      </header>

      <div className="anim-pop mt-7 flex justify-center" style={{ animationDelay: '80ms' }}>
        <div className="flex items-end gap-1">
          <Mascot mood="worried" tone="down" size={54} className="anim-bob" />
          <Mascot mood="party" tone="up" size={82} className="anim-bob" />
          <Mascot mood="neutral" tone="flat" size={48} className="anim-bob" />
        </div>
      </div>

      {/*
        숫자 카드(100만 · 30턴 · 0.05%)를 뺐다. 셋 다 여기 있을 이유가 없다 —
        시작 자금은 게임 화면 맨 위에 크게 떠 있고, 30턴은 아래 2번에 이미
        적혀 있고, 수수료는 처음 온 사람이 알 필요가 없다(결과 화면에
        '수수료 포함'이 적힌다). 첫 화면에서 설명보다 위에 숫자가 있으면
        "이게 뭐 하는 건지"보다 "얼마짜리인지"를 먼저 읽게 된다.
      */}
      {/*
        숫자 카드(100만 · 30턴 · 0.05%)를 뺐다. 셋 다 여기 있을 이유가 없다 —
        시작 자금은 게임 화면 맨 위에 크게 떠 있고, 30턴은 아래 2번에 이미
        적혀 있고, 수수료는 처음 온 사람이 알 필요가 없다.
      */}
      {/*
        두 줄 다 그림을 앞에 세운다. 글만 있으면 "읽어야 할 것" 으로 보여서
        건너뛰는데, 왼쪽에 그림이 서면 훑기만 해도 무슨 게임인지 들어온다.
        그림은 /how 의 STEP 과 같은 파일을 쓴다 — 두 군데에 따로 그리면
        한쪽만 고쳐지고 서로 다른 게임을 설명하기 시작한다.
      */}
      <section className="anim-rise mt-8 rounded-card bg-card p-5" style={{ animationDelay: '150ms' }}>
        <h2 className="text-[15px] font-bold">이렇게 해요</h2>

        <div className="mt-4 flex items-center gap-3">
          <PredictIllust className="h-[60px] w-[94px] shrink-0" />
          <p className="text-[14px] leading-relaxed text-ink2">
            차트를 보고 <b className="font-bold text-ink">오를지 내릴지</b> 예측해서{' '}
            <b className="text-up">매수</b> · 관망 · <b className="text-down">매도</b>를 골라요
          </p>
        </div>

        {/*
          두 줄을 같은 모양으로 둔다. 예전에는 두 번째만 민트 밴드로 띄워
          "이게 채점 기준" 이라는 위계를 줬는데, 줄이 둘뿐이면 그 위계가
          도움이 되기보다 화면만 얼룩덜룩해진다.
        */}
        <div className="mt-3 flex items-center gap-3">
          <CompareIllust className="h-[60px] w-[94px] shrink-0" />
          <p className="text-[14px] leading-relaxed text-ink2">
            30턴 종료 후 <b className="font-bold text-ink">존버</b>했을 경우와 비교해요
          </p>
        </div>

        <p className="mt-3.5 border-t border-line pt-3 text-[13px] text-ink3">
          게임이 종료되면 주식명이 공개돼요.
        </p>
        <Link
          href="/how"
          className="pressable -mx-2 mt-1.5 flex items-center justify-between rounded-xl px-2 py-2"
        >
          <span className="text-[13px] font-semibold text-brand">게임 방법 자세히 보기</span>
          <span className="text-[13px] font-bold text-brand">→</span>
        </Link>
      </section>

      <div className="flex-1" />

      <div className="mt-6">
        <ModeChoice />
      </div>
      <p className="mt-3 text-center text-[12px] leading-relaxed text-ink3">
        실제 과거 시세로 만든 게임이에요. 투자 조언이 아니에요.
      </p>
    </main>
  );
}
