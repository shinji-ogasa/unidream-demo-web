import Image from "next/image";
import Link from "next/link";
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
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-[10px] font-semibold tracking-widest text-slate-600">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-[-0.04em] ${color}`}>{value}</p>
      <p className="mt-2 text-xs font-medium text-slate-600">{sub}</p>
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
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Transformer world modelと強化学習で市場状態を理解する。
            </p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL_LINKS.map((item) => (
                <SocialButton key={item.label} {...item} />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-12">
            {columns.map((col) => (
              <div key={col[0]}>
                <h4 className="mb-4 text-xs font-semibold tracking-widest text-slate-500 uppercase">{col[0]}</h4>
                <ul className="space-y-3">
                  {col.slice(1).map((item) => (
                    <li key={item} className="text-sm text-slate-400 hover:text-white transition cursor-default">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-slate-800/40 flex flex-wrap justify-between gap-4 text-xs text-slate-600">
          <p>© 2026 WorldForge AI</p>
          <div className="flex gap-6">
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function HomepagePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white antialiased">
      {/* grid texture — subtle */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/40 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-4">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-400 lg:flex">
            {NAV_ITEMS.map((item) => (
              <a key={item} href="#" className="transition hover:text-white">{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-slate-400 transition hover:text-white">
              デモ
            </Link>
            <button
              type="button"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              問い合わせ
            </button>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="/hero-bg.png" alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-950/85" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6 py-24 md:py-36">
          <div className="max-w-3xl">
            <span className="mb-6 inline-flex rounded-lg border border-cyan-500/15 bg-cyan-500/[0.06] px-4 py-1.5 text-xs font-semibold text-cyan-300/80">
              UniDream · WorldForge AI
            </span>
            <h1 className="text-4xl md:text-7xl font-semibold tracking-[-0.075em] leading-[0.98] text-white">
              市場の見えない構造を、<br />世界モデルで読む。
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
              Transformer世界モデルと強化学習により、価格予測ではなく市場状態・リスク・不確実性を学習する金融AI基盤。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CtaButton href="/">デモを見る</CtaButton>
              <CtaButton variant="secondary">PoC資料を相談する</CtaButton>
            </div>
          </div>
          {/* overlay: latent state labels */}
          <div className="absolute right-8 bottom-8 hidden lg:flex gap-3">
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-3 backdrop-blur">
              <p className="text-[10px] font-semibold tracking-widest text-slate-500">REGIME</p>
              <p className="mt-1 text-sm font-semibold text-cyan-300">bear → neutral</p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-3 backdrop-blur">
              <p className="text-[10px] font-semibold tracking-widest text-slate-500">RISK</p>
              <p className="mt-1 text-sm font-semibold text-emerald-300">low</p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-3 backdrop-blur">
              <p className="text-[10px] font-semibold tracking-widest text-slate-500">SIGNAL</p>
              <p className="mt-1 text-sm font-semibold text-blue-300">LONG</p>
            </div>
          </div>
        </div>
      </section>

      {/* metrics */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 -mt-6 relative z-20 pb-12 md:pb-16">
        <div className="grid gap-3 md:grid-cols-4">
          {METRICS.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>
      </section>

      {/* results — 2-card hierarchy */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-20">
        <div className="mb-10 max-w-xl">
          <SectionLabel>RESEARCH</SectionLabel>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-white">
            実データによる検証結果
          </h2>
          <p className="mt-3 text-slate-500 text-sm">
            BTCUSDT 15m · 2018-2024。全指標B&H比較。
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          {/* featured result */}
          <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900 to-blue-950/30 p-7 md:p-9">
            <div className="flex items-center gap-3 mb-5">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-500/10">
                <Zap className="h-4 w-4 text-blue-400" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">3fold AC再学習</p>
                <p className="text-xs text-slate-500">selector v2 strict · test平均</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-5">
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-500">AlphaEx</p>
                <p className="mt-1 text-3xl font-semibold text-blue-400">+12.97 pt</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-500">SharpeΔ</p>
                <p className="mt-1 text-3xl font-semibold text-indigo-400">+0.033</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-500">MaxDDΔ</p>
                <p className="mt-1 text-3xl font-semibold text-emerald-400">-0.30 pt</p>
              </div>
            </div>
            <p className="mt-5 text-xs text-slate-600 leading-5">
              B&H比でリターン増加、Sharpe微増、DD改善。※ strict条件でvalidation全fold acceptは未達。再現性確認中。
            </p>
          </div>
          {/* supporting result */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7 md:p-9 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/10">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Safe Baseline</p>
                  <p className="text-xs text-slate-500">Phase 8</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-slate-600">AlphaEx</p>
                  <p className="mt-1 text-2xl font-semibold text-cyan-400">+0.89 pt/yr</p>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-widest text-slate-600">MaxDDΔ</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-400">-1.58 pt</p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-xs text-slate-600 leading-5">
              最も堅牢なベースライン。B&H比でリターンを維持しつつ最大ドローダウンを低減。
            </p>
          </div>
        </div>
      </section>

      {/* product — bento with hierarchy */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-20">
        <div className="mb-10 max-w-xl">
          <SectionLabel>PRODUCT</SectionLabel>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-white">
            市場理解のためのAI
          </h2>
        </div>
        <div className="grid grid-cols-12 gap-4">
          {/* hero card — transformer world model */}
          <div className="col-span-12 lg:col-span-6 row-span-2 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/20 p-7 md:p-9">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-800/80 ring-1 ring-slate-700">
              <Globe2 className="h-6 w-6 text-cyan-400" strokeWidth={1.8} />
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-white">Transformer World Model</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
              価格・流動性・リスク・ニュースから潜在市場状態を学習。将来の価格予測ではなく、市場の構造的理解を目的とするコアモデル。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-md border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-400">latent state</span>
              <span className="rounded-md border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-400">regime detection</span>
              <span className="rounded-md border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-400">risk estimation</span>
            </div>
          </div>
          {/* medium card 1 */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-800/80 ring-1 ring-slate-700">
              <BrainCircuit className="h-5 w-5 text-cyan-400" strokeWidth={1.8} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">強化学習方策</h3>
            <p className="mt-2 text-xs leading-5 text-slate-400">世界モデルが認識した状態を基に、リスク調整リターンを最大化する行動を学習。</p>
          </div>
          {/* medium card 2 */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-800/80 ring-1 ring-slate-700">
              <Radar className="h-5 w-5 text-cyan-400" strokeWidth={1.8} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">市場状態推定</h3>
            <p className="mt-2 text-xs leading-5 text-slate-400">レジーム・ボラティリティ・流動性・テールリスクをリアルタイムに推定。</p>
          </div>
          {/* small card 1 */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-800/80 ring-1 ring-slate-700">
              <BarChart3 className="h-4 w-4 text-cyan-400" strokeWidth={1.8} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-white">バックテスト</h3>
            <p className="mt-1 text-xs text-slate-500">2018–2024。全指標B&H比較。</p>
          </div>
          {/* small card 2 */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-800/80 ring-1 ring-slate-700">
              <LineChart className="h-4 w-4 text-cyan-400" strokeWidth={1.8} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-white">ダッシュボード</h3>
            <p className="mt-1 text-xs text-slate-500">リアルタイム推論可視化。</p>
          </div>
          {/* small card 3 */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-800/80 ring-1 ring-slate-700">
              <DatabaseZap className="h-4 w-4 text-cyan-400" strokeWidth={1.8} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-white">模倣学習</h3>
            <p className="mt-1 text-xs text-slate-500">教師方策から安定初期化。</p>
          </div>
        </div>
      </section>

      {/* vision — dark-adapted image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-20">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr]">
            <div className="order-2 lg:order-1">
              <SectionLabel>VISION</SectionLabel>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-white">
                価格予測を超えた市場理解へ
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-7 text-slate-400">
                <p>
                  金融市場は、価格だけで動いているわけではありません。投資家心理、流動性、リスク、ニュース、制度、そして時間とともに変化する市場状態。
                </p>
                <p>
                  UniDreamは、世界モデルと強化学習によって、そうした
                  <span className="font-semibold text-cyan-300">見えない市場構造を学習</span>
                  し、いま市場で何が起きているのか、どの行動がリスクに対して合理的なのかを判断するAIを目指します。
                </p>
              </div>
            </div>
            <div className="order-1 lg:order-2 relative">
              <div className="rounded-2xl overflow-hidden border border-slate-800/60">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-0 mix-blend-overlay bg-gradient-to-br from-cyan-500/5 to-blue-500/5 z-10 pointer-events-none" />
                <Image
                  src="/vision-illustration.png"
                  alt=""
                  width={840}
                  height={720}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* dashboard — staged with annotations */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-20">
        <div className="grid items-center gap-8 lg:grid-cols-[0.5fr_1.5fr]">
          <div>
            <SectionLabel>LIVE DEMO</SectionLabel>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-white">
              推論ダッシュボード
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              リアルタイムで動作する研究デモ。エクイティ・ポジション・市場状態を一画面で。
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live · next inference in ~15m
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ArrowRight className="h-3 w-3 text-cyan-400" />
                BTCUSDT · 15m
              </div>
            </div>
            <div className="mt-8">
              <CtaButton href="/">デモを起動</CtaButton>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-cyan-500/8 via-blue-500/8 to-indigo-500/8 blur-2xl" />
            <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/40 bg-slate-900">
              {/* browser chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-800">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                </div>
                <span className="ml-3 text-[11px] text-slate-600 font-mono">dashboard.unidream.ai</span>
              </div>
              <Image
                src="/dashboard-preview.png"
                alt="UniDream Demo dashboard"
                width={1400}
                height={900}
                className="w-full h-auto"
              />
            </div>
            {/* floating annotation */}
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
      </section>

      {/* final CTA — specific actions */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 pb-20">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-[1.5fr_1fr] items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.28em] text-cyan-400/70">CONTACT</p>
              <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-[-0.05em] text-white">
                UniDreamに興味がある方へ
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400 max-w-md">
                研究段階のプロダクトです。PoC導入、共同研究、デモの試用など、目的に合わせてご連絡ください。
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <CtaButton href="/">デモを試す</CtaButton>
              <CtaButton variant="secondary">PoC導入を相談する</CtaButton>
              <CtaButton variant="secondary">研究への参加</CtaButton>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
