"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Database,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useRef, type ReactNode } from "react";

import { BUNDLE_CONTRACT, HOLDOUT_FOLDS, HOLDOUT_SUMMARY } from "./data";
import { ArrowLink, SiteFooter, SiteHeader } from "./components/SiteChrome";

function Reveal({
  children,
  className = "",
  delay = 0,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: "-70px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ index, children }: { index: string; children: ReactNode }) {
  return (
    <div className="vision-eyebrow">
      <span className="vision-eyebrow__index">{index}</span>
      <span>{children}</span>
    </div>
  );
}

function StatusDot({ tone = "cyan" }: { tone?: "cyan" | "lime" | "blue" }) {
  return <span className={`status-dot status-dot--${tone}`} aria-hidden="true" />;
}

function HeroArchitecture() {
  return (
    <div
      className="vision-architecture"
      role="img"
      aria-label="Buy and Holdを基準に、市場状態を読むAIの判断レイヤーを重ねる考え方"
    >
      <div className="vision-architecture__topline">
        <span>THE CORE IDEA</span>
        <span>01 / VISION</span>
      </div>

      <div className="vision-architecture__flow">
        <div className="vision-architecture__node vision-architecture__node--base">
          <span className="vision-architecture__node-label">01 / BASELINE</span>
          <strong>Buy &amp; Hold</strong>
          <p>長期投資の基準</p>
          <span className="vision-architecture__node-note">置き換えない</span>
        </div>

        <div className="vision-architecture__connector" aria-hidden="true">
          <span>市場状態を読む</span>
          <ArrowRight />
        </div>

        <div className="vision-architecture__node vision-architecture__node--overlay">
          <span className="vision-architecture__node-label">02 / AI OVERLAY</span>
          <strong>判断レイヤー</strong>
          <p>局面ごとに少し調整</p>
          <span className="vision-architecture__node-note">B&amp;Hとの差分</span>
        </div>
      </div>

      <div className="vision-architecture__outcome">
        <span className="micro-label">THE VISION</span>
        <strong>基準を残したまま、<br />AIの判断を重ねる。</strong>
        <span>長期投資をAIで再設計</span>
      </div>

      <div className="vision-architecture__footline">
        <span><StatusDot /> B&amp;H = REFERENCE</span>
        <span><StatusDot tone="lime" /> AI = DECISION LAYER</span>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section id="product" className="vision-hero" aria-labelledby="vision-hero-title">
      <div className="vision-hero__glow" aria-hidden="true" />
      <div className="site-container vision-hero__grid">
        <div className="vision-hero__copy">
          <motion.div
            className="vision-hero__kicker"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <StatusDot />
            <span>UNIDREAM / LONG-TERM INVESTING</span>
          </motion.div>

          <motion.h1
            id="vision-hero-title"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            長期投資を
            <br />
            <em>AIで再設計</em>
          </motion.h1>

          <motion.p
            className="vision-hero__lead"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            未来の価格を完璧に当てるのではなく、持ち続ける局面と、リスクを落とす局面を判断する。
          </motion.p>

          <motion.p
            className="vision-hero__support"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38 }}
          >
            UniDreamは、Buy &amp; Holdを置き換えず、市場状態を理解するAIの判断レイヤーを重ねます。
          </motion.p>

          <motion.div
            className="vision-hero__actions"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.48 }}
          >
            <ArrowLink href="#idea">考え方を読む</ArrowLink>
            <ArrowLink href="#evidence" variant="secondary">現時点の検証を見る</ArrowLink>
          </motion.div>

          <motion.div
            className="vision-hero__meta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.62 }}
          >
            <span><Database aria-hidden="true" /> B&amp;H AS THE REFERENCE</span>
            <span><ShieldCheck aria-hidden="true" /> EVIDENCE BEFORE PROMISE</span>
          </motion.div>
        </div>

        <motion.div
          className="vision-hero__visual"
          initial={{ opacity: 0, x: 30, rotate: 1.5 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 0.9, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeroArchitecture />
        </motion.div>
      </div>

      <div className="site-container vision-hero__bottom">
        <span><ArrowDown aria-hidden="true" /> SCROLL TO UNDERSTAND THE IDEA</span>
        <span>RESEARCH DEMO · NOT FINANCIAL ADVICE</span>
      </div>
    </section>
  );
}

function StoryRail() {
  return (
    <section className="vision-story-rail" aria-label="UniDreamの考え方">
      <div className="site-container vision-story-rail__inner">
        <p>UniDreamの一文</p>
        <ol>
          <li><span>01</span><strong>B&amp;Hを基準にする</strong></li>
          <li><span>02</span><strong>市場状態を読む</strong></li>
          <li><span>03</span><strong>差分を検証する</strong></li>
        </ol>
      </div>
    </section>
  );
}

function ProblemSection() {
  const problems = [
    {
      index: "01",
      title: "Buy & Holdは、全局面で最適とは限らない。",
      body: "長期では強い一方、暴落局面では大きなドローダウンをそのまま受けます。",
    },
    {
      index: "02",
      title: "価格予測だけでは、投資判断にならない。",
      body: "価格を当てることに寄りがちな機械学習では、取引判断やポジション最適化まで扱いきれません。",
    },
    {
      index: "03",
      title: "市場環境は、同じままではない。",
      body: "特定環境で強いアルゴリズムも、市場トレンドの変化に合わせた継続的な更新が必要です。",
    },
  ];

  return (
    <section id="idea" className="vision-section vision-problem" aria-labelledby="problem-title">
      <div className="site-container">
        <div className="vision-section__intro">
          <Reveal>
            <Eyebrow index="01">THE QUESTION / WHY</Eyebrow>
            <h2 id="problem-title">
              投資でAIが解くべき問いは、<em>価格を完璧に当てることではない。</em>
            </h2>
          </Reveal>
          <Reveal className="vision-section__intro-copy" delay={0.12}>
            <p className="vision-lead-copy">持ち続ける局面と、リスクを落とす局面を判断すること。</p>
            <p>
              Buy &amp; Holdを基準にしながら、どの局面でリスクを少し抑え、どの局面でリターン機会を少し取りに行くかを判断する。それがUniDreamの出発点です。
            </p>
          </Reveal>
        </div>

        <div className="vision-problem-grid">
          {problems.map((problem, index) => (
            <Reveal key={problem.index} className="vision-problem-card" delay={index * 0.08}>
              <span className="vision-problem-card__index">{problem.index}</span>
              <h3>{problem.title}</h3>
              <p>{problem.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ApproachSection() {
  const steps = [
    {
      index: "01",
      label: "REFERENCE",
      title: "B&Hを基準にする",
      body: "長期投資の基準線を置き、AIがどれだけ動かしたかを差分として読む。",
      tone: "base",
    },
    {
      index: "02",
      label: "JUDGEMENT",
      title: "市場状態を理解する",
      body: "市場の状態を読み、target positionへ変換する。予測を単独で売りにしない。",
      tone: "state",
    },
    {
      index: "03",
      label: "EVIDENCE",
      title: "B&Hとの差分で検証する",
      body: "AlphaExとMaxDDΔを同じ基準で見て、結果と未達を分けて残す。",
      tone: "proof",
    },
  ];

  return (
    <section id="research" className="vision-section vision-approach" aria-labelledby="approach-title">
      <div className="site-container">
        <div className="vision-section__intro vision-section__intro--approach">
          <Reveal>
            <Eyebrow index="02">THE APPROACH / HOW</Eyebrow>
            <h2 id="approach-title">B&amp;Hを置き換えず、<em>AIの判断レイヤーを重ねる。</em></h2>
          </Reveal>
          <Reveal className="vision-section__intro-copy" delay={0.12}>
            <p className="vision-lead-copy">B&amp;Hを置き換えず、コストを払ってもAlphaを残すAI Overlay。</p>
            <p>市場状態を理解するAIを、既存の長期投資の上に重ねる。UniDreamがつくろうとしているのは、投資そのものの代替ではなく、判断のためのレイヤーです。</p>
          </Reveal>
        </div>

        <div className="vision-flow" aria-label="UniDreamの判断フロー">
          {steps.map((step, index) => (
            <Reveal key={step.index} className={`vision-flow__step vision-flow__step--${step.tone}`} delay={index * 0.08}>
              <div className="vision-flow__step-topline">
                <span>{step.index}</span>
                <span>{step.label}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              {index < steps.length - 1 && <ArrowRight className="vision-flow__arrow" aria-hidden="true" />}
            </Reveal>
          ))}
        </div>

        <Reveal className="vision-contract" delay={0.12}>
          <div>
            <span className="micro-label">ARCHIVED PLAN011 PROTOTYPE</span>
            <strong>考え方を、実際に計算できる形へ</strong>
            <p>旧Plan011の実装は、BTCUSDTの15分足を使い、B&amp;H近傍のポジションを推論しました。</p>
          </div>
          <div className="vision-contract__facts" aria-label="旧Plan011プロトタイプの入力仕様">
            <span><b>{BUNDLE_CONTRACT.symbol}</b><small>SYMBOL</small></span>
            <span><b>{BUNDLE_CONTRACT.interval}</b><small>INTERVAL</small></span>
            <span><b>{BUNDLE_CONTRACT.featureCount}</b><small>FEATURES</small></span>
            <span><b>{BUNDLE_CONTRACT.sequenceLength}</b><small>BARS / SEQ</small></span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function HoldoutBarChart() {
  const chartLeft = 42;
  const chartRight = 690;
  const zeroY = 112;
  const scale = 66;
  const barWidth = 34;
  const step = (chartRight - chartLeft) / HOLDOUT_FOLDS.length;

  return (
    <svg
      className="vision-evidence-chart"
      viewBox="0 0 730 205"
      role="img"
      aria-label="2024年から2026年のホールドアウト各foldにおけるAlphaExの棒グラフ"
    >
      <g className="vision-evidence-chart__grid">
        <path d={`M${chartLeft} ${zeroY - scale}H${chartRight}`} />
        <path d={`M${chartLeft} ${zeroY - scale / 2}H${chartRight}`} />
        <path d={`M${chartLeft} ${zeroY}H${chartRight}`} />
        <path d={`M${chartLeft} ${zeroY + scale / 2}H${chartRight}`} />
      </g>
      <line className="vision-evidence-chart__zero" x1={chartLeft} x2={chartRight} y1={zeroY} y2={zeroY} />
      <text className="vision-evidence-chart__axis" x="2" y={zeroY - scale + 4}>+1.0</text>
      <text className="vision-evidence-chart__axis" x="11" y={zeroY + 4}>0.0</text>
      <text className="vision-evidence-chart__axis" x="2" y={zeroY + scale / 2 + 4}>−0.5</text>
      {HOLDOUT_FOLDS.map((fold, index) => {
        const height = Math.max(Math.abs(fold.alphaEx) * scale, 2);
        const x = chartLeft + step * index + (step - barWidth) / 2;
        const y = fold.alphaEx >= 0 ? zeroY - height : zeroY;

        return (
          <g key={fold.fold}>
            <title>{`Fold ${fold.fold} (${fold.period}): AlphaEx ${fold.alphaEx >= 0 ? "+" : ""}${fold.alphaEx.toFixed(2)}pt`}</title>
            <rect
              className={`vision-evidence-chart__bar ${fold.alphaEx >= 0 ? "vision-evidence-chart__bar--positive" : "vision-evidence-chart__bar--negative"}`}
              x={x}
              y={y}
              width={barWidth}
              height={height}
              rx="2"
            />
            <text className="vision-evidence-chart__fold" x={x + barWidth / 2} y="197" textAnchor="middle">{fold.fold}</text>
          </g>
        );
      })}
    </svg>
  );
}

function EvidenceSection() {
  return (
    <section id="evidence" className="vision-section vision-evidence" aria-labelledby="evidence-title">
      <div className="site-container">
        <div className="vision-section__intro vision-section__intro--evidence">
          <Reveal>
            <Eyebrow index="03">THE PROOF / EVIDENCE</Eyebrow>
            <h2 id="evidence-title">Visionは、<em>B&amp;Hとの差分で検証する。</em></h2>
          </Reveal>
          <Reveal className="vision-section__intro-copy" delay={0.12}>
            <p className="vision-lead-copy">目標は、AlphaExを増やし、MaxDDΔを小さくすること。</p>
            <p>ここでは旧Plan011のholdout結果を研究アーカイブとして残します。最新のWorld Modelと学習済みRLの選定結果は、デモの検証欄で確認できます。</p>
          </Reveal>
        </div>

        <Reveal className="vision-evidence__thesis" y={20}>
          <div>
            <span className="micro-label">NORTH STAR / TARGET</span>
            <div className="vision-evidence__target-values">
              <strong>AlphaEx <b>+</b></strong>
              <strong>MaxDDΔ <b>−</b></strong>
            </div>
            <p>B&amp;Hよりリターンを増やし、ドローダウンを小さくする。</p>
          </div>
          <div className="vision-evidence__target-note">
            <span className="micro-label">ARCHIVED PLAN011 RESULTS</span>
            <strong>証明は、まだ途中。</strong>
            <p>旧Plan011の平均AlphaExはプラス。一方、MaxDDΔは正が悪化を意味し、DD改善は0 / 9でした。</p>
          </div>
        </Reveal>

        <div className="vision-evidence__layout">
          <Reveal className="vision-scorecard" y={18}>
            <div className="vision-scorecard__topline">
              <div>
                <span className="micro-label">PLAN011 V31 / HISTORICAL SNAPSHOT</span>
                <strong>ARCHIVED HOLDOUT / B&amp;H COMPARISON</strong>
              </div>
              <span className="vision-status vision-status--good"><Check aria-hidden="true" /> HISTORICAL RECORD</span>
            </div>

            <div className="vision-scorecard__metrics">
              <div>
                <span>ALPHAEX / VS B&amp;H</span>
                <strong className="vision-scorecard__positive">{HOLDOUT_SUMMARY.alphaExMean}</strong>
                <small>mean · cost after</small>
              </div>
              <div>
                <span>MAXDDΔ / VS B&amp;H</span>
                <strong className="vision-scorecard__negative">{HOLDOUT_SUMMARY.maxDdDeltaMean}</strong>
                <small>positive is worse</small>
              </div>
              <div>
                <span>DD IMPROVED</span>
                <strong>{HOLDOUT_SUMMARY.improvedDrawdown}</strong>
                <small>holdout folds</small>
              </div>
            </div>

            <div className="vision-scorecard__chart-wrap">
              <HoldoutBarChart />
              <div className="vision-scorecard__chart-caption">
                <span>HOLDOUT ALPHAEX BY FOLD · percentage points vs B&amp;H</span>
                <span><i className="vision-legend__line vision-legend__line--positive" /> positive <i className="vision-legend__line vision-legend__line--negative" /> negative</span>
              </div>
            </div>

            <div className="vision-scorecard__footline">
              <span>median {HOLDOUT_SUMMARY.alphaExMedian}</span>
              <span>best / worst {HOLDOUT_SUMMARY.alphaExBestWorst}</span>
              <span>goal pass {HOLDOUT_SUMMARY.goalPass}</span>
            </div>
          </Reveal>

          <Reveal className="vision-evidence__read" delay={0.1} y={18}>
            <div className="vision-evidence__read-icon"><Sparkles aria-hidden="true" /></div>
            <span className="micro-label">HOW TO READ THIS</span>
            <h3>成果を、成果以上に見せない。</h3>
            <p>
              AlphaEx meanは取引コスト控除後のB&amp;Hとの差分です。MaxDDΔは正が悪化、負が改善。旧Plan011の結果は、Alphaを残す可能性を示す一方、DD削減の目標は未達でした。
            </p>
            <ArrowLink href="https://github.com/shinji-ogasa/UniDream/blob/main/docs/plan011_v31_investor_evidence.md" variant="text">研究レポートの原文を見る</ArrowLink>
          </Reveal>
        </div>

        <p className="vision-disclaimer"><ShieldCheck aria-hidden="true" /> 研究レポートの集計値です。将来の収益や実運用の成績を保証するものではありません。</p>
      </div>
    </section>
  );
}

function DemoSection() {
  return (
    <section id="demo" className="vision-section vision-demo" aria-labelledby="demo-title">
      <div className="site-container">
        <div className="vision-section__intro vision-section__intro--demo">
          <Reveal>
            <Eyebrow index="04">THE PROTOTYPE / LIVE DEMO</Eyebrow>
            <h2 id="demo-title">研究結果を、<em>継続して確かめる形へ。</em></h2>
          </Reveal>
          <Reveal className="vision-section__intro-copy" delay={0.12}>
            <p className="vision-lead-copy">15分ごとの実モデル推論を、記録と比較へ。</p>
            <p>World Modelと学習済みRLの判断を、記録・B&amp;H比較・可視化につなげます。現在の公開状況と最終更新時刻は、ダッシュボードで確認できます。</p>
            <div className="vision-demo__actions">
              <ArrowLink href="/">ライブデモを開く</ArrowLink>
              <span className="vision-inline-status"><StatusDot tone="blue" /> PAPER TRADING / DEMO</span>
            </div>
          </Reveal>
        </div>

        <Reveal className="vision-demo__frame" y={30}>
          <div className="vision-demo__chrome">
            <div className="vision-demo__dots" aria-hidden="true"><span /><span /><span /></div>
            <span>UNIDREAM / PAPER TRADING DEMO</span>
            <span className="vision-demo__chrome-status"><StatusDot tone="blue" /> VISUAL REFERENCE</span>
          </div>
          <Image
            src="/dashboard-preview.png"
            alt="UniDreamのペーパートレードダッシュボードのプレビュー"
            width={1276}
            height={1765}
            className="vision-demo__image"
          />
          <div className="vision-demo__caption">
            <span>ARCHIVED UI PREVIEW</span>
            <span>live values are shown in the dashboard</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ClosingSection() {
  const next = [
    "Alphaを維持したままDrawdown削減",
    "複数銘柄・ポートフォリオへの拡張",
    "実顧客条件でのPilotとlive evidence",
  ];

  return (
    <section id="contact" className="vision-closing" aria-labelledby="closing-title">
      <div className="site-container">
        <Reveal className="vision-closing__panel" y={30}>
          <div className="vision-closing__copy">
            <Eyebrow index="05">THE HORIZON / NEXT</Eyebrow>
            <h2 id="closing-title">長期投資をAIで再設計する。</h2>
            <p>市場状態を理解するAIの判断レイヤーを重ね、B&amp;Hを再設計する。Visionは、次の検証へ続きます。</p>
            <div className="vision-closing__actions">
              <ArrowLink href="/homepage/contact">PoC・共同研究を相談する</ArrowLink>
              <ArrowLink href="https://github.com/shinji-ogasa/UniDream" variant="secondary">研究リポジトリを見る</ArrowLink>
            </div>
          </div>
          <div className="vision-closing__next">
            <span className="micro-label">NEXT VALIDATION</span>
            <ol>
              {next.map((item, index) => (
                <li key={item}><span>0{index + 1}</span><strong>{item}</strong></li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function MarketingPage() {
  return (
    <main id="main-content" className="marketing-shell vision-page">
      <SiteHeader />
      <Hero />
      <aside className="btc-marketing-release-note">このページの入力仕様・検証値・プレビューは旧Plan011の研究アーカイブです。最新のWorld Modelと学習済みRLの選定結果・公開状況は、デモで確認できます。<Link href="/">選定根拠と公開後の比較へ →</Link></aside>
      <StoryRail />
      <ProblemSection />
      <ApproachSection />
      <EvidenceSection />
      <DemoSection />
      <ClosingSection />
      <SiteFooter />
    </main>
  );
}
