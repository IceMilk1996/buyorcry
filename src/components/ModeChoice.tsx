'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCountdown, secondsUntilTomorrow } from '@/lib/client/daily';

type Me = {
  user: { id: string; nick: string | null } | null;
  kakaoReady: boolean;
  devLogin: boolean;
  today: {
    standing: { place: number; total: number; percentile: number };
    rankLabel: string;
  } | null;
};

/**
 * 모드 선택.
 *
 * 오늘의 챌린지는 순위가 매겨지므로 로그인이 필요하다.
 * 다만 첫 화면 전체를 로그인 벽으로 두지는 않는다 — 게임이 재밌는지도 모르는데
 * 로그인부터 시키면 그 화면에서 잃는다. 무한 모드로 먼저 맛보게 한다.
 */
export function ModeChoice() {
  const [me, setMe] = useState<Me | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [loginFail, setLoginFail] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setMe(await (await fetch('/api/auth/me')).json());
    } catch {
      setMe({ user: null, kakaoReady: false, devLogin: false, today: null });
    }
  }, []);

  /*
   * 로그인이 실패하면 카카오 콜백이 /?login=fail&at=... 로 돌려보낸다.
   * 이걸 화면에 안 띄우면 "눌렀는데 그대로네" 만 남고 원인을 알 수가 없다.
   * 실제로 클라이언트 시크릿 때문에 토큰 발급이 막혔을 때 이걸로 한참 헤맸다.
   */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('login') === 'fail') {
      setLoginFail(q.get('at') ?? 'unknown');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    void load();
    setLeft(secondsUntilTomorrow());
    const t = setInterval(() => setLeft(secondsUntilTomorrow()), 1000);
    return () => clearInterval(t);
  }, [load]);

  const endless = (
    <Link
      href="/play?mode=endless"
      className="pressable flex items-center justify-between rounded-btn bg-card px-5 py-4"
    >
      <span className="flex flex-col items-start">
        <span className="text-[16px] font-bold text-ink">
          {me?.user ? '무한 모드' : '로그인 없이 둘러보기'}
        </span>
        <span className="mt-0.5 text-[12px] font-medium text-ink3">아무 때나, 몇 판이든</span>
      </span>
      <span className="text-[18px] font-bold text-ink3">→</span>
    </Link>
  );

  if (!me) return <div className="h-[152px] animate-pulse rounded-btn bg-card/60" />;


  // 이미 오늘 몫을 썼다
  if (me.today) {
    const s = me.today.standing;
    return (
      <div className="flex flex-col gap-2">
        <div className="rounded-card bg-card p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-[15px] font-bold">오늘의 챌린지 완료</span>
            <span className="text-[13px] font-semibold text-ink3">{me.today.rankLabel}</span>
          </div>
          <p className="mt-1.5 text-[13px] text-ink3">
            {s.total.toLocaleString('ko-KR')}명 중 {s.place.toLocaleString('ko-KR')}등 · 상위{' '}
            {s.percentile}%
          </p>
          <p className="mt-3 text-[13px] text-ink3">
            다음 문제까지{' '}
            <span className="font-bold tracking-tight text-ink2">
              {left === null ? '--:--:--' : formatCountdown(left)}
            </span>
          </p>
        </div>
        {endless}
      </div>
    );
  }

  // 로그인 완료 — 시작은 사용자가 직접 누른다
  if (me.user) {
    return (
      <div className="flex flex-col gap-2">
        <Link
          href="/play?mode=daily"
          className="pressable flex items-center justify-between rounded-btn bg-brand px-5 py-4 text-white"
        >
          <span className="flex flex-col items-start">
            <span className="text-[17px] font-bold">오늘의 챌린지</span>
            <span className="mt-0.5 text-[12px] font-medium opacity-80">
              모두 같은 차트 · 하루 한 판
            </span>
          </span>
          <span className="text-[18px] font-bold opacity-70">→</span>
        </Link>
        {endless}
      </div>
    );
  }

  // 비로그인
  return (
    <div className="flex flex-col gap-2">
      {loginFail && (
        <div className="rounded-btn bg-card px-5 py-4 text-center text-[13px] leading-relaxed text-up">
          로그인을 마치지 못했어요. 다시 시도해 주세요.
          <br />
          <span className="text-[11px] text-ink3">({loginFail})</span>
        </div>
      )}
      {me.kakaoReady ? (
        <a
          href="/api/auth/kakao"
          className="pressable flex h-[58px] items-center justify-center gap-2 rounded-btn bg-[#FEE500] text-[17px] font-bold text-[#191600]"
        >
          <KakaoMark />
          카카오로 시작하기
        </a>
      ) : me.devLogin ? (
        <button
          type="button"
          onClick={async () => {
            await fetch('/api/auth/dev', { method: 'POST' });
            await load();
          }}
          className="pressable flex h-[58px] items-center justify-center rounded-btn bg-ink text-[16px] font-bold text-card"
        >
          임시 로그인 (개발용)
        </button>
      ) : (
        <div className="rounded-btn bg-card px-5 py-4 text-center text-[13px] leading-relaxed text-ink3">
          카카오 로그인이 아직 연결되지 않았어요
        </div>
      )}

      <p className="px-1 text-center text-[12px] leading-relaxed text-ink3">
        오늘의 챌린지는 순위가 매겨져서 로그인이 필요해요.
        <br />
        받아오는 정보는 회원번호뿐이에요.
      </p>

      <div className="mt-1">{endless}</div>
    </div>
  );
}

function KakaoMark() {
  return (
    <svg width="19" height="18" viewBox="0 0 19 18" fill="none" aria-hidden>
      <path
        d="M9.5 1C4.81 1 1 4.02 1 7.74c0 2.4 1.6 4.5 4 5.69-.18.63-.64 2.3-.73 2.66-.12.44.16.44.34.32.14-.09 2.24-1.52 3.15-2.14.57.08 1.15.13 1.74.13 4.69 0 8.5-3.02 8.5-6.74S14.19 1 9.5 1Z"
        fill="#191600"
      />
    </svg>
  );
}
