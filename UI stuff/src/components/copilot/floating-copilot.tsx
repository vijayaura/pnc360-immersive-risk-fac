import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { Bot, X, Send, Paperclip, Sparkles, Minimize2, Maximize2, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { chatWithCopilot } from "@/server/copilot.functions";
import { useCopilotContext } from "@/hooks/use-copilot-context";
import { calculateRiskScore, getPremiumConfig } from "@/data/mock-properties";

interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: Array<Record<string, string | string[]>>;
  timestamp: number;
}

export function FloatingCopilot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 I'm your **P&C 360 AI Copilot** — an expert underwriter assistant.\n\nI can help you:\n- Analyze risks and explain loadings\n- Navigate to any tab or feature\n- Discuss UAE insurance regulations\n- Review loss history and pricing\n- Highlight risk zones on the 3D model\n\nWhat would you like to explore?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState<{ name: string; content: string } | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 20, y: 20 }); // offset from bottom-right
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number; dragging: boolean }>({ startX: 0, startY: 0, startPosX: 0, startPosY: 0, dragging: false });
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const { property, activeTab: currentTab } = useCopilotContext();

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragRef.current = { startX: clientX, startY: clientY, startPosX: position.x, startPosY: position.y, dragging: false };

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      const cx = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
      const cy = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
      const dx = dragRef.current.startX - cx;
      const dy = dragRef.current.startY - cy;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.dragging = true;
      if (dragRef.current.dragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 60, dragRef.current.startPosX + dx)),
          y: Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.startPosY + dy)),
        });
      }
    };
    const handleEnd = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);
  }, [position]);

  const handleButtonClick = useCallback(() => {
    if (!dragRef.current.dragging) setOpen(true);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const executeAction = useCallback((action: Record<string, string | string[]>) => {
    const type = action.type as string;
    if (type === "navigate_tab") {
      const tab = action.tab as string;
      window.dispatchEvent(new CustomEvent("copilot-navigate-tab", { detail: { tab } }));
    } else if (type === "highlight_zones") {
      window.dispatchEvent(new CustomEvent("copilot-highlight-zones", {
        detail: { zoneIds: action.zoneIds, reason: action.reason },
      }));
    } else if (type === "set_view_mode") {
      window.dispatchEvent(new CustomEvent("copilot-set-view-mode", {
        detail: { mode: action.mode },
      }));
    }
  }, []);

  const buildContext = useCallback(() => {
    if (!property) {
      return { activeTab: location.pathname };
    }

    const riskBreakdown = calculateRiskScore(property);
    const premiumConfig = getPremiumConfig(property);

    return {
      propertyName: property.name,
      propertyType: property.type,
      riskScore: property.riskScore,
      sumInsured: property.sumInsured,
      location: `${property.address}, ${property.city}`,
      activeTab: currentTab || "streetview",
      constructionMaterial: property.constructionMaterial,
      yearBuilt: property.yearBuilt,
      floors: property.floors,
      occupancy: property.occupancy,
      occupancyCapacity: property.occupancyCapacity,
      status: property.status,
      broker: property.broker,
      fireProtection: property.fireProtection,
      electricalCondition: property.electricalCondition,
      plumbingCondition: property.plumbingCondition,
      roofCondition: property.roofCondition,
      floodZone: property.floodZone,
      nearCoast: property.nearCoast,
      nearIndustrial: property.nearIndustrial,
      riskBreakdown: {
        baseScore: riskBreakdown.baseScore,
        locationRisk: riskBreakdown.locationRisk,
        constructionRisk: riskBreakdown.constructionRisk,
        occupancyRisk: riskBreakdown.occupancyRisk,
        protectionCredit: riskBreakdown.protectionCredit,
        total: riskBreakdown.total,
      },
      premiumInfo: {
        baseRate: premiumConfig.baseRatePerMille,
        loadingsCount: premiumConfig.loadings.length,
        keyLoadings: premiumConfig.loadings.slice(0, 5).map(l => `${l.factor}: ${l.current > 0 ? '+' : ''}${l.current}%`),
      },
    };
  }, [property, currentTab, location.pathname]);

  const handleSend = async () => {
    if (!input.trim() && !uploadedDoc) return;

    let userContent = input.trim();
    if (uploadedDoc) {
      userContent += `\n\n[Uploaded Document: ${uploadedDoc.name}]\n${uploadedDoc.content.slice(0, 4000)}`;
      setUploadedDoc(null);
    }

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userContent,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages.filter((m) => m.id !== "welcome"), userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const result = await chatWithCopilot({
        data: {
          messages: history.slice(-20),
          context: buildContext(),
        },
      });

      const assistantMsg: CopilotMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.content,
        actions: result.actions,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Auto-execute actions
      if (result.actions) {
        for (const action of result.actions) {
          executeAction(action);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedDoc({ name: file.name, content: reader.result as string });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const panelWidth = expanded ? "w-[600px]" : "w-[380px]";
  const panelHeight = expanded ? "h-[700px]" : "h-[500px]";

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onClick={handleButtonClick}
          style={{ right: position.x, bottom: position.y }}
          className="fixed z-50 h-12 w-12 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform group cursor-grab active:cursor-grabbing select-none"
          title="Open AI Copilot — drag to reposition"
        >
          <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-status-approved animate-pulse" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{ right: position.x, bottom: position.y }} className={`fixed z-50 ${panelWidth} ${panelHeight} max-h-[85vh] max-w-[95vw] flex flex-col rounded-2xl border border-border bg-card shadow-2xl shadow-black/20 overflow-hidden transition-all duration-200`}>
          {/* Header */}
          <div onMouseDown={handleDragStart} onTouchStart={handleDragStart} className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/95 backdrop-blur-xl shrink-0 cursor-grab active:cursor-grabbing select-none">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">AI Copilot</p>
                <p className="text-[10px] text-muted-foreground">
                  {property ? `Reviewing: ${property.name}` : "Expert P&C Underwriter"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground" title={expanded ? "Minimize" : "Expand"}>
                {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Property context banner */}
          {property && (
            <div className="px-3 py-1.5 border-b border-border bg-primary/5 text-[10px] text-muted-foreground flex items-center gap-2">
              <span className="font-medium text-foreground">{property.name}</span>
              <span>•</span>
              <span>Risk: {property.riskScore}/100</span>
              <span>•</span>
              <span>AED {(property.sumInsured / 1_000_000).toFixed(0)}M</span>
              <span>•</span>
              <span className="capitalize">{currentTab || "streetview"} tab</span>
            </div>
          )}

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
                  {msg.role === "assistant" ? (
                    <div className="prose prose-xs prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_code]:text-[10px] [&_code]:bg-background/50 [&_code]:px-1 [&_code]:rounded">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {/* Action buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {msg.actions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => executeAction(action)}
                          className="flex items-center gap-1 rounded-lg bg-primary/20 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/30 transition-colors"
                        >
                          <ChevronRight className="h-2.5 w-2.5" />
                          {action.type === "navigate_tab" ? `Go to ${action.tab}` :
                           action.type === "highlight_zones" ? `Highlight zones` :
                           action.type === "set_view_mode" ? `Switch to ${action.mode} view` :
                           String(action.type)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary animate-pulse" />
                </div>
                <div className="rounded-xl bg-accent/50 px-3 py-2">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Uploaded doc indicator */}
          {uploadedDoc && (
            <div className="px-3 py-1.5 border-t border-border bg-accent/30">
              <div className="flex items-center gap-2 text-[10px] text-foreground">
                <Paperclip className="h-3 w-3 text-primary" />
                <span className="truncate flex-1">{uploadedDoc.name}</span>
                <button onClick={() => setUploadedDoc(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border shrink-0">
            <div className="flex gap-2 items-end">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground shrink-0"
                title="Upload document"
              >
                <Paperclip className="h-3.5 w-3.5" />
              </button>
              <input ref={fileInputRef} type="file" className="hidden" accept=".txt,.csv,.json,.md,.pdf,.doc,.docx" onChange={handleFileUpload} />
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder="Ask about risks, regulations, pricing..."
                rows={1}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none max-h-20"
              />
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !uploadedDoc) || loading}
                className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
