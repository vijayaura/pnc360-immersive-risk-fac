import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const propertyContextSchema = z.object({
  name: z.string(),
  type: z.string(),
  city: z.string(),
  constructionMaterial: z.string(),
  floors: z.number(),
  yearBuilt: z.number(),
  sumInsured: z.number(),
  occupancy: z.string(),
  floodZone: z.boolean(),
  nearCoast: z.boolean(),
  fireProtection: z.object({
    sprinklers: z.boolean(),
    alarms: z.boolean(),
    extinguishers: z.boolean(),
    hydrantNearby: z.boolean(),
  }),
  electricalCondition: z.string(),
  plumbingCondition: z.string(),
  roofCondition: z.string(),
});

export const chatWithPricingAI = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).min(1).max(50),
      propertyContext: propertyContextSchema,
      currentLoadings: z.array(z.object({ factor: z.string(), value: z.number() })).optional(),
      model: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { content: "AI not configured.", suggestion: null };

    const systemPrompt = `You are an expert P&C insurance pricing analyst for the UAE market. You help underwriters with pricing decisions for property insurance.

Property under review:
- Name: ${data.propertyContext.name}
- Type: ${data.propertyContext.type} in ${data.propertyContext.city}
- Construction: ${data.propertyContext.constructionMaterial}, ${data.propertyContext.floors} floors, built ${data.propertyContext.yearBuilt}
- Sum Insured: AED ${(data.propertyContext.sumInsured / 1_000_000).toFixed(0)}M
- Occupancy: ${data.propertyContext.occupancy}
- Flood Zone: ${data.propertyContext.floodZone ? "Yes" : "No"} | Near Coast: ${data.propertyContext.nearCoast ? "Yes" : "No"}
- Fire Protection: Sprinklers=${data.propertyContext.fireProtection.sprinklers}, Alarms=${data.propertyContext.fireProtection.alarms}, Hydrant=${data.propertyContext.fireProtection.hydrantNearby}
- Conditions: Electrical=${data.propertyContext.electricalCondition}, Plumbing=${data.propertyContext.plumbingCondition}, Roof=${data.propertyContext.roofCondition}
${data.currentLoadings ? `\nCurrent loadings: ${data.currentLoadings.map(l => `${l.factor}: ${l.value > 0 ? "+" : ""}${l.value}%`).join(", ")}` : ""}

Rules:
- Give data-backed explanations referencing UAE market conditions
- Use markdown bold for key terms
- When suggesting a loading, include the exact factor name, percentage, and explanation
- Reference 2024 Dubai floods, UAE building codes, and regional benchmarks where relevant
- Keep responses concise but thorough`;

    try {
      const selectedModel = data.model || "google/gemini-3-flash-preview";
      const requestBody: any = {
          model: selectedModel,
          messages: [{ role: "system", content: systemPrompt }, ...data.messages],
          tools: [{
            type: "function",
            function: {
              name: "suggest_loading",
              description: "Suggest a pricing loading/discount to apply to the premium calculator",
              parameters: {
                type: "object",
                properties: {
                  factor: { type: "string", description: "Name of the risk factor" },
                  value: { type: "number", description: "Loading percentage (positive=surcharge, negative=discount)" },
                  explanation: { type: "string", description: "Rationale for the loading" },
                },
                required: ["factor", "value", "explanation"],
              },
            },
          }],
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

      if (!response.ok) {
        if (response.status === 429) return { content: "Rate limited — try again shortly.", suggestion: null };
        if (response.status === 402) return { content: "AI credits exhausted.", suggestion: null };
        return { content: `AI error (${response.status}).`, suggestion: null };
      }

      const result = await response.json();
      const choice = result.choices?.[0];
      let content = choice?.message?.content || "";
      let suggestion: { factor: string; value: number; explanation: string } | null = null;

      if (choice?.message?.tool_calls) {
        for (const tc of choice.message.tool_calls) {
          try {
            const args = JSON.parse(tc.function.arguments);
            if (tc.function.name === "suggest_loading") {
              suggestion = { factor: args.factor, value: args.value, explanation: args.explanation };
            }
          } catch { /* skip */ }
        }

        if (!content && suggestion) {
          content = `I'd suggest adding a **${suggestion.factor}** loading of **${suggestion.value > 0 ? "+" : ""}${suggestion.value}%**.\n\n${suggestion.explanation}\n\nWould you like me to apply this to the calculator?`;
        }
      }

      if (!content) content = "I can help you analyze pricing for this property. What would you like to discuss?";

      return { content, suggestion };
    } catch (e) {
      return { content: `Error: ${e instanceof Error ? e.message : "Unknown"}`, suggestion: null };
    }
  });
