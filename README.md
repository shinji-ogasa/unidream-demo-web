# unidream-demo-web

UniDream のライブデモ。Next.js のフロントエンドと Supabase Edge Function を組み合わせて、15 分ごとに [unidream-space](../unidream-space) の HF Spaces 推論 API を叩き、仮想ペーパートレードの結果を表示する。現行モデルは Plan011 v31 neural overlay actor。Transformer WM -> BC -> AC の実モデル推論で、B&H=1.0 近傍の小さな continuous exposure を返す。

```
Binance klines (15m)
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

## ディレクトリ構成

```
src/
  app/
    layout.tsx
    page.tsx              SSR で初期データ取得 + <Dashboard/>
    globals.css
  components/
    Dashboard.tsx         Realtime 購読 + レイアウト
    PerformanceChart.tsx  recharts のラインチャート
    StatCard.tsx
    TradesTable.tsx
  lib/
    supabase.ts           ブラウザ用クライアント (publishable key)
    types.ts              テーブル行の型 + run_id 定数
    format.ts
supabase/
  migrations/
    0001_predictions.sql        推論ログ
    0002_strategy_state.sql     strategy_state / equity_snapshots / trades
  functions/
    run-unidream-inference/
      index.ts                  Deno Edge Function
scripts/
  backfill-history.ts           ローカル実行用の過去データ replay スクリプト
```

## テーブル

- `predictions` — 推論ごとの生出力ログ（signal, position, latest_close, model_version, raw jsonb など）
- `strategy_state` — `run_id` ごとに 1 行。現在の cash / asset_qty / equity / current_position / last_timestamp を保持。マイグレーションで初期行をシード
- `equity_snapshots` — 処理した 15 分足ごとに 1 行。資産推移チャートのデータ源。`(run_id, timestamp)` で UNIQUE を張ってあるので再実行しても安全
- `trades` — `target_position` が前回と変わったときだけ追記

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

http://localhost:3000 で開く。

## Supabase のセットアップ

マイグレーション適用（Studio の SQL editor または `supabase db push`）:

```powershell
supabase link --project-ref YOUR-PROJECT-REF
supabase db push
```

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
select created_at, signal, position, latest_close, model_version
from predictions order by created_at desc limit 1;

select * from strategy_state where id = 'unidream_btcusdt_15m_main';

select timestamp, equity, position, price
from equity_snapshots where run_id = 'unidream_btcusdt_15m_main'
order by timestamp desc limit 5;

select * from trades where run_id = 'unidream_btcusdt_15m_main'
order by created_at desc limit 5;
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

[scripts/backfill-history.ts](scripts/backfill-history.ts) は Edge Function と同じシミュレーションロジックをそのまま再利用する（`run_id = unidream_btcusdt_15m_main`, `INITIAL_CASH = 10_000`, `FEE_RATE = 0`, `ALLOW_SHORT = false`, `MAX_TARGET_POSITION = 1.12`）。

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
2. Binance public klines から replay 期間 + Plan011 context ぶんの 15m candles を取得（デフォルトなら ~135.5日 = 60日 replay + 75.5日 context）
3. **Probe フェーズ**: replay 範囲から 20 個の index を均等サンプリングして HF `/predict` を叩き、`target_position` の unique 値をログに出す。全部 `1.0` だった場合は「trades 履歴は増えない」と warn を出す
4. **Replay フェーズ**: Plan011 context（7248 本）以降の各 step で、直近 7248 本の candle を /predict に POST。クランプ後の target_position をもとに前回 state から仮想 fill を計算して、`predictions` / `equity_snapshots` / `trades` をバッファして 200 行ごとに flush
5. すべて終わったら `strategy_state` を最終 state で upsert（以降のライブ Cron はその続きから動く）

注意:

- HF Spaces は 1 リクエスト数秒かかるので、60 日 replay は長時間実行になる。所要時間は probe フェーズの平均レイテンシから推定値を表示する
- 同じ candle を二重処理しないよう `latest.openTimeMs <= strategy_state.last_timestamp` の step はスキップ
- `predictions.created_at` を bar 時刻で上書きするので、チャート上で snapshots と整合する。ライブ Cron 側は `now()` のままなので backfill 行 → ライブ行の順序は保たれる
- 途中で Ctrl+C しても直前の flush 分までは DB に入っている。再開したいときは `--reset` を付けずにもう一度叩けば、`last_timestamp` 以降だけ続きから処理される
- ライブ Cron が動いている最中に backfill を走らせると `strategy_state` の取り合いになるので、Cron は止めてから流すこと

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

- **二重処理防止**：Edge Function は `strategy_state.last_timestamp` を読んで、最新 15 分足が新しくなければスキップ。`equity_snapshots` の `(run_id, timestamp)` UNIQUE が二段構えの保険
- **ポジション解釈**：`target_position` は B&H=1.0 を基準にしたエクスポージャー倍率。Plan011 v31 は continuous overlay を返すため、デモ側は最大 `1.12` まで許可している。マイナスは関数内の `ALLOW_SHORT = false` で flat に潰している。Space 側がショート対応したらフラグを立てる
- **手数料・スリッページ**：リアルタイムデモでは表示の分かりやすさを優先して `FEE_RATE = 0`。研究repo側の評価 JSON では cost stress (`cost_x1` / `cost_x2` / `cost_x3`) を別途見る
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
