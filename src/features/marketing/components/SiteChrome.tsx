import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import type { ReactNode } from "react";

import { MARKETING_NAV } from "../data";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/homepage" className="brand-mark" aria-label="Zeniq / UniDream">
      <Image
        src="/Zeniq-logo.png"
        alt="Zeniq"
        width={130}
        height={41}
        priority
        unoptimized
        className="brand-mark__logo"
      />
      {!compact && (
        <span className="brand-mark__product">
          <span>/</span> UNIDREAM
        </span>
      )}
    </Link>
  );
}

export function ArrowLink({
  children,
  href,
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary" | "text";
  className?: string;
}) {
  const classes = `arrow-link arrow-link--${variant} ${className}`.trim();
  const content = (
    <>
      <span>{children}</span>
      {variant === "text" ? <ArrowUpRight aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
    </>
  );

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={classes}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {content}
    </a>
  );
}

export function SiteHeader() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        メインコンテンツへ移動
      </a>
      <header className="site-header">
        <div className="site-container site-header__inner">
          <BrandMark />

          <nav className="site-header__nav" aria-label="メインナビゲーション">
            {MARKETING_NAV.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="site-header__actions">
            <a
              className="site-header__github"
              href="https://github.com/shinji-ogasa/UniDream"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHubで研究リポジトリを見る"
            >
              <FaGithub aria-hidden="true" />
              <span>RESEARCH</span>
            </a>
            <ArrowLink href="/" className="site-header__cta">
              デモを開く
            </ArrowLink>
          </div>

          <details className="site-header__mobile-menu">
            <summary aria-label="メニューを開く">
              <Menu aria-hidden="true" className="site-header__menu-open" />
              <X aria-hidden="true" className="site-header__menu-close" />
              <span>MENU</span>
            </summary>
            <nav aria-label="モバイルナビゲーション">
              {MARKETING_NAV.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                  <ArrowUpRight aria-hidden="true" />
                </a>
              ))}
              <a href="/" className="site-header__mobile-demo">
                デモを開く
                <ArrowRight aria-hidden="true" />
              </a>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="site-footer__top">
          <div>
            <BrandMark />
            <p className="site-footer__statement">
              市場の隠れた構造を読み、<br className="display-break" />
              検証可能な意思決定へ。
            </p>
          </div>
          <div className="site-footer__links">
            <div>
              <span className="site-footer__label">EXPLORE</span>
              <a href="#product">プロダクト</a>
              <a href="#research">研究アプローチ</a>
              <a href="#evidence">検証スコアカード</a>
              <a href="#demo">ペーパートレードデモ</a>
            </div>
            <div>
              <span className="site-footer__label">CONNECT</span>
              <a href="/homepage/contact">お問い合わせ</a>
              <a href="https://github.com/shinji-ogasa/UniDream" target="_blank" rel="noopener noreferrer">
                GitHub <ArrowUpRight aria-hidden="true" />
              </a>
              <a href="https://huggingface.co/spaces/ShinjiAA/unidream-space" target="_blank" rel="noopener noreferrer">
                Hugging Face <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>© 2026 Zeniq AI</span>
          <span>RESEARCH DEMO · NOT FINANCIAL ADVICE</span>
          <span>BTCUSDT / 15m</span>
        </div>
      </div>
    </footer>
  );
}
