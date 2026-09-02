import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "살껄팔껄 — 존버를 이길 수 있을까",
  description:
    "무슨 회사인지 언제인지 가린 차트를 한 칸씩 넘기면서 사고팔고, 끝나면 그냥 사두고 가만히 있었을 때와 비교당하는 게임.",
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
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/*
          테마를 첫 칠하기 전에 정한다.
          React 가 붙은 뒤에 정하면 라이트로 한 프레임 번쩍인 다음 다크로
          바뀐다. 그래서 <head> 안에서 동기로 실행되는 인라인 스크립트로
          html[data-theme] 을 먼저 박아둔다. CSS 는 그것만 본다.
          '시스템' 을 고른 사람은 OS 설정이 바뀌면 즉시 따라가야 하므로
          여기서 바로 구독까지 걸어둔다 — 플레이 화면에는 메뉴가 없어서
          컴포넌트에 두면 그 화면에서만 안 따라간다.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var K='buyorcry:theme';var m=window.matchMedia('(prefers-color-scheme: dark)');
function get(){try{var v=localStorage.getItem(K);return v==='light'||v==='dark'?v:'system'}catch(e){return 'system'}}
function put(){var p=get();document.documentElement.dataset.theme=(p==='dark'||(p==='system'&&m.matches))?'dark':'light'}
put();m.addEventListener('change',put)})()`,
          }}
        />
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
