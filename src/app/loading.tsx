import Image from "next/image";

export default function LoadingPage() {
  return (
    <div className="loading-screen">
      <div className="loading-screen__grid" aria-hidden="true" />
      <div className="loading-screen__content">
        <Image
          src="/Zeniq-logo.png"
          alt="Zeniq"
          width={220}
          height={70}
          className="loading-screen__logo"
          priority
          unoptimized
        />
        <div className="loading-screen__status">
          <span className="status-dot" aria-hidden="true" />
          <span>INITIALIZING UNIDREAM / LIVE SURFACE</span>
        </div>
        <div className="loading-screen__bar" aria-hidden="true"><span /></div>
        <span className="loading-screen__note">MARKET STATE · BTCUSDT / 15m</span>
      </div>
    </div>
  );
}
