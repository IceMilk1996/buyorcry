import Link from 'next/link';
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
          무슨 회사인지, 언제인지 가려둔 차트예요.
          <br />
          <b className="font-bold text-ink">오를지 내릴지</b> 맞혀보세요.
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
      <section className="anim-rise mt-8 rounded-card bg-card p-5" style={{ animationDelay: '150ms' }}>
        {/*
          규칙을 기계 동작으로 나열하면(무엇을 누르면 언제 처리되고…) 정작
          "그래서 내가 뭘 하는 게임인가"를 아무도 말해주지 않는다. 두 줄이면
          된다 — 무엇을 하는가, 어떻게 채점되는가. 체결 시점 같은 세부는
          액션바에 상시로 적혀 있고 첫 안내가 짚어주므로 여기서 뺀다.
        */}
        <h2 className="text-[15px] font-bold">이렇게 해요</h2>
        <ol className="mt-3 text-[14px] leading-relaxed text-ink2">
          <Rule n={1}>
            차트를 보고 <b className="font-bold text-ink">오를지 내릴지</b> 예측해서{' '}
            <b className="text-up">매수</b> · 관망 · <b className="text-down">매도</b> 중 하나를
            골라요
            <span className="mt-1 block text-[12.5px] text-ink3">
              사기 · 그대로 두기 · 팔기예요
            </span>
          </Rule>
        </ol>

        {/*
          2번은 조작법이 아니라 이 게임의 채점 방식이다. 1번과 같은 무게로
          나열하면 굵게 처리해도 묻힌다. 카드로 띄워 위계만 올린다.
          민트는 매수(빨강)·매도(파랑)와 의미가 겹치지 않는 유일한 색이다.

          -mx-3 과 p-3 은 같은 값이어야 한다. 그래야 밴드가 좌우로 12px 나가고
          안쪽 여백이 그만큼 되밀어서, 2번 숫자가 1번과 같은 x에 선다.
        */}
        <div className="-mx-3 mt-2.5 flex gap-2.5 rounded-2xl bg-mintweak p-3">
          <span className="mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-mint text-[11px] font-bold text-white">
            2
          </span>
          <span className="text-[14px] leading-relaxed text-ink2">
            30턴이 끝나면 <b className="font-bold text-ink">그냥 사두고 끝까지 안 판 것</b>과
            비교해요. 그것보다 많이 벌면 이겨요
            {/* 개념을 먼저 말하고 이름을 나중에 붙인다. 반대로 하면 이름이 벽이 된다 */}
            <span className="mt-1 block text-[12.5px] text-ink3">
              이 상대를 <b className="font-semibold text-ink2">존버</b>라고 불러요
            </span>
          </span>
        </div>

        <p className="mt-3.5 border-t border-line pt-3 text-[13px] text-ink3">
          게임이 종료되면 주식명이 공개돼요.
        </p>
        {/*
          규칙(무엇을 하는가)과 화면 설명(어디를 봐야 하나)은 성격이 달라서
          카드를 나누지 않고 여기서 링크로만 잇는다. 홈에서 설명을 두 뭉치로
          쌓으면 시작 버튼이 그만큼 밑으로 밀린다.
        */}
        <Link
          href="/how"
          className="pressable -mx-2 mt-1.5 flex items-center justify-between rounded-xl px-2 py-2"
        >
          <span className="text-[13px] font-semibold text-brand">게임 화면 보는 법</span>
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
