# unidream-demo-web

UniDream のライブデモ。Next.js のフロントエンドと Supabase Edge Function を組み合わせて、15 分ごとに [unidream-space](../unidream-space) の HF Spaces 推論 API を叩き、仮想ペーパートレードの結果を表示する。現行モデルは Plan011 v31 neural overlay actor。Transformer WM -> BC -> AC の実モデル推論で、B&H=1.0 近傍の小さな continuous exposure を返す。

```
Binance spot closed klines (15m) + USDⓈ-M Futures mark/funding
    ↓
Supabase Cron (15m)
    ↓
Edge Function: run-unidream-inference
    ↓ 7248 candles = 60d window + feature warmup
HF Space /predict (Plan011 v31 fold23)
    ↓
Supabase: predictions / strategy_state / equity_snapshots / trades
    ↓
Next.js page (Realtime subscribe)
```

フロントエンドはモデルを持たないし、HF Spaces を直接叩くこともしない。画面上にも「research demo, not financial advice」のディスクレーマを出している。

## 推論データと時刻の契約

`run-unidream-inference` が HF Space の `/predict` に送る各 `candles` 行は、
Spot の **完全に close 済み**の 15 分足 OHLCV (`timestamp`, `open`, `high`, `low`, `close`, `volume`) に、
USDⓈ-M Futures の `funding_rate` と `mark_close` を必ず加えたもの。派生データが欠けた場合は
ゼロや `null` で補完せず、Edge Function は `/predict` を呼ばずに失敗する。

- Spot OHLCV は 1 回の `fetchCandles` 呼び出し開始時に固定した observation cutoff を使い、
  `closeTime <= cutoff` の完全足だけを `TARGET_BARS` 本になるまで古い方向へページングする。
  リクエストの `endTime` は直前ページの最古の open time より 1 ms 前に進め、重複を除去した後、
  15 分間隔の連続性も検証する。現在進行中の足 (`closeTime > cutoff`) は除外される。
- `mark_close` は `GET /fapi/v1/markPriceKlines` の mark kline の close を、Spot 行と同じ
  open-time に対して完全一致で結合する。別の時刻の mark 行を forward/back fill しない。
- `funding_rate` は `GET /fapi/v1/fundingRate` の `fundingTime` が candle の timestamp 以下である
  行のうち、最も新しいものを使う。最初の candle より前の as-of 行を先に取得してから、観測範囲の
  履歴をページングするため、後から公表された funding を過去の candle に使わない。
- Space 側の Plan011 feature pipeline が、この raw derivative 入力から `funding_rate`、`basis`、
  `basis_mom`、`basis_abs` を生成する。学習時と同じ `shift(1)` の特徴量タイミングは Space 側で
  維持される。

### Observation cutoff と paper fill

`fetchCandles` は呼び出し開始時に observation cutoff (`Date.now()`) を 1 回だけ固定する。
Binance の kline `closeTime` が cutoff と **同時刻またはそれ以前**なら完全足として採用し、cutoff より
後なら現在進行中の partial observation として除外する。従って prediction window の `latest` は常に
最後の完全足であり、その足の `close` を `/predict` と後続処理に使う。

paper fill は Space 推論後に同じ `latest.close` / `latest.timestamp` を使って計算するが、DB の
`created_at` が記録されるのは RPC transaction の実行時である。`latest.timestamp` は bar の open 時刻、
RPC の実行時刻は paper fill の観測・記録時刻であり、実際の取引所約定時刻や candle completion 時刻を
装わない。`shift(1)` の特徴量タイミングとこの cutoff は別の契約として扱う。

### 参照した公式仕様

- [Binance Spot Kline/Candlestick data](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints)
- [Binance USDⓈ-M Kline/Candlestick data](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Kline-Candlestick-Data)
- [Binance USDⓈ-M Mark Price Kline/Candlestick data](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Mark-Price-Kline-Candlestick-Data)
- [Binance USDⓈ-M Funding Rate History](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Get-Funding-Rate-History)
- [Binance USDⓈ-M general API information and IP limits](https://developers.binance.com/docs/derivatives/usds-margined-futures/general-info)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)、[Supabase RPC](https://supabase.com/docs/reference/javascript/rpc)、[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)、[Supabase changelog](https://supabase.com/changelog.md)

## ディレクトリ構成

画面単位の責務を `features/` にまとめ、App Router の page はルートの入口だけを担当する。

```
src/
  app/
    page.tsx                         ライブダッシュボードの SSR 入口
    homepage/page.tsx                マーケティングページのルート入口
    homepage/contact/page.tsx        お問い合わせページのルート入口
    globals.css                      全画面のテーマとレスポンシブスタイル
  features/
    marketing/
      MarketingPage.tsx              ヒーロー、研究、検証、デモ、CTA の構成
      ContactPage.tsx                お問い合わせ画面
      data.ts                         ナビ、メトリクス、研究パイプラインの表示データ
      components/
        SiteChrome.tsx               ヘッダー、ブランド、リンク、フッター
        ResearchPipeline.tsx          研究パイプラインの表示
    dashboard/
      components/
        Dashboard.tsx                Realtime 表示とチャート範囲の状態
        PerformanceChart.tsx         recharts のラインチャート
        StatCard.tsx / MetricsRow.tsx
        PositionGauge.tsx / LongShortBar.tsx
        TradesTable.tsx / Countdown.tsx
      hooks/
        useLiveDashboard.ts           Supabase Realtime の購読と画面状態
  lib/
    supabase.ts                       ブラウザ用クライアント (publishable key)
    server/dashboardRepository.ts    SSR の初期データ取得
    types.ts                          テーブル行の型 + run_id 定数
    contract.ts                       model / schema / parity / cutoff / atomic / cost の表示契約
    format.ts / aggregate.ts / metrics.ts
supabase/
  migrations/
    0001_predictions.sql        推論ログ
    0002_strategy_state.sql     strategy_state / equity_snapshots / trades
    0003_atomic_inference.sql   4 表を 1 transaction で commit する RPC と冪等性制約
  functions/
    _shared/
      config.ts            Edge / backfill 共通の現行定数
      paper_trading.ts     純粋な約定・position clamp
    run-unidream-inference/
      index.ts                  推論ジョブのオーケストレーション
      binance.ts                Binance candle取得
      inference.ts              HF Space API呼び出し
      config.ts                 Edge環境変数とAPI用設定
      atomic.ts                 CAS付き atomic RPC payload / 応答
scripts/
  backfill-history.ts           共通paper-tradingを使う過去データ replay
```

## テーブル

- `predictions` — 推論ごとの生出力ログ（run_id, signal, position, latest_close, model_version, raw jsonb など）。`(run_id, latest_timestamp)` が UNIQUE
- `strategy_state` — `run_id` ごとに 1 行。現在の cash / asset_qty / equity / current_position / last_timestamp を保持。マイグレーションで初期行をシード
- `equity_snapshots` — 処理した 15 分足ごとに 1 行。資産推移チャートのデータ源。`(run_id, timestamp)` で UNIQUE を張ってあるので再実行しても安全
- `trades` — `target_position` が前回と変わったときだけ追記。`(run_id, timestamp)` が UNIQUE。
  `fee` は旧 DB 列名だが、現在は fee だけでなく half-spread と slippage を含む all-in の quote コストを格納する

Edge Function とフロントの両方が共通で使う run_id:
`unidream_btcusdt_15m_main`（初期 cash 10,000 USDT、ポジションなし）

## フロントエンドのセットアップ

`.env.local`（`.env.local.example` をコピーして作る）:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxx
```

`sb_secret_...` や `HF_INFERENCE_API_KEY` を `.env.local` に入れないこと。両方ともブラウザに漏れる。これらは Edge Function の secret 側に入れる。

```powershell
npm install
npm run dev
```

`http://localhost:3000` でライブダッシュボード、`http://localhost:3000/homepage` で新しいマーケティング画面を開く。

## Supabase のセットアップ

マイグレーション適用（Studio の SQL editor または `supabase db push`）。`0001` → `0002` → `0003`
の順で適用し、`0003` を成功させてから Edge Function をデプロイする:

```powershell
supabase link --project-ref YOUR-PROJECT-REF
supabase db push
```

`0003_atomic_inference.sql` は既存 `predictions.run_id` を canonical run に backfill してから、
`(run_id, latest_timestamp)` と `(run_id, timestamp)` の UNIQUE index を作る。既存重複がある場合は
履歴を削除せず migration 全体を失敗させるので、下記の確認クエリで整理してから再実行する。

Edge Function の secrets を設定。Supabase CLI は `SUPABASE_` で始まる名前を弾くので、プロジェクト URL/キーは `PROJECT_*` という名前で入れている:

```powershell
supabase secrets set PROJECT_URL=https://YOUR-PROJECT.supabase.co
supabase secrets set PROJECT_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxxx
supabase secrets set HF_SPACE_URL=https://shinjiaa-unidream-space.hf.space
supabase secrets set HF_INFERENCE_API_KEY=<HF Space 側の INFERENCE_API_KEY と同じ値>
```

デプロイして 1 回叩いてみる:

```powershell
supabase functions deploy run-unidream-inference
supabase functions invoke run-unidream-inference
```

Edge は state の読み取りと Space 推論の後、`record_unidream_inference` RPC を 1 回だけ呼ぶ。
RPC は `strategy_state` の対象行を `FOR UPDATE` で直列化し、期待 state の CAS を検証してから
`predictions` / `strategy_state` / `equity_snapshots` / `trades` を同一 transaction で書く。同じ
`(run_id, latest_timestamp)` の再送は `already_processed` として安全に skip、stale state や
既存の部分行は SQLSTATE `40001`（Edge HTTP 409）で fail closed する。

成功するとこういう JSON が返る:

```json
{
  "ok": true,
  "candles": 7248,
  "prediction": { "signal": "...", "raw_position": 1.006, "target_position": 1.006, ... },
  "state":      { "equity": 10000.0, "cash": -60.0, "asset_qty": 0.012, "position": 1.006 },
  "traded": true
}
```

DB に行が入っているか確認:

```sql
select latest_timestamp, created_at, signal, position, latest_close, model_version
from predictions order by latest_timestamp desc nulls last limit 1;

select * from strategy_state where id = 'unidream_btcusdt_15m_main';

select timestamp, equity, position, price
from equity_snapshots where run_id = 'unidream_btcusdt_15m_main'
order by timestamp desc limit 5;

select timestamp, created_at, from_position, to_position, price, trade_notional, fee
from trades where run_id = 'unidream_btcusdt_15m_main'
order by timestamp desc limit 5;
```

### Atomic inference の deploy / rollback / observability

- **Deploy**: まず `supabase db push` で `0003` を適用し、成功後に
  `supabase functions deploy run-unidream-inference` を実行する。Studio で適用する場合も同じ
  migration 全体を 1 回で実行する。`service_role` だけに RPC `EXECUTE` を許可し、`anon` /
  `authenticated` には 4 表への write 権限も RPC 権限も与えない。
- **Rollback**: `0003` に自動 down migration は用意しない。preflight の重複エラーなどで適用が
  失敗した場合は transaction が戻るため、重複を確認して再実行する。適用後の緊急時は Cron を
  一時停止してから互換性のある Edge revision を戻し、RPC / UNIQUE index / `run_id` を Edge が
  動いている状態で drop しない。DB 側を戻す必要がある場合はバックアップとレビュー済み SQL を
  使い、復旧後に atomic revision を再デプロイする。
- **Observability**: Edge のログで `already_processed`（重複 skip）、HTTP 409 / SQLSTATE `40001`
  （競合・部分行）、HTTP 500（市場データ / Space / RPC の予期せぬ失敗）を分けて監視する。最新
  状態と書き込み進行は次で確認できる。

```sql
select id, last_timestamp, updated_at
from strategy_state where id = 'unidream_btcusdt_15m_main';

select run_id, latest_timestamp, count(*)
from predictions
where run_id = 'unidream_btcusdt_15m_main'
group by run_id, latest_timestamp having count(*) > 1;

select run_id, timestamp, count(*)
from trades
where run_id = 'unidream_btcusdt_15m_main'
group by run_id, timestamp having count(*) > 1;
```

Supabase Cron でスケジュール（毎時 1, 16, 31, 46 分に発火）:

```sql
select cron.schedule(
  'unidream-15m',
  '1,16,31,46 * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR-PROJECT.functions.supabase.co/run-unidream-inference',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object()
  );
  $$
);
```

Authorization ヘッダの渡し方はプロジェクトでの service role key の見せ方に合わせて調整。Edge Function 側は JWT を要求しない。

## 過去データの backfill

ライブ Cron だけだと履歴が空のままなので、初回だけローカルから過去 60 日ぶんの 15m candles を replay して `predictions` / `trades` / `equity_snapshots` / `strategy_state` を埋める用のスクリプトを用意した。Plan011 v31 の推論には 60日 window とは別に 1488 本の feature warmup が必要なので、実際の `/predict` には各 step で 7248 本を渡す。

[scripts/backfill-history.ts](scripts/backfill-history.ts) は Edge Function と同じ closed-candle / derivative join / Plan011 raw-candle payload / 共通 paper-trading ロジックを再利用する（`run_id = unidream_btcusdt_15m_main`, `INITIAL_CASH = 10_000`, `ALLOW_SHORT = false`, `MAX_TARGET_POSITION = 1.12`）。各 replay step は `record_unidream_inference` RPC 1 回で predictions / strategy_state / equity_snapshots / trades を同一 transaction に commit する。`--reset` の削除・初期化だけは、ローカルの service key を使う管理用保守操作であり replay write path ではない。

セットアップ:

```powershell
# 1. .env.backfill を作る (gitignore 済み)
copy .env.backfill.example .env.backfill
# 中身を埋める:
#   PROJECT_URL
#   PROJECT_SECRET_KEY        ← service-role / sb_secret_...
#   HF_SPACE_URL
#   HF_INFERENCE_API_KEY

# 2. 依存をインストール (tsx と dotenv)
npm install
```

実行:

```powershell
# 既存履歴をクリアして 60 日ぶんを最初から replay
npm run backfill -- --reset

# 表示期間を狭めたいときは --days
npm run backfill -- --reset --days 30

# 動作確認だけしたいときは --max-steps
npm run backfill -- --reset --max-steps 200
```

スクリプトの動き:

1. `--reset` 指定時は run_id に紐づく `predictions` / `trades` / `equity_snapshots` を削除し、`strategy_state` を初期値で再シード
2. Binance public Spot OHLCV と USDⓈ-M Futures mark/funding から、replay 期間 + Plan011 context ぶんの **完全 close 済み** 15m candles を取得（デフォルトなら ~135.5日 = 60日 replay + 75.5日 context）。各 `/predict` 行には `funding_rate` と `mark_close` も必ず含める
3. **Probe フェーズ**: replay 範囲から 20 個の index を均等サンプリングして HF `/predict` を叩き、`target_position` の unique 値をログに出す。全部 `1.0` だった場合は「trades 履歴は増えない」と warn を出す
4. **Replay フェーズ**: Plan011 context（7248 本）以降の各 step で、直近 7248 本の candle を /predict に POST。クランプ後の position と前回 state から payload を作り、`record_unidream_inference` RPC を 1 回呼ぶ。DB の 4 表は RPC 内で同一 transaction に書かれるため、アプリ側のバッファ flush は行わない
5. すべて終わった時点で最後に成功した RPC の state が canonical state になっている（以降のライブ Cron はその続きから動く）

注意:

- HF Spaces は 1 リクエスト数秒かかるので、60 日 replay は長時間実行になる。所要時間は probe フェーズの平均レイテンシから推定値を表示する
- 同じ candle を二重処理しないよう `latest.openTimeMs <= strategy_state.last_timestamp` の step はスキップ
- bar の時刻は `predictions.latest_timestamp` / `equity_snapshots.timestamp` であり、`predictions.created_at` は RPC transaction の記録時刻。履歴の並びや最新 prediction の選択は bar 時刻を使う
- 途中で Ctrl+C しても完了済み RPC transaction は DB に入っている。再開したいときは `--reset` を付けずにもう一度叩けば、`last_timestamp` 以降だけ続きから処理される
- ライブ Cron が動いている最中に backfill を走らせると `strategy_state` の取り合いになるので、Cron は止めてから流すこと

## Dashboard の比較・コスト契約

デモの quote-currency コストは研究系の既定値に固定している。

- `fee_rate = 0.0003`（3 bps）
- `spread_bps = 3`（full spread。position change ごとに half-spread 1.5 bps）
- `slippage_bps = 1`（position delta に適用）

コストは `abs(position_delta) * equity_at_price` を notional base として、fee + half-spread + slippage の順に計算する。10,000 USDT の flat → 1.0 初回 entry は 3.0 + 1.5 + 1.0 = **5.5 USDT**。戦略の live fill は flat → 実際の target、B&H benchmark は flat → 1.0 へ入り、同じ cost model と初期 flat-state convention を対称に適用する。`trades.fee` は互換性のため残した DB 列名であり、UI では **cost (USDT)** と表示する。

画面の期間指標は選択した最初の snapshot から最後の snapshot までの window 値である。

- Return / Alpha は最初の表示 bar から最後までの window 比率で、one-time initial entry cost は含めない（B&H return は spot price ratio、net B&H curve は絶対 equity / MaxDD 用）
- MaxDD は research と同じ負の比率（例 `-10%`）。`MaxDD Δ = abs(strategy) - abs(B&H)` なので負値が改善
- Sharpe は 15 分足の log return と population volatility を `35040 = 96 × 365` で年率化する
- Position turnover は quote notional ではなく、隣接 snapshot の `sum(abs(Δposition))`。research の action stats と同じく合成初回 entry は含めない

画面の `Inference contract` バッジは model / 17-feature schema / research parity inputs / derivative join / closed-candle cutoff / atomic RPC / costs を表示する。ただし現行の public table には row 単位の provenance が保存されていないため、バッジは **source-configured** の契約表示であり、HF / Binance / Supabase の live health check やデプロイ revision の証明ではない。`Last closed bar`（観測 bar 時刻）と `recorded`（RPC 記録時刻）も分けて表示する。

## Vercel デプロイ

このリポジトリ（[shinji-ogasa/unidream-demo-web](https://github.com/shinji-ogasa/unidream-demo-web)）をそのまま Vercel に import すれば動く。

ざっくりの流れ:

1. https://vercel.com/new でこの repo を Import
2. Framework Preset は **Next.js** で自動検出されるのでそのまま
3. Environment Variables にフロント用の 2 つだけ入れる:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **Production / Preview / Development の全部にチェック**を入れておくと楽
4. Deploy → Vercel が `npm install && npm run build` を回す

注意点:

- `sb_secret_...` や `HF_INFERENCE_API_KEY` は Vercel に **絶対入れない**。これは Supabase secrets の領分
- `main` に push すれば自動で再デプロイされる
- `app/page.tsx` は `dynamic = "force-dynamic"` 指定済みなので、毎回 Supabase から最新を取りに行く（ビルド時にキャッシュされない）
- Realtime は publishable key とブラウザだけで完結するので、Vercel 側で追加の設定はいらない
- カスタムドメインを付けるなら Vercel ダッシュボードの Settings → Domains から普通に

## 動作メモ

- **二重処理防止**：Edge Function は最後の完全 close 済み足だけを対象にし、`strategy_state.last_timestamp` が新しくなければスキップ。新規処理は RPC の `FOR UPDATE` + CAS と `(run_id, latest_timestamp)` / `(run_id, timestamp)` の UNIQUE index で直列化・冪等化する
- **ポジション解釈**：`target_position` は B&H=1.0 を基準にしたエクスポージャー倍率。Plan011 v31 は continuous overlay を返すため、デモ側は最大 `1.12` まで許可している。マイナスは関数内の `ALLOW_SHORT = false` で flat に潰している。Space 側がショート対応したらフラグを立てる
- **手数料・スリッページ**：live / backfill とも `fee_rate = 0.0003`, `spread_bps = 3`（half 1.5 bps）, `slippage_bps = 1`。各 position delta に対する all-in quote cost を state の cash から控除する。研究repo側の評価 JSON では同じ既定値を基準に cost stress (`cost_x1` / `cost_x2` / `cost_x3`) を別途見る
- **初期 entry の比較**：live strategy は flat state から最初の target position に入る際のコストを負担し、dashboard の B&H も flat → 1.0 の同じ初期 entry cost を負担する。期間指標の return は選択 window 内の最初の bar 基準、chart の絶対 equity は初期 cash から表示するので、両者の convention を混同しない
- **初期状態**：マイグレーション `0002` で `strategy_state` を初期 cash 10,000 USDT・flat でシード。デモをリセットしたいときは:
  ```sql
  delete from trades            where run_id = 'unidream_btcusdt_15m_main';
  delete from equity_snapshots  where run_id = 'unidream_btcusdt_15m_main';
  update strategy_state set
    current_position = 0, cash = 10000, asset_qty = 0, equity = 10000,
    last_price = null, last_timestamp = null, updated_at = now()
  where id = 'unidream_btcusdt_15m_main';
  ```
- **predictions ログ**：Cron は売買が発生しなくても毎回 `predictions` に 1 行入れているので、ハートビートも兼ねている

## ローカル開発の安全策

- `.env.local` は gitignore 済み。コミットしていいのは `.env.local.example` だけ
- ブラウザは publishable key しか持たず、RLS で読み取り専用。INSERT はすべて Edge Function 側の service-role key からのみ
- フロントから HF Spaces を直接叩くことはない
