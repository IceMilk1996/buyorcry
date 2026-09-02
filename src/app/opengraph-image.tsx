import fs from 'node:fs';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { loadFonts } from '@/lib/share/card';

export const runtime = 'nodejs';
export const alt = '살껄팔껄 — 존버를 이길 수 있을까';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * 홈 링크를 카톡·슬랙에 붙였을 때 뜨는 카드.
 *
 * 이 파일이 없으면 Next 는 og:* 태그를 아예 내보내지 않는다. 그래서 그동안
 * 홈 링크는 카톡에서 제목 한 줄에 "여기를 눌러 링크를 확인하세요" 만 떴다.
 * (결과 페이지 /r/[id] 는 opengraph-image 가 있어서 정상이었다.)
 *
 * satori 제약: flexbox 만, 자식이 둘 이상이면 display:flex 명시, 외부 CSS 없음.
 */

const INK = '#191f28';
const INK2 = '#4e5968';
const INK3 = '#8b95a1';
const ACCENT = '#0f7652';

let birdCache: string | null = null;

/**
 * 껄무새 그림을 data URI 로 박아 넣는다.
 *
 * 외부 URL 로 두면 카톡이 카드를 만드는 그 순간 우리 서버가 자기 자신에게
 * 요청을 넣어야 한다. 콜드 스타트 한 번이면 그림이 빠진 카드가 캐시되고,
 * 카톡 캐시는 우리가 못 지운다. 번들에 넣으면 그럴 일이 없다.
 */
function bird(): string {
  if (!birdCache) {
    const buf = fs.readFileSync(path.join(process.cwd(), 'src', 'assets', 'kkeolmusae.png'));
    birdCache = `data:image/png;base64,${buf.toString('base64')}`;
  }
  return birdCache;
}

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          display: 'flex',
          position: 'relative',
          background: '#ffffff',
          fontFamily: 'KR',
          fontWeight: 700,
        }}
      >
        {/* 왼쪽 가장자리 브랜드 띠 — 흰 카드가 카톡 배경에 녹지 않게 잡아준다 */}
        <div style={{ display: 'flex', width: 18, height: '100%', background: '#2fd39a' }} />

        {/*
          껄무새는 오른쪽 아래에 붙이고 카드 밖으로 조금 흘려보낸다.
          네모 안에 얌전히 담기면 삽화가 되고, 잘려 나가면 화면 밖에서
          고개를 들이민 것처럼 읽힌다.
        */}
        <img
          src={bird()}
          width={660}
          height={432}
          style={{ position: 'absolute', right: -34, bottom: -18 }}
          alt=""
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 72px',
          }}
        >
          <div style={{ display: 'flex', fontSize: 30, color: INK3, letterSpacing: 1 }}>
            살껄팔껄
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 16 }}>
            <div style={{ display: 'flex', fontSize: 78, color: INK, lineHeight: 1.18 }}>
              존버를
            </div>
            <div style={{ display: 'flex', fontSize: 78, color: ACCENT, lineHeight: 1.18 }}>
              이길 수 있을까?
            </div>
          </div>

          <div style={{ display: 'flex', marginTop: 26, fontSize: 32, color: INK2 }}>
            가려진 차트를 보고 다음 칸을 맞혀요
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: loadFonts() }
  );
}
