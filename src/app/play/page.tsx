'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Action, FEE_RATE } from '@/lib/game/types';
import { ActionBar } from '@/components/ActionBar';
import { Tour } from '@/components/Tour';
import { HelpSheet } from '@/components/HelpSheet';
import { markHintSeen, noSubscribe, readSeenHint, serverSeenHint } from '@/lib/client/hint';

import { Bar, CandleChart } from '@/components/CandleChart';
import { ActionTrail } from '@/components/ActionTrail';
import { ResultPayload, ResultView, type Standing } from '@/components/ResultView';
import { StatHeader } from '@/components/StatHeader';

const INITIAL = 1_000_000;

type Phase = 'loading' | 'playing' | 'result' | 'error';

export default function PlayPage() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [bars, setBars] = useState<Bar[]>([]);
  const [revealCount, setRevealCount] = useState(0);
  const [turn, setTurn] = useState(0);
  const [totalTurns, setTotalTurns] = useState(30);
  const [equity, setEquity] = useState(INITIAL);
  const [holding, setHolding] = useState(false);
  const [holdMask, setHoldMask] = useState<boolean[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [entryPrice, setEntryPrice] = useState<number | null>(null);
  const [result, setResult] = useState<ResultPayload | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [standing, setStanding] = useState<Standing | null>(null);
  const [mode, setMode] = useState<'daily' | 'endless'>('endless');
  const [date, setDate] = useState<string | null>(null);
  const busy = useRef(false);
  /** 마지막 턴 직후 결과 화면으로 넘어가기 전까지 입력을 막는다 */
  const [locked, setLocked] = useState(false);

  /*
   * 안내는 두 갈래로 열린다 — 처음 온 사람에게 자동으로, 그리고 '?' 를
   * 눌렀을 때 언제든. 뒤로 나가야만 설명을 볼 수 있던 게 문제였다.
   */
  const seenHint = useSyncExternalStore(noSubscribe, readSeenHint, serverSeenHint);
  const [coachDone, setCoachDone] = useState(false);
  const [coachManual, setCoachManual] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const start = useCallback(async () => {
    setPhase('loading');
    setResult(null);
    setShareId(null);
    setStanding(null);
    setLocked(false);
    busy.current = false;
    try {
      // useSearchParams 는 Suspense 경계를 요구해서, 어차피 클라이언트인 여기서는
      // location 을 직접 읽는 편이 단순하다
      const wanted =
        new URLSearchParams(window.location.search).get('mode') === 'daily'
          ? 'daily'
          : 'endless';
      setMode(wanted);

      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: wanted }),
      });
      const data = await res.json();
      if (!res.ok) {
        // 로그인이 필요하거나 오늘 몫을 이미 쓴 경우 — 홈에서 안내한다
        if (data.needLogin || data.alreadyPlayed) {
          window.location.replace('/');
          return;
        }
        throw new Error(data.error ?? '시작하지 못했습니다.');
      }
      /*
       * 새 판이든 이어하기든 서버가 같은 모양으로 내려준다.
       * 오늘의 챌린지는 하루 한 번뿐이라, 뒤로 가기나 재로그인으로 화면을
       * 벗어났다 돌아오면 하던 턴부터 이어서 시작된다.
       */
      setSessionId(data.sessionId);
      setBars(data.candles);
      setRevealCount(data.revealCount ?? data.candles.length);
      setTurn(data.turn ?? 0);
      setTotalTurns(data.totalTurns);
      setEquity(data.equity);
      setHolding((data.qty ?? 0) > 0);
      setHoldMask(data.holdMask ?? []);
      setActions(data.actions ?? []);
      setEntryPrice(data.entryPrice ?? null);
      setDate(data.date ?? null);
      setPhase('playing');
    } catch (e) {
      setError((e as Error).message);
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    void start();
  }, [start]);

  async function act(action: Action) {
    if (busy.current || locked || phase !== 'playing') return;
    busy.current = true;
    try {
      const res = await fetch('/api/session/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '진행하지 못했습니다.');

      setBars((prev) => [...prev, data.candle]);
      setTurn(data.turn);
      setEquity(data.equity);
      const nowHolding = data.qty > 0;
      setHolding(nowHolding);
      setHoldMask((prev) => [...prev, nowHolding]);
      setActions((prev) => [...prev, data.appliedAction as Action]);
      setEntryPrice(data.entryPrice ?? null);

      if (data.done && data.result) {
        setLocked(true);
        setResult(data.result);
        setShareId(data.shareId ?? null);
        setStanding(data.standing ?? null);
        setDate(data.date ?? null);

        // 마지막 봉을 잠깐 보여주고 결과로 넘어간다
        setTimeout(() => setPhase('result'), 600);
      }
    } catch (e) {
      setError((e as Error).message);
      setPhase('error');
    } finally {
      busy.current = false;
    }
  }

  if (phase === 'loading') {
    return (
      <Center>
        <div className="h-11 w-11 animate-spin rounded-full border-[3px] border-line border-t-brand" />
        <p className="mt-4 text-[14px] text-ink3">차트를 고르는 중</p>
      </Center>
    );
  }

  if (phase === 'error') {
    return (
      <Center>
        <p className="text-[16px] font-semibold">문제가 생겼어요</p>
        <p className="mt-2 max-w-[280px] text-center text-[14px] leading-relaxed text-ink3">
          {error}
        </p>
        <button
          type="button"
          onClick={() => void start()}
          className="pressable mt-6 h-[52px] rounded-btn bg-brand px-8 text-[16px] font-bold text-white"
        >
          다시 시도
        </button>
        <Link href="/" className="mt-3 text-[14px] font-medium text-ink3">
          홈으로
        </Link>
      </Center>
    );
  }

  if (phase === 'result' && result) {
    return <ResultView
        result={result}
        revealCount={revealCount}
        shareId={shareId}
        standing={standing}
        date={date}
        mode={mode}
        onRetry={() => {
          /*
           * 데일리는 오늘 몫을 이미 썼으므로 같은 모드로 다시 시작하면 409 다.
           * 무한 모드로 주소를 바꿔서 다시 들어간다.
           */
          if (mode === 'daily') window.location.href = '/play?mode=endless';
          else void start();
        }}
      />;
  }

  /*
   * 같은 시점의 존버 수익률. 첫 플레이 봉의 시가에 전량 매수해 그대로 들고
   * 있었을 때의 평가액이다. 매도 수수료는 아직 빼지 않는다 — 내 수익률도
   * 청산 전 평가액이라, 그래야 두 숫자가 같은 조건에서 비교된다.
   *
   * 화면에 이미 그려져 있는 캔들만으로 계산되므로 아무것도 미리 알려주지 않는다.
   */
  const holdPnl =
    bars.length > revealCount
      ? (1 - FEE_RATE) * (bars[bars.length - 1].c / bars[revealCount].o) - 1
      : 0;

  const coachOpen =
    phase === 'playing' && !coachDone && (coachManual || (!seenHint && turn === 0));

  return (
    /* 스크롤 없이 한 화면에. 차트가 남는 세로 공간을 전부 가져간다 */
    <div className="flex h-dvh flex-col overflow-hidden">
      <StatHeader
        equity={equity}
        pnl={equity / INITIAL - 1}
        holdPnl={holdPnl}
        turn={turn}
        totalTurns={totalTurns}
        holding={holding}
        onHelp={() => setHelpOpen(true)}
      />

      {/* min-h-0 이 없으면 flex 자식이 내용 높이 밑으로 안 줄어든다 */}
      <div className="mt-3 min-h-0 flex-1 px-4">
        <div data-coach="chart" className="h-full rounded-card bg-card px-2 py-3">
          <CandleChart
            bars={bars}
            revealCount={revealCount}
            holdMask={holdMask}
            slots={revealCount + totalTurns}
            entryPrice={entryPrice}
            markNext={!locked}
          />
        </div>
      </div>

      <div className="mt-3 mb-1">
        <ActionTrail actions={actions} total={totalTurns} />
      </div>

      {/* 안내가 여기를 밝힐 때 스크림이 비쳐 보이지 않게 불투명한 바닥을 깐다 */}
      <div data-coach="actions" className="bg-bg">
        <ActionBar
          holding={holding}
          disabled={locked || phase !== 'playing'}
          onAction={(a) => void act(a)}
        />
      </div>

      {helpOpen && (
        <HelpSheet
          onClose={() => setHelpOpen(false)}
          onReplay={() => {
            setHelpOpen(false);
            setCoachDone(false);
            setCoachManual(true);
          }}
        />
      )}

      {coachOpen && (
        <Tour
          onDone={() => {
            markHintSeen();
            setCoachDone(true);
            setCoachManual(false);
          }}
        />
      )}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center px-6">{children}</div>;
}
