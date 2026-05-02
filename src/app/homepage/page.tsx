"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  DatabaseZap,
  Globe2,
  LineChart,
  LockKeyhole,
  Network,
  Radar,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { FaGithub, FaLinkedin, FaXTwitter, FaYoutube } from "react-icons/fa6";

function AnimateInView({
  children, className = "", delay = 0, x = 0, y = 24, once = true,
}: {
  children: React.ReactNode; className?: string; delay?: number; x?: number; y?: number; once?: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x, y }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x, y }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

const NAV_ITEMS = ["プロダクト", "研究成果", "技術", "研究", "会社情報"];

const METRICS = [
  { label: "AlphaEx (safe)", value: "+0.89 pt/yr", sub: "Phase 8 · BTCUSDT 15m", color: "text-cyan-400" },
  { label: "MaxDDΔ (safe)", value: "-1.58 pt", sub: "vs Buy & Hold", color: "text-emerald-400" },
  { label: "AlphaEx (3fold)", value: "+12.97 pt", sub: "AC再学習 · test平均", color: "text-blue-400" },
  { label: "Backtest", value: "2018-2024", sub: "6yr · BTCUSDT · 15m bars", color: "text-indigo-400" },
];

const SOCIAL_LINKS = [
  { label: "X", href: "#", icon: FaXTwitter },
  { label: "GitHub", href: "https://github.com/shinji-ogasa/UniDream", icon: FaGithub },
  { label: "LinkedIn", href: "#", icon: FaLinkedin },
  { label: "YouTube", href: "#", icon: FaYoutube },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" as const },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-[0.28em] text-cyan-400 mb-2">{children}</p>
  );
}

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  href?: string;
};

function CtaButton({ children, variant = "primary", href }: ButtonProps) {
  const cls =
    variant === "primary"
      ? "bg-white text-slate-950 shadow-lg hover:bg-slate-200 hover:-translate-y-0.5"
      : "border border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 hover:-translate-y-0.5";
  const base = `inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold tracking-[-0.01em] transition ${cls}`;
  const inner = (
    <>
      {children}
      <ArrowRight className="h-4 w-4" />
    </>
  );
  if (href && href.startsWith("/")) {
    return <Link href={href} className={base}>{inner}</Link>;
  }
  if (href) {
    return (
      <a href={href} className={base} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return <button type="button" className={base}>{inner}</button>;
}

function Logo() {
  return (
    <Link href="/homepage" className="flex items-center shrink-0" aria-label="WorldForge AI">
      <Image
        src="/worldforge-ai-logo.png"
        alt="WorldForge AI"
        height={56}
        width={224}
        priority
        unoptimized
        className="h-10 md:h-14 w-auto"
      />
    </Link>
  );
}

function SocialButton({
  label,
  href,
  icon: Icon,
}: {
  label: string;
  href: string;
  icon: React.ElementType;
}) {
  const isExternal = href.startsWith("http");
  return (
    <a
      href={href}
      aria-label={label}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="grid h-11 w-11 place-items-center rounded-xl border border-slate-800 bg-slate-900/60 text-base text-slate-500 transition hover:-translate-y-0.5 hover:border-cyan-500/30 hover:text-cyan-300"
    >
      <Icon />
    </a>
  );
}

function MetricCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <p className="text-sm font-semibold tracking-widest text-slate-600">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-[-0.04em] ${color}`}>{value}</p>
      <p className="mt-2 text-sm font-medium text-slate-500">{sub}</p>
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
    <footer className="border-t border-slate-800/60 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap justify-between gap-10">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-6 text-slate-500">Transformer world modelと強化学習で市場状態を理解する。</p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL_LINKS.map((item) => (<SocialButton key={item.label} {...item} />))}
            </div>
          </div>
          <div className="flex flex-wrap gap-10">
            {columns.map((col) => (
              <div key={col[0]}>
                <h4 className="mb-4 text-xs font-semibold tracking-widest text-slate-500 uppercase">{col[0]}</h4>
                <ul className="space-y-3">
                  {col.slice(1).map((item) => (<li key={item} className="text-sm text-slate-400 hover:text-white transition cursor-default">{item}</li>))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 pt-5 border-t border-slate-800/40 flex flex-wrap justify-between gap-4 text-xs text-slate-600">
          <p>© 2026 WorldForge AI</p>
          <div className="flex gap-6"><span>Privacy</span><span>Terms</span></div>
        </div>
      </div>
    </footer>
  );
}

export default function HomepagePage() {
  return (
    <main className="relative min-h-screen bg-[#020617] text-white antialiased">
      {/* === layered background system === */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* atmosphere: soft light fields */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.12),transparent_32rem),radial-gradient(circle_at_82%_18%,rgba(59,130,246,0.09),transparent_36rem),radial-gradient(circle_at_48%_82%,rgba(99,102,241,0.06),transparent_34rem),linear-gradient(180deg,#020617_0%,#030712_48%,#020617_100%)]" />
        {/* faint grid */}
        <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:96px_96px]" />
        {/* vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.40)_80%)]" />
        {/* bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-[#020617]" />
      </div>

      {/* hero image layer — extends past hero section, fades into base bg */}
      <div className="absolute top-0 left-0 right-0 h-[140vh] -z-5 overflow-hidden">
        <Image src="/hero-bg.png" alt="" fill className="object-cover object-top" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/90 via-[#020617]/65 to-[#020617]/80" />
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-b from-transparent to-[#020617]" />
      </div>

      {/* header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-50 border-b border-slate-800/40 bg-[#020617]/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-4 md:py-5">
          <Logo />
          <nav className="hidden items-center gap-8 text-base font-medium text-slate-400 lg:flex">
            {NAV_ITEMS.map((item) => (<a key={item} href="#" className="transition hover:text-white">{item}</a>))}
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-base font-medium text-slate-400 transition hover:text-white">デモ</Link>
            <button type="button" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">問い合わせ</button>
          </div>
        </div>
      </motion.header>

      {/* hero */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 inline-flex rounded-lg border border-cyan-500/15 bg-cyan-500/[0.06] px-4 py-1.5 text-sm font-semibold text-cyan-300/80"
            >
              UniDream · WorldForge AI
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-5xl md:text-7xl font-semibold tracking-[-0.075em] leading-[0.96] text-white"
            >
              市場の見えない構造を、世界モデルで読む。
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-6 max-w-2xl text-lg leading-8 text-slate-400"
            >
              Transformer世界モデルと強化学習により、価格予測ではなく市場状態・リスク・不確実性を学習する金融AI基盤。
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <CtaButton href="/">デモを見る</CtaButton>
              <CtaButton variant="secondary">PoC資料を相談する</CtaButton>
            </motion.div>
          </div>
        </div>
      </section>

      {/* metrics */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 -mt-6 relative z-20 pb-8 md:pb-12">
        <div className="grid gap-3 md:grid-cols-4">
          {METRICS.map((m) => (
            <AnimateInView key={m.label} y={16}>
              <MetricCard {...m} />
            </AnimateInView>
          ))}
        </div>
      </section>

      {/* results */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
        <div className="mb-8 max-w-xl">
          <SectionLabel>RESEARCH</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-white">実データによる検証結果</h2>
          <p className="mt-3 text-base text-slate-500">BTCUSDT 15m · 2018-2024。全指標B&H比較。</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <AnimateInView className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900 to-blue-950/30 p-6 md:p-10" x={-20} y={0}>
            <div className="flex items-start gap-3 mb-6">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-500/10"><Zap className="h-5 w-5 text-blue-400" strokeWidth={2} /></div>
              <div><p className="text-base font-semibold text-white">3fold AC再学習</p><p className="text-sm text-slate-500">selector v2 strict · test平均</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div><p className="text-sm font-semibold tracking-widest text-slate-500">AlphaEx</p><p className="mt-1 text-4xl font-semibold text-blue-400">+12.97 pt</p></div>
              <div><p className="text-sm font-semibold tracking-widest text-slate-500">SharpeΔ</p><p className="mt-1 text-4xl font-semibold text-indigo-400">+0.033</p></div>
              <div><p className="text-sm font-semibold tracking-widest text-slate-500">MaxDDΔ</p><p className="mt-1 text-4xl font-semibold text-emerald-400">-0.30 pt</p></div>
            </div>
            <p className="mt-5 text-sm text-slate-600 leading-5">B&H比でリターン増加、Sharpe微増、DD改善。※ strict条件でvalidation全fold acceptは未達。</p>
          </AnimateInView>
          <AnimateInView className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-10 flex flex-col justify-between" x={20} y={0} delay={0.15}>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/10"><ShieldCheck className="h-5 w-5 text-emerald-400" strokeWidth={2} /></div>
                <div><p className="text-base font-semibold text-white">Safe Baseline</p><p className="text-sm text-slate-500">Phase 8</p></div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div><p className="text-sm font-semibold tracking-widest text-slate-600">AlphaEx</p><p className="mt-1 text-3xl font-semibold text-cyan-400">+0.89 pt/yr</p></div>
                <div><p className="text-sm font-semibold tracking-widest text-slate-600">MaxDDΔ</p><p className="mt-1 text-3xl font-semibold text-emerald-400">-1.58 pt</p></div>
              </div>
            </div>
            <p className="mt-5 text-sm text-slate-600 leading-5">最も堅牢なベースライン。B&H比でリターンを維持しつつ最大ドローダウンを低減。</p>
          </AnimateInView>
        </div>
      </section>

      {/* product — bento */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
        <div className="mb-8 max-w-xl">
          <SectionLabel>PRODUCT</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-white">市場理解のためのAI</h2>
        </div>
        <div className="grid grid-cols-12 gap-4">
          <AnimateInView y={20} className="col-span-12 lg:col-span-6 row-span-2 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/20 p-8 md:p-10"
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-800/80 ring-1 ring-slate-700"><Globe2 className="h-6 w-6 text-cyan-400" strokeWidth={1.8} /></div>
            <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-white">Transformer World Model</h3>
            <p className="mt-3 max-w-md text-base leading-6 text-slate-400">価格・流動性・リスク・ニュースから潜在市場状態を学習。将来の価格予測ではなく、市場の構造的理解を目的とするコアモデル。</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["latent state", "regime detection", "risk estimation"].map((t) => (
                <span key={t} className="rounded-md border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-sm text-slate-400">{t}</span>
              ))}
            </div>
          </AnimateInView>
          {[
            { icon: BrainCircuit, title: "強化学習方策", text: "世界モデルが認識した状態を基に、リスク調整リターンを最大化する行動を学習。", span: "col-span-12 sm:col-span-6 lg:col-span-3" },
            { icon: Radar, title: "市場状態推定", text: "レジーム・ボラティリティ・流動性・テールリスクをリアルタイムに推定。", span: "col-span-12 sm:col-span-6 lg:col-span-3" },
            { icon: BarChart3, title: "バックテスト", text: "2018–2024。全指標B&H比較。", span: "col-span-12 sm:col-span-4 lg:col-span-2" },
            { icon: LineChart, title: "ダッシュボード", text: "リアルタイム推論可視化。", span: "col-span-12 sm:col-span-4 lg:col-span-2" },
            { icon: DatabaseZap, title: "模倣学習", text: "教師方策から安定初期化。", span: "col-span-12 sm:col-span-4 lg:col-span-2" },
          ].map((card, i) => (
            <AnimateInView
              key={card.title}
              y={16}
              delay={0.08 * i}
              className={`${card.span} rounded-2xl border border-slate-800 bg-slate-900/40 ${i < 2 ? 'p-7' : 'p-6'}`}
            >
              <div className={`grid place-items-center rounded-xl bg-slate-800/80 ring-1 ring-slate-700 ${i < 2 ? 'h-10 w-10' : 'h-8 w-8 rounded-lg'}`}>
                <card.icon className={`text-cyan-400 ${i < 2 ? 'h-5 w-5' : 'h-4 w-4'}`} strokeWidth={1.8} />
              </div>
              <h3 className={`mt-4 font-semibold text-white ${i < 2 ? 'text-lg' : 'text-base'}`}>{card.title}</h3>
              <p className={`mt-2 text-slate-400 ${i < 2 ? 'text-sm leading-6' : 'text-sm'}`}>{card.text}</p>
            </AnimateInView>
          ))}
        </div>
      </section>

      {/* vision */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
        <div className="mb-8 max-w-3xl">
          <SectionLabel>VISION</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-white">価格予測を超えた市場理解へ</h2>
          <div className="mt-6 space-y-4 text-base leading-7 text-slate-400">
            <p>金融市場は、価格だけで動いているわけではありません。投資家心理、流動性、リスク、ニュース、制度、そして時間とともに変化する市場状態。</p>
            <p>UniDreamは、世界モデルと強化学習によって、そうした<span className="font-semibold text-cyan-300">見えない市場構造を学習</span>し、いま市場で何が起きているのか、どの行動がリスクに対して合理的なのかを判断するAIを目指します。</p>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/30">
          <Image src="/VISION_img.png" alt="UniDream pipeline diagram" width={2400} height={1350} className="w-full h-auto" />
        </div>
      </section>

      {/* LIVE DEMO */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
        <div className="mb-8 max-w-xl">
          <SectionLabel>LIVE DEMO</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-white">推論ダッシュボード</h2>
          <p className="mt-3 text-base leading-7 text-slate-400">リアルタイムで動作する研究デモ。エクイティ・ポジション・市場状態を一画面で。</p>
          <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Live · next inference in ~15m</span>
            <span className="flex items-center gap-2"><ArrowRight className="h-3 w-3 text-cyan-400" />BTCUSDT · 15m</span>
          </div>
          <div className="mt-6"><CtaButton href="/">デモを起動</CtaButton></div>
        </div>
        <div className="relative">
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-cyan-500/8 via-blue-500/8 to-indigo-500/8 blur-2xl" />
          <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/40">
            <Image src="/dashboard-preview.png" alt="UniDream Demo dashboard" width={1400} height={900} className="w-full h-auto" />
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 pb-16 md:pb-20">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-[1.5fr_1fr] items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.28em] text-cyan-400/70">CONTACT</p>
              <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-[-0.05em] text-white">UniDreamに興味がある方へ</h2>
              <p className="mt-3 text-base leading-6 text-slate-400 max-w-md">研究段階のプロダクトです。PoC導入、共同研究、デモの試用など、目的に合わせてご連絡ください。</p>
            </div>
            <div className="flex flex-col gap-3">
              <CtaButton href="/">デモを試す</CtaButton>
              <CtaButton variant="secondary">PoC導入を相談する</CtaButton>
              <CtaButton variant="secondary">研究レポートを見る</CtaButton>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
