# unidream-demo-web

UniDream のライブデモ。Next.js のフロントエンドと Supabase Edge Function を組み合わせて、15 分ごとに [unidream-space](../unidream-space) の HF Spaces 推論 API を叩き、仮想ペーパートレードの結果を表示する。

```
Binance klines (15m)
    ↓
Supabase Cron (15m)
    ↓
Edge Function: run-unidream-inference
    ↓
HF Space /predict (UniDream)
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
    EquityChart.tsx       recharts のラインチャート
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
  "candles": 1800,
  "prediction": { "signal": "...", "raw_position": 1.0, "target_position": 1.0, ... },
  "state":      { "equity": 10000.0, "cash": 0.0, "asset_qty": 0.116, "position": 1.0 },
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
- **ポジション解釈**：`target_position` はスポットの建玉割合。`1.0` = 100% long、`0.0` = flat。マイナスは関数内の `ALLOW_SHORT = false` で flat に潰している。Space 側がショート対応したらフラグを立てる
- **手数料・スリッページ**：PoC なので `FEE_RATE = 0`。リアル感が欲しくなったら `0.0005` あたりに上げて再デプロイ
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
