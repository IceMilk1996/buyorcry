import { ImageResponse } from 'next/og';
import { compressActions, getShare } from '@/lib/server/share';
import { ShareCard, loadFonts, originFromHeaders } from '@/lib/share/card';

export const runtime = 'nodejs';

/**
 * 저장·전송용 정사각 이미지.
 * OG 카드와 같은 그림을 쓰므로 디자인이 두 곳에서 갈라지지 않는다.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const rec = getShare(id);
  const origin = originFromHeaders(req.headers);
  if (!rec) return new Response('not found', { status: 404 });

  const size = { width: 1080, height: 1080 };
  return new ImageResponse(
    (
      <ShareCard
        alpha={rec.alpha}
        rankLabel={rec.rank.label}
        actions={compressActions(rec.actions)}
        width={size.width}
        height={size.height}
        origin={origin}
        variant="save"
      />
    ),
    {
      ...size,
      fonts: loadFonts(),
      headers: {
        'Content-Disposition': `attachment; filename="buyorcry-${id}.png"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }
  );
}
