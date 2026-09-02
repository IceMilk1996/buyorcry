'use client';

import { useEffect, useState } from 'react';
import { CandleChart, type Bar } from './CandleChart';
import { Mascot } from './Mascot';

/**
 * 홈에서 보여주는 오늘의 차트 맛보기.
 *
 * 첫 화면이 설명만 하고 있어서 "칙칙하고 흥미가 안 생긴다" 는 얘기를
 * 들었다. 설명을 더 잘 쓰는 걸로는 안 풀리는 문제였다 — 차트 게임인데
 * 첫 화면에 차트가 없었다.
 *
 * 오늘 실제로 풀 차트의 사전공개 구간을 그대로 그린다. 게임을 시작하면
 * 어차피 보이는 구간이라 아무것도 새지 않고, 대신 "이 다음은 어떻게
 * 될까" 라는 이 게임의 질문을 첫 화면이 직접 던진다.
 */
export function DailyPreview() {
  const [bars, setBars] = useState<Bar[] | null>(null);
  const [players, setPlayers] = useState(0);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch('/api/daily/preview');
        const data = await res.json();
        if (!alive) return;
        setBars(Array.isArray(data.candles) ? data.candles : []);
        setPlayers(typeof data.players === 'number' ? data.players : 0);
      } catch {
        if (alive) setBars([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="card-sheen anim-rise rounded-card border border-line bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-ink2">오늘의 차트</span>
        <Mascot mood="neutral" tone="flat" size={32} className="anim-bob" />
      </div>

      {/*
        높이를 미리 잡아둔다. 불러온 뒤에 자리가 생기면 아래 버튼들이
        통째로 밀려서, 누르려던 손가락이 헛짚는다.
      */}
      <div className="mt-1 h-[180px]">
        {bars === null ? (
          <div className="h-full animate-pulse rounded-xl bg-bg" />
        ) : bars.length === 0 ? (
          /* 맛보기는 부가 기능이라 실패해도 조용히 비운다 */
          <div className="h-full" />
        ) : (
          /* 축과 "다음 칸" 은 한 번에 나오고, 봉만 왼쪽부터 순서대로 자란다 */
          <div className="h-full">
            <CandleChart
              bars={bars}
              revealCount={0}
              slots={bars.length + 6}
              markNext
              showFuture={false}
              growIn
            />
          </div>
        )}
      </div>

      <p className="mt-1 text-[12.5px] font-semibold text-ink3">
        {players > 0 ? (
          <>
            오늘 <b className="font-bold text-ink2">{players.toLocaleString('ko-KR')}명</b>이
            도전했어요
          </>
        ) : (
          <>이 다음 30칸을 사고팔아요</>
        )}
      </p>
    </section>
  );
}
