import Image from "next/image";

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-[#08090a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-16 w-64 animate-pulse">
          <Image
            src="/worldforge-ai-logo.png"
            alt="WorldForge AI"
            fill
            className="object-contain opacity-50"
            priority
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-[#5266eb] animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 rounded-full bg-[#5266eb] animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-2 rounded-full bg-[#5266eb] animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <p className="text-sm text-[#626b7a] font-mono">Loading inference engine...</p>
      </div>
    </div>
  );
}
