import { Mascot } from '@/components/Mascot';
import { ModeChoice } from '@/components/ModeChoice';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-10">
      <header className="anim-rise">
        <h1 className="text-[30px] font-bold leading-[1.25] tracking-tight">
          존버를 이길 수<br />있을까?
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink2">
          종목도 시기도 가린 차트를 한 봉씩 넘기며 매매해요.
          <br />
          끝나면 그냥 들고 있었을 때와 비교해드릴게요.
        </p>
      </header>

      <div className="anim-pop mt-7 flex justify-center" style={{ animationDelay: '80ms' }}>
        <div className="flex items-end gap-1">
          <Mascot mood="worried" tone="down" size={54} className="anim-bob" />
          <Mascot mood="party" tone="up" size={82} className="anim-bob" />
          <Mascot mood="neutral" tone="flat" size={48} className="anim-bob" />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-2">
        <Fact top="100만" bottom="시작 자금" />
        <Fact top="30턴" bottom="한 판 2분" />
        <Fact top="0.05%" bottom="거래 수수료" />
      </div>

      <section className="anim-rise mt-3 rounded-card bg-card p-5" style={{ animationDelay: '150ms' }}>
        <h2 className="text-[15px] font-bold">규칙은 세 개예요</h2>
        <ol className="mt-3 space-y-2.5 text-[14px] leading-relaxed text-ink2">
          <Rule n={1}>매 턴 <b className="text-up">매수</b> · 관망 · <b className="text-down">매도</b> 중 하나를 골라요</Rule>
          <Rule n={2}>주문은 <b>다음 봉 시가</b>에 체결돼요</Rule>
          </ol>

        {/*
          3번은 조작법이 아니라 이 게임의 목표다. 1·2번과 같은 무게로 나열하면
          굵게 처리해도 묻힌다. 번호는 유지해서 '세 개'라는 말은 그대로 맞게 두고,
          카드로 띄워 위계만 올린다. 민트는 매수(빨강)·매도(파랑)와 의미가 겹치지 않는
          유일한 색이라 여기 쓴다.
        */}
        {/*
          -mx-3 과 p-3 은 같은 값이어야 한다. 그래야 밴드가 좌우로 12px 나가고
          안쪽 여백이 그만큼 되밀어서, 3번 숫자가 1·2번과 같은 x에 선다.
          한쪽만 바꾸면 번호 열이 어긋난다.
        */}
        <div className="-mx-3 mt-2.5 flex gap-2.5 rounded-2xl bg-mintweak p-3">
          <span className="mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-mint text-[11px] font-bold text-white">
            3
          </span>
          <span className="text-[14px] leading-relaxed text-ink2">
            점수는 수익률이 아니라 <b className="font-bold text-ink">존버보다 얼마나 잘했나</b>예요
          </span>
        </div>
        {/* 규칙이 아니라 완주 동기. 목록에 넣으면 4개가 되어 덜 읽힌다 */}
        <p className="mt-3.5 border-t border-line pt-3 text-[13px] text-ink3">
          끝나면 어느 종목의 언제였는지 알려드려요.
        </p>
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

function Fact({ top, bottom }: { top: string; bottom: string }) {
  return (
    <div className="rounded-2xl bg-card px-3 py-3.5 text-center">
      <div className="text-[17px] font-bold tracking-tight">{top}</div>
      <div className="mt-0.5 text-[11px] font-medium text-ink3">{bottom}</div>
    </div>
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
