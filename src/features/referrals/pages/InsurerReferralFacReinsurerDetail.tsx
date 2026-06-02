import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import ReinsurerBrokerRequestDetails from '@/features/reinsurer-brokers/pages/ReinsurerBrokerRequestDetails';

/**
 * Insurer referral → reinsurance → facultative reinsurer-line detail (demo).
 * Same shell as `/reinsurer-broker/referral/:recordId/reinsurer/:id` (journey, summary, tabs, placement);
 * path overrides keep navigation within the insurer referral (Back returns to referral overview, not reinsurance handling).
 */
export default function InsurerReferralFacReinsurerDetail() {
  const { referralId } = useParams<{ referralId: string }>();

  const pathOverrides = useMemo(
    () =>
      referralId
        ? {
            referralBase: `/insurer/referral/${referralId}/reinsurance/fac`,
            dashboard: `/insurer/referral/${referralId}`,
            /** Return to referral overview, not the reinsurance handling sub-route. */
            backFromReinsurerDetail: `/insurer/referral/${referralId}`,
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
      embedInwardFacLayout
    />
  );
}
