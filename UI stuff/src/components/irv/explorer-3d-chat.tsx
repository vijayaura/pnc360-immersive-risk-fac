import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { chatWithCopilot } from "@/server/copilot.functions";
import type { Property } from "@/data/mock-properties";
import type { FacilityZone } from "@/data/viva-survey-data";

interface Explorer3DChatProps {
  property: Property;
  zones: FacilityZone[];
  onHighlightZones: (zoneIds: string[]) => void;
  onSetViewMode: (mode: string) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: Array<Record<string, string | string[]>>;
}

const quickPrompts = [
  "Show me all fire risks",
  "What are the flood exposures?",
  "Highlight high-risk zones",
  "Explain the risk score",
  "What needs maintenance?",
];

export function Explorer3DChat({ property, zones, onHighlightZones, onSetViewMode }: Explorer3DChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `I'm analyzing **${property.name}** in 3D. Ask me anything about this facility's risks — I'll highlight relevant zones on the model.\n\nTry: *"Show me fire risks"* or *"What are the hazard zones?"*`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const executeActions = (actions: Array<Record<string, string | string[]>>) => {
    for (const action of actions) {
      if (action.type === "highlight_zones" && Array.isArray(action.zoneIds)) {
        onHighlightZones(action.zoneIds as string[]);
      } else if (action.type === "set_view_mode" && typeof action.mode === "string") {
        onSetViewMode(action.mode);
      }
    }
  };

  const handleSend = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText) return;

    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: "user", content: msgText };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages.filter(m => m.id !== "welcome"), userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const result = await chatWithCopilot({
        data: {
          messages: history.slice(-15),
          context: {
            propertyName: property.name,
            propertyType: property.type,
            riskScore: property.riskScore,
            sumInsured: property.sumInsured,
            location: `${property.address}, ${property.city}`,
            activeTab: "explorer3d",
            zones: zones.map(z => ({
              id: z.id,
              name: z.name,
              riskLevel: z.riskLevel,
              description: z.description,
            })),
          },
        },
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.content,
        actions: result.actions,
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (result.actions?.length) {
        executeActions(result.actions);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't process that. Please try again.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Quick prompts */}
      <div className="px-2 py-2 flex flex-wrap gap-1 border-b border-border">
        {quickPrompts.map(prompt => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="text-[9px] px-2 py-1 rounded-full border border-border bg-background/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-2 space-y-2">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-1.5 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="shrink-0 mt-0.5">
                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-2.5 w-2.5 text-primary" />
                </div>
              </div>
            )}
            <div className={`max-w-[90%] rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed ${
              msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent/50 text-foreground"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-xs prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-0.5 [&_ul]:my-0.5 [&_li]:my-0 [&_h1]:text-xs [&_h2]:text-[11px] [&_h3]:text-[11px] [&_code]:text-[9px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-1.5">
            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-2.5 w-2.5 text-primary animate-pulse" />
            </div>
            <div className="rounded-lg bg-accent/50 px-2.5 py-1.5">
              <div className="flex gap-1">
                <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-2 border-t border-border">
        <div className="flex gap-1.5">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
            placeholder="Ask about this facility..."
            className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
