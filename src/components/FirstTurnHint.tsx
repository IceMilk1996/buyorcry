'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';

const KEY = 'buyorcry:seen-hint';

/**
 * 첫 판 첫 턴에 한 번만 뜨는 안내.
 *
 * 시작 전에 막아 세우지 않는 게 핵심이다. 홈에서 "해보기"를 누른 사람은
 * 이미 하고 싶어진 상태라, 그 앞에 설명을 세우면 이탈만 는다. 대신 화면이
 * 다 그려진 뒤에 올려서 *지금 보이는 것*을 가리키게 한다.
 *
 * 뒤에 판이 비쳐야 하므로 불투명하게 덮지 않는다. 그리고 다시는 안 뜬다 —
 * 매번 뜨는 안내는 두 번째부터는 그냥 장애물이다.
 */
export function FirstTurnHint() {
  /*
   * 서버에는 localStorage 가 없다. useSyncExternalStore 로 읽으면
   * 첫 렌더(=서버 스냅샷)는 '이미 봤다'로 두고, 하이드레이션이 끝난 뒤에
   * 진짜 값으로 다시 그린다. useEffect 안에서 setState 하는 것과 결과는
   * 같지만 하이드레이션 불일치도, 연쇄 렌더도 없다.
   */
  const seen = useSyncExternalStore(
    // 이 값은 우리가 닫을 때 말고는 바뀌지 않는다. 구독할 외부 변화가 없다
    () => () => {},
    () => {
      try {
        return localStorage.getItem(KEY) != null;
      } catch {
        return true; // 시크릿 모드 등에서 막히면 그냥 안 띄운다
      }
    },
    () => true,
  );
  const [dismissed, setDismissed] = useState(false);
  const show = !seen && !dismissed;

  if (!show) return null;

  const close = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* 저장이 막혀도 이번 판에서는 닫혀야 한다 */
    }
    setDismissed(true);
  };

  return (
    /*
     * 액션바 높이만큼 띄운다. 시트로 버튼까지 덮어버리면 "매수·매도" 얘기를
     * 하는 동안 정작 그 버튼이 안 보인다. 어둡게 깔린 채로 보이는 편이,
     * 안내를 닫자마자 어디를 눌러야 하는지 이미 알고 있게 만든다.
     */
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/45 px-4 pb-[calc(104px+max(16px,env(safe-area-inset-bottom)))]">
      <div className="anim-rise rounded-card bg-card p-5">
        <h2 className="text-[19px] font-bold tracking-tight">처음이시죠?</h2>
        <ul className="mt-3.5 space-y-2.5 text-[14px] leading-relaxed text-ink2">
          <Li>
            점선 자리가 <b className="font-bold text-ink">다음에 열릴 봉</b>이에요. 주문은 거기 시가에
            체결돼요
          </Li>
          <Li>
            매수 · 매도는 늘 <b className="font-bold text-ink">전량</b>이에요
          </Li>
          <Li>
            점수는 수익률이 아니라 <b className="font-bold text-ink">존버보다 얼마나 잘했나</b>예요
          </Li>
        </ul>

        <button
          type="button"
          onClick={close}
          className="pressable mt-5 flex h-[54px] w-full items-center justify-center rounded-btn bg-brand text-[17px] font-bold text-white"
        >
          시작할게요
        </button>
        {/*
          아직 한 턴도 안 눌렀을 때만 뜨는 안내라, 여기서 나가도 잃는 게 없다.
          그래서 자세한 설명으로 빠져나가는 길을 열어둘 수 있다.
        */}
        <Link
          href="/how"
          className="mt-3 block text-center text-[13px] font-semibold text-ink3 underline underline-offset-4"
        >
          화면 보는 법 먼저 볼래요
        </Link>
      </div>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-brand" />
      <span>{children}</span>
    </li>
  );
}
