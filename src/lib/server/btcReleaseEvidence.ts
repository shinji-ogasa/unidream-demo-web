import releaseJson from "../../../public/btc-accuracy-release.json";
import {
  BTC_CANDIDATE_ID,
  BTC_BUNDLE_ID,
  type BtcReleaseEvidence,
} from "@/lib/btc-release";

const release = releaseJson as unknown as BtcReleaseEvidence;

/** Static selection evidence; never treated as deployed-model health. */
export function loadBtcReleaseEvidence(): BtcReleaseEvidence | null {
  if (
    release.bundle_id !== BTC_BUNDLE_ID ||
    release.candidate_id !== BTC_CANDIDATE_ID ||
    release.research_scores_apply_to_production_weights !== false ||
    release.high_probability_generalization_established !== false ||
    release.learned_rl !== true
  )
    return null;
  const history = release.historical_evidence;
  if (
    history !== null && (
    history.quarters < 1 ||
    history.joint_quarters_both_costs > history.quarters ||
    history.metric_units !== "fraction; multiply by100 for percentage points" ||
    ![
      history.base.alpha_ex,
      history.base.maxdd_delta,
      history.stress_2x.alpha_ex,
      history.stress_2x.maxdd_delta,
    ].every(Number.isFinite))
  )
    return null;
  return release as BtcReleaseEvidence;
}
