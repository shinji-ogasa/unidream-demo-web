"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Globe2,
  LineChart,
  LockKeyhole,
  Radar,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { FaGithub, FaLinkedin, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { SiHuggingface } from "react-icons/si";

import { PipelineFlow } from "@/components/PipelineFlow";

const NAV_ITEMS = ["プロダクト", "研究成果", "技術", "研究", "会社情報"];

const METRICS = [
  { label: "Market", value: "BTCUSDT · 15m", sub: "2018–2026 の実データで検証", color: "text-[#02b8cc]" },
  { label: "Benchmark", value: "Buy & Hold", sub: "単純保有に対する超過性能を測定", color: "text-[#8a93a3]" },
  { label: "Scale", value: "0-12 Fold 完走", sub: "AlphaEx +41.79pt", color: "text-[#4ade80]" },
  { label: "Holdout", value: "2024-2026", sub: "未学習期間で汎化検証", color: "text-[#5266eb]" },
];

const SOCIAL_LINKS = [
  { label: "X", href: "#", icon: FaXTwitter },
  { label: "GitHub", href: "https://github.com/shinji-ogasa/UniDream", icon: FaGithub },
  { label: "Hugging Face", href: "https://huggingface.co/spaces/ShinjiAA/unidream-space", icon: SiHuggingface },
  { label: "LinkedIn", href: "#", icon: FaLinkedin },
  { label: "YouTube", href: "#", icon: FaYoutube },
];

function AnimateInView({
  children, className = "", delay = 0, x = 0, y = 24,
}: {
  children: React.ReactNode; className?: string; delay?: number; x?: number; y?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x, y }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x, y }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base font-semibold tracking-[0.12em] text-[#8a93a3] mb-3">{children}</p>
  );
}

function CtaButton({ children, variant = "primary", href }: { children: React.ReactNode; variant?: "primary" | "secondary"; href?: string }) {
  const cls = variant === "primary" ? "btn-primary" : "btn-secondary";
  const inner = (
    <>
      {children}
      <ArrowRight className="h-4 w-4 ml-1" />
    </>
  );
  if (href?.startsWith("/")) {
    return <Link href={href} className={cls + " inline-flex items-center gap-1"}>{inner}</Link>;
  }
  if (href) {
    return <a href={href} className={cls + " inline-flex items-center gap-1"} target="_blank" rel="noopener noreferrer">{inner}</a>;
  }
  return <button type="button" className={cls + " inline-flex items-center gap-1"}>{inner}</button>;
}

function Logo() {
  return (
    <Link href="/homepage" className="flex items-center shrink-0" aria-label="Zeniq">
      <Image src="/Zeniq-logo.png" alt="Zeniq" height={56} width={224} priority unoptimized className="h-10 md:h-14 w-auto" />
    </Link>
  );
}

function SocialButton({ label, href, icon: Icon }: { label: string; href: string; icon: React.ElementType }) {
  const isExternal = href.startsWith("http");
  return (
    <a href={href} aria-label={label} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined}
      className="grid h-11 w-11 place-items-center rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-base text-[#8a93a3] transition hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.16)] hover:text-[#f4f7fb]"
    >
      <Icon />
    </a>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card p-6">
      <p className="label">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-[-0.04em] ${color}`}>{value}</p>
      <p className="mt-2 text-sm font-medium text-[#8a93a3]">{sub}</p>
    </div>
  );
}

function Footer() {
  const columns: [string, ...string[]][] = [
    ["プロダクト", "UniDreamとは", "ダッシュボード", "API"],
    ["研究", "研究アプローチ", "論文・レポート", "ベンチマーク"],
    ["会社", "会社概要", "採用情報", "お問い合わせ"],
  ];
  return (
    <footer className="border-t border-[rgba(255,255,255,0.08)] py-12">
      <div className="container-site">
        <div className="flex flex-wrap justify-between items-start gap-10">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-6 text-[#8a93a3]">Transformer world modelと強化学習で市場状態を理解する。</p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL_LINKS.map((item) => (<SocialButton key={item.label} {...item} />))}
            </div>
          </div>
          <div className="flex flex-wrap gap-10 md:mr-16">
            {columns.map((col) => (
              <div key={col[0]}>
                <h4 className="mb-4 text-sm font-semibold text-[#f4f7fb]">{col[0]}</h4>
                <ul className="space-y-3">
                  {col.slice(1).map((item) => (<li key={item} className="text-sm text-[#8a93a3] hover:text-[#f4f7fb] transition cursor-default">{item}</li>))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 pt-5 border-t border-[rgba(255,255,255,0.08)] flex flex-wrap justify-between gap-4 text-xs text-[#626b7a]">
          <p>© 2026 Zeniq AI</p>
          <div className="flex gap-6"><span>Privacy</span><span>Terms</span></div>
        </div>
      </div>
    </footer>
  );
}

export default function HomepagePage() {
  return (
    <main className="site-bg min-h-screen text-[#f4f7fb] antialiased">
      {/* header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(8,9,10,0.80)] backdrop-blur-xl"
      >
        <div className="container-site flex items-center justify-between py-4 md:py-5">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#8a93a3] lg:flex">
            {NAV_ITEMS.map((item) => (<a key={item} href="#" className="transition hover:text-[#f4f7fb]">{item}</a>))}
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-[#8a93a3] transition hover:text-[#f4f7fb]">デモ</Link>
            <Link href="/homepage/contact" className="btn-primary text-sm py-2 px-5 inline-flex items-center">問い合わせ</Link>
          </div>
        </div>
      </motion.header>

      {/* hero */}
      <section className="relative flex flex-col pt-24 md:pt-32 min-h-[680px]">
        <div className="hero-visual-bg" />
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-8 py-10 md:py-16 w-full">
          <div className="max-w-[760px]">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-7 inline-flex rounded-full border border-[rgba(82,102,235,0.3)] bg-[rgba(82,102,235,0.12)] px-5 py-1.5 text-sm font-semibold text-[#5266eb]"
            >
              UniDream · Zeniq
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-[clamp(2.8rem,6vw,5rem)] font-semibold tracking-[-0.05em] leading-[1.04] text-[#f4f7fb]"
            >
              市場の見えない構造を、<br />世界モデルで読む。
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-7 max-w-[680px] text-lg leading-8 text-[#8a93a3]"
            >
              UniDreamは、長期投資を「持つだけ」から「市場状態に応じて最適化する」へ進化させるAI運用基盤です。Transformer世界モデルと強化学習により、銘柄選定・リスク管理・ポジション調整・売買判断を一貫して学習し、Buy &amp; Holdの弱点である大きなドローダウンと機会損失を改善します。
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mt-9 flex flex-wrap gap-4"
            >
              <CtaButton href="/">デモを見る</CtaButton>
              <CtaButton variant="secondary" href="/homepage/contact">PoC導入を相談する</CtaButton>
              <CtaButton variant="secondary" href="https://github.com/shinji-ogasa/UniDream">研究概要を読む</CtaButton>
            </motion.div>
          </div>

          {/* product preview inside hero (DESIGN.md §9-1, §20) */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mt-14 md:mt-20 relative"
          >
            <div className="absolute -inset-8 rounded-[56px] bg-gradient-to-r from-[rgba(82,102,235,0.14)] via-[rgba(2,184,204,0.08)] to-[rgba(139,92,246,0.10)] blur-3xl pointer-events-none" />
            <div className="relative dashboard-frame">
              <Image
                src="/dashboard-preview.png"
                alt="UniDream ライブ推論ダッシュボード"
                width={1400}
                height={900}
                priority
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* metrics strip */}
      <section className="container-site relative z-10 -mt-6 pb-8 md:pb-12">
        <div className="grid gap-4 md:grid-cols-4">
          {METRICS.map((m) => (
            <AnimateInView key={m.label} y={16}>
              <MetricCard {...m} />
            </AnimateInView>
          ))}
        </div>
      </section>

      {/* for whom — 誰の何を変えるのか */}
      <section className="container-site py-8 md:py-10">
        <div className="max-w-[680px] mb-8">
          <SectionLabel>FOR WHOM</SectionLabel>
          <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-semibold tracking-[-0.05em] leading-[1.05] text-[#f4f7fb] mb-4">長期投資を、AIで再設計する。</h2>
          <p className="text-lg leading-8 text-[#8a93a3]">
            UniDreamは、信託・アセットマネージャー・ファンドなど、長期で資産を預かる運用者のために設計されています。
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
          <AnimateInView className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-6" x={-16} y={0}>
            <p className="text-xs font-semibold tracking-[0.12em] text-[#ff6467] mb-2">PAIN</p>
            <p className="text-base leading-6 text-[#d0d6e0]">Buy & Holdは長期では強い一方で、暴落局面のドローダウン、回復までの時間、銘柄入れ替え、ポジション調整を人間の判断に依存している。</p>
          </AnimateInView>
          <div className="flex items-center justify-center self-stretch">
            <ArrowRight className="h-6 w-6 text-[#5266eb] rotate-90 md:rotate-0" />
          </div>
          <AnimateInView className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-6" x={16} y={0} delay={0.15}>
            <p className="text-xs font-semibold tracking-[0.12em] text-[#4ade80] mb-2">SOLUTION</p>
            <p className="text-base leading-6 text-[#d0d6e0]">UniDreamは長期投資のリターンを維持・改善しながら、MaxDDを抑える意思決定AI。銘柄選定から取引最適化までAIが一貫実行する。</p>
          </AnimateInView>
        </div>
      </section>

      {/* evidence / scorecard (DESIGN.md §9-5) */}
      <section className="container-site py-12 md:py-16 pb-8 md:pb-10">
        <div className="mb-6 max-w-[680px]">
          <SectionLabel>EVIDENCE</SectionLabel>
          <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-semibold tracking-[-0.05em] leading-[1.05] text-[#f4f7fb]">B&H改善の検証結果</h2>
          <p className="mt-4 text-lg leading-8 text-[#8a93a3]">
            Plan011 v31 は、Transformer世界モデルによる市場状態推定と Actor-Critic によるポジション最適化を組み合わせた低回転オーバーレイモデルです。BTCUSDT 15分足を対象に、2018〜2026の Walk-Forward 検証により Buy & Hold 比での超過性能とドローダウン改善を確認しています。
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <AnimateInView className="card p-8 md:p-10 border-[rgba(94,106,210,0.36)]" x={-20} y={0}>
            <div className="flex items-start gap-3 mb-6">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[rgba(82,102,235,0.16)]"><Zap className="h-5 w-5 text-[#5266eb]" strokeWidth={2} /></div>
              <div><p className="text-base font-semibold text-[#f4f7fb]">Plan011 v31 · 0-12 Fold Scale</p><p className="text-sm text-[#8a93a3]">Walk-Forward 全13fold 完走</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-4">
              <div><p className="label">AlphaEx</p><p className="mt-1 text-4xl font-semibold font-mono text-[#5266eb]">+41.79 pt</p></div>
              <div><p className="label">MaxDDΔ</p><p className="mt-1 text-4xl font-semibold font-mono text-[#4ade80]">+0.20 pt</p></div>
              <div><p className="label">Worst Fold</p><p className="mt-1 text-4xl font-semibold font-mono text-[#8b5cf6]">−1.28 pt</p></div>
            </div>
            <p className="mt-5 text-sm text-[#626b7a] leading-5">AlphaEx +41.79pt。最悪foldでも−1.28pt、大きく壊れるfoldなし。低回転で安定したB&Hオーバーレイ。</p>
          </AnimateInView>
          <AnimateInView className="card p-8 md:p-10 flex flex-col justify-between" x={20} y={0} delay={0.15}>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[rgba(74,222,128,0.12)]"><ShieldCheck className="h-5 w-5 text-[#4ade80]" strokeWidth={2} /></div>
                <div><p className="text-base font-semibold text-[#f4f7fb]">Holdout 2024-2026</p><p className="text-sm text-[#8a93a3]">未学習の9foldで汎化検証</p></div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div><p className="label">AlphaEx</p><p className="mt-1 text-3xl font-semibold font-mono text-[#02b8cc]">+2.32 pt</p></div>
                <div><p className="label">MaxDDΔ</p><p className="mt-1 text-3xl font-semibold font-mono text-[#4ade80]">+0.20 pt</p></div>
              </div>
            </div>
            <p className="mt-5 text-sm text-[#626b7a] leading-5">未学習の2024-2026でもAlphaEx最大+11.35ptを記録。低回転（TO avg 0.60）で汎化性能を確認。</p>
          </AnimateInView>
        </div>
      </section>

      {/* product (DESIGN.md §9-4) */}
      <section className="container-site py-12 md:py-16">
        <div className="mb-6 max-w-[680px]">
          <SectionLabel>PRODUCT</SectionLabel>
          <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-semibold tracking-[-0.05em] leading-[1.05] text-[#f4f7fb]">予測ではなく、意思決定を学習する</h2>
          <p className="mt-4 text-lg leading-8 text-[#8a93a3]">「価格を当てるモデル」ではなく、「市場状態を学習し、その状態に応じた取引行動を最適化するモデル」です。</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <AnimateInView y={20} className="md:col-span-2 md:row-span-2 card p-8 md:p-10">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[rgba(82,102,235,0.16)]"><Globe2 className="h-6 w-6 text-[#5266eb]" strokeWidth={1.8} /></div>
            <h3 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[#f4f7fb]">Transformer World Model</h3>
            <p className="mt-3 text-base leading-6 text-[#8a93a3]">価格・流動性・リスク・ニュースから潜在市場状態を学習。将来の価格予測ではなく、市場の構造的理解を目的とするコアモデル。</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["latent state", "regime detection", "risk estimation"].map((t) => (
                <span key={t} className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-1.5 text-sm text-[#8a93a3]">{t}</span>
              ))}
            </div>
          </AnimateInView>
          {[
            { icon: BrainCircuit, title: "強化学習方策", text: "世界モデルが認識した状態を基にリスク調整リターンを最大化。" },
            { icon: Radar, title: "市場状態推定", text: "レジーム・ボラティリティ・テールリスクをリアルタイムに推定。" },
            { icon: BarChart3, title: "LoRe", text: "言語情報を不確実性ゲートで安全に統合し、取引判断を拡張する独自構想。" },
            { icon: LineChart, title: "ダッシュボード", text: "リアルタイム推論可視化。" },
            { icon: LockKeyhole, title: "リスク制御", text: "DD抑制と安全な意思決定。" },
          ].map((card, i) => (
            <AnimateInView key={card.title} y={16} delay={0.06 * i} className="card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(82,102,235,0.12)]">
                <card.icon className="h-5 w-5 text-[#5266eb]" strokeWidth={1.8} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#f4f7fb]">{card.title}</h3>
              <p className="mt-2 text-sm text-[#8a93a3]">{card.text}</p>
            </AnimateInView>
          ))}
        </div>
      </section>

      {/* how it works (DESIGN.md §9-3, §11) */}
      <section className="container-site py-12 md:py-16">
        <div className="mb-8 max-w-[680px]">
          <SectionLabel>HOW IT WORKS</SectionLabel>
          <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-semibold tracking-[-0.05em] leading-[1.05] text-[#f4f7fb]">
            価格予測から状態学習へ
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#8a93a3]">
            OHLCV と特徴量から市場状態を学習し、Hindsight Oracle で教師を作り、Transformer 世界モデルと Actor-Critic で意思決定を最適化。検証セレクタが本番投入可否を判断するまでのパイプライン。
          </p>
        </div>
        <PipelineFlow />
      </section>

      {/* vision */}
      <section className="container-site py-12 md:py-16">
        <div className="max-w-[680px]">
          <SectionLabel>VISION</SectionLabel>
          <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-semibold tracking-[-0.05em] leading-[1.05] text-[#f4f7fb]">長期投資を、AIで再設計する</h2>
          <div className="mt-8 space-y-6 text-lg leading-8 text-[#8a93a3]">
            <p>従来の多くの予測モデルは、短期的な値動きの予測に焦点を当ててきました。しかし、実際の運用で重要なのは、いつリスクを取り、いつ守り、どの銘柄をどの比率で保有し、どのタイミングで調整するかです。</p>
            <p>UniDreamは<span className="font-semibold text-[#02b8cc]">「価格を当てるモデル」ではなく、「市場状態を学習し、その状態に応じた取引行動を最適化するモデル」</span>です。Transformer世界モデルによって市場の潜在状態を学習し、強化学習によって取引行動を最適化します。</p>
            <p>目指すのは、Buy &amp; Holdの長期的な強さを活かしながら、ドローダウンと機会損失を抑える次世代のAI運用エンジンです。</p>
          </div>
        </div>
      </section>

      {/* live demo (DESIGN.md §9-4) */}
      <section className="container-site py-12 md:py-16">
        <div className="card p-8 md:p-12 grid gap-8 md:grid-cols-[1.4fr_1fr] items-center">
          <div>
            <SectionLabel>LIVE DEMO</SectionLabel>
            <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-semibold tracking-[-0.05em] leading-[1.05] text-[#f4f7fb]">推論ダッシュボード</h2>
            <p className="mt-4 text-lg leading-8 text-[#8a93a3] max-w-md">長期投資の意思決定を最適化するAIの実際の推論結果をリアルタイムで確認。</p>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-[#8a93a3]">
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] animate-pulse" />Live · next inference in ~15m</span>
              <span className="flex items-center gap-2"><ArrowRight className="h-3 w-3 text-[#02b8cc]" />BTCUSDT · 15m</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <CtaButton href="/">デモを起動</CtaButton>
            <CtaButton variant="secondary" href="https://github.com/shinji-ogasa/UniDream">研究レポートを見る</CtaButton>
          </div>
        </div>
      </section>

      {/* CTA (DESIGN.md §9-8) */}
      <section className="container-site pb-16 md:pb-24">
        <div className="card border-[rgba(255,255,255,0.08)] p-10 md:p-14">
          <div className="grid gap-8 md:grid-cols-[1.5fr_1fr] items-center">
            <div>
              <p className="label">CONTACT</p>
              <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-semibold tracking-[-0.05em] leading-[1.05] text-[#f4f7fb]">共同検証・PoCのご相談</h2>
              <p className="mt-4 text-lg leading-8 text-[#8a93a3] max-w-md">研究段階のプロダクトです。PoC導入、共同研究、デモの試用など、目的に合わせてご連絡ください。</p>
            </div>
            <div className="flex flex-col gap-3">
              <CtaButton href="/">デモを試す</CtaButton>
              <CtaButton variant="secondary" href="/homepage/contact">PoC導入を相談する</CtaButton>
              <CtaButton variant="secondary" href="https://github.com/shinji-ogasa/UniDream">研究レポートを見る</CtaButton>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
