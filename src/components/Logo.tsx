/**
 * 껄무새 — 살껄팔껄의 캐릭터.
 *
 * "살껄, 팔껄" 하고 되뇌는 개미가 곧 껄무새다. 이름과 그림이 같은 말을 한다.
 *
 * 형태는 도형 두 개(몸 · 부리)와 뚫린 구멍 두 개(입 · 눈)뿐이다.
 * 안쪽 디테일은 다 버려도 되지만 윤곽선은 못 버린다 — 부리가 실루엣 밖으로
 * 튀어나와야 16px 에서도 새로 읽힌다.
 *
 * 색은 currentColor 를 따른다. 몸 색만 바꾸면 수익 빨강 / 손실 파랑으로도 쓸 수 있다.
 */

/** 마스크 id. 같은 정의라 여러 개가 그려져도 충돌하지 않는다 */
const HOLES = 'kkeolmusae-holes';

/** 입 — 크게 벌리고 "껄!!!" 하는 자리 */
const MOUTH =
  'M44 46 C36 45, 28 48, 24 52 C21 56, 22 62, 27 65 C33 68, 41 66, 44 60 C46 55, 45 50, 44 46 Z';
/** 위턱 — 짧고 깊게 말리는 갈고리. 앵무새를 앵무새로 만드는 유일한 선 */
const BEAK =
  'M47 28 C35 28, 23 32, 17 40 C13 46, 14 55, 20 56 C24 56, 24 51, 27 48 C33 43, 41 43, 47 44 Z';
const EYE = { cx: 58, cy: 37, r: 6.5 };

export function Logo({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="currentColor"
      className={className}
      role="img"
      aria-label="살껄팔껄"
    >
      <defs>
        <mask id={HOLES}>
          <rect width="96" height="96" fill="#fff" />
          <path d={MOUTH} fill="#000" />
          <circle cx={EYE.cx} cy={EYE.cy} r={EYE.r} fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${HOLES})`}>
        <rect x="28" y="15" width="54" height="66" rx="26" />
        <path d={BEAK} />
      </g>
    </svg>
  );
}

/**
 * 마스크를 못 쓰는 곳(satori 로 그리는 공유 이미지)용.
 * 구멍을 뚫는 대신 배경색으로 칠한다. 배경이 단색일 때만 쓸 것.
 */
export function LogoPainted({
  size = 96,
  body = '#fff',
  hole = '#00c9a7',
}: {
  size?: number;
  body?: string;
  hole?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden>
      <rect x="28" y="15" width="54" height="66" rx="26" fill={body} />
      <path d={BEAK} fill={body} />
      <path d={MOUTH} fill={hole} />
      <circle cx={EYE.cx} cy={EYE.cy} r={EYE.r} fill={hole} />
    </svg>
  );
}
