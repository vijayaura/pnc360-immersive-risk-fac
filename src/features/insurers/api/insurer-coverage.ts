import { apiGet, apiPost, apiPatch } from '@/lib/api/client';

export interface GeographicCoverage {
  countries: string[];
  regions: string[];
  zones: string[];
}
export interface SaveQuoteCoverageRequest {
  productId: string;
  backdateWindowDays: number;
  geography: GeographicCoverage;

  // product_id: number;
  // validity_days: number;
  // backdate_days: number;
  // operating_countries: string[];
  // operating_regions: string[];
  // operating_zones: string[];
}

export interface SaveQuoteCoverageResponse {
  message: string;
}

export interface UpdateQuoteCoverageResponse {
  message: string;
  data: {
    id: number;
    product_id: number;
    backdate_days: number;
    operating_countries: string[];
    operating_regions: string[];
    operating_zones: string[];
    created_at: string;
    updated_at: string;
    insurer_id: number;
  };
}

// POST - Create new quote coverage configuration
export async function saveQuoteCoverage(
  //   insurerId: number | string,
  productId: number | string,
  data: SaveQuoteCoverageRequest,
): Promise<SaveQuoteCoverageResponse> {
  try {
    // const response = await apiPost<SaveQuoteCoverageResponse>(
    //   `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
    //     String(productId),
    //   )}/quote-config`,
    //   data,
    // );
    const response = await apiPost<SaveQuoteCoverageResponse>(
      `/quote-coverage/product/${encodeURIComponent(String(productId))}`,
      data,
    );
    return response;
  } catch (error: any) {
    console.error('❌ POST Quote Coverage Failed:', error);

    // Handle specific error codes
    const status = error?.response?.status;
    if (status === 400) {
      throw new Error('Invalid quote coverage data provided');
    } else if (status === 401) {
      throw new Error('Authentication required to save quote coverage');
    } else if (status === 403) {
      throw new Error('You do not have permission to save quote coverage');
    } else if (status === 500) {
      throw new Error('Server error occurred while saving quote coverage');
    }

    throw new Error(
      error?.response?.data?.message || error?.message || 'Failed to save quote coverage',
    );
  }
}

// PATCH - Update existing quote coverage configuration
export async function updateQuoteCoverage(
  insurerId: number | string,
  productId: number | string,
  data: SaveQuoteCoverageRequest,
): Promise<UpdateQuoteCoverageResponse> {
  console.log('🔄 PATCH Quote Coverage API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/quote-config`,
    payload: data,
  });

  try {
    const response = await apiPatch<UpdateQuoteCoverageResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/quote-config`,
      data,
    );
    console.log('✅ PATCH Quote Coverage Success:', response);
    return response;
  } catch (error: any) {
    console.error('❌ PATCH Quote Coverage Failed:', error);

    // Handle specific error codes
    const status = error?.response?.status;
    if (status === 400) {
      throw new Error('Invalid quote coverage data provided');
    } else if (status === 401) {
      throw new Error('Authentication required to update quote coverage');
    } else if (status === 403) {
      throw new Error('You do not have permission to update quote coverage');
    } else if (status === 500) {
      throw new Error('Server error occurred while updating quote coverage');
    }

    throw new Error(
      error?.response?.data?.message || error?.message || 'Failed to update quote coverage',
    );
  }
}

// ===== CONSTRUCTION TYPES CONFIGURATION API =====

export interface ConstructionTypeConfigItem {
  name: string;
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  value: number;
  quote_option: 'AUTO_QUOTE' | 'MANUAL_QUOTE' | 'NO_QUOTE';
  display_order: number;
  is_active: boolean;
}

export interface GetConstructionTypesConfigResponse {
  items: ConstructionTypeConfigItem[];
}

export interface SaveConstructionTypesConfigRequest {
  construction_types_config: {
    items: ConstructionTypeConfigItem[];
  };
}

export interface SaveConstructionTypesConfigResponse {
  message: string;
  data: {
    items: ConstructionTypeConfigItem[];
  };
}

// Countries Configuration
export interface CountryConfigItem {
  value: number;
  country?: string;
  name?: string; // Some items use 'name' instead of 'country'
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
}

export interface GetCountriesConfigResponse {
  items: CountryConfigItem[];
}

export interface SaveCountriesConfigRequest {
  countries_config: {
    items: {
      country?: string;
      name?: string;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      value: number;
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
    }[];
  };
}

export interface SaveCountriesConfigResponse {
  message: string;
  data: {
    items: CountryConfigItem[];
  };
}

// Regions Configuration
export interface RegionConfigItem {
  name: string;
  value: number;
  is_active: boolean;
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
  display_order: number;
}

export interface GetRegionsConfigResponse {
  items: RegionConfigItem[];
}

export interface SaveRegionsConfigRequest {
  regions_config: {
    items: {
      name: string;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      value: number;
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
      is_active: boolean;
    }[];
  };
}

export interface SaveRegionsConfigResponse {
  message: string;
  data: {
    items: RegionConfigItem[];
  };
}

// Zones Configuration
export interface ZoneConfigItem {
  name: string;
  value: number;
  is_active: boolean;
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
  display_order: number;
}

export interface GetZonesConfigResponse {
  items: ZoneConfigItem[];
}

export interface SaveZonesConfigRequest {
  zones_config: {
    items: {
      name: string;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      value: number;
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
      is_active: boolean;
    }[];
  };
}

export interface SaveZonesConfigResponse {
  message: string;
  data: {
    items: {
      name: string;
      value: number;
      is_active: boolean;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
    }[];
  };
}

// Contract Types Configuration
export interface ContractTypeConfigItem {
  name: string;
  value: number;
  is_active: boolean;
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
  display_order: number;
}

export interface GetContractTypesConfigResponse {
  items: ContractTypeConfigItem[];
}

export interface SaveContractTypesConfigRequest {
  contract_types_config: {
    items: {
      name: string;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      value: number;
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
      is_active: boolean;
    }[];
  };
}

export interface SaveContractTypesConfigResponse {
  message: string;
  data: {
    items: {
      name: string;
      value: number;
      is_active: boolean;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
    }[];
  };
}

// Role Types Configuration
export interface RoleTypeConfigItem {
  name: string;
  value: number;
  is_active: boolean;
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
  display_order: number;
}

export interface GetRoleTypesConfigResponse {
  items: RoleTypeConfigItem[];
}

export interface SaveRoleTypesConfigRequest {
  role_types_config: {
    items: {
      name: string;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      value: number;
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
      is_active: boolean;
    }[];
  };
}

export interface SaveRoleTypesConfigResponse {
  message: string;
  data: {
    items: {
      name: string;
      value: number;
      is_active: boolean;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
    }[];
  };
}

// Soil Types Configuration
export interface SoilTypeConfigItem {
  name: string;
  value: number;
  is_active: boolean;
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
  display_order: number;
}

export interface GetSoilTypesConfigResponse {
  items: SoilTypeConfigItem[];
}

export interface SaveSoilTypesConfigRequest {
  soil_types_config: {
    items: {
      name: string;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      value: number;
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
      is_active: boolean;
    }[];
  };
}

export interface SaveSoilTypesConfigResponse {
  message: string;
  data: {
    items: {
      name: string;
      value: number;
      is_active: boolean;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
    }[];
  };
}

// Subcontractor Types Configuration
export interface SubcontractorTypeConfigItem {
  name: string;
  value: number;
  is_active: boolean;
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
  display_order: number;
}

export interface GetSubcontractorTypesConfigResponse {
  items: SubcontractorTypeConfigItem[];
}

export interface SaveSubcontractorTypesConfigRequest {
  subcontractor_types_config: {
    items: {
      name: string;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      value: number;
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
      is_active: boolean;
    }[];
  };
}

export interface SaveSubcontractorTypesConfigResponse {
  message: string;
  data: {
    items: {
      name: string;
      value: number;
      is_active: boolean;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
    }[];
  };
}

// GET - Fetch subcontractor types configuration for insurer
export async function getSubcontractorTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
): Promise<GetSubcontractorTypesConfigResponse> {
  console.log('🔍 GET Subcontractor Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/subcontractor-types`,
    insurerId,
    productId,
  });

  try {
    const response = await apiGet<GetSubcontractorTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/subcontractor-types`,
    );

    console.log('✅ Subcontractor Types Configuration Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Subcontractor Types Configuration Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while fetching subcontractor types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to subcontractor types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while fetching subcontractor types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to fetch subcontractor types configuration.');
    }
  }
}

// POST - Create subcontractor types configuration for insurer
export async function createSubcontractorTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveSubcontractorTypesConfigRequest,
): Promise<SaveSubcontractorTypesConfigResponse> {
  console.log('🔍 POST Subcontractor Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/subcontractor-types`,
    insurerId,
    productId,
    requestData: data,
  });

  try {
    const response = await apiPost<SaveSubcontractorTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/subcontractor-types`,
      data,
    );

    console.log('✅ Subcontractor Types Configuration POST Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Subcontractor Types Configuration POST Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while creating subcontractor types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error(
        'Forbidden. You do not have access to create subcontractor types configuration.',
      );
    } else if (status >= 500) {
      throw new Error('Server error while creating subcontractor types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to create subcontractor types configuration.');
    }
  }
}

// PATCH - Update subcontractor types configuration for insurer
export async function updateSubcontractorTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveSubcontractorTypesConfigRequest,
): Promise<SaveSubcontractorTypesConfigResponse> {
  console.log('🔍 PATCH Subcontractor Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/subcontractor-types`,
    insurerId,
    productId,
    requestData: data,
  });

  try {
    const response = await apiPatch<SaveSubcontractorTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/subcontractor-types`,
      data,
    );

    console.log('✅ Subcontractor Types Configuration PATCH Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Subcontractor Types Configuration PATCH Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while updating subcontractor types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error(
        'Forbidden. You do not have access to update subcontractor types configuration.',
      );
    } else if (status >= 500) {
      throw new Error('Server error while updating subcontractor types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to update subcontractor types configuration.');
    }
  }
}

// Consultant Roles Configuration interfaces
export interface ConsultantRoleConfigItem {
  name: string;
  value: number;
  is_active: boolean;
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
  display_order: number;
}

export interface GetConsultantRolesConfigResponse {
  items: ConsultantRoleConfigItem[];
}

export interface SaveConsultantRolesConfigRequest {
  consultant_roles_config: {
    items: {
      name: string;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      value: number;
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
      is_active: boolean;
    }[];
  };
}

export interface SaveConsultantRolesConfigResponse {
  message: string;
  data: {
    items: {
      name: string;
      value: number;
      is_active: boolean;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
    }[];
  };
}

// GET - Fetch consultant roles configuration for insurer
export async function getConsultantRolesConfiguration(
  insurerId: number | string,
  productId: number | string,
): Promise<GetConsultantRolesConfigResponse> {
  console.log('🔍 GET Consultant Roles Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/consultant-roles`,
    insurerId,
    productId,
  });

  try {
    const response = await apiGet<GetConsultantRolesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/consultant-roles`,
    );

    console.log('✅ Consultant Roles Configuration Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Consultant Roles Configuration Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while fetching consultant roles configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to consultant roles configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while fetching consultant roles configuration.');
    } else {
      throw new Error(error?.message || 'Failed to fetch consultant roles configuration.');
    }
  }
}

// POST - Create consultant roles configuration for insurer
export async function createConsultantRolesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveConsultantRolesConfigRequest,
): Promise<SaveConsultantRolesConfigResponse> {
  console.log('🔍 POST Consultant Roles Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/consultant-roles`,
    insurerId,
    productId,
    requestData: data,
  });

  try {
    const response = await apiPost<SaveConsultantRolesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/consultant-roles`,
      data,
    );

    console.log('✅ Consultant Roles Configuration POST Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Consultant Roles Configuration POST Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while creating consultant roles configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error(
        'Forbidden. You do not have access to create consultant roles configuration.',
      );
    } else if (status >= 500) {
      throw new Error('Server error while creating consultant roles configuration.');
    } else {
      throw new Error(error?.message || 'Failed to create consultant roles configuration.');
    }
  }
}

// PATCH - Update consultant roles configuration for insurer
export async function updateConsultantRolesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveConsultantRolesConfigRequest,
): Promise<SaveConsultantRolesConfigResponse> {
  console.log('🔍 PATCH Consultant Roles Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/consultant-roles`,
    insurerId,
    productId,
    requestData: data,
  });

  try {
    const response = await apiPatch<SaveConsultantRolesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/consultant-roles`,
      data,
    );

    console.log('✅ Consultant Roles Configuration PATCH Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Consultant Roles Configuration PATCH Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while updating consultant roles configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error(
        'Forbidden. You do not have access to update consultant roles configuration.',
      );
    } else if (status >= 500) {
      throw new Error('Server error while updating consultant roles configuration.');
    } else {
      throw new Error(error?.message || 'Failed to update consultant roles configuration.');
    }
  }
}

// GET - Fetch soil types configuration for insurer
export async function getSoilTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
): Promise<GetSoilTypesConfigResponse> {
  console.log('🔍 GET Soil Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/soil-types`,
    insurerId,
    productId,
  });

  try {
    const response = await apiGet<GetSoilTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/soil-types`,
    );

    console.log('✅ Soil Types Configuration Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Soil Types Configuration Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while fetching soil types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to soil types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while fetching soil types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to fetch soil types configuration.');
    }
  }
}

// POST - Create soil types configuration for insurer
export async function createSoilTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveSoilTypesConfigRequest,
): Promise<SaveSoilTypesConfigResponse> {
  console.log('🔍 POST Soil Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/soil-types`,
    insurerId,
    productId,
    requestData: data,
  });

  try {
    const response = await apiPost<SaveSoilTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/soil-types`,
      data,
    );

    console.log('✅ Soil Types Configuration POST Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Soil Types Configuration POST Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while creating soil types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to create soil types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while creating soil types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to create soil types configuration.');
    }
  }
}

// PATCH - Update soil types configuration for insurer
export async function updateSoilTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveSoilTypesConfigRequest,
): Promise<SaveSoilTypesConfigResponse> {
  console.log('🔍 PATCH Soil Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/soil-types`,
    insurerId,
    productId,
    requestData: data,
  });

  try {
    const response = await apiPatch<SaveSoilTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/soil-types`,
      data,
    );

    console.log('✅ Soil Types Configuration PATCH Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Soil Types Configuration PATCH Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while updating soil types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to update soil types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while updating soil types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to update soil types configuration.');
    }
  }
}

// GET - Fetch role types configuration for insurer
export async function getRoleTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
): Promise<GetRoleTypesConfigResponse> {
  console.log('🔍 GET Role Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/role-types`,
    insurerId,
    productId,
  });

  try {
    const response = await apiGet<GetRoleTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/role-types`,
    );

    console.log('✅ Role Types Configuration Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Role Types Configuration Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while fetching role types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to role types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while fetching role types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to fetch role types configuration.');
    }
  }
}

// POST - Create role types configuration for insurer
export async function createRoleTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveRoleTypesConfigRequest,
): Promise<SaveRoleTypesConfigResponse> {
  console.log('🔍 POST Role Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/role-types`,
    insurerId,
    productId,
    requestData: data,
  });

  try {
    const response = await apiPost<SaveRoleTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/role-types`,
      data,
    );

    console.log('✅ Role Types Configuration POST Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Role Types Configuration POST Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while creating role types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to create role types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while creating role types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to create role types configuration.');
    }
  }
}

// PATCH - Update role types configuration for insurer
export async function updateRoleTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveRoleTypesConfigRequest,
): Promise<SaveRoleTypesConfigResponse> {
  console.log('🔍 PATCH Role Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/role-types`,
    insurerId,
    productId,
    requestData: data,
  });

  try {
    const response = await apiPatch<SaveRoleTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/role-types`,
      data,
    );

    console.log('✅ Role Types Configuration PATCH Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Role Types Configuration PATCH Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while updating role types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to update role types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while updating role types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to update role types configuration.');
    }
  }
}

// GET - Fetch contract types configuration for insurer
export async function getContractTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
): Promise<GetContractTypesConfigResponse> {
  console.log('🔍 GET Contract Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/contract-types`,
    insurerId,
    productId,
  });

  try {
    const response = await apiGet<GetContractTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/contract-types`,
    );

    console.log('✅ Contract Types Configuration Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Contract Types Configuration Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while fetching contract types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to contract types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while fetching contract types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to fetch contract types configuration.');
    }
  }
}

// POST - Create contract types configuration for insurer
export async function createContractTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveContractTypesConfigRequest,
): Promise<SaveContractTypesConfigResponse> {
  console.log('🔍 POST Contract Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/contract-types`,
    insurerId,
    productId,
    requestData: data,
  });

  try {
    const response = await apiPost<SaveContractTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/contract-types`,
      data,
    );

    console.log('✅ Contract Types Configuration POST Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Contract Types Configuration POST Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while creating contract types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to create contract types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while creating contract types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to create contract types configuration.');
    }
  }
}

// PATCH - Update contract types configuration for insurer
export async function updateContractTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveContractTypesConfigRequest,
): Promise<SaveContractTypesConfigResponse> {
  console.log('🔍 PATCH Contract Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/contract-types`,
    insurerId,
    productId,
    requestData: data,
  });

  try {
    const response = await apiPatch<SaveContractTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/contract-types`,
      data,
    );

    console.log('✅ Contract Types Configuration PATCH Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Contract Types Configuration PATCH Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while updating contract types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to update contract types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while updating contract types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to update contract types configuration.');
    }
  }
}

// GET - Fetch zones configuration for insurer
export async function getZonesConfiguration(
  insurerId: number | string,
  productId: number | string,
): Promise<GetZonesConfigResponse> {
  console.log('🔍 GET Zones Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/zones`,
    insurerId,
    productId,
  });

  try {
    const response = await apiGet<GetZonesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/zones`,
    );

    console.log('✅ Zones Configuration Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Zones Configuration Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while fetching zones configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to zones configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while fetching zones configuration.');
    } else {
      throw new Error(error?.message || 'Failed to fetch zones configuration.');
    }
  }
}

// POST - Create zones configuration for insurer
export async function createZonesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveZonesConfigRequest,
): Promise<SaveZonesConfigResponse> {
  console.log('🔍 POST Zones Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/zones`,
    insurerId,
    productId,
    requestData: data,
  });

  try {
    const response = await apiPost<SaveZonesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/zones`,
      data,
    );

    console.log('✅ Zones Configuration POST Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Zones Configuration POST Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while creating zones configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to create zones configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while creating zones configuration.');
    } else {
      throw new Error(error?.message || 'Failed to create zones configuration.');
    }
  }
}

// PATCH - Update zones configuration for insurer
export async function updateZonesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveZonesConfigRequest,
): Promise<SaveZonesConfigResponse> {
  console.log('🔍 PATCH Zones Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/zones`,
    insurerId,
    productId,
    requestData: data,
  });

  try {
    const response = await apiPatch<SaveZonesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/zones`,
      data,
    );

    console.log('✅ Zones Configuration PATCH Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Zones Configuration PATCH Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while updating zones configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to update zones configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while updating zones configuration.');
    } else {
      throw new Error(error?.message || 'Failed to update zones configuration.');
    }
  }
}

// GET - Fetch regions configuration for insurer
export async function getRegionsConfiguration(
  insurerId: number | string,
  productId: number | string,
): Promise<GetRegionsConfigResponse> {
  console.log('🔍 GET Regions Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/regions`,
    insurerId,
    productId,
  });

  try {
    const response = await apiGet<GetRegionsConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/regions`,
    );

    console.log('✅ Regions Configuration Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Regions Configuration Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while fetching regions configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to regions configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while fetching regions configuration.');
    } else {
      throw new Error(error?.message || 'Failed to fetch regions configuration.');
    }
  }
}

// POST - Create regions configuration for insurer
export async function createRegionsConfiguration(
  insurerId: number | string,
  productId: number | string,
  body: SaveRegionsConfigRequest,
): Promise<SaveRegionsConfigResponse> {
  console.log('🔍 POST Regions Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/regions`,
    insurerId,
    productId,
    body,
  });

  try {
    const response = await apiPost<SaveRegionsConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/regions`,
      body,
    );

    console.log('✅ Regions Configuration POST Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Regions Configuration POST Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Invalid data while creating regions configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to create regions configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while creating regions configuration.');
    } else {
      throw new Error(error?.message || 'Failed to create regions configuration.');
    }
  }
}

// PATCH - Update regions configuration for insurer
export async function updateRegionsConfiguration(
  insurerId: number | string,
  productId: number | string,
  body: SaveRegionsConfigRequest,
): Promise<SaveRegionsConfigResponse> {
  console.log('🔍 PATCH Regions Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/regions`,
    insurerId,
    productId,
    body,
  });

  try {
    const response = await apiPatch<SaveRegionsConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/regions`,
      body,
    );

    console.log('✅ Regions Configuration PATCH Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Regions Configuration PATCH Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Invalid data while updating regions configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to update regions configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while updating regions configuration.');
    } else {
      throw new Error(error?.message || 'Failed to update regions configuration.');
    }
  }
}

// GET - Fetch countries configuration for insurer
export async function getCountriesConfiguration(
  insurerId: number | string,
  productId: number | string,
): Promise<GetCountriesConfigResponse> {
  console.log('🔍 GET Countries Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/countries`,
    insurerId,
    productId,
  });

  try {
    const response = await apiGet<GetCountriesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/countries`,
    );

    console.log('✅ Countries Configuration Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Countries Configuration Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while fetching countries configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to countries configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while fetching countries configuration.');
    } else {
      throw new Error(error?.message || 'Failed to fetch countries configuration.');
    }
  }
}

// POST - Create countries configuration for insurer
export async function createCountriesConfiguration(
  insurerId: number | string,
  productId: number | string,
  body: SaveCountriesConfigRequest,
): Promise<SaveCountriesConfigResponse> {
  console.log('🔍 POST Countries Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/countries`,
    insurerId,
    productId,
    body,
  });

  try {
    const response = await apiPost<SaveCountriesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/countries`,
      body,
    );

    console.log('✅ Countries Configuration POST Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Countries Configuration POST Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Invalid data while creating countries configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to create countries configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while creating countries configuration.');
    } else {
      throw new Error(error?.message || 'Failed to create countries configuration.');
    }
  }
}

// PATCH - Update countries configuration for insurer
export async function updateCountriesConfiguration(
  insurerId: number | string,
  productId: number | string,
  body: SaveCountriesConfigRequest,
): Promise<SaveCountriesConfigResponse> {
  console.log('🔍 PATCH Countries Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/countries`,
    insurerId,
    productId,
    body,
  });

  try {
    const response = await apiPatch<SaveCountriesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/countries`,
      body,
    );

    console.log('✅ Countries Configuration PATCH Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Countries Configuration PATCH Error:', error);

    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Invalid data while updating countries configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to update countries configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while updating countries configuration.');
    } else {
      throw new Error(error?.message || 'Failed to update countries configuration.');
    }
  }
}

// GET - Fetch construction types configuration for insurer
export async function getConstructionTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
): Promise<GetConstructionTypesConfigResponse> {
  console.log('🔍 GET Construction Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/construction-types`,
    insurerId,
    productId,
  });

  try {
    const response = await apiGet<GetConstructionTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/construction-types`,
    );
    console.log('✅ GET Construction Types Configuration Success:', response);
    return response;
  } catch (error: any) {
    console.error('❌ GET Construction Types Configuration Failed:', error);

    // Handle specific error codes
    const status = error?.response?.status;
    if (status === 400) {
      throw new Error('Invalid request for construction types configuration');
    } else if (status === 401) {
      throw new Error('Authentication required to fetch construction types configuration');
    } else if (status === 403) {
      throw new Error('You do not have permission to view construction types configuration');
    } else if (status === 500) {
      throw new Error('Server error occurred while fetching construction types configuration');
    }

    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch construction types configuration',
    );
  }
}

// POST - Create construction types configuration for insurer
export async function createConstructionTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  configData: SaveConstructionTypesConfigRequest,
): Promise<SaveConstructionTypesConfigResponse> {
  console.log('🔍 POST Construction Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/construction-types`,
    insurerId,
    productId,
    configData,
  });

  try {
    const response = await apiPost<SaveConstructionTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/construction-types`,
      configData,
    );
    console.log('✅ POST Construction Types Configuration Success:', response);
    return response;
  } catch (error: any) {
    console.error('❌ POST Construction Types Configuration Failed:', error);

    const status = error?.response?.status;
    if (status === 400) {
      throw new Error('Invalid construction types configuration data');
    } else if (status === 401) {
      throw new Error('Authentication required to create construction types configuration');
    } else if (status === 403) {
      throw new Error('You do not have permission to create construction types configuration');
    } else if (status === 500) {
      throw new Error('Server error occurred while creating construction types configuration');
    }

    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        'Failed to create construction types configuration',
    );
  }
}

// PATCH - Update construction types configuration for insurer
export async function updateConstructionTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  configData: SaveConstructionTypesConfigRequest,
): Promise<SaveConstructionTypesConfigResponse> {
  console.log('🔍 PATCH Construction Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
      String(productId),
    )}/construction-types`,
    insurerId,
    productId,
    configData,
  });

  try {
    const response = await apiPatch<SaveConstructionTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(
        String(productId),
      )}/construction-types`,
      configData,
    );
    console.log('✅ PATCH Construction Types Configuration Success:', response);
    return response;
  } catch (error: any) {
    console.error('❌ PATCH Construction Types Configuration Failed:', error);

    const status = error?.response?.status;
    if (status === 400) {
      throw new Error('Invalid construction types configuration data');
    } else if (status === 401) {
      throw new Error('Authentication required to update construction types configuration');
    } else if (status === 403) {
      throw new Error('You do not have permission to update construction types configuration');
    } else if (status === 500) {
      throw new Error('Server error occurred while updating construction types configuration');
    }

    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        'Failed to update construction types configuration',
    );
  }
}

// ===== FEE TYPES CONFIGURATION =====

// Fee Types Configuration Interfaces
