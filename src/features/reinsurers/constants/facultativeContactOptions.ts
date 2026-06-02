import {
  Building2,
  HardHat,
  Scale,
  Ship,
  Plane,
  Zap,
  Shield,
  Car,
  Landmark,
  Wheat,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";

export interface FacultativeContactProductLine {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const FACULTATIVE_CONTACT_PRODUCT_LINES: FacultativeContactProductLine[] = [
  { value: "property", label: "Property", icon: Building2 },
  { value: "liability", label: "Liability", icon: Scale },
  { value: "engineering", label: "Engineering", icon: HardHat },
  { value: "marine", label: "Marine", icon: Ship },
  { value: "aviation", label: "Aviation", icon: Plane },
  { value: "energy", label: "Energy", icon: Zap },
  { value: "cyber", label: "Cyber", icon: Shield },
  { value: "motor", label: "Motor", icon: Car },
  { value: "financial_lines", label: "Financial Lines", icon: Landmark },
  { value: "agriculture", label: "Agriculture", icon: Wheat },
  { value: "life_health", label: "Life & Health", icon: HeartPulse },
];

export function getFacultativeProductLine(value: string) {
  return FACULTATIVE_CONTACT_PRODUCT_LINES.find((p) => p.value === value);
}
