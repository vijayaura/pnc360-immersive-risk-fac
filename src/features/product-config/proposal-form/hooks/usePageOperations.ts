// ─────────────────────────────────────────────────────────────────────────────
// usePageOperations — page and section/field CRUD, validations, expansions
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useToast } from '@/shared/hooks/use-toast';
import { MultiFieldValidation, type Page, type Section } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import type { PageType, NewPageConfig } from '../types';

interface UsePageOperationsProps {
    pages: Page[];
    updatePages: (newPages: Page[] | ((current: Page[]) => Page[])) => void;
    setHasUnsavedChanges: (v: boolean) => void;
    selectedPageId: string;
    setSelectedPageId: (id: string) => void;
    defaultPageType?: PageType;
}

export function usePageOperations({
    pages,
    updatePages,
    setHasUnsavedChanges,
    selectedPageId,
    setSelectedPageId,
    defaultPageType = 'form',
}: UsePageOperationsProps) {
    const { toast } = useToast();

    // ── Expansion ─────────────────────────────────────────────────────────────────
    const [expandedPages, setExpandedPages] = useState<Set<string>>(
        new Set(pages.map((p) => p.id)),
    );
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    useEffect(() => {
        setExpandedPages((prev) => {
            const currentPageIds = new Set(
                pages.map((page) => page.id).filter((pageId): pageId is string => Boolean(pageId)),
            );
            const nextExpanded = new Set<string>();

            prev.forEach((pageId) => {
                if (currentPageIds.has(pageId)) {
                    nextExpanded.add(pageId);
                }
            });

            currentPageIds.forEach((pageId) => {
                if (!prev.has(pageId)) {
                    nextExpanded.add(pageId);
                }
            });

            return nextExpanded;
        });
    }, [pages]);

    const togglePageExpansion = useCallback((pageId: string) => {
        setExpandedPages((prev) => {
            const newExpanded = new Set(prev);
            if (newExpanded.has(pageId)) newExpanded.delete(pageId);
            else newExpanded.add(pageId);
            return newExpanded;
        });
    }, []);

    const toggleSectionExpansion = useCallback((sectionId: string) => {
        setExpandedSections((prev) => {
            const newExpanded = new Set(prev);
            if (newExpanded.has(sectionId)) newExpanded.delete(sectionId);
            else newExpanded.add(sectionId);
            return newExpanded;
        });
    }, []);

    /** Keeps a section expanded (e.g. after closing the field dialog) without toggling. */
    const expandSection = useCallback((sectionId: string | null | undefined) => {
        if (!sectionId) return;
        setExpandedSections((prev) => {
            if (prev.has(sectionId)) return prev;
            const next = new Set(prev);
            next.add(sectionId);
            return next;
        });
    }, []);

    // ── Add Page dialog state ─────────────────────────────────────────────────────
    const [isAddPageDialogOpen, setIsAddPageDialogOpen] = useState(false);
    const [newPageConfig, setNewPageConfig] = useState<NewPageConfig>({
        id: new Date().getTime().toString(),
        title: '',
        pageType: defaultPageType,
        paymentUrl: '',
        pageOrder: pages.length || null,
        quotesUrl: 'https://api.example.com/quotes',
    });

    // ── Page validation dialog ────────────────────────────────────────────────────
    const [isPageValidationDialogOpen, setIsPageValidationDialogOpen] = useState(false);
    const [selectedPageForValidation, setSelectedPageForValidation] = useState<Page | null>(null);
    const [isPageValidationApplyAttempted, setIsPageValidationApplyAttempted] = useState(false);

    // ── addPage (opens dialog) ────────────────────────────────────────────────────
    const addPage = useCallback(() => {
        setNewPageConfig({
            id: new Date().getTime().toString(),
            title: '',
            pageType: defaultPageType,
            paymentUrl: '',
            pageOrder: pages.length + 1,
            quotesUrl: 'https://api.example.com/quotes',
        });
        setIsAddPageDialogOpen(true);
    }, [defaultPageType, pages.length]);

    // ── handleCreatePage ──────────────────────────────────────────────────────────
    const handleCreatePage = useCallback(() => {
        if (!newPageConfig.title.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Please enter a page title.',
                variant: 'destructive',
            });
            return;
        }

        const newPage: Page = {
            id: `page-${Date.now()}`,
            title: newPageConfig.title,
            pageType: newPageConfig.pageType,
            pageOrder: newPageConfig.pageOrder || pages.length + 1,
            metadata: { active: true },
            sections: [],
            ...(newPageConfig.pageType === 'payment' ? { paymentUrl: newPageConfig.paymentUrl } : {}),
            ...(newPageConfig.pageType === 'quotesList' ? { quotesUrl: newPageConfig.quotesUrl } : {}),
        } as any;

        updatePages([...pages, newPage]);
        setSelectedPageId(newPage.id!);
        setExpandedPages((prev) => new Set([...prev, newPage.id!]));
        setIsAddPageDialogOpen(false);
        toast({
            title: 'Page Added',
            description: `"${newPage.title}" has been added.`,
        });
    }, [newPageConfig, pages, updatePages, setSelectedPageId, toast]);

    // ── deletePage ────────────────────────────────────────────────────────────────
    const deletePage = useCallback((pageId: string) => {
        if (pages.length === 1) {
            toast({
                title: 'Cannot Delete',
                description: 'At least one page is required.',
                variant: 'destructive',
            });
            return;
        }
        updatePages((prev) => prev.filter((page) => page.id !== pageId));
        if (selectedPageId === pageId) {
            const remainingPages = pages.filter((page) => page.id !== pageId);
            if (remainingPages.length > 0) {
                setSelectedPageId(remainingPages[0].id);
            }
        }
    }, [pages, updatePages, selectedPageId, setSelectedPageId, toast]);

    // ── duplicatePage ─────────────────────────────────────────────────────────────
    const duplicatePage = useCallback((pageId: string) => {
        updatePages((prev) => {
            const pageIndex = prev.findIndex((p) => p.id === pageId);
            if (pageIndex === -1) return prev;
            
            const pageToCopy = prev[pageIndex];
            const cloneId = `page${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            
            const clonedSections = (pageToCopy.sections || []).map(s => ({
                ...s,
                id: `section${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                fields: s.fields.map(f => ({
                    ...f,
                    id: `field${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    name: `${f.name}_copy_${Math.random().toString(36).substr(2, 5)}`,
                }))
            }));

            const copyPage = {
                ...pageToCopy,
                id: cloneId,
                title: `${pageToCopy.title} (Copy)`,
                sections: clonedSections
            };
            
            const newPages = [...prev];
            newPages.splice(pageIndex + 1, 0, copyPage);
            return newPages;
        });
        toast({
            title: 'Page duplicated',
            description: 'The page has been duplicated successfully.',
        });
    }, [updatePages, toast]);

    // ── updatePageTitle / Subtitle ────────────────────────────────────────────────
    const updatePageTitle = useCallback((pageId: string, title: string) => {
        updatePages((prev) => prev.map((page) => (page.id === pageId ? { ...page, title } : page)));
    }, [updatePages]);

    const updatePageSubtitle = useCallback((pageId: string, subtitle: string) => {
        updatePages((prev) => prev.map((page) => (page.id === pageId ? { ...page, subtitle } : page)));
    }, [updatePages]);

    const updatePageActive = useCallback((pageId: string, active: boolean) => {
        updatePages((prev) =>
            prev.map((page) => {
                if (page.id !== pageId) return page;

                const shouldDisablePage =
                    (page.sections || []).length > 1 &&
                    (page.sections || []).every((section) => section.metadata?.active === false);

                return {
                    ...page,
                    metadata: {
                        ...(page.metadata || {}),
                        active: shouldDisablePage ? false : active,
                    },
                };
            }),
        );
    }, [updatePages]);

    // ── Page Validations ──────────────────────────────────────────────────────────
    const getNumericFieldsForPage = useCallback((page: Page | null) => {
        if (!page) return [];
        const fields: { label: string; name: string }[] = [];
        page.sections?.forEach((section) => {
            section.fields.forEach((field) => {
                if (field.type === 'number') {
                    fields.push({ label: field.label, name: field.name });
                } else if (field.type === 'combination') {
                    field.subFields?.forEach((subField) => {
                        if (subField.type === 'number') {
                            fields.push({
                                label: `Sum of ${subField.label} (${field.label})`,
                                name: `${field.name}.${subField.name}`,
                            });
                        }
                    });
                }
            });
        });
        return fields;
    }, []);

    const handleAddPageValidation = useCallback(() => {
        setSelectedPageForValidation((prev) => {
            if (!prev) return prev;
            const newValidation: MultiFieldValidation = {
                id: Math.random().toString(36).substr(2, 9),
                fieldNames: [],
                condition: 'lessThan',
                value: 0,
                message: '',
            };
            return { ...prev, validations: [...(prev.validations || []), newValidation] };
        });
    }, []);

    const handleUpdatePageValidation = useCallback((
        validationId: string,
        updates: Partial<MultiFieldValidation>,
    ) => {
        setSelectedPageForValidation((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                validations: (prev.validations || []).map((v) =>
                    v.id === validationId ? { ...v, ...updates } : v,
                ),
            };
        });
    }, []);

    const handleDeletePageValidation = useCallback((validationId: string) => {
        setSelectedPageForValidation((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                validations: (prev.validations || []).filter((v) => v.id !== validationId),
            };
        });
    }, []);

    const getPageMultiFieldValidationIssues = useCallback((page: Page | null) => {
        const issuesById: Record<string, string[]> = {};
        if (!page) return { issuesById, hasIssues: false };

        const validations = page.validations || [];
        const numericFields = getNumericFieldsForPage(page);
        const validFieldNames = new Set(numericFields.map((f) => f.name));
        const seenKeyToFirstId = new Map<string, string>();

        const addIssue = (validationId: string, issue: string) => {
            const existing = issuesById[validationId] || [];
            if (!existing.includes(issue)) {
                issuesById[validationId] = [...existing, issue];
            }
        };

        validations.forEach((validation) => {
            const trimmedMessage = validation.message?.trim() || '';

            if (!validation.fieldNames || validation.fieldNames.length === 0) {
                addIssue(validation.id, 'Select at least one numeric field.');
            } else {
                const invalidSelectedNames = validation.fieldNames.filter(
                    (name) => !validFieldNames.has(name),
                );
                if (invalidSelectedNames.length > 0) {
                    addIssue(
                        validation.id,
                        `Selected field(s) no longer exist in this page: ${invalidSelectedNames.join(', ')}`,
                    );
                }
            }

            if (!validation.condition) addIssue(validation.id, 'Select a condition.');
            if (!Number.isFinite(validation.value)) addIssue(validation.id, 'Enter a numeric value.');
            if (!trimmedMessage) addIssue(validation.id, 'Enter an error message.');

            const canonicalFieldNames = Array.from(new Set(validation.fieldNames || [])).sort();
            if (canonicalFieldNames.length > 0 && validation.condition) {
                const key = `${canonicalFieldNames.join('|')}::${validation.condition}`;
                const firstId = seenKeyToFirstId.get(key);
                if (firstId) {
                    addIssue(firstId, 'Duplicate validation: same fields and condition already exist.');
                    addIssue(validation.id, 'Duplicate validation: same fields and condition already exist.');
                } else {
                    seenKeyToFirstId.set(key, validation.id);
                }
            }
        });

        const hasIssues = Object.values(issuesById).some((issues) => issues.length > 0);
        return { issuesById, hasIssues };
    }, [getNumericFieldsForPage]);

    const handleApplyPageValidation = useCallback(() => {
        if (!selectedPageForValidation) return;
        const { hasIssues } = getPageMultiFieldValidationIssues(selectedPageForValidation);
        if (hasIssues) {
            setIsPageValidationApplyAttempted(true);
            toast({
                title: 'Fix validation errors',
                description: 'Resolve the highlighted issues before applying changes.',
                variant: 'destructive',
            });
            return;
        }
        updatePages((prev) =>
            prev.map((p) => (p.id === selectedPageForValidation.id ? selectedPageForValidation : p)),
        );
        setHasUnsavedChanges(true);
        setIsPageValidationDialogOpen(false);
        setIsPageValidationApplyAttempted(false);
    }, [selectedPageForValidation, getPageMultiFieldValidationIssues, updatePages, setHasUnsavedChanges, toast]);

    const handleCancelPageValidation = useCallback(() => {
        setIsPageValidationDialogOpen(false);
        setIsPageValidationApplyAttempted(false);
    }, []);

    return {
        // Expansion state
        expandedPages,
        expandedSections,
        togglePageExpansion,
        toggleSectionExpansion,
        expandSection,
        // Add page
        isAddPageDialogOpen,
        setIsAddPageDialogOpen,
        newPageConfig,
        setNewPageConfig,
        addPage,
        handleCreatePage,
        // Delete / update / duplicate
        deletePage,
        duplicatePage,
        updatePageTitle,
        updatePageSubtitle,
        updatePageActive,
        // Validation dialog
        isPageValidationDialogOpen,
        setIsPageValidationDialogOpen,
        selectedPageForValidation,
        setSelectedPageForValidation,
        isPageValidationApplyAttempted,
        setIsPageValidationApplyAttempted,
        // Validation logic
        getNumericFieldsForPage,
        handleAddPageValidation,
        handleUpdatePageValidation,
        handleDeletePageValidation,
        getPageMultiFieldValidationIssues,
        handleApplyPageValidation,
        handleCancelPageValidation,
    };
}
