// ─────────────────────────────────────────────────────────────────────────────
// ProposalFormDesign — Shared Types
// ─────────────────────────────────────────────────────────────────────────────

import {
    type Page,
    type Section,
    type Field,
    SubField,
} from '@/features/product-config/proposal-form/api/proposalFormDesign';

export type { Page, Section, Field, SubField };

// ── Field / Page enums ────────────────────────────────────────────────────────

export type FieldType =
    | 'text'
    | 'textarea'
    | 'number'
    | 'dropdown'
    | 'date'
    | 'time'
    | 'datePeriod'
    | 'checkbox'
    | 'consent'
    | 'file'
    | 'multiselect'
    | 'multiselectDropdown'
    | 'location'
    | 'combination'
    | 'chooseButton'
    | 'policyPeriod';

export type PageType =
    | 'general'
    | 'form'
    | 'payment'
    | 'quotesList'
    | 'policyDetails'
    | 'underwritingDocuments'
    | 'requiredDocuments';

export type OptionsSourceMode =
    | 'static'
    | 'url'
    | 'globalMaster'
    | 'referenceGlobalMaster'
    | 'coverSelection';

// ── API Payload types (used in transformPagesToPayload) ───────────────────────

export type OptionPayload = {
    label: string;
    value: string;
    sortOrder: number;
};

export type SubFieldPayload = Omit<SubField, 'options'> & {
    id?: string;
    options?: OptionPayload[];
};

export type FieldPayload = Omit<
    Field,
    | 'options'
    | 'subFields'
    | 'isMasterData'
    | 'buttonText'
    | 'buttonVariant'
    | 'mapProvider'
    | 'mapApiKey'
    | 'mapApiUrl'
> & {
    id?: string;
    options?: OptionPayload[];
    subFields?: SubFieldPayload[];
};

export type SectionPayload = Omit<Section, 'fields'> & {
    id?: string;
    fields: FieldPayload[];
};

export type PagePayload = Omit<Page, 'sections' | 'navigationFields'> & {
    id?: string;
    sections?: SectionPayload[];
    navigationFields?: FieldPayload[];
};

// ── Dialog / UI state types ───────────────────────────────────────────────────

export interface NewPageConfig {
    id: string;
    title: string;
    pageType: PageType;
    paymentUrl: string;
    pageOrder: number | null;
    quotesUrl: string;
}

export interface EditingSectionField {
    sectionId: string;
    field: 'title' | 'subtitle';
}
