import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "차트게임 — 존버를 이길 수 있을까",
  description:
    "종목명과 시기를 가린 과거 차트를 한 봉씩 넘기며 매매하고, 끝나면 그냥 들고 있었을 때와 비교당하는 게임.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#17171c" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {/* Pretendard — 한국어 웹에서 사실상 표준. 못 받아오면 Apple SD Gothic Neo로 떨어진다 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full">
        {/* 모바일 앱처럼 보이도록 폭을 제한하고 가운데 정렬 */}
        <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
