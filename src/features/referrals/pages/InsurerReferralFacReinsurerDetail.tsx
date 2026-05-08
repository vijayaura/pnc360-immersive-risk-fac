import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import ReinsurerBrokerRequestDetails from '@/features/reinsurer-brokers/pages/ReinsurerBrokerRequestDetails';

/**
 * Insurer referral → reinsurance → facultative reinsurer-line detail (demo).
 * Reuses reinsurer-broker reinsurer panels with path overrides so Back returns to the referral reinsurance breakdown.
 */
export default function InsurerReferralFacReinsurerDetail() {
  const { referralId } = useParams<{ referralId: string }>();

  const pathOverrides = useMemo(
    () =>
      referralId
        ? {
            referralBase: `/insurer/referral/${referralId}/reinsurance/fac`,
            dashboard: `/insurer/referral/${referralId}`,
            backFromReinsurerDetail: `/insurer/referral/${referralId}/reinsurance`,
          }
        : undefined,
    [referralId],
  );

  if (!pathOverrides) {
    return null;
  }

  return (
    <ReinsurerBrokerRequestDetails
      portal="broker"
      pathOverrides={pathOverrides}
      requesterChatRole="insurer"
      submissionSourceLabel="Insurer underwriting referral"
    />
  );
}
