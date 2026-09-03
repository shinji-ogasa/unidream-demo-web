"use client";

import Image from "next/image";
import { motion, useInView } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CircleDashed,
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
  HERO_READOUTS,
  HOLDOUT_FOLDS,
  HOLDOUT_SUMMARY,
  METRIC_RAIL,
  PRINCIPLES,
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

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x, y }}
      animate={visible ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x, y }}
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

function HeroConsole() {
  return (
    <div className="hero-console" aria-label="UniDreamの現行推論バンドル契約">
      <div className="hero-console__topbar">
        <div className="hero-console__window-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span>UNIDREAM / BUNDLE CONTRACT</span>
        <span className="hero-console__topbar-index">FOLD {BUNDLE_CONTRACT.fold}</span>
      </div>

      <div className="hero-console__body">
        <div className="hero-console__heading">
          <div>
            <span className="micro-label">DEPLOYED INFERENCE BUNDLE</span>
            <strong>Plan011 v31 / AC overlay</strong>
          </div>
          <span className="console-live"><StatusDot tone="lime" /> SAMPLE VERIFIED</span>
        </div>

        <div className="hero-console__readout">
          <span className="micro-label">LAST EXPORTED SAMPLE POSITION</span>
          <strong>{BUNDLE_CONTRACT.lastSamplePosition}</strong>
          <span className="hero-console__delta">benchmark {BUNDLE_CONTRACT.benchmarkPosition}</span>
        </div>

        <div className="hero-console__contract-grid" aria-label="現行バンドルの入力契約">
          <div>
            <span>OBS DIM</span>
            <strong>{BUNDLE_CONTRACT.featureCount}</strong>
            <small>features</small>
          </div>
          <div>
            <span>SEQ LEN</span>
            <strong>{BUNDLE_CONTRACT.sequenceLength}</strong>
            <small>bars</small>
          </div>
          <div>
            <span>MAX ABS DIFF</span>
            <strong>{BUNDLE_CONTRACT.maxAbsDiff}</strong>
            <small>sample strict</small>
          </div>
        </div>

        <div className="hero-console__rows">
          {HERO_READOUTS.map((readout) => (
            <div className="hero-console__row" key={readout.label}>
              <span><StatusDot tone={readout.tone} />{readout.label}</span>
              <strong className={`console-value console-value--${readout.tone}`}>{readout.value}</strong>
            </div>
          ))}
        </div>

        <div className="hero-console__footer">
          <span><CircleDashed aria-hidden="true" /> {BUNDLE_CONTRACT.status}</span>
          <span>{BUNDLE_CONTRACT.symbol} · {BUNDLE_CONTRACT.interval} · seq {BUNDLE_CONTRACT.sequenceLength}</span>
        </div>
      </div>
      <div className="hero-console__scanline" aria-hidden="true" />
    </div>
  );
}

function SignalMarquee({ muted = false }: { muted?: boolean }) {
  const content = "WORLD MODEL   ✦   WALK-FORWARD   ✦   MARKET STATE   ✦   RISK-AWARE POLICY   ✦   ";
  return (
    <div className={`signal-marquee ${muted ? "signal-marquee--muted" : ""}`} aria-hidden="true">
      <div className="signal-marquee__track">
        <span>{content}</span>
        <span>{content}</span>
      </div>
    </div>
  );
}

function MetricRail() {
  return (
    <section className="metric-rail" aria-label="UniDreamの研究スコープ">
      <div className="site-container metric-rail__inner">
        {METRIC_RAIL.map((metric, index) => (
          <div className="metric-rail__item" key={metric.label}>
            <span className="metric-rail__index">0{index + 1}</span>
            <div>
              <span className="metric-rail__label">{metric.label}</span>
              <strong>{metric.value}</strong>
              <span className="metric-rail__detail">{metric.detail}</span>
            </div>
          </div>
        ))}
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
            <span>EVIDENCE-FIRST MARKET MODELING</span>
            <span className="hero-kicker__line" aria-hidden="true" />
            <span>2026.09</span>
          </motion.div>

          <motion.h1
            id="hero-title"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            市場の隠れた
            <br className="display-break" />
            <span>
              構造を、
              <br className="display-break" />
              世界モデルで読む。
            </span>
          </motion.h1>

          <motion.p
            className="marketing-hero__lead"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            UniDreamは、Transformer世界モデルで市場状態を学習し、
            <br className="desktop-only" />
            強化学習と検証ゲートを通じて、意思決定へ変換する研究開発プロダクトです。
          </motion.p>

          <motion.div
            className="marketing-hero__actions"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.42 }}
          >
            <ArrowLink href="/">ライブデモを見る</ArrowLink>
            <ArrowLink href="#research" variant="secondary">仕組みを知る</ArrowLink>
          </motion.div>

          <motion.div
            className="marketing-hero__meta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.58 }}
          >
            <span><Database aria-hidden="true" /> DATA / 15m CLOSED BARS</span>
            <span><ShieldCheck aria-hidden="true" /> PAPER-TRADING ONLY</span>
          </motion.div>
        </div>

        <motion.div
          className="marketing-hero__visual"
          initial={{ opacity: 0, x: 36, rotate: 2 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 0.9, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero-visual__index">01 / MODEL CONTRACT</div>
          <HeroConsole />
          <div className="hero-visual__stamp">
            <span>BUNDLE</span>
            <span>CONTRACT</span>
            <span>VERIFIED</span>
          </div>
        </motion.div>
      </div>

      <div className="marketing-hero__bottom site-container">
        <span className="hero-scroll"><ArrowDown aria-hidden="true" /> SCROLL TO EXPLORE</span>
        <span className="hero-bottom-note">HISTORICAL EVIDENCE · EXPLICIT LIMITS</span>
      </div>
      <SignalMarquee />
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
    <div className="contract-matrix" aria-label="現行推論バンドルの検証済み契約">
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
          <Eyebrow index="01">MARKET STATE</Eyebrow>
          <span className="section-topline__aside">FROM PRICE HISTORY TO LATENT STRUCTURE</span>
        </div>

        <div className="state-section__intro">
          <Reveal className="state-section__headline" x={-24} y={0}>
            <h2 id="state-title">
              動きを追うのではなく、
              <br className="display-break" />
              <em>状態を読む。</em>
            </h2>
          </Reveal>
          <Reveal className="state-section__copy" delay={0.12} x={24} y={0}>
            <p>
              UniDreamは価格・ボリューム・デリバティブ時系列を17特徴量に整形し、64本の15分足を1サンプルとして世界モデルに渡します。
            </p>
            <p className="muted-copy">
              ここで表示するのは、現行バンドルの契約とサンプル検証結果です。市場の局面や将来の収益を断定する表示ではありません。
            </p>
            <div className="inline-status"><StatusDot tone="cyan" /> MODEL CONTRACT / EXPLICIT</div>
          </Reveal>
        </div>

        <Reveal className="state-board" y={30}>
          <div className="state-board__header">
            <div>
              <span className="micro-label">BUNDLE CONTRACT / VERIFIED SAMPLE</span>
              <strong>{BUNDLE_CONTRACT.symbol} · {BUNDLE_CONTRACT.interval} · FOLD {BUNDLE_CONTRACT.fold}</strong>
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
                  <span className="micro-label">BUNDLE</span>
                  <strong>Plan011 v31 / AC overlay</strong>
                  <p>fold 23 · latest_holdout_candidate</p>
                </div>
              </div>
              <div className="state-note">
                <span className="state-note__marker">17</span>
                <div>
                  <span className="micro-label">FEATURE CONTRACT</span>
                  <strong>17 features × 64 bars</strong>
                  <p>z-score window 60d. The sample follows the explicit bundle schema.</p>
                </div>
              </div>
              <div className="state-note">
                <span className="state-note__marker">Δ</span>
                <div>
                  <span className="micro-label">SAMPLE VERIFICATION</span>
                  <strong>max_abs_diff = {BUNDLE_CONTRACT.maxAbsDiff}</strong>
                  <p>strict_ok=true · last exported position {BUNDLE_CONTRACT.lastSamplePosition}; benchmark position {BUNDLE_CONTRACT.benchmarkPosition}.</p>
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
          <Eyebrow index="02">RESEARCH PIPELINE</Eyebrow>
          <span className="section-topline__aside">TRACEABLE TRAINING · INFERENCE · TEST</span>
        </div>
        <div className="technology-section__intro">
          <Reveal x={-24} y={0}>
            <h2 id="technology-title">データから、検証可能な<br className="display-break" /><em>意思決定まで。</em></h2>
          </Reveal>
          <Reveal className="technology-section__copy" delay={0.12} x={24} y={0}>
            <p>学習・推論・検証を一つの線として扱い、各段階の入力、状態、判定を追跡できるように設計しています。</p>
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
          <Eyebrow index="03">EVIDENCE / SCORECARD</Eyebrow>
          <span className="section-topline__aside">B&amp;H-RELATIVE · HOLDOUT AWARE</span>
        </div>
        <div className="evidence-section__intro">
          <Reveal x={-24} y={0}>
            <h2 id="evidence-title">検証を、数字だけでなく<br className="display-break" /><em>アーティファクトで追う。</em></h2>
          </Reveal>
          <Reveal className="evidence-section__copy" delay={0.12} x={24} y={0}>
            <p>見栄えのよいバックテスト曲線だけでは、運用判断には進めません。fold、比較対象、ドローダウン、回転率、未学習期間を同じスコアカードに残します。</p>
            <ArrowLink href="https://github.com/shinji-ogasa/UniDream/blob/main/docs/plan011_v31_investor_evidence.md" variant="text">研究レポートの原文を見る</ArrowLink>
          </Reveal>
        </div>

        <div className="evidence-grid">
          <Reveal className="scorecard" x={-20} y={18}>
            <div className="scorecard__topline">
              <div>
                <span className="micro-label">PLAN011 V31 / HISTORICAL SNAPSHOT</span>
                <strong>UNTOUCHED HOLDOUT / SCORECARD</strong>
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
            <div className="scorecard__table-wrap">
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

function PrinciplesSection() {
  return (
    <section className="content-section principles-section" aria-labelledby="principles-title">
      <div className="site-container">
        <div className="section-topline">
          <Eyebrow index="04">DESIGN PRINCIPLES</Eyebrow>
          <span className="section-topline__aside">CALM · PRECISE · EXPLICIT</span>
        </div>
        <div className="principles-section__intro">
          <Reveal x={-24} y={0}>
            <h2 id="principles-title">長期投資の判断を、<br className="display-break" /><em>静かに強くする。</em></h2>
          </Reveal>
          <Reveal className="principles-section__copy" delay={0.12} x={24} y={0}>
            <p>UniDreamが目指すのは、派手な予測画面ではありません。状態、行動、検証の境界を明確にし、人間が判断を追える運用基盤です。</p>
          </Reveal>
        </div>
        <div className="principles-grid">
          {PRINCIPLES.map((principle, index) => (
            <Reveal className={`principle-card principle-card--${principle.tone}`} key={principle.index} delay={index * 0.08} y={20}>
              <span className="principle-card__index">{principle.index}</span>
              <div className="principle-card__line" aria-hidden="true" />
              <h3>{principle.title}</h3>
              <p>{principle.body}</p>
              <span className="principle-card__arrow"><ArrowRight aria-hidden="true" /></span>
            </Reveal>
          ))}
        </div>
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
            <h2 id="demo-title">状態が、ポジションと<br className="display-break" /><em>証跡に変わる場所。</em></h2>
          </Reveal>
          <Reveal className="demo-section__copy" delay={0.12} x={24} y={0}>
            <p>ダッシュボードでは、推論結果だけでなく、equity、position、trades、データ時刻、推論契約をひとつの画面で確認できます。</p>
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
            <span>visual structure only · research values are shown in the scorecard above</span>
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
            <h2 id="contact-title">共同検証を、<br className="display-break" /><em>次の実験へ。</em></h2>
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
      <MetricRail />
      <SignalMarquee muted />
      <StateSection />
      <TechnologySection />
      <EvidenceSection />
      <PrinciplesSection />
      <DemoSection />
      <ContactSection />
      <SiteFooter />
    </main>
  );
}
