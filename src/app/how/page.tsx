import { TopBar } from '@/components/TopBar';
import { HowScreen } from '@/components/HowScreen';
import Link from 'next/link';

export const metadata = { title: '게임 화면 보는 법 — 살껄팔껄' };

/**
 * 게임 화면 보는 법.
 *
 * 홈의 "규칙은 세 개예요" 는 *무슨 게임인지*를 알려준다. 이 페이지는
 * *어디를 봐야 하는지*를 알려준다. 성격이 달라서 따로 둔다.
 *
 * 화면은 스크린샷이 아니라 **실제 컴포넌트로 재현**한다. 이미지로 만들면
 * 다크모드가 안 되고, UI 를 고칠 때마다 설명이 조용히 낡는다.
 */
export default function HowPage() {
  return (
    <main className="flex flex-1 flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))]">
      <TopBar title="게임 화면 보는 법" back />

      <h1 className="mt-2 text-[24px] font-bold leading-snug tracking-tight">
        한 봉씩 넘기며
        <br />
        사고팔면 돼요
      </h1>
      <p className="mt-2.5 text-[14px] leading-relaxed text-ink2">
        30턴 동안 매수 · 관망 · 매도 중 하나를 고릅니다.
        <br />
        끝나면 그냥 들고 있었을 때와 비교해드려요.
      </p>

      <HowScreen />

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
