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
          차트를 한 칸씩 넘기면서 사고팔아요.
          <br />
          그냥 사두고 <b className="font-bold text-ink">가만히 있는 것</b>보다 잘하면 이겨요.
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
          <Rule n={1}>
            매 턴 <b className="text-up">매수</b>(사기) · 관망(그대로) ·{' '}
            <b className="text-down">매도</b>(팔기) 중 하나를 골라요
          </Rule>
          <Rule n={2}>
            지금 누르면 바로 안 돼요. <b>다음 칸이 열릴 때 그 값으로</b> 처리돼요
          </Rule>
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
            상대는 <b className="font-bold text-ink">처음에 사서 끝까지 안 판 사람</b>이에요.
            그 사람보다 많이 벌면 이겨요
            {/* 개념을 먼저 말하고 이름을 나중에 붙인다. 반대로 하면 이름이 벽이 된다 */}
            <span className="mt-1 block text-[12.5px] text-ink3">
              이 상대를 <b className="font-semibold text-ink2">존버</b>라고 불러요
            </span>
          </span>
        </div>
        {/* 규칙이 아니라 완주 동기. 목록에 넣으면 4개가 되어 덜 읽힌다 */}
        <p className="mt-3.5 border-t border-line pt-3 text-[13px] text-ink3">
          무슨 회사의 언제였는지는 끝나면 알려드려요.
        </p>
        {/*
          규칙(무슨 게임인가)과 화면 설명(어디를 봐야 하나)은 성격이 달라서
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
