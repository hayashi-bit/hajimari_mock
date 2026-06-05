import { useState, useEffect } from "react";

export default function Mascot() {
  const [isWaving, setIsWaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const showMessage = (msg: string, duration = 4000) => {
    setMessage(msg);
    setIsWaving(true);
    setTimeout(() => {
      setMessage(null);
      setIsWaving(false);
    }, duration);
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/notify");
        const data = await res.json();
        if (data.done) {
          showMessage("✅ 完了したよ！");
        }
      } catch {
        // dev server not running, skip
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    showMessage("こんにちは！👋", 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {message && (
        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-lg text-sm text-gray-700 animate-bounce whitespace-nowrap">
          {message}
        </div>
      )}
      <button
        onClick={handleClick}
        className="cursor-pointer select-none"
        title="マスコット"
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-lg transition-transform duration-200 hover:scale-110 ${isWaving ? "animate-bounce" : ""}`}
        >
          {/* body */}
          <rect x="16" y="20" width="32" height="28" rx="4" fill="#E0603A" />
          {/* head */}
          <rect x="18" y="8" width="28" height="20" rx="4" fill="#E0603A" />
          {/* eyes */}
          <rect x="23" y="14" width="6" height="6" rx="1" fill="white" />
          <rect x="35" y="14" width="6" height="6" rx="1" fill="white" />
          {/* eye pupils */}
          <rect x="25" y="16" width="3" height="3" rx="0.5" fill="#333" />
          <rect x="37" y="16" width="3" height="3" rx="0.5" fill="#333" />
          {/* mouth */}
          <rect x="26" y="23" width="12" height="3" rx="1.5" fill="white" />
          {/* legs */}
          <rect x="20" y="48" width="10" height="10" rx="2" fill="#C94E2A" />
          <rect x="34" y="48" width="10" height="10" rx="2" fill="#C94E2A" />
          {/* antenna */}
          <rect x="30" y="2" width="4" height="8" rx="2" fill="#C94E2A" />
          <circle cx="32" cy="2" r="3" fill="#FFB347" />
        </svg>
      </button>
    </div>
  );
}
