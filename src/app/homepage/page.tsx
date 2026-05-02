"use client";

// WorldForge AI corporate landing page. Adapted from the design exploration in
// `test/test.ts`. Lives at `/homepage`; "デモを見る" CTAs link to `/` (the live
// research demo). framer-motion is used in the hero visual so the page is
// rendered as a client component.

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  DatabaseZap,
  Globe2,
  LockKeyhole,
  Network,
  Orbit,
  Radar,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { FaGithub, FaLinkedin, FaXTwitter, FaYoutube } from "react-icons/fa6";

const navItems = ["プロダクト", "技術", "ユースケース", "研究", "会社情報"];

type CardItem = {
  title: string;
  text: string;
  icon: React.ElementType;
};

const valueCards: CardItem[] = [
  {
    title: "B&H比較",
    text: "Buy & Holdを基準に、戦略の超過価値を検証。",
    icon: BarChart3,
  },
  {
    title: "Alphaをプラスに",
    text: "リスクを抑えながら、超過リターンの獲得を目指す。",
    icon: TrendingUp,
  },
  {
    title: "DDの抑制を重視",
    text: "最大ドローダウンを抑えた、堅牢な意思決定へ。",
    icon: TrendingDown,
  },
  {
    title: "世界モデル × 強化学習",
    text: "見えない市場状態を学習し、合理的な行動を選択。",
    icon: BrainCircuit,
  },
];

const featureCards: CardItem[] = [
  {
    title: "市場状態の理解",
    text: "価格だけでなく、流動性・リスク・ニュースなどの変化を捉え、現在の市場環境を多面的に理解します。",
    icon: Radar,
  },
  {
    title: "リスク考慮の行動選択",
    text: "不確実性と下振れリスクを踏まえ、エクスポージャーとタイミングを選択します。",
    icon: ShieldCheck,
  },
  {
    title: "世界モデル + 強化学習",
    text: "潜在市場構造を世界モデルで学習し、強化学習で長期的な方策改善を行います。",
    icon: Orbit,
  },
  {
    title: "B&Hを超える設計思想",
    text: "Alphaをプラスに保ちながら、ドローダウンの抑制を重視した評価設計です。",
    icon: Target,
  },
];

const demoBullets = [
  "市場状態をリアルタイムで理解",
  "リスクを考慮した戦略を選択",
  "B&H比較で成果を評価",
  "AlphaとDDを常にモニタリング",
];

const techCards: CardItem[] = [
  {
    title: "世界モデル",
    text: "見えない市場構造と状態遷移を学習。",
    icon: Globe2,
  },
  {
    title: "模倣学習",
    text: "教師方策を起点に安定した初期方策を構築。",
    icon: DatabaseZap,
  },
  {
    title: "強化学習",
    text: "報酬とリスクを見ながら方策を改善。",
    icon: Network,
  },
  {
    title: "リスク制御",
    text: "DD抑制と安全な意思決定を重視。",
    icon: LockKeyhole,
  },
];

const socialLinks = [
  { label: "X", href: "#", icon: FaXTwitter },
  { label: "GitHub", href: "https://github.com/shinji-ogasa/UniDream", icon: FaGithub },
  { label: "LinkedIn", href: "#", icon: FaLinkedin },
  { label: "YouTube", href: "#", icon: FaYoutube },
];

const pageStyle: React.CSSProperties = {
  fontFamily:
    'Inter, "Noto Sans JP", "SF Pro Display", "Hiragino Kaku Gothic ProN", "Yu Gothic", system-ui, sans-serif',
  background:
    "radial-gradient(circle at 82% 4%, rgba(59,130,246,0.18), transparent 28%), radial-gradient(circle at 18% 18%, rgba(139,92,246,0.10), transparent 26%), radial-gradient(circle at 50% 72%, rgba(16,185,129,0.07), transparent 34%), linear-gradient(180deg, #ffffff 0%, #f8fbff 42%, #ffffff 100%)",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-[0.28em] text-blue-600">{children}</p>
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
      ? "bg-slate-950 text-white shadow-xl shadow-slate-900/10 hover:-translate-y-0.5 hover:bg-slate-800"
      : "border border-slate-200 bg-white/75 text-slate-900 shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700";
  const base = `inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-[-0.01em] transition ${cls}`;
  const inner = (
    <>
      {children}
      <ArrowRight className="h-4 w-4" />
    </>
  );
  if (href && href.startsWith("/")) {
    return (
      <Link href={href} className={base}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={base} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className={base}>
      {inner}
    </button>
  );
}

function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const h = size === "sm" ? 32 : 40;
  return (
    <Link href="/homepage" className="flex items-center" aria-label="WorldForge AI">
      <Image
        src="/worldforge-ai-logo.png"
        alt="WorldForge AI · UniDream"
        height={h}
        width={Math.round(h * 4)}
        priority
        className="h-8 md:h-10 w-auto"
      />
    </Link>
  );
}

function PremiumIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-50 via-white to-violet-50 ring-1 ring-slate-100 shadow-sm">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 opacity-0 transition group-hover:opacity-100" />
      <Icon className="relative h-6 w-6 text-blue-600" strokeWidth={2.1} />
    </div>
  );
}

function HeroMetric({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "blue" | "emerald" | "violet";
}) {
  const toneMap = {
    blue: "border-blue-300/20 bg-blue-400/10 text-blue-100",
    emerald: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
    violet: "border-violet-300/20 bg-violet-400/10 text-violet-100",
  } as const;

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.08] p-4 shadow-lg shadow-black/20 backdrop-blur-xl">
      <p className="text-[10px] font-semibold tracking-[0.18em] text-white/45">{title}</p>
      <p className={`mt-2 rounded-full border px-3 py-1 text-center text-sm font-semibold ${toneMap[tone]}`}>
        {value}
      </p>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto h-[480px] md:h-[560px] w-full max-w-[660px]">
      <div className="absolute -inset-8 rounded-[64px] bg-gradient-to-br from-blue-500/15 via-violet-500/10 to-emerald-400/10 blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 18, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative h-full overflow-hidden rounded-[44px] border border-white/15 bg-slate-950 shadow-2xl shadow-blue-950/25"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 12%, rgba(56,189,248,0.34), transparent 28%), radial-gradient(circle at 78% 16%, rgba(168,85,247,0.28), transparent 30%), radial-gradient(circle at 50% 88%, rgba(16,185,129,0.18), transparent 34%), #020617",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.22) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="absolute left-6 right-6 top-6 z-20 flex items-center justify-between rounded-[28px] border border-white/10 bg-white/[0.08] px-5 py-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-blue-100/60">
              WORLD MODEL CORE
            </p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.035em] text-white">
              Market Intelligence Engine
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.9)]" />
            LIVE STATE
          </div>
        </div>
        <div className="absolute left-1/2 top-[112px] md:top-[132px] z-10 h-[220px] w-[220px] md:h-[260px] md:w-[260px] -translate-x-1/2">
          <div className="absolute inset-0 rounded-full bg-blue-500/25 blur-3xl" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 28, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-cyan-300/30"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 36, ease: "linear" }}
            className="absolute inset-8 rounded-full border border-violet-300/25"
          />
          <div className="absolute inset-12 rounded-[42px] border border-white/15 bg-white/[0.08] backdrop-blur-2xl rotate-45 shadow-[0_0_80px_rgba(96,165,250,0.36)]" />
          <div className="absolute inset-[68px] md:inset-[82px] rounded-[26px] bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-500 rotate-45 opacity-90 shadow-[0_0_60px_rgba(59,130,246,0.7)]" />
          <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_40px_rgba(255,255,255,0.9)]" />
        </div>
        <svg
          className="absolute left-6 right-6 md:left-8 md:right-8 top-[245px] md:top-[285px] z-0 h-36 md:h-44 w-[calc(100%-3rem)] md:w-[610px] opacity-95"
          viewBox="0 0 610 180"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 132C72 48 130 34 198 84C274 140 354 150 462 64C512 24 556 28 606 44"
            stroke="url(#heroStrategy)"
            strokeWidth="3.7"
            strokeLinecap="round"
          />
          <path
            d="M4 142C90 118 157 116 245 119C363 123 462 98 606 112"
            stroke="rgba(226,232,240,0.38)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M4 132C72 48 130 34 198 84C274 140 354 150 462 64C512 24 556 28 606 44L606 180H4Z"
            fill="url(#heroFill)"
          />
          <defs>
            <linearGradient id="heroStrategy" x1="4" y1="132" x2="606" y2="44">
              <stop stopColor="#34D399" />
              <stop offset="0.48" stopColor="#60A5FA" />
              <stop offset="1" stopColor="#C084FC" />
            </linearGradient>
            <linearGradient id="heroFill" x1="305" y1="44" x2="305" y2="180">
              <stop stopColor="#38BDF8" stopOpacity="0.26" />
              <stop offset="1" stopColor="#38BDF8" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute left-6 top-[120px] md:top-[138px] z-20 rounded-2xl border border-white/10 bg-white/[0.10] px-3 md:px-4 py-2 md:py-3 text-xs font-semibold text-white shadow-xl shadow-black/20 backdrop-blur-xl">
          <span className="mr-2 text-cyan-200">↗</span>市場状態
        </div>
        <div className="absolute right-6 top-[132px] md:top-[152px] z-20 rounded-2xl border border-white/10 bg-white/[0.10] px-3 md:px-4 py-2 md:py-3 text-xs font-semibold text-white shadow-xl shadow-black/20 backdrop-blur-xl">
          <span className="mr-2 text-violet-200">◇</span>リスク
        </div>
        <div className="absolute left-6 bottom-[112px] md:bottom-[132px] z-20 rounded-2xl border border-white/10 bg-white/[0.10] px-3 md:px-4 py-2 md:py-3 text-xs font-semibold text-white shadow-xl shadow-black/20 backdrop-blur-xl">
          <span className="mr-2 text-emerald-200">∿</span>不確実性
        </div>
        <div className="absolute right-6 bottom-[116px] md:bottom-[136px] z-20 rounded-2xl border border-white/10 bg-white/[0.10] px-3 md:px-4 py-2 md:py-3 text-xs font-semibold text-white shadow-xl shadow-black/20 backdrop-blur-xl">
          <span className="mr-2 text-blue-200">▥</span>B&H比較
        </div>
        <div className="absolute bottom-6 left-6 right-6 z-20 grid grid-cols-3 gap-3">
          <HeroMetric title="AlphaEx" value="+0.9 pt/yr" tone="blue" />
          <HeroMetric title="MaxDDΔ" value="-1.6 pt" tone="emerald" />
          <HeroMetric title="Signal" value="LONG" tone="violet" />
        </div>
      </motion.div>
    </div>
  );
}

function ValueStrip() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {valueCards.map((card) => (
        <div
          key={card.title}
          className="group rounded-[30px] border border-slate-100 bg-white/85 p-6 shadow-xl shadow-blue-100/50 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-100/70"
        >
          <PremiumIcon icon={card.icon} />
          <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-slate-950">
            {card.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{card.text}</p>
        </div>
      ))}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, text }: CardItem) {
  return (
    <div className="group rounded-[32px] border border-slate-100 bg-white p-7 shadow-lg shadow-blue-100/40 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/70">
      <PremiumIcon icon={Icon} />
      <h3 className="mb-3 mt-6 text-xl font-semibold tracking-[-0.035em] text-slate-950">
        {title}
      </h3>
      <p className="text-sm leading-7 text-slate-600">{text}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  green,
  orange,
}: {
  label: string;
  value: string;
  sub: string;
  green?: boolean;
  orange?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="mb-2 truncate text-[10px] font-semibold tracking-widest text-slate-500">
        {label}
      </p>
      <p
        className={`truncate text-2xl font-semibold tracking-[-0.04em] ${
          green ? "text-emerald-500" : orange ? "text-orange-500" : "text-slate-950"
        }`}
      >
        {value}
      </p>
      <p className="mt-2 truncate text-xs font-medium text-slate-500">{sub}</p>
    </div>
  );
}

function TradeRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
      <span className="text-xs font-semibold tracking-widest text-slate-400">{label}</span>
      <span className={`font-semibold ${accent ? "text-emerald-500" : "text-slate-700"}`}>
        {value}
      </span>
    </div>
  );
}

function ChartGrid() {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(148,163,184,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.22) 1px, transparent 1px)",
        backgroundSize: "86px 54px",
      }}
    />
  );
}

function DemoDashboard() {
  return (
    <div className="rounded-[34px] border border-slate-100 bg-white p-4 shadow-2xl shadow-blue-100/70 md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              UniDream Demo
            </h3>
            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
              BTCUSDT ・ 15m
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold text-orange-500">
            Research demo only. Not financial advice. Virtual paper-trading only.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          LIVE
          <span className="text-slate-400">next in 13:46</span>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="EQUITY" value="$10,942.77" sub="PnL +9.43%" green />
        <Metric label="CASH" value="$0.00" sub="asset_qty 0.139808" />
        <Metric label="LAST PRICE" value="$78,270.21" sub="2026-05-02 UTC" />
        <Metric label="LATEST SIGNAL" value="benchmark" sub="raw position 1.000" orange />
      </div>
      <div className="mt-3 grid gap-3 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="rounded-3xl border border-slate-100 p-5">
          <p className="mb-5 text-xs font-semibold tracking-widest text-slate-500">POSITION</p>
          <div className="flex items-center gap-5">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border-[12px] border-emerald-400 text-center">
              <div>
                <p className="text-xl font-semibold tracking-[-0.04em] text-emerald-500">100%</p>
                <p className="text-xs font-semibold text-emerald-600">LONG</p>
              </div>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-y-2 text-sm">
              <span className="text-slate-500">target</span>
              <b className="text-right font-semibold">1.000</b>
              <span className="text-slate-500">cash</span>
              <b className="text-right font-semibold">$0.00</b>
              <span className="text-slate-500">qty</span>
              <b className="text-right font-semibold">0.139808</b>
              <span className="text-slate-500">equity</span>
              <b className="text-right font-semibold">$10,942.77</b>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="ALPHA (EXCESS)" value="+0.00%" sub="strat +9.43% ・ B&H +9.43%" />
          <Metric label="SHARPE Δ" value="+1.86" sub="strat 1.86 ・ B&H 1.86" />
          <Metric label="MAXDD Δ" value="-0.00%" sub="strat 13.58% ・ B&H 13.58%" />
          <Metric label="TURNOVER" value="0.99x" sub="1 trades ・ 4554 bars" />
        </div>
      </div>
      <div className="mt-3 rounded-3xl border border-slate-100 p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold tracking-widest text-slate-500">
            LONG / SHORT / FLAT
          </p>
          <span className="text-xs font-medium text-slate-400">visible window: 4554 bars</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-full rounded-full bg-emerald-400" />
        </div>
        <div className="mt-4 grid grid-cols-3 text-sm font-semibold">
          <div>
            <p className="text-emerald-600">long</p>
            <p>100.0%</p>
          </div>
          <div>
            <p className="text-slate-400">flat</p>
            <p>0.0%</p>
          </div>
          <div>
            <p className="text-rose-500">short</p>
            <p>0.0%</p>
          </div>
        </div>
      </div>
      <div className="mt-3 grid gap-3 xl:grid-cols-[1.65fr_0.95fr]">
        <div className="rounded-3xl border border-slate-100 p-5">
          <div className="mb-4 flex justify-between">
            <h4 className="font-semibold tracking-[-0.03em] text-slate-900">
              Performance vs Buy & Hold
            </h4>
            <span className="text-xs font-medium text-slate-500">15m bars</span>
          </div>
          <div className="relative h-72 overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50 to-white">
            <ChartGrid />
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 700 260"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
            >
              <polyline
                points="0,175 25,95 55,115 85,130 115,190 145,160 175,170 205,210 235,190 265,150 295,185 325,175 355,145 385,105 415,125 445,90 475,75 505,35 535,80 565,58 595,82 625,64 655,96 700,52"
                stroke="#34d399"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="0,178 55,170 115,174 175,180 235,178 295,168 355,162 415,150 475,142 535,135 595,127 655,122 700,116"
                stroke="#cbd5e1"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-5 text-xs font-semibold text-slate-500">
              <span className="text-emerald-500">━ strategy</span>
              <span>━ B&H</span>
              <span className="text-blue-500">▲ buy</span>
              <span className="text-rose-500">▼ sell</span>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-100 p-5">
          <h4 className="mb-4 font-semibold tracking-[-0.03em] text-slate-900">RECENT TRADES</h4>
          <div className="space-y-3 text-sm">
            <TradeRow label="TIME" value="2026-03-15 13:15 UTC" />
            <TradeRow label="FROM" value="0.000" />
            <TradeRow label="TO" value="1.000" accent />
            <TradeRow label="PRICE" value="$71,526.90" />
            <TradeRow label="NOTIONAL" value="10,000.00" />
          </div>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">
            このデモは研究目的のものであり、投資助言ではありません。
          </div>
        </div>
      </div>
    </div>
  );
}

function VisionVisual() {
  return (
    <div className="relative h-[320px] md:h-[360px] overflow-hidden rounded-[36px] border border-white/60 bg-slate-950 shadow-2xl shadow-blue-950/15">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 42% 42%, rgba(59,130,246,0.36), transparent 30%), radial-gradient(circle at 62% 68%, rgba(139,92,246,0.28), transparent 32%), radial-gradient(circle at 32% 78%, rgba(16,185,129,0.16), transparent 34%), #020617",
        }}
      />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 420 360" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="visionOrbit" x1="60" y1="40" x2="330" y2="280">
            <stop stopColor="#22D3EE" />
            <stop offset="0.55" stopColor="#6366F1" />
            <stop offset="1" stopColor="#A855F7" />
          </linearGradient>
          <radialGradient
            id="visionGlow"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(210 160) rotate(90) scale(145 145)"
          >
            <stop stopColor="#60A5FA" stopOpacity="0.55" />
            <stop offset="1" stopColor="#60A5FA" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="210" cy="160" r="145" fill="url(#visionGlow)" />
        <ellipse cx="210" cy="160" rx="148" ry="58" stroke="url(#visionOrbit)" strokeWidth="2.5" opacity="0.86" />
        <ellipse cx="210" cy="160" rx="72" ry="132" stroke="url(#visionOrbit)" strokeWidth="2.5" opacity="0.76" />
        <ellipse cx="210" cy="160" rx="126" ry="132" stroke="#93C5FD" strokeWidth="1.6" opacity="0.35" />
        <path d="M72 160H348" stroke="#93C5FD" strokeOpacity="0.38" strokeWidth="1.5" />
        <path d="M210 35V285" stroke="#C4B5FD" strokeOpacity="0.38" strokeWidth="1.5" />
        <circle cx="210" cy="160" r="9" fill="#FFFFFF" />
        <circle cx="210" cy="160" r="18" stroke="#60A5FA" strokeOpacity="0.66" strokeWidth="2" />
        <circle cx="122" cy="108" r="5" fill="#38BDF8" />
        <circle cx="304" cy="202" r="6" fill="#34D399" />
        <circle cx="260" cy="70" r="5" fill="#A78BFA" />
        <circle cx="152" cy="247" r="5" fill="#818CF8" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect
            key={i}
            x={46 + i * 34}
            y={292 - [42, 88, 62, 124, 76, 108, 54, 138][i]}
            width="16"
            height={[42, 88, 62, 124, 76, 108, 54, 138][i]}
            rx="8"
            fill={i % 2 ? "#818CF8" : "#38BDF8"}
            opacity="0.42"
          />
        ))}
      </svg>
      <div className="absolute bottom-6 left-6 right-6 rounded-3xl border border-white/10 bg-white/[0.08] p-5 text-white backdrop-blur-xl">
        <p className="text-xs font-semibold tracking-[0.22em] text-blue-100/60">MARKET STRUCTURE</p>
        <p className="mt-2 text-lg font-semibold tracking-[-0.04em]">
          Hidden regimes, liquidity, risk, and behavior.
        </p>
      </div>
    </div>
  );
}

function Vision() {
  return (
    <section className="rounded-[42px] border border-slate-100 bg-white/75 p-6 md:p-12 shadow-xl shadow-blue-100/40 backdrop-blur">
      <div className="grid items-center gap-8 md:gap-12 lg:grid-cols-[0.78fr_1.22fr]">
        <VisionVisual />
        <div>
          <SectionLabel>VISION</SectionLabel>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-slate-950">
            私たちのビジョン
          </h2>
          <div className="mt-6 space-y-5 text-base leading-9 text-slate-700">
            <p>
              金融市場は、価格だけで動いているわけではありません。その裏側には、投資家心理、流動性、リスク、ニュース、制度、そして時間とともに変化する市場状態があります。
            </p>
            <p>
              UniDreamは、世界モデルと強化学習によって、そうした
              <span className="font-semibold text-blue-700">見えない市場構造を学習</span>
              し、将来の価格を単純に当てるのではなく、「いま市場で何が起きているのか」「どの行動がリスクに対して合理的なのか」を判断するAIを目指します。
            </p>
            <p>
              私たちは、金融の意思決定を、経験と勘だけに頼るものから、
              <span className="font-semibold text-blue-700">市場理解に基づいた、再現性のある知能</span>
              へ進化させます。
            </p>
          </div>
        </div>
      </div>
    </section>
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
      className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-base text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-md"
    >
      <Icon />
    </a>
  );
}

function Footer() {
  const columns: [string, ...string[]][] = [
    ["プロダクト", "UniDreamとは", "機能一覧", "ダッシュボード", "料金プラン"],
    ["技術", "世界モデル", "強化学習", "リスク制御", "アーキテクチャ"],
    ["研究", "研究アプローチ", "論文・レポート", "ベンチマーク", "公開データ"],
    ["会社情報", "会社概要", "採用情報", "ニュース", "お問い合わせ"],
  ];

  return (
    <footer className="border-t border-slate-100 bg-white/80 py-12">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.35fr_2fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-600">
            UniDreamは、世界モデルと強化学習を用いて市場状態を理解し、リスクを考慮した意思決定で、B&Hを超えるパフォーマンスを目指すAIプロダクトです。
          </p>
          <div className="mt-6 flex items-center gap-3">
            {socialLinks.map((item) => (
              <SocialButton key={item.label} {...item} />
            ))}
          </div>
          <p className="mt-8 text-xs font-medium text-slate-400">© 2026 WorldForge AI</p>
        </div>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col[0]}>
              <h4 className="mb-4 text-sm font-semibold tracking-[-0.02em] text-slate-950">
                {col[0]}
              </h4>
              <ul className="space-y-3 text-sm font-medium text-slate-500">
                {col.slice(1).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default function HomepagePage() {
  return (
    <main className="min-h-screen overflow-hidden text-slate-950 antialiased" style={pageStyle}>
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-4 md:py-5">
          <Logo />
          <nav className="hidden items-center gap-10 text-sm font-semibold text-slate-700 lg:flex">
            {navItems.map((item) => (
              <a key={item} href="#" className="transition hover:text-blue-600">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3 md:gap-5">
            <Link
              href="/"
              className="hidden text-sm font-semibold text-slate-700 transition hover:text-blue-600 md:block"
            >
              デモ
            </Link>
            <button
              type="button"
              className="rounded-full bg-slate-950 px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              問い合わせ
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 md:px-6 pb-10 pt-10 md:pt-20">
        <div className="grid items-center gap-10 md:gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="mb-6 inline-flex rounded-full border border-blue-100 bg-white/80 px-5 py-2 text-sm font-semibold text-blue-700 shadow-sm">
              UniDream
            </span>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.075em] text-slate-950 md:text-7xl md:leading-[1.02]">
              価格予測を超え、
              <br />
              市場を理解する
            </h1>
            <p className="mt-5 text-lg font-semibold tracking-[-0.03em] text-slate-700">
              World Models for Market Intelligence
            </p>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
              UniDreamは、世界モデルと強化学習を用いて市場状態を理解し、リスクを考慮した意思決定で、B&Hを超えるパフォーマンスを目指します。
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <CtaButton>問い合わせ</CtaButton>
              <CtaButton variant="secondary" href="/">
                デモを見る
              </CtaButton>
            </div>
          </div>
          <HeroVisual />
        </div>
        <div className="mt-12">
          <ValueStrip />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <SectionLabel>DECISION INTELLIGENCE</SectionLabel>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-slate-950">
            市場理解にもとづくAI意思決定
          </h2>
          <p className="mt-4 text-slate-600">
            見えない市場構造を学習し、リスクを考慮した合理的な行動を導きます。
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {featureCards.map((card) => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16">
        <div className="mb-8 grid gap-8 lg:grid-cols-[0.62fr_1.38fr] lg:items-end">
          <div>
            <SectionLabel>LIVE RESEARCH DEMO</SectionLabel>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold leading-tight tracking-[-0.055em] text-slate-950">
              デモで見る
              <br />
              UniDream
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <CtaButton href="/">デモを見る</CtaButton>
              <CtaButton variant="secondary">問い合わせ</CtaButton>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <p className="leading-8 text-slate-600">
              研究デモで、UniDreamの実際の意思決定とパフォーマンスをご確認いただけます。
            </p>
            <ul className="grid gap-3 text-sm font-semibold text-slate-700 sm:grid-cols-2">
              {demoBullets.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <span className="inline-grid h-5 w-5 place-items-center rounded-full bg-blue-50 text-[11px] text-blue-600">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-5 rounded-[46px] bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-emerald-400/10 blur-2xl" />
          <div className="relative">
            <DemoDashboard />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16">
        <Vision />
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 md:px-6 pb-20 lg:grid-cols-[0.42fr_1.58fr]">
        <div>
          <SectionLabel>RESEARCH TO PRODUCT</SectionLabel>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-slate-950">
            技術アプローチ
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {techCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="group rounded-3xl border border-slate-100 bg-white p-5 shadow-lg shadow-blue-100/40"
              >
                <PremiumIcon icon={Icon} />
                <h3 className="mb-2 mt-4 font-semibold tracking-[-0.03em] text-slate-950">
                  {card.title}
                </h3>
                <p className="text-xs leading-6 text-slate-500">{card.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </main>
  );
}
