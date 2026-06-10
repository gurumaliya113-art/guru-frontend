import { useState, useRef, useEffect } from "react";
import { Icon } from "@/components/ui";
import UpgradeModal from "@/components/UpgradeModal";
import { useApp } from "@/context/AppContext";
import { colors } from "@/lib/colors";
import { startSubscriptionCheckout } from "@/lib/razorpay";
import { canUseFeature, getRemaining, recordFeatureUse } from "@/lib/usageLimits";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function AIChat() {
  const { profile, updateProfile } = useApp();
  const subscribed = profile.subscription?.active === true;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm your AI study assistant. Ask me anything about NEET, JEE, or your subjects - like 'What is photosynthesis?' or 'Explain quantum mechanics'. How can I help?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
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

    const rawBase = (import.meta as any).env?.VITE_API_BASE_URL || "";
    const baseUrl = rawBase.trim().replace(/\/$/, "");
    const url = baseUrl ? `${baseUrl}/api/ai/chat` : "/api/ai/chat";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: input,
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

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response || "Sorry, I couldn't generate a response.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
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
      <div className="flex-1 overflow-y-auto mb-4 pr-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs px-4 py-2.5 rounded-2xl text-[13px] leading-5 ${
                msg.role === "user"
                  ? "text-white"
                  : "border"
              }`}
              style={{
                background: msg.role === "user" ? colors.primary : colors.secondary,
                borderColor: msg.role === "user" ? "none" : colors.border,
                color: msg.role === "user" ? "#fff" : colors.foreground,
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
      `}</style>
    </div>
  );
}
