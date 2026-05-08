import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const parseSubmissionWithGPT = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      documentText: z.string().max(30000),
      propertyName: z.string(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { result: null, error: "API key not configured" };

    const prompt = `You are an expert insurance underwriter. Analyze the following submission documents for "${data.propertyName}" and extract structured data.

DOCUMENT CONTENT:
${data.documentText}

Extract the following and return via the tool call:
1. A list of 6-8 risk insights based on the documents
2. Key property details you can identify
3. Risk flags and concerns`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-5-mini",
          messages: [{ role: "user", content: prompt }],
          tools: [{
            type: "function",
            function: {
              name: "submission_analysis",
              description: "Return structured submission analysis from parsed documents",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "Detailed risk insight" },
                        severity: { type: "string", enum: ["high", "medium", "low"] },
                        confidence: { type: "number", description: "0-100" },
                        category: { type: "string", enum: ["fire", "flood", "structural", "environmental", "security"] },
                      },
                      required: ["text", "severity", "confidence", "category"],
                    },
                  },
                  riskScore: { type: "number", description: "Overall risk score 0-100" },
                  summary: { type: "string", description: "Brief executive summary of the submission" },
                  keyRiskFlags: { type: "array", items: { type: "string" } },
                },
                required: ["insights", "riskScore", "summary", "keyRiskFlags"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "submission_analysis" } },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return { result: null, error: `AI error (${response.status})` };

      const result = await response.json();
      const tc = result.choices?.[0]?.message?.tool_calls?.[0];
      if (tc) {
        try {
          return { result: JSON.parse(tc.function.arguments), error: null };
        } catch {
          return { result: null, error: "Failed to parse response" };
        }
      }
      return { result: null, error: "No structured response" };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });
