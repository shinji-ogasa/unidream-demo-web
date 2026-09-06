"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BTC_CANDIDATE_ID,
  BTC_EVIDENCE_URL,
  BTC_MODEL_LABEL,
  BTC_RUN_ID,
  displayNav,
  type BtcDashboardData,
  type BtcReleaseEvidence,
  type BtcEvent,
} from "@/lib/btc-release";
import { fmtNumber, fmtTime, fmtUSD } from "@/lib/format";
import { useBtcDashboard } from "./useBtcDashboard";
import { BtcPerformanceChart } from "./BtcPerformanceChart";

function points(value: number | null | undefined, digits = 3) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value > 0 ? "+" : ""}${(value * 100).toFixed(digits)}pt`
    : "—";
}
function tone(value: number | null | undefined, higher = true) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    Math.abs(value) < 1e-12
  )
    return "default";
  return (higher ? value > 0 : value < 0) ? "good" : "bad";
}
function Metric({
  label,
  value,
  hint,
  variant = "default",
}: {
  label: string;
  value: string;
  hint: string;
  variant?: string;
}) {
  return (
    <div className={`dashboard-metric-cell dashboard-metric-cell--${variant}`}>
      <div className="dashboard-metric-cell__label">{label}</div>
      <div className="dashboard-metric-cell__value">{value}</div>
      <div className="dashboard-metric-cell__hint">{hint}</div>
    </div>
  );
}
function textField(
  record: Record<string, unknown> | null | undefined,
  key: string,
) {
  const value = record?.[key];
  return typeof value === "string" ? value : null;
}
function eventValue(details: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys)
    if (typeof details[key] === "number" && Number.isFinite(details[key]))
      return Number(details[key]);
  return null;
}
function fillDetails(event: BtcEvent): Record<string, unknown> {
  const value = event.details.fill;
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}

export function BtcDashboard({
  initial,
  evidence,
}: {
  initial: BtcDashboardData;
  evidence: BtcReleaseEvidence | null;
}) {
  const live = useBtcDashboard(initial);
  const state = live.state?.state;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const lastEvent = state?.last_open_ts;
  const age =
    now !== null && lastEvent ? now - new Date(lastEvent).getTime() : null;
  const stale = age !== null && age > 30 * 60_000;
  const readable = live.readStatus === "ready";
  const hasMark = !!state?.last_mark_ts;
  const alpha = hasMark && state ? state.equity - state.benchmark_equity : null;
  const dd =
    hasMark && state
      ? Math.abs(state.max_drawdown) - Math.abs(state.benchmark_max_drawdown)
      : null;
  const evidenceData = evidence?.historical_evidence;
  const status =
    live.readStatus === "contract_mismatch"
      ? "モデル情報を確認中"
      : live.readStatus === "unavailable"
        ? "最新データを取得できません"
        : !state
          ? "初回データ待ち"
          : stale
            ? "更新に遅れがあります"
            : "データ受信済み";
  const productionCutoff =
    textField(live.run?.manifest, "production_cutoff") ??
    evidence?.production_cutoff ??
    null;
  const calendar = live.run?.manifest.calendar;
  const productionCalendar =
    calendar && typeof calendar === "object" && !Array.isArray(calendar)
      ? (calendar as Record<string, unknown>)
      : null;
  const sourceUrl = evidence?.source_report_url?.startsWith(
    "https://github.com/shinji-ogasa/UniDream/",
  )
    ? evidence.source_report_url
    : null;
  const eventLabels = {
    fill: "約定",
    intent: "次の始値への注文",
    expired: "期限切れ",
    account: "確定足・約定処理",
    decision: "RLの判断",
  };

  return (
    <main className="dashboard-shell dashboard-shell--result-only btc-release-shell">
      <div className="dashboard-shell__ambient" aria-hidden="true" />
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="dashboard-header__brand-group">
            <Link
              href="/homepage"
              className="dashboard-header__brand"
              aria-label="Zeniq / UniDream"
            >
              <Image
                src="/Zeniq-logo.png"
                alt="Zeniq"
                height={56}
                width={224}
                priority
                unoptimized
                className="dashboard-header__logo"
              />
            </Link>
            <span className="dashboard-header__divider" aria-hidden="true" />
            <div className="dashboard-header__context">
              <strong>BTCUSDT / 15m</strong>
              <span>15M DECISIONS · PAPER</span>
            </div>
          </div>
          <div className="dashboard-header__status">
            <span className="dashboard-model">
              <small>MODEL</small>
              {BTC_MODEL_LABEL}
            </span>
            <span className="btc-status">{status}</span>
          </div>
        </header>

        <section
          className="btc-evidence dashboard-panel"
          aria-labelledby="btc-evidence-title"
        >
          <div className="btc-section-heading">
            <div>
              <span className="btc-eyebrow">
                UNIDREAM WM + RL · DEVELOPMENT EVIDENCE
              </span>
              <h1 id="btc-evidence-title">
                B&amp;Hとの差を、同じ条件で確認する。
              </h1>
            </div>
            <span className="btc-status">World Model + Learned RL</span>
          </div>
          <p className="btc-description">
            World Modelが市場の変化を学び、想像した将来の経路で学習したRL Actorが保有比率を決めます。
          </p>
          {evidenceData ? (
            <>
              <div className="dashboard-metrics-grid btc-evidence-metrics">
                <Metric
                  label="過去平均 ALPHAEX"
                  value={points(evidenceData.base.alpha_ex)}
                  hint="B&Hに対するリターン差 · 高いほど良い"
                  variant={tone(evidenceData.base.alpha_ex)}
                />
                <Metric
                  label="過去平均 MAXDD Δ"
                  value={points(evidenceData.base.maxdd_delta)}
                  hint="最大下落幅の差 · 低いほど良い"
                  variant={tone(evidenceData.base.maxdd_delta, false)}
                />
                <Metric
                  label="2倍コスト ALPHAEX"
                  value={points(evidenceData.stress_2x.alpha_ex)}
                  hint="同じモデルを2倍コストで再実行"
                  variant={tone(evidenceData.stress_2x.alpha_ex)}
                />
                <Metric
                  label="2倍コスト MAXDD Δ"
                  value={points(evidenceData.stress_2x.maxdd_delta)}
                  hint="取引・借入コストのストレス条件"
                  variant={tone(evidenceData.stress_2x.maxdd_delta, false)}
                />
              </div>
              <div className="btc-evidence-notes">
                <p>
                  <strong>{evidenceData.quarters}四半期の平均</strong> ·{" "}
                  {evidenceData.start.slice(0, 10)} →{" "}
                  {evidenceData.end_exclusive.slice(0, 10)}。上昇
                  {evidenceData.regime_counts.bull}・下降
                  {evidenceData.regime_counts.bear}・横ばい
                  {evidenceData.regime_counts.sideways}
                  。各四半期でAlphaEXと最大DDが両コスト条件とも改善したのは
                  <strong>
                    {evidenceData.joint_quarters_both_costs}/
                    {evidenceData.quarters}
                  </strong>
                  です。
                </p>
                <p>
                  開発期間で学習と比較を行った成績です。公開用に再学習した重みの実績は、下のペーパートレードで確認できます。相場によらず高い確率で改善するかは、今後の独立した期間で検証します。
                </p>
              </div>
              <div className="btc-evidence-links">
                {sourceUrl ? (
                  <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                    研究結果と検証範囲 ↗
                  </a>
                ) : null}
                <a href={BTC_EVIDENCE_URL} download>
                  根拠データ JSON ↓
                </a>
                <span>{evidence?.minimum_means_met ? "開発期間の最低平均条件を達成" : "開発期間の最低平均条件を検証中"} · 独立した将来検証なし</span>
              </div>
            </>
          ) : (
            <p className="btc-caption">
              WM＋RLの検証結果を集計しています。平均AlphaEXが正、平均MaxDD差が負になることを採用の最低条件にしています。
            </p>
          )}
        </section>

        <section
          className="dashboard-result-stage"
          aria-labelledby="btc-live-title"
        >
          <div className="btc-section-heading">
            <div>
              <span className="btc-eyebrow">NEW PUBLIC PAPER RUN</span>
              <h2 id="btc-live-title">公開後のペーパートレード</h2>
            </div>
            <span className="btc-status">{status}</span>
          </div>
          {!readable || stale ? (
            <p className="btc-notice" role="status">
              {live.readStatus === "contract_mismatch"
                ? "記録とモデルの識別情報が一致するまで、新しい成績を表示しません。"
                : live.readStatus === "unavailable"
                  ? state
                    ? "取得済みの値を、その記録時点のまま表示しています。接続が戻ると自動更新します。"
                    : "公開用データへの接続を確認しています。記録が届くと自動更新します。"
                  : stale
                    ? "下の値は最終受信時点の記録です。直近の市場状況を反映していない可能性があります。"
                    : "新しい実行の初回記録を待っています。旧モデルの履歴は混ぜません。"}
            </p>
          ) : null}
          <div className="dashboard-result-summary">
            <div className="dashboard-result-summary__hero">
              <span>WM + RL EQUITY · 最終確定足</span>
              <strong>
                {fmtUSD(hasMark ? displayNav(state?.equity) : null)}
              </strong>
              <em
                className={`dashboard-result-summary__change dashboard-result-summary__change--${tone(hasMark && state ? state.equity - 1 : null)}`}
              >
                {hasMark && state
                  ? `${state.equity >= 1 ? "+" : ""}${((state.equity - 1) * 100).toFixed(2)}%`
                  : "確定足待ち"}
              </em>
            </div>
            <div className="dashboard-result-summary__benchmark">
              <span>B&amp;H · 同じ初期保有</span>
              <strong>
                {fmtUSD(hasMark ? displayNav(state?.benchmark_equity) : null)}
              </strong>
              <small>初期NAV 1 = 表示 10,000 USDT</small>
            </div>
            <div className="dashboard-result-summary__delta">
              <span>公開後 ALPHAEX</span>
              <strong
                className={`dashboard-result-summary__delta--${tone(alpha)}`}
              >
                {points(alpha)}
              </strong>
              <small>WM + RL − B&amp;H · 実行開始から</small>
            </div>
          </div>
          <div className="dashboard-metrics-grid btc-live-metrics">
            <Metric
              label="公開後 MAXDD Δ"
              value={points(dd)}
              hint="初期保有からの最大下落幅の差"
              variant={tone(dd, false)}
            />
            <Metric
              label="最終確定足の保有比率"
              value={
                state
                  ? state.bridge_state.account.account.last_exposure === null
                    ? "確定足待ち"
                    : `${fmtNumber(state.bridge_state.account.account.last_exposure, 3)}×`
                  : "—"
              }
              hint="保有比率は値動きで変化します"
            />
            <Metric
              label="次の始値への注文"
              value={
                !state
                  ? "—"
                  : state.pending_target == null
                    ? "注文なし"
                    : `${fmtNumber(state.pending_target, 3)}×`
              }
              hint={
                state?.pending_due_at
                  ? fmtTime(state.pending_due_at)
                  : "データ欠損時は保有を継続"
              }
            />
            <Metric
              label="約定回数"
              value={state ? String(state.trades) : "—"}
              hint={`取引コスト ${fmtUSD(displayNav(state?.fees))} · 借入 ${fmtUSD(displayNav(state?.borrow))}`}
            />
          </div>
          <div className="btc-state-times">
            <span>
              最終確定足の始値時刻{" "}
              <strong>{fmtTime(state?.last_mark_ts)}</strong>
            </span>
            <span>
              最後の判断時刻 <strong>{fmtTime(state?.last_open_ts)}</strong>
            </span>
            <span>
              評価の基準 <strong>受信した確定足の終値</strong>
            </span>
          </div>
          <p className="btc-caption">
            資産と保有量は確定した足までの記録です。RLの判断は次の始値への注文として表示します。B&Hと同じ初期保有で開始し、表示金額は正規化NAVを10,000倍しています。
          </p>
          <BtcPerformanceChart snapshots={live.snapshots} />
        </section>

        <section
          className="btc-runtime dashboard-panel"
          aria-labelledby="btc-runtime-title"
        >
          <div className="btc-section-heading">
            <div>
              <span className="btc-eyebrow">FORECAST & EXECUTION</span>
              <h2 id="btc-runtime-title">予測と売買の条件</h2>
            </div>
            <span className="btc-status">学習済みWM + RL Actor</span>
          </div>
          <div className="btc-conditions">
            <span>BTC 15分足</span>
            <span>15分ごとに判断</span>
            <span>次の15分足始値</span>
            <span>片道5.5 bps</span>
            <span>借入 年10%</span>
            <span>欠損時 hold</span>
          </div>
          <p className="btc-description">
            注文対象は0.50–1.12倍、1回の変更幅は最大0.08。遅延した入力では新しく注文せず、期限を過ぎた注文は持ち越しません。
          </p>
          <dl className="btc-runtime-grid">
            <div>
              <dt>最後の判断時刻</dt>
              <dd>{fmtTime(live.forecast?.decision_ts)}</dd>
            </div>
            <div>
              <dt>予測の状態</dt>
              <dd>
                {live.forecast
                  ? live.forecast.available
                    ? live.forecast.action_eligible
                      ? "予測あり"
                      : "予測あり・注文受付外"
                    : "予測なし・保有を継続"
                  : "判断記録待ち"}
              </dd>
            </div>
            <div>
              <dt>RLの目標保有比率</dt>
              <dd>{!live.forecast ? "判断記録待ち" : live.forecast.target == null ? "変更なし" : `${fmtNumber(live.forecast.target, 3)}×`}</dd>
            </div>
            <div>
              <dt>市場データ受信時刻</dt>
              <dd>{fmtTime(textField(live.forecast?.data, "received_at"))}</dd>
            </div>
          </dl>
          <p className="btc-caption">
            RLが出した目標保有比率、次の始値での約定、入力の受信時刻を記録します。入力が欠けた時刻の予測や約定を後から補いません。
          </p>
          <details className="btc-provenance">
            <summary>モデル・学習期間・データの識別情報</summary>
            <dl className="btc-runtime-grid">
              <div>
                <dt>Bundle / Run</dt>
                <dd>{BTC_RUN_ID}</dd>
              </div>
              <div>
                <dt>レシピ</dt>
                <dd>{BTC_CANDIDATE_ID}</dd>
              </div>
              <div>
                <dt>公開用のデータ締切（設定）</dt>
                <dd>{fmtTime(productionCutoff)}</dd>
              </div>
              <div>
                <dt>公開用の学習開始</dt>
                <dd>{fmtTime(textField(productionCalendar, "fit_start"))}</dd>
              </div>
              <div>
                <dt>学習したRL設定</dt>
                <dd>{textField(live.run?.manifest, "arm") ?? evidence?.policy_arm ?? "検証中"}</dd>
              </div>
              <div>
                <dt>Bundle SHA256</dt>
                <dd>{live.run?.bundle_sha256 ?? "登録待ち"}</dd>
              </div>
              <div>
                <dt>特徴量 SHA256</dt>
                <dd>{live.run?.feature_contract_sha256 ?? "登録待ち"}</dd>
              </div>
              <div>
                <dt>売買条件 SHA256</dt>
                <dd>{live.run?.execution_contract_sha256 ?? "登録待ち"}</dd>
              </div>
            </dl>
            <p className="btc-caption">
              Spot・先物の31特徴量からWMの状態を計算し、学習済みRL Actorが判断します。64行の入力、学習時に保存した正規化、取引・借入コストを実験と揃え、公開後の受信時刻を保存します。
            </p>
          </details>
        </section>

        <section
          className="dashboard-section dashboard-trades dashboard-trades--minimal"
          aria-label="注文と約定の履歴"
        >
          <div className="dashboard-trades__simple-head">
            <span>注文・約定・期限切れ</span>
            <span>直近{live.events.length}件</span>
          </div>
          {live.events.length === 0 ? (
            <p className="btc-caption">まだ注文・約定の記録はありません。</p>
          ) : (
            <div className="btc-table-wrap">
              <table className="btc-events">
                <thead>
                  <tr>
                    <th>時刻 UTC</th>
                    <th>種類</th>
                    <th>目標比率</th>
                    <th>実行後の比率</th>
                  </tr>
                </thead>
                <tbody>
                  {live.events.map((event) => (
                    <tr key={event.event_id}>
                      <td>{fmtTime(event.timestamp)}</td>
                      <td>{event.kind === "account"
                        ? fillDetails(event).status === "filled" ? "ペーパー約定"
                          : fillDetails(event).status === "expired_missing_open" ? "期限切れ"
                          : "保有・確定足"
                        : eventLabels[event.kind] ?? event.kind}</td>
                      <td>
                        {fmtNumber(
                          eventValue(
                            event.kind === "account" ? fillDetails(event) : event.details,
                            "due_target",
                            "target",
                            "target_position",
                            "pending_target",
                          ),
                          3,
                        )}
                      </td>
                      <td>
                        {fmtNumber(
                          eventValue(
                            event.kind === "account" ? fillDetails(event) : event.details,
                            "exposure_after",
                          ),
                          3,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <footer className="dashboard-footer dashboard-footer--minimal">
          <nav className="dashboard-footer__links" aria-label="関連ページ">
            <Link href="/homepage">Company ↗</Link>
            <Link href="/legacy">旧モデルの履歴 ↗</Link>
            <a
              href="https://huggingface.co/spaces/ShinjiAA/unidream-space"
              target="_blank"
              rel="noopener noreferrer"
            >
              HF Space ↗
            </a>
          </nav>
          <span>
            PAPER · 表示更新{" "}
            {live.connection === "subscribed" ? "接続中" : "30秒ごと"}
          </span>
          <span>取得確認 {fmtTime(live.checkedAt)}</span>
        </footer>
      </div>
    </main>
  );
}
