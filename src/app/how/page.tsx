import Link from 'next/link';
import { TopBar } from '@/components/TopBar';
import {
  CompareIllust,
  PickIllust,
  PredictIllust,
  RevealIllust,
} from '@/components/illust';

export const metadata = { title: '게임 방법 — 살껄팔껄' };

/**
 * 게임 방법.
 *
 * 예전에는 실제 플레이 화면을 재현해놓고 번호 핀 일곱 개와 설명 일곱 줄을
 * 달았다. 정확했지만 읽을 게 너무 많았다 — "텍스트라 읽기 불편하다"는
 * 얘기가 나온 자리가 여기다.
 *
 * 그래서 한 판의 흐름을 네 장면으로 자르고, 장면마다 그림 하나와 한 줄만
 * 둔다. 화면 어디에 무엇이 있는지는 이제 첫 진입 안내와 '?' 도움말이
 * 실제 화면 위에서 알려주므로, 이 페이지는 "무슨 일이 벌어지는가"만 맡는다.
 */

const STEPS = [
  {
    n: 1,
    title: '다음이 오를지 내릴지 가늠해요',
    body: '점선 칸이 아직 안 열린 다음 칸이에요. 어떻게 될지는 아무도 몰라요.',
    Illust: PredictIllust,
  },
  {
    n: 2,
    title: '매수 · 관망 · 매도 중 하나를 골라요',
    body: '사기 · 그대로 두기 · 팔기예요. 살 때도 팔 때도 늘 전 재산이 오가요.',
    Illust: PickIllust,
  },
  {
    n: 3,
    title: '다음 칸이 열려요',
    body: '누른 즉시가 아니라 이 칸이 열릴 때 그 값으로 처리돼요.',
    Illust: RevealIllust,
  },
  {
    n: 4,
    title: '30턴 뒤 존버와 비교해요',
    body: '처음에 사서 끝까지 안 판 사람보다 많이 벌면 이겨요.',
    Illust: CompareIllust,
  },
];

export default function HowPage() {
  return (
    <main className="flex flex-1 flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))]">
      <TopBar title="게임 방법" back />

      {/* 상단바에 이미 '게임 방법' 이 있다. 제목을 한 번 더 쓰면 같은 말이 두 번이다 */}
      <ol className="mt-4 space-y-3">
        {STEPS.map(({ n, title, body, Illust }) => (
          <li key={n} className="rounded-card bg-card p-5">
            <div className="text-[11px] font-bold tracking-wider text-ink3">STEP {n}</div>
            <h2 className="mt-1.5 text-[17px] font-bold leading-snug tracking-tight">{title}</h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink2">{body}</p>
            <div className="mt-4 rounded-2xl bg-bg px-4 py-4">
              <Illust className="mx-auto block h-auto w-full max-w-[250px]" />
            </div>
          </li>
        ))}
      </ol>

      <Link
        href="/play?mode=endless"
        className="pressable mt-7 flex h-[58px] items-center justify-center rounded-btn bg-brand text-[17px] font-bold text-white"
      >
        해보기
      </Link>
      <p className="mt-2.5 text-center text-[12px] text-ink3">
        무한 모드는 로그인 없이 몇 판이든 할 수 있어요.
      </p>
    </main>
  );
}
