import { FileText, User, DollarSign, Shield, MapPin, Calendar } from "lucide-react";
import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export function useProposalSteps(pages: Page[], requiredDocsCount: number) {
  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("proposer") || t.includes("details")) return User;
    if (t.includes("money") || t.includes("coverage")) return DollarSign;
    if (t.includes("security")) return Shield;
    if (t.includes("address") || t.includes("location")) return MapPin;
    if (t.includes("date")) return Calendar;
    return FileText;
  };

  const steps = pages.map((p, idx) => ({
    id: p.id,
    label: p.title,
    icon: getIcon(p.title),
    index: idx,
  }));

  if (requiredDocsCount > 0) {
    steps.push({
      id: "required_documents",
      label: "Underwriting Documents",
      icon: FileText,
      index: pages.length,
    });
  }

  steps.push({
    id: "quotes_comparison",
    label: "Quotes",
    icon: FileText,
    index: steps.length,
  });

  steps.push({
    id: "declaration_documents",
    label: "Policy Issuance Documents",
    icon: FileText,
    index: steps.length,
  });

  return steps;
}
