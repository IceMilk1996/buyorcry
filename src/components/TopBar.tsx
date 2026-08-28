'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * 상단바와 메뉴.
 *
 * 플레이 화면에는 넣지 않는다 — 거기는 스크롤 없이 한 화면에 들어가야 해서
 * 세로 공간을 한 줄도 더 쓸 수 없다(기획서 8장).
 */
export function TopBar({ title, back }: { title?: string; back?: boolean }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loginReady, setLoginReady] = useState(false);
  /** 못 불러온 것과 '아직 연결 안 됨' 을 구분한다 (ModeChoice 와 같은 이유) */
  const [loadFailed, setLoadFailed] = useState(false);

  /*
   * 열 때마다 다시 읽는다.
   * 마운트할 때 한 번만 읽으면, 같은 페이지에서 로그인한 경우(홈의 로그인
   * 시트처럼 새로고침 없이 상태가 바뀌는 경우) 메뉴만 비로그인으로 남는다.
   */
  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error(String(res.status));
        const me = await res.json();
        setUser(me.user);
        setLoginReady(Boolean(me.loginReady));
        setLoadFailed(false);
      } catch {
        setLoadFailed(true);
        /* 메뉴는 부가 기능이라 실패해도 화면을 막지 않는다 */
      }
    })();
  }, [open]);

  // 메뉴가 열린 동안 뒤 배경이 따라 움직이면 시트가 떠 있는 느낌이 깨진다
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <div className="flex h-12 shrink-0 items-center justify-between">
        {/*
          홈이 아닌 화면에는 돌아갈 길이 있어야 한다. 메뉴에서 '홈' 을 뺐기
          때문에, 이게 없으면 마이페이지가 브라우저 뒤로가기 말고는 나갈 수
          없는 막다른 길이 된다. 메뉴 항목이 아니라 뒤로 버튼으로 두는 이유는
          같은 길을 두 번 만들지 않기 위해서다.
        */}
        {back ? (
          <Link
            href="/"
            aria-label="홈으로"
            className="pressable -ml-2 flex h-10 items-center gap-1.5 rounded-full pl-2 pr-3"
          >
            <span className="text-[17px] font-bold leading-none text-ink2">←</span>
            <span className="text-[15px] font-bold text-ink2">{title ?? '홈'}</span>
          </Link>
        ) : (
          <span className="text-[15px] font-bold text-ink2">{title ?? ''}</span>
        )}
        <button
          type="button"
          aria-label="메뉴"
          onClick={() => setOpen(true)}
          className="pressable -mr-2 flex h-10 w-10 items-center justify-center rounded-full"
        >
          <span className="flex flex-col gap-[5px]">
            <Bar />
            <Bar />
            <Bar />
          </span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/35" />
          <div
            className="anim-rise absolute bottom-0 w-full max-w-[480px] rounded-t-card bg-card px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto h-1 w-9 rounded-full bg-line" />

            {/*
              홈과 무한 모드는 넣지 않는다. 둘 다 홈 화면에 이미 큰 버튼으로
              있어서, 메뉴에 또 두면 같은 길을 두 번 만드는 셈이다.
              메뉴는 홈에 자리가 없는 것만 맡는다.
            */}
            <nav className="mt-4 flex flex-col">
              {user ? (
                <Item href="/my" onClick={() => setOpen(false)}>
                  마이페이지
                </Item>
              ) : loginReady ? (
                <Item href="/api/auth/kakao">카카오로 로그인</Item>
              ) : (
                <p className="border-b border-line py-5 text-[14px] text-ink3">
                  {loadFailed
                    ? '지금은 로그인 상태를 확인할 수 없어요'
                    : '카카오 로그인이 아직 연결되지 않았어요'}
                </p>
              )}
            </nav>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="pressable mt-2 h-[52px] w-full rounded-btn bg-bg text-[15px] font-bold text-ink2"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Bar() {
  return <span className="block h-[2px] w-[18px] rounded-full bg-ink2" />;
}

function Item({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const cls =
    'pressable flex h-[54px] items-center justify-between border-b border-line text-[16px] font-semibold text-ink';
  const inner = (
    <>
      {children}
      <span className="text-[15px] font-bold text-ink3">→</span>
    </>
  );

  /*
   * /api/* 는 페이지가 아니라서 next/link 로 가면 안 된다.
   * Link 는 클라이언트 이동을 하려고 RSC 페이로드를 먼저 가져오는데,
   * /api/auth/kakao 는 카카오로 넘기는 리다이렉트라 그 요청이 실패한다
   * ("Failed to fetch RSC payload"). 브라우저에게 그냥 이동시켜야 한다.
   */
  if (href.startsWith('/api/')) {
    return (
      <a href={href} onClick={onClick} className={cls}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={cls}>
      {inner}
    </Link>
  );
}
