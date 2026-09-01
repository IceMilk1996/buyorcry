/**
 * 설명용 그림들.
 *
 * 이 게임은 설명할 것이 전부 그림이다. "다음 칸이 열릴 때 그 값으로
 * 처리돼요" 열다섯 글자보다 봉 다섯 개와 점선 칸 하나가 빠르다.
 *
 * 색은 전부 테마 변수로 쓴다. 이미지로 만들면 다크모드에서 흰 사각형이
 * 된다. 같은 이유로 홈과 /how 가 이 파일 하나를 같이 쓴다 — 두 군데에
 * 따로 그리면 한쪽만 고쳐지고 서로 다른 게임을 설명하기 시작한다.
 */

const UP = 'var(--color-up)';
const DOWN = 'var(--color-down)';
const INK3 = 'var(--color-ink3)';
const ACCENT = 'var(--color-accent)';
const LINE = 'var(--color-line)';
const MINT = 'var(--color-mint)';

type P = { className?: string };

/**
 * 봉 하나. o/c/h/l 은 0(아래)~100(위).
 *
 * 심지를 몸통보다 길게 두면 봉이 아니라 십자 표시로 보인다. 데이터를
 * 만들 때 몸통을 넉넉히 준다.
 */
function Bar({ x, o, c, h, l, dim }: { x: number; o: number; c: number; h: number; l: number; dim?: boolean }) {
  const y = (v: number) => 56 - (v / 100) * 44;
  const color = c >= o ? UP : DOWN;
  const top = y(Math.max(o, c));
  const bot = y(Math.min(o, c));
  return (
    <g opacity={dim ? 0.55 : 1}>
      <line x1={x} y1={y(h)} x2={x} y2={y(l)} stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <rect x={x - 3.4} y={top} width="6.8" height={Math.max(2, bot - top)} rx="1.8" fill={color} />
    </g>
  );
}

/*
 * 3연속 상승 뒤 2연속 조정.
 *
 * 아무 모양이나 그리면 "그래서 어쩌라고" 가 된다. 판단할 거리가 있는
 * 추세여야 "다음은 어떻게 될까" 라는 질문이 생긴다.
 */
const PAST = [
  { x: 9, o: 24, c: 38, h: 41, l: 21 },
  { x: 21, o: 38, c: 52, h: 55, l: 35 },
  { x: 33, o: 52, c: 68, h: 72, l: 49 },
  { x: 45, o: 68, c: 58, h: 71, l: 55 },
  { x: 57, o: 58, c: 49, h: 61, l: 46 },
];

/** ① 차트를 보고 다음이 오를지 내릴지 가늠한다 */
export function PredictIllust({ className }: P) {
  return (
    <svg viewBox="0 0 100 64" className={className} role="img" aria-label="차트와 아직 열리지 않은 다음 칸">
      {PAST.map((b) => (
        <Bar key={b.x} {...b} dim />
      ))}
      <rect x="66" y="6" width="18" height="52" rx="4" fill={ACCENT} opacity="0.1" />
      <rect x="66" y="6" width="18" height="52" rx="4" fill="none" stroke={ACCENT} strokeWidth="1.3" strokeDasharray="3 3" />
      <text x="75" y="38" textAnchor="middle" fontSize="17" fontWeight="800" fill={ACCENT}>
        ?
      </text>
    </svg>
  );
}

/** ③ 현금과 주식이 통째로 오간다 — 절반은 없다 */
export function AllInIllust({ className }: P) {
  return (
    <svg viewBox="0 0 100 64" className={className} role="img" aria-label="현금 전부가 주식으로, 주식 전부가 현금으로">
      <rect x="4" y="18" width="30" height="28" rx="8" fill="var(--color-warnweak)" stroke="var(--color-warn)" strokeWidth="1.2" />
      <text x="19" y="36" textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--color-warn)">
        현금
      </text>
      <rect x="66" y="18" width="30" height="28" rx="8" fill="var(--color-warnweak)" stroke="var(--color-warn)" strokeWidth="1.2" />
      <text x="81" y="36" textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--color-warn)">
        주식
      </text>
      {/* 양방향 — 살 때도 팔 때도 전부다 */}
      <path d="M40 26 h20" stroke="var(--color-warn)" strokeWidth="2" strokeLinecap="round" />
      <path d="M60 26 l-5 -3.2 l0 6.4 z" fill="var(--color-warn)" />
      <path d="M60 38 h-20" stroke="var(--color-warn)" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 38 l5 -3.2 l0 6.4 z" fill="var(--color-warn)" />
    </svg>
  );
}

/** ④ 30턴 뒤, 나와 존버를 나란히 세운다 */
export function CompareIllust({ className, labels = true }: P & { labels?: boolean }) {
  return (
    <svg viewBox="0 0 100 64" className={className} role="img" aria-label="나와 존버의 결과 비교">
      {labels && (
        <text x="4" y="24" fontSize="10" fontWeight="800" fill={MINT}>
          나
        </text>
      )}
      <rect x={labels ? 28 : 4} y="14" width={labels ? 56 : 80} height="13" rx="5" fill={MINT} />
      <circle cx="90" cy="20.5" r="7" fill={MINT} />
      <path d="M86.5 20.5 l2.5 2.5 l4.5 -4.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {labels && (
        <text x="4" y="49" fontSize="10" fontWeight="700" fill={INK3}>
          존버
        </text>
      )}
      <rect x={labels ? 28 : 4} y="39" width={labels ? 26 : 38} height="13" rx="5" fill={INK3} opacity="0.45" />
    </svg>
  );
}
