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

const NAV_ITEMS = ["プロダクト", "研究成果", "技術", "研究", "会社情報"];

const METRICS = [
  { label: "AlphaEx (safe)", value: "+0.89 pt/yr", sub: "Phase 8 · BTCUSDT 15m", color: "text-[#02b8cc]" },
  { label: "MaxDDΔ (safe)", value: "-1.58 pt", sub: "vs Buy & Hold", color: "text-[#4ade80]" },
  { label: "AlphaEx (3fold)", value: "+12.97 pt", sub: "AC再学習 · test平均", color: "text-[#5266eb]" },
  { label: "Backtest", value: "2018-2024", sub: "6yr · BTCUSDT · 15m bars", color: "text-[#8b5cf6]" },
];

const SOCIAL_LINKS = [
  { label: "X", href: "#", icon: FaXTwitter },
  { label: "GitHub", href: "https://github.com/shinji-ogasa/UniDream", icon: FaGithub },
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
    <p className="label mb-3">{children}</p>
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
      <p className={`mt-2 text-3xl font-semibold tracking-[-0.04em] ${color}`}>{value}</p>
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
    <footer className="border-t border-[rgba(255,255,255,0.08)] py-16">
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
        className="sticky top-0 z-50 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(8,9,10,0.80)] backdrop-blur-xl"
      >
        <div className="container-site flex items-center justify-between py-4 md:py-5">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#8a93a3] lg:flex">
            {NAV_ITEMS.map((item) => (<a key={item} href="#" className="transition hover:text-[#f4f7fb]">{item}</a>))}
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-[#8a93a3] transition hover:text-[#f4f7fb]">デモ</Link>
            <button type="button" className="btn-primary text-sm py-2 px-5">問い合わせ</button>
          </div>
        </div>
      </motion.header>

      {/* hero */}
      <section className="relative min-h-[760px] flex items-center">
        <div className="hero-visual-bg" />
        <div className="relative z-10 container-site py-20 md:py-28">
          <div className="max-w-[760px]">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 inline-flex rounded-full border border-[rgba(82,102,235,0.3)] bg-[rgba(82,102,235,0.12)] px-5 py-1.5 text-sm font-semibold text-[#5266eb]"
            >
              UniDream · WorldForge AI
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-[clamp(3.6rem,7vw,6.5rem)] font-semibold tracking-[-0.06em] leading-[0.95] text-[#f4f7fb]"
            >
              市場の見えない構造を、<br />世界モデルで読む。
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-6 max-w-[680px] text-lg leading-8 text-[#8a93a3]"
            >
              UniDreamはOHLCVと特徴量から市場状態を学習し、想像ロールアウトと検証セレクタでB&Hを超える意思決定を探索する研究開発プロダクトです。
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <CtaButton href="/">デモを見る</CtaButton>
              <CtaButton variant="secondary">研究概要を読む</CtaButton>
            </motion.div>
          </div>
        </div>
      </section>

      {/* metrics strip */}
      <section className="container-site relative z-10 -mt-10 pb-12 md:pb-20">
        <div className="grid gap-4 md:grid-cols-4">
          {METRICS.map((m) => (
            <AnimateInView key={m.label} y={16}>
              <MetricCard {...m} />
            </AnimateInView>
          ))}
        </div>
      </section>

      {/* evidence / scorecard (DESIGN.md §9-5) */}
      <section className="container-site py-16 md:py-24">
        <div className="mb-10 max-w-[680px]">
          <SectionLabel>EVIDENCE</SectionLabel>
          <h2 className="text-[2.5rem] md:text-[3.5rem] font-semibold tracking-[-0.05em] leading-[1.0] text-[#f4f7fb]">実データによる検証結果</h2>
          <p className="mt-4 text-lg text-[#8a93a3]">BTCUSDT 15m · 2018-2024。全指標B&H比較。</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <AnimateInView className="card p-8 md:p-10 border-[rgba(94,106,210,0.36)]" x={-20} y={0}>
            <div className="flex items-start gap-3 mb-6">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[rgba(82,102,235,0.16)]"><Zap className="h-5 w-5 text-[#5266eb]" strokeWidth={2} /></div>
              <div><p className="text-base font-semibold text-[#f4f7fb]">3fold AC再学習</p><p className="text-sm text-[#8a93a3]">selector v2 strict · test平均</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div><p className="label">AlphaEx</p><p className="mt-1 text-4xl font-semibold text-[#5266eb]">+12.97 pt</p></div>
              <div><p className="label">SharpeΔ</p><p className="mt-1 text-4xl font-semibold text-[#8b5cf6]">+0.033</p></div>
              <div><p className="label">MaxDDΔ</p><p className="mt-1 text-4xl font-semibold text-[#4ade80]">-0.30 pt</p></div>
            </div>
            <p className="mt-5 text-sm text-[#626b7a] leading-5">B&H比でリターン増加、Sharpe微増、DD改善。※ strict条件でvalidation全fold acceptは未達。</p>
          </AnimateInView>
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
      </section>

      {/* product (DESIGN.md §9-4) */}
      <section className="container-site py-16 md:py-24">
        <div className="mb-10 max-w-[680px]">
          <SectionLabel>PRODUCT</SectionLabel>
          <h2 className="text-[2.5rem] md:text-[3.5rem] font-semibold tracking-[-0.05em] leading-[1.0] text-[#f4f7fb]">市場理解のためのAI</h2>
          <p className="mt-4 text-lg text-[#8a93a3]">価格予測を超え、市場状態・リスク・行動を一貫してモデリング。</p>
        </div>
        <div className="grid grid-cols-12 gap-4">
          <AnimateInView y={20} className="col-span-12 lg:col-span-7 row-span-2 card p-8 md:p-10">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[rgba(82,102,235,0.16)]"><Globe2 className="h-6 w-6 text-[#5266eb]" strokeWidth={1.8} /></div>
            <h3 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[#f4f7fb]">Transformer World Model</h3>
            <p className="mt-3 max-w-lg text-base leading-6 text-[#8a93a3]">価格・流動性・リスク・ニュースから潜在市場状態を学習。将来の価格予測ではなく、市場の構造的理解を目的とするコアモデル。</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["latent state", "regime detection", "risk estimation"].map((t) => (
                <span key={t} className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-1.5 text-sm text-[#8a93a3]">{t}</span>
              ))}
            </div>
          </AnimateInView>
          {[
            { icon: BrainCircuit, title: "強化学習方策", text: "世界モデルが認識した状態を基に、リスク調整リターンを最大化。", span: "col-span-12 sm:col-span-6 lg:col-span-2" },
            { icon: Radar, title: "市場状態推定", text: "レジーム・ボラティリティ・テールリスクをリアルタイムに推定。", span: "col-span-12 sm:col-span-6 lg:col-span-3" },
            { icon: BarChart3, title: "バックテスト評価", text: "2018–2024実データ。B&H比較。", span: "col-span-12 sm:col-span-4 lg:col-span-2" },
            { icon: LineChart, title: "ダッシュボード", text: "リアルタイム推論可視化。", span: "col-span-12 sm:col-span-4 lg:col-span-2" },
            { icon: DatabaseZap, title: "模倣学習", text: "教師方策から安定初期化。", span: "col-span-12 sm:col-span-4 lg:col-span-2" },
            { icon: LockKeyhole, title: "リスク制御", text: "DD抑制と安全な意思決定。", span: "col-span-12 sm:col-span-6 lg:col-span-3" },
          ].map((card, i) => (
            <AnimateInView key={card.title} y={16} delay={0.06 * i} className={`${card.span} card ${i < 2 ? 'p-7' : 'p-6'}`}>
              <div className={`grid place-items-center ${i < 2 ? 'h-10 w-10' : 'h-8 w-8'} rounded-xl bg-[rgba(82,102,235,0.12)]`}>
                <card.icon className={`text-[#5266eb] ${i < 2 ? 'h-5 w-5' : 'h-4 w-4'}`} strokeWidth={1.8} />
              </div>
              <h3 className={`mt-4 font-semibold text-[#f4f7fb] ${i < 2 ? 'text-lg' : 'text-base'}`}>{card.title}</h3>
              <p className="mt-2 text-sm text-[#8a93a3]">{card.text}</p>
            </AnimateInView>
          ))}
        </div>
      </section>

      {/* how it works / pipeline (DESIGN.md §9-3) */}
      <section className="container-site py-16 md:py-24">
        <div className="mb-10 max-w-[680px]">
          <SectionLabel>HOW IT WORKS</SectionLabel>
          <h2 className="text-[2.5rem] md:text-[3.5rem] font-semibold tracking-[-0.05em] leading-[1.0] text-[#f4f7fb]">パイプライン</h2>
          <p className="mt-4 text-lg text-[#8a93a3]">データから意思決定までの一貫したモデルパイプライン。</p>
        </div>
        <div className="rounded-card border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] p-6 md:p-10">
          <div className="w-full overflow-x-auto">
            <svg viewBox="0 0 1040 160" className="w-full min-w-[900px]" preserveAspectRatio="xMidYMid meet">
              {[
                ["01 Data", "OHLCV / Features", "walk-forward ready"],
                ["02 Teacher", "Hindsight Oracle", "signal_aim labels"],
                ["03 World Model", "Transformer WM", "return / vol / drawdown"],
                ["04 Policy", "BC + IAC", "route + recovery"],
                ["05 Selector", "Validation Gate", "accept / reject / cooldown"],
                ["06 Report", "Test Scorecard", "M2 / PBO / regime"],
              ].map(([title, sub, desc], i) => {
                const cx = 20 + i * 170;
                return (
                  <g key={title}>
                    {i > 0 && (
                      <line x1={20 + i * 170 - 170 + 150} y1={80} x2={20 + i * 170 + 10} y2={80} stroke="rgba(82,102,235,0.2)" strokeWidth="2" strokeDasharray="5,4" markerEnd="url(#pipeArr)" />
                    )}
                    <rect x={cx} y={80 - 42} width={150} height={84} rx="14" fill="rgba(18,21,29,0.85)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                    <text x={cx + 12} y={80 - 22} fill="rgba(130,130,140,0.5)" fontSize="10" fontFamily="'Geist Mono',monospace">{title}</text>
                    <text x={cx + 12} y={80 + 2} fill="#f4f7fb" fontSize="14" fontFamily="system-ui" fontWeight="600">{sub}</text>
                    <text x={cx + 12} y={80 + 22} fill="#8a93a3" fontSize="11" fontFamily="'Geist Mono',monospace">{desc}</text>
                  </g>
                );
              })}
              <defs>
                <marker id="pipeArr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="rgba(82,102,235,0.3)" />
                </marker>
              </defs>
            </svg>
          </div>
        </div>
      </section>

      {/* vision */}
      <section className="container-site py-16 md:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div className="order-2 lg:order-1">
            <SectionLabel>VISION</SectionLabel>
            <h2 className="text-[2.5rem] md:text-[3.5rem] font-semibold tracking-[-0.05em] leading-[1.0] text-[#f4f7fb]">価格予測を超えた市場理解へ</h2>
            <div className="mt-6 space-y-4 text-base leading-7 text-[#8a93a3]">
              <p>金融市場は、価格だけで動いているわけではありません。投資家心理、流動性、リスク、ニュース、制度、そして時間とともに変化する市場状態。</p>
              <p>UniDreamは、世界モデルと強化学習によって、そうした<span className="font-semibold text-[#02b8cc]">見えない市場構造を学習</span>し、いま市場で何が起きているのか、どの行動がリスクに対して合理的なのかを判断するAIを目指します。</p>
            </div>
          </div>
          <div className="order-1 lg:order-2 rounded-card overflow-hidden border border-[rgba(255,255,255,0.08)] shadow-panel">
            <Image src="/VISION_img.png" alt="UniDream pipeline diagram" width={2400} height={1350} className="w-full h-auto" />
          </div>
        </div>
      </section>

      {/* live demo (DESIGN.md §9-4) */}
      <section className="container-site py-16 md:py-24">
        <div className="mb-10 max-w-[680px]">
          <SectionLabel>LIVE DEMO</SectionLabel>
          <h2 className="text-[2.5rem] md:text-[3.5rem] font-semibold tracking-[-0.05em] leading-[1.0] text-[#f4f7fb]">推論ダッシュボード</h2>
          <p className="mt-4 text-lg text-[#8a93a3]">リアルタイムで動作する研究デモ。エクイティ・ポジション・市場状態を一画面で。</p>
          <div className="mt-5 flex items-center gap-4 text-sm text-[#8a93a3]">
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />Live · next inference in ~15m</span>
            <span className="flex items-center gap-2"><ArrowRight className="h-3 w-3 text-[#02b8cc]" />BTCUSDT · 15m</span>
          </div>
          <div className="mt-8"><CtaButton href="/">デモを起動</CtaButton></div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[rgba(82,102,235,0.10)] via-[rgba(2,184,204,0.08)] to-[rgba(139,92,246,0.08)] blur-2xl" />
          <div className="relative dashboard-frame">
            <Image src="/dashboard-preview.png" alt="UniDream Demo dashboard" width={1400} height={900} className="w-full h-auto" />
          </div>
        </div>
      </section>

      {/* CTA (DESIGN.md §9-8) */}
      <section className="container-site pb-24 md:pb-32">
        <div className="card border-[rgba(255,255,255,0.08)] p-10 md:p-14">
          <div className="grid gap-8 md:grid-cols-[1.5fr_1fr] items-center">
            <div>
              <p className="label">CONTACT</p>
              <h2 className="mt-4 text-[2rem] md:text-[3rem] font-semibold tracking-[-0.05em] leading-[1.05] text-[#f4f7fb]">共同検証・PoCのご相談</h2>
              <p className="mt-3 text-base leading-6 text-[#8a93a3] max-w-md">研究段階のプロダクトです。PoC導入、共同研究、デモの試用など、目的に合わせてご連絡ください。</p>
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
