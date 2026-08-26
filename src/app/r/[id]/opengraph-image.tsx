import { ImageResponse } from 'next/og';
import { getShare, compressActions } from '@/lib/server/share';
import { ShareCard, loadFonts, originFromHeaders } from '@/lib/share/card';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const alt = '차트게임 결과';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** 카톡·슬랙에 링크를 붙이면 뜨는 미리보기 카드 */
export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rec = getShare(id);
  const origin = originFromHeaders(await headers());

  return new ImageResponse(
    (
      <ShareCard
        alpha={rec?.alpha ?? 0}
        rankLabel={rec?.rank.label ?? '존버와 동급'}
        actions={compressActions(rec?.actions ?? [])}
        width={size.width}
        height={size.height}
        origin={origin}
        variant="og"
      />
    ),
    { ...size, fonts: loadFonts() }
  );
}
