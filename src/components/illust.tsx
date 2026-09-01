/**
 * 설명용 작은 그림들.
 *
 * 이 게임은 설명할 것이 전부 그림이다. "다음 칸이 열릴 때 그 값으로
 * 처리돼요" 15글자보다 봉 세 개와 점선 칸 하나가 빠르다. 글로 적으면
 * 읽어야 하지만 그리면 보인다.
 *
 * 색은 전부 테마 변수로 쓴다. 이미지로 만들면 다크모드에서 흰 사각형이
 * 된다. 같은 이유로 홈과 /how 가 이 파일 하나를 같이 쓴다 — 두 군데에
 * 따로 그리면 한쪽만 고쳐지고 서로 다른 게임을 설명하기 시작한다.
 */

const UP = 'var(--color-up)';
const DOWN = 'var(--color-down)';
const INK3 = 'var(--color-ink3)';
const BRAND = 'var(--color-accent)';
const LINE = 'var(--color-line)';
const MINT = 'var(--color-mint)';

type P = { className?: string };

/** 봉 하나. o/c 는 0(아래)~100(위) */
function Bar({ x, o, c, h, l, dim }: { x: number; o: number; c: number; h: number; l: number; dim?: boolean }) {
  const y = (v: number) => 56 - (v / 100) * 44;
  const up = c >= o;
  const color = up ? UP : DOWN;
  const top = y(Math.max(o, c));
  const bot = y(Math.min(o, c));
  return (
    <g opacity={dim ? 0.55 : 1}>
      <line x1={x} y1={y(h)} x2={x} y2={y(l)} stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <rect x={x - 3.4} y={top} width="6.8" height={Math.max(2, bot - top)} rx="1.8" fill={color} />
    </g>
  );
}

/* 봉이 넷이면 '표시 몇 개'로 보인다. 다섯 개가 되면서 차트로 읽힌다 */
/* 심지를 몸통보다 길게 두면 봉이 아니라 십자 표시로 보인다. 몸통을 키운다 */
const PAST = [
  { x: 9, o: 28, c: 44, h: 47, l: 25 },
  { x: 21, o: 44, c: 34, h: 47, l: 31 },
  { x: 33, o: 34, c: 54, h: 57, l: 31 },
  { x: 45, o: 54, c: 46, h: 58, l: 43 },
  { x: 57, o: 46, c: 58, h: 61, l: 43 },
];

/** ① 차트를 보고 다음이 오를지 내릴지 가늠한다 */
export function PredictIllust({ className }: P) {
  return (
    <svg viewBox="0 0 100 64" className={className} role="img" aria-label="차트와 아직 열리지 않은 다음 칸">
      {PAST.map((b) => (
        <Bar key={b.x} {...b} dim />
      ))}
      <rect x="66" y="6" width="18" height="52" rx="4" fill={BRAND} opacity="0.1" />
      <rect
        x="66"
        y="6"
        width="18"
        height="52"
        rx="4"
        fill="none"
        stroke={BRAND}
        strokeWidth="1.3"
        strokeDasharray="3 3"
      />
      <text x="75" y="38" textAnchor="middle" fontSize="17" fontWeight="800" fill={BRAND}>
        ?
      </text>
    </svg>
  );
}

/** ② 세 버튼 중 하나를 누른다 */
export function PickIllust({ className }: P) {
  return (
    <svg viewBox="0 0 100 64" className={className} role="img" aria-label="매수·관망·매도 버튼">
      <rect x="4" y="20" width="28" height="24" rx="7" fill={UP} />
      <rect x="36" y="20" width="28" height="24" rx="7" fill={LINE} />
      <rect x="68" y="20" width="28" height="24" rx="7" fill={DOWN} opacity="0.4" />
      <text x="18" y="35.5" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff">
        매수
      </text>
      <text x="50" y="35.5" textAnchor="middle" fontSize="9.5" fontWeight="800" fill={INK3}>
        관망
      </text>
      <text x="82" y="35.5" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff">
        매도
      </text>
      {/* 고른 것만 테두리. 손가락이나 파문은 이 크기에서 다른 걸로 읽힌다 */}
      <rect
        x="1"
        y="17"
        width="34"
        height="30"
        rx="10"
        fill="none"
        stroke={UP}
        strokeWidth="2"
        opacity="0.5"
      />
    </svg>
  );
}

/** ③ 다음 칸이 열리면서 결과가 정해진다 */
export function RevealIllust({ className }: P) {
  return (
    <svg viewBox="0 0 100 64" className={className} role="img" aria-label="다음 칸이 열려 오른 모습">
      {PAST.map((b) => (
        <Bar key={b.x} {...b} dim />
      ))}
      <rect x="66" y="6" width="18" height="52" rx="4" fill={UP} opacity="0.09" />
      <Bar x={75} o={56} c={80} h={86} l={54} />
      <path d="M89 26 l4 -8 l4 8 z" fill={UP} />
      <line x1="93" y1="20" x2="93" y2="40" stroke={UP} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** ④ 30턴 뒤, 나와 존버를 나란히 세운다 */
export function CompareIllust({ className }: P) {
  return (
    <svg viewBox="0 0 100 64" className={className} role="img" aria-label="나와 존버의 결과 비교">
      <text x="4" y="24" fontSize="10" fontWeight="800" fill={MINT}>
        나
      </text>
      <rect x="28" y="14" width="56" height="13" rx="5" fill={MINT} />
      <circle cx="90" cy="20.5" r="7" fill={MINT} />
      <path
        d="M86.5 20.5 l2.5 2.5 l4.5 -4.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <text x="4" y="49" fontSize="10" fontWeight="700" fill={INK3}>
        존버
      </text>
      <rect x="28" y="39" width="26" height="13" rx="5" fill={INK3} opacity="0.45" />
    </svg>
  );
}
