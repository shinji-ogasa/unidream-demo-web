# UniDream WM + learned RL demo release

The new default dashboard targets `btc-wm31-ac-20260906-paper-v1` / `btc-wm31-ac-20260906`. Its model family is `wm_market31_ac`:31-feature World Model, Behavior Cloning and learned Imagination Actor-Critic. Static research evidence is separate from public paper-account results. The original ML research evidence is retained only as a comparison archive.

## Current local implementation

- HF `/v4/btc`:8704 completed nominal Spot/UM bars, fixed64 causal context, saved normalizers, trained WM/42 auxiliary outputs/learned Actor. Actual inventory feedback and persistent controller state.
- Edge `run-wm-research-demo`: authenticated service only, registered immutable hashes, full Spot+UM collection every15m, strict next-open deadline.
- Forward migration `20260906073004_wm_research_demo.sql`: separate schema2 WM RPC, version CAS, atomic state/snapshots/forecast/events, late-write rollback. ML RPC and old records remain.
- Web: WM+RL label, completed-bar NAV/holdings, learned intents separate from fills, run-filtered reads/realtime. No old ML score is assigned to WM.

## Validation

Local HF100 tests pass with1 optional skip; research/HF real fold6 state/Actor/aux/account exact parity; raw8704 features matched. New SQL61 and legacySQL29 pass; Edge36 pass. Actual synthetic HF bridge envelopes pass through local PGlite, including exact JSON state and duplicate calls. Web typecheck/build pass; browser1280px/390px has no overflow, blank page or error overlay. Evidence is under `docs/btc-release-evidence` and the HF repository.

## Pending release work

The fixed three-period research matrix is still running. `public/btc-accuracy-release.json` intentionally has no historical WM summary until aggregation. No new WM bundle, run registration, migration, Edge function, Cron cutover or Vercel release has been deployed from this local change. Deploy only after the actual selected learned-WM/RL bundle is produced, parity checked and linked to its honest validation evidence. The schedule file is a reviewed deployment instruction, not evidence of activation.

The minimum historical comparison is mean AlphaEX>0 and mean MaxDDdelta<0 under both base and doubled costs. Reused development periods cannot establish high-probability future/trend-independent performance. A production refit is the same procedure with newer T-only data; its new weights need a separate forward paper record.
