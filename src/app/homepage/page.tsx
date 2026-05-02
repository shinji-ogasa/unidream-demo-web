"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
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
    <p className="text-xs font-semibold tracking-[0.28em] text-cyan-400">{children}</p>
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
  const base = `inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-[-0.01em] transition ${cls}`;
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
      <div className="relative h-10 md:h-14 w-auto" style={{ filter: "brightness(0) invert(0.92) contrast(0.8)" }}>
        <Image
          src="/worldforge-ai-logo.png"
          alt="WorldForge AI"
          height={56}
          width={224}
          priority
          unoptimized
          className="h-full w-auto"
        />
      </div>
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
      className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-900/60 text-base text-slate-500 transition hover:-translate-y-0.5 hover:border-cyan-500/30 hover:text-cyan-300"
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
    <motion.div
      {...fadeUp}
      className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
    >
      <p className="text-[10px] font-semibold tracking-widest text-slate-600">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-[-0.04em] ${color}`}>{value}</p>
      <p className="mt-2 text-xs font-medium text-slate-600">{sub}</p>
    </motion.div>
  );
}

function MarketMap() {
  const bars = [
    { x: 10, h: 48, up: true }, { x: 28, h: 36, up: false }, { x: 46, h: 56, up: true },
    { x: 64, h: 28, up: false }, { x: 82, h: 62, up: true }, { x: 100, h: 40, up: true },
    { x: 118, h: 52, up: false }, { x: 136, h: 30, up: true }, { x: 154, h: 44, up: false },
    { x: 172, h: 38, up: true }, { x: 190, h: 58, up: false },
  ];
  const regimeColors = ["rgba(34,211,238,0.08)", "rgba(52,211,153,0.06)", "rgba(96,165,250,0.07)", "rgba(34,211,238,0.05)"];
  return (
    <svg viewBox="0 0 200 80" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {regimeColors.map((c, i) => (
        <rect key={i} x={i * 50} y="0" width="50" height="80" fill={c} />
      ))}
      <text x="4" y="12" fill="rgba(148,163,184,0.4)" fontSize="5" fontFamily="monospace">REGIME</text>
      <text x="54" y="12" fill="rgba(148,163,184,0.4)" fontSize="5" fontFamily="monospace">BEAR</text>
      <text x="104" y="12" fill="rgba(148,163,184,0.4)" fontSize="5" fontFamily="monospace">NEUTRAL</text>
      <text x="154" y="12" fill="rgba(148,163,184,0.4)" fontSize="5" fontFamily="monospace">BULL</text>
      <line x1="0" y1="40" x2="200" y2="40" stroke="rgba(148,163,184,0.15)" strokeWidth="0.5" strokeDasharray="2,2" />
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        {bars.map((b, i) => (
          <g key={i}>
            <line x1={b.x} y1={40 - b.h / 2} x2={b.x} y2={40 + b.h / 2} stroke={b.up ? "#34d399" : "#f87171"} strokeWidth="2" strokeLinecap="round" />
            <line x1={b.x - 3} y1={b.up ? 40 - b.h / 2 : 40 + b.h / 2} x2={b.x + 3} y2={b.up ? 40 - b.h / 2 : 40 + b.h / 2} stroke={b.up ? "#34d399" : "#f87171"} strokeWidth="1.5" strokeLinecap="round" />
          </g>
        ))}
      </motion.g>
      <motion.path
        d="M0,52 C20,44 30,58 50,48 S80,36 100,44 S120,54 140,38 S160,50 180,40 S195,44 200,42"
        fill="none"
        stroke="rgba(34,211,238,0.5)"
        strokeWidth="1"
        strokeDasharray="3,2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
      <motion.path
        d="M0,28 C30,34 50,20 80,26 S120,30 150,22 S180,28 200,24"
        fill="none"
        stroke="rgba(96,165,250,0.35)"
        strokeWidth="0.8"
        strokeDasharray="2,3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.5, ease: "easeInOut", delay: 0.3 }}
      />
      <circle cx="160" cy="24" r="2.5" fill="rgba(34,211,238,0.8)" />
      <text x="163" y="26" fill="rgba(34,211,238,0.6)" fontSize="3.5" fontFamily="monospace">now</text>
      <circle cx="40" cy="48" r="1.5" fill="rgba(251,191,36,0.5)" />
      <circle cx="90" cy="44" r="1.5" fill="rgba(251,191,36,0.5)" />
      <circle cx="130" cy="38" r="1.5" fill="rgba(251,191,36,0.5)" />
    </svg>
  );
}

function PipelineDiagram() {
  const steps = [
    { label: "Market Data", sub: "price · volume · order book", x: 0 },
    { label: "Latent Encoder", sub: "state compression", x: 1 },
    { label: "World Model", sub: "transformer · simulation", x: 2 },
    { label: "Risk/Regime", sub: "uncertainty · regime", x: 3 },
    { label: "RL Policy", sub: "action selection", x: 4 },
    { label: "Decision", sub: "position · signal", x: 5 },
  ];
  const boxW = 120;
  const gap = 32;
  const totalW = steps.length * (boxW + gap) - gap;
  const h = 200;
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${totalW + 40} ${h}`} className="w-full min-w-[600px]" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="rgba(34,211,238,0.5)" />
          </marker>
        </defs>
        {steps.map((s, i) => {
          const cx = 20 + i * (boxW + gap);
          return (
            <g key={s.label}>
              {i < steps.length - 1 && (
                <line
                  x1={cx + boxW}
                  y1={h / 2}
                  x2={cx + boxW + gap}
                  y2={h / 2}
                  stroke="rgba(34,211,238,0.3)"
                  strokeWidth="1.5"
                  strokeDasharray="4,3"
                  markerEnd="url(#arr)"
                />
              )}
              <rect x={cx} y={h / 2 - 28} width={boxW} height={56} rx="8" fill="rgba(30,41,59,0.8)" stroke="rgba(51,65,85,0.8)" strokeWidth="1" />
              <text x={cx + boxW / 2} y={h / 2 - 4} textAnchor="middle" fill="rgba(34,211,238,0.9)" fontSize="11" fontFamily="system-ui" fontWeight="600">{s.label}</text>
              <text x={cx + boxW / 2} y={h / 2 + 14} textAnchor="middle" fill="rgba(148,163,184,0.5)" fontSize="8" fontFamily="monospace">{s.sub}</text>
            </g>
          );
        })}
      </svg>
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
    <footer className="border-t border-slate-800/60 bg-slate-950 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap justify-between gap-12">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-6 text-slate-500">Transformer world modelと強化学習で市場状態を理解する。</p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL_LINKS.map((item) => (<SocialButton key={item.label} {...item} />))}
            </div>
          </div>
          <div className="flex flex-wrap gap-12">
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
        <div className="mt-12 pt-6 border-t border-slate-800/40 flex flex-wrap justify-between gap-4 text-xs text-slate-600">
          <p>© 2026 WorldForge AI</p>
          <div className="flex gap-6"><span>Privacy</span><span>Terms</span></div>
        </div>
      </div>
    </footer>
  );
}

export default function HomepagePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white antialiased">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-50 border-b border-slate-800/40 bg-slate-950/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-4">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-400 lg:flex">
            {NAV_ITEMS.map((item) => (<a key={item} href="#" className="transition hover:text-white">{item}</a>))}
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-slate-400 transition hover:text-white">デモ</Link>
            <button type="button" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">問い合わせ</button>
          </div>
        </div>
      </motion.header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="/hero-bg.png" alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/75 to-slate-950/85" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6 py-24 md:py-36">
          <div className="grid items-end gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-6 inline-flex rounded-lg border border-cyan-500/15 bg-cyan-500/[0.06] px-4 py-1.5 text-xs font-semibold text-cyan-300/80"
              >
                UniDream · WorldForge AI
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-4xl md:text-7xl font-semibold tracking-[-0.075em] leading-[0.98] text-white"
              >
                市場の見えない構造を、<br />世界モデルで読む。
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="mt-5 max-w-xl text-base leading-7 text-slate-400"
              >
                Transformer世界モデルと強化学習により、価格予測ではなく市場状態・リスク・不確実性を学習する金融AI基盤。
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <CtaButton href="/">デモを見る</CtaButton>
                <CtaButton variant="secondary">PoC資料を相談する</CtaButton>
              </motion.div>
            </div>
            {/* latent market map */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="rounded-xl border border-slate-700/50 bg-slate-900/70 p-4 backdrop-blur hidden lg:block"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                <span className="text-[11px] font-mono text-slate-500">LATENT MARKET MAP · live state</span>
              </div>
              <div className="h-40">
                <MarketMap />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* metrics */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 -mt-6 relative z-20 pb-12 md:pb-16">
        <motion.div {...fadeUp} className="grid gap-3 md:grid-cols-4">
          {METRICS.map((m) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
              <MetricCard {...m} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* results */}
      <motion.section {...fadeUp} className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-20">
        <div className="mb-10 max-w-xl">
          <SectionLabel>RESEARCH</SectionLabel>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-white">実データによる検証結果</h2>
          <p className="mt-3 text-slate-500 text-sm">BTCUSDT 15m · 2018-2024。全指標B&H比較。</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900 to-blue-950/30 p-7 md:p-9"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-500/10"><Zap className="h-4 w-4 text-blue-400" strokeWidth={2} /></div>
              <div><p className="text-sm font-semibold text-white">3fold AC再学習</p><p className="text-xs text-slate-500">selector v2 strict · test平均</p></div>
            </div>
            <div className="grid grid-cols-3 gap-5">
              <div><p className="text-xs font-semibold tracking-widest text-slate-500">AlphaEx</p><p className="mt-1 text-3xl font-semibold text-blue-400">+12.97 pt</p></div>
              <div><p className="text-xs font-semibold tracking-widest text-slate-500">SharpeΔ</p><p className="mt-1 text-3xl font-semibold text-indigo-400">+0.033</p></div>
              <div><p className="text-xs font-semibold tracking-widest text-slate-500">MaxDDΔ</p><p className="mt-1 text-3xl font-semibold text-emerald-400">-0.30 pt</p></div>
            </div>
            <p className="mt-5 text-xs text-slate-600 leading-5">B&H比でリターン増加、Sharpe微増、DD改善。※ strict条件でvalidation全fold acceptは未達。</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7 md:p-9 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/10"><ShieldCheck className="h-4 w-4 text-emerald-400" strokeWidth={2} /></div>
                <div><p className="text-sm font-semibold text-white">Safe Baseline</p><p className="text-xs text-slate-500">Phase 8</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs font-semibold tracking-widest text-slate-600">AlphaEx</p><p className="mt-1 text-2xl font-semibold text-cyan-400">+0.89 pt/yr</p></div>
                <div><p className="text-xs font-semibold tracking-widest text-slate-600">MaxDDΔ</p><p className="mt-1 text-2xl font-semibold text-emerald-400">-1.58 pt</p></div>
              </div>
            </div>
            <p className="mt-5 text-xs text-slate-600 leading-5">最も堅牢なベースライン。B&H比でリターンを維持しつつ最大ドローダウンを低減。</p>
          </motion.div>
        </div>
      </motion.section>

      {/* product — bento */}
      <motion.section {...fadeUp} className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-20">
        <div className="mb-10 max-w-xl">
          <SectionLabel>PRODUCT</SectionLabel>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-white">市場理解のためのAI</h2>
        </div>
        <div className="grid grid-cols-12 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="col-span-12 lg:col-span-6 row-span-2 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/20 p-7 md:p-9"
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-800/80 ring-1 ring-slate-700"><Globe2 className="h-6 w-6 text-cyan-400" strokeWidth={1.8} /></div>
            <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-white">Transformer World Model</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">価格・流動性・リスク・ニュースから潜在市場状態を学習。将来の価格予測ではなく、市場の構造的理解を目的とするコアモデル。</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["latent state", "regime detection", "risk estimation"].map((t) => (
                <span key={t} className="rounded-md border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-400">{t}</span>
              ))}
            </div>
          </motion.div>
          {[
            { icon: BrainCircuit, title: "強化学習方策", text: "世界モデルが認識した状態を基に、リスク調整リターンを最大化する行動を学習。", span: "col-span-12 sm:col-span-6 lg:col-span-3" },
            { icon: Radar, title: "市場状態推定", text: "レジーム・ボラティリティ・流動性・テールリスクをリアルタイムに推定。", span: "col-span-12 sm:col-span-6 lg:col-span-3" },
            { icon: BarChart3, title: "バックテスト", text: "2018–2024。全指標B&H比較。", span: "col-span-12 sm:col-span-4 lg:col-span-2" },
            { icon: LineChart, title: "ダッシュボード", text: "リアルタイム推論可視化。", span: "col-span-12 sm:col-span-4 lg:col-span-2" },
            { icon: DatabaseZap, title: "模倣学習", text: "教師方策から安定初期化。", span: "col-span-12 sm:col-span-4 lg:col-span-2" },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.08 * i }}
              className={`${card.span} rounded-2xl border border-slate-800 bg-slate-900/40 p-6 ${i < 2 ? '' : 'p-5'}`}
            >
              <div className={`grid place-items-center rounded-xl bg-slate-800/80 ring-1 ring-slate-700 ${i < 2 ? 'h-10 w-10' : 'h-8 w-8 rounded-lg'}`}>
                <card.icon className={`text-cyan-400 ${i < 2 ? 'h-5 w-5' : 'h-4 w-4'}`} strokeWidth={1.8} />
              </div>
              <h3 className={`mt-4 font-semibold text-white ${i < 2 ? 'text-base' : 'text-sm'}`}>{card.title}</h3>
              <p className={`mt-2 text-slate-400 ${i < 2 ? 'text-xs leading-5' : 'text-xs'}`}>{card.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* vision — pipeline diagram */}
      <motion.section {...fadeUp} className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <SectionLabel>VISION</SectionLabel>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-white">価格予測を超えた市場理解へ</h2>
              <div className="mt-6 space-y-4 text-sm leading-7 text-slate-400">
                <p>金融市場は、価格だけで動いているわけではありません。投資家心理、流動性、リスク、ニュース、制度、そして時間とともに変化する市場状態。</p>
                <p>UniDreamは、世界モデルと強化学習によって、そうした<span className="font-semibold text-cyan-300">見えない市場構造を学習</span>し、いま市場で何が起きているのか、どの行動がリスクに対して合理的なのかを判断するAIを目指します。</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <PipelineDiagram />
            </div>
          </div>
        </div>
      </motion.section>

      {/* dashboard — staged */}
      <motion.section {...fadeUp} className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-20">
        <div className="grid items-center gap-8 lg:grid-cols-[0.45fr_1.55fr]">
          <div>
            <SectionLabel>LIVE DEMO</SectionLabel>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-white">推論ダッシュボード</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">リアルタイムで動作する研究デモ。エクイティ・ポジション・市場状態を一画面で。</p>
            <div className="mt-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Live · next inference in ~15m</div>
              <div className="flex items-center gap-2 text-xs text-slate-500"><ArrowRight className="h-3 w-3 text-cyan-400" />BTCUSDT · 15m</div>
            </div>
            <div className="mt-6"><CtaButton href="/">デモを起動</CtaButton></div>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-cyan-500/8 via-blue-500/8 to-indigo-500/8 blur-2xl" />
            <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/40 bg-slate-900">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-800">
                <div className="flex gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-slate-600" /><div className="h-2.5 w-2.5 rounded-full bg-slate-600" /><div className="h-2.5 w-2.5 rounded-full bg-slate-600" /></div>
                <span className="ml-3 text-[11px] text-slate-600 font-mono">dashboard.unidream.ai</span>
              </div>
              <Image src="/dashboard-preview.png" alt="UniDream Demo dashboard" width={1400} height={900} className="w-full h-auto" />
            </div>
            <div className="absolute -top-2 -right-2 hidden lg:block rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 backdrop-blur shadow-lg">
              <p className="text-[10px] font-semibold tracking-widest text-slate-500">EQUITY</p>
              <p className="text-lg font-semibold text-emerald-400">$10,942.77</p>
              <p className="text-xs text-slate-500">PnL +9.43%</p>
            </div>
            <div className="absolute -bottom-2 -left-2 hidden lg:block rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 backdrop-blur shadow-lg">
              <p className="text-[10px] font-semibold tracking-widest text-slate-500">SIGNAL</p>
              <p className="text-base font-semibold text-cyan-300">LONG · target 1.000</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* final CTA */}
      <motion.section {...fadeUp} className="mx-auto max-w-7xl px-4 md:px-6 pb-20">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-[1.5fr_1fr] items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.28em] text-cyan-400/70">CONTACT</p>
              <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-[-0.05em] text-white">UniDreamに興味がある方へ</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400 max-w-md">研究段階のプロダクトです。PoC導入、共同研究、デモの試用など、目的に合わせてご連絡ください。</p>
            </div>
            <div className="flex flex-col gap-3">
              <CtaButton href="/">デモを試す</CtaButton>
              <CtaButton variant="secondary">PoC導入を相談する</CtaButton>
              <CtaButton variant="secondary">研究レポートを見る</CtaButton>
            </div>
          </div>
        </div>
      </motion.section>

      <Footer />
    </main>
  );
}
