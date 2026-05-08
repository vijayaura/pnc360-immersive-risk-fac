// ─────────────────────────────────────────────────────────────────────────────
// useFormPersistence — load, save, transform, and update-pages logic
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/shared/hooks/use-toast';
import {
    type CalculationConfig,
    getProposalFormDesign,
    getAdditionalInformationDesign,
    getCustomerProfileTemplateDesign,
    getGeneralTemplateDesign,
    isFieldLocked,
    saveProposalFormDesign,
    saveAdditionalInformationDesign,
    saveCustomerProfileTemplateDesign,
    saveGeneralTemplateDesign,
    updateProposalFormDesign,
    updateAdditionalInformationDesign,
    updateCustomerProfileTemplateDesign,
    updateGeneralTemplateDesign,
    type ConditionalLogicConfig,
    type Page,
    type Section,
    type Field,
    type LegacyConditionalLogicConfig,
    type ProductFormDesignType,
    SubField,
} from '@/features/product-config/proposal-form/api/proposalFormDesign';
import {
    type OptionPayload,
    type SubFieldPayload,
    type FieldPayload,
    type SectionPayload,
    type PagePayload,
} from '../types';
import { FRONTEND_ID_REGEX } from '../constants';
import { saveProposalFormDesign as mockSave } from '@/__mocks__/api/mockProposalFormDesign';
import {
    createConditionalLogicCombinationSubFieldRef,
    parseConditionalLogicCombinationSubFieldRef,
} from '@/features/proposals/utils/conditionalLogic';

interface UseFormPersistenceProps {
    productId: string | null;
    productName: string;
    productVersion: string;
    mode?: 'product' | 'customer-template' | 'general-template';
    designType?: ProductFormDesignType;
    customerTemplateId?: string | null;
    generalTemplateId?: string | null;
    customerCategory?: string;
    generalTemplateIds?: string[];
}

function isDropdownConditionalCalculation(
    calculation: CalculationConfig,
): calculation is Extract<CalculationConfig, { type: 'dropdownConditional' }> {
    return calculation.type === 'dropdownConditional';
}

function isDateCalculation(
    calculation: CalculationConfig,
): calculation is Extract<CalculationConfig, { type: 'date' }> {
    return calculation.type === 'date';
}

function isLegacyConditionalLogic(
    conditionalLogic: LegacyConditionalLogicConfig | ConditionalLogicConfig,
): conditionalLogic is LegacyConditionalLogicConfig {
    return !('type' in conditionalLogic);
}

function getPageGeneralTemplateName(page: Page): string | undefined {
    if (typeof page.generalTemplateName === 'string' && page.generalTemplateName.trim()) {
        return page.generalTemplateName.trim();
    }

    const metadataTemplateName = page.metadata?.generalTemplateName;
    return typeof metadataTemplateName === 'string' && metadataTemplateName.trim()
        ? metadataTemplateName.trim()
        : undefined;
}

const getDefaultMapApiUrl = (provider?: string, apiUrl?: string): string => {
    const normalizedProvider = String(provider || '').trim().toLowerCase();
    const normalizedApiUrl = String(apiUrl || '').trim();

    if (normalizedApiUrl) return normalizedApiUrl;
    if (normalizedProvider === 'google') return 'https://maps.googleapis.com/maps/api/js';
    if (normalizedProvider === 'default') return 'https://nominatim.openstreetmap.org';
    return 'https://maps.googleapis.com/maps/api/js';
};

export function useFormPersistence({
    productId,
    productName,
    productVersion,
    mode = 'product',
    designType = 'proposal-form',
    customerTemplateId = null,
    generalTemplateId = null,
    customerCategory,
    generalTemplateIds = [],
}: UseFormPersistenceProps) {
    const { toast } = useToast();
    const isCustomerTemplateMode = mode === 'customer-template';
    const isGeneralTemplateMode = mode === 'general-template';
    const isAdditionalInformationMode = !isCustomerTemplateMode && designType === 'additional-information';
    const designLabel = isCustomerTemplateMode
        ? 'customer template'
        : isGeneralTemplateMode
            ? 'general template'
        : isAdditionalInformationMode
            ? 'additional information'
            : 'proposal form design';
    const successLabel = isCustomerTemplateMode
        ? 'Customer template'
        : isGeneralTemplateMode
            ? 'General template'
            : isAdditionalInformationMode
                ? 'Additional information'
                : 'Proposal form';

    const [pages, setPages] = useState<Page[]>([
        { title: 'Company Info', pageType: 'form', pageOrder: 1, sections: [] },
    ]);
    const [isEditing, setIsEditing] = useState(false);
    const [templateId, setTemplateId] = useState<string | null>(null);
    const [templateVersionId, setTemplateVersionId] = useState<string | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const resolvedTemplateName = isCustomerTemplateMode
        ? (pages[0]?.title?.trim() || productName)
        : isGeneralTemplateMode
            ? productName
        : productName;
    const linkedCustomerProfileTemplateId = useMemo(
        () =>
            pages.find((page) => page.isCustomerProfileTemplatePage)?.customerProfileTemplateId ??
            pages.find((page) => page.isCustomerProfileTemplatePage)?.sourceCustomerProfileTemplateId ??
            null,
        [pages],
    );

    const clonePageWithTemplateMarker = useCallback(
        (page: Page, linkedCustomerTemplateId: string): Page => ({
            ...page,
            id: page.id || `customer-template-page-${linkedCustomerTemplateId}`,
            isCustomerTemplate: true,
            isCustomerProfileTemplatePage: true,
            sourceCustomerProfileTemplateId: linkedCustomerTemplateId,
            customerProfileTemplateId: linkedCustomerTemplateId,
            pageOrder: 1,
        }),
        [],
    );

    const normalizeFieldLockState = useCallback((field: Field): Field => {
        const locked = isFieldLocked(field);

        return {
            ...field,
            isLocked: locked,
            metadata: {
                ...(field.metadata || {}),
                isLocked: locked,
            },
            subFields: field.subFields?.map((subField) => ({
                ...subField,
                metadata: subField.metadata
                    ? {
                        ...subField.metadata,
                        isLocked:
                            subField.metadata.isLocked === true ||
                            subField.metadata.isLocked === 'true',
                    }
                    : subField.metadata,
            })),
        };
    }, []);

    const normalizeLoadedPages = useCallback((proposalPages: Page[]): Page[] => {
        if (!proposalPages.length) return proposalPages;

        const templatePages = proposalPages.filter(
            (page) => page.isCustomerTemplate || page.customerProfileTemplateId,
        );
        const regularPages = proposalPages.filter(
            (page) => !page.isCustomerTemplate && !page.customerProfileTemplateId,
        );

        const normalizedTemplatePages = templatePages.map((page) =>
            clonePageWithTemplateMarker(
                page,
                page.customerProfileTemplateId || page.sourceCustomerProfileTemplateId || page.id || 'customer-template',
            ),
        );

        return [...normalizedTemplatePages, ...regularPages].map((page, index) => ({
            ...page,
            ...(getPageGeneralTemplateName(page)
                ? { generalTemplateName: getPageGeneralTemplateName(page) }
                : {}),
            pageOrder: index + 1,
            sections: (page.sections || []).map((section) => ({
                ...section,
                fields: (section.fields || []).map(normalizeFieldLockState),
            })),
        }));
    }, [clonePageWithTemplateMarker, normalizeFieldLockState]);

    // ── Helper: update pages + mark unsaved ─────────────────────────────────────
    const updatePages = useCallback(
        (newPages: Page[] | ((current: Page[]) => Page[])) => {
            if (typeof newPages === 'function') {
                setPages((current) => {
                    const next = newPages(current);
                    return next;
                });
            } else {
                setPages(newPages);
            }
            setHasUnsavedChanges(true);
            setIsPublished(false);
        },
        [],
    );

    // ── ID helpers ────────────────────────────────────────────────────────────────
    const isFrontendId = useCallback((id?: string): boolean => !!id && FRONTEND_ID_REGEX.test(id), []);

    const normalizeOptions = useCallback((options: any[]): OptionPayload[] =>
        options.map((option, idx) =>
            typeof option === 'string'
                ? { label: option, value: option, sortOrder: idx }
                : {
                    label: option.label ?? '',
                    value: option.value ?? option.label ?? '',
                    sortOrder: option.sortOrder ?? idx,
                },
        ), []);

    const stripFrontendId = useCallback(<T extends { id?: string }>(obj: T): Omit<T, 'id'> | T => {
        if (obj.id && isFrontendId(obj.id)) {
            const { id, ...rest } = obj;
            return rest as Omit<T, 'id'>;
        }
        return obj;
    }, [isFrontendId]);

    const resolveCalculationFieldRef = useCallback((
        ref: string | undefined,
        pageFields: Field[],
        currentSubFields?: SubField[],
    ): string | undefined => {
        if (!ref) return ref;
        if (ref.startsWith('SUM__')) return ref;

        const subFieldMatch = currentSubFields?.find((sf) => sf.id === ref || sf.name === ref);
        if (subFieldMatch) {
            return subFieldMatch.id && !isFrontendId(subFieldMatch.id)
                ? subFieldMatch.id
                : subFieldMatch.name;
        }

        const fieldMatch = pageFields.find((candidate) => candidate.id === ref || candidate.name === ref);
        if (fieldMatch) {
            return fieldMatch.id && !isFrontendId(fieldMatch.id)
                ? fieldMatch.id
                : fieldMatch.name;
        }

        return ref;
    }, [isFrontendId]);

    const normalizeScopedCalculationFieldRef = useCallback((
        ref: string | undefined,
        pageFields: Field[],
        currentSubFields?: SubField[],
    ): string | undefined => {
        if (!ref) return ref;

        if (ref.startsWith('PAGE__')) {
            const normalizedRef = resolveCalculationFieldRef(
                ref.replace(/^PAGE__/, ''),
                pageFields,
                undefined,
            );
            return normalizedRef ? `PAGE__${normalizedRef}` : ref;
        }

        return resolveCalculationFieldRef(ref, pageFields, currentSubFields);
    }, [resolveCalculationFieldRef]);

    const normalizeCalculationConfig = useCallback((
        calculation: CalculationConfig | undefined,
        pageFields: Field[],
        currentSubFields?: SubField[],
    ): CalculationConfig | undefined => {
        if (!calculation) return calculation;

        if (isDropdownConditionalCalculation(calculation)) {
            return {
                ...calculation,
                rules: (calculation.rules || []).map((rule) => ({
                    ...rule,
                    conditions: (rule.conditions || []).map((condition) => ({
                        ...condition,
                        field:
                            normalizeScopedCalculationFieldRef(
                                condition.field,
                                pageFields,
                                currentSubFields,
                            ) || condition.field,
                    })),
                })),
            };
        }

        const normalizedScopedInitialField = normalizeScopedCalculationFieldRef(
            calculation.initialField,
            pageFields,
            currentSubFields,
        ) || calculation.initialField;

        if (isDateCalculation(calculation)) {
            return {
                ...calculation,
                initialField: normalizedScopedInitialField,
                comparisonField: normalizeScopedCalculationFieldRef(
                    calculation.comparisonField,
                    pageFields,
                    currentSubFields,
                ) || calculation.comparisonField,
            };
        }

        return {
            ...calculation,
            initialField: normalizedScopedInitialField,
            operations: calculation.operations.map((operation) => ({
                ...operation,
                field:
                    operation.operandType === 'manual'
                        ? operation.field
                        : normalizeScopedCalculationFieldRef(
                              operation.field,
                              pageFields,
                              currentSubFields,
                          ) || operation.field,
            })),
        };
    }, [normalizeScopedCalculationFieldRef]);

    const normalizeConditionalLogicFieldRef = useCallback((
        ref: string | undefined,
        pageFields: Field[],
        currentSubFields?: SubField[],
    ): string | undefined => {
        if (!ref) return ref;

        const parsedCombinationRef = parseConditionalLogicCombinationSubFieldRef(ref);
        if (parsedCombinationRef) {
            const normalizedParentRef = resolveCalculationFieldRef(
                parsedCombinationRef.fieldRef,
                pageFields,
                undefined,
            ) || parsedCombinationRef.fieldRef;
            const normalizedSubFieldRef = resolveCalculationFieldRef(
                parsedCombinationRef.subFieldRef,
                [],
                currentSubFields,
            ) || parsedCombinationRef.subFieldRef;

            return createConditionalLogicCombinationSubFieldRef(
                normalizedParentRef,
                normalizedSubFieldRef,
            );
        }

        return resolveCalculationFieldRef(ref, pageFields, currentSubFields);
    }, [resolveCalculationFieldRef]);

    const normalizeConditionalLogicConfig = useCallback((
        conditionalLogic: LegacyConditionalLogicConfig | ConditionalLogicConfig | undefined,
        pageFields: Field[],
        currentSubFields?: SubField[],
    ): LegacyConditionalLogicConfig | ConditionalLogicConfig | undefined => {
        if (!conditionalLogic) return conditionalLogic;

        if (!isLegacyConditionalLogic(conditionalLogic)) {
            return {
                ...conditionalLogic,
                rules: (conditionalLogic.rules || []).map((rule) => ({
                    ...rule,
                    conditions: (rule.conditions || []).map((condition) => ({
                        ...condition,
                        field:
                            normalizeConditionalLogicFieldRef(
                                condition.field,
                                pageFields,
                                currentSubFields,
                            ) || condition.field,
                    })),
                })),
            };
        }

        return {
            ...conditionalLogic,
            field:
                normalizeConditionalLogicFieldRef(
                    conditionalLogic.field,
                    pageFields,
                    currentSubFields,
                ) || conditionalLogic.field,
        };
    }, [normalizeConditionalLogicFieldRef]);

    // ── Payload transformer ───────────────────────────────────────────────────────
    const transformPagesToPayload = useCallback((pagesToTransform: Page[]): PagePayload[] => {
        const allFields = pagesToTransform
            .flatMap((page) => page.sections || [])
            .flatMap((section) => section.fields || []);

        return pagesToTransform.map((page) => {
            const {
                isCustomerProfileTemplatePage,
                sourceCustomerProfileTemplateId,
                ...pageWithoutTemplateMarker
            } = page;
            const pageSections = page.sections || [];
            const shouldDisablePage =
                pageSections.length > 1 &&
                pageSections.every((section) => section.metadata?.active === false);
            const pageBase = stripFrontendId({
                ...pageWithoutTemplateMarker,
                metadata: {
                    ...(pageWithoutTemplateMarker.metadata || {}),
                    active: shouldDisablePage ? false : pageWithoutTemplateMarker.metadata?.active !== false,
                    ...(page.generalTemplateName !== undefined
                        ? { generalTemplateName: page.generalTemplateName }
                        : {}),
                    ...('isGeneralTemplate' in page
                        ? { isGeneralTemplate: page.isGeneralTemplate }
                        : {}),
                },
            });
            const sections: SectionPayload[] = pageSections.map((section, sectionIdx) => {
                const sectionBase = stripFrontendId({
                    ...section,
                    metadata: {
                        ...(section.metadata || {}),
                        active: pageSections.length === 1 ? true : section.metadata?.active !== false,
                    },
                });
                const pageFields = pageSections.flatMap((pageSection) => pageSection.fields || []);
                const fields: FieldPayload[] = (section.fields || []).map((field) => {
                    const fieldWithoutDerivedProps = { ...(field as any) };
                    delete fieldWithoutDerivedProps.isMasterData;
                    delete fieldWithoutDerivedProps.buttonText;
                    delete fieldWithoutDerivedProps.buttonVariant;
                    delete fieldWithoutDerivedProps.mapProvider;
                    delete fieldWithoutDerivedProps.mapApiKey;
                    delete fieldWithoutDerivedProps.mapApiUrl;
                    delete fieldWithoutDerivedProps.combinationRows;

                    const {
                        options: rawOptions,
                        subFields: rawSubFields,
                        ...fieldRest
                    } = fieldWithoutDerivedProps;

                    const normalizedFieldRest = {
                        ...fieldRest,
                        isLocked: isFieldLocked(field),
                        conditionalLogic: normalizeConditionalLogicConfig(
                            fieldRest.conditionalLogic as
                                | LegacyConditionalLogicConfig
                                | ConditionalLogicConfig
                                | undefined,
                            pageFields,
                            field.subFields,
                        ),
                        metadata: fieldRest.metadata
                            ? {
                                ...fieldRest.metadata,
                                active: fieldRest.metadata.active !== false,
                                isLocked: isFieldLocked(field),
                                ...(field.type === 'location'
                                    ? {
                                        mapApiUrl: getDefaultMapApiUrl(
                                            (field.metadata?.mapProvider as string) || field.mapProvider,
                                            (field.metadata?.mapApiUrl as string) || field.mapApiUrl,
                                        ),
                                    }
                                    : {}),
                                calculation: normalizeCalculationConfig(
                                    fieldRest.metadata?.calculation as CalculationConfig | undefined,
                                    pageFields,
                                    field.subFields,
                                ),
                            }
                            : { active: true, isLocked: isFieldLocked(field) },
                    };

                    const fieldBase = stripFrontendId(normalizedFieldRest as Field);

                    // For dependent dropdowns (fields with dependentOptions),
                    // flatten all dependent option values into a single options array
                    // so the backend can create masters for them
                    let options: OptionPayload[] | undefined =
                        rawOptions && rawOptions.length > 0 ? normalizeOptions(rawOptions) : undefined;

                    if (field.dependentOptions && Object.keys(field.dependentOptions).length > 0) {
                        const allDependentValues = new Set<string>();
                        Object.values(field.dependentOptions).forEach((values: any) => {
                            if (Array.isArray(values)) {
                                values.forEach((val) => allDependentValues.add(val));
                            }
                        });

                        const dependentOptionsArray = Array.from(allDependentValues).map((val, idx) => ({
                            label: val,
                            value: val,
                            sortOrder: idx + 1,
                        }));

                        if (options && options.length > 0) {
                            const existingValues = new Set(options.map((opt) => opt.value));
                            dependentOptionsArray.forEach((opt) => {
                                if (!existingValues.has(opt.value)) {
                                    options!.push(opt);
                                }
                            });
                        } else {
                            options = dependentOptionsArray;
                        }
                    }

                    const subFields: SubFieldPayload[] | undefined =
                        rawSubFields && rawSubFields.length > 0
                            ? rawSubFields.map((sf: SubField & { id?: string }) => {
                                const normalizedSubField = {
                                    ...sf,
                                    conditionalLogic: normalizeConditionalLogicConfig(
                                        sf.conditionalLogic,
                                        pageFields,
                                        rawSubFields,
                                    ),
                                    metadata: sf.metadata
                                        ? {
                                            ...sf.metadata,
                                            ...(sf.type === 'location'
                                                ? {
                                                    mapApiUrl: getDefaultMapApiUrl(
                                                        (sf.metadata?.mapProvider as string) || sf.mapProvider,
                                                        (sf.metadata?.mapApiUrl as string) || sf.mapApiUrl,
                                                    ),
                                                }
                                                : {}),
                                            calculation: normalizeCalculationConfig(
                                                sf.metadata?.calculation as CalculationConfig | undefined,
                                                pageFields,
                                                rawSubFields,
                                            ),
                                        }
                                        : sf.metadata,
                                };
                                const sfBase = stripFrontendId(normalizedSubField);
                                const sfOptions: OptionPayload[] | undefined =
                                    sf.options && sf.options.length > 0
                                        ? normalizeOptions(sf.options)
                                        : undefined;
                                const referenceField = allFields.find((candidateField) => {
                                    const referenceFieldId = sf.metadata?.referenceFieldId;
                                    const referenceFieldName = sf.metadata?.referenceFieldName;
                                    if (referenceFieldId && candidateField.id === referenceFieldId) return true;
                                    if (referenceFieldName && candidateField.name === referenceFieldName) return true;
                                    return false;
                                });
                                const referenceSubField = referenceField?.subFields?.find((candidateSubField) => {
                                    const referenceSubFieldId = sf.metadata?.referenceSubFieldId;
                                    const referenceSubFieldName = sf.metadata?.referenceSubFieldName;
                                    if (referenceSubFieldId && candidateSubField.id === referenceSubFieldId) return true;
                                    if (referenceSubFieldName && candidateSubField.name === referenceSubFieldName) return true;
                                    return false;
                                });

                                const normalizedMetadata = sf.metadata
                                    ? {
                                        ...sf.metadata,
                                        active: sf.metadata.active !== false,
                                        referenceFieldId:
                                            referenceField?.id ??
                                            sf.metadata.referenceFieldId,
                                        referenceFieldName:
                                            referenceField?.name ??
                                            sf.metadata.referenceFieldName,
                                        referenceSubFieldId:
                                            referenceSubField?.id ??
                                            sf.metadata.referenceSubFieldId,
                                        referenceSubFieldName:
                                            referenceSubField?.name ??
                                            sf.metadata.referenceSubFieldName,
                                    }
                                    : { active: true };

                                const normalizedLocationMetadata = sf.type === 'location'
                                    ? {
                                        ...(normalizedMetadata || {}),
                                        mapApiUrl: getDefaultMapApiUrl(
                                            (sf.metadata?.mapProvider as string) || sf.mapProvider,
                                            (normalizedMetadata?.mapApiUrl as string) || sf.mapApiUrl,
                                        ),
                                    }
                                    : normalizedMetadata;

                                return {
                                    ...sfBase,
                                    ...(normalizedLocationMetadata ? { metadata: normalizedLocationMetadata } : {}),
                                    ...(sfOptions ? { options: sfOptions } : {}),
                                };
                            })
                            : undefined;

                    return {
                        ...fieldBase,
                        ...(options ? { options } : {}),
                        ...(subFields ? { subFields } : {}),
                    } as FieldPayload;
                });
                return {
                    ...sectionBase,
                    sectionOrder: section.sectionOrder ?? sectionIdx + 1,
                    fields,
                } as SectionPayload;
            });

            const navigationFields: FieldPayload[] | undefined = (page as any).navigationFields
                ? ((page as any).navigationFields as Field[]).map((field) => {
                    const fieldWithoutDerivedProps = { ...(field as any) };
                    delete fieldWithoutDerivedProps.isMasterData;
                    delete fieldWithoutDerivedProps.buttonText;
                    delete fieldWithoutDerivedProps.buttonVariant;
                    delete fieldWithoutDerivedProps.mapProvider;
                    delete fieldWithoutDerivedProps.mapApiKey;
                    delete fieldWithoutDerivedProps.mapApiUrl;
                    delete fieldWithoutDerivedProps.combinationRows;
                    delete fieldWithoutDerivedProps.subFields;

                    const {
                        options: rawOptions,
                        ...fieldRest
                    } = fieldWithoutDerivedProps;
                    const fieldBase = stripFrontendId({
                        ...fieldRest,
                        metadata: field.type === 'location'
                            ? {
                                ...(fieldRest.metadata || {}),
                                mapApiUrl: getDefaultMapApiUrl(
                                    (field.metadata?.mapProvider as string) || field.mapProvider,
                                    (field.metadata?.mapApiUrl as string) || field.mapApiUrl,
                                ),
                            }
                            : fieldRest.metadata,
                    } as Field);
                    const options: OptionPayload[] | undefined =
                        rawOptions && rawOptions.length > 0 ? normalizeOptions(rawOptions) : undefined;
                    return { ...fieldBase, ...(options ? { options } : {}) } as FieldPayload;
                })
                : undefined;

            return {
                ...pageBase,
                ...(isCustomerProfileTemplatePage && sourceCustomerProfileTemplateId
                    ? { customerProfileTemplateId: sourceCustomerProfileTemplateId }
                    : {}),
                sections,
                ...(navigationFields ? { navigationFields } : {}),
            } as PagePayload;
        });
    }, [normalizeConditionalLogicConfig, normalizeOptions, stripFrontendId]);

    // ── Load design ───────────────────────────────────────────────────────────────
    useEffect(() => {
        const loadDesign = async () => {
            const loadByProductId = !isCustomerTemplateMode && !isGeneralTemplateMode && productId;
            const loadByTemplateId = isCustomerTemplateMode && customerTemplateId;
            const loadByGeneralTemplateId = isGeneralTemplateMode && generalTemplateId;

            if (loadByProductId || loadByTemplateId || loadByGeneralTemplateId) {
                try {
                    setIsLoading(true);
                    setIsInitialLoad(true);
                    let design: any = null;

                    try {
                        design = isCustomerTemplateMode
                            ? await getCustomerProfileTemplateDesign(customerTemplateId!)
                            : isGeneralTemplateMode
                                ? await getGeneralTemplateDesign(generalTemplateId!)
                            : isAdditionalInformationMode
                                ? await getAdditionalInformationDesign(productId!)
                                : await getProposalFormDesign(productId!, {
                                    generalTemplateIds,
                                });
                    } catch (error: any) {
                        if (!(error.status === 404 || error.status === 0 || error.message?.includes('Network'))) {
                            throw error;
                        }
                    }

                    if (design?.pages && design.pages.length > 0) {
                        setTemplateId(
                            design.templateId || design.id || customerTemplateId || generalTemplateId || null,
                        );
                        setTemplateVersionId(design.templateVersionId || null);
                        setPages(normalizeLoadedPages(design.pages));
                        setHasUnsavedChanges(false);
                        setIsEditing(true);
                        setIsPublished(false);
                    } else {
                        const testDataPages: Page[] = [
                            { title: 'Company Info', pageType: 'form', pageOrder: 1, sections: [] },
                        ];
                        const mergedPages = normalizeLoadedPages(testDataPages);
                        if (
                            mergedPages.length > 1 ||
                            (mergedPages.length === 1 &&
                                mergedPages[0].sections &&
                                mergedPages[0].sections.length > 0)
                        ) {
                            setPages(mergedPages);
                            mockSave(
                                productId || customerTemplateId || generalTemplateId || 'template',
                                { pages: mergedPages },
                            )
                                .then(() => {
                                    console.log('✅ Test data auto-saved to mock API');
                                })
                                .catch((saveError: any) => {
                                    console.warn('⚠️ Failed to auto-save test data:', saveError);
                                });
                        }
                    }
                } catch (error: any) {
                    if (error.status === 404 || error.status === 0 || error.message?.includes('Network')) {
                        console.log('API call failed (404/network)');
                    } else {
                        toast({
                            title: 'Error',
                            description: error.message || `Failed to load ${designLabel}`,
                            variant: 'destructive',
                        });
                    }
                } finally {
                    setIsLoading(false);
                    setIsInitialLoad(false);
                }
            } else {
                setIsInitialLoad(false);
            }
        };
        loadDesign();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        customerTemplateId,
        generalTemplateId,
        generalTemplateIds,
        isCustomerTemplateMode,
        isGeneralTemplateMode,
        productId,
        productName,
        productVersion,
        normalizeLoadedPages,
    ]);

    // ── Save / Publish ────────────────────────────────────────────────────────────
    const handleSaveForm = async (isDraft: boolean) => {
        if (!productId && !isCustomerTemplateMode && !isGeneralTemplateMode) {
            toast({
                title: 'Error',
                description: `Product ID is required to save ${designLabel}`,
                variant: 'destructive',
            });
            return;
        }

        try {
            if (isDraft) {
                setIsSavingDraft(true);
            } else {
                setIsPublishing(true);
            }
            setIsSaving(true);

            const transformedPages = transformPagesToPayload(pages);

            try {
                if (isEditing && templateId) {
                    const savedDesign = isCustomerTemplateMode
                        ? await updateCustomerProfileTemplateDesign(customerTemplateId || templateId, {
                            name: resolvedTemplateName,
                            productId: productId || undefined,
                            customerCategory,
                            pages: transformedPages,
                            isDraft,
                        })
                        : isGeneralTemplateMode
                            ? await updateGeneralTemplateDesign(generalTemplateId || templateId, {
                                name: resolvedTemplateName,
                                productId: productId || undefined,
                                pages: transformedPages,
                                isDraft,
                            })
                        : isAdditionalInformationMode
                            ? await updateAdditionalInformationDesign(templateId, {
                                name: productName,
                                productId: productId!,
                                templateId,
                                templateVersionId: templateVersionId || undefined,
                                pages: transformedPages,
                                isDraft,
                            })
                        : await updateProposalFormDesign(templateId, {
                            name: productName,
                            productId: productId!,
                            pages: transformedPages,
                            isDraft,
                        });

                    toast({
                        title: isDraft ? 'Draft Saved' : 'Form Published',
                        description: isDraft
                            ? `${successLabel} has been saved as draft successfully.`
                            : `${successLabel} has been published successfully.`,
                    });
                    if (!isDraft) setIsPublished(true);
                } else {
                    const savedDesign = isCustomerTemplateMode
                        ? await saveCustomerProfileTemplateDesign({
                            name: resolvedTemplateName,
                            isDraft,
                            productId: productId || undefined,
                            customerCategory,
                            pages: transformedPages,
                        })
                        : isGeneralTemplateMode
                            ? await saveGeneralTemplateDesign({
                                name: resolvedTemplateName,
                                isDraft,
                                productId: productId || undefined,
                                pages: transformedPages,
                            })
                        : isAdditionalInformationMode
                            ? await saveAdditionalInformationDesign(productId!, {
                                name: productName,
                                isDraft,
                                productId: productId || undefined,
                                pages: transformedPages,
                            })
                        : await saveProposalFormDesign({
                            name: productName,
                            isDraft,
                            productId: productId || undefined,
                            pages: transformedPages,
                        });

                    if (savedDesign) {
                        setTemplateId(savedDesign.templateId || savedDesign.id || null);
                        setTemplateVersionId(savedDesign.templateVersionId || null);
                        setIsEditing(true);
                    }

                    toast({
                        title: isDraft ? 'Draft Saved' : 'Form Published',
                        description: isDraft
                            ? `${successLabel} has been saved as draft successfully.`
                            : `${successLabel} has been published successfully.`,
                    });
                    if (!isDraft) setIsPublished(true);
                }
            } catch (error: any) {
                if (error.status === 404) {
                    // Handle 404 silently
                } else {
                    throw error;
                }
            }
            setHasUnsavedChanges(false);
        } catch (error: any) {
            toast({
                title: 'Error',
                description:
                    error.message || `Failed to ${isDraft ? 'save draft' : 'publish'} ${designLabel}`,
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
            if (isDraft) {
                setIsSavingDraft(false);
            } else {
                setIsPublishing(false);
            }
        }
    };

    return {
        // State
        pages,
        setPages,
        isEditing,
        templateId,
        isInitialLoad,
        isLoading,
        isSaving,
        isSavingDraft,
        isPublishing,
        hasUnsavedChanges,
        setHasUnsavedChanges,
        isPublished,
        setIsPublished,
        // Actions
        updatePages,
        handleSaveForm,
        transformPagesToPayload,
    };
}
