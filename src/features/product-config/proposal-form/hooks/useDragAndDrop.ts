// ─────────────────────────────────────────────────────────────────────────────
// useDragAndDrop — field, section, and page drag handlers
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { useToast } from '@/shared/hooks/use-toast';
import type { Page, Field } from '@/features/product-config/proposal-form/api/proposalFormDesign';

interface UseDragAndDropProps {
    pages: Page[];
    updatePages: (newPages: Page[] | ((current: Page[]) => Page[])) => void;
}

export function useDragAndDrop({ pages, updatePages }: UseDragAndDropProps) {
    const { toast } = useToast();

    // ── Drag state ────────────────────────────────────────────────────────────────
    const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
    const [draggedFieldPageId, setDraggedFieldPageId] = useState<string | null>(null);
    const [draggedFieldSectionId, setDraggedFieldSectionId] = useState<string | null>(null);
    const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
    const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
    const [draggedSectionPageId, setDraggedSectionPageId] = useState<string | null>(null);
    const [draggedFieldType, setDraggedFieldType] = useState<string | null>(null);
    const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);

    // ── Shared drag end ───────────────────────────────────────────────────────────
    const handleDragEnd = useCallback(() => {
        setDraggedFieldId(null);
        setDraggedPageId(null);
        setDraggedSectionId(null);
        setDraggedSectionPageId(null);
        document.querySelectorAll('.opacity-50').forEach((el) => {
            el.classList.remove('opacity-50');
        });
    }, []);

    // ── Field drag ────────────────────────────────────────────────────────────────
    const handleDragStart = useCallback((fieldId: string, pageId?: string, sectionId?: string) => {
        setDraggedFieldId(fieldId);
        setDraggedFieldPageId(pageId ?? null);
        setDraggedFieldSectionId(sectionId ?? null);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.currentTarget.classList.add('opacity-50');
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.currentTarget.classList.remove('opacity-50');
    }, []);

    const handleDrop = useCallback((
        e: React.DragEvent,
        targetFieldId: string | null,
        targetPageId: string,
        targetSectionId: string,
    ) => {
        e.preventDefault();
        e.currentTarget.classList.remove('opacity-50');

        if (!draggedFieldId || draggedFieldPageId === null || draggedFieldSectionId === null) return;

        updatePages((currentPages) => {
            let draggedField: Field | null = null;
            let sourceSectionFields: Field[] = [];

            currentPages.forEach((page) => {
                if (page.id === draggedFieldPageId) {
                    page.sections.forEach((section) => {
                        if (section.id === draggedFieldSectionId) {
                            sourceSectionFields = section.fields;
                            const fieldIndex = section.fields.findIndex((f) => f.id === draggedFieldId);
                            if (fieldIndex !== -1) {
                                draggedField = section.fields[fieldIndex];
                            }
                        }
                    });
                }
            });

            if (!draggedField) return currentPages;

            if (
                draggedFieldPageId === targetPageId &&
                draggedFieldSectionId === targetSectionId &&
                targetFieldId
            ) {
                const draggedIndex = sourceSectionFields.findIndex((f) => f.id === draggedFieldId);
                const targetIndex = sourceSectionFields.findIndex((f) => f.id === targetFieldId);

                if (targetIndex > draggedIndex) {
                    const fieldsBetween = sourceSectionFields.slice(draggedIndex + 1, targetIndex + 1);
                    const isParentOfChild = fieldsBetween.some(
                        (f) => f.dependentOn === (draggedField as Field).name,
                    );
                    if (isParentOfChild) {
                        toast({
                            title: 'Cannot Move Field',
                            description: 'A parent field cannot be moved below its dependent child fields.',
                            variant: 'destructive',
                        });
                        return currentPages;
                    }
                }
            }

            return currentPages.map((page) => {
                let updatedPage = { ...page };
                const isSourcePage = page.id === draggedFieldPageId;
                const isTargetPage = page.id === targetPageId;

                if (isSourcePage) {
                    updatedPage = {
                        ...updatedPage,
                        sections: updatedPage.sections.map((section) =>
                            section.id === draggedFieldSectionId
                                ? { ...section, fields: section.fields.filter((f) => f.id !== draggedFieldId) }
                                : section,
                        ),
                    };
                }

                if (isTargetPage) {
                    updatedPage = {
                        ...updatedPage,
                        sections: updatedPage.sections.map((section) => {
                            if (section.id !== targetSectionId) return section;
                            const newFields = [...section.fields];
                            let insertIndex = targetFieldId
                                ? newFields.findIndex((f) => f.id === targetFieldId)
                                : newFields.length;
                            if (insertIndex === -1) insertIndex = newFields.length;
                            newFields.splice(insertIndex, 0, draggedField!);
                            return { ...section, fields: newFields };
                        }),
                    };
                }

                return updatedPage;
            });
        });

        setDraggedFieldId(null);
        setDraggedFieldPageId(null);
        setDraggedFieldSectionId(null);
    }, [draggedFieldId, draggedFieldPageId, draggedFieldSectionId, updatePages, toast]);

    // ── Page drag ─────────────────────────────────────────────────────────────────
    const handlePageDragStart = useCallback((e: React.DragEvent, pageId: string) => {
        e.stopPropagation();
        setDraggedPageId(pageId);
    }, []);

    const handlePageDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedPageId) e.currentTarget.classList.add('opacity-50');
    }, [draggedPageId]);

    const handlePageDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('opacity-50');
    }, []);

    const handlePageDrop = useCallback((e: React.DragEvent, targetPageId: string) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('opacity-50');

        if (!draggedPageId || draggedPageId === targetPageId) {
            setDraggedPageId(null);
            return;
        }

        updatePages((currentPages) => {
            const pagesArray = [...currentPages];
            const draggedIdx = pagesArray.findIndex((p) => p.id === draggedPageId);
            const targetIdx = pagesArray.findIndex((p) => p.id === targetPageId);

            if (draggedIdx === -1 || targetIdx === -1) {
                return currentPages;
            }

            const [draggedPage] = pagesArray.splice(draggedIdx, 1);
            pagesArray.splice(targetIdx, 0, draggedPage);

            return pagesArray.map((page, index) => ({
                ...page,
                pageOrder: index + 1,
            }));
        });

        setDraggedPageId(null);
    }, [draggedPageId, updatePages]);

    // ── Section drag ──────────────────────────────────────────────────────────────
    const handleSectionDragStart = useCallback((e: React.DragEvent, pageId: string, sectionId: string) => {
        e.stopPropagation();
        setDraggedSectionId(sectionId);
        setDraggedSectionPageId(pageId);
    }, []);

    const handleSectionDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedSectionId) e.currentTarget.classList.add('opacity-50');
    }, [draggedSectionId]);

    const handleSectionDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('opacity-50');
    }, []);

    const handleSectionDrop = useCallback((e: React.DragEvent, targetPageId: string, targetSectionId: string) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('opacity-50');

        if (!draggedSectionId || !draggedSectionPageId || draggedSectionId === targetSectionId) {
            setDraggedSectionId(null);
            setDraggedSectionPageId(null);
            return;
        }

        if (draggedSectionPageId !== targetPageId) {
            setDraggedSectionId(null);
            setDraggedSectionPageId(null);
            return;
        }

        updatePages((prev) =>
            prev.map((page) => {
                if (page.id !== targetPageId) return page;
                const sections = [...page.sections];
                const draggedIdx = sections.findIndex((s) => s.id === draggedSectionId);
                const targetIdx = sections.findIndex((s) => s.id === targetSectionId);
                if (draggedIdx === -1 || targetIdx === -1) return page;
                const [draggedSection] = sections.splice(draggedIdx, 1);
                sections.splice(targetIdx, 0, draggedSection);
                const updatedSections = sections.map((section, idx) => ({
                    ...section,
                    sectionOrder: idx + 1,
                }));
                return { ...page, sections: updatedSections };
            }),
        );

        setDraggedSectionId(null);
        setDraggedSectionPageId(null);
    }, [draggedSectionId, draggedSectionPageId, updatePages]);

    return {
        // State
        draggedFieldId,
        draggedFieldPageId,
        draggedFieldSectionId,
        draggedPageId,
        draggedSectionId,
        draggedSectionPageId,
        draggedFieldType,
        dragOverSectionId,
        setDraggedFieldType,
        setDragOverSectionId,
        // Field handlers
        handleDragStart,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleDragEnd,
        // Page handlers
        handlePageDragStart,
        handlePageDragOver,
        handlePageDragLeave,
        handlePageDrop,
        // Section handlers
        handleSectionDragStart,
        handleSectionDragOver,
        handleSectionDragLeave,
        handleSectionDrop,
    };
}
