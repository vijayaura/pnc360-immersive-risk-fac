export const REFERRAL_STATUSES = {
  OPEN: 'open',
  IN_REVIEW: 'in_review',
  QUERY_RAISED: 'query_raised',
  APPROVED: 'approved',
  APPROVED_WITH_CONDITIONS: 'approved_with_conditions',
  DECLINED: 'declined',
  CLOSED: 'closed',
} as const;

export type ReferralStatus = (typeof REFERRAL_STATUSES)[keyof typeof REFERRAL_STATUSES] | string;

export const getReferralStatusLabel = (status: ReferralStatus): string => {
  if (!status) return 'Unknown';

  const statusMap: Record<string, string> = {
    [REFERRAL_STATUSES.OPEN]: 'Open',
    [REFERRAL_STATUSES.IN_REVIEW]: 'In Review',
    [REFERRAL_STATUSES.QUERY_RAISED]: 'Query Raised',
    [REFERRAL_STATUSES.APPROVED]: 'Approved',
    [REFERRAL_STATUSES.APPROVED_WITH_CONDITIONS]: 'Approved w/ Conditions',
    [REFERRAL_STATUSES.DECLINED]: 'Declined',
    [REFERRAL_STATUSES.CLOSED]: 'Closed',
  };

  return (
    statusMap[status.toLowerCase()] ||
    status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
  );
};

export const getReferralStatusColor = (status: ReferralStatus): string => {
  if (!status) return 'bg-muted text-muted-foreground border-border';

  switch (status.toLowerCase()) {
    case REFERRAL_STATUSES.OPEN:
      return 'bg-primary/10 text-primary border-primary/20';
    case REFERRAL_STATUSES.IN_REVIEW:
    case REFERRAL_STATUSES.QUERY_RAISED:
      return 'bg-warning/10 text-warning border-warning/30';
    case REFERRAL_STATUSES.APPROVED:
    case REFERRAL_STATUSES.APPROVED_WITH_CONDITIONS:
      return 'bg-success/10 text-success border-success/30';
    case REFERRAL_STATUSES.DECLINED:
      return 'bg-destructive/10 text-destructive border-destructive/30';
    case REFERRAL_STATUSES.CLOSED:
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};
