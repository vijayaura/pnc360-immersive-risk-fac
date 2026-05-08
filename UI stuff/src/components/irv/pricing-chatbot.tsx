import { useState, useRef, useEffect } from "react";
import type { Property } from "@/data/mock-properties";
import { X, Send, Bot, User, Zap, Loader2 } from "lucide-react";
import { chatWithPricingAI } from "@/server/pricing.functions";
import { ModelSelector, type AIModelId } from "./model-selector";

interface PricingChatbotProps {
  property: Property;
  onApplyLoading: (factor: string, value: number, explanation: string) => void;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestion?: { factor: string; value: number; explanation: string };
}

export function PricingChatbot({ property, onApplyLoading, onClose }: PricingChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `👋 I'm your AI pricing assistant for **${property.name}**.\n\nI can explain any loading, suggest new risk factors, or help you adjust the premium. All suggestions come with data-backed rationale.\n\nWhat would you like to discuss?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModelId>("google/gemini-3-flash-preview");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = [...messages.filter(m => m.id !== "welcome"), userMsg].map(m => ({ role: m.role, content: m.content }));
      const result = await chatWithPricingAI({
        data: {
          messages: apiMessages,
          propertyContext: {
            name: property.name,
            type: property.type,
            city: property.city,
            constructionMaterial: property.constructionMaterial,
            floors: property.floors,
            yearBuilt: property.yearBuilt,
            sumInsured: property.sumInsured,
            occupancy: property.occupancy,
            floodZone: property.floodZone,
            nearCoast: property.nearCoast,
            fireProtection: property.fireProtection,
            electricalCondition: property.electricalCondition,
            plumbingCondition: property.plumbingCondition,
            roofCondition: property.roofCondition,
          },
          model: selectedModel,
        },
      });

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: result.content,
        suggestion: result.suggestion || undefined,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestion: { factor: string; value: number; explanation: string }) => {
    onApplyLoading(suggestion.factor, suggestion.value, suggestion.explanation);
    setMessages(prev => [...prev, {
      id: `sys-${Date.now()}`,
      role: "assistant",
      content: `✅ Applied **${suggestion.factor}** (${suggestion.value > 0 ? "+" : ""}${suggestion.value}%) to the calculator. You can see it in the loadings table.`,
    }]);
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">AI Pricing Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <ModelSelector value={selectedModel} onChange={setSelectedModel} disabled={loading} />
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="shrink-0 mt-1">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
              msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent/50 text-foreground"
            }`}>
              <div className="whitespace-pre-wrap">{msg.content.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                part.startsWith("**") && part.endsWith("**")
                  ? <strong key={i}>{part.slice(2, -2)}</strong>
                  : part
              )}</div>
              {msg.suggestion && (
                <button
                  onClick={() => applySuggestion(msg.suggestion!)}
                  className="mt-2 flex items-center gap-1 rounded-lg bg-primary/20 px-2.5 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/30 transition-colors"
                >
                  <Zap className="h-3 w-3" /> Apply: {msg.suggestion.factor} ({msg.suggestion.value > 0 ? "+" : ""}{msg.suggestion.value}%)
                </button>
              )}
            </div>
            {msg.role === "user" && (
              <div className="shrink-0 mt-1">
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="shrink-0 mt-1">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <div className="rounded-xl px-3 py-2 bg-accent/50 text-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about pricing..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="rounded-lg bg-primary p-2 text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
