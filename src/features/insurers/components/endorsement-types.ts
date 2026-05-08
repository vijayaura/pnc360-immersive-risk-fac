import type { EndorsementListItem } from "@/lib/api/endorsements";

/** API status values (lowercase). Use for request payloads. */
export enum ENDORSEMENT_STATUS {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export type EndorsementType =
  | "Escalation Clause Endorsement"
  | "Additional Work/Extension of Scope"
  | "Extension of Policy Period"
  | "Third-Party Liability Increase"
  | "Temporary Works Endorsement"
  | "Expediting Expenses Endorsement"
  | "Removal of Debris Cost Endorsement"
  | "Surrounding Property Endorsement"
  | "Professional Fees Endorsement"
  | "Fire & Allied Perils Endorsement"
  | "Theft Endorsement"
  | "Natural Catastrophes Endorsement"
  | "Principal's Additional Insured Endorsement"
  | "Machinery and Equipment Endorsement"
  | "Cancellation Endorsement";

export type RequestedBy = "Broker" | "Customer" | "Underwriter";
export type Status = "Draft" | "Submitted" | "Approved" | "Rejected";

export interface ApprovalStep {
  id: string;
  approver: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  timestamp?: string;
  comments?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface Endorsement {
  id: string;
  endorsementType: EndorsementType;
  policyNumber: string;
  endorsementReference: string;
  effectiveDate: Date | null;
  requestedBy: RequestedBy;
  natureOfChange: string;
  sumInsuredAdjustment: number;
  premiumAdjustment: number;
  supportingDocuments: File[];
  remarks: string;
  status: Status;
  approvalWorkflow: ApprovalStep[];
  auditTrail: AuditLog[];
}

export interface EndorsementListRow {
  id: string;
  endorsementReference: string;
  policyNumber: string;
  endorsementType: string;
  effectiveDate: Date | null;
  createdAt: Date | null;
  requestedBy: string;
  status: Status;
  totalEndorsementAmount?: number | null;
  isUnreadEndorsement?: boolean;
  unreadMessageCount?: number;
  sumInsuredAdjustment?: number;
  premiumAdjustment?: number;
  natureOfChange?: string;
}

export function mapApiStatusToStatus(s: string): Status {
  const lower = (s || "").toLowerCase();
  if (lower === "draft") return "Draft";
  if (lower === "submitted") return "Submitted";
  if (lower === "approved") return "Approved";
  if (lower === "rejected") return "Rejected";
  return "Draft";
}

/** Map display Status to API payload value (ENDORSEMENT_STATUS). */
export function mapStatusToApiStatus(s: Status): ENDORSEMENT_STATUS {
  switch (s) {
    case "Draft":
      return ENDORSEMENT_STATUS.DRAFT;
    case "Submitted":
      return ENDORSEMENT_STATUS.SUBMITTED;
    case "Approved":
      return ENDORSEMENT_STATUS.APPROVED;
    case "Rejected":
      return ENDORSEMENT_STATUS.REJECTED;
    default:
      return ENDORSEMENT_STATUS.DRAFT;
  }
}

/** Map API type (technical, non_technical, cancellation, extensions) to display label matching the endorsement type dropdown. */
export function mapApiTypeToDisplay(type: string): string {
  const t = (type || "").toLowerCase().replace(/-/g, "_");
  if (t === "cancellation") return "Cancellation";
  if (t === "technical") return "Financial";
  if (t === "non_technical") return "Non-Financial";
  if (t === "extensions") return "Extension";
  return type || "—";
}

function formatRequestedBy(value: string): string {
  if (!value || !value.trim()) return "—";
  const lower = value.trim().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function mapListItemToRow(item: EndorsementListItem): EndorsementListRow {
  return {
    id: item.endorsementId,
    endorsementReference: item.endorsementReference,
    policyNumber: item.policyNumber,
    endorsementType: mapApiTypeToDisplay(item.type),
    effectiveDate: item.effectiveDate ? new Date(item.effectiveDate) : null,
    createdAt: item.createdAt ? new Date(item.createdAt) : null,
    requestedBy: item.requestedBy ? formatRequestedBy(item.requestedBy) : "—",
    status: mapApiStatusToStatus(item.status),
    totalEndorsementAmount:
      item.totalEndorsementAmount == null ? null : Number(item.totalEndorsementAmount),
    isUnreadEndorsement: Boolean(item.isUnreadEndorsement),
    unreadMessageCount: Number(item.unreadMessageCount || 0),
  };
}
