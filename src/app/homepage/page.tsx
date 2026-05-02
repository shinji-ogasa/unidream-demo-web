"use client";

// WorldForge AI corporate landing page. Adapted from the design exploration in
// `test/test.ts`. Lives at `/homepage`; "デモを見る" CTAs link to `/` (the live
// research demo). framer-motion is used in the hero visual so the page is
// rendered as a client component.

import Image from "next/image";
import Link from "next/link";
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
  const h = size === "sm" ? 40 : 56;
  return (
    <Link href="/homepage" className="flex items-center" aria-label="WorldForge AI">
      <Image
        src="/worldforge-ai-logo.png"
        alt="WorldForge AI"
        height={h}
        width={Math.round(h * 4)}
        priority
        className="h-10 md:h-14 w-auto"
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

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[660px]">
      <Image
        src="/hero-bg.png"
        alt=""
        width={1320}
        height={1120}
        className="w-full h-auto rounded-[44px] shadow-2xl shadow-blue-950/25"
        priority
      />
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

function DemoDashboard() {
  return (
    <div className="rounded-[34px] overflow-hidden shadow-2xl shadow-blue-100/70">
      <Image
        src="/dashboard-preview.png"
        alt="UniDream Demo dashboard preview"
        width={1400}
        height={900}
        className="w-full h-auto"
      />
    </div>
  );
}

function VisionVisual() {
  return (
    <div className="relative overflow-hidden rounded-[36px] shadow-2xl shadow-blue-950/15">
      <Image
        src="/vision-illustration.png"
        alt="Market structure visualization"
        width={840}
        height={720}
        className="w-full h-auto"
      />
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
