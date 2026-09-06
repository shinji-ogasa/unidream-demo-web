# UniDream WM + learned RL demo release

The new default dashboard targets `btc-wm31-ac-20260906-paper-v1` / `btc-wm31-ac-20260906`. Its model family is `wm_market31_ac`:31-feature World Model, Behavior Cloning and learned Imagination Actor-Critic. Static research evidence is separate from public paper-account results. The original ML research evidence is retained only as a comparison archive.

## Current local implementation

- HF `/v4/btc`:8704 completed nominal Spot/UM bars, fixed64 causal context, saved normalizers, trained WM/42 auxiliary outputs/learned Actor. Actual inventory feedback and persistent controller state.
- Edge `run-wm-research-demo`: authenticated service only, registered immutable hashes, full Spot+UM collection every15m, strict next-open deadline.
- Forward migration `20260906073004_wm_research_demo.sql`: separate schema2 WM RPC, version CAS, atomic state/snapshots/forecast/events, late-write rollback. ML RPC and old records remain.
- Web: WM+RL label, completed-bar NAV/holdings, learned intents separate from fills, run-filtered reads/realtime. No old ML score is assigned to WM.

## Validation

Local HF105 tests pass with1 optional skip; research/HF real fold6 state/Actor/aux/account exact parity; raw8704 features matched. New SQL61 and legacySQL29 pass; Edge36 pass. Actual synthetic HF bridge envelopes pass through local PGlite, including exact JSON state and duplicate calls. Web typecheck/build pass; browser1280px/390px has no overflow, blank page or error overlay. Evidence is under `docs/btc-release-evidence` and the HF repository.

## Pending release work

The fixed three-period R3 comparison is complete. The scale100 ac_decay_dd25 recipe meets minimum means: +0.053549pt AlphaEX / -0.069770pt MaxDDdelta at base costs, +0.053292pt / -0.069544pt under double costs. One period improves and two equal B&H. The selected procedure is now being refit once on latest T-only data; the public JSON contains this bounded development evidence. The WM migration and Edge v1 are deployed, and HF source commit e957233 is RUNNING with /health200; /v4/btc/health503 correctly reports the missing new bundle. Unauthenticated Edge POST401/GET405 are verified. No new WM bundle, run registration, authorized model transition, Cron cutover or Vercel production release has been deployed. Deploy only after the actual selected learned-WM/RL bundle is produced, parity checked and linked to its honest validation evidence. The schedule file is a reviewed deployment instruction, not evidence of activation.

The minimum historical comparison is mean AlphaEX>0 and mean MaxDDdelta<0 under both base and doubled costs. Reused development periods cannot establish high-probability future/trend-independent performance. A production refit is the same procedure with newer T-only data; its new weights need a separate forward paper record.
