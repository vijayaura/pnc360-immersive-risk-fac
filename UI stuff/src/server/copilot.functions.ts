import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildCopilotSystemPrompt, copilotTools } from "./copilot.server";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const chatWithCopilot = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      messages: z.array(messageSchema).min(1).max(50),
      context: z.record(z.any()).optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { content: "AI assistant is not configured. Please check your API key.", actions: [] };
    }

    const systemPrompt = buildCopilotSystemPrompt(data.context ?? undefined);

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...data.messages,
          ],
          tools: copilotTools,
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) return { content: "I'm getting too many requests right now. Please try again in a moment.", actions: [] };
        if (response.status === 402) return { content: "AI credits are exhausted. Please add funds in Settings > Workspace > Usage.", actions: [] };
        return { content: `AI service error (${response.status}). Please try again.`, actions: [] };
      }

      const result = await response.json();
      const choice = result.choices?.[0];

      let content = choice?.message?.content || "";

      // Extract tool calls as actions
      const actions: Array<Record<string, string | string[]>> = [];
      if (choice?.message?.tool_calls) {
        for (const tc of choice.message.tool_calls) {
          try {
            const args = JSON.parse(tc.function.arguments);
            actions.push({ type: tc.function.name, ...args });
          } catch {
            // skip malformed
          }
        }

        // If we got tool calls but no content, do a follow-up call with tool results
        // so the model produces a natural language response alongside the actions
        if (!content && actions.length > 0) {
          try {
            const toolResultMessages = choice.message.tool_calls.map((tc: any) => ({
              role: "tool" as const,
              tool_call_id: tc.id,
              content: JSON.stringify({ success: true, executed: tc.function.name }),
            }));

            const followUp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [
                  { role: "system", content: systemPrompt },
                  ...data.messages,
                  choice.message,
                  ...toolResultMessages,
                ],
                temperature: 0.4,
              }),
            });

            if (followUp.ok) {
              const followUpResult = await followUp.json();
              content = followUpResult.choices?.[0]?.message?.content || "";
            }
          } catch {
            // If follow-up fails, generate a summary from the actions
            const actionDescs = actions.map(a => {
              if (a.type === "navigate_tab") return `navigating to the **${a.tab}** tab`;
              if (a.type === "highlight_zones") return `highlighting risk zones`;
              if (a.type === "set_view_mode") return `switching to **${a.mode}** view`;
              return String(a.type);
            });
            content = `I'm ${actionDescs.join(" and ")} for you. Click the buttons below to execute these actions.`;
          }
        }
      }

      // Also parse inline action blocks from content
      const actionRegex = /```action\s*\n([\s\S]*?)\n```/g;
      let match;
      while ((match = actionRegex.exec(content)) !== null) {
        try {
          const action = JSON.parse(match[1]);
          actions.push(action);
        } catch {
          // skip
        }
      }
      content = content.replace(/```action\s*\n[\s\S]*?\n```/g, "").trim();

      // Fallback if still no content
      if (!content && actions.length > 0) {
        const actionDescs = actions.map(a => {
          if (a.type === "navigate_tab") return `navigating to the **${a.tab}** tab`;
          if (a.type === "highlight_zones") return `highlighting risk zones`;
          if (a.type === "set_view_mode") return `switching to **${a.mode}** view`;
          return String(a.type);
        });
        content = `I'm ${actionDescs.join(" and ")} for you.`;
      }

      return { content, actions };
    } catch (e) {
      return {
        content: `I encountered an error: ${e instanceof Error ? e.message : "Unknown error"}. Please try again.`,
        actions: [],
      };
    }
  });
