import { BEAK, BODY, EYE, MOUTH } from './kkeolmusae';

/**
 * 껄무새 마크 — 로고·파비콘용.
 *
 * "살껄, 팔껄" 하고 되뇌는 개미가 곧 껄무새다. 이름과 그림이 같은 말을 한다.
 * 도형 두 개(몸·부리)와 뚫린 구멍 두 개(입·눈)뿐이다.
 *
 * 색은 currentColor 를 따른다. 민트를 기본으로 쓰는 이유는 팔레트에 이미
 * 있으면서 게임 안에서 의미가 없는 유일한 색이어서다 — 빨강은 매수·상승,
 * 파랑은 매도·하락이라 로고에 쓰면 "오르는 게임인가" 하는 오해가 생긴다.
 */

/** 마스크 id. 같은 정의라 여러 개가 그려져도 충돌하지 않는다 */
const HOLES = 'kkeolmusae-logo-holes';

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
          <path d={MOUTH.open} fill="#000" />
          <circle cx={EYE.cx} cy={EYE.cy} r={EYE.r} fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${HOLES})`}>
        <rect x={BODY.x} y={BODY.y} width={BODY.w} height={BODY.h} rx={BODY.r} />
        <path d={BEAK} />
      </g>
    </svg>
  );
}
