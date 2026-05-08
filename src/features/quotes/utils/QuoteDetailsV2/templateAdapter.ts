import type { ProposalBundleResponseV2, ProposalBundleResponse } from '@/features/quotes/api/quotes';

// Convert V2 template response into a minimal shape compatible with existing UI expectations
export function convertV2ToViewModel(v2: ProposalBundleResponseV2): ProposalBundleResponse {
  const { template, responseId, status } = v2;

  const extract = (fieldName: string): any => {
    const searchTerms = [fieldName.toLowerCase()];

    for (const page of template?.pages ?? []) {
      for (const section of page.sections ?? []) {
        for (const field of section.fields ?? []) {
          const id = field.id?.toLowerCase() || '';
          const name = field.name?.toLowerCase() || '';
          const label = field.label?.toLowerCase() || '';

          if (searchTerms.some((term) => id === term || name === term || label === term)) {
            return field.value ?? null;
          }
        }
      }
    }
    return null;
  };

  // Dedicated function to find the address by field type
  const extractAddress = (): string => {
    for (const page of template?.pages ?? []) {
      for (const section of page.sections ?? []) {
        for (const field of section.fields ?? []) {
          // match by field type (most reliable)
          if (field.type === 'location' && field.value) {
            return String(field.value);
          }
        }
      }
    }
    return '';
  };

  const quoteIdNum = parseInt(v2.responseId) || 0;
  const resolvedFullAddress = extractAddress();

  // Split "Address | Lat, Lng" format if present
  const [addressPart, coordsPart] = resolvedFullAddress.includes('|')
    ? resolvedFullAddress.split('|').map((s) => s.trim())
    : [resolvedFullAddress, ''];
  const [lat, lng] = coordsPart.includes(',')
    ? coordsPart.split(',').map((s) => s.trim())
    : ['', ''];

  return {
    project_id: quoteIdNum,
    quote_meta: {
      quote_id: quoteIdNum,
      quote_reference_number: template.name || 'N/A',
      status: status || 'draft',
      insurer_id: extract('insurer_id') || 0,
      broker_id: extract('broker_id') || 0,
      validity_date: extract('validity_date') || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    project: {
      id: quoteIdNum,
      project_id: v2.responseId,
      broker_id: extract('broker_id') || 0,
      broker_company_id: 0,
      broker_company_name: '',
      broker_user_id: 0,
      broker_user_name: '',
      broker_user_role: '',
      broker_user_type: '',
      client_name: '',
      project_name: extract('project_name') || '',
      project_type: extract('project_type') || '',
      sub_project_type: '',
      construction_type: '',
      address: addressPart,
      country: '',
      region: '',
      zone: '',
      latitude: lat,
      longitude: lng,
      sum_insured: String(extract('sum_insured') || ''),
      start_date: extract('start_date') || '',
      completion_date: extract('completion_date') || '',
      construction_period_months: 0,
      maintenance_period_months: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    insured: {
      details: {
        id: 0,
        project_id: quoteIdNum,
        insured_name: extract('insured_name') || '',
        role_of_insured: '',
        had_losses_last_5yrs: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      claims: [],
    },
    contract_structure: {
      details: {
        id: 0,
        project_id: quoteIdNum,
        main_contractor: '',
        principal_owner: '',
        contract_type: extract('contract_type') || '',
        contract_number: '',
        experience_years: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      sub_contractors: [],
      consultants: [],
    },
    site_risks: {
      id: 0,
      project_id: quoteIdNum,
      near_water_body: 0,
      flood_prone_zone: 0,
      within_city_center: extract('within_city_center') || 'no',
      soil_type: extract('soil_type') || '',
      existing_structure: 0,
      blasting_or_deep_excavation: 0,
      site_security_arrangements: '',
      area_type: extract('area_type') || '',
      describe_existing_structure: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    cover_requirements: {
      id: 0,
      project_id: quoteIdNum,
      project_value: '',
      contract_works: '',
      plant_and_equipment: '',
      temporary_works: '',
      other_materials: '',
      principals_property: '',
      cross_liability_cover: '',
      sum_insured: String(extract('sum_insured') || ''),
      computed_sum_insured: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    required_documents: {},
    plans: [],
    required_documents_for_policy_issue: {},
  };
}
