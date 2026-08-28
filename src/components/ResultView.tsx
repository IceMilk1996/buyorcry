'use client';

import { useState } from 'react';
import { Action } from '@/lib/game/types';

import { Bar, CandleChart } from './CandleChart';
import { Mascot, moodFor } from './Mascot';
import { fmtPct, fmtWon } from './StatHeader';

export type BoardRow = {
  place: number;
  nick: string;
  alpha: number;
  rankLabel: string;
  isMe: boolean;
  gapBefore: boolean;
};

export type Standing = {
  place: number;
  total: number;
  percentile: number;
  rows: BoardRow[];
  spread: { label: string; count: number }[];
};

export type ResultPayload = {
  finalEquity: number;
  myReturn: number;
  holdReturn: number;
  alpha: number;
  rank: { key: string; label: string };
  actions: Action[];
  tradeCount: number;
  symbol: string;
  name: string;
  interval: 'D' | 'W';
  from: string;
  to: string;
  revealCandles: (Bar & { t: string })[];
};

/**
 * 결과 화면 — 이 게임의 하이라이트.
 *
 * 플레이는 2분인데 공유 여부는 여기서 결정된다.
 * "내 수익률 vs 존버"를 정면으로 대비시키는 것이 전부다.
 */
export function ResultView({
  result,
  revealCount,
  shareId,
  standing: initialStanding,
  date,
  onRetry,
}: {
  result: ResultPayload;
  revealCount: number;
  /** 공유 링크와 이미지에 쓰이는 id. 없으면 텍스트 복사만 가능 */
  shareId: string | null;
  /** 오늘의 챌린지에서만 들어온다. 무한 모드는 차트가 달라 순위가 성립하지 않는다 */
  standing: Standing | null;
  date: string | null;
  onRetry: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const [standing, setStanding] = useState(initialStanding);
  const [nick, setNick] = useState('');
  // 이미 이름이 있으면(순위표에 '익명'이 아니면) 다시 묻지 않는다
  const [hasNick, setHasNick] = useState(
    () => initialStanding?.rows.some((r) => r.isMe && r.nick !== '익명') ?? true
  );

  async function saveNick() {
    const v = nick.trim();
    if (!v || !standing || !date) return;
    try {
      const res = await fetch('/api/me/nick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick: v }),
      });
      const data = await res.json();
      if (res.ok) {
        setHasNick(true);
        if (data.standing) setStanding(data.standing);
      }
    } catch {
      /* 실패하면 익명으로 남는다 */
    }
  }
  const { mood, tone } = moodFor(result.alpha);
  const beat = result.alpha >= 0;

  const holdMask = result.actions.reduce<boolean[]>((acc, a, i) => {
    const prev = i === 0 ? false : acc[i - 1];
    acc.push(a === 'BUY' ? true : a === 'SELL' ? false : prev);
    return acc;
  }, []);

  const shareUrl = shareId ? `${location.origin}/r/${shareId}` : '';

  /**
   * 링크 공유.
   * 모바일에서는 OS 공유 시트가 뜬다 — 카톡으로 바로 보낼 수 있다.
   * 데스크톱은 클립보드 복사로 떨어진다.
   */
  async function share() {
    const text = shareText(result);
    const payload = shareUrl ? { text, url: shareUrl } : { text };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      await navigator.clipboard.writeText(shareUrl ? `${text}\n${shareUrl}` : text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* 사용자가 시트를 닫은 경우 — 아무것도 하지 않는다 */
    }
  }

  /**
   * 이미지 저장.
   * iOS 사파리는 <a download> 가 잘 안 먹어서, 공유 시트를 먼저 시도한다.
   * 시트로 보내면 카톡·사진앱 어디로든 갈 수 있어 저장보다 오히려 편하다.
   */
  async function saveImage() {
    if (!shareId || imgBusy) return;
    setImgBusy(true);
    try {
      const res = await fetch(`/api/share/${shareId}/image`);
      if (!res.ok) throw new Error('이미지를 만들지 못했어요');
      const blob = await res.blob();
      const file = new File([blob], `buyorcry-${shareId}.png`, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* 취소 또는 실패 */
    } finally {
      setImgBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-3 px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
      {/* 성적 */}
      <section className="anim-pop rounded-card bg-card p-6 text-center">
        <Mascot mood={mood} tone={tone} size={92} className="mx-auto anim-bob" />
        <div className="mt-3 inline-flex rounded-full bg-bg px-3.5 py-1.5 text-[13px] font-bold text-ink2">
          {result.rank.label}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Cell label="내 수익률" value={fmtPct(result.myReturn)} strong tone={result.myReturn >= 0 ? 'up' : 'down'} />
          <Cell label="그냥 들고 있었다면" value={fmtPct(result.holdReturn)} tone={result.holdReturn >= 0 ? 'up' : 'down'} />
        </div>

        <p className="mt-5 text-[15px] font-semibold leading-relaxed text-ink2">
          {beat ? (
            <>존버보다 <span className="text-up">{fmtPct(result.alpha)}</span> 잘했어요</>
          ) : (
            <>존버보다 <span className="text-down">{fmtPct(result.alpha)}</span> 못했어요</>
          )}
        </p>

        {/*
          한 번도 안 산 판은 사실만 말한다.
          현금으로 있는 게 옳은 판단이었는지 그냥 안 누른 건지 우리는 알 수 없으므로
          칭찬도 비난도 하지 않는다.
        */}
        {result.tradeCount === 0 && (
          <p className="mt-2 text-[13px] leading-relaxed text-ink3">
            한 번도 사지 않으셨어요.
            <br />
            {result.holdReturn < 0 ? '이번엔 그게 나았네요.' : '이번엔 들어갔어야 했어요.'}
          </p>
        )}

        <p className="mt-1 text-[13px] text-ink3">
          최종 {fmtWon(result.finalEquity)}원 · 수수료 포함
        </p>
      </section>

      {/* 오늘의 순위 — 데일리에서만 */}
      {standing && (
        <section className="anim-rise rounded-card bg-card p-5" style={{ animationDelay: '60ms' }}>
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-medium text-ink3">오늘의 챌린지</span>
            <span className="text-[13px] font-medium text-ink3">
              {standing.total.toLocaleString('ko-KR')}명 참가
            </span>
          </div>

          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-[32px] font-bold leading-none tracking-tight">
              {standing.place.toLocaleString('ko-KR')}
            </span>
            <span className="text-[16px] font-semibold text-ink2">등</span>
            <span className="ml-1 text-[15px] font-bold text-brand">
              상위 {standing.percentile}%
            </span>
          </div>

          {/* 순위표 — 상위 3명 + 내 주변, 합쳐서 10줄 */}
          <div className="mt-4 flex flex-col">
            {standing.rows.map((r) => (
              <div key={r.place}>
                {r.gapBefore && (
                  <div className="py-1.5 text-center text-[13px] font-bold leading-none text-ink3">
                    ⋯
                  </div>
                )}
                <div
                  className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 ${
                    r.isMe ? 'bg-brandweak' : ''
                  }`}
                >
                  <span
                    className={`w-[26px] shrink-0 text-right text-[13px] tabular-nums ${
                      r.place <= 3 ? 'font-bold text-ink' : 'text-ink3'
                    }`}
                  >
                    {r.place}
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate text-[14px] ${
                      r.isMe ? 'font-bold text-brand' : 'text-ink2'
                    }`}
                  >
                    {r.nick}
                    {r.isMe && <span className="ml-1 text-[12px] font-medium">나</span>}
                  </span>
                  <span className="shrink-0 text-[12px] text-ink3">{r.rankLabel}</span>
                  <span
                    className={`w-[52px] shrink-0 text-right text-[13px] font-semibold tabular-nums ${
                      r.alpha >= 0 ? 'text-up' : 'text-down'
                    }`}
                  >
                    {fmtPct(r.alpha)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 이름은 순위가 나온 뒤에 묻는다. 시작 전에 요구하면 그 화면에서 이탈한다 */}
          {!hasNick && (
            <div className="mt-3 border-t border-line pt-3">
              <p className="text-[12px] text-ink3">이름을 남기면 순위표에 표시돼요</p>
              <div className="mt-2 flex gap-2">
                <input
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void saveNick()}
                  maxLength={12}
                  placeholder="닉네임"
                  className="h-[42px] min-w-0 flex-1 rounded-xl bg-bg px-3.5 text-[14px] font-medium text-ink outline-none placeholder:text-ink3"
                />
                <button
                  type="button"
                  onClick={() => void saveNick()}
                  disabled={!nick.trim()}
                  className="pressable h-[42px] shrink-0 rounded-xl bg-ink px-4 text-[14px] font-bold text-card disabled:opacity-40"
                >
                  등록
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 정체 공개 */}
      <section className="anim-rise rounded-card bg-card p-5" style={{ animationDelay: '90ms' }}>
        <div className="text-[13px] font-medium text-ink3">이 차트는</div>
        <div className="mt-1 text-[20px] font-bold">
          {result.name}
          <span className="ml-2 text-[13px] font-medium text-ink3">{result.symbol}</span>
        </div>
        <div className="mt-0.5 text-[13px] text-ink3">
          {result.from} ~ {result.to} · {result.interval === 'D' ? '일봉' : '주봉'}
        </div>

        <div className="mt-3">
          <CandleChart bars={result.revealCandles} revealCount={revealCount} holdMask={holdMask} />
        </div>
        <p className="mt-1 text-center text-[12px] text-ink3">
          붉게 칠해진 구간이 실제로 들고 있던 때예요
        </p>
      </section>

      <div className="flex-1" />

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={share}
            className="pressable h-[54px] flex-1 rounded-btn bg-card text-[15px] font-bold text-ink"
          >
            {copied ? '복사됨!' : '공유하기'}
          </button>
          <button
            type="button"
            onClick={saveImage}
            disabled={!shareId || imgBusy}
            className="pressable h-[54px] flex-1 rounded-btn bg-card text-[15px] font-bold text-ink disabled:text-ink3/50"
          >
            {imgBusy ? '만드는 중' : '이미지 저장'}
          </button>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="pressable h-[58px] rounded-btn bg-brand text-[17px] font-bold text-white"
        >
          한 판 더
        </button>
      </div>
    </div>
  );
}

function Cell({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone: 'up' | 'down';
}) {
  return (
    <div className="rounded-2xl bg-bg px-3 py-4">
      <div className="text-[12px] font-medium text-ink3">{label}</div>
      <div
        className={`mt-1.5 font-bold tracking-tight ${strong ? 'text-[26px]' : 'text-[22px]'} ${
          tone === 'up' ? 'text-up' : 'text-down'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/**
 * 30턴을 10칸으로 압축한다. 길면 아무도 공유하지 않는다.
 *
 * ⚠️ 내 수익률은 절대 넣지 않는다.
 *    알파와 나란히 두면 `존버 수익률 = 내 수익률 − 알파` 가 정확히 나오고,
 *    존버 수익률은 곧 "이 차트가 올랐나"라는 정답이다. 데일리는 전원이 같은
 *    차트를 풀기 때문에 이 한 줄이면 아직 안 푼 사람의 게임이 끝난다.
 *    공유 페이지·OG 이미지는 이 규칙을 지키고 있었는데, 링크와 함께 보내는
 *    이 텍스트만 새고 있었다. (기획서 7.1, share.ts 주석)
 */
export function shareText(r: ResultPayload): string {
  const size = Math.max(1, Math.ceil(r.actions.length / 10));
  const cells: string[] = [];
  for (let i = 0; i < r.actions.length; i += size) {
    const chunk = r.actions.slice(i, i + size);
    cells.push(chunk.includes('BUY') ? '🟥' : chunk.includes('SELL') ? '🟦' : '⬜');
  }
  return [
    `📈 살껄팔껄`,
    `존버보다 ${fmtPct(r.alpha)}`,
    ``,
    cells.join(''),
    `🟥 매수  🟦 매도  ⬜ 관망`,
  ].join('\n');
}
