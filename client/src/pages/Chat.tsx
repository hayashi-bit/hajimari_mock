import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Send, Mic, MicOff, Sparkles, Plus, X, BookOpen, ChevronRight, ChevronLeft, Menu, MessageSquarePlus } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/ChatSidebar";
import { useIsMobile } from "@/hooks/useMobile";

type DisplayMessage = {
  role: "user" | "assistant";
  content: string;
};

type SessionSummary = {
  theme: string;
  insights: string[];
  keywords: string[];
  strengths: string[];
  uncertainties: string[];
  nextTheme: string;
  oneLineSummary: string;
};

// ─── Onboarding Guide Slides ───

const GUIDE_SLIDES = [
  {
    title: "miiiroへようこそ",
    body: "miiiroは、あなたの考えを「質問だけ」で引き出す壁打ちパートナーです。",
    sub: "アドバイスはしません。答えも出しません。\nあなたが自分の言葉で考えを整理できるように、ひとつずつ問いかけます。",
    accent: true,
  },
  {
    title: "ChatGPTとの違い",
    body: null,
    comparisons: [
      { label: "ChatGPT", desc: "答えを出してくれる。便利だけど、自分で考えた感覚が薄い。" },
      { label: "miiiro", desc: "あなたの中の答えを引き出す。話し終わったあと「自分で考えた」感覚が残る。", highlight: true },
    ],
    sub: "だから、行動に移せる。",
  },
  {
    title: "使い方",
    steps: [
      { num: "1", text: "miiiroが質問する → あなたが答える" },
      { num: "2", text: "途中で「ここまでの整理」を確認できる" },
      { num: "3", text: "「今日のまとめ」ボタンで振り返りを保存" },
    ],
    sub: null,
  },
  {
    title: "ご注意",
    cautions: [
      "同じスマホ・同じブラウザで開いてください（履歴が引き継がれます）",
      "シークレットモード（プライベートブラウズ）では履歴が消えます",
      "端末を変えると別の人として扱われます",
    ],
    sub: "まずは気軽に、思っていることを話してみてください。",
  },
];

function GuideSlides({ onComplete }: { onComplete: () => void }) {
  const [current, setCurrent] = useState(0);
  const slide = GUIDE_SLIDES[current];
  const isLast = current === GUIDE_SLIDES.length - 1;

  return (
    <div
      className="h-dvh flex flex-col items-center justify-center px-6"
      style={{ background: "#FFFFFF" }}
    >
      <div className="max-w-sm w-full space-y-6">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {GUIDE_SLIDES.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 20 : 6,
                height: 6,
                background: i === current ? "#C66A5A" : "#E9DCE0",
              }}
            />
          ))}
        </div>

        {/* Slide content */}
        <div className="min-h-[320px] flex flex-col justify-center">
          <h2
            className="text-xl font-medium mb-4"
            style={{ color: "#1A2E4A", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}
          >
            {slide.title}
          </h2>

          {slide.body && (
            <p className="text-sm leading-relaxed mb-3" style={{ color: "#2D2520" }}>
              {slide.body}
            </p>
          )}

          {slide.sub && (
            <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: "#A19097" }}>
              {slide.sub}
            </p>
          )}

          {/* Comparisons (slide 2) */}
          {slide.comparisons && (
            <div className="space-y-3 mb-3">
              {slide.comparisons.map((c, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{
                    background: c.highlight ? "#FAF2F4" : "#F8F8F8",
                    border: c.highlight ? "1px solid #E9DCE0" : "1px solid #EEEEEE",
                  }}
                >
                  <p
                    className="text-xs font-medium mb-1"
                    style={{ color: c.highlight ? "#C66A5A" : "#A19097" }}
                  >
                    {c.label}
                  </p>
                  <p className="text-sm" style={{ color: "#2D2520" }}>
                    {c.desc}
                  </p>
                </div>
              ))}
              {slide.sub && (
                <p className="text-xs text-center" style={{ color: "#C66A5A" }}>
                  {slide.sub}
                </p>
              )}
            </div>
          )}

          {/* Steps (slide 3) */}
          {slide.steps && (
            <div className="space-y-3 mb-3">
              {slide.steps.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                    style={{ background: "#FAF2F4", color: "#C66A5A" }}
                  >
                    {s.num}
                  </span>
                  <p className="text-sm pt-1" style={{ color: "#2D2520" }}>
                    {s.text}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Cautions (slide 4) */}
          {slide.cautions && (
            <div
              className="rounded-xl p-4 space-y-2 mb-3"
              style={{ background: "#FFF9F0", border: "1px solid #F0E4D4" }}
            >
              {slide.cautions.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs mt-0.5" style={{ color: "#D4A574" }}>●</span>
                  <p className="text-xs leading-relaxed" style={{ color: "#69565C" }}>
                    {c}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrent(prev => Math.max(0, prev - 1))}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs transition-opacity"
            style={{
              color: "#A19097",
              opacity: current === 0 ? 0 : 1,
              pointerEvents: current === 0 ? "none" : "auto",
            }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            戻る
          </button>

          {isLast ? (
            <button
              onClick={onComplete}
              className="px-6 py-3 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "#C66A5A" }}
            >
              壁打ちを始める
            </button>
          ) : (
            <button
              onClick={() => setCurrent(prev => Math.min(GUIDE_SLIDES.length - 1, prev + 1))}
              className="flex items-center gap-1 px-4 py-2.5 rounded-full text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: "#C66A5A", color: "#FFFFFF" }}
            >
              次へ
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={onComplete}
            className="w-full text-center text-xs py-2"
            style={{ color: "#D2C3C8" }}
          >
            スキップして始める
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Summary Modal ───

function SummaryModal({
  summary,
  onClose,
}: {
  summary: SessionSummary;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md max-h-[80vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-6 space-y-5"
        style={{ background: "#FFFFFF" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1"
          style={{ color: "#A19097" }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div>
          <p className="text-xs font-medium" style={{ color: "#C66A5A" }}>
            今日のまとめ
          </p>
          <h3 className="text-lg font-medium mt-1" style={{ color: "#1A2E4A" }}>
            {summary.theme}
          </h3>
        </div>

        {/* Insights */}
        {summary.insights.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "#69565C" }}>
              見えてきたこと
            </p>
            <div className="space-y-1.5">
              {summary.insights.map((item, i) => (
                <p key={i} className="text-sm" style={{ color: "#2D2520" }}>
                  {item}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Keywords */}
        {summary.keywords.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "#69565C" }}>
              大事な言葉
            </p>
            <div className="flex flex-wrap gap-2">
              {summary.keywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-xs"
                  style={{ background: "#FAF2F4", color: "#C66A5A" }}
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Strengths — only show if actually present */}
        {summary.strengths && summary.strengths.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "#69565C" }}>
              見えてきた強み
            </p>
            <div className="space-y-1.5">
              {summary.strengths.map((item, i) => (
                <p key={i} className="text-sm" style={{ color: "#2D2520" }}>
                  {item}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Uncertainties — only show if actually present */}
        {summary.uncertainties && summary.uncertainties.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "#69565C" }}>
              まだ迷っていること
            </p>
            <div className="space-y-1.5">
              {summary.uncertainties.map((item, i) => (
                <p key={i} className="text-sm" style={{ color: "#A19097" }}>
                  {item}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Next */}
        <div
          className="rounded-xl p-4 space-y-2"
          style={{ background: "#FAF2F4" }}
        >
          <p className="text-xs font-medium" style={{ color: "#C66A5A" }}>
            次に考えるとよいこと
          </p>
          <p className="text-sm" style={{ color: "#2D2520" }}>
            {summary.nextTheme}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Chat Component ───

export default function Chat() {
  return (
    <SidebarProvider defaultOpen={true}>
      <ChatContent />
    </SidebarProvider>
  );
}

function ChatContent() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const resumeSessionId = (() => {
    const params = new URLSearchParams(searchString);
    const s = params.get("session");
    return s ? parseInt(s, 10) : null;
  })();
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<SessionSummary | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackType, setFeedbackType] = useState<"feedback" | "idea" | "bug" | "request">("feedback");
  const [feedbackName, setFeedbackName] = useState("");
  const [userMsgCount, setUserMsgCount] = useState(0);
  const [previousMemory, setPreviousMemory] = useState<{
    keywords?: string | null;
    strengths?: string | null;
    nextTheme?: string | null;
  } | null>(null);

  // Sidebar hooks (must be before any conditional returns)
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

  // Hidden admin access — tap counter on logo
  const [logoTapCount, setLogoTapCount] = useState(0);
  const logoTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoTap = () => {
    setLogoTapCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        navigate("/");
        return 0;
      }
      return next;
    });
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current);
    logoTapTimer.current = setTimeout(() => setLogoTapCount(0), 2000);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mobile keyboard: just scroll to bottom when input is focused
  // No visualViewport manipulation (causes layout jank)

  // ─── Check if guide has been seen ───
  const hasSeenGuide = () => {
    try {
      return localStorage.getItem("miiiro_guide_seen") === "true";
    } catch {
      return false;
    }
  };

  const markGuideSeen = () => {
    try {
      localStorage.setItem("miiiro_guide_seen", "true");
    } catch {}
  };

  // ─── Resume session query (when coming from history) ───
  const resumeQuery = trpc.chat.resumeSession.useQuery(
    { sessionId: resumeSessionId! },
    { enabled: resumeSessionId !== null }
  );

  // ─── tRPC queries/mutations ───
  const sessionQuery = trpc.chat.getOrCreateSession.useQuery(undefined, {
    enabled: resumeSessionId === null,
  });

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setDisplayMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.aiMessage },
      ]);
      if (data.onboardingComplete) {
        setIsOnboarding(false);
      }
    },
    onError: () => {
      toast.error("メッセージの送信に失敗しました。もう一度お試しください。");
    },
  });

  const greetingMutation = trpc.chat.getGreeting.useMutation({
    onSuccess: (data) => {
      if (!data.alreadyGreeted && data.greeting) {
        setDisplayMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.greeting! },
        ]);
      }
    },
  });

  const summaryMutation = trpc.chat.generateSummary.useMutation({
    onSuccess: (data) => {
      if (data.success && data.summary) {
        setSummaryData(data.summary as SessionSummary);
        setShowSummary(true);
      } else if (!data.success) {
        toast.info(data.reason || "まとめを生成できませんでした");
      }
    },
    onError: () => {
      toast.error("まとめの生成中にエラーが発生しました");
    },
  });

  const feedbackMutation = trpc.feedback.create.useMutation({
    onSuccess: () => {
      toast.success("フィードバックを送りました！ありがとう", {
        action: {
          label: "みんなの声を見る",
          onClick: () => { window.location.href = "/voices"; },
        },
      });
      setShowFeedback(false);
      setFeedbackContent("");
      setFeedbackType("feedback");
    },
    onError: () => {
      toast.error("送信に失敗しました。もう一度お試しください");
    },
  });

  const handleSubmitFeedback = () => {
    if (!feedbackContent.trim()) return;
    const deviceId = localStorage.getItem("miiiro-device-id") || "unknown";
    feedbackMutation.mutate({
      deviceId,
      displayName: feedbackName.trim() || undefined,
      sessionId: sessionId || undefined,
      type: feedbackType,
      content: feedbackContent.trim(),
    });
  };

  const newSessionMutation = trpc.chat.startNewSession.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setDisplayMessages([]);
      setUserMsgCount(0);
      setSummaryData(null);
      setPreviousMemory(null);
      greetingMutation.mutate({
        sessionId: data.sessionId,
        isOnboarding: false,
      });
    },
  });

  // ─── Handle resume error ───
  useEffect(() => {
    if (resumeSessionId !== null && resumeQuery.isError) {
      toast.error("セッションの読み込みに失敗しました");
      navigate("/history");
    }
  }, [resumeQuery.isError, resumeSessionId, navigate]);

  // ─── Demo mode fallback (no backend) ───
  useEffect(() => {
    if (
      (resumeSessionId === null && (sessionQuery.isError || sessionQuery.fetchStatus === "idle")) ||
      (resumeSessionId !== null && (resumeQuery.isError || resumeQuery.fetchStatus === "idle"))
    ) {
      setSessionId(-1);
      setIsOnboarding(false);
      setDisplayMessages([{ role: "assistant", content: "こんにちは。今日はどんなことを話しましょうか？" }]);
      setInitialLoading(false);
    }
  }, [sessionQuery.isError, sessionQuery.fetchStatus, resumeQuery.isError, resumeQuery.fetchStatus, resumeSessionId]);

  // ─── Demo mode timeout fallback ───
  useEffect(() => {
    const timer = setTimeout(() => {
      if (initialLoading) {
        setSessionId(-1);
        setIsOnboarding(false);
        setDisplayMessages([{ role: "assistant", content: "こんにちは。今日はどんなことを話しましょうか？" }]);
        setInitialLoading(false);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [initialLoading]);

  // ─── Initialize session (from resume or normal) ───
  useEffect(() => {
    if (resumeSessionId !== null && resumeQuery.data) {
      const { session, messages: msgs } = resumeQuery.data;
      setSessionId(session.id);
      setIsOnboarding(false);
      const displayMsgs: DisplayMessage[] = msgs
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
      setDisplayMessages(displayMsgs);
      setUserMsgCount(displayMsgs.filter(m => m.role === "user").length);
      setInitialLoading(false);
    } else if (resumeSessionId === null && sessionQuery.data) {
      const { session, messages, isOnboarding: onboarding } = sessionQuery.data;
      setSessionId(session.id);
      setIsOnboarding(onboarding);

      const msgs: DisplayMessage[] = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      setDisplayMessages(msgs);
      setUserMsgCount(msgs.filter(m => m.role === "user").length);

      // Store previous memory for display
      if ('previousMemory' in sessionQuery.data && sessionQuery.data.previousMemory) {
        setPreviousMemory(sessionQuery.data.previousMemory as any);
      }

      // First time user — show guide slides
      if (msgs.length === 0 && onboarding && !hasSeenGuide()) {
        setShowGuide(true);
        setInitialLoading(false);
        return;
      }

      // If no messages yet and not onboarding, generate greeting
      if (msgs.length === 0 && !onboarding) {
        greetingMutation.mutate({
          sessionId: session.id,
          isOnboarding: false,
        });
      } else if (msgs.length === 0 && onboarding) {
        // Returning onboarding user who has seen guide
        greetingMutation.mutate({
          sessionId: session.id,
          isOnboarding: true,
        });
      }

      setInitialLoading(false);
    }
  }, [sessionQuery.data, resumeQuery.data, resumeSessionId]);

  // ─── Auto scroll ───
  const scrollToBottom = useCallback(() => {
    if (!isUserScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isUserScrolledUp]);

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, scrollToBottom]);

  // ─── Scroll detection ───
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const threshold = 100;
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold;
    setIsUserScrolledUp(!isAtBottom);
  }, []);

  // ─── Send message ───
  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !sessionId || sendMessageMutation.isPending) return;

    setDisplayMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed },
    ]);
    setInput("");
    setUserMsgCount(prev => prev + 1);

    // Demo mode: call /api/chat serverless function
    if (sessionId === -1) {
      const currentMessages = [...displayMessages, { role: "user" as const, content: trimmed }];
      const apiMessages = currentMessages.map((m) => ({ role: m.role, content: m.content }));
      if (inputRef.current) inputRef.current.style.height = "auto";
      fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      })
        .then((r) => r.json())
        .then((data: { message?: string; error?: string }) => {
          if (data.message) {
            setDisplayMessages((prev) => [
              ...prev,
              { role: "assistant", content: data.message! },
            ]);
          }
        })
        .catch(() => {
          toast.error("AI応答の取得に失敗しました");
        });
      return;
    }

    sendMessageMutation.mutate({
      sessionId,
      content: trimmed,
      isOnboarding,
    });

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  }, [input, sessionId, isOnboarding, sendMessageMutation]);

  // ─── Voice input ───
  const toggleVoice = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  // ─── Keyboard handling ───
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Auto-resize textarea ───
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  // ─── Generate Summary ───
  const handleGenerateSummary = () => {
    if (!sessionId || summaryMutation.isPending) return;
    summaryMutation.mutate({ sessionId });
  };

  // ─── Start New Session ───
  const handleNewSession = () => {
    if (newSessionMutation.isPending) return;
    newSessionMutation.mutate();
  };

  // ─── Resume session from sidebar ───
  const handleResumeSession = (id: number) => {
    window.location.href = `/chat?session=${id}`;
  };

  // ─── Guide complete ───
  const handleGuideComplete = () => {
    markGuideSeen();
    setShowGuide(false);
    if (sessionId) {
      greetingMutation.mutate({
        sessionId,
        isOnboarding,
      });
    }
  };

  // ─── Speech Recognition support check ───
  const hasSpeechRecognition =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  // Can show summary button
  const canShowSummary = userMsgCount >= 5 && !isOnboarding;

  // Show starter chips: not onboarding + user hasn't sent anything yet + not mid-send
  const showStarterChips = !isOnboarding && userMsgCount === 0 && !sendMessageMutation.isPending;

  const STARTER_CHIPS = [
    "なんかモヤモヤする",
    "動きたいけど動けない",
    "迷ってる",
  ];

  const handleChipTap = (chip: string) => {
    if (!sessionId || sendMessageMutation.isPending) return;
    setDisplayMessages((prev) => [
      ...prev,
      { role: "user", content: chip },
    ]);
    setUserMsgCount(prev => prev + 1);
    sendMessageMutation.mutate({
      sessionId,
      content: chip,
      isOnboarding: false,
    });
  };

  // ─── Loading state ───
  if (initialLoading) {
    return (
      <div className="h-dvh flex items-center justify-center" style={{ background: "#FFFFFF" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#C66A5A" }} />
          <p className="text-sm" style={{ color: "#A19097" }}>
            準備中...
          </p>
        </div>
      </div>
    );
  }

  // Show guide slides for first-time users
  if (showGuide) {
    return <GuideSlides onComplete={handleGuideComplete} />;
  }

  return (
    <>
      <ChatSidebar
        onNewSession={handleNewSession}
        onResumeSession={handleResumeSession}
        currentSessionId={sessionId}
      />
      <SidebarInset className="h-dvh relative">
        <div
          ref={containerRef}
          className="h-full flex flex-col overflow-hidden relative"
          style={{ background: "#FFFFFF" }}
        >
          {/* Header */}
          <header
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: "1px solid #E9DCE0" }}
          >
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-gray-50 active:bg-gray-100"
                style={{ color: "#69565C" }}
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            {!isMobile && <div />}

        {/* Logo — 5 taps to access dashboard */}
        <button
          onClick={handleLogoTap}
          className="text-center select-none"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <h1
            className="text-base font-light tracking-wide"
            style={{ color: "#1A2E4A", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}
          >
            miiiro
          </h1>
          {isOnboarding && (
            <p className="text-[10px]" style={{ color: "#A19097" }}>
              あなたのことを教えてください
            </p>
          )}
        </button>

        {/* New session button */}
        {!isOnboarding ? (
          <button
            onClick={handleNewSession}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-gray-50 active:bg-gray-100"
            style={{ color: "#69565C" }}
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs">新規</span>
          </button>
        ) : (
          <div className="w-14" />
        )}
      </header>

      {/* Onboarding hint */}
      {isOnboarding && displayMessages.length === 0 && (
        <div className="px-4 pt-4">
          <div
            className="rounded-xl p-3 text-center"
            style={{ background: "#FAF2F4" }}
          >
            <p className="text-xs" style={{ color: "#69565C" }}>
              3つだけ質問します。あなたのことを覚えた上で壁打ちします。
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="max-w-lg mx-auto space-y-5">
          {/* Previous memory banner */}
          {previousMemory && previousMemory.nextTheme && displayMessages.length <= 1 && (
            <div
              className="rounded-xl p-3 space-y-1.5"
              style={{ background: "#FAF2F4", border: "1px solid #E9DCE0" }}
            >
              <p className="text-[10px] font-medium" style={{ color: "#C66A5A" }}>
                前回の壁打ちから
              </p>
              {previousMemory.nextTheme && (
                <p className="text-xs" style={{ color: "#2D2520" }}>
                  次に考えるとよいこと: {previousMemory.nextTheme}
                </p>
              )}
              {previousMemory.keywords && (() => {
                try {
                  const kws = JSON.parse(previousMemory.keywords);
                  if (Array.isArray(kws) && kws.length > 0) {
                    return (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {kws.slice(0, 4).map((kw: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full text-[10px]"
                            style={{ background: "#FFFFFF", color: "#C66A5A", border: "1px solid #E9DCE0" }}
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    );
                  }
                } catch {}
                return null;
              })()}
            </div>
          )}
          {displayMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user" ? "rounded-br-md" : "rounded-bl-md"
                }`}
                style={
                  msg.role === "user"
                    ? {
                        background: "#C66A5A",
                        color: "#FFFFFF",
                      }
                    : {
                        background: "#FAF2F4",
                        color: "#2D2520",
                      }
                }
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {sendMessageMutation.isPending && (
            <div className="flex justify-start">
              <div
                className="rounded-2xl rounded-bl-md px-4 py-3"
                style={{ background: "#FAF2F4" }}
              >
                <div className="flex gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: "#D2C3C8", animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: "#D2C3C8", animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: "#D2C3C8", animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Summary button */}
      {canShowSummary && (
        <div className="px-4 pb-2">
          <button
            onClick={handleGenerateSummary}
            disabled={summaryMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: "#FAF2F4", color: "#C66A5A", border: "1px solid #E9DCE0" }}
          >
            {summaryMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                まとめを作成中...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                今日のまとめを見る
              </>
            )}
          </button>
        </div>
      )}

      {/* Starter Chips */}
      {showStarterChips && (
        <div className="px-4 pb-2">
          <div className="max-w-lg mx-auto flex flex-wrap gap-2 justify-center">
            {STARTER_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChipTap(chip)}
                className="px-4 py-2 rounded-full text-sm transition-all hover:opacity-80 active:scale-95"
                style={{
                  background: "#FFFFFF",
                  color: "#69565C",
                  border: "1px solid #E9DCE0",
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div
        className="shrink-0 px-4 py-3"
        style={{
          borderTop: "1px solid #E9DCE0",
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="max-w-lg mx-auto flex items-end gap-2">
          {/* Voice button */}
          {hasSpeechRecognition && (
            <button
              onClick={toggleVoice}
              className="shrink-0 flex items-center justify-center rounded-full transition-all"
              style={{
                width: 48,
                height: 48,
                background: isListening ? "#C66A5A" : "#FAF2F4",
                color: isListening ? "#FFFFFF" : "#69565C",
              }}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Text input */}
          <div
            className="flex-1 flex items-end rounded-2xl overflow-hidden"
            style={{ background: "#FAF2F4", border: "1px solid #E9DCE0" }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isOnboarding ? "答えてみてください..." : "今思ってること、なんでも"}
              rows={1}
              className="flex-1 bg-transparent px-4 py-3 text-sm resize-none outline-none placeholder:text-[#D2C3C8]"
              style={{
                color: "#2D2520",
                minHeight: 44,
                maxHeight: 120,
                fontSize: 16,
                lineHeight: "1.5",
              }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMessageMutation.isPending}
            className="shrink-0 flex items-center justify-center rounded-full transition-all disabled:opacity-30"
            style={{
              width: 36,
              height: 36,
              background: "#1A2E4A",
              color: "#FFFFFF",
            }}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Feedback button - always visible */}
      {!showFeedback && (
        <button
          onClick={() => setShowFeedback(true)}
          className="absolute bottom-20 right-4 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs shadow-md transition-all hover:shadow-lg active:scale-95 z-10"
          style={{ background: "#FFFFFF", color: "#69565C", border: "1px solid #E9DCE0" }}
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          感想・要望
        </button>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setShowFeedback(false)}>
          <div
            className="w-full max-w-lg rounded-t-2xl p-5 space-y-4 animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto"
            style={{ background: "#FFFFFF", paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium" style={{ color: "#1A2E4A" }}>感想・要望を送る</h3>
              <button onClick={() => setShowFeedback(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" style={{ color: "#69565C" }} />
              </button>
            </div>

            {/* Type selector */}
            <div className="flex gap-2 flex-wrap">
              {(["feedback", "idea", "bug", "request"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFeedbackType(t)}
                  className="px-3 py-1.5 rounded-full text-xs transition-all"
                  style={{
                    background: feedbackType === t ? "#C66A5A" : "#FAF2F4",
                    color: feedbackType === t ? "#FFFFFF" : "#69565C",
                    border: `1px solid ${feedbackType === t ? "#C66A5A" : "#E9DCE0"}`,
                  }}
                >
                  {t === "feedback" ? "感想" : t === "idea" ? "アイデア" : t === "bug" ? "不具合" : "要望"}
                </button>
              ))}
            </div>

            {/* Content */}
            <textarea
              value={feedbackContent}
              onChange={(e) => setFeedbackContent(e.target.value)}
              placeholder="思ったこと、なんでも書いてください"
              rows={4}
              className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
              style={{ background: "#FAF2F4", border: "1px solid #E9DCE0", color: "#2D2520", fontSize: 16 }}
            />

            {/* Name (optional) */}
            <input
              type="text"
              value={feedbackName}
              onChange={(e) => setFeedbackName(e.target.value)}
              placeholder="名前（任意・空なら匿名）"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: "#FAF2F4", border: "1px solid #E9DCE0", color: "#2D2520", fontSize: 16 }}
            />

            {/* Submit */}
            <button
              onClick={handleSubmitFeedback}
              disabled={!feedbackContent.trim() || feedbackMutation.isPending}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
              style={{ background: "#1A2E4A", color: "#FFFFFF" }}
            >
              {feedbackMutation.isPending ? "送信中..." : "送信する"}
            </button>

            {/* Link to voices */}
            <button
              onClick={() => { setShowFeedback(false); window.location.href = "/voices"; }}
              className="w-full text-center text-xs py-2 rounded-lg transition-colors hover:bg-gray-50"
              style={{ color: "#C66A5A" }}
            >
              みんなの声を見る →
            </button>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummary && summaryData && (
        <SummaryModal
          summary={summaryData}
          onClose={() => setShowSummary(false)}
        />
      )}
        </div>
      </SidebarInset>
    </>
  );
}

