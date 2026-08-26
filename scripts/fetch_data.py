"""
코스피200 일봉 수집 -> data/series/{종목코드}.json

⚠️ 이 스크립트는 반드시 본인 맥 터미널에서 직접 실행하세요.
   Cowork 작업환경과 클라우드에서는 네이버/KRX 접근이 차단되어 있습니다.

사용법:
    python3 -m venv .venv && source .venv/bin/activate
    pip install -r scripts/requirements.txt
    python scripts/fetch_data.py --limit 200 --start 2015-01-01

출력: data/series/{종목코드}.json  (컬럼 포맷, 일봉만)
      주봉은 앱이 읽을 때 일봉에서 만든다 — src/lib/server/series.ts
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import pandas as pd
import FinanceDataReader as fdr

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "series"

# 인접봉 변동률이 이보다 크면 미조정 주가(액면분할 등)를 의심 — 기획서 6.2
SUSPECT_BAR_MOVE = 0.40
MIN_CANDLES = 300


def pick_column(df: pd.DataFrame, candidates: list[str]) -> str | None:
    for c in candidates:
        if c in df.columns:
            return c
    return None


def load_universe(limit: int) -> list[tuple[str, str]]:
    """(종목코드, 종목명) 리스트를 시가총액 순으로."""
    df = fdr.StockListing("KOSPI")
    code_col = pick_column(df, ["Code", "Symbol"])
    name_col = pick_column(df, ["Name"])
    cap_col = pick_column(df, ["Marcap", "MarketCap", "Marketcap"])

    if code_col is None or name_col is None:
        raise SystemExit(f"종목 리스트 컬럼을 찾지 못했습니다: {df.columns.tolist()}")

    if cap_col is not None:
        df = df.sort_values(cap_col, ascending=False)
    else:
        print("  시가총액 컬럼이 없어 원본 순서를 사용합니다.", file=sys.stderr)

    df = df.dropna(subset=[code_col, name_col]).head(limit)
    return [(str(r[code_col]).zfill(6), str(r[name_col])) for _, r in df.iterrows()]


def compact(x: float) -> float | int:
    """1000원 이상은 원 단위로 반올림. 그 위 호가 단위가 최소 5원이라 소수점이 무의미하다."""
    return int(round(x)) if x >= 1000 else round(x, 2)


def to_candles(df: pd.DataFrame) -> list[dict]:
    out = []
    for idx, r in df.iterrows():
        try:
            o, h, l, c = float(r["Open"]), float(r["High"]), float(r["Low"]), float(r["Close"])
        except (KeyError, TypeError, ValueError):
            continue
        if not all(v > 0 for v in (o, h, l, c)):
            continue
        out.append({
            "t": int(pd.Timestamp(idx).strftime("%Y%m%d")),
            "o": compact(o), "h": compact(h), "l": compact(l), "c": compact(c),
        })
    return out


def suspicious_bars(candles: list[dict]) -> list[tuple[int, float]]:
    """미조정 주가 의심 지점 — 눈으로 확인해야 하는 목록"""
    bad = []
    for i in range(1, len(candles)):
        prev, cur = candles[i - 1]["c"], candles[i]["c"]
        if prev <= 0:
            continue
        move = cur / prev - 1
        if abs(move) > SUSPECT_BAR_MOVE:
            bad.append((candles[i]["t"], move))
    return bad


def write_series(symbol: str, name: str, candles: list[dict]) -> None:
    """컬럼(배열 다발) 포맷으로 쓴다.

    캔들마다 객체를 쓰면 키 이름이 봉 수만큼 반복돼 197종목에 43MB 가 된다.
    같은 데이터가 컬럼 포맷이면 16MB 라서 깃 저장소에 그냥 올릴 수 있다.
    읽는 쪽은 src/lib/server/series.ts.
    """
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / f"{symbol}.json"
    path.write_text(
        json.dumps(
            {
                "s": symbol,
                "n": name,
                "t": [x["t"] for x in candles],
                "o": [x["o"] for x in candles],
                "h": [x["h"] for x in candles],
                "l": [x["l"] for x in candles],
                "c": [x["c"] for x in candles],
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=200)
    ap.add_argument("--start", default="2015-01-01")
    ap.add_argument("--sleep", type=float, default=0.2, help="종목 간 대기(초)")
    args = ap.parse_args()

    print(f"종목 리스트 로드 중... (상위 {args.limit}종목)")
    universe = load_universe(args.limit)
    print(f"  {len(universe)}종목\n")

    all_suspects: list[tuple[str, str, int, float]] = []
    ok = 0

    for i, (code, name) in enumerate(universe, 1):
        try:
            df = fdr.DataReader(code, args.start)
        except Exception as e:  # noqa: BLE001
            print(f"[{i:3}/{len(universe)}] {code} {name}: 실패 ({type(e).__name__})")
            continue

        if df is None or len(df) < MIN_CANDLES:
            print(f"[{i:3}/{len(universe)}] {code} {name}: 데이터 부족 ({0 if df is None else len(df)}봉)")
            continue

        daily = to_candles(df)

        write_series(code, name, daily)

        for t, move in suspicious_bars(daily):
            all_suspects.append((code, name, t, move))

        ok += 1
        print(f"[{i:3}/{len(universe)}] {code} {name}: 일봉 {len(daily)}")
        time.sleep(args.sleep)

    print(f"\n완료: {ok}종목 -> {OUT_DIR}")

    if all_suspects:
        print(f"\n⚠️  인접봉 {int(SUSPECT_BAR_MOVE*100)}% 초과 변동 {len(all_suspects)}건")
        print("   진짜 급등락인지 미조정 주가(액면분할 등)인지 확인하세요.")
        print("   필터가 SUSPECT_UNADJUSTED로 걸러내지만, 건수가 많으면 수정주가가 아닐 수 있습니다.\n")
        for code, name, t, move in all_suspects[:30]:
            print(f"   {code} {name:12} {t}  {move*100:+.1f}%")
        if len(all_suspects) > 30:
            print(f"   ... 외 {len(all_suspects)-30}건")
    else:
        print("\n✅ 인접봉 급변동 없음 — 수정주가로 보입니다.")


if __name__ == "__main__":
    main()
