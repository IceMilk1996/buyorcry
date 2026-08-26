export type Mood = 'happy' | 'neutral' | 'worried' | 'party' | 'shock';
export type Tone = 'up' | 'down' | 'flat';

const BODY: Record<Tone, string> = {
  up: 'var(--color-up)',
  down: 'var(--color-down)',
  flat: '#b0b8c1',
};

/**
 * 봉이 — 이 게임의 귀여움 담당.
 *
 * 캔들 하나를 캐릭터로 만든 것. 심지가 머리·다리가 되고 몸통이 얼굴이다.
 * 수익 중이면 빨강, 손실이면 파랑으로 몸 색이 바뀌어서
 * 숫자를 읽지 않아도 지금 상태가 보인다.
 */
export function Mascot({
  mood = 'neutral',
  tone = 'flat',
  size = 96,
  className = '',
}: {
  mood?: Mood;
  tone?: Tone;
  size?: number;
  className?: string;
}) {
  const body = BODY[tone];

  return (
    <svg
      width={size}
      height={size * 1.25}
      viewBox="0 0 80 100"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* 심지 */}
      <rect x="36.5" y="4" width="7" height="92" rx="3.5" fill={body} opacity="0.9" />
      {/* 몸통 */}
      <rect x="16" y="26" width="48" height="50" rx="16" fill={body} />
      {/* 하이라이트 — 입체감 한 스푼 */}
      <rect x="16" y="26" width="48" height="24" rx="14" fill="#fff" opacity="0.14" />

      {mood === 'shock' ? (
        <>
          <Cross x={30} y={46} />
          <Cross x={50} y={46} />
        </>
      ) : (
        <>
          <Eye x={30} y={46} squint={mood === 'happy' || mood === 'party'} />
          <Eye x={50} y={46} squint={mood === 'happy' || mood === 'party'} />
        </>
      )}

      {/* 볼터치 */}
      {(mood === 'happy' || mood === 'party') && (
        <>
          <ellipse cx="23" cy="57" rx="5" ry="3.4" fill="#fff" opacity="0.35" />
          <ellipse cx="57" cy="57" rx="5" ry="3.4" fill="#fff" opacity="0.35" />
        </>
      )}

      {/* 입 */}
      {mood === 'happy' && <Mouth d="M33 60 Q40 67 47 60" />}
      {mood === 'party' && <ellipse cx="40" cy="62" rx="6" ry="7" fill="#fff" opacity="0.92" />}
      {mood === 'neutral' && <Mouth d="M34 62 L46 62" />}
      {mood === 'worried' && <Mouth d="M33 65 Q40 58 47 65" />}
      {mood === 'shock' && <ellipse cx="40" cy="63" rx="5" ry="6" fill="#fff" opacity="0.9" />}

      {/* 식은땀 */}
      {mood === 'worried' && (
        <path d="M62 36 q4 6 0 9 q-4 -3 0 -9z" fill="#8ec9ff" opacity="0.95" />
      )}

      {/* 파티 반짝이 */}
      {mood === 'party' && (
        <>
          <Sparkle x={11} y={20} />
          <Sparkle x={66} y={30} />
          <Sparkle x={60} y={12} />
        </>
      )}
    </svg>
  );
}

function Eye({ x, y, squint }: { x: number; y: number; squint: boolean }) {
  return squint ? (
    <path
      d={`M${x - 5} ${y + 2} Q${x} ${y - 4} ${x + 5} ${y + 2}`}
      stroke="#fff"
      strokeWidth="3.2"
      strokeLinecap="round"
      fill="none"
    />
  ) : (
    <ellipse cx={x} cy={y} rx="3.6" ry="4.4" fill="#fff" />
  );
}

function Cross({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="#fff" strokeWidth="3" strokeLinecap="round">
      <path d={`M${x - 4} ${y - 4} L${x + 4} ${y + 4}`} />
      <path d={`M${x + 4} ${y - 4} L${x - 4} ${y + 4}`} />
    </g>
  );
}

function Mouth({ d }: { d: string }) {
  return <path d={d} stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />;
}

function Sparkle({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y - 5} L${x + 1.6} ${y - 1.6} L${x + 5} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 5} L${x - 1.6} ${y + 1.6} L${x - 5} ${y} L${x - 1.6} ${y - 1.6} Z`}
      fill="var(--color-butter)"
    />
  );
}

/** 수익률에 따라 표정을 고른다 */
export function moodFor(pnl: number): { mood: Mood; tone: Tone } {
  if (pnl > 0.15) return { mood: 'party', tone: 'up' };
  if (pnl > 0.01) return { mood: 'happy', tone: 'up' };
  if (pnl < -0.15) return { mood: 'shock', tone: 'down' };
  if (pnl < -0.01) return { mood: 'worried', tone: 'down' };
  return { mood: 'neutral', tone: 'flat' };
}
