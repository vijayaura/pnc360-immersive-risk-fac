import { RatingParameter } from "../types";
import { Macro } from '@/features/product-config/document-builder/api/document-configurator';

export function macroToRatingParameter(m: Macro): RatingParameter {
  return {
    id: m.name,
    name: m.name,
    label: m.label,
    type: m.type === "STATIC" ? "number" : "text",
  };
}

