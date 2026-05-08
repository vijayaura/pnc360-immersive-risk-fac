import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildDamagePrompt } from "./simulation-image.server";

export const generateDamageImage = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      propertyName: z.string(),
      propertyType: z.string(),
      floors: z.number(),
      scenario: z.string(),
      severity: z.number(),
      params: z.object({
        windSpeed: z.number().optional(),
        floodLevel: z.number().optional(),
        recoveryWeeks: z.number().optional(),
      }),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { imageUrl: null, error: "API key not configured" };
    }

    const prompt = buildDamagePrompt(
      data.propertyName,
      data.propertyType,
      data.floors,
      data.scenario,
      data.severity,
      data.params
    );

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) return { imageUrl: null, error: "Rate limited — try again shortly" };
        if (response.status === 402) return { imageUrl: null, error: "Credits exhausted" };
        return { imageUrl: null, error: `AI gateway error: ${response.status}` };
      }

      const result = await response.json();
      const imageUrl = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      return { imageUrl: imageUrl || null, error: imageUrl ? null : "No image generated" };
    } catch (e) {
      return { imageUrl: null, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });
