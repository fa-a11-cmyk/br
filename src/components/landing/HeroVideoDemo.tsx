import { useState, useRef } from "react";

const HeroVideoDemo = () => {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setPlaying(true);
    setTimeout(() => {
      videoRef.current?.play();
    }, 100);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl">
      {/* Browser bar — always dark */}
      <div className="force-dark px-4 py-2.5 flex items-center gap-2 border-b border-[#28283A]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
        </div>
        <div className="flex-1 bg-[#28283A] rounded-md px-3 py-1 font-mono text-[11px] text-[#55556A] text-center">
          rapidomeet.io/demo
        </div>
      </div>

      {/* Video area */}
      {!playing ? (
        <div
          className="relative cursor-pointer aspect-video bg-card"
          onClick={handlePlay}
        >
          {/* First frame preview via video poster-like approach */}
          <video
            src="/videos/rapidomeet-demo.mp4"
            className="w-full h-full object-cover opacity-80"
            muted
            playsInline
            preload="metadata"
          />

          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/5" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[72px] h-[72px] bg-gradient-primary rounded-full flex items-center justify-center shadow-fuchsia-lg hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          <div className="absolute bottom-3 right-3 bg-black/70 px-2.5 py-1 rounded-full font-mono text-[11px] text-white">
            0:45
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-black">
          <video
            ref={videoRef}
            src="/videos/rapidomeet-demo.mp4"
            className="w-full h-full object-contain"
            controls
            autoPlay
            playsInline
          />
        </div>
      )}
    </div>
  );
};

export default HeroVideoDemo;
