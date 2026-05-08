import { Badge } from "@/components/ui/badge";

export const QUOTE_STATUSES = {
  QUOTE_GENERATED: "quote_generated",
  QUOTE_CONFIRMED: "quote_confirmed", 
  SELECTED_PRODUCT: "selected_product",
  QUOTE_EDITED: "quote_edited",
  POLICY_GENERATED: "policy_generated",
  PAYMENT_PENDING: "payment_pending"
} as const;

export type QuoteStatus = typeof QUOTE_STATUSES[keyof typeof QUOTE_STATUSES];

// Statuses that indicate a quote has been converted to a policy
export const POLICY_STATUSES = [
  QUOTE_STATUSES.POLICY_GENERATED,
  QUOTE_STATUSES.PAYMENT_PENDING
] as const;

// Helper function to check if a quote has been converted to a policy
export const isQuoteConvertedToPolicy = (status: QuoteStatus | string): boolean => {
  return POLICY_STATUSES.includes(status as any);
};

// Helper function to filter quotes (excludes converted policies)
export const filterActiveQuotes = (quotes: any[]) => {
  return quotes.filter(quote => !isQuoteConvertedToPolicy(quote.status));
};

export const getQuoteStatusLabel = (status: QuoteStatus | string): string => {
  // Handle null, undefined, or empty string
  if (!status || status === '') {
    return "Unknown";
  }
  
  // Use the same mapping as QuoteDetails page
  const statusMap: Record<string, string> = {
    'project_details': 'Project Details',
    'insured_details': 'Insured Details',
    'contract_structure': 'Contract Structure',
    'site_risk': 'Site Risks',
    'cover_requirements': 'Cover Requirements',
    'required_documents': 'UW Documents',
    'plan_selected': 'Plan Selected',
    'declaration_documents': 'Declaration Documents',
    'policy_created': 'Policy Created',
    'draft': 'Draft',
    'in_progress': 'In Progress',
    'submitted': 'Submitted',
    'under_review': 'Under Review',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'expired': 'Expired',
    // Legacy status mappings for backward compatibility
    'quote_generated': 'Quote Generated',
    'quote_confirmed': 'Quote Confirmed',
    'selected_product': 'Selected Product',
    'quote_edited': 'Quote Edited',
    'policy_generated': 'Policy Generated',
    'payment_pending': 'Payment Pending'
  };
  
  const mapped = statusMap[status?.toLowerCase()];
  if (mapped) return mapped;

  if (typeof status !== 'string') return status;
  
  return status
    .split(/[_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const getQuoteStatusColor = (status: QuoteStatus | string): string => {
  if (!status || status === '') {
    return "bg-muted text-muted-foreground border-border";
  }
  
  const statusLower = status?.toLowerCase();
  
  switch (statusLower) {
    case 'in_progress':
    case 'project_details':
    case 'insured_details':
    case 'contract_structure':
    case 'site_risk':
      return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    case 'cover_requirements':
    case 'required_documents':
    case 'plan_selected':
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case 'declaration_documents':
    case 'policy_created':
    case 'approved':
    case 'active':
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case 'draft':
      return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    case 'submitted':
    case 'under_review':
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case 'rejected':
    case 'expired':
      return "bg-red-500/10 text-red-600 border-red-500/20";
    case 'quote_generated':
    case QUOTE_STATUSES.QUOTE_GENERATED:
      return "bg-primary/10 text-primary border-primary/20";
    case 'quote_confirmed':
    case QUOTE_STATUSES.QUOTE_CONFIRMED:
      return "bg-success/10 text-success border-success/20";
    case 'selected_product':
    case QUOTE_STATUSES.SELECTED_PRODUCT:
      return "bg-accent/10 text-accent border-accent/20";
    case 'quote_edited':
    case QUOTE_STATUSES.QUOTE_EDITED:
      return "bg-warning/10 text-warning border-warning/20";
    case 'policy_generated':
    case QUOTE_STATUSES.POLICY_GENERATED:
      return "bg-secondary/10 text-secondary border-secondary/20";
    case 'payment_pending':
    case QUOTE_STATUSES.PAYMENT_PENDING:
      return "bg-warning/10 text-warning border-warning/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export const getQuoteStatusDotColor = (status: QuoteStatus | string): string => {
  // Handle null, undefined, or empty string
  if (!status || status === '') {
    return "bg-muted-foreground";
  }
  
  const statusLower = status?.toLowerCase();
  
  // Map statuses to dot colors
  switch (statusLower) {
    case 'in_progress':
    case 'project_details':
    case 'insured_details':
    case 'contract_structure':
    case 'site_risk':
      return "bg-orange-500"; // In progress statuses
    case 'cover_requirements':
    case 'required_documents':
    case 'plan_selected':
      return "bg-blue-500"; // Review statuses
    case 'declaration_documents':
    case 'policy_created':
    case 'approved':
    case 'active':
      return "bg-green-500"; // Completed statuses
    case 'draft':
      return "bg-gray-500"; // Draft status
    case 'submitted':
    case 'under_review':
      return "bg-yellow-500"; // Under review statuses
    case 'rejected':
    case 'expired':
      return "bg-red-500"; // Negative statuses
    // Legacy status mappings
    case 'quote_generated':
    case QUOTE_STATUSES.QUOTE_GENERATED:
      return "bg-primary";
    case 'quote_confirmed':
    case QUOTE_STATUSES.QUOTE_CONFIRMED:
      return "bg-success";
    case 'selected_product':
    case QUOTE_STATUSES.SELECTED_PRODUCT:
      return "bg-accent";
    case 'quote_edited':
    case QUOTE_STATUSES.QUOTE_EDITED:
      return "bg-warning";
    case 'policy_generated':
    case QUOTE_STATUSES.POLICY_GENERATED:
      return "bg-secondary";
    case 'payment_pending':
    case QUOTE_STATUSES.PAYMENT_PENDING:
      return "bg-warning";
    default:
      return "bg-muted-foreground";
  }
};

export const getQuoteStatusBadge = (status: QuoteStatus | string) => {
  return {
    component: Badge,
    className: getQuoteStatusColor(status),
    label: getQuoteStatusLabel(status)
  };
};