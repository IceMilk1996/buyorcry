import Link from 'next/link';
import type { Metadata } from 'next';
import { compressActions, getShare, toPublic } from '@/lib/server/share';
import { Mascot, moodFor } from '@/components/Mascot';
import { currentUser } from '@/lib/server/auth';
import { standingOf } from '@/lib/server/daily';
import { OwnerResult } from '@/components/OwnerResult';
import { REVEAL_COUNT } from '@/lib/game/types';
import { Logo } from '@/components/Logo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const rec = await getShare(id);
  if (!rec) return { title: '살껄팔껄' };
  const pct = `${rec.alpha >= 0 ? '+' : ''}${(rec.alpha * 100).toFixed(1)}%`;
  return {
    title: `존버보다 ${pct} — 살껄팔껄`,
    description: '무슨 회사인지 언제인지 가린 차트로 사고팔고, 그냥 사두고 가만히 있었을 때와 비교당하는 게임.',
  };
}

/**
 * 공유 링크로 들어온 사람이 보는 화면.
 *
 * ⚠️ 종목·기간·차트·수익률은 절대 렌더링하지 않는다.
 *    데일리는 전원이 같은 차트를 풀기 때문에, 아직 안 푼 사람이 이 페이지를 열면
 *    게임이 끝나버린다. 보여주는 성적은 알파 하나뿐이다.
 */
export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rec = await getShare(id);

  if (!rec) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <p className="text-[17px] font-bold">결과를 찾을 수 없어요</p>
        <p className="mt-2 text-[14px] leading-relaxed text-ink3">
          링크가 만료됐거나 잘못된 주소예요.
        </p>
        <Link
          href="/"
          className="pressable mt-7 flex h-[54px] items-center justify-center rounded-btn bg-brand px-9 text-[16px] font-bold text-onbrand"
        >
          나도 해보기
        </Link>
      </main>
    );
  }

  /*
   * 본인이 열었으면 전체 결과를 보여준다.
   * 감출 이유가 없고, 오늘의 챌린지는 하루 한 판뿐이라 다시 볼 곳이 필요하다.
   * 아래 공개 화면은 '남이 열었을 때' 전용이다.
   */
  const me = await currentUser();
  if (rec.userId && me?.id === rec.userId) {
    return (
      <OwnerResult
        result={{
          finalEquity: rec.finalEquity,
          myReturn: rec.myReturn,
          holdReturn: rec.holdReturn,
          alpha: rec.alpha,
          rank: rec.rank,
          actions: rec.actions,
          tradeCount: rec.actions.filter((a) => a !== 'HOLD').length,
          symbol: rec.symbol,
          name: rec.name,
          interval: rec.interval,
          from: rec.from,
          to: rec.to,
          revealCandles: rec.revealCandles,
        }}
        revealCount={REVEAL_COUNT}
        shareId={rec.id}
        standing={rec.mode === 'daily' ? await standingOf(rec.date, rec.userId) : null}
        date={rec.date}
        mode={rec.mode}
      />
    );
  }

  const r = toPublic(rec);
  const { mood, tone } = moodFor(r.alpha);
  const win = r.alpha >= 0;
  const pct = `${r.alpha >= 0 ? '+' : ''}${(r.alpha * 100).toFixed(1)}%`;

  return (
    <main className="flex flex-1 flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-8">
      <div className="flex items-center gap-1.5">
        <Logo size={20} className="text-mint" />
        <p className="text-[14px] font-bold tracking-tight text-ink2">살껄팔껄</p>
      </div>

      <section className="anim-pop mt-4 rounded-card bg-card p-7 text-center">
        <Mascot mood={mood} tone={tone} size={92} className="mx-auto anim-bob" />

        <p className="mt-5 text-[17px] font-bold text-ink2">존버보다</p>
        <p
          className={`mt-1 text-[52px] font-bold leading-none tracking-tight ${
            win ? 'text-up' : 'text-down'
          }`}
        >
          {pct}
        </p>
        <p className="mt-2 text-[17px] font-bold text-ink2">
          {win ? '잘했어요' : '못했어요'}
        </p>

        <div className="mt-5 inline-flex rounded-full bg-bg px-4 py-2 text-[14px] font-bold text-ink">
          {r.rank.label}
        </div>

        <div className="mt-6 flex justify-center gap-1.5">
          {compressActions(r.actions).map((a, i) => (
            <span
              key={i}
              className={`h-3.5 w-3.5 rounded-[5px] ${
                a === 'BUY' ? 'bg-up' : a === 'SELL' ? 'bg-down' : 'bg-line'
              }`}
            />
          ))}
        </div>
        <p className="mt-2.5 text-[12px] text-ink3">
          <span className="font-bold text-up">매수</span> ·{' '}
          <span className="font-bold text-down">매도</span> · 관망
        </p>
      </section>

      {/* 성적만 보여주고 정답은 감춘다 — 이게 이 페이지의 핵심 */}
      <p className="mt-4 text-center text-[13px] leading-relaxed text-ink3">
        어떤 종목이었는지는 알려드릴 수 없어요.
        <br />
        직접 풀어보면 알게 돼요.
      </p>

      <div className="flex-1" />

      <Link
        href="/"
        className="pressable mt-6 flex h-[58px] items-center justify-center rounded-btn bg-brand text-[17px] font-bold text-onbrand"
      >
        나도 해보기
      </Link>
    </main>
  );
}
