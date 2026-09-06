# UniDream WM + learned RL demo release

The new default dashboard targets `btc-wm31-ac-20260906-paper-v1` / `btc-wm31-ac-20260906`. Its model family is `wm_market31_ac`:31-feature World Model, Behavior Cloning and learned Imagination Actor-Critic. Static research evidence is separate from public paper-account results. The original ML research evidence is retained only as a comparison archive.

## Current local implementation

- HF `/v4/btc`:8704 completed nominal Spot/UM bars, fixed64 causal context, saved normalizers, trained WM/42 auxiliary outputs/learned Actor. Actual inventory feedback and persistent controller state.
- Edge `run-wm-research-demo`: authenticated service only, registered immutable hashes, full Spot+UM collection every15m, strict next-open deadline.
- Forward migration `20260906073004_wm_research_demo.sql`: separate schema2 WM RPC, version CAS, atomic state/snapshots/forecast/events, late-write rollback. ML RPC and old records remain.
- Web: WM+RL label, completed-bar NAV/holdings, learned intents separate from fills, run-filtered reads/realtime. No old ML score is assigned to WM.

## Validation

Local HF105 tests pass with1 optional skip; research/HF real fold6 state/Actor/aux/account exact parity; raw8704 features matched. New SQL61 and legacySQL29 pass; Edge36 pass. Actual synthetic HF bridge envelopes pass through local PGlite, including exact JSON state and duplicate calls. Web typecheck/build pass; browser1280px/390px has no overflow, blank page or error overlay. Evidence is under `docs/btc-release-evidence` and the HF repository.

## Deployment verification

The fixed three-period R3 comparison selected scale100 ac_decay_dd25: +0.053549pt AlphaEX / -0.069770pt MaxDDdelta at base costs, +0.053292pt / -0.069544pt under double costs. One period improves and two equal B&H. The single latest-data refit completed on T=2024-09-01 through2026-09-01. Actual production weights passed96-point portability and3 real raw-context checks.

HF2979deb is RUNNING with the new bundle and v4health200. Its manifestSHA is96e4aed9a6f0f94fcc72d8a6f6573078182f4cd4c2c2607c9c465044346565d9. The initial real inference revealed an absent HF authentication setting (503); no state was saved. After configuring the existing server key, Edgev2 returned200/applied for09:30UTC, forecast available/action eligible/timely, stateversion1. The registered manifest matches the actual model. Cronjob2 now invokes the newWM function at0,15,30,45; oldjob1 is inactive. The09:45UTC scheduled update and final published browser verification remain to be checked. Web production publication is tracked in the deployment evidence, not inferred from this local document.

The newer homepage Vision design and legacy execution markers from703f627 were merged and preserved. OldPlan01117-feature/9-fold material is labelled as an archive. The root dashboard uses the newWM run exclusively.

The minimum historical comparison is mean AlphaEX>0 and mean MaxDDdelta<0 under both base and doubled costs. Reused development periods cannot establish high-probability future/trend-independent performance. A production refit is the same procedure with newer T-only data; its new weights need a separate forward paper record.
