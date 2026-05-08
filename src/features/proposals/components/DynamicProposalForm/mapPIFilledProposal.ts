import type { UploadPIFilledProposalResponse } from '@/lib/api';

/**
 * Maps the server response from an uploaded/scanned PI proposal PDF
 * into the flat key-value shape expected by formData.
 */
export function mapPIFilledProposalToForm(
    response: UploadPIFilledProposalResponse,
): Record<string, unknown> {
    const updates: Record<string, unknown> = {};

    // Basic fields
    if (response.company_name) updates.companyName = response.company_name;
    if (response.trade_license_no) updates.tradeLicenseNo = response.trade_license_no;
    if (response.registered_address) updates.registeredAddress = response.registered_address;
    if (response.contact_person) updates.contactPerson = response.contact_person;
    if (response.email) updates.email = response.email;
    if (response.operating_country) updates.operatingCountry = response.operating_country;
    if (response.preferred_currency) updates.preferredCurrency = response.preferred_currency;
    if (response.years_of_experience) updates.yearsOfExperience = response.years_of_experience;
    if (response.number_of_professionals)
        updates.numberOfProfessionals = response.number_of_professionals;
    if (response.last_12_months_turnover)
        updates.last12MonthsTurnover = response.last_12_months_turnover;
    if (response.estimated_coming_12_months_turnover)
        updates.estimatedComing12MonthsTurnover = response.estimated_coming_12_months_turnover;
    if (response.limit_of_indemnity) updates.limitOfIndemnity = response.limit_of_indemnity;
    if (response.deductible) updates.deductible = response.deductible;
    if (response.aggregate_limit) updates.aggregateLimit = response.aggregate_limit;
    if (response.has_claims) updates.hasClaims = response.has_claims;

    // Claims history
    if (Array.isArray(response.claims_history)) {
        updates.claimsHistory = response.claims_history.map((claim) => ({
            dateOfLoss: claim.claim_date || '',
            description: claim.claim_description || '',
            settledAmount: claim.claim_amount || '',
            outstandingAmount: claim.claim_status || '',
        }));
    }

    // Activity splits
    if (Array.isArray(response.architecture_activity_split)) {
        updates.architectureActivitySplit = response.architecture_activity_split;
    }
    if (Array.isArray(response.engineering_activity_split)) {
        updates.engineeringActivitySplit = response.engineering_activity_split;
    }

    // Extensions
    if (response.extensions_required) {
        updates.extensionsRequired = response.extensions_required;
    }

    return updates;
}
