"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, BrainCircuit, Globe2, LineChart, LockKeyhole, Radar, ShieldCheck, Zap } from "lucide-react";
import { FaGithub, FaLinkedin, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { SiHuggingface } from "react-icons/si";

import { NeuralNetwork } from "@/components/three/NeuralNetwork";
import { Pipeline } from "@/components/homepage/Pipeline";
import { TiltCard } from "@/components/homepage/TiltCard";

const NAV_ITEMS = [
  { label: "Product", href: "#product" },
  { label: "Pipeline", href: "#pipeline" },
  { label: "Demo", href: "/" },
];

const SOCIAL_LINKS = [
  { label: "X", href: "#", icon: FaXTwitter },
  { label: "GitHub", href: "https://github.com/shinji-ogasa/UniDream", icon: FaGithub },
  { label: "Hugging Face", href: "https://huggingface.co/spaces/ShinjiAA/unidream-space", icon: SiHuggingface },
  { label: "LinkedIn", href: "#", icon: FaLinkedin },
  { label: "YouTube", href: "#", icon: FaYoutube },
];

const PRODUCT_CARDS = [
  {
    icon: Globe2,
    title: "World Model",
    text: "Learns latent market structure from price, volume, and risk signals.",
    span: "md:col-span-2 md:row-span-2",
  },
  { icon: BrainCircuit, title: "RL Policy", text: "Optimizes risk-adjusted decisions under uncertainty." },
  { icon: Radar, title: "Regime Detection", text: "Recognizes volatility and tail-risk regimes in real time." },
  { icon: BarChart3, title: "Signal Layer", text: "Translates model state into actionable exposure." },
  { icon: LineChart, title: "Live Dashboard", text: "Real-time inference, trades, and equity tracking." },
  { icon: LockKeyhole, title: "Risk Guard", text: "Drawdown control embedded in the decision loop." },
];

const EVIDENCE = [
  { label: "AlphaEx", value: "+12.97", unit: "pt", color: "text-primary" },
  { label: "MaxDD Δ", value: "-1.83", unit: "pt", color: "text-success" },
  { label: "Sharpe Δ", value: "+0.033", unit: "", color: "text-violet" },
  { label: "Walk-Forward", value: "14", unit: "folds", color: "text-cyan" },
];

function Logo() {
  return (
    <Link href="/homepage" className="flex items-center shrink-0" aria-label="Zeniq">
      <Image
        src="/Zeniq-logo.png"
        alt="Zeniq"
        height={56}
        width={224}
        priority
        unoptimized
        className="h-9 md:h-11 w-auto brightness-0 invert"
      />
    </Link>
  );
}

function CtaButton({ children, variant = "primary", href }: { children: React.ReactNode; variant?: "primary" | "secondary"; href?: string }) {
  const base = "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200";
  const cls =
    variant === "primary"
      ? `${base} bg-primary text-white shadow-glow-primary hover:bg-primary-hover hover:-translate-y-0.5`
      : `${base} border border-white/10 bg-white/[0.04] text-text hover:bg-white/[0.08] hover:border-white/20`;

  const inner = (
    <>
      {children}
      <ArrowRight className="h-4 w-4" />
    </>
  );

  if (href?.startsWith("/")) return <Link href={href} className={cls}>{inner}</Link>;
  if (href) return <a href={href} className={cls} target="_blank" rel="noopener noreferrer">{inner}</a>;
  return <button type="button" className={cls}>{inner}</button>;
}

function SocialButton({ label, href, icon: Icon }: { label: string; href: string; icon: React.ElementType }) {
  const isExternal = href.startsWith("http");
  return (
    <a
      href={href}
      aria-label={label}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="grid h-11 w-11 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-[#8a93a3] transition hover:-translate-y-0.5 hover:border-white/20 hover:text-text"
    >
      <Icon />
    </a>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block mb-5 text-xs font-semibold tracking-[0.2em] uppercase text-text-muted">
      {children}
    </span>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.08] py-10 md:py-14">
      <div className="container-site">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-6 text-text-muted">
              Transformer world model meets reinforcement learning for adaptive market decisions.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL_LINKS.map((item) => (
                <SocialButton key={item.label} {...item} />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-10 md:mr-10">
            {[
              ["Product", "UniDream", "Dashboard", "API"],
              ["Research", "Approach", "Reports", "Benchmarks"],
              ["Company", "About", "Careers", "Contact"],
            ].map((col) => (
              <div key={col[0]}>
                <h4 className="mb-4 text-sm font-semibold text-text">{col[0]}</h4>
                <ul className="space-y-3">
                  {col.slice(1).map((item) => (
                    <li key={item} className="text-sm text-text-muted hover:text-text transition cursor-default">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/[0.08] flex flex-wrap justify-between gap-4 text-xs text-text-faint">
          <p>© 2026 Zeniq AI</p>
          <div className="flex gap-6"><span>Privacy</span><span>Terms</span></div>
        </div>
      </div>
    </footer>
  );
}

export default function HomepagePage() {
  return (
    <main className="bg-bg-deep text-text antialiased snap-y snap-mandatory overflow-y-scroll h-screen">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-bg-deep/80 backdrop-blur-xl"
      >
        <div className="container-site flex items-center justify-between py-4">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-text-muted lg:flex">
            {NAV_ITEMS.map((item) => (
              <a key={item.label} href={item.href} className="transition hover:text-text">
                {item.label}
              </a>
            ))}
          </nav>
          <CtaButton href="/">Launch Demo</CtaButton>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative h-screen w-full snap-start snap-always flex items-center justify-center overflow-hidden">
        <NeuralNetwork />
        <div className="relative z-10 container-site text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            UniDream by Zeniq
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-[clamp(2.8rem,8vw,6.5rem)] font-semibold leading-[1.0] tracking-[-0.05em]"
          >
            Read the invisible
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan">
              structure of markets.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mx-auto mt-8 max-w-2xl text-lg md:text-xl leading-relaxed text-text-soft"
          >
            A transformer world model that learns market regimes, then turns learned state into
            validated trading decisions.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-10 flex flex-wrap justify-center gap-4"
          >
            <CtaButton href="/">Launch Demo</CtaButton>
            <CtaButton variant="secondary" href="https://github.com/shinji-ogasa/UniDream">
              View Research
            </CtaButton>
          </motion.div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-text-muted text-xs tracking-widest uppercase animate-bounce">
          Scroll
        </div>
      </section>

      {/* Evidence */}
      <section className="relative h-screen w-full snap-start snap-always flex items-center bg-bg-deep">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(82,102,235,0.10),transparent_50%)]" />
        <div className="container-site relative z-10">
          <div className="mb-14 max-w-2xl">
            <SectionLabel>Evidence</SectionLabel>
            <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.04em]">
              Better than Buy & Hold.
              <br />
              With less drawdown.
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {EVIDENCE.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <TiltCard className="h-full">
                  <div className="h-full rounded-[32px] border border-white/[0.08] bg-white/[0.03] p-6 md:p-8 backdrop-blur-sm shadow-panel">
                    <p className="text-xs font-semibold tracking-[0.15em] uppercase text-text-muted">
                      {item.label}
                    </p>
                    <p className={`mt-4 text-4xl md:text-5xl font-semibold tracking-[-0.04em] ${item.color}`}>
                      {item.value}
                      <span className="text-lg text-text-muted ml-1">{item.unit}</span>
                    </p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 text-sm text-text-faint"
          >
            BTCUSDT · 15m · Walk-forward validation across 14 folds. Research demo, not financial advice.
          </motion.p>
        </div>
      </section>

      {/* Product */}
      <section id="product" className="relative h-screen w-full snap-start snap-always flex items-center bg-bg-deep">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(2,184,204,0.08),transparent_50%)]" />
        <div className="container-site relative z-10">
          <div className="mb-10 max-w-2xl">
            <SectionLabel>Product</SectionLabel>
            <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.04em]">
              Not prediction.
              <br />
              Decision intelligence.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {PRODUCT_CARDS.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={card.span || ""}
              >
                <TiltCard intensity={6} className="h-full">
                  <div className="h-full rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 md:p-8 backdrop-blur-sm shadow-panel">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10">
                      <card.icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em]">{card.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted">{card.text}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section id="pipeline" className="relative min-h-screen w-full snap-start snap-always flex items-center bg-bg-deep py-20">
        <div className="container-site w-full">
          <div className="mb-14 max-w-2xl">
            <SectionLabel>Pipeline</SectionLabel>
            <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.04em]">
              From raw data
              <br />
              to live decision.
            </h2>
          </div>
          <div className="rounded-[40px] border border-white/[0.08] bg-white/[0.02] p-6 md:p-10 backdrop-blur-sm shadow-panel">
            <Pipeline />
          </div>
        </div>
      </section>

      {/* Live Demo */}
      <section className="relative h-screen w-full snap-start snap-always flex items-center bg-bg-deep">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(82,102,235,0.10),transparent_60%)]" />
        <div className="container-site relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <SectionLabel>Live Demo</SectionLabel>
              <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.04em]">
                Watch it think.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-text-soft max-w-md">
                Real-time inference on BTCUSDT every 15 minutes. Equity curve, position, and trades
                updated live via Supabase.
              </p>
              <div className="mt-8 flex items-center gap-4 text-sm text-text-muted">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  Live
                </span>
                <span className="text-text-faint">·</span>
                <span>BTCUSDT · 15m</span>
              </div>
              <div className="mt-8">
                <CtaButton href="/">Launch Dashboard</CtaButton>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="absolute -inset-8 rounded-[64px] bg-gradient-to-r from-primary/20 via-cyan/10 to-violet/15 blur-3xl" />
              <div className="relative rounded-[32px] border border-white/[0.12] overflow-hidden shadow-panel">
                <Image
                  src="/dashboard-preview.png"
                  alt="UniDream dashboard"
                  width={1400}
                  height={900}
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA / Contact */}
      <section className="relative h-screen w-full snap-start snap-always flex items-center justify-center bg-bg-deep">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(82,102,235,0.12),transparent_55%)]" />
        <div className="container-site relative z-10 text-center">
          <SectionLabel>Contact</SectionLabel>
          <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.04em]">
            Build the next generation
            <br />
            of asset management.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-text-soft">
            Research-stage product. Open for PoC, joint research, and demo access.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <CtaButton href="/">Try Demo</CtaButton>
            <CtaButton variant="secondary" href="https://github.com/shinji-ogasa/UniDream">
              GitHub
            </CtaButton>
          </div>
        </div>
      </section>

      <div className="snap-start snap-always">
        <Footer />
      </div>
    </main>
  );
}
