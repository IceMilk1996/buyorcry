import Link from 'next/link';
import { TopBar } from '@/components/TopBar';
import { PredictIllust } from '@/components/illust';

export const metadata = { title: '게임 방법 — 살껄팔껄' };

/**
 * 게임 방법.
 *
 * 한 판의 흐름을 네 단계로 자르고, 단계마다 그림 하나와 한 줄만 둔다.
 * 화면 어디에 무엇이 있는지는 첫 진입 안내와 '?' 도움말이 실제 화면
 * 위에서 알려주므로, 이 페이지는 "무슨 일이 벌어지는가" 만 맡는다.
 *
 * 3단계가 조작법이 아니라 '전 재산' 룰인 것은 의도다. 이 게임에서 제일
 * 자주 놀라는 지점이라 단계 하나를 통째로 준다.
 */

export default function HowPage() {
  return (
    <main className="flex flex-1 flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))]">
      {/* 서브페이지에는 햄버거를 두지 않는다. 여기서 갈 곳은 뒤로뿐이다 */}
      <TopBar title="게임 방법" back menu={false} />

      {/* 몇 단계짜리인지 먼저 알려준다. 끝이 보이면 끝까지 읽는다 */}
      <div className="mt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[14px] font-bold">한 판은 이렇게 흘러가요</span>
          <span className="text-[12px] font-semibold text-ink3">4단계</span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-1 flex-1 rounded-full bg-accent opacity-40" />
          ))}
        </div>
      </div>

      <ol className="mt-4 space-y-3">
        <Step n={1} title="다음이 오를지 내릴지 가늠해요">
          <PredictIllust className="h-auto w-full max-w-[240px]" />
          <Note>
            3연속 상승 뒤 2연속 조정.
            <br />
            다음은 아무도 몰라요.
          </Note>
        </Step>

        {/*
          셋을 같은 크기로 세운다. 하나만 골라진 모양으로 그리면 관망이
          '비활성' 처럼 보이는데, 관망은 중립이지 못 누르는 게 아니다.
          쉬운 말을 밑에 달아서 여기가 용어 사전 노릇을 한다.
        */}
        <Step n={2} title="셋 중 하나를 골라요" panel={false}>
          <div className="flex w-full max-w-[260px] gap-2">
            <Choice label="매수" plain="사기" tone="up" />
            <Choice label="관망" plain="그대로 두기" tone="flat" />
            <Choice label="매도" plain="팔기" tone="down" />
          </div>
        </Step>

        {/*
          여기만 그림이 없다. 현금과 주식 상자를 화살표로 잇는 그림을 그려
          봤는데, 이건 볼 게 없는 규칙이라 그림이 설명을 돕지 못하고 자리만
          차지했다. 한 문장이면 끝나는 내용은 한 문장으로 둔다.
        */}
        <Step n={3} title="사고팔 땐 언제나 전 재산" bare>
          <p className="text-[14px] leading-relaxed text-ink2">
            절반만 사거나 파는 건 없어요. 한 번 고르면 전부 옮겨가요.
          </p>
        </Step>

        <Step n={4} title="30턴 뒤, 안 팔고 버틴 결과와 비교">
          {/* 수치가 있어야 "비교" 가 무슨 뜻인지 한눈에 들어온다 */}
          <div className="w-full max-w-[240px] space-y-2">
            <ResultRow label="내 판단" value="+31%" pct={100} tone="brand" />
            <ResultRow label="존버" value="+12%" pct={39} tone="grey" />
          </div>
          <Note>첫 턴에 사서 끝까지 안 판 경우예요. 예시 수치.</Note>
        </Step>
      </ol>

      <Link
        href="/play?mode=endless"
        className="pressable mt-7 flex h-[58px] items-center justify-center gap-2 rounded-btn bg-brand text-[17px] font-bold text-onbrand"
      >
        한 판 해보면서 익히기
        <span aria-hidden>→</span>
      </Link>
      <p className="mt-2.5 text-center text-[12px] text-ink3">
        게임이 끝나면 어떤 종목이었는지 공개돼요.
      </p>
    </main>
  );
}

function Step({
  n,
  title,
  children,
  bare,
  panel = true,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
  /** 그림이 없는 단계. 빈 회색 판이 남지 않게 안쪽 상자를 통째로 뺀다 */
  bare?: boolean;
  /**
   * 안쪽 배경판을 깔지.
   *
   * 그림에는 판이 있는 게 낫다 — 여백이 정리된다. 하지만 2단계는 안에 든
   * 것이 이미 테두리 있는 상자 세 개라, 판을 또 깔면 상자 안의 상자가 되고
   * 다크모드에서는 그 판이 새까맣게 보인다.
   */
  panel?: boolean;
}) {
  return (
    <li className="rounded-card bg-card p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-brandweak text-[12px] font-bold text-accent">
          {n}
        </span>
        <h2 className="text-[16.5px] font-bold leading-snug tracking-tight">{title}</h2>
      </div>
      {bare ? (
        <div className="mt-2.5">{children}</div>
      ) : (
        <div
          className={`mt-4 flex flex-col items-center gap-3 ${
            panel ? 'rounded-xl bg-bg px-4 py-4' : ''
          }`}
        >
          {children}
        </div>
      )}
    </li>
  );
}

function Choice({
  label,
  plain,
  tone,
}: {
  label: string;
  plain: string;
  tone: 'up' | 'flat' | 'down';
}) {
  const skin =
    tone === 'up'
      ? 'border-up/55 bg-up/12 text-up'
      : tone === 'down'
        ? 'border-down/55 bg-down/12 text-down'
        : 'border-ink3/40 bg-ink3/10 text-ink2';
  return (
    <div className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl border py-2.5 ${skin}`}>
      <span className="text-[14px] font-extrabold tracking-tight">{label}</span>
      <span className="text-[10.5px] font-semibold opacity-80">{plain}</span>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-[13px] leading-relaxed text-ink2">{children}</p>;
}

function ResultRow({
  label,
  value,
  pct,
  tone,
}: {
  label: string;
  value: string;
  pct: number;
  tone: 'brand' | 'grey';
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`w-[46px] shrink-0 text-[12px] font-bold ${tone === 'brand' ? 'text-accent' : 'text-ink3'}`}
      >
        {label}
      </span>
      <span className="h-[14px] flex-1 overflow-hidden rounded-full bg-line">
        <span
          className={`block h-full rounded-full ${tone === 'brand' ? 'bg-brand' : 'bg-ink3 opacity-45'}`}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span
        className={`w-[42px] shrink-0 text-right text-[12.5px] font-bold ${tone === 'brand' ? 'text-accent' : 'text-ink3'}`}
      >
        {value}
      </span>
    </div>
  );
}
