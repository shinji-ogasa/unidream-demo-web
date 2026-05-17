import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FaGithub } from "react-icons/fa6";

export default function ContactPage() {
  return (
    <main className="site-bg min-h-screen text-[#f4f7fb] antialiased">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(8,9,10,0.80)] backdrop-blur-xl">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 flex items-center justify-between py-4 md:py-5">
          <Link href="/homepage" className="text-base font-semibold text-[#f4f7fb] hover:text-[#8a93a3] transition">
            ← Zeniq
          </Link>
          <Link href="/" className="text-sm font-medium text-[#8a93a3] transition hover:text-[#f4f7fb]">
            デモを見る
          </Link>
        </div>
      </header>

      <section className="pt-28 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-[680px] mx-auto px-6">
          <p className="text-sm font-semibold tracking-[0.12em] text-[#8a93a3] mb-3">CONTACT</p>
          <h1 className="text-[clamp(2.8rem,5vw,4.5rem)] font-semibold tracking-[-0.06em] leading-[0.95] text-[#f4f7fb] mb-4">
            お問い合わせ
          </h1>
          <p className="text-lg leading-8 text-[#8a93a3] mb-10">
            PoC導入、共同研究、デモの試用など、目的に合わせてご連絡ください。
          </p>

          <form className="flex flex-col gap-6">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-[#f4f7fb] mb-2 block">お名前</label>
              <input type="text" id="name" placeholder="氏名" className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-5 py-4 text-base text-[#f4f7fb] placeholder-[#626b7a] outline-none focus:border-[#5266eb] transition" />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-[#f4f7fb] mb-2 block">メールアドレス</label>
              <input type="email" id="email" placeholder="example@email.com" className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-5 py-4 text-base text-[#f4f7fb] placeholder-[#626b7a] outline-none focus:border-[#5266eb] transition" />
            </div>
            <div>
              <label htmlFor="purpose" className="text-sm font-medium text-[#f4f7fb] mb-2 block">目的</label>
              <select id="purpose" className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-5 py-4 text-base text-[#f4f7fb] outline-none focus:border-[#5266eb] transition">
                <option value="" className="bg-[#12151d]">選択してください</option>
                <option value="poc" className="bg-[#12151d]">PoC導入の相談</option>
                <option value="research" className="bg-[#12151d]">共同研究</option>
                <option value="demo" className="bg-[#12151d]">デモの試用</option>
                <option value="other" className="bg-[#12151d]">その他</option>
              </select>
            </div>
            <div>
              <label htmlFor="message" className="text-sm font-medium text-[#f4f7fb] mb-2 block">メッセージ</label>
              <textarea id="message" rows={5} placeholder="お問い合わせ内容をご記入ください" className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-5 py-4 text-base text-[#f4f7fb] placeholder-[#626b7a] outline-none focus:border-[#5266eb] transition resize-none" />
            </div>
            <button type="submit" className="btn-primary inline-flex items-center justify-center gap-2 text-base py-4 px-8 self-start">
              送信する
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-8 text-sm text-[#626b7a]">
            送信後、担当者よりご連絡差し上げます。研究段階のプロダクトのため、ご返答までにお時間をいただく場合がございます。
          </p>
        </div>
      </section>
    </main>
  );
}
