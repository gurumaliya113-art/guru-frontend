import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { colors } from "@/lib/colors";
import { canUseFeature, recordFeatureUse } from "@/lib/usageLimits";
import UpgradeModal from "@/components/UpgradeModal";
import { startSubscriptionCheckout } from "@/lib/razorpay";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface DppGeminiChatProps {
  subject: string;
  chapter: string;
}

export default function DppGeminiChat({ subject, chapter }: DppGeminiChatProps) {
  const { profile, updateProfile } = useApp();
  const subscribed = profile.subscription?.active === true;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Ask me anything about ${chapter}. I’ll solve it in real time with Gemini 2.5 Pro.`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    if (!subscribed && !canUseFeature("doubts", false)) {
      setUpgradeOpen(true);
      return;
    }

    recordFeatureUse("doubts");

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/dpp-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: input,
          subject,
          chapter,
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
          // ignore
        }
        throw new Error(`API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: data.response || "Sorry, I couldn't generate a response.",
          timestamp: Date.now(),
        },
      ]);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Sorry, I encountered an error. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: messageText,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[28px] border bg-white p-4 md:p-5" style={{ borderColor: colors.border }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-[16px] md:text-[18px] font-bold" style={{ color: colors.foreground }}>
            Ask Gemini
          </div>
          <div className="text-[12px]" style={{ color: colors.mutedForeground }}>
            Real-time help for {chapter}
          </div>
        </div>
        <div className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: "#eff6ff", color: colors.primary }}>
          Gemini 2.5 Pro
        </div>
      </div>

      <div className="max-h-[320px] overflow-y-auto pr-1 mb-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-5"
              style={{
                background: msg.role === "user" ? colors.primary : colors.secondary,
                color: msg.role === "user" ? "#fff" : colors.foreground,
                border: msg.role === "user" ? "none" : `1px solid ${colors.border}`,
              }}
            >
              {msg.content}
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

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder={`Ask about ${chapter}...`}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-2xl border text-[13px]"
          style={{ borderColor: colors.border, background: colors.secondary, color: colors.foreground }}
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

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} onUpgrade={handleUpgradeNow} loading={paying} />

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { opacity: 0.5; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
