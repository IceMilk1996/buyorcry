import fs from 'node:fs';
import path from 'node:path';
import { Action } from '../game/types';

/**
 * 공유 이미지(OG 카드 · 저장용 이미지)의 그림.
 *
 * satori(next/og)가 그리므로 제약이 있다 — flexbox만 되고, 자식이 둘 이상이면
 * display:flex 를 반드시 명시해야 하며, 외부 CSS가 없어 전부 인라인 스타일이다.
 * 마스코트도 SVG 대신 div로 그린다.
 *
 * ⚠️ 여기에 종목명·기간·차트를 넣지 말 것. 아직 안 푼 사람의 게임이 끝난다.
 *    공개하는 성적은 알파 하나뿐이다 (share.ts 주석 참조).
 */

const UP = '#f04452';
const DOWN = '#3182f6';
const INK = '#191f28';
const INK3 = '#8b95a1';

/**
 * 지금 이 서버가 어떤 주소로 불렸는지.
 *
 * 환경변수로 받지 않는 이유: NEXT_PUBLIC_ 값은 빌드 시점에 코드에 박혀서,
 * 배포 후에 안 바꾸면 공유 이미지에 localhost 가 찍힌다.
 * 헤더에서 읽으면 설정할 것도 없고 틀릴 수도 없다.
 */
export function originFromHeaders(h: Headers): string {
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'buyorcry';
  return host;
}

let fontCache: Buffer | null = null;

/**
 * 한글 폰트를 번들에 넣어뒀다. 런타임에 외부 요청이 없어 오프라인에서도 동작하고,
 * 폰트 CDN이 죽어도 이미지가 깨지지 않는다.
 *
 * 상용 한글 2,350자(KS X 1001) 전체를 담았다. 쓰는 글자만 추리면 380KB가 60KB가 되지만,
 * 나중에 문구를 한 글자만 바꿔도 그 글자가 □ 로 나온다. 실제로 한 번 그렇게 깨졌다.
 */
export function loadFonts() {
  if (!fontCache) {
    fontCache = fs.readFileSync(path.join(process.cwd(), 'src', 'assets', 'og-kr-bold.ttf'));
  }
  return [{ name: 'KR', data: fontCache, weight: 700 as const, style: 'normal' as const }];
}

export type CardProps = {
  alpha: number;
  rankLabel: string;
  actions: Action[];
  width: number;
  height: number;
  origin: string;
  /**
   * og  = 카톡·슬랙 링크 미리보기. 카드 자체가 눌리는 것이라 행동 유도 문구가 맞다.
   * save = 저장·전송용 그림. 누를 게 없으므로 버튼 말투 대신 말을 거는 문장을 둔다.
   */
  variant: 'og' | 'save';
};

export function ShareCard({ alpha, rankLabel, actions, width, height, origin, variant }: CardProps) {
  const win = alpha >= 0;
  const accent = win ? UP : DOWN;
  const pct = `${alpha >= 0 ? '+' : ''}${(alpha * 100).toFixed(1)}%`;
  /*
   * 가로형(1200×630)과 정사각형(1080×1080)을 같은 그림으로 그린다.
   * 두 배치는 내용이 차지하는 폭·높이가 달라서 배율 기준도 달라야 한다.
   * 짧은 변 하나로만 잡으면 정사각형에서 잘리거나(너무 큼) 휑해진다(너무 작음).
   */
  const wide = width / height > 1.4;
  const scale = wide
    ? Math.min(width / 1200, height / 700)
    : Math.min(width / 900, height / 860);
  const s = (n: number) => Math.round(n * scale);
  const domain = origin.replace(/^https?:\/\//, '');

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: wide ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s(wide ? 70 : 24),
        padding: s(56),
        background: win ? '#fff5f6' : '#f2f7ff',
        fontFamily: 'KR',
        fontWeight: 700,
      }}
    >
      <Mascot color={accent} happy={win} size={s(wide ? 260 : 200)} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: wide ? 'flex-start' : 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: s(10) }}>
          {/*
            satori 는 mask 를 못 그린다. 구멍을 뚫는 대신 배경색으로 칠한 판을 쓴다.
            (Logo.tsx 의 LogoPainted 와 같은 도형)
          */}
          <Bird size={s(34)} color={accent} hole={win ? '#fff5f6' : '#f2f7ff'} />
          <div style={{ display: 'flex', fontSize: s(26), fontWeight: 700, color: INK3, letterSpacing: s(1) }}>
            살껄팔껄
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: s(14), fontSize: s(40), fontWeight: 700, color: INK }}>
          존버보다
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: s(12), marginTop: s(2) }}>
          <span style={{ fontSize: s(112), fontWeight: 700, color: accent, lineHeight: 1 }}>{pct}</span>
          <span style={{ fontSize: s(40), fontWeight: 700, color: INK }}>
            {win ? '잘했어요' : '못했어요'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: s(22),
            padding: `${s(10)}px ${s(24)}px`,
            borderRadius: s(999),
            background: '#fff',
            fontSize: s(28),
            fontWeight: 700,
            color: INK,
          }}
        >
          {rankLabel}
        </div>

        <div style={{ display: 'flex', gap: s(8), marginTop: s(26) }}>
          {actions.map((a, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                width: s(34),
                height: s(34),
                borderRadius: s(10),
                background: a === 'BUY' ? UP : a === 'SELL' ? DOWN : '#dfe3e8',
              }}
            />
          ))}
        </div>

        {variant === 'og' ? (
          <div style={{ display: 'flex', marginTop: s(28), fontSize: s(24), color: INK3 }}>
            {domain} · 나도 해보기
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: s(30),
            }}
          >
            <div style={{ display: 'flex', fontSize: s(30), color: INK }}>
              존버를 이길 수 있을까?
            </div>
            <div style={{ display: 'flex', marginTop: s(8), fontSize: s(22), color: INK3 }}>
              {domain}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** 봉이 — satori가 SVG를 완전히 지원하지 않아 div로 그린다 */
function Mascot({ color, happy, size }: { color: string; happy: boolean; size: number }) {
  const w = size;
  const h = Math.round(size * 1.25);
  const bodyW = Math.round(w * 0.62);
  const bodyH = Math.round(h * 0.5);
  const eye = Math.round(w * 0.075);

  return (
    <div style={{ display: 'flex', position: 'relative', width: w, height: h }}>
      {/* 심지 */}
      <div
        style={{
          position: 'absolute',
          left: Math.round(w / 2 - w * 0.045),
          top: 0,
          width: Math.round(w * 0.09),
          height: h,
          borderRadius: w,
          background: color,
          opacity: 0.9,
        }}
      />
      {/* 몸통 */}
      <div
        style={{
          position: 'absolute',
          left: Math.round((w - bodyW) / 2),
          top: Math.round(h * 0.26),
          width: bodyW,
          height: bodyH,
          borderRadius: Math.round(bodyW * 0.33),
          background: color,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Math.round(h * 0.035),
        }}
      >
        <div style={{ display: 'flex', gap: Math.round(bodyW * 0.28) }}>
          <div style={{ width: eye, height: Math.round(eye * (happy ? 0.45 : 1.2)), borderRadius: eye, background: '#fff' }} />
          <div style={{ width: eye, height: Math.round(eye * (happy ? 0.45 : 1.2)), borderRadius: eye, background: '#fff' }} />
        </div>
        <div
          style={{
            width: Math.round(bodyW * (happy ? 0.3 : 0.26)),
            height: Math.round(eye * (happy ? 0.75 : 0.32)),
            borderRadius: eye,
            background: '#fff',
          }}
        />
      </div>
    </div>
  );
}

/** 껄무새 — 공유 이미지용. 마스크 없이 배경색으로 구멍을 칠한다 */
function Bird({ size, color, hole }: { size: number; color: string; hole: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96">
      <rect x="28" y="15" width="54" height="66" rx="26" fill={color} />
      <path
        d="M47 28 C35 28, 23 32, 17 40 C13 46, 14 55, 20 56 C24 56, 24 51, 27 48 C33 43, 41 43, 47 44 Z"
        fill={color}
      />
      <path
        d="M44 46 C36 45, 28 48, 24 52 C21 56, 22 62, 27 65 C33 68, 41 66, 44 60 C46 55, 45 50, 44 46 Z"
        fill={hole}
      />
      <circle cx="58" cy="37" r="6.5" fill={hole} />
    </svg>
  );
}
