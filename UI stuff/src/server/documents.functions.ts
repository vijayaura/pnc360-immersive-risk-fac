import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const analyzeSubmissionDocuments = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      propertyName: z.string(),
      propertyType: z.string(),
      city: z.string(),
      broker: z.string(),
      sumInsured: z.number(),
      documents: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        size: z.string(),
      })),
      riskScore: z.number(),
      model: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { analysis: null, error: "AI not configured" };

    const docList = data.documents.map(d => `- ${d.name} (${d.type}, ${d.size})`).join("\n");

    const prompt = `You are a senior insurance underwriting analyst reviewing submission documents for a UAE property risk.

Property: ${data.propertyName} (${data.propertyType}) in ${data.city}
Broker: ${data.broker}
Sum Insured: AED ${(data.sumInsured / 1_000_000).toFixed(0)}M
Risk Score: ${data.riskScore}/100

Documents submitted:
${docList}

Based on the document types and property profile, provide:
1. An assessment of document completeness (what's present vs what's typically needed)
2. Key terms and conditions to look for in each document type
3. Risk flags or compliance concerns
4. Recommended additional documents to request`;

    try {
      const selectedModel = data.model || "google/gemini-3-flash-preview";
      const requestBody: any = {
          model: selectedModel,
          messages: [{ role: "user", content: prompt }],
          tools: [{
            type: "function",
            function: {
              name: "document_analysis",
              description: "Return structured document analysis",
              parameters: {
                type: "object",
                properties: {
                  completenessScore: { type: "number", description: "0-100 score" },
                  completenessNote: { type: "string" },
                  keyFindings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        finding: { type: "string" },
                        severity: { type: "string", enum: ["critical", "warning", "info"] },
                        relatedDocument: { type: "string" },
                      },
                      required: ["finding", "severity"],
                    },
                  },
                  missingDocuments: { type: "array", items: { type: "string" } },
                  riskFlags: { type: "array", items: { type: "string" } },
                },
                required: ["completenessScore", "completenessNote", "keyFindings", "missingDocuments", "riskFlags"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "document_analysis" } },
      };
      if (selectedModel.startsWith("google/")) requestBody.temperature = 0.4;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return { analysis: null, error: `AI error (${response.status})` };

      const result = await response.json();
      const tc = result.choices?.[0]?.message?.tool_calls?.[0];
      if (tc) {
        try {
          return { analysis: JSON.parse(tc.function.arguments), error: null };
        } catch {
          return { analysis: null, error: "Failed to parse" };
        }
      }
      return { analysis: null, error: "No response" };
    } catch (e) {
      return { analysis: null, error: e instanceof Error ? e.message : "Unknown" };
    }
  });
