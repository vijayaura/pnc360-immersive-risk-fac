import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const interpretNatCatResults = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      propertyName: z.string(),
      propertyType: z.string(),
      city: z.string(),
      sumInsured: z.number(),
      constructionMaterial: z.string(),
      yearBuilt: z.number(),
      overallRating: z.string(),
      totalAAL: z.number(),
      totalPML100: z.number(),
      totalPML250: z.number(),
      perils: z.array(z.object({
        peril: z.string(),
        label: z.string(),
        aal: z.number(),
        pml100: z.number(),
        hazardScore: z.number(),
        vulnerabilityScore: z.number(),
      })),
      model: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { interpretation: "AI not configured.", recommendations: [] };

    const aalPct = ((data.totalAAL / data.sumInsured) * 100).toFixed(3);
    const pml100Pct = ((data.totalPML100 / data.sumInsured) * 100).toFixed(2);
    const pml250Pct = ((data.totalPML250 / data.sumInsured) * 100).toFixed(2);

    const perilSummary = data.perils
      .sort((a, b) => b.aal - a.aal)
      .map(p => `- ${p.label}: AAL AED ${(p.aal / 1_000_000).toFixed(2)}M, PML₁₀₀ AED ${(p.pml100 / 1_000_000).toFixed(2)}M, Hazard=${p.hazardScore}, Vulnerability=${p.vulnerabilityScore}`)
      .join("\n");

    const prompt = `You are an expert catastrophe modeling analyst interpreting NatCat model results for a UAE property insurance underwriter.

Property: ${data.propertyName} (${data.propertyType}) in ${data.city}
Construction: ${data.constructionMaterial}, built ${data.yearBuilt}
Sum Insured: AED ${(data.sumInsured / 1_000_000).toFixed(0)}M

Model Results:
- Overall Rating: ${data.overallRating}
- Total AAL: AED ${(data.totalAAL / 1_000_000).toFixed(2)}M (${aalPct}% of SI)
- PML 100-year: AED ${(data.totalPML100 / 1_000_000).toFixed(2)}M (${pml100Pct}% of SI)
- PML 250-year: AED ${(data.totalPML250 / 1_000_000).toFixed(2)}M (${pml250Pct}% of SI)

Per-Peril Breakdown:
${perilSummary}

Provide:
1. A narrative interpretation (3-4 paragraphs) explaining what these numbers mean for this specific property, comparing to UAE market benchmarks
2. 3-5 specific risk mitigation recommendations

Format the interpretation in clear markdown with bold key terms.`;

    try {
      const selectedModel = data.model || "google/gemini-3-flash-preview";
      const requestBody: any = {
          model: selectedModel,
          messages: [{ role: "user", content: prompt }],
          tools: [{
            type: "function",
            function: {
              name: "natcat_interpretation",
              description: "Return the NatCat interpretation and recommendations",
              parameters: {
                type: "object",
                properties: {
                  interpretation: { type: "string", description: "Markdown narrative interpretation" },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        impact: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["title", "description", "impact"],
                    },
                  },
                },
                required: ["interpretation", "recommendations"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "natcat_interpretation" } },
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

      if (!response.ok) return { interpretation: `AI error (${response.status}).`, recommendations: [] };

      const result = await response.json();
      const tc = result.choices?.[0]?.message?.tool_calls?.[0];
      if (tc) {
        try {
          const args = JSON.parse(tc.function.arguments);
          return { interpretation: args.interpretation || "", recommendations: args.recommendations || [] };
        } catch {
          return { interpretation: "Failed to parse AI response.", recommendations: [] };
        }
      }
      return { interpretation: result.choices?.[0]?.message?.content || "No interpretation generated.", recommendations: [] };
    } catch (e) {
      return { interpretation: `Error: ${e instanceof Error ? e.message : "Unknown"}`, recommendations: [] };
    }
  });
