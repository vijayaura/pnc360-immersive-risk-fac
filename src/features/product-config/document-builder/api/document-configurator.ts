import { apiGet, apiPost } from '@/lib/api/client';

export interface Macro {
	label: string;
	name: string;
	type: "STATIC" | "DYNAMIC";
	amountType: string | null;
}

export async function getMacros(productId: string): Promise<Macro[]> {
	return apiGet<Macro[]>(`/document-configurator/${productId}/macros`);
}

export type BackendDocumentTemplate = {
	id: string;
	productId: string;
	documentType: "quote" | "policy" | "endorsement";
	name: string;
	description?: string;
	header?: DocumentBlock[];
	body?: DocumentBlock[];
	footer?: DocumentBlock[];
	createdAt: string;
	updatedAt: string;
};

export type DocumentBlock = {
	id: string;
	type: string;
	data?: unknown;
	styles?: Record<string, unknown>;
};

export async function getDocumentTemplates(
	productId: string
): Promise<BackendDocumentTemplate[]> {
	return apiGet<BackendDocumentTemplate[]>(
		`/document-configurator/${productId}/templates`
	);
}

export async function saveDocumentTemplates(
	productId: string,
	templates: Array<{
		type: "quote" | "policy" | "endorsement";
		name: string;
		description?: string;
		header?: DocumentBlock[];
		body?: DocumentBlock[];
		footer?: DocumentBlock[];
	}>
) {
	return apiPost(`/document-configurator/${productId}/templates`, {
		templates,
	});
}
