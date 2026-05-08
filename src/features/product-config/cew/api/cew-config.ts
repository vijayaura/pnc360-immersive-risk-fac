import { api, apiPost, apiGet } from "@/lib/api/client";

export type TplExtension = {
	id: number | string;
	title: string;
	description: string;
	tplLimitValue: string;
	pricingType: "percentage" | "fixed";
	loadingDiscount: number;
};

export type AdjustmentType = "percentage" | "currency";

export type ClauseTypeDto = "CLAUSE" | "EXCLUSION" | "WARRANTY";
export type ClauseShowTypeDto = "MANDATORY" | "OPTIONAL";

export type ProductCewPricingDto = {
  id?: string;
  label: string;
  limits?: string;
  type: AdjustmentType;
  adjustmentValue: number;
  isActive: boolean;
};

export type SaveProductCewDto = {
	id?: string;
	clauseCode: string;
	title: string;
	purposeDescription?: string;
	type: ClauseTypeDto;
	adjustmentType: AdjustmentType;
	adjustmentValue?: number;
	showType: ClauseShowTypeDto;
	clauseContent?: string;
	displayOrder?: number;
	isActive?: boolean;
    clausesPricing?: ProductCewPricingDto[];
    selectedCoverIds?: string[];
};

export type ProductCewResponseDto = {
	id: string;
	clauseCode: string;
	title: string;
	purposeDescription?: string;
	type: ClauseTypeDto;
	showType: ClauseShowTypeDto;
	adjustmentType: AdjustmentType;
	adjustmentValue?: number;
	clauseContent?: string;
	displayOrder: number;
	isActive: boolean;
    clausesPricing?: ProductCewPricingDto[];
    selectedCoverIds?: string[];
};

export async function saveProductCew(
	productId: string,
	body: SaveProductCewDto
): Promise<ProductCewResponseDto> {
	return apiPost<ProductCewResponseDto>(
		`/cew-configuration/product/${encodeURIComponent(productId)}/product-cew`,
		body
	);
}

export async function updateProductCew(
	productId: string,
	body: SaveProductCewDto
): Promise<ProductCewResponseDto> {
	return saveProductCew(productId, body);
}

export async function deleteProductCew(
	productId: string,
	body: SaveProductCewDto
): Promise<ProductCewResponseDto> {
	return saveProductCew(productId, { ...body, isActive: false });
}

export function toClauseTypeDto(v: string): ClauseTypeDto {
	const t = String(v || "").toUpperCase();
	return t === "EXCLUSION"
		? "EXCLUSION"
		: t === "WARRANTY"
		? "WARRANTY"
		: "CLAUSE";
}

export function toShowTypeDto(v: string): ClauseShowTypeDto {
	const t = String(v || "").toUpperCase();
	return t === "MANDATORY" ? "MANDATORY" : "OPTIONAL";
}

export async function exportCewConfiguration(productId: string): Promise<Blob> {
	const response = await api.get(
		`/cew-configuration/product/${encodeURIComponent(productId)}/export`,
		{
			headers: {
				Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			},
			responseType: 'blob',
		},
	);
	return response.data;
}

export async function importCewConfiguration(productId: string, file: File): Promise<void> {
	const formData = new FormData();
	formData.append('file', file);
	return apiPost(
		`/cew-configuration/product/${encodeURIComponent(productId)}/import`,
		formData,
		{ headers: { 'Content-Type': 'multipart/form-data' } },
	);
}
