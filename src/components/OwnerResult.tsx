'use client';

import { ResultPayload, ResultView, type Standing } from './ResultView';

/**
 * 본인이 자기 공유 링크를 열었을 때 보는 화면.
 *
 * 남에게는 알파와 등급만 보여주지만(스포일러 규칙), 본인에게는 감출 것이
 * 없다. 오늘의 챌린지는 하루 한 판뿐이라 "그때 그게 뭐였더라" 를 다시 볼
 * 곳이 있어야 한다.
 */
export function OwnerResult({
  result,
  revealCount,
  shareId,
  standing,
  date,
  mode,
}: {
  result: ResultPayload;
  revealCount: number;
  shareId: string;
  standing: Standing | null;
  date: string;
  mode: 'daily' | 'endless';
}) {
  return (
    <ResultView
      result={result}
      revealCount={revealCount}
      shareId={shareId}
      standing={standing}
      date={date}
      mode={mode}
      onRetry={() => {
        window.location.href = mode === 'daily' ? '/play?mode=endless' : '/play?mode=endless';
      }}
    />
  );
}
