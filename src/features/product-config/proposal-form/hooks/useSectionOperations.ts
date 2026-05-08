// ─────────────────────────────────────────────────────────────────────────────
// useSectionOperations — section add/delete/update, field delete, visibility
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback } from 'react';
import { useToast } from '@/shared/hooks/use-toast';
import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

interface UseSectionOperationsProps {
    pages: Page[];
    updatePages: (newPages: Page[] | ((current: Page[]) => Page[])) => void;
    /** Called after a section is inserted so the UI can select and expand it (avoids stale `selectedSectionId`). */
    onSectionCreated?: (payload: { pageId: string; sectionId: string }) => void;
}

export function useSectionOperations({ pages, updatePages, onSectionCreated }: UseSectionOperationsProps) {
    const { toast } = useToast();

    // ── addSection ────────────────────────────────────────────────────────────────
    const addSection = useCallback((pageId: string) => {
        const newSectionId = `section${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

        updatePages((prev) =>
            prev.map((page) => {
                if (page.id !== pageId) return page;

                const currentSections = page.sections || [];
                const newSectionOrder = currentSections.length + 1;

                const newSection = {
                    id: newSectionId,
                    title: '',
                    subtitle: '',
                    fields: [],
                    sectionOrder: newSectionOrder,
                    metadata: { active: true },
                };

                return {
                    ...page,
                    sections: [...currentSections, newSection],
                };
            }),
        );
        onSectionCreated?.({ pageId, sectionId: newSectionId });
        toast({
            title: 'Section Added',
            description: 'A new section has been added to the page.',
        });
    }, [updatePages, toast, onSectionCreated]);

    // ── deleteSection ─────────────────────────────────────────────────────────────
    const deleteSection = useCallback((pageId: string, sectionId: string) => {
        updatePages((prev) =>
            prev.map((page) =>
                page.id === pageId
                    ? (() => {
                        const nextSections = page.sections.filter((section) => section.id !== sectionId);
                        const sections = nextSections.length === 1
                            ? nextSections.map((section) => ({
                                ...section,
                                metadata: { ...(section.metadata || {}), active: true },
                            }))
                            : nextSections;
                        const shouldDisablePage =
                            sections.length > 1 &&
                            sections.every((section) => section.metadata?.active === false);

                        return {
                            ...page,
                            sections,
                            metadata: {
                                ...(page.metadata || {}),
                                active: shouldDisablePage ? false : page.metadata?.active !== false,
                            },
                        };
                    })()
                    : page,
            ),
        );
    }, [updatePages]);

    // ── duplicateField ────────────────────────────────────────────────────────────
    const duplicateField = useCallback((pageId: string, sectionId: string, fieldId: string) => {
        updatePages((prev) =>
            prev.map((page) =>
                page.id === pageId
                    ? {
                        ...page,
                        sections: page.sections.map((section) => {
                            if (section.id !== sectionId) return section;
                            const fieldIndex = section.fields.findIndex((f) => f.id === fieldId);
                            if (fieldIndex === -1) return section;
                            const fieldToCopy = section.fields[fieldIndex];
                            
                            const cloneId = `field${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                            const copyField = {
                                ...fieldToCopy,
                                id: cloneId,
                                name: `${fieldToCopy.name}_copy_${Date.now()}`.substring(0, 100),
                                label: `${fieldToCopy.label} (Copy)`
                            };
                            
                            const newFields = [...section.fields];
                            newFields.splice(fieldIndex + 1, 0, copyField);
                            
                            return {
                                ...section,
                                fields: newFields,
                            };
                        }),
                    }
                    : page,
            ),
        );
        toast({
            title: 'Field duplicated',
            description: 'The field has been duplicated successfully.',
        });
    }, [updatePages, toast]);

    // ── deleteField ───────────────────────────────────────────────────────────────
    const deleteField = useCallback((pageId: string, sectionId: string, fieldId: string) => {
        updatePages((prev) =>
            prev.map((page) =>
                page.id === pageId
                    ? {
                        ...page,
                        sections: page.sections.map((section) =>
                            section.id === sectionId
                                ? {
                                    ...section,
                                    fields: section.fields.filter((field) => field.id !== fieldId),
                                }
                                : section,
                        ),
                    }
                    : page,
            ),
        );
    }, [updatePages]);

    // ── duplicateSection ──────────────────────────────────────────────────────────
    const duplicateSection = useCallback((pageId: string, sectionId: string) => {
        updatePages((prev) =>
            prev.map((page) =>
                page.id === pageId
                    ? {
                        ...page,
                        sections: (() => {
                            const sectionIndex = page.sections.findIndex((s) => s.id === sectionId);
                            if (sectionIndex === -1) return page.sections;
                            
                            const sectionToCopy = page.sections[sectionIndex];
                            
                            const cloneId = `section${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                            
                            const clonedFields = (sectionToCopy.fields || []).map(f => ({
                              ...f,
                              id: `field${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                              name: `${f.name}_copy_${Math.random().toString(36).substr(2, 5)}`,
                            }));

                            const copySection = {
                                ...sectionToCopy,
                                id: cloneId,
                                title: `${sectionToCopy.title} (Copy)`,
                                fields: clonedFields
                            };
                            
                            const newSections = [...page.sections];
                            newSections.splice(sectionIndex + 1, 0, copySection);
                            return newSections;
                        })()
                    }
                    : page,
            ),
        );
        toast({
            title: 'Section duplicated',
            description: 'The section has been duplicated successfully.',
        });
    }, [updatePages, toast]);

    // ── updateSectionTitle ────────────────────────────────────────────────────────
    const updateSectionTitle = useCallback((pageId: string, sectionId: string, title: string) => {
        updatePages((prev) =>
            prev.map((page) =>
                page.id === pageId
                    ? {
                        ...page,
                        sections: page.sections.map((section) =>
                            section.id === sectionId ? { ...section, title } : section,
                        ),
                    }
                    : page,
            ),
        );
    }, [updatePages]);

    // ── updateSectionSubtitle ─────────────────────────────────────────────────────
    const updateSectionSubtitle = useCallback((pageId: string, sectionId: string, subtitle: string) => {
        updatePages((prev) =>
            prev.map((page) =>
                page.id === pageId
                    ? {
                        ...page,
                        sections: page.sections.map((section) =>
                            section.id === sectionId ? { ...section, subtitle } : section,
                        ),
                    }
                    : page,
            ),
        );
    }, [updatePages]);

    const updateSectionActive = useCallback((pageId: string, sectionId: string, active: boolean) => {
        updatePages((prev) =>
            prev.map((page) => {
                if (page.id !== pageId) return page;

                const sections = page.sections.map((section) =>
                    section.id === sectionId
                        ? { ...section, metadata: { ...(section.metadata || {}), active } }
                        : section,
                );
                const shouldDisablePage =
                    sections.length > 1 &&
                    sections.every((section) => section.metadata?.active === false);

                return {
                    ...page,
                    sections,
                    metadata: {
                        ...(page.metadata || {}),
                        active: shouldDisablePage ? false : page.metadata?.active !== false,
                    },
                };
            }),
        );
    }, [updatePages]);

    // ── updateSectionVisibility ───────────────────────────────────────────────────
    const updateSectionVisibility = useCallback((
        pageId: string,
        sectionId: string,
        visibility:
            | {
                field: string;
                condition: string;
                valueText?: string;
                masterId?: string;
                masterValueId?: string;
            }
            | undefined,
    ) => {
        updatePages((prev) =>
            prev.map((page) =>
                page.id === pageId
                    ? {
                        ...page,
                        sections: page.sections.map((section) =>
                            section.id === sectionId
                                ? {
                                    ...section,
                                    metadata: visibility
                                        ? { ...(section.metadata || {}), visibility }
                                        : (() => {
                                            const metadata = { ...(section.metadata || {}) };
                                            delete (metadata as { visibility?: unknown }).visibility;
                                            return Object.keys(metadata).length > 0 ? metadata : undefined;
                                        })(),
                                }
                                : section,
                        ),
                    }
                    : page,
            ),
        );
    }, [updatePages]);

    return {
        addSection,
        deleteSection,
        duplicateSection,
        deleteField,
        duplicateField,
        updateSectionTitle,
        updateSectionSubtitle,
        updateSectionActive,
        updateSectionVisibility,
    };
}
