import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Icon } from "@/components/ui";
import UpgradeModal from "@/components/UpgradeModal";
import { useApp } from "@/context/AppContext";
import { colors } from "@/lib/colors";
import { startSubscriptionCheckout } from "@/lib/razorpay";
import { canUseFeature, getRemaining, recordFeatureUse } from "@/lib/usageLimits";

interface ChatImage {
  title: string;
  url: string;
  description?: string;
  source?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  images?: ChatImage[];
  topic?: string; // the user question this answer responded to (for follow-up chips)
}

// Colorful, classroom-style markdown renderer for the tutor's answers.
function TutorMarkdown({ content }: { content: string }) {
  return (
    <div className="tutor-md text-[13.5px] leading-6" style={{ color: colors.foreground }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="text-base font-bold mt-3 mb-1.5" style={{ color: colors.primary }}>{children}</h2>
          ),
          h2: ({ children }) => (
            <h3 className="text-[15px] font-bold mt-3 mb-1.5 flex items-center gap-1.5" style={{ color: colors.primary }}>{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-[14px] font-semibold mt-2.5 mb-1" style={{ color: colors.neet || colors.primary }}>{children}</h4>
          ),
          p: ({ children }) => <p className="mb-2">{children}</p>,
          strong: ({ children }) => (
            <strong style={{ color: colors.primary, fontWeight: 700 }}>{children}</strong>
          ),
          ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="marker:text-current" style={{ color: colors.foreground }}>{children}</li>,
          code: ({ children }) => (
            <code
              className="px-1.5 py-0.5 rounded text-[12.5px] font-mono"
              style={{ background: colors.primary + "18", color: colors.primary }}
            >
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className="border-l-4 pl-3 my-2 italic"
              style={{ borderColor: colors.primary, color: colors.mutedForeground }}
            >
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="w-full text-[12.5px] border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th
              className="border px-2 py-1 text-left font-semibold"
              style={{ borderColor: colors.border, background: colors.primary + "12", color: colors.primary }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border px-2 py-1" style={{ borderColor: colors.border }}>{children}</td>
          ),
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" style={{ color: colors.primary, textDecoration: "underline" }}>
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function AIChat() {
  const { profile, updateProfile } = useApp();
  const subscribed = profile.subscription?.active === true;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! 👋 I'm **Guru**, your AI study buddy. Ask me anything about NEET, JEE or your subjects — like *'What is photosynthesis?'* or *'Explain quantum mechanics'*. I'll explain it deeply, step by step, with diagrams. Let's learn! 🚀",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  // Text currently being "written" line-by-line (handwriting effect).
  const [typing, setTyping] = useState<{ id: string; full: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Gently keep the latest text in view — only nudge down when fresh content
  // has actually gone below the fold, so it reads like a pen moving down the
  // page instead of snapping straight to the bottom.
  const followToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom > 2) {
      el.scrollTop = el.scrollHeight;
    }
  };

  // Typewriter: reveal the assistant answer a few words at a time and keep the
  // view scrolling along with the text so it reads like live handwriting.
  useEffect(() => {
    if (!typing) return;
    const words = typing.full.split(/(\s+)/); // keep whitespace tokens
    let i = 0;
    const STEP = 2; // words revealed per tick

    const tick = () => {
      i += STEP;
      const shown = words.slice(0, i).join("");
      setMessages((prev) =>
        prev.map((m) => (m.id === typing.id ? { ...m, content: shown } : m)),
      );
      requestAnimationFrame(followToBottom);
      if (i >= words.length) {
        clearInterval(timer);
        setTyping(null);
      }
    };

    const timer = setInterval(tick, 28);
    return () => clearInterval(timer);
  }, [typing]);

  const handleUpgradeNow = () => {
    setPaying(true);
    startSubscriptionCheckout(
      { name: profile.name, phone: profile.phone },
      async (sub) => {
        await updateProfile({ subscription: sub });
        setPaying(false);
        setUpgradeOpen(false);
        alert("Subscription activated! Enjoy unlimited access 🎉");
      },
      (err) => {
        setPaying(false);
        alert(`Payment failed: ${err.message}`);
      },
    );
  };

  // Short follow-up suggestions shown under an answer — one tap to ask, no typing.
  const followUps = (topic: string) => [
    { label: "🔁 Related questions", prompt: `Give me a few important exam questions related to ${topic}.` },
    { label: "📐 Formulas used", prompt: `List the key formulas used in ${topic} with their meaning.` },
    { label: "🌍 Real-life example", prompt: `Explain a simple real-life example of ${topic}.` },
  ];

  // Fetch free educational diagrams from Wikipedia for the asked topic.
  const fetchImages = async (topic: string): Promise<ChatImage[]> => {
    try {
      const resp = await fetch("/api/ai/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query: topic }),
      });
      if (!resp.ok) return [];
      const data = await resp.json();
      return Array.isArray(data.images) ? data.images.slice(0, 3) : [];
    } catch {
      return [];
    }
  };

  const handleSendMessage = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text) return;
    if (!subscribed && !canUseFeature("doubts", false)) {
      setUpgradeOpen(true);
      return;
    }

    recordFeatureUse("doubts");

    const topic = text;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: topic,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const url = "/api/ai/chat";

    try {
      // Kick off the image search in parallel with the AI answer.
      const imagesPromise = fetchImages(topic);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: topic,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        let errorText = response.statusText;
        try {
          const errData = await response.json();
          if (errData?.error) errorText = errData.error;
        } catch {
          // ignore parse error
        }
        throw new Error(`API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const images = await imagesPromise;

      const fullText = data.response || "Sorry, I couldn't generate a response.";
      const assistantId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "", // filled progressively by the typewriter effect
        timestamp: Date.now(),
        images,
        topic,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setTyping({ id: assistantId, full: fullText });
    } catch (error) {
      console.error("Chat error:", error);
      const messageText = error instanceof Error ? error.message : "Sorry, I encountered an error. Please try again.";
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: messageText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: "calc(100vh - 300px)" }}>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto mb-4 pr-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`px-4 py-3 rounded-2xl ${
                msg.role === "user" ? "max-w-xs text-[13px] leading-5 text-white" : "max-w-[85%] border shadow-sm"
              }`}
              style={{
                background:
                  msg.role === "user"
                    ? colors.primary
                    : `linear-gradient(135deg, ${colors.card} 0%, ${colors.secondary} 100%)`,
                borderColor: msg.role === "user" ? "none" : colors.border,
                color: msg.role === "user" ? "#fff" : colors.foreground,
              }}
            >
              {msg.role === "user" ? (
                msg.content
              ) : (
                <>
                  <TutorMarkdown content={msg.content} />
                  {typing?.id === msg.id && (
                    <span
                      className="inline-block w-[2px] h-4 align-middle ml-0.5"
                      style={{ background: colors.primary, animation: "blink 1s step-start infinite" }}
                    />
                  )}
                  {typing?.id !== msg.id && msg.images && msg.images.length > 0 && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.border }}>
                      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1" style={{ color: colors.mutedForeground }}>
                        🖼️ Related diagrams
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {msg.images.map((img, i) => (
                          <a
                            key={i}
                            href={img.source || img.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-lg overflow-hidden border hover:opacity-90 transition"
                            style={{ borderColor: colors.border, background: "#fff" }}
                            title={img.title}
                          >
                            <img src={img.url} alt={img.title} className="w-full h-24 object-contain bg-white" loading="lazy" />
                            <div className="px-1.5 py-1 text-[10px] truncate" style={{ color: colors.mutedForeground }}>
                              {img.title}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {typing?.id !== msg.id && msg.topic && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {followUps(msg.topic).map((f, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(f.prompt)}
                          disabled={loading || typing != null}
                          className="px-2.5 py-1 rounded-full text-[11px] border transition hover:opacity-80 disabled:opacity-40"
                          style={{
                            borderColor: colors.primary + "55",
                            background: colors.primary + "12",
                            color: colors.primary,
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="mb-3 flex justify-start">
            <div className="px-4 py-2.5 rounded-2xl border" style={{ borderColor: colors.border }}>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: colors.mutedForeground, animation: "bounce 1.4s infinite" }} />
                <div className="w-2 h-2 rounded-full" style={{ background: colors.mutedForeground, animation: "bounce 1.4s infinite 0.2s" }} />
                <div className="w-2 h-2 rounded-full" style={{ background: colors.mutedForeground, animation: "bounce 1.4s infinite 0.4s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Ask anything... (e.g., photosynthesis)"
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-2xl border text-[13px]"
          style={{
            borderColor: colors.border,
            background: colors.secondary,
            color: colors.foreground,
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-2xl flex items-center justify-center disabled:opacity-50"
          style={{ background: colors.primary }}
        >
          <Icon name="send" size={16} color="#fff" />
        </button>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onUpgrade={handleUpgradeNow}
        loading={paying}
      />

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            opacity: 0.5;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        .tutor-md > *:first-child { margin-top: 0; }
        .tutor-md > *:last-child { margin-bottom: 0; }
      `}</style>
    </div>
  );
}
