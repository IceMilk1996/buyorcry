'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * 상단바와 메뉴.
 *
 * 플레이 화면에는 넣지 않는다 — 거기는 스크롤 없이 한 화면에 들어가야 해서
 * 세로 공간을 한 줄도 더 쓸 수 없다(기획서 8장).
 */
export function TopBar({ title }: { title?: string }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [kakaoReady, setKakaoReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const me = await (await fetch('/api/auth/me')).json();
        setUser(me.user);
        setKakaoReady(Boolean(me.kakaoReady));
      } catch {
        /* 메뉴는 부가 기능이라 실패해도 화면을 막지 않는다 */
      }
    })();
  }, []);

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
        <span className="text-[15px] font-bold text-ink2">{title ?? ''}</span>
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

            <nav className="mt-4 flex flex-col">
              {user ? (
                <Item href="/my" onClick={() => setOpen(false)}>
                  마이페이지
                </Item>
              ) : kakaoReady ? (
                <Item href="/api/auth/kakao">카카오로 시작하기</Item>
              ) : null}
              <Item href="/play?mode=endless" onClick={() => setOpen(false)}>
                무한 모드
              </Item>
              <Item href="/" onClick={() => setOpen(false)}>
                홈
              </Item>
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
  return (
    <Link
      href={href}
      onClick={onClick}
      className="pressable flex h-[54px] items-center justify-between border-b border-line text-[16px] font-semibold text-ink"
    >
      {children}
      <span className="text-[15px] font-bold text-ink3">→</span>
    </Link>
  );
}
