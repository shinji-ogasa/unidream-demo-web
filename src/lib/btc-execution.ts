import { BTC_DISPLAY_CAPITAL, type BtcForecast, type BtcEvent } from "./btc-release";

type ObjectValue = Record<string, unknown>;
export function objectValue(value: unknown): ObjectValue {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as ObjectValue : {};
}
export function finiteValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
export function reasonLabel(reason: unknown): string {
  const labels: Record<string, string> = {
    inside_no_trade_band: "保有との差が0.01未満のため売買なし",
    deadband_hold: "保有との差が0.01未満のため売買なし",
    conditional_next_open_rebalance: "次の始値で保有量と数量を再計算",
    expired_missing_open: "始値を期限内に受信できず、目標は失効",
    feature_unavailable: "必要な確定足が不足",
    model_input_unavailable: "モデル入力が不足",
    prediction_completed_after_next_open: "推論が期限を過ぎたため売買なし",
    account_insolvent: "口座の継続条件を満たさず停止",
    actor_intent: "モデルの目標を計算済み。約定とは別です",
    none: "この足で実行する目標なし",
    filled: "ペーパー約定済み",
  };
  return typeof reason === "string" ? labels[reason] ?? "売買状態を確認中" : "記録待ち";
}

export function decisionSummary(forecast: BtcForecast | null, now: number | null, readable: boolean) {
  const empty = { label: "判断記録待ち", quantity: null as number | null, reason: "記録待ち", estimated: false };
  if (!readable) return { ...empty, label: "最新判断を確認できません", reason: "取得済みの過去の記録を表示しています" };
  if (!forecast) return empty;
  const stamp = Date.parse(forecast.decision_ts);
  if (now === null || !Number.isFinite(stamp) || stamp > now || now-stamp > 30*60_000) {
    return { ...empty, label: "更新停止・最新判断なし", reason: "最終判断は過去の記録です。現在の売買判断ではありません" };
  }
  const plan = objectValue(forecast.diagnostics.execution_plan);
  if (!forecast.available || !forecast.action_eligible) {
    return { ...empty, label: "売買指示なし", quantity: 0, reason: reasonLabel(forecast.reason) };
  }
  if (plan.schema !== "wm-paper-execution-plan-v1" || plan.quantity_unit !== "BTC_per_initial_1_USDT") {
    return { ...empty, label: "目標のみ・数量未記録", reason: "売買の有無は次の始値の実行記録で確認します" };
  }
  const quantity = finiteValue(plan.quantity_btc);
  const side = plan.side;
  if (plan.status === "hold" && side === "NONE" && quantity === 0) {
    return { label: "HOLD · 売買なし（参考）", quantity: 0, reason: reasonLabel(plan.reason), estimated: true };
  }
  if (plan.status === "trade" && (side === "BUY" || side === "SELL") && quantity !== null && quantity > 0) {
    return { label: `${side} · ${side === "BUY" ? "買い" : "売り"}（参考）`, quantity: quantity*BTC_DISPLAY_CAPITAL,
      reason: reasonLabel(plan.reason), estimated: true };
  }
  return { ...empty, label: "売買数量を確認できません", reason: "実行情報の整合性を確認してください" };
}

export function latestExecution(events: BtcEvent[]) {
  const event = events.filter(row => row.kind === "account")
    .sort((a,b) => Date.parse(b.timestamp)-Date.parse(a.timestamp))[0];
  if (!event) return null;
  const fill = objectValue(event.details.fill);
  const bridge = objectValue(event.details.bridge);
  const value = finiteValue(fill.trade_value);
  const price = finiteValue(bridge.observed_open);
  const didTrade = fill.status === "filled";
  const quantity = !didTrade ? 0 : value !== null && price !== null && price > 0
    ? Math.abs(value)/price*BTC_DISPLAY_CAPITAL : null;
  return { timestamp: event.timestamp, label: didTrade ? value === null || value === 0 ? "約定方向を確認中" : value > 0 ? "BUY · 買い約定" : "SELL · 売り約定" : "売買なし",
    reason: reasonLabel(fill.status), quantity, didTrade };
}
