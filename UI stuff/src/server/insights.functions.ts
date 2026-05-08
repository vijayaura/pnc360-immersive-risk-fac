import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const generateAIInsights = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      propertyName: z.string(),
      propertyType: z.string(),
      city: z.string(),
      constructionMaterial: z.string(),
      floors: z.number(),
      yearBuilt: z.number(),
      sumInsured: z.number(),
      occupancy: z.string(),
      floodZone: z.boolean(),
      nearCoast: z.boolean(),
      nearIndustrial: z.boolean(),
      fireProtection: z.object({
        sprinklers: z.boolean(),
        alarms: z.boolean(),
        extinguishers: z.boolean(),
        hydrantNearby: z.boolean(),
      }),
      electricalCondition: z.string(),
      plumbingCondition: z.string(),
      roofCondition: z.string(),
      riskScore: z.number(),
      model: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { insights: [], error: "AI not configured" };

    const prompt = `You are an expert P&C insurance risk analyst reviewing a property submission for the UAE market.

Property Profile:
- Name: ${data.propertyName} (${data.propertyType}) in ${data.city}
- Construction: ${data.constructionMaterial}, ${data.floors} floors, built ${data.yearBuilt}
- Sum Insured: AED ${(data.sumInsured / 1_000_000).toFixed(0)}M
- Occupancy: ${data.occupancy}
- Flood Zone: ${data.floodZone ? "Yes" : "No"} | Near Coast: ${data.nearCoast ? "Yes" : "No"} | Near Industrial: ${data.nearIndustrial ? "Yes" : "No"}
- Fire Protection: Sprinklers=${data.fireProtection.sprinklers}, Alarms=${data.fireProtection.alarms}, Extinguishers=${data.fireProtection.extinguishers}, Hydrant=${data.fireProtection.hydrantNearby}
- Conditions: Electrical=${data.electricalCondition}, Plumbing=${data.plumbingCondition}, Roof=${data.roofCondition}
- Current Risk Score: ${data.riskScore}/100

Generate 5-8 risk insights. Each must identify a specific risk or positive factor.`;

    try {
      const selectedModel = data.model || "google/gemini-3-flash-preview";
      const requestBody: any = {
          model: selectedModel,
          messages: [{ role: "user", content: prompt }],
          tools: [{
            type: "function",
            function: {
              name: "provide_insights",
              description: "Return structured risk insights",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        severity: { type: "string", enum: ["high", "medium", "low"] },
                        confidence: { type: "number", description: "0-100" },
                        category: { type: "string", enum: ["fire", "flood", "structural", "environmental", "security"] },
                      },
                      required: ["text", "severity", "confidence", "category"],
                    },
                  },
                },
                required: ["insights"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "provide_insights" } },
      };
      if (selectedModel.startsWith("google/")) requestBody.temperature = 0.5;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return { insights: [], error: `AI error (${response.status})` };
      }

      const result = await response.json();
      const tc = result.choices?.[0]?.message?.tool_calls?.[0];
      if (tc) {
        try {
          const args = JSON.parse(tc.function.arguments);
          const insights = (args.insights || []).map((ins: any, i: number) => ({
            id: `ai-gen-${Date.now()}-${i}`,
            text: ins.text,
            severity: ins.severity,
            confidence: ins.confidence,
            category: ins.category,
            status: "pending" as const,
          }));
          return { insights, error: null };
        } catch {
          return { insights: [], error: "Failed to parse AI response" };
        }
      }
      return { insights: [], error: "No structured response from AI" };
    } catch (e) {
      return { insights: [], error: e instanceof Error ? e.message : "Unknown error" };
    }
  });
