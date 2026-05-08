import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const facilityZoneSchema = {
  type: "object" as const,
  properties: {
    zones: {
      type: "array" as const,
      description: "3D facility zones representing distinct physical areas of the building complex",
      items: {
        type: "object" as const,
        properties: {
          id: { type: "string" as const, description: "Unique zone ID like af-tower2" },
          name: { type: "string" as const, description: "Descriptive name e.g. 'Office Tower 2 (4B+G+34)'" },
          type: { type: "string" as const, enum: ["warehouse", "office", "cold-storage", "utility", "external", "loading", "security"] },
          description: { type: "string" as const, description: "Detailed description of this zone including construction, function, risk factors" },
          dimensions: { type: "string" as const, description: "Physical dimensions or floor count" },
          position: {
            type: "object" as const,
            properties: {
              x: { type: "number" as const, description: "X position 0-1 normalized" },
              y: { type: "number" as const, description: "Y position 0-1 normalized. Use negative for underground/basement" },
              z: { type: "number" as const, description: "Z position 0-1 normalized" },
            },
            required: ["x", "y", "z"],
          },
          size: {
            type: "object" as const,
            properties: {
              w: { type: "number" as const, description: "Width 0-1. Taller buildings should have larger h values (e.g. 34-floor tower: h=0.85)" },
              h: { type: "number" as const, description: "Height 0-1. Proportional to actual building height relative to tallest structure" },
              d: { type: "number" as const, description: "Depth 0-1" },
            },
            required: ["w", "h", "d"],
          },
          color: { type: "string" as const, description: "oklch color string e.g. 'oklch(0.50 0.12 230)'. Use different hues for different zone types." },
          details: {
            type: "object" as const,
            additionalProperties: { type: "string" as const },
            description: "Key-value pairs of important details about this zone",
          },
          hazards: { type: "array" as const, items: { type: "string" as const }, description: "List of hazard descriptions" },
          protectionSystems: { type: "array" as const, items: { type: "string" as const }, description: "List of fire/safety protection systems" },
          condition: { type: "string" as const, enum: ["good", "fair", "poor"] },
          riskLevel: { type: "string" as const, enum: ["low", "medium", "high"] },
        },
        required: ["id", "name", "type", "description", "position", "size", "color", "details", "hazards", "protectionSystems", "condition", "riskLevel"],
      },
    },
    equipment: {
      type: "array" as const,
      description: "Equipment markers placed within zones",
      items: {
        type: "object" as const,
        properties: {
          id: { type: "string" as const },
          name: { type: "string" as const },
          type: { type: "string" as const, enum: ["sprinkler", "fire-extinguisher", "fire-hose", "smoke-vent", "detector", "cctv", "emergency-exit", "hydrant", "fire-panel", "generator", "pump", "bms", "charging-station", "esfr", "rack"] },
          zone: { type: "string" as const, description: "ID of the zone this equipment belongs to" },
          position: {
            type: "object" as const,
            properties: {
              x: { type: "number" as const },
              y: { type: "number" as const },
              z: { type: "number" as const },
            },
            required: ["x", "y", "z"],
          },
          details: { type: "string" as const },
          status: { type: "string" as const, enum: ["operational", "maintenance", "needs-attention"] },
          icon: { type: "string" as const, description: "Single emoji icon" },
        },
        required: ["id", "name", "type", "zone", "position", "details", "status", "icon"],
      },
    },
  },
  required: ["zones", "equipment"],
};

export const generateFacilityZonesWithAI = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      propertyName: z.string(),
      propertyType: z.string(),
      floors: z.number(),
      constructionMaterial: z.string(),
      occupancy: z.string(),
      sumInsured: z.number(),
      yearBuilt: z.number(),
      riskScore: z.number(),
      fireProtection: z.object({
        sprinklers: z.boolean(),
        alarms: z.boolean(),
        extinguishers: z.boolean(),
        hydrantNearby: z.boolean(),
      }),
      electricalCondition: z.string(),
      plumbingCondition: z.string(),
      roofCondition: z.string(),
      aiInsights: z.array(z.object({
        text: z.string(),
        severity: z.string(),
        category: z.string(),
      })),
      model: z.string().default("openai/gpt-5-mini"),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { zones: [], equipment: [], error: "API key not configured" };

    const prompt = `You are an expert insurance risk engineer creating a detailed 3D facility model for an interactive digital twin viewer.

PROPERTY: ${data.propertyName}
TYPE: ${data.propertyType}
FLOORS: ${data.floors}
CONSTRUCTION: ${data.constructionMaterial}
OCCUPANCY: ${data.occupancy}
SUM INSURED: AED ${(data.sumInsured / 1e6).toFixed(0)}M
YEAR BUILT: ${data.yearBuilt}
RISK SCORE: ${data.riskScore}/100

FIRE PROTECTION:
- Sprinklers: ${data.fireProtection.sprinklers ? "Yes" : "No"}
- Alarms: ${data.fireProtection.alarms ? "Yes" : "No"}
- Extinguishers: ${data.fireProtection.extinguishers ? "Yes" : "No"}
- Hydrant Nearby: ${data.fireProtection.hydrantNearby ? "Yes" : "No"}

CONDITIONS:
- Electrical: ${data.electricalCondition}
- Plumbing: ${data.plumbingCondition}
- Roof: ${data.roofCondition}

AI-IDENTIFIED RISKS:
${data.aiInsights.map((i, idx) => `${idx + 1}. [${i.severity.toUpperCase()}/${i.category}] ${i.text}`).join("\n")}

IMPORTANT 3D MODELING RULES:
1. Create 6-10 distinct zones that accurately represent the building's physical layout
2. For multi-tower complexes, create SEPARATE zones for each tower with correct relative heights
3. Create zones for basements (negative y position), podiums, utility areas, and special risk areas
4. Position zones so they don't overlap but form a coherent building complex
5. Use height (h) proportional to actual floors: a 34-floor tower should be ~0.85, a 10-floor tower ~0.45
6. Create specific zones for every hazard identified in the AI insights (EDG room, LPG area, transformer area, etc.)
7. Equipment markers should be placed INSIDE their parent zones (matching position roughly)
8. Create 12-18 equipment markers covering all protection systems mentioned
9. Mark equipment as "needs-attention" if it relates to a risk improvement recommendation
10. Use oklch colors: blue-ish for offices (hue 220-240), warm for hazard zones (hue 25-55), green for safe areas (hue 155)`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000);
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: data.model,
          messages: [{ role: "user", content: prompt }],
          tools: [{
            type: "function",
            function: {
              name: "generate_facility_model",
              description: "Generate a detailed 3D facility model with zones and equipment markers for an insurance digital twin",
              parameters: facilityZoneSchema,
            },
          }],
          tool_choice: { type: "function", function: { name: "generate_facility_model" } },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text();
        console.error("AI facility generation error:", response.status, text);
        return { zones: [], equipment: [], error: `AI error (${response.status})` };
      }

      const result = await response.json();
      const tc = result.choices?.[0]?.message?.tool_calls?.[0];
      if (tc) {
        try {
          const parsed = JSON.parse(tc.function.arguments);
          return { zones: parsed.zones || [], equipment: parsed.equipment || [], error: null };
        } catch {
          return { zones: [], equipment: [], error: "Failed to parse AI response" };
        }
      }
      return { zones: [], equipment: [], error: "No structured response from AI" };
    } catch (e) {
      console.error("Facility zone generation failed:", e);
      return { zones: [], equipment: [], error: e instanceof Error ? e.message : "Unknown error" };
    }
  });

export const loadFacility3DData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { propertyId: string }) => z.object({ propertyId: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row } = await supabase
      .from("submission_properties")
      .select("facility_3d_data")
      .eq("id", data.propertyId)
      .single();
    if (row?.facility_3d_data) {
      const d = row.facility_3d_data as any;
      return { zones: d.zones || [], equipment: d.equipment || [], found: true };
    }
    return { zones: [], equipment: [], found: false };
  });

export const saveFacility3DData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { propertyId: string; zones: any[]; equipment: any[] }) =>
    z.object({ propertyId: z.string(), zones: z.array(z.any()), equipment: z.array(z.any()) }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("submission_properties")
      .update({ facility_3d_data: { zones: data.zones, equipment: data.equipment } })
      .eq("id", data.propertyId);
    return { error: error?.message || null };
  });
