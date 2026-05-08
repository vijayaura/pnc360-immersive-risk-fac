import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, GripVertical, Save, Plus, X, FileText, CreditCard, List, Shield, FileCheck, Info, Loader2 } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import { Badge } from "@/components/ui/badge";
import { getProductWorkflow, updateWorkflow } from '@/features/product-config/api/workflow';

type PageType = "form" | "payment" | "quotesList" | "policyDetails" | "underwritingDocuments" | "requiredDocuments" | "additionalInformation";

interface WorkflowPage {
  id: string;
  title: string;
  pageType: PageType;
  order: number;
}

const WorkflowManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const productName = searchParams.get("productName") || "";
  const productVersion = searchParams.get("productVersion") || "";
  const productId = searchParams.get("productId") || "";
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  const componentKeyToPageType: Record<string, PageType> = {
    proposal_form: "form",
    required_documents: "requiredDocuments",
    additional_information: "additionalInformation",
    underwriting_documents: "requiredDocuments",
    policy_issuance_documents: "underwritingDocuments",
    quotes_list: "quotesList",
    policy_details: "policyDetails",
    payment: "payment",
  };
  const pageTypeToComponentKey: Record<PageType, string> = {
    form: "proposal_form",
    requiredDocuments: "underwriting_documents",
    additionalInformation: "additional_information",
    underwritingDocuments: "policy_issuance_documents",
    quotesList: "quotes_list",
    policyDetails: "policy_details",
    payment: "payment",
  };
  const mandatoryKeys: string[] = [
    "proposal_form",
    "quotes_list",
    "policy_details",
  ];
  const PROPOSAL_FORM_PAGE_TYPE: PageType = "form";
  const REQUIRED_DOCUMENTS_PAGE_TYPE: PageType = "requiredDocuments";
  const QUOTES_LIST_PAGE_TYPE: PageType = "quotesList";
  const ADDITIONAL_INFORMATION_PAGE_TYPE: PageType = "additionalInformation";

  // Available page types (excluding "form" which is the proposal form component)
  const availablePageTypes: { type: PageType; label: string; icon: React.ReactNode; description: string }[] = [
    {
      type: "payment",
      label: "Payment",
      icon: <CreditCard className="w-4 h-4" />,
      description: "Payment page component"
    },
    {
      type: "quotesList",
      label: "Quotes List",
      icon: <List className="w-4 h-4" />,
      description: "Quotes list page component"
    },
    {
      type: "additionalInformation",
      label: "Additional Information",
      icon: <Info className="w-4 h-4" />,
      description: "Additional information page component"
    },
    {
      type: "policyDetails",
      label: "Policy Details",
      icon: <FileText className="w-4 h-4" />,
      description: "Policy details page component"
    },
    {
      type: "underwritingDocuments",
      label: "Policy Issuance Documents",
      icon: <Shield className="w-4 h-4" />,
      description: "Documents generated and issued upon policy binding"
    },
    {
      type: "requiredDocuments",
      label: "Underwriting Document",
      icon: <FileCheck className="w-4 h-4" />,
      description: "Documents required for underwriting review and assessment"
    },
  ];

  const [workflowPages, setWorkflowPages] = useState<WorkflowPage[]>([
    { id: "proposal-form", title: "Proposal Form", pageType: "form", order: 0 }
  ]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const wouldBreakQuoteListOrdering = (pages: WorkflowPage[]) => {
    const quotesListIndex = pages.findIndex((page) => page.pageType === QUOTES_LIST_PAGE_TYPE);
    const additionalInformationIndex = pages.findIndex(
      (page) => page.pageType === ADDITIONAL_INFORMATION_PAGE_TYPE,
    );

    return (
      quotesListIndex !== -1 &&
      additionalInformationIndex !== -1 &&
      additionalInformationIndex < quotesListIndex
    );
  };

  const wouldBreakRequiredDocumentsOrdering = (pages: WorkflowPage[]) => {
    const proposalFormIndex = pages.findIndex((page) => page.pageType === PROPOSAL_FORM_PAGE_TYPE);
    const requiredDocumentsIndex = pages.findIndex(
      (page) => page.pageType === REQUIRED_DOCUMENTS_PAGE_TYPE,
    );
    const quotesListIndex = pages.findIndex((page) => page.pageType === QUOTES_LIST_PAGE_TYPE);

    if (proposalFormIndex !== -1 && requiredDocumentsIndex !== -1 && requiredDocumentsIndex <= proposalFormIndex) {
      return true;
    }

    if (quotesListIndex !== -1 && requiredDocumentsIndex !== -1 && requiredDocumentsIndex >= quotesListIndex) {
      return true;
    }

    return false;
  };

  const hasInvalidWorkflowOrdering = (pages: WorkflowPage[]) =>
    wouldBreakQuoteListOrdering(pages) || wouldBreakRequiredDocumentsOrdering(pages);

  // Load existing workflow if available
  useEffect(() => {
    const loadWorkflow = async () => {
      try {
        if (!productId) return;
        const response = await getProductWorkflow(productId);
        setWorkflowId(response?.id || null);
        const pages =
          Array.isArray(response?.steps)
            ? response.steps
              .slice()
              .sort((a: any, b: any) => (a.stepOrder || 0) - (b.stepOrder || 0))
              .map((s: any, idx: number) => {
                const key: string = s?.component?.key || "";
                const pageType = componentKeyToPageType[key] || "form";
                const title =
                  availablePageTypes.find((pt) => pt.type === pageType)?.label ||
                  s?.title ||
                  s?.component?.name ||
                  key;
                return {
                  id: s?.id || `${key}-${idx}`,
                  title,
                  pageType,
                  order: (s?.stepOrder ? s.stepOrder - 1 : idx),
                } as WorkflowPage;
              })
            : [];
        if (pages.length > 0) {
          const sortedPages = [...pages].sort((a, b) => a.order - b.order);
          const proposalFormPage = sortedPages.find((page) => page.pageType === PROPOSAL_FORM_PAGE_TYPE);
          const requiredDocumentsPage = sortedPages.find(
            (page) => page.pageType === REQUIRED_DOCUMENTS_PAGE_TYPE,
          );
          const remainingPages = sortedPages.filter(
            (page) =>
              page.pageType !== PROPOSAL_FORM_PAGE_TYPE &&
              page.pageType !== REQUIRED_DOCUMENTS_PAGE_TYPE,
          );

          if (proposalFormPage) {
            remainingPages.unshift(proposalFormPage);
          }

          if (requiredDocumentsPage) {
            const quotesListIndex = remainingPages.findIndex(
              (page) => page.pageType === QUOTES_LIST_PAGE_TYPE,
            );
            const insertIndex = quotesListIndex === -1 ? Math.max(remainingPages.length, 1) : quotesListIndex;
            remainingPages.splice(insertIndex, 0, requiredDocumentsPage);
          }

          setWorkflowPages(remainingPages.map((page, index) => ({ ...page, order: index })));
        }
      } catch (error) {
        console.error("❌ Failed to load workflow:", error);
      }
    };
    loadWorkflow();
  }, [productId]);

  const addPageToWorkflow = (pageType: PageType) => {
    const isAlreadyAdded = workflowPages.some(p => p.pageType === pageType);
    if (isAlreadyAdded) {
      toast({
        title: "Already Added",
        description: "This component is already in the workflow.",
        variant: "destructive",
      });
      return;
    }
    const newPage: WorkflowPage = {
      id: `${pageType}-${Date.now()}`,
      title: availablePageTypes.find(pt => pt.type === pageType)?.label || pageType,
      pageType,
      order: workflowPages.length
    };
    if (pageType === REQUIRED_DOCUMENTS_PAGE_TYPE) {
      const updatedPages = [...workflowPages];
      const proposalFormIndex = updatedPages.findIndex(
        (page) => page.pageType === PROPOSAL_FORM_PAGE_TYPE,
      );
      const quotesListIndex = updatedPages.findIndex(
        (page) => page.pageType === QUOTES_LIST_PAGE_TYPE,
      );

      const insertIndex =
        quotesListIndex !== -1
          ? quotesListIndex
          : proposalFormIndex !== -1
            ? proposalFormIndex + 1
            : updatedPages.length;

      updatedPages.splice(insertIndex, 0, newPage);
      setWorkflowPages(updatedPages.map((page, index) => ({ ...page, order: index })));
    } else if (pageType === ADDITIONAL_INFORMATION_PAGE_TYPE) {
      const quotesListIndex = workflowPages.findIndex(
        (page) => page.pageType === QUOTES_LIST_PAGE_TYPE,
      );

      if (quotesListIndex !== -1) {
        const updatedPages = [...workflowPages];
        updatedPages.splice(quotesListIndex + 1, 0, newPage);
        setWorkflowPages(updatedPages.map((page, index) => ({ ...page, order: index })));
      } else {
        setWorkflowPages([...workflowPages, newPage]);
      }
    } else {
      setWorkflowPages([...workflowPages, newPage]);
    }
    toast({
      title: "Page Added",
      description: `${newPage.title} has been added to the workflow.`,
    });
  };

  const removePageFromWorkflow = (pageId: string) => {
    if (pageId === "proposal-form") {
      toast({
        title: "Cannot Remove",
        description: "Proposal Form is a required component and cannot be removed.",
        variant: "destructive",
      });
      return;
    }
    const updatedPages = workflowPages.filter(page => page.id !== pageId);
    setWorkflowPages(updatedPages.map((page, index) => ({ ...page, order: index })));
    toast({
      title: "Page Removed",
      description: "Page has been removed from the workflow.",
    });
  };

  const movePage = (fromIndex: number, toIndex: number) => {
    const newPages = [...workflowPages];
    const [moved] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, moved);

    if (hasInvalidWorkflowOrdering(newPages)) {
      return false;
    }

    const reorderedPages = newPages.map((page, index) => ({ ...page, order: index }));
    setWorkflowPages(reorderedPages);
    return true;
  };

  const handleDragStart = (index: number) => {
    if (workflowPages[index]?.pageType === PROPOSAL_FORM_PAGE_TYPE) {
      return;
    }
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    if (draggedIndex !== index) {
      const didMove = movePage(draggedIndex, index);
      if (didMove) {
        setDraggedIndex(index);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (!workflowId) {
        toast({
          title: "Workflow Missing",
          description: "No workflow ID found to save.",
          variant: "destructive",
        });
        return;
      }
      const sorted = [...workflowPages].sort((a, b) => a.order - b.order);
      const payload = {
        steps: sorted.map(p => ({
          componentKey: pageTypeToComponentKey[p.pageType],
          title: p.title,
        })),
      };

      if (hasInvalidWorkflowOrdering(sorted)) {
        toast({
          title: "Invalid Workflow Order",
          description: "Underwriting Document must stay after Proposal Form and before Quotes List.",
          variant: "destructive",
        });
        return;
      }

      await updateWorkflow(workflowId, payload);
      toast({
        title: "Workflow Saved",
        description: "Workflow has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save workflow",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPageTypeIcon = (pageType: PageType) => {
    if (pageType === "form") return <FileText className="w-4 h-4" />;
    const pageTypeInfo = availablePageTypes.find(pt => pt.type === pageType);
    return pageTypeInfo?.icon || <FileText className="w-4 h-4" />;
  };

  const getPageTypeBadge = (pageType: PageType) => {
    if (pageType === "form") {
      return <Badge variant="default" className="bg-primary">Proposal Form</Badge>;
    }
    const pageTypeInfo = availablePageTypes.find(pt => pt.type === pageType);
    return <Badge variant="outline">{pageTypeInfo?.label || pageType}</Badge>;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Workflow Management</h1>
            <p className="text-sm text-muted-foreground">
              {productName}{productVersion ? ` - Version ${productVersion}` : ''}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          className="gap-2"
          disabled={
            isSaving ||
            (() => {
              const usedKeys = new Set(
                workflowPages.map(p => pageTypeToComponentKey[p.pageType])
              );
              return mandatoryKeys.some(k => !usedKeys.has(k));
            })()
          }
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Saving Workflow..." : "Save Workflow"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6">
        <div className="w-full max-w-full grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
          {/* Left Column - Available Page Types */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Available Components</CardTitle>
              <CardDescription>Add page components to your workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {availablePageTypes.map((pageType) => (
                <Button
                  key={pageType.type}
                  variant="outline"
                  className="w-full justify-start gap-2 h-auto p-3 group"
                  onClick={() => addPageToWorkflow(pageType.type)}
                  disabled={workflowPages.some(p => p.pageType === pageType.type)}
                >
                  {pageType.icon}
                  <div className="flex-1 text-left">
                    <div className="font-medium">{pageType.label}</div>
                    <div className="text-xs text-muted-foreground group-hover:text-primary-foreground/80">{pageType.description}</div>
                  </div>
                  <Plus className="w-4 h-4" />
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Right Column - Workflow Builder */}
          <Card className="lg:col-span-2">
              <CardTitle>Workflow Builder</CardTitle>
            <CardHeader>
              <CardDescription>Drag and drop to reorder pages in your workflow</CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="space-y-3">
                {workflowPages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No pages in workflow</p>
                    <p className="text-sm mt-2">Add components from the left panel to build your workflow</p>
                  </div>
                ) : (
                  [...workflowPages]
                    .sort((a, b) => a.order - b.order)
                    .map((page, index) => {
                      const isProposalForm = page.pageType === PROPOSAL_FORM_PAGE_TYPE;

                      return (
                        <div
                          key={page.id}
                          draggable={!isProposalForm}
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`
                            flex items-center gap-3 p-4 border rounded-lg cursor-move
                            transition-all hover:shadow-md
                            ${isProposalForm ? 'cursor-default' : ''}
                            ${draggedIndex === index ? 'opacity-50 border-primary' : 'border-border'}
                          `}
                        >
                          <GripVertical className={`w-5 h-5 text-muted-foreground ${isProposalForm ? 'opacity-40' : ''}`} />
                          <div className="flex-1 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                              {getPageTypeIcon(page.pageType)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{page.title}</div>
                              <div className="text-sm text-muted-foreground">
                                Step {index + 1} of {workflowPages.length}
                              </div>
                            </div>
                            {getPageTypeBadge(page.pageType)}
                          </div>
                          {!['form', 'quotesList', 'policyDetails'].includes(page.pageType) ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePageFromWorkflow(page.id)}
                              className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled
                              className="opacity-30 cursor-not-allowed"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkflowManagement;


