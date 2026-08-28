import { BEAK, BODY, drop, EYE, EYE_SAD, EYE_SQUINT, MOUTH } from './kkeolmusae';

export type Mood = 'happy' | 'neutral' | 'worried' | 'party' | 'shock';
export type Tone = 'up' | 'down' | 'flat';

const BODY_COLOR: Record<Tone, string> = {
  up: 'var(--color-up)',
  down: 'var(--color-down)',
  flat: '#b0b8c1',
};

/**
 * 껄무새 — 이 게임의 캐릭터.
 *
 * "살껄, 팔껄" 하고 되뇌는 개미가 곧 껄무새다. 로고와 같은 실루엣을 쓰고
 * (kkeolmusae.ts) 표정만 바꾼다. 실루엣이 흔들리면 같은 캐릭터로 안 읽힌다.
 *
 * 표정은 **입을 벌린 정도**로 만든다. 눈은 거들 뿐이다 —
 * 실루엣 아이콘이라 쓸 수 있는 게 구멍뿐이고, 그중 크기를 크게 바꿀 수 있는
 * 건 입밖에 없다.
 *
 * 몸 색은 수익 중이면 빨강, 손실이면 파랑. 숫자를 읽지 않아도 상태가 보인다.
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
  const color = BODY_COLOR[tone];
  const mouth =
    mood === 'party' || mood === 'shock'
      ? MOUTH.wide
      : mood === 'happy'
        ? MOUTH.open
        : mood === 'worried'
          ? MOUTH.small
          : MOUTH.shut;
  const squint = mood === 'happy' || mood === 'party';
  const id = `kkeolmusae-${mood}`;

  return (
    <svg width={size} height={size} viewBox="0 0 96 96" className={className} aria-hidden>
      <defs>
        <mask id={id}>
          <rect width="96" height="96" fill="#fff" />
          <path d={mouth} fill="#000" />
          {squint ? (
            <path d={EYE_SQUINT} stroke="#000" strokeWidth="4.4" strokeLinecap="round" fill="none" />
          ) : mood === 'worried' ? (
            // 우는 눈 — 웃는 눈을 아래로 뒤집은 것뿐인데 정반대로 읽힌다
            <path d={EYE_SAD} stroke="#000" strokeWidth="4.4" strokeLinecap="round" fill="none" />
          ) : mood === 'shock' ? (
            // 절규 — 눈을 크게 뚫고 안에 작은 눈동자를 남긴다. X 눈은 기절이지 절규가 아니다
            <circle cx={EYE.cx} cy={EYE.cy} r="10" fill="#000" />
          ) : (
            <circle cx={EYE.cx} cy={EYE.cy} r={EYE.r} fill="#000" />
          )}
        </mask>
      </defs>

      <g mask={`url(#${id})`}>
        <rect x={BODY.x} y={BODY.y} width={BODY.w} height={BODY.h} rx={BODY.r} fill={color} />
        <path d={BEAK} fill={color} />
      </g>

      {/* 절규 — 크게 뚫은 눈 안에 작은 눈동자, 그리고 머리 둘레의 떨림선 */}
      {mood === 'shock' && (
        <>
          <circle cx={EYE.cx + 1} cy={EYE.cy + 1} r="3" fill={color} />
          <g stroke={color} strokeWidth="3.6" strokeLinecap="round" opacity="0.85">
            <path d="M85 20 L92 13" />
            <path d="M88 33 L96 31" />
            <path d="M74 11 L76 3" />
            <path d="M22 26 L16 20" />
            <path d="M33 14 L31 6" />
          </g>
        </>
      )}

      {/* 눈물 — 실루엣 밖이라 마스크를 안 탄다 */}
      {mood === 'worried' && (
        <g fill="#8ec9ff">
          <path d={drop(56, 44)} />
          <path d={drop(62, 56)} />
        </g>
      )}

      {/* 반짝이 */}
      {mood === 'party' && (
        <>
          <Sparkle x={16} y={22} />
          <Sparkle x={88} y={30} />
          <Sparkle x={76} y={10} />
        </>
      )}
    </svg>
  );
}

function Sparkle({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y - 6} L${x + 2} ${y - 2} L${x + 6} ${y} L${x + 2} ${y + 2} L${x} ${y + 6} L${x - 2} ${y + 2} L${x - 6} ${y} L${x - 2} ${y - 2} Z`}
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
