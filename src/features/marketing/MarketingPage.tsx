"use client";

import Image from "next/image";
import { motion, useInView } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Database,
  GitBranch,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { useRef, type ReactNode } from "react";

import {
  BUNDLE_CONTRACT,
  DEV_SUMMARY,
  HOLDOUT_FOLDS,
  HOLDOUT_SUMMARY,
} from "./data";
import { ResearchPipeline } from "./components/ResearchPipeline";
import { ArrowLink, SiteFooter, SiteHeader } from "./components/SiteChrome";

function Reveal({
  children,
  className = "",
  delay = 0,
  x = 0,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  x?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: "-70px" });
  // Keep reveal motion on the vertical axis so responsive content never starts outside the viewport.
  void x;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: 0, y }}
      animate={visible ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: 0, y }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ index, children }: { index: string; children: ReactNode }) {
  return (
    <div className="section-eyebrow">
      <span className="section-eyebrow__index">{index}</span>
      <span>{children}</span>
    </div>
  );
}

function StatusDot({ tone = "cyan" }: { tone?: "cyan" | "lime" | "blue" }) {
  return <span className={`status-dot status-dot--${tone}`} aria-hidden="true" />;
}

function VisionBoard() {
  return (
    <div className="vision-board" role="group" aria-label="B&HとAIオーバーレイ、現在のholdout結果">
      <div className="vision-board__header">
        <div>
          <span className="micro-label">ONE IDEA / ONE SCREEN</span>
          <strong>B&amp;H → AI overlay → evidence</strong>
        </div>
        <span className="vision-board__index">01 / VISION</span>
      </div>

      <div className="vision-board__equation">
        <div className="vision-board__equation-item vision-board__equation-item--base">
          <span className="micro-label">01 / BASELINE</span>
          <strong>1.0000</strong>
          <small>Buy &amp; Hold</small>
        </div>
        <div className="vision-board__connector" aria-hidden="true"><ArrowRight /></div>
        <div className="vision-board__equation-item vision-board__equation-item--overlay">
          <span className="micro-label">02 / AI OVERLAY SAMPLE</span>
          <strong>{BUNDLE_CONTRACT.lastSamplePosition}</strong>
          <small>fold 23 · same benchmark</small>
        </div>
      </div>

      <div className="vision-board__target">
        <span className="micro-label">THE POINT / NORTH STAR</span>
        <strong>B&amp;Hとの差分を、リターンとリスクで読む。</strong>
        <div className="vision-board__target-values">
          <span><b>AlphaEx <i>+</i></b><small>above B&amp;H</small></span>
          <span><b>MaxDDΔ <i>−</i></b><small>smaller drawdown</small></span>
        </div>
      </div>

      <div className="vision-board__current">
        <div>
          <span className="micro-label">CURRENT HOLDOUT / FOLDS 15–23</span>
          <div className="vision-board__current-values">
            <strong>{HOLDOUT_SUMMARY.alphaExMean}<small>AlphaEx mean</small></strong>
            <strong>{HOLDOUT_SUMMARY.maxDdDeltaMean}<small>MaxDDΔ mean</small></strong>
          </div>
        </div>
        <div className="vision-board__current-reading">
          <span className="micro-label">READ THIS AS</span>
          <p>AlphaExは平均プラス。ただしMaxDDΔは負が改善で、DD改善は {HOLDOUT_SUMMARY.improvedDrawdown}。</p>
        </div>
      </div>

      <div className="vision-board__footer">
        <span><StatusDot tone="cyan" /> VISION / TARGET</span>
        <span><StatusDot tone="blue" /> RESULT / HOLDOUT</span>
      </div>
    </div>
  );
}

function StoryRibbon() {
  return (
    <section className="story-ribbon" aria-label="UniDreamの一連の考え方">
      <div className="site-container story-ribbon__inner">
        <div className="story-ribbon__lead">
          <span className="micro-label">THE STORY IN ONE LINE</span>
          <strong>基準を置く。差分をつくる。結果で確かめる。</strong>
        </div>
        <ol className="story-ribbon__steps">
          <li><span>01</span><strong>B&amp;H = 1.0</strong><small>reference</small></li>
          <li><span>02</span><strong>AI overlay</strong><small>state → position</small></li>
          <li><span>03</span><strong>AlphaEx / MaxDDΔ</strong><small>target + proof</small></li>
          <li><span>04</span><strong>Live demo</strong><small>same baseline</small></li>
        </ol>
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section id="product" className="marketing-hero" aria-labelledby="hero-title">
      <div className="marketing-hero__field" aria-hidden="true">
        <Image src="/ai-finance-hero.png" alt="" fill priority sizes="100vw" className="marketing-hero__image" />
        <div className="marketing-hero__wash" />
        <div className="marketing-hero__grid" />
        <div className="marketing-hero__beam marketing-hero__beam--one" />
        <div className="marketing-hero__beam marketing-hero__beam--two" />
        <span className="marketing-hero__ghost">UNIDREAM</span>
      </div>

      <div className="site-container marketing-hero__content">
        <div className="marketing-hero__copy">
          <motion.div
            className="hero-kicker"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <StatusDot />
            <span>B&amp;H REFERENCE / AI OVERLAY</span>
            <span className="hero-kicker__line" aria-hidden="true" />
            <span>2026.09</span>
          </motion.div>

          <motion.h1
            id="hero-title"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            新しいB&amp;Hを、
            <br className="display-break" />
            <span>AIでつくる。</span>
          </motion.h1>

          <motion.p
            className="marketing-hero__lead"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            B&amp;Hを1.0に置き、AIの差分をAlphaExとMaxDDΔで読みます。
          </motion.p>

          <motion.div
            className="marketing-hero__actions"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.42 }}
          >
            <ArrowLink href="#evidence">今の結果を見る</ArrowLink>
            <ArrowLink href="#research" variant="secondary">仕組みを読む</ArrowLink>
          </motion.div>

          <motion.div
            className="marketing-hero__meta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.58 }}
          >
            <span><Database aria-hidden="true" /> BASELINE 1.0000</span>
            <span><ShieldCheck aria-hidden="true" /> HOLDOUT 15–23</span>
          </motion.div>
        </div>

        <motion.div
          className="marketing-hero__visual"
          initial={{ opacity: 0, x: 36, rotate: 2 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 0.9, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero-visual__index">01 / ONE SCREEN / THE NEW B&amp;H</div>
          <VisionBoard />
        </motion.div>
      </div>

      <div className="marketing-hero__bottom site-container">
        <span className="hero-scroll"><ArrowDown aria-hidden="true" /> SCROLL TO EXPLORE</span>
        <span className="hero-bottom-note">HISTORICAL EVIDENCE · EXPLICIT LIMITS</span>
      </div>
    </section>
  );
}

function ContractMatrix() {
  const rows = [
    {
      label: "BUNDLE",
      value: BUNDLE_CONTRACT.bundle,
      detail: `fold ${BUNDLE_CONTRACT.fold} · ${BUNDLE_CONTRACT.status}`,
    },
    {
      label: "INPUT",
      value: `${BUNDLE_CONTRACT.symbol} · ${BUNDLE_CONTRACT.interval}`,
      detail: "closed candle arrays + derivative features",
    },
    {
      label: "SHAPE",
      value: `${BUNDLE_CONTRACT.featureCount} features × ${BUNDLE_CONTRACT.sequenceLength} bars`,
      detail: `z-score window ${BUNDLE_CONTRACT.zscoreWindow}`,
    },
    {
      label: "SAMPLE",
      value: `max_abs_diff = ${BUNDLE_CONTRACT.maxAbsDiff}`,
      detail: `strict_ok=true · position ${BUNDLE_CONTRACT.lastSamplePosition} · benchmark ${BUNDLE_CONTRACT.benchmarkPosition}`,
    },
  ];

  return (
    <div className="contract-matrix" role="group" aria-label="現行推論バンドルの検証済み契約">
      {rows.map((row) => (
        <div className="contract-matrix__row" key={row.label}>
          <span className="contract-matrix__label">{row.label}</span>
          <div>
            <strong>{row.value}</strong>
            <span>{row.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StateSection() {
  return (
    <section id="research" className="content-section state-section" aria-labelledby="state-title">
      <div className="site-container">
        <div className="section-topline">
          <Eyebrow index="01">BASELINE / START HERE</Eyebrow>
          <span className="section-topline__aside">B&amp;H = 1.0 / THE REFERENCE</span>
        </div>

        <div className="state-section__intro">
          <Reveal className="state-section__headline" x={-24} y={0}>
            <h2 id="state-title">
              まず、
              <br className="display-break" />
              <em>B&amp;Hを基準にする。</em>
            </h2>
          </Reveal>
          <Reveal className="state-section__copy" delay={0.12} x={24} y={0}>
            <p>
              投資判断をAIに丸ごと渡すのではなく、まずBuy &amp; Holdを1.0の基準線として置きます。そこから動いた分だけを、AIの判断として読みます。
            </p>
            <p className="muted-copy">
              現行の入力はBTCUSDTの15分足、17特徴量、64本の系列。サンプル値は契約の確認であり、将来の収益を示すものではありません。
            </p>
            <div className="inline-status"><StatusDot tone="cyan" /> 01 BASELINE → 02 MARKET STATE</div>
          </Reveal>
        </div>

        <Reveal className="state-board" y={30}>
          <div className="state-board__header">
            <div>
              <span className="micro-label">01 BASELINE → 02 MARKET STATE</span>
              <strong>B&amp;H {BUNDLE_CONTRACT.benchmarkPosition} → sample {BUNDLE_CONTRACT.lastSamplePosition}</strong>
            </div>
            <div className="state-board__header-right">
              <span><StatusDot tone="cyan" /> {BUNDLE_CONTRACT.featureCount} FEATURES</span>
              <span><StatusDot tone="blue" /> SEQ {BUNDLE_CONTRACT.sequenceLength}</span>
                <span className="state-board__run"><StatusDot tone="lime" /> SAMPLE / STRICT OK</span>
            </div>
          </div>
          <div className="state-board__body">
            <ContractMatrix />
            <div className="state-board__notes">
              <div className="state-note state-note--active">
                <span className="state-note__marker">01</span>
                <div>
                  <span className="micro-label">B&amp;H BASELINE</span>
                  <strong>Buy &amp; Hold = 1.00000000</strong>
                  <p>比較の起点。AIの差分をここから読む。</p>
                </div>
              </div>
              <div className="state-note">
                <span className="state-note__marker">17</span>
                <div>
                  <span className="micro-label">MARKET STATE INPUT</span>
                  <strong>17 features × 64 bars</strong>
                  <p>BTCUSDT · 15m · z-score window 60d。</p>
                </div>
              </div>
              <div className="state-note">
                <span className="state-note__marker">Δ</span>
                <div>
                  <span className="micro-label">AI OVERLAY SAMPLE</span>
                  <strong>max_abs_diff = {BUNDLE_CONTRACT.maxAbsDiff}</strong>
                  <p>strict_ok=true · sample position {BUNDLE_CONTRACT.lastSamplePosition}; benchmark {BUNDLE_CONTRACT.benchmarkPosition}。</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function TechnologySection() {
  return (
    <section id="technology" className="content-section technology-section" aria-labelledby="technology-title">
      <div className="site-container">
        <div className="section-topline">
          <Eyebrow index="02">OVERLAY / MAKE THE DELTA</Eyebrow>
          <span className="section-topline__aside">MARKET STATE → TARGET POSITION</span>
        </div>
        <div className="technology-section__intro">
          <Reveal x={-24} y={0}>
            <h2 id="technology-title">次に、<br className="display-break" /><em>AIを差分として重ねる。</em></h2>
          </Reveal>
          <Reveal className="technology-section__copy" delay={0.12} x={24} y={0}>
            <p>市場状態を読み、target positionに変換し、B&amp;Hとの差分として残す。世界モデルから検証ゲートまでを一本の線にします。</p>
            <span className="inline-status inline-status--blue"><GitBranch aria-hidden="true" /> WALK-FORWARD / RIGHT-EXCLUSIVE</span>
          </Reveal>
        </div>
        <ResearchPipeline />
        <div className="pipeline-caption">
          <span><ScanLine aria-hidden="true" /> ARTIFACT-FIRST RESEARCH</span>
          <span>validation selects · test reports</span>
        </div>
      </div>
    </section>
  );
}

function HoldoutBarChart() {
  const chartLeft = 46;
  const chartRight = 684;
  const zeroY = 119;
  const scale = 62;
  const barWidth = 34;
  const step = (chartRight - chartLeft) / HOLDOUT_FOLDS.length;

  return (
    <svg className="scorecard__chart" viewBox="0 0 730 220" role="img" aria-label="2024年から2026年のホールドアウト各foldにおけるAlphaExの棒グラフ">
      <g className="chart-grid chart-grid--light">
        <path d={`M${chartLeft} ${zeroY - scale}H${chartRight}`} />
        <path d={`M${chartLeft} ${zeroY - scale / 2}H${chartRight}`} />
        <path d={`M${chartLeft} ${zeroY}H${chartRight}`} />
        <path d={`M${chartLeft} ${zeroY + scale / 2}H${chartRight}`} />
      </g>
      <line className="holdout-zero" x1={chartLeft} x2={chartRight} y1={zeroY} y2={zeroY} />
      <text className="holdout-axis-label" x="3" y={zeroY - scale + 4}>+1.0</text>
      <text className="holdout-axis-label" x="12" y={zeroY + 4}>0.0</text>
      <text className="holdout-axis-label" x="3" y={zeroY + scale / 2 + 4}>−0.5</text>
      {HOLDOUT_FOLDS.map((fold, index) => {
        const height = Math.max(Math.abs(fold.alphaEx) * scale, 2);
        const x = chartLeft + step * index + (step - barWidth) / 2;
        const y = fold.alphaEx >= 0 ? zeroY - height : zeroY;

        return (
          <g key={fold.fold}>
            <title>{`Fold ${fold.fold} (${fold.period}): AlphaEx ${fold.alphaEx >= 0 ? "+" : ""}${fold.alphaEx.toFixed(2)}pt`}</title>
            <rect
              className={`holdout-bar ${fold.alphaEx >= 0 ? "holdout-bar--positive" : "holdout-bar--negative"}`}
              x={x}
              y={y}
              width={barWidth}
              height={height}
              rx="1"
            />
            <text className="holdout-fold-label" x={x + barWidth / 2} y="207" textAnchor="middle">{fold.fold}</text>
          </g>
        );
      })}
    </svg>
  );
}

function formatSignedPoint(value: number) {
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}pt`;
}

function EvidenceSection() {
  return (
    <section id="evidence" className="content-section evidence-section" aria-labelledby="evidence-title">
      <div className="site-container">
        <div className="section-topline">
          <Eyebrow index="03">EVIDENCE / CLOSE THE LOOP</Eyebrow>
          <span className="section-topline__aside">TARGET → HOLDOUT RESULT</span>
        </div>
        <div className="evidence-section__intro">
          <Reveal x={-24} y={0}>
            <h2 id="evidence-title">最後に、<br className="display-break" /><em>B&amp;Hとの差分を検証する。</em></h2>
          </Reveal>
          <Reveal className="evidence-section__copy" delay={0.12} x={24} y={0}>
            <p>目標はB&amp;Hを上回るAlphaExと、より小さいMaxDDΔを同時に満たすこと。現行holdoutは途中の結果として、未達条件も含めて同じ画面に出します。</p>
            <ArrowLink href="https://github.com/shinji-ogasa/UniDream/blob/main/docs/plan011_v31_investor_evidence.md" variant="text">研究レポートの原文を見る</ArrowLink>
          </Reveal>
        </div>

        <Reveal className="evidence-thesis" y={24}>
          <div className="evidence-thesis__vision">
            <span className="micro-label">NORTH STAR / TARGET</span>
            <div className="evidence-thesis__values">
              <strong>AlphaEx <b>+</b></strong>
              <strong>MaxDDΔ <b>−</b></strong>
            </div>
            <p>B&amp;Hよりリターンを増やし、ドローダウンを小さくする。</p>
          </div>
          <div className="evidence-thesis__current">
            <span className="micro-label">CURRENT HOLDOUT / FOLDS 15–23</span>
            <div className="evidence-thesis__values">
              <strong>{HOLDOUT_SUMMARY.alphaExMean}<small> AlphaEx mean</small></strong>
              <strong>{HOLDOUT_SUMMARY.maxDdDeltaMean}<small> MaxDDΔ mean</small></strong>
            </div>
            <p>AlphaExは平均プラス。一方、MaxDDΔは負が改善で、現行はDD改善 {HOLDOUT_SUMMARY.improvedDrawdown}。</p>
          </div>
          <div className="evidence-thesis__read">
            <span className="micro-label">HOW TO READ</span>
            <strong>Visionと結果を混ぜない。</strong>
            <p>これは将来目標と、現時点の9 fold集計を分けて読むための表示です。</p>
          </div>
        </Reveal>

        <div className="evidence-grid">
          <Reveal className="scorecard" x={-20} y={18}>
            <div className="scorecard__topline">
              <div>
                <span className="micro-label">PLAN011 V31 / HISTORICAL SNAPSHOT</span>
                <strong>UNTOUCHED HOLDOUT / B&amp;H COMPARISON</strong>
              </div>
              <span className="status-badge status-badge--cyan"><Check aria-hidden="true" /> HISTORICAL RECORD</span>
            </div>
            <div className="scorecard__headline">
              <div>
                <span className="micro-label">ALPHAEX / VS B&amp;H</span>
                <strong>{HOLDOUT_SUMMARY.alphaExMean.replace(" pt", "")} <small>pt mean</small></strong>
              </div>
              <div className="scorecard__period">
                <span>FOLDS 15–23</span>
                <span>9 FOLDS REPORTED</span>
              </div>
            </div>
            <div className="scorecard__chart-wrap">
              <HoldoutBarChart />
              <div className="scorecard__chart-caption">HOLDOUT ALPHAEX BY FOLD · percentage points vs B&amp;H</div>
              <div className="scorecard__chart-legend">
                <span><i className="legend-line legend-line--positive" /> POSITIVE</span>
                <span><i className="legend-line legend-line--negative" /> NEGATIVE</span>
                <span>0 = B&amp;H</span>
              </div>
            </div>
            <div className="scorecard__table-wrap" role="region" aria-label="Holdout fold detail table" tabIndex={0}>
              <table className="scorecard__table">
                <caption>Holdout fold detail · exact report values</caption>
                <thead>
                  <tr>
                    <th scope="col">FOLD</th>
                    <th scope="col">TEST PERIOD</th>
                    <th scope="col">ALPHAEX</th>
                    <th scope="col">MAXDDΔ</th>
                    <th scope="col">TURNOVER</th>
                  </tr>
                </thead>
                <tbody>
                  {HOLDOUT_FOLDS.map((fold) => (
                    <tr key={fold.fold}>
                      <th scope="row">{fold.fold}</th>
                      <td>{fold.period}</td>
                      <td className={fold.alphaEx >= 0 ? "positive" : "negative"}>{formatSignedPoint(fold.alphaEx)}</td>
                      <td className="negative">{formatSignedPoint(fold.maxDdDelta)}</td>
                      <td>{fold.turnover.toFixed(2)}×</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="scorecard__metrics">
              <div><span>MAXDDΔ</span><strong className="negative">{HOLDOUT_SUMMARY.maxDdDeltaMean}</strong><small>median {HOLDOUT_SUMMARY.maxDdDeltaMedian}; positive is worse</small></div>
              <div><span>GOAL PASS</span><strong className="negative">{HOLDOUT_SUMMARY.goalPass}</strong><small>AlphaEx ≥ +3pt &amp; MaxDDΔ ≤ −3pt</small></div>
              <div><span>TURNOVER</span><strong>{HOLDOUT_SUMMARY.turnoverMean}</strong><small>mean; max {HOLDOUT_SUMMARY.turnoverMax}</small></div>
            </div>
            <div className="scorecard__footnote">AlphaEx = strategy final return − B&amp;H final return. MaxDDΔ = strategy absolute MaxDD − B&amp;H absolute MaxDD; negative is improvement. Historical test report only.</div>
          </Reveal>

          <div className="evidence-grid__side">
            <Reveal className="artifact-card artifact-card--holdout" delay={0.1} x={20} y={18}>
              <div className="artifact-card__topline">
                <span className="status-badge status-badge--cyan"><StatusDot /> HOLDOUT</span>
                <span className="artifact-card__index">FOLDS 15–23</span>
              </div>
              <span className="micro-label">MEAN ALPHAEX / VS B&amp;H</span>
              <strong>{HOLDOUT_SUMMARY.alphaExMean.replace(" pt", "")} <small>pt</small></strong>
              <p>median {HOLDOUT_SUMMARY.alphaExMedian} · best / worst {HOLDOUT_SUMMARY.alphaExBestWorst} · goal pass {HOLDOUT_SUMMARY.goalPass}</p>
              <div className="artifact-card__bar-label"><span>POSITIVE FOLDS</span><span>{HOLDOUT_SUMMARY.positiveAlphaEx}</span></div>
              <div className="artifact-card__bar"><span style={{ width: "33.333%" }} /></div>
            </Reveal>
            <Reveal className="artifact-card artifact-card--development" delay={0.14} x={20} y={18}>
              <div className="artifact-card__topline">
                <span className="status-badge status-badge--cyan"><StatusDot tone="blue" /> DEVELOPMENT</span>
                <span className="artifact-card__index">FOLDS 0–12</span>
              </div>
              <span className="micro-label">DEV WALK-FORWARD</span>
              <strong>{DEV_SUMMARY.alphaExMean.replace(" pt", "")} <small>pt mean</small></strong>
              <p>median {DEV_SUMMARY.alphaExMedian} · positive {DEV_SUMMARY.positiveAlphaEx} · MaxDDΔ improved {DEV_SUMMARY.improvedDrawdown}</p>
            </Reveal>
            <Reveal className="artifact-card" delay={0.18} x={20} y={18}>
              <div className="artifact-card__icon"><Waypoints aria-hidden="true" /></div>
              <span className="micro-label">SELECTOR GATE</span>
              <strong>ACCEPT / REJECT / COOLDOWN</strong>
              <p>選択器は開発側で候補を選び、未使用のtest期間は結果の報告にのみ使います。</p>
              <ArrowLink href="#technology" variant="text">パイプラインを見る</ArrowLink>
            </Reveal>
          </div>
        </div>
        <p className="research-disclaimer"><Sparkles aria-hidden="true" /> ここに示す値は研究レポートの集計値です。将来の収益や実運用の成績を保証するものではなく、ライブデモは仮想ペーパートレードです。</p>
      </div>
    </section>
  );
}

function DemoSection() {
  return (
    <section id="demo" className="content-section demo-section" aria-labelledby="demo-title">
      <div className="site-container">
        <div className="section-topline">
          <Eyebrow index="05">PAPER-TRADING DEMO</Eyebrow>
          <span className="section-topline__aside">DASHBOARD / RUNTIME SURFACE</span>
        </div>
        <div className="demo-section__intro">
          <Reveal x={-24} y={0}>
            <h2 id="demo-title">そして、<br className="display-break" /><em>同じ基準でライブに追う。</em></h2>
          </Reveal>
          <Reveal className="demo-section__copy" delay={0.12} x={24} y={0}>
            <p>デモ画面では、AIのequityとB&amp;Hを同じチャートに重ね、position、trades、時刻、推論契約まで同じ基準で確認できます。</p>
            <div className="demo-section__actions">
              <ArrowLink href="/">ダッシュボードを起動</ArrowLink>
              <span className="inline-status inline-status--blue"><StatusDot tone="blue" /> PAPER TRADING / DEMO</span>
            </div>
          </Reveal>
        </div>

        <Reveal className="demo-stage" y={34}>
          <div className="demo-stage__frame">
            <div className="demo-stage__chrome">
              <div className="hero-console__window-dots" aria-hidden="true"><span /><span /><span /></div>
              <span>UNIDREAM / PAPER TRADING DEMO</span>
              <span className="demo-stage__chrome-live demo-stage__chrome-live--archived"><StatusDot tone="blue" /> VISUAL REFERENCE</span>
            </div>
            <Image
              src="/dashboard-preview.png"
              alt="UniDreamダッシュボードUIのアーカイブプレビュー。画面内の数値は現在の研究結果を示すものではありません。"
              width={1276}
              height={1765}
              className="demo-stage__image"
            />
            <div className="demo-stage__veil" aria-hidden="true" />
          </div>
          <div className="demo-stage__caption">
            <span>ARCHIVED UI PREVIEW</span>
            <span>visual structure only · live values are shown in the dashboard</span>
          </div>
          <div className="demo-stage__float demo-stage__float--one">
            <span className="micro-label">MODEL</span>
            <strong>Plan011 v31</strong>
            <span className="float-state"><StatusDot tone="blue" /> FOLD 23 / AC OVERLAY</span>
          </div>
          <div className="demo-stage__float demo-stage__float--two">
            <span className="micro-label">LAST SAMPLE POSITION</span>
            <strong>{BUNDLE_CONTRACT.lastSamplePosition}</strong>
            <span>benchmark · {BUNDLE_CONTRACT.benchmarkPosition}</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="contact-section" aria-labelledby="contact-title">
      <div className="site-container">
        <Reveal className="contact-panel" y={30}>
          <div className="contact-panel__field" aria-hidden="true"><span>OPEN</span><span>RESEARCH</span></div>
          <div className="contact-panel__content">
            <Eyebrow index="06">OPEN A CONVERSATION</Eyebrow>
            <h2 id="contact-title">新しいB&amp;Hを、<br className="display-break" /><em>共同検証する。</em></h2>
            <p>PoC導入、共同研究、デモの試用について、目的と検証したい課題をお聞かせください。</p>
            <div className="contact-panel__actions">
              <ArrowLink href="/homepage/contact">お問い合わせ</ArrowLink>
              <ArrowLink href="https://github.com/shinji-ogasa/UniDream" variant="secondary">研究リポジトリ</ArrowLink>
            </div>
          </div>
          <div className="contact-panel__meta">
            <span>ZENIQ AI / UNIDREAM</span>
            <span>RESEARCH STAGE · 2026</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function MarketingPage() {
  return (
    <main id="main-content" className="marketing-shell">
      <SiteHeader />
      <Hero />
      <StoryRibbon />
      <StateSection />
      <TechnologySection />
      <EvidenceSection />
      <DemoSection />
      <ContactSection />
      <SiteFooter />
    </main>
  );
}
