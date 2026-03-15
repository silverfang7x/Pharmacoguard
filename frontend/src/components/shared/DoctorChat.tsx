import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MSG: Message = {
  role: "assistant",
  content: "Hello! I'm Dr. PharmAI 👋 I can help you understand your medications, explain side effects, or answer general health questions. What would you like to know?",
};

const CHIPS = [
  "💊 Explain my medications",
  "⚠️ Drug interactions",
  "🌸 Cycle & meds",
];

const SYSTEM_PROMPT = "You are Dr. PharmAI, a friendly and knowledgeable AI health assistant inside the PharmacoGuard app. You help patients understand their medications, explain drug interactions in simple terms, answer general health questions, and provide guidance on when to see a doctor. Always be warm, empathetic and clear. Never diagnose conditions. Always recommend consulting a real doctor for serious concerns. Keep responses concise — 2-4 sentences maximum unless the user asks for more detail.";

export default function DoctorChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const newMsgs = [...messages, { role: "user" as const, content: text.trim() }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...newMsgs,
          ],
        }),
      });

      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      const aiReply = data.choices?.[0]?.message?.content || "I couldn't generate a response.";
      setMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm having trouble connecting right now. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-32 right-4 z-50 w-[380px] h-[520px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden origin-bottom-right"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">
                  👨‍⚕️
                </div>
                <div>
                  <h3 className="text-white font-bold leading-tight">Dr. PharmAI</h3>
                  <p className="text-indigo-200 text-xs">AI Health Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-white text-xs font-medium">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50">
              {messages.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`px-4 py-2.5 max-w-[85%] text-[13px] leading-relaxed ${
                        isUser
                          ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm"
                          : "bg-white border border-gray-100 shadow-sm text-gray-800 rounded-2xl rounded-tl-sm whitespace-pre-wrap"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}

              {/* Suggestion Chips */}
              {messages.length === 1 && !loading && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleSend(chip)}
                      className="px-3 py-1.5 bg-white border border-indigo-100 text-indigo-700 text-xs rounded-full hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-100 p-3 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your health..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button - Half Body Doctor */}
      <div 
        className="fixed bottom-0 right-12 z-50 cursor-pointer w-28 flex flex-col items-center doctor-trigger doctor-idle group"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Speech bubble above the doctor */}
        <div className="bg-indigo-600 text-white rounded-2xl rounded-br-none px-3 py-1.5 text-xs font-semibold shadow-lg border-0 mb-1 whitespace-nowrap animate-bounce" style={{ animationDuration: '3s' }}>
          {!isOpen ? "Ask Dr. AI 🩺" : "How can I help? 🩺"}
        </div>

        {/* Doctor Container */}
        <div className="relative w-full overflow-hidden flex justify-center items-end">
          <span className="absolute top-[8px] right-[24px] z-10 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
          </span>
          <svg width="100" height="140" viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg"
            className={`doctor-svg transition-all duration-300 ${isOpen ? 'doctor-wave' : ''}`}
            style={{ filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.15))' }}>

            {/* ── BODY / WHITE COAT ── */}
            <path d="M15 75 Q10 80 8 130 L92 130 Q90 80 85 75 L68 65 L50 72 L32 65 Z" fill="#FFFFFF"/>

            {/* ── TEAL SCRUBS (V-neck showing under coat) ── */}
            <path d="M38 65 L50 72 L62 65 L58 130 L42 130 Z" fill="#4DB6AC"/>
            {/* V-neck triangle */}
            <path d="M42 65 L50 80 L58 65 L50 72 Z" fill="#26A69A"/>

            {/* ── LEFT COAT LAPEL ── */}
            <path d="M32 65 L15 75 L28 95 L42 75 Z" fill="#F5F5F5" stroke="#E0E0E0" strokeWidth="0.5"/>
            {/* ── RIGHT COAT LAPEL ── */}
            <path d="M68 65 L85 75 L72 95 L58 75 Z" fill="#F5F5F5" stroke="#E0E0E0" strokeWidth="0.5"/>

            {/* ── COAT BUTTONS ── */}
            <circle cx="50" cy="95" r="2" fill="#B0BEC5"/>
            <circle cx="50" cy="105" r="2" fill="#B0BEC5"/>
            <circle cx="50" cy="115" r="2" fill="#B0BEC5"/>

            {/* ── LEFT ARM (natural hang) ── */}
            <path d="M8 130 Q4 100 10 78 Q14 72 18 78 Q16 100 16 130 Z" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="0.5"/>
            {/* ── RIGHT ARM (natural hang) ── */}
            <path d="M92 130 Q96 100 90 78 Q86 72 82 78 Q84 100 84 130 Z" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="0.5" className="doctor-right-arm"/>

            {/* ── STETHOSCOPE ── */}
            <path d="M35 70 Q22 85 22 100 Q22 112 30 114 Q38 116 40 108 Q42 100 50 100 Q58 100 60 108 Q62 116 70 114 Q78 112 78 100 Q78 85 65 70" stroke="#37474F" strokeWidth="3" fill="none" strokeLinecap="round"/>
            {/* Stethoscope chest piece */}
            <circle cx="50" cy="100" r="5" fill="#37474F"/>
            <circle cx="50" cy="100" r="3" fill="#546E7A"/>
            {/* Ear tips */}
            <circle cx="35" cy="70" r="3.5" fill="#37474F"/>
            <circle cx="65" cy="70" r="3.5" fill="#37474F"/>

            {/* ── NECK ── */}
            <rect x="41" y="48" width="18" height="20" rx="7" fill="#FFCCAA"/>

            {/* ── HEAD ── */}
            <ellipse cx="50" cy="34" rx="22" ry="23" fill="#FFCCAA"/>

            {/* ── HAIR — long dark blue-black ── */}
            {/* Top and sides */}
            <path d="M28 28 Q28 6 50 6 Q72 6 72 28 Q70 14 50 14 Q30 14 28 28Z" fill="#1A237E"/>
            {/* Left long hair flowing down */}
            <path d="M28 28 Q20 35 18 50 Q16 65 20 80 Q24 90 26 75 Q24 60 26 45 Q28 35 30 30 Z" fill="#1A237E"/>
            {/* Right long hair flowing down */}
            <path d="M72 28 Q80 35 82 50 Q84 65 80 80 Q76 90 74 75 Q76 60 74 45 Q72 35 70 30 Z" fill="#1A237E"/>
            {/* Hair middle part highlight */}
            <path d="M50 6 Q48 12 50 14 Q52 12 50 6Z" fill="#283593"/>

            {/* ── FACE — no features (clean flat style) ── */}
            {/* Subtle blush circles only */}
            <circle cx="36" cy="38" r="5" fill="#FFAB91" opacity="0.4"/>
            <circle cx="64" cy="38" r="5" fill="#FFAB91" opacity="0.4"/>

            {/* ── ID BADGE ── */}
            <rect x="55" y="85" width="18" height="22" rx="3" fill="#E3F2FD" stroke="#90CAF9" strokeWidth="1"/>
            <rect x="58" y="89" width="12" height="2.5" rx="1" fill="#64B5F6"/>
            <rect x="58" y="93" width="9" height="2" rx="1" fill="#BBDEFB"/>
            <rect x="58" y="97" width="10" height="2" rx="1" fill="#BBDEFB"/>
            {/* Badge clip */}
            <rect x="62" y="83" width="6" height="4" rx="1" fill="#90CAF9"/>

          </svg>
        </div>
      </div>
    </>
  );
}
