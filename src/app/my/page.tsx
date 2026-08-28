import Link from 'next/link';
import { currentUser } from '@/lib/server/auth';
import { careerOf, type HistoryEntry } from '@/lib/server/history';
import { TopBar } from '@/components/TopBar';
import { SignOutButton } from '@/components/SignOutButton';
import { NickEditor } from '@/components/NickEditor';

export const dynamic = 'force-dynamic';

/**
 * 마이페이지.
 *
 * 종목명을 그대로 보여준다. 공유 링크에서는 절대 안 되는 일이지만(기획서 7.1)
 * 여기는 본인 로그인 뒤의 화면이고, "그때 그게 뭐였더라"가 이 페이지를 다시
 * 열 이유이기도 하다.
 */
export default async function MyPage() {
  const user = await currentUser();

  if (!user) {
    return (
      <main className="flex flex-1 flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
        <TopBar title="마이페이지" />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-[15px] text-ink3">로그인하면 내 전적을 볼 수 있어요.</p>
          <Link
            href="/"
            className="pressable h-[52px] rounded-btn bg-brand px-8 text-[16px] font-bold leading-[52px] text-white"
          >
            홈으로
          </Link>
        </div>
      </main>
    );
  }

  const c = await careerOf(user.id);

  return (
    <main className="flex flex-1 flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
      <TopBar title="마이페이지" />

      {/* 이름을 안 정한 사람에게 '익명님' 이라고 부르지 않는다 */}
      <h1 className="mt-2 text-[24px] font-bold tracking-tight">
        {user.nick ? `${user.nick}님의 전적` : '내 전적'}
      </h1>

      <div className="mt-4">
        <NickEditor nick={user.nick} />
      </div>

      {c.total === 0 ? (
        <div className="mt-8 flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-center text-[15px] leading-relaxed text-ink3">
            아직 끝낸 판이 없어요.
            <br />한 판 하고 오면 여기에 쌓여요.
          </p>
          <Link
            href="/"
            className="pressable h-[52px] rounded-btn bg-brand px-8 text-[16px] font-bold leading-[52px] text-white"
          >
            시작하기
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-2 grid grid-cols-3 gap-2">
            <Stat top={`${c.total}판`} bottom={`오늘의 챌린지 ${c.daily}`} />
            <Stat top={pct(c.avgAlpha)} bottom="평균 초과수익" tone={c.avgAlpha} />
            <Stat top={`${c.beatHold}판`} bottom="존버 이김" />
          </section>

          <section className="mt-2 rounded-card bg-card p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-[14px] font-bold text-ink2">최고 성적</span>
              <span className="text-[13px] font-semibold text-ink3">{c.bestRankLabel}</span>
            </div>
            <div
              className={`mt-1 text-[28px] font-bold tracking-tight ${
                c.bestAlpha >= 0 ? 'text-up' : 'text-down'
              }`}
            >
              {pct(c.bestAlpha)}
            </div>
            <p className="mt-1 text-[12px] text-ink3">존버 대비</p>
          </section>

          <h2 className="mt-6 text-[15px] font-bold">지난 판</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {c.entries.map((e) => (
              <Row key={`${e.at}-${e.shareId}`} e={e} />
            ))}
          </ul>
          {c.total >= 50 && (
            <p className="mt-3 text-center text-[12px] text-ink3">최근 50판까지 보여드려요</p>
          )}
        </>
      )}

      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
  );
}

function Row({ e }: { e: HistoryEntry }) {
  return (
    <li>
      <Link
        href={`/r/${e.shareId}`}
        className="pressable flex items-center justify-between rounded-btn bg-card px-4 py-3.5"
      >
        <span className="flex min-w-0 flex-col items-start">
          <span className="flex items-center gap-1.5">
            <span className="text-[15px] font-bold">{e.name}</span>
            <span className="rounded-full bg-bg px-1.5 py-0.5 text-[10px] font-bold text-ink3">
              {e.mode === 'daily' ? '오늘의 챌린지' : '무한'}
            </span>
          </span>
          <span className="mt-0.5 truncate text-[12px] text-ink3">
            {e.from} ~ {e.to} · {e.interval === 'D' ? '일봉' : '주봉'} · 매매 {e.tradeCount}회
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end pl-3">
          <span className={`text-[16px] font-bold ${e.alpha >= 0 ? 'text-up' : 'text-down'}`}>
            {pct(e.alpha)}
          </span>
          <span className="mt-0.5 text-[11px] font-semibold text-ink3">{e.rankLabel}</span>
        </span>
      </Link>
    </li>
  );
}

function Stat({ top, bottom, tone }: { top: string; bottom: string; tone?: number }) {
  const color = tone === undefined ? '' : tone >= 0 ? 'text-up' : 'text-down';
  return (
    <div className="rounded-2xl bg-card px-2 py-3.5 text-center">
      <div className={`text-[17px] font-bold tracking-tight ${color}`}>{top}</div>
      <div className="mt-0.5 text-[11px] font-medium text-ink3">{bottom}</div>
    </div>
  );
}

function pct(x: number): string {
  return `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`;
}
