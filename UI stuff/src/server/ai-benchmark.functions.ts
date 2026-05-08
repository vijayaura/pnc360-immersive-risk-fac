import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MODELS = ["google/gemini-3-flash-preview", "openai/gpt-5-mini"] as const;

interface BenchmarkResult {
  feature: string;
  property: string;
  model: string;
  content: string;
  latencyMs: number;
  tokens: number;
  success: boolean;
  error?: string;
}

async function callModel(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  tools?: any[],
  toolChoice?: any,
): Promise<{ content: string; latencyMs: number; tokens: number; success: boolean; error?: string }> {
  const start = Date.now();
  try {
    const body: any = { model, messages };
    if (model.startsWith("google/")) body.temperature = 0.4;
    if (tools) body.tools = tools;
    if (toolChoice) body.tool_choice = toolChoice;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const latencyMs = Date.now() - start;
    if (!response.ok) {
      return { content: "", latencyMs, tokens: 0, success: false, error: `HTTP ${response.status}` };
    }

    const result = await response.json();
    const choice = result.choices?.[0];

    let content = choice?.message?.content || "";
    if (choice?.message?.tool_calls?.[0]) {
      try {
        content = choice.message.tool_calls[0].function.arguments;
      } catch {
        /* use content */
      }
    }

    return {
      content,
      latencyMs,
      tokens: result.usage?.total_tokens || 0,
      success: true,
    };
  } catch (e) {
    return {
      content: "",
      latencyMs: Date.now() - start,
      tokens: 0,
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export const runBenchmark = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      feature: z.string(),
      model: z.string(),
      propertyName: z.string(),
      prompt: z.string().max(10000),
      systemPrompt: z.string().max(5000).optional(),
      tools: z.any().optional(),
      toolChoice: z.any().optional(),
    }).parse(data)
  )
  .handler(async ({ data }): Promise<BenchmarkResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        feature: data.feature,
        property: data.propertyName,
        model: data.model,
        content: "",
        latencyMs: 0,
        tokens: 0,
        success: false,
        error: "API key not configured",
      };
    }

    const messages = [
      ...(data.systemPrompt ? [{ role: "system", content: data.systemPrompt }] : []),
      { role: "user", content: data.prompt },
    ];

    const result = await callModel(apiKey, data.model, messages, data.tools, data.toolChoice);

    return {
      feature: data.feature,
      property: data.propertyName,
      model: data.model,
      ...result,
    };
  });
