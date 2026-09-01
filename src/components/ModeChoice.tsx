'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCountdown, secondsUntilTomorrow } from '@/lib/client/daily';

type Me = {
  user: { id: string; nick: string | null } | null;
  loginReady: boolean;
  devLogin: boolean;
  today: {
    standing: { place: number; total: number; percentile: number | null };
    rankLabel: string;
    shareId: string | null;
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
  /** 비로그인 상태에서 오늘의 챌린지를 눌렀을 때 올라오는 안내 */
  const [ask, setAsk] = useState(false);

  /*
   * 못 불러온 것과 '카카오가 아직 연결 안 됨' 은 다른 상태다.
   * 예전에는 실패해도 loginReady:false 로 덮어써서, 네트워크가 끊겼을 뿐인데
   * "카카오 로그인이 아직 연결되지 않았어요" 라는 엉뚱한 진단이 떴다.
   */
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error(String(res.status));
      setMe(await res.json());
      setLoadFailed(false);
    } catch {
      setMe({ user: null, loginReady: false, devLogin: false, today: null });
      setLoadFailed(true);
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

  /*
   * '둘러보기' 가 아니라 '연습 게임' 이다. 실제로는 무제한으로 할 수 있는
   * 판인데 구경하는 것처럼 들려서, 하고 싶은 사람이 안 눌렀다.
   * 채워진 버튼이 아니라 테두리만 둬서 오늘의 챌린지와 위계를 나눈다.
   */
  const endless = (
    <Link
      href="/play?mode=endless"
      className="pressable flex min-h-[54px] items-center justify-between gap-3 rounded-btn border border-line px-[18px] py-3"
    >
      <span className="flex flex-col items-start gap-0.5">
        <span className="text-[15px] font-bold tracking-tight text-ink">연습 게임</span>
        <span className="text-[11.5px] font-semibold text-ink3">
          기록에 안 남아요 · 아무 때나, 몇 판이든
        </span>
      </span>
      <span className="shrink-0 text-[17px] font-bold text-ink3">→</span>
    </Link>
  );

  if (!me) return <div className="h-[152px] animate-pulse rounded-btn bg-card/60" />;


  // 이미 오늘 몫을 썼다
  if (me.today) {
    const s = me.today.standing;
    return (
      <div className="flex flex-col gap-2">
        {/*
          카드를 눌러 그날 결과로 갈 수 있어야 한다. 전에는 순위와 남은 시간만
          보여주고 클릭이 안 돼서, 차트가 뭐였는지 다시 보려면 메뉴 →
          마이페이지 → 지난 판까지 세 번 들어가야 했다.
        */}
        <Card href={me.today.shareId ? `/r/${me.today.shareId}` : null}>
          <div className="flex items-baseline justify-between">
            <span className="text-[15px] font-bold">오늘의 챌린지 완료</span>
            <span className="text-[13px] font-semibold text-ink3">{me.today.rankLabel}</span>
          </div>
          <p className="mt-1.5 text-[13px] text-ink3">
            {s.total.toLocaleString('ko-KR')}명 중 {s.place.toLocaleString('ko-KR')}등
            {s.percentile !== null && ` · 상위 ${s.percentile}%`}
          </p>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-[13px] text-ink3">
              다음 문제까지{' '}
              <span className="font-bold tracking-tight text-ink2">
                {left === null ? '--:--:--' : formatCountdown(left)}
              </span>
            </p>
            {me.today.shareId && (
              <span className="text-[13px] font-bold text-accent">결과 다시 보기 →</span>
            )}
          </div>
        </Card>
        {endless}
      </div>
    );
  }

  /*
   * 데일리 카드는 로그인 여부와 상관없이 같은 모양으로, 늘 맨 위에 있다.
   *
   * 전에는 비로그인 화면에 카카오 버튼이 먼저 있고 데일리는 안내 문구로만
   * 존재했다. 그러면 오늘의 챌린지가 있다는 걸 모른 채로 로그인을 요구받는
   * 셈이라, 있는 줄 모르는 것을 원할 수가 없다.
   * 카드를 먼저 보여주고, 누른 다음에 왜 로그인이 필요한지 설명한다.
   */
  const dailyCard = (onClick?: () => void) => {
    const inner = (
      <>
        <span className="flex flex-col items-start gap-[3px]">
          <span className="text-[17px] font-extrabold tracking-tight">오늘의 챌린지 시작</span>
          <span className="text-[11.5px] font-semibold opacity-75">
            모두 같은 차트 · 하루 한 판
          </span>
        </span>
        <span className="shrink-0 text-[18px] font-bold opacity-80">→</span>
      </>
    );
    const cls =
      'pressable flex min-h-[62px] w-full items-center justify-between gap-3 rounded-btn bg-brand px-[18px] py-3.5 text-left text-white';
    return onClick ? (
      <button type="button" onClick={onClick} className={cls}>
        {inner}
      </button>
    ) : (
      <Link href="/play?mode=daily" className={cls}>
        {inner}
      </Link>
    );
  };

  // 로그인 완료 — 시작은 사용자가 직접 누른다
  if (me.user) {
    return (
      <div className="flex flex-col gap-2">
        {dailyCard()}
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

      {dailyCard(() => setAsk(true))}
      {endless}

      {ask && (
        <div className="fixed inset-0 z-50 flex justify-center" onClick={() => setAsk(false)}>
          <div className="absolute inset-0 bg-black/35" />
          <div
            className="anim-rise absolute bottom-0 w-full max-w-[480px] rounded-t-card bg-card px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto h-1 w-9 rounded-full bg-line" />

            <h2 className="mt-5 text-[19px] font-bold leading-snug">
              오늘의 챌린지는
              <br />
              로그인이 필요해요
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink2">
              모두 같은 차트를 풀고 순위를 매기거든요. 하루 한 판만 셀 수 있어야
              해서 누구인지 알아야 해요.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink3">
              받아오는 정보는 <b className="font-semibold text-ink2">회원번호</b> 하나뿐이에요.
              이름도 이메일도 받지 않아요.
            </p>

            <div className="mt-5 flex flex-col gap-2">
              {me.loginReady ? (
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
                    setAsk(false);
                    await load();
                  }}
                  className="pressable flex h-[58px] items-center justify-center rounded-btn bg-ink text-[16px] font-bold text-card"
                >
                  임시 로그인 (개발용)
                </button>
              ) : (
                <div className="rounded-btn bg-bg px-5 py-4 text-center text-[13px] leading-relaxed text-ink3">
                  {loadFailed
                    ? '지금은 로그인 상태를 확인할 수 없어요. 잠시 뒤에 다시 눌러주세요'
                    : '카카오 로그인이 아직 연결되지 않았어요'}
                </div>
              )}

              {/* 위 버튼과 높이를 맞춘다. 나란히 선 두 버튼은 크기가 다르면 눈에 걸린다 */}
              <Link
                href="/play?mode=endless"
                className="pressable flex h-[58px] items-center justify-center rounded-btn bg-bg text-[15px] font-bold text-ink2"
              >
                로그인 없이 무한 모드로
              </Link>
            </div>
          </div>
        </div>
      )}
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

/** 링크가 있으면 누를 수 있는 카드로, 없으면 그냥 카드로 */
function Card({ href, children }: { href: string | null; children: React.ReactNode }) {
  const cls = 'block rounded-card bg-card p-5';
  return href ? (
    <Link href={href} className={`pressable ${cls}`}>
      {children}
    </Link>
  ) : (
    <div className={cls}>{children}</div>
  );
}
