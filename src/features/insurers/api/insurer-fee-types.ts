import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api/client';

export interface FeeTypeConfigItem {
  label: string;
  value: number;
  status: 'ACTIVE' | 'INACTIVE';
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  display_order: number;
}

export interface GetFeeTypesConfigResponse {
  items: FeeTypeConfigItem[];
}

// Get Fee Types Configuration
export const getFeeTypesConfiguration = async (
  insurerId: string,
  productId: string,
): Promise<GetFeeTypesConfigResponse> => {
  console.log('🎯 === GET FEE TYPES CONFIGURATION STARTED ===');
  console.log('📋 Request params:', { insurerId, productId });

  try {
    console.log('🔍 Calling GET /fee-types API...');
    const response = await apiGet<GetFeeTypesConfigResponse>(
      `/insurers/${insurerId}/products/${productId}/fee-types`,
    );

    console.log('✅ Fee Types Configuration API Response:', response);
    console.log('📊 Items count:', response?.items?.length || 0);

    if (response?.items) {
      console.log('📝 Fee types items:', response.items);
    }

    console.log('🎯 === GET FEE TYPES CONFIGURATION SUCCESS ===');
    return response;
  } catch (error: any) {
    console.error('❌ Error fetching fee types configuration:', error);

    const status = error?.status || error?.response?.status;
    console.error('📊 Error status:', status);
    console.error('📋 Error details:', error?.response?.data || error?.message);

    if (status === 400) {
      throw new Error('Bad request while loading fee types configuration');
    } else if (status === 401) {
      throw new Error('Authentication required to access fee types configuration');
    } else if (status === 403) {
      throw new Error('You do not have permission to access fee types configuration');
    } else if (status === 500) {
      throw new Error('Server error occurred while loading fee types configuration');
    }

    throw new Error(
      error?.response?.data?.message || error?.message || 'Failed to load fee types configuration',
    );
  }
};

// Save Fee Types Configuration Request/Response Interfaces
export interface SaveFeeTypesConfigRequest {
  fee_types_config: {
    items: {
      label: string;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      value: number;
      status: 'ACTIVE' | 'INACTIVE';
      display_order: number;
    }[];
  };
}

export interface SaveFeeTypesConfigResponse {
  message: string;
  data: {
    items: FeeTypeConfigItem[];
  };
}

// Create Fee Types Configuration (POST)
export const createFeeTypesConfiguration = async (
  insurerId: string,
  productId: string,
  configData: SaveFeeTypesConfigRequest,
): Promise<SaveFeeTypesConfigResponse> => {
  console.log('🎯 === CREATE FEE TYPES CONFIGURATION STARTED ===');
  console.log('📋 Request params:', { insurerId, productId });
  console.log('📝 Request data:', configData);

  try {
    console.log('🔍 Calling POST /fee-types API...');
    const response = await apiPost<SaveFeeTypesConfigResponse>(
      `/insurers/${insurerId}/products/${productId}/fee-types`,
      configData,
    );

    console.log('✅ Create Fee Types Configuration API Response:', response);
    console.log('📊 Items count:', response?.data?.items?.length || 0);

    if (response?.data?.items) {
      console.log('📝 Created fee types items:', response.data.items);
    }

    console.log('🎯 === CREATE FEE TYPES CONFIGURATION SUCCESS ===');
    return response;
  } catch (error: any) {
    console.error('❌ Error creating fee types configuration:', error);

    const status = error?.status || error?.response?.status;
    console.error('📊 Error status:', status);
    console.error('📋 Error details:', error?.response?.data || error?.message);

    if (status === 400) {
      throw new Error('Bad request while creating fee types configuration');
    } else if (status === 401) {
      throw new Error('Authentication required to create fee types configuration');
    } else if (status === 403) {
      throw new Error('You do not have permission to create fee types configuration');
    } else if (status === 500) {
      throw new Error('Server error occurred while creating fee types configuration');
    }

    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Failed to create fee types configuration',
    );
  }
};

// Update Fee Types Configuration (PATCH)
export const updateFeeTypesConfiguration = async (
  insurerId: string,
  productId: string,
  configData: SaveFeeTypesConfigRequest,
): Promise<SaveFeeTypesConfigResponse> => {
  console.log('🎯 === UPDATE FEE TYPES CONFIGURATION STARTED ===');
  console.log('📋 Request params:', { insurerId, productId });
  console.log('📝 Request data:', configData);

  try {
    console.log('🔍 Calling PATCH /fee-types API...');
    const response = await apiPatch<SaveFeeTypesConfigResponse>(
      `/insurers/${insurerId}/products/${productId}/fee-types`,
      configData,
    );

    console.log('✅ Update Fee Types Configuration API Response:', response);
    console.log('📊 Items count:', response?.data?.items?.length || 0);

    if (response?.data?.items) {
      console.log('📝 Updated fee types items:', response.data.items);
    }

    console.log('🎯 === UPDATE FEE TYPES CONFIGURATION SUCCESS ===');
    return response;
  } catch (error: any) {
    console.error('❌ Error updating fee types configuration:', error);

    const status = error?.status || error?.response?.status;
    console.error('📊 Error status:', status);
    console.error('📋 Error details:', error?.response?.data || error?.message);

    if (status === 400) {
      throw new Error('Bad request while updating fee types configuration');
    } else if (status === 401) {
      throw new Error('Authentication required to update fee types configuration');
    } else if (status === 403) {
      throw new Error('You do not have permission to update fee types configuration');
    } else if (status === 500) {
      throw new Error('Server error occurred while updating fee types configuration');
    }

    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Failed to update fee types configuration',
    );
  }
};

// Get quote coverage
export interface QuoteCoverageResponse {
  id: string;
  productId: string;
  organizationId: string;
  marketUserId: string;
  validityDays: number;
  backdateWindowDays: number;
  status: string; // "active" | "inactive" (optional strict typing)
  geography: GeographyEntry[];
  createdById: string;
  updatedById: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface GeographyEntry {
  id: string;
  quoteCoverageId: string;
  masterType: 'country' | 'region' | 'zone';
  masterValueId: string;
  createdAt: string; // ISO date string
}

export async function getQuoteCoverage(productId: string): Promise<QuoteCoverageResponse> {
  try {
    const response = await apiGet<QuoteCoverageResponse>(`/quote-coverage/product/${productId}`);

    return response;
  } catch (error: any) {
    console.error('❌ Error fetching fee types configuration:', error);

    const status = error?.status || error?.response?.status;
    console.error('📊 Error status:', status);
    console.error('📋 Error details:', error?.response?.data || error?.message);

    if (status === 400) {
      throw new Error('Bad request while loading fee types configuration');
    } else if (status === 401) {
      throw new Error('Authentication required to access fee types configuration');
    } else if (status === 403) {
      throw new Error('You do not have permission to access fee types configuration');
    } else if (status === 500) {
      throw new Error('Server error occurred while loading fee types configuration');
    }

    throw new Error(
      error?.response?.data?.message || error?.message || 'Failed to load fee types configuration',
    );
  }
}
