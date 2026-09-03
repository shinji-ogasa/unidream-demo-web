import type { Metadata } from "next";

import ContactPage from "@/features/marketing/ContactPage";

export const metadata: Metadata = {
  title: "お問い合わせ — UniDream",
  description: "UniDreamのPoC導入、共同研究、ライブデモに関するお問い合わせ。",
};

export default function ContactRoute() {
  return <ContactPage />;
}
