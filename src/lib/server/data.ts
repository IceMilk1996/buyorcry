import fs from 'node:fs';
import path from 'node:path';
import { Interval, Puzzle, Series, WINDOW_SIZE } from '../game/types';
import { makePuzzle, validateWindow } from '../game/puzzle';

/**
 * 서버 전용 데이터 로더.
 *
 * data/series 는 394개 파일 54MB다. 전부 메모리에 올리면 안 되므로
 * 파일 목록만 인덱싱하고, 문제를 뽑을 때 필요한 파일 하나씩만 읽는다.
 */

const DIR = path.join(process.cwd(), 'data', 'series');

let index: Record<Interval, string[]> | null = null;
const cache = new Map<string, Series>();
const CACHE_MAX = 24;

function buildIndex(): Record<Interval, string[]> {
  if (index) return index;
  if (!fs.existsSync(DIR)) {
    throw new Error(
      'data/series 가 없습니다. 로컬 터미널에서 `npm run fetch` 를 먼저 돌리세요.'
    );
  }
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json'));
  index = {
    D: files.filter((f) => f.endsWith('_D.json')),
    W: files.filter((f) => f.endsWith('_W.json')),
  };
  return index;
}

function loadFile(name: string): Series {
  const hit = cache.get(name);
  if (hit) return hit;
  const s = JSON.parse(fs.readFileSync(path.join(DIR, name), 'utf8')) as Series;
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(name, s);
  return s;
}

/**
 * 필터를 통과하는 구간을 뽑는다.
 *
 * 봉 간격을 루프 밖에서 한 번만 고르는 이유는 puzzle.ts 의 pickPuzzle 과 같다 —
 * 루프 안에서 매번 고르면 통과율 높은 주봉이 계속 이겨서 편향이 남는다.
 */
export function pickPuzzleServer(
  rng: () => number,
  maxTries = 300
): { puzzle: Puzzle; series: Series } | null {
  const idx = buildIndex();
  const interval: Interval = rng() < 0.5 ? 'D' : 'W';
  const files = idx[interval].length > 0 ? idx[interval] : [...idx.D, ...idx.W];
  if (files.length === 0) return null;

  for (let i = 0; i < maxTries; i++) {
    const series = loadFile(files[Math.floor(rng() * files.length)]);
    const maxStart = series.candles.length - WINDOW_SIZE;
    if (maxStart <= 0) continue;
    const startIndex = Math.floor(rng() * maxStart);
    if (validateWindow(series.candles, startIndex, series.interval).ok) {
      return { puzzle: makePuzzle(series, startIndex), series };
    }
  }
  return null;
}

/** 한국 시간 기준 오늘 날짜 (데일리 문제의 시드) */
export function todayKST(): string {
  const now = new Date();
  return new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}
