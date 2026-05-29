/**
 * ChatPreview - miiiro チャットUI プロトタイプ
 * Design: スマホ最適化、凛とした温もり、余白と意志
 * カラー: Base #FFFFFF / Main #FAF2F4 / Accent1 #C66A5A / Accent2 #1A2E4A
 */

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Menu, Mic, MicOff, Square, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "ai" | "user";
  text: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "ai",
    text: "おはようございます。\n昨日話してたロードマップ、少し進みましたか？",
  },
];

const AI_RESPONSES: string[] = [
  "忙しかったんですね。\n今一番引っかかってるのは何ですか？",
  "なるほど。それって、時間の問題？\nそれとも方向性の問題？",
  "面白いですね。\nもう少し具体的に聞かせてもらえますか？",
  "そこ、大事なポイントかもしれないですね。\n逆に、やめたらどうなりますか？",
  "わかります。\n一歩だけ、今日できることは何ですか？",
];

export default function ChatPreview() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const responseIndexRef = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: text.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: AI_RESPONSES[responseIndexRef.current % AI_RESPONSES.length],
      };
      responseIndexRef.current += 1;
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleSubmit = () => {
    sendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate voice input result
      setTimeout(() => {
        sendMessage("まだ手をつけられてないです…");
      }, 300);
    } else {
      setIsRecording(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF2F4] flex items-center justify-center p-4">
      {/* Phone frame for desktop */}
      <div className="w-full max-w-[390px] h-[844px] max-h-[95vh] bg-white rounded-[2.5rem] shadow-2xl shadow-black/10 overflow-hidden flex flex-col relative">
        {/* Header */}
        <header className="h-11 flex items-center justify-between px-5 shrink-0">
          <h1
            className="text-base tracking-[1px] font-medium"
            style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", color: "#1A2E4A" }}
          >
            miiiro
          </h1>
          <button
            onClick={() => setMenuOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#FAF2F4] transition-colors"
          >
            <Menu className="w-[18px] h-[18px]" style={{ color: "#A19097" }} />
          </button>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[75%] px-4 py-3.5 whitespace-pre-wrap text-[15px] leading-[1.7]"
                  style={{
                    backgroundColor: msg.role === "ai" ? "#FAF2F4" : "#C66A5A",
                    color: msg.role === "ai" ? "#69565C" : "#FFFFFF",
                    borderRadius:
                      msg.role === "ai"
                        ? "4px 16px 16px 16px"
                        : "16px 4px 16px 16px",
                  }}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div
                className="px-4 py-3.5 flex items-center gap-1.5"
                style={{
                  backgroundColor: "#FAF2F4",
                  borderRadius: "4px 16px 16px 16px",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "#D2C3C8" }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          className="shrink-0 px-4 pb-6 pt-3"
          style={{ boxShadow: "0 -1px 4px rgba(0,0,0,0.02)" }}
        >
          {isRecording ? (
            /* Recording state */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-6"
            >
              <motion.div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#C66A5A" }}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Mic className="w-6 h-6 text-white" />
              </motion.div>
              <p className="text-[13px]" style={{ color: "#A19097" }}>
                聞いています…
              </p>
              <button
                onClick={toggleRecording}
                className="flex items-center gap-2 px-4 py-2 rounded-full border"
                style={{ borderColor: "#E9DCE0", color: "#69565C" }}
              >
                <Square className="w-3.5 h-3.5" />
                <span className="text-sm">停止</span>
              </button>
            </motion.div>
          ) : (
            /* Normal input state */
            <div className="flex items-end gap-2.5">
              <div
                className="flex-1 rounded-3xl border px-4 py-3 transition-colors"
                style={{ borderColor: "#E9DCE0" }}
              >
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  className="w-full resize-none bg-transparent text-[16px] leading-[1.5] outline-none placeholder:text-transparent"
                  style={{ color: "#69565C", maxHeight: "96px" }}
                />
              </div>

              {/* Voice button (primary) */}
              <AnimatePresence mode="wait">
                {!inputValue.trim() ? (
                  <motion.button
                    key="mic"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={toggleRecording}
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#C66A5A" }}
                  >
                    <Mic className="w-5 h-5 text-white" />
                  </motion.button>
                ) : (
                  <motion.button
                    key="send"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleSubmit}
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#1A2E4A" }}
                  >
                    <ArrowUp className="w-4 h-4 text-white" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Menu Overlay */}
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/20 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute top-0 right-0 bottom-0 w-[70%] bg-white z-50 flex flex-col"
              >
                <div className="flex items-center justify-end px-5 h-11">
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#FAF2F4] transition-colors"
                  >
                    <X className="w-[18px] h-[18px]" style={{ color: "#A19097" }} />
                  </button>
                </div>
                <nav className="flex-1 px-5 py-4 space-y-1">
                  {[
                    { label: "セッション履歴", disabled: true },
                    { label: "事業カルテ編集", disabled: false },
                    { label: "設定", disabled: true },
                  ].map((item) => (
                    <button
                      key={item.label}
                      disabled={item.disabled}
                      className={`w-full text-left px-3 py-3.5 rounded-lg text-[15px] border-b transition-colors ${
                        item.disabled
                          ? "text-[#D2C3C8] border-[#E9DCE0]"
                          : "text-[#69565C] border-[#E9DCE0] hover:bg-[#FAF2F4]"
                      }`}
                      onClick={() => {
                        if (item.disabled) {
                          // Could show toast
                        }
                        setMenuOpen(false);
                      }}
                    >
                      {item.label}
                      {item.disabled && (
                        <span className="ml-2 text-[11px] text-[#D2C3C8]">Coming Soon</span>
                      )}
                    </button>
                  ))}
                </nav>
                <div className="px-5 pb-8">
                  <p className="text-[12px]" style={{ color: "#D2C3C8" }}>
                    miiiro v0.1
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
