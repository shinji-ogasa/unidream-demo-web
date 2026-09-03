import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { FaGithub } from "react-icons/fa6";

import { BrandMark } from "./components/SiteChrome";

export default function ContactPage() {
  return (
    <main className="contact-page">
      <header className="contact-page__header">
        <div className="site-container contact-page__header-inner">
          <BrandMark />
          <Link href="/" className="contact-page__demo-link">
            デモを見る <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="contact-page__field" aria-hidden="true">
        <span>CONTACT / 06</span>
        <span>ZENIQ AI</span>
      </div>

      <section className="site-container contact-page__content" aria-labelledby="contact-page-title">
        <div className="contact-page__intro">
          <Link href="/homepage" className="back-link"><ArrowLeft aria-hidden="true" /> BACK TO UNIDREAM</Link>
          <p className="contact-page__eyebrow">OPEN A CONVERSATION</p>
          <h1 id="contact-page-title">お問い合わせ</h1>
          <p className="contact-page__lead">PoC導入、共同研究、デモの試用。検証したい課題からお聞かせください。</p>
          <div className="contact-page__notes">
            <span><i /> research stage</span>
            <span><i /> response by email</span>
            <span><i /> no financial advice</span>
          </div>
        </div>

        <div className="contact-page__grid">
          <form className="contact-form">
            <div className="contact-form__head">
              <span className="micro-label">MESSAGE / 01</span>
              <span>Required fields are marked *</span>
            </div>
            <label>
              <span>お名前 <b>*</b></span>
              <input type="text" name="name" placeholder="氏名" required />
            </label>
            <label>
              <span>メールアドレス <b>*</b></span>
              <input type="email" name="email" placeholder="example@email.com" required />
            </label>
            <label>
              <span>目的 <b>*</b></span>
              <select name="purpose" defaultValue="" required>
                <option value="" disabled>選択してください</option>
                <option value="poc">PoC導入の相談</option>
                <option value="research">共同研究</option>
                <option value="demo">デモの試用</option>
                <option value="other">その他</option>
              </select>
            </label>
            <label>
              <span>メッセージ <b>*</b></span>
              <textarea name="message" rows={6} placeholder="検証したい課題やご相談内容" required />
            </label>
            <button type="submit" className="arrow-link arrow-link--primary">
              <span>送信する</span>
              <ArrowRight aria-hidden="true" />
            </button>
            <p className="contact-form__notice">送信後、担当者よりメールでご連絡します。現在は研究・デモ段階のため、返答までにお時間をいただく場合があります。</p>
          </form>

          <aside className="contact-page__aside">
            <div className="contact-aside-card">
              <span className="micro-label">DIRECT CHANNEL</span>
              <h2>研究の中身を<br className="display-break" />先に見る。</h2>
              <p>実験コード、検証レポート、推論サーバーを公開しています。</p>
              <a href="https://github.com/shinji-ogasa/UniDream" target="_blank" rel="noopener noreferrer">
                <FaGithub aria-hidden="true" />
                <span>UniDream on GitHub</span>
                <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
            <div className="contact-aside-card contact-aside-card--small">
              <span className="micro-label">DEMO SURFACE</span>
              <p>同じ契約を使うデモ用推論と仮想ペーパートレードを確認できます。</p>
              <Link href="/" className="text-link">ダッシュボードを開く <ArrowUpRight aria-hidden="true" /></Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
