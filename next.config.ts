import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * 캔들 파일을 서버리스 번들에 명시적으로 넣는다.
   *
   * data.ts 는 파일 이름을 실행 중에 정한다(readdirSync 로 목록을 만든 뒤
   * readFileSync). Next 의 의존성 추적이 지금은 이 디렉터리를 알아서 찾아내지만,
   * 그건 정적 분석의 추측이지 보장이 아니다. 경로 계산 방식이 조금만 바뀌어도
   * 조용히 빠지고, 그러면 로컬은 멀쩡한데 배포에서만 "시작하기" 가 죽는다.
   * (확인: 이 설정 없이 빌드해도 지금은 포함되긴 한다 — 그래도 못 박아 둔다.)
   *
   * 문제를 뽑는 건 /api/session 하나뿐이라 거기에만 넣는다.
   */
  outputFileTracingIncludes: {
    '/api/session': ['./data/series/**'],
    /*
     * 공유 이미지의 한글 폰트. card.tsx 가 process.cwd() 기준으로 읽고 어디에서도
     * import 하지 않는다. 확인해보니 경로 조각이 전부 리터럴이라 지금은 추적이
     * 알아서 찾아내지만(설정 없이 빌드해도 들어간다), 캔들 데이터와 같은 이유로
     * 못 박아 둔다 — 빠지면 카톡 링크 미리보기와 '이미지 저장' 이 배포에서만 죽는다.
     */
    '/r/[id]/opengraph-image': ['./src/assets/**'],
    '/api/share/[id]/image': ['./src/assets/**'],
  },
};

export default nextConfig;
