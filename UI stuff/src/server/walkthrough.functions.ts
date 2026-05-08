import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const stopSchema = z.object({
  title: z.string(),
  propertyName: z.string(),
  propertyType: z.string(),
  sumInsured: z.number(),
  riskScore: z.number(),
  facts: z.array(z.string()),
});

export const generateWalkthroughNarration = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      stops: z.array(stopSchema).min(1).max(12),
      propertyContext: z.string().max(2000),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      // Return template-based fallback scripts
      return { scripts: data.stops.map((s) => buildFallbackScript(s)) };
    }

    try {
      const prompt = `You are a senior insurance underwriter narrating an immersive 3D risk walkthrough for "${data.stops[0]?.propertyName}".

Property context: ${data.propertyContext}

For each of the following stops, write a crisp 2-3 sentence narration script. The tone should be professional, informative, and confident — like a senior surveyor guiding a colleague through a facility. Avoid filler words. Be specific about risks and numbers.

Stops:
${data.stops.map((s, i) => `${i + 1}. "${s.title}" — Facts: ${s.facts.join("; ")}`).join("\n")}

Return a JSON array of strings, one narration per stop. Only the JSON array, no other text.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        console.error("AI narration error:", response.status);
        return { scripts: data.stops.map((s) => buildFallbackScript(s)) };
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || "";

      try {
        const parsed = JSON.parse(content);
        const scripts: string[] = Array.isArray(parsed) ? parsed : parsed.scripts || parsed.narrations || [];
        if (scripts.length === data.stops.length) {
          return { scripts };
        }
      } catch {
        // parse failed
      }

      return { scripts: data.stops.map((s) => buildFallbackScript(s)) };
    } catch (error) {
      console.error("Walkthrough narration error:", error);
      return { scripts: data.stops.map((s) => buildFallbackScript(s)) };
    }
  });

function buildFallbackScript(stop: z.infer<typeof stopSchema>): string {
  const name = stop.propertyName;
  const title = stop.title.toLowerCase();

  if (title.includes("overview") || title.includes("arrival")) {
    return `Welcome to ${name}, a ${stop.propertyType} property insured for AED ${(stop.sumInsured / 1e6).toFixed(0)} million. Let's walk through the key risk factors together.`;
  }
  if (title.includes("structure") || title.includes("building")) {
    return `The main structure presents several considerations. ${stop.facts.slice(0, 2).join(". ")}. These factors directly influence our risk assessment.`;
  }
  if (title.includes("fire")) {
    return `Fire protection is critical for this risk class. ${stop.facts.slice(0, 2).join(". ")}. Let's examine the coverage gaps.`;
  }
  if (title.includes("summary") || title.includes("score")) {
    return `Based on our comprehensive assessment, this property scores ${stop.riskScore} out of 100 on our risk index. ${stop.facts[0] || "Several factors contribute to this rating."}.`;
  }
  if (title.includes("recommendation") || title.includes("decision")) {
    return `In summary, ${name} presents a ${stop.riskScore >= 70 ? "challenging" : stop.riskScore >= 40 ? "moderate" : "favorable"} risk profile. ${stop.facts[0] || "Careful consideration of terms and conditions is recommended."}.`;
  }

  // Generic hotspot
  return `${stop.title}: ${stop.facts.slice(0, 2).join(". ")}. This area warrants close attention in our underwriting assessment.`;
}
