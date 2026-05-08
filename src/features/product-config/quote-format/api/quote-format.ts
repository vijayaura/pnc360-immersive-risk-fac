import { apiGet, apiRequest } from '@/lib/api/client';
import { apiPost } from '@/lib/api/client';

export interface QuoteFormatDTO {
	templateId: string;
	headerBgColor?: string;
	headerTextColor?: string;
	headerTextPosition?: "left" | "center" | "right";
	footerVisible: boolean;
	footerBgColor?: string;
	footerTextColor?: string;
	disclaimerVisible: boolean;
	regulatoryInfoVisible: boolean;
	signatureVisible: boolean;
	signatureName?: string;
	signatureTitle?: string;
	signatureFileId?: string;
	stampVisible?: boolean;
	stampLabel?: string;
	stampFileId?: string;
	logoFileId?: string;
	logoUrl?: string;
	signatureUrl?: string;
	stampUrl?: string;
	staticMacroOverrides?: Record<string, string>;
}

export async function getQuoteFormatByTemplate(
	templateId: string
): Promise<QuoteFormatDTO | null> {
	return apiGet<QuoteFormatDTO | null>(
		`/quote-format/template/${encodeURIComponent(templateId)}`
	);
}

export async function saveQuoteFormatByTemplate(
	templateId: string,
	dto: Partial<QuoteFormatDTO>,
	files?: { logo?: File | null; signature?: File | null; stamp?: File | null }
): Promise<QuoteFormatDTO> {
	const formData = new FormData();

	// Append DTO fields (only primitives or JSON strings)
	if (dto.headerBgColor) formData.append("headerBgColor", dto.headerBgColor);
	if (dto.headerTextColor)
		formData.append("headerTextColor", dto.headerTextColor);
	if (dto.headerTextPosition)
		formData.append("headerTextPosition", dto.headerTextPosition);
	formData.append("footerVisible", String(!!dto.footerVisible));
	if (dto.footerBgColor) formData.append("footerBgColor", dto.footerBgColor);
	if (dto.footerTextColor)
		formData.append("footerTextColor", dto.footerTextColor);
	formData.append("disclaimerVisible", String(!!dto.disclaimerVisible));
	formData.append("regulatoryInfoVisible", String(!!dto.regulatoryInfoVisible));
	formData.append("signatureVisible", String(!!dto.signatureVisible));
	if (dto.stampVisible !== undefined) {
		formData.append("stampVisible", String(!!dto.stampVisible));
	}
	if (dto.signatureName) formData.append("signatureName", dto.signatureName);
	if (dto.signatureTitle) formData.append("signatureTitle", dto.signatureTitle);
	if (dto.signatureFileId)
		formData.append("signatureFileId", dto.signatureFileId);
	if (dto.stampLabel) formData.append("stampLabel", dto.stampLabel);
	if (dto.stampFileId) formData.append("stampFileId", dto.stampFileId);
	if (dto.logoFileId) formData.append("logoFileId", dto.logoFileId);
	if (dto.staticMacroOverrides) {
		formData.append(
			"staticMacroOverrides",
			JSON.stringify(dto.staticMacroOverrides)
		);
	}

	if (files?.logo) {
		formData.append("logo", files.logo);
	}
	if (files?.signature) {
		formData.append("signature", files.signature);
	}
	if (files?.stamp) {
		formData.append("stamp", files.stamp);
	}

	return apiRequest<QuoteFormatDTO>(
		`/quote-format/template/${encodeURIComponent(templateId)}`,
		{
			method: "POST",
			data: formData,
			headers: { "Content-Type": "multipart/form-data" },
		}
	);
}

export async function generateQuotePdf(
	templateId: string,
	payload: {
		values?: Record<string, string>;
		hiddenTypes?: string[];
		footerVisible?: boolean;
		disclaimerVisible?: boolean;
		regulatoryInfoVisible?: boolean;
		signatureVisible?: boolean;
		template?: {
			header?: Array<{
				id: string;
				type: string;
				data?: Record<string, any>;
				styles?: Record<string, any>;
			}>;
			body?: Array<{
				id: string;
				type: string;
				data?: Record<string, any>;
				styles?: Record<string, any>;
			}>;
			footer?: Array<{
				id: string;
				type: string;
				data?: Record<string, any>;
				styles?: Record<string, any>;
			}>;
		};
	}
): Promise<Blob> {
	return apiPost<Blob>(
		`/quote-format/template/${encodeURIComponent(templateId)}/pdf`,
		payload,
		{ responseType: "blob" }
	);
}
