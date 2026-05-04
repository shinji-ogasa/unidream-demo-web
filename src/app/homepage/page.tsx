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

const NAV_ITEMS = ["プロダクト", "研究成果", "技術", "研究", "会社情報"];

const METRICS = [
  { label: "Market", value: "BTCUSDT · 15m", sub: "2018–2024 の実データで検証", color: "text-[#02b8cc]" },
  { label: "Benchmark", value: "Buy & Hold", sub: "単純保有に対する超過性能を測定", color: "text-[#8a93a3]" },
  { label: "Production Candidate", value: "Safe Baseline", sub: "DD抑制を重視した安定運用モデル", color: "text-[#4ade80]" },
  { label: "Research Upside", value: "3fold AC Retrain", sub: "再学習による性能上限を探索", color: "text-[#5266eb]" },
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
    <Link href="/homepage" className="flex items-center shrink-0" aria-label="WorldForge AI">
      <Image src="/worldforge-ai-logo.png" alt="WorldForge AI" height={56} width={224} priority unoptimized className="h-10 md:h-14 w-auto" />
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
          <p>© 2026 WorldForge AI</p>
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
      <section className="relative flex items-center pt-16">
        <div className="hero-visual-bg" />
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-8 py-14 md:py-20">
          <div className="max-w-[900px]">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8 inline-flex rounded-full border border-[rgba(82,102,235,0.3)] bg-[rgba(82,102,235,0.12)] px-5 py-1.5 text-sm font-semibold text-[#5266eb]"
            >
              UniDream · WorldForge AI
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-[clamp(2.2rem,4vw,3.5rem)] font-semibold tracking-[-0.06em] leading-[1.35] text-[#f4f7fb]"
            >
              市場の見えない構造を、<br />世界モデルで読む。
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-8 max-w-[680px] text-lg leading-8 text-[#8a93a3]"
            >
              UniDreamは、長期投資を「持つだけ」から「市場状態に応じて最適化する」へ進化させるAI運用基盤です。Transformer世界モデルと強化学習により、銘柄選定・リスク管理・ポジション調整・売買判断を一貫して学習し、Buy & Holdの弱点である大きなドローダウンと機会損失を改善します。
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <CtaButton href="/">デモを見る</CtaButton>
              <CtaButton variant="secondary" href="/homepage/contact">PoC導入を相談する</CtaButton>
              <CtaButton variant="secondary" href="https://github.com/shinji-ogasa/UniDream">研究概要を読む</CtaButton>
            </motion.div>
          </div>
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
          <div className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-6">
            <p className="text-xs font-semibold tracking-[0.12em] text-[#ff6467] mb-2">PAIN</p>
            <p className="text-base leading-6 text-[#d0d6e0]">Buy & Holdは長期では強い一方で、暴落局面のドローダウン、回復までの時間、銘柄入れ替え、ポジション調整を人間の判断に依存している。</p>
          </div>
          <div className="flex items-center justify-center self-stretch">
            <ArrowRight className="h-6 w-6 text-[#5266eb] rotate-90 md:rotate-0" />
          </div>
          <div className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-6">
            <p className="text-xs font-semibold tracking-[0.12em] text-[#4ade80] mb-2">SOLUTION</p>
            <p className="text-base leading-6 text-[#d0d6e0]">UniDreamは長期投資のリターンを維持・改善しながら、MaxDDを抑える意思決定AI。銘柄選定から取引最適化までAIが一貫実行する。</p>
          </div>
        </div>
      </section>

      {/* evidence / scorecard (DESIGN.md §9-5) */}
      <section className="container-site py-12 md:py-16 pb-8 md:pb-10">
        <div className="mb-6 max-w-[680px]">
          <SectionLabel>EVIDENCE</SectionLabel>
          <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-semibold tracking-[-0.05em] leading-[1.05] text-[#f4f7fb]">B&H改善の検証結果</h2>
          <p className="mt-4 text-lg leading-8 text-[#8a93a3]">UniDreamのPoCでは、特定の銘柄・期間・取引制約のもとで、Buy & Holdや既存のルールベース戦略に対してリスク調整後の成績を改善できるかを検証します。検証軸はAlphaEx、MaxDD、Sharpe、ターンオーバー、Walk-Forwardでの汎化性能です。</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <AnimateInView className="card p-8 md:p-10 border-[rgba(94,106,210,0.36)]" x={-20} y={0}>
            <div className="flex items-start gap-3 mb-6">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[rgba(82,102,235,0.16)]"><Zap className="h-5 w-5 text-[#5266eb]" strokeWidth={2} /></div>
              <div><p className="text-base font-semibold text-[#f4f7fb]">3fold AC再学習</p><p className="text-sm text-[#8a93a3]">selector v2 strict · test平均</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-4">
              <div><p className="label">AlphaEx</p><p className="mt-1 text-4xl font-semibold text-[#5266eb]">+12.97 pt</p></div>
              <div><p className="label">SharpeΔ</p><p className="mt-1 text-4xl font-semibold text-[#8b5cf6]">+0.033</p></div>
              <div><p className="label">MaxDDΔ</p><p className="mt-1 text-4xl font-semibold text-[#4ade80]">-0.30 pt</p></div>
            </div>
            <p className="mt-5 text-sm text-[#626b7a] leading-5">B&H比でリターン増加、Sharpe微増、DD改善。※ strict条件でvalidation全fold acceptは未達。</p>
          </AnimateInView>
          <div className="relative">
            <div className="absolute -top-12 -right-12 -bottom-6 -left-6 rounded-[48px] bg-gradient-to-br from-[rgba(2,184,204,0.15)] via-[rgba(2,184,204,0.06)] to-transparent blur-3xl" />
            <AnimateInView className="card p-8 md:p-10 flex flex-col justify-between" x={20} y={0} delay={0.15}>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[rgba(74,222,128,0.12)]"><ShieldCheck className="h-5 w-5 text-[#4ade80]" strokeWidth={2} /></div>
                <div><p className="text-base font-semibold text-[#f4f7fb]">Safe Baseline</p><p className="text-sm text-[#8a93a3]">Phase 8</p></div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div><p className="label">AlphaEx</p><p className="mt-1 text-3xl font-semibold text-[#02b8cc]">+0.89 pt/yr</p></div>
                <div><p className="label">MaxDDΔ</p><p className="mt-1 text-3xl font-semibold text-[#4ade80]">-1.58 pt</p></div>
              </div>
            </div>
            <p className="mt-5 text-sm text-[#626b7a] leading-5">最も堅牢なベースライン。B&H比でリターンを維持しつつ最大ドローダウンを低減。</p>
          </AnimateInView>
          </div>
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

      {/* vision */}
      <section className="container-site py-12 md:py-16">
        <div className="mb-6">
          <SectionLabel>PIPELINE</SectionLabel>
        </div>
        <div className="relative mb-12">
          <div className="absolute -inset-6 rounded-[56px] bg-gradient-to-r from-[rgba(82,102,235,0.15)] via-[rgba(2,184,204,0.10)] to-[rgba(82,102,235,0.12)] blur-3xl" />
          <div className="relative rounded-card overflow-hidden border border-[rgba(255,255,255,0.08)] shadow-panel">
            <Image src="/VISION_img.png" alt="UniDream pipeline diagram" width={2400} height={1350} className="w-full h-auto" />
          </div>
        </div>
        <div className="max-w-[680px]">
          <SectionLabel>VISION</SectionLabel>
          <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-semibold tracking-[-0.05em] leading-[1.05] text-[#f4f7fb]">長期投資を、AIで再設計する</h2>
          <div className="mt-8 space-y-6 text-lg leading-8 text-[#8a93a3]">
            <p>従来の多くの予測モデルは、短期的な値動きの予測に焦点を当ててきました。しかし、実際の運用で重要なのは、いつリスクを取り、いつ守り、どの銘柄をどの比率で保有し、どのタイミングで調整するかです。</p>
            <p>UniDreamは<span className="font-semibold text-[#02b8cc]">「価格を当てるモデル」ではなく、「市場状態を学習し、その状態に応じた取引行動を最適化するモデル」</span>です。Transformer世界モデルによって市場の潜在状態を学習し、強化学習によって取引行動を最適化します。</p>
            <p>目指すのは、Buy & Holdの長期的な強さを活かしながら、ドローダウンと機会損失を抑える次世代のAI運用エンジンです。</p>
          </div>
        </div>
      </section>

      {/* live demo (DESIGN.md §9-4) */}
      <section className="container-site py-12 md:py-16">
        <div className="mb-6 max-w-[680px]">
          <SectionLabel>LIVE DEMO</SectionLabel>
          <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-semibold tracking-[-0.05em] leading-[1.05] text-[#f4f7fb]">推論ダッシュボード</h2>
          <p className="mt-4 text-lg leading-8 text-[#8a93a3]">長期投資の意思決定を最適化するAIの実際の推論結果をリアルタイムで確認</p>
          <div className="mt-5 flex items-center gap-4 text-sm text-[#8a93a3]">
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />Live · next inference in ~15m</span>
            <span className="flex items-center gap-2"><ArrowRight className="h-3 w-3 text-[#02b8cc]" />BTCUSDT · 15m</span>
          </div>
          <div className="mt-6"><CtaButton href="/">デモを起動</CtaButton></div>
        </div>
        <div className="dashboard-frame">
          <Image src="/dashboard-preview.png" alt="UniDream Demo dashboard" width={1400} height={900} className="w-full h-auto" />
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
