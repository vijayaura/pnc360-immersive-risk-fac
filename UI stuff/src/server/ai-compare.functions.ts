import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const compareModels = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      prompt: z.string().min(1).max(5000),
      systemPrompt: z.string().max(3000).optional(),
      modelA: z.string().default("google/gemini-3-flash-preview"),
      modelB: z.string().default("openai/gpt-5-mini"),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { modelA: { content: "API key not configured", latencyMs: 0, model: data.modelA }, modelB: { content: "API key not configured", latencyMs: 0, model: data.modelB } };

    const messages = [
      ...(data.systemPrompt ? [{ role: "system" as const, content: data.systemPrompt }] : []),
      { role: "user" as const, content: data.prompt },
    ];

    const callModel = async (model: string) => {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000);
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages, ...(model.startsWith("google/") ? { temperature: 0.4 } : {}) }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const latencyMs = Date.now() - start;

        if (!response.ok) {
          return { content: `Error: ${response.status} ${response.statusText}`, latencyMs, model, tokens: 0 };
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content || "No response";
        const tokens = result.usage?.total_tokens || 0;
        return { content, latencyMs, model, tokens };
      } catch (e) {
        return { content: `Error: ${e instanceof Error ? e.message : "Unknown"}`, latencyMs: Date.now() - start, model, tokens: 0 };
      }
    };

    const [resultA, resultB] = await Promise.all([
      callModel(data.modelA),
      callModel(data.modelB),
    ]);

    return { modelA: resultA, modelB: resultB };
  });
