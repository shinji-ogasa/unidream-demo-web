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

const PRODUCT_CARDS = [
  {
    title: "Transformer World Model",
    text: "価格・流動性・リスク・ニュースから潜在市場状態を学習。将来の価格予測ではなく、市場の構造的理解を目的とします。",
    icon: Globe2,
  },
  {
    title: "強化学習方策",
    text: "世界モデルが認識した状態を基に、長期的なリスク調整リターンを最大化する行動を学習。模倣学習からスタートし安定。",
    icon: BrainCircuit,
  },
  {
    title: "市場状態推定",
    text: "現在のレジーム・ボラティリティ・流動性・テールリスクをリアルタイムに推定。隠れマルコフ＋Transformerのハイブリッド。",
    icon: Radar,
  },
  {
    title: "バックテスト評価",
    text: "2018–2024の実データで検証。B&H比較、Alpha、DD抑制、ターンオーバーを指標に、戦略の頑健性を確認。",
    icon: BarChart3,
  },
  {
    title: "ダッシュボード",
    text: "リアルタイム推論結果を可視化。エクイティ曲線、ポジション、シグナル、メトリクスを一画面でモニタリング。",
    icon: LineChart,
  },
];

const APPROACH_CARDS = [
  { title: "世界モデル", text: "見えない市場構造と状態遷移を学習。", icon: Globe2 },
  { title: "模倣学習", text: "教師方策を起点に安定した初期方策を構築。", icon: DatabaseZap },
  { title: "強化学習", text: "報酬とリスクを見ながら方策を改善。", icon: Network },
  { title: "リスク制御", text: "DD抑制と安全な意思決定を重視。", icon: LockKeyhole },
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
      className="grid h-10 w-10 place-items-center rounded-full border border-slate-700 bg-slate-900/60 text-base text-slate-400 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-500/50 hover:text-cyan-300"
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
      <p className="text-[10px] font-semibold tracking-widest text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-[-0.04em] ${color}`}>{value}</p>
      <p className="mt-2 text-xs font-medium text-slate-500">{sub}</p>
    </div>
  );
}

function BentoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="group rounded-3xl border border-slate-800 bg-slate-900/40 p-6 transition hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900/70 hover:shadow-xl hover:shadow-black/20">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-800/80 ring-1 ring-slate-700">
        <Icon className="h-6 w-6 text-cyan-400" strokeWidth={1.8} />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

function SmallCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="group rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-800/80 ring-1 ring-slate-700">
        <Icon className="h-5 w-5 text-cyan-400" strokeWidth={1.8} />
      </div>
      <h3 className="mb-2 mt-4 font-semibold tracking-[-0.03em] text-white">{title}</h3>
      <p className="text-xs leading-6 text-slate-400">{text}</p>
    </div>
  );
}

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/40 bg-slate-900/80">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/70" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
        </div>
        <span className="ml-4 text-xs text-slate-500 font-mono">UniDream Dashboard — Live Inference</span>
      </div>
      {children}
    </div>
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
    <footer className="border-t border-slate-800 bg-slate-950 py-12">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.35fr_2fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
            UniDreamは、世界モデルと強化学習を用いて市場状態を理解し、リスクを考慮した意思決定で、B&Hを超えるパフォーマンスを目指すAIプロダクトです。
          </p>
          <div className="mt-6 flex items-center gap-3">
            {SOCIAL_LINKS.map((item) => (
              <SocialButton key={item.label} {...item} />
            ))}
          </div>
          <p className="mt-8 text-xs font-medium text-slate-500">© 2026 WorldForge AI</p>
        </div>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col[0]}>
              <h4 className="mb-4 text-sm font-semibold tracking-[-0.02em] text-white">
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
    <main className="min-h-screen bg-slate-950 text-white antialiased overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 py-4 md:py-5">
          <Logo />
          <nav className="hidden items-center gap-10 text-sm font-semibold text-slate-400 lg:flex">
            {NAV_ITEMS.map((item) => (
              <a key={item} href="#" className="transition hover:text-white">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3 md:gap-5">
            <Link
              href="/"
              className="hidden text-sm font-semibold text-slate-400 transition hover:text-white md:block"
            >
              デモ
            </Link>
            <button
              type="button"
              className="rounded-full bg-white px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm font-semibold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-200"
            >
              問い合わせ
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.png"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/70 to-slate-950/85" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6 py-20 md:py-32">
          <div className="max-w-3xl">
            <span className="mb-6 inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-5 py-2 text-sm font-semibold text-cyan-300">
              UniDream · WorldForge AI
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-[-0.075em] leading-[1.02] text-white">
              市場の見えない構造を、
              <br />
              世界モデルで読む。
            </h1>
            <p className="mt-6 max-w-2xl text-base md:text-lg leading-8 text-slate-300">
              UniDreamは、Transformer世界モデルと強化学習により、価格予測ではなく
              市場状態・リスク・不確実性を学習する金融AI基盤です。
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <CtaButton href="/">デモを見る</CtaButton>
              <CtaButton variant="secondary">PoC資料を相談する</CtaButton>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 -mt-8 relative z-20 pb-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {METRICS.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <SectionLabel>PRODUCT</SectionLabel>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-white">
            市場理解のためのAIプロダクト
          </h2>
          <p className="mt-4 text-slate-400">
            価格予測を超え、市場状態・リスク・行動を一貫してモデリング。
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_CARDS.map((card) => (
            <BentoCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <SectionLabel>RESEARCH RESULTS</SectionLabel>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-white">
            成果
          </h2>
          <p className="mt-4 text-slate-400">
            実データによる検証結果。全ての戦略はB&H（Buy & Hold）との比較で評価。
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <ShieldCheck className="h-5 w-5 text-emerald-400" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Safe Baseline</p>
                <p className="text-xs text-slate-500">Phase 8 · BTCUSDT 15m · 2018-2024</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-500">AlphaEx</p>
                <p className="mt-1 text-2xl font-semibold text-cyan-400">+0.89 pt/yr</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-500">MaxDDΔ</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-400">-1.58 pt</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-6 text-slate-500">
              B&H比でリターンを維持しつつ最大ドローダウンを低減。最も堅牢なベースライン。
            </p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-blue-950/30 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                <Zap className="h-5 w-5 text-blue-400" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">3fold AC再学習</p>
                <p className="text-xs text-slate-500">selector v2 strict · test平均</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-500">AlphaEx</p>
                <p className="mt-1 text-2xl font-semibold text-blue-400">+12.97 pt</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-500">SharpeΔ</p>
                <p className="mt-1 text-2xl font-semibold text-indigo-400">+0.033</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-500">MaxDDΔ</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-400">-0.30 pt</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-6 text-slate-500">
              B&H比でリターン増加、Sharpe微増、DD改善。検証中の有望な結果。
            </p>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-600">
          ※ strict条件では validation 全fold accept 未達。Plan7既存ACとの同条件比較と danger率検証で再現性を確認中。
        </p>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-24">
          <div className="grid items-center gap-10 md:gap-16 lg:grid-cols-[1fr_1fr]">
            <div className="relative">
              <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/30 bg-slate-900/60">
                <Image
                  src="/vision-illustration.png"
                  alt="Market structure visualization"
                  width={840}
                  height={720}
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 rounded-2xl border border-slate-700 bg-slate-900/90 p-4 backdrop-blur shadow-lg">
                <p className="text-[10px] font-semibold tracking-widest text-slate-500">LATENT STATE</p>
                <div className="mt-2 flex gap-4">
                  <div><span className="text-xs text-slate-400">regime</span><p className="text-sm font-semibold text-cyan-300">bear → neutral</p></div>
                  <div><span className="text-xs text-slate-400">risk</span><p className="text-sm font-semibold text-emerald-300">low</p></div>
                </div>
              </div>
            </div>
            <div>
              <SectionLabel>VISION</SectionLabel>
              <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-white">
                価格予測を超えた市場理解へ
              </h2>
              <div className="mt-6 space-y-5 text-base leading-8 text-slate-400">
                <p>
                  金融市場は、価格だけで動いているわけではありません。その裏側には、
                  投資家心理、流動性、リスク、ニュース、制度、そして時間とともに変化する市場状態があります。
                </p>
                <p>
                  UniDreamは、世界モデルと強化学習によって、そうした
                  <span className="font-semibold text-cyan-300">見えない市場構造を学習</span>
                  し、将来の価格を単純に当てるのではなく、
                  「いま市場で何が起きているのか」「どの行動がリスクに対して合理的なのか」を判断するAIを目指します。
                </p>
                <p>
                  私たちは、金融の意思決定を、経験と勘だけに頼るものから、
                  <span className="font-semibold text-cyan-300">市場理解に基づいた、再現性のある知能</span>
                  へ進化させます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[0.55fr_1.45fr]">
          <div>
            <SectionLabel>LIVE DEMO</SectionLabel>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-white">
              実際の推論ダッシュボード
            </h2>
            <p className="mt-4 text-slate-400">
              リアルタイムで動作する研究デモ。エクイティ、ポジション、市場状態、
              リスクメトリクスを一画面で確認できます。
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <CtaButton href="/">デモを起動</CtaButton>
              <CtaButton variant="secondary">詳しく見る</CtaButton>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-[46px] bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 blur-2xl" />
            <div className="relative">
              <BrowserFrame>
                <Image
                  src="/dashboard-preview.png"
                  alt="UniDream Demo dashboard"
                  width={1400}
                  height={900}
                  className="w-full h-auto"
                />
              </BrowserFrame>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 pb-24">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-slate-900/80 p-8 md:p-12 text-center">
          <SectionLabel>GET STARTED</SectionLabel>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-white">
            金融市場の意思決定を、モデルベースに進化させる。
          </h2>
          <p className="mt-4 mx-auto max-w-xl text-slate-400">
            UniDreamは研究段階のプロダクトです。PoC導入や共同研究のご相談はお問い合わせください。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <CtaButton href="/">デモを見る</CtaButton>
            <CtaButton variant="secondary">問い合わせ</CtaButton>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
