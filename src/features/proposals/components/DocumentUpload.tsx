import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigationHistory } from '@/shared/hooks/use-navigation-history';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Download,
  Eye,
  Trash2,
  Loader2
} from "lucide-react";
import { uploadRequiredDocument } from '@/features/quotes/api/quotes';
import {
  uploadDeclarationDocument,
  uploadEndorsementDocument,
  getDeclarationSignedUrl,
  deleteUploadedFile,
} from '@/features/product-config/required-docs/api/requiredDocuments';
import { useDeclarationUploadsStore } from '@/shared/stores/useDeclarationUploadsStore';
import { useEndorsementUploadsStore } from '@/shared/stores/useEndorsementUploadsStore';
import { useUnderwritingUploadsStore } from '@/shared/stores/useUnderwritingUploadsStore';
import { useToast } from '@/shared/hooks/use-toast';
import { handleDirectDownload } from '@/shared/utils/fileUtils';
import { cn } from '@/shared/utils/lib-utils';

interface DocumentItem {
  id: string | any;
  name: string;
  displayLabel?: string;
  description: string;
  required: boolean;
  validationQuestions?: Array<{
    id?: string;
    question: string;
    [key: string]: unknown;
  }>;
  status: "pending" | "uploaded" | "approved" | "rejected" | "uploading";
  fileSize: string | null;
  fileName?: string;
  fileUrl?: string;
  /** Id from upload-doc API response; use this (not document type id) when calling delete. */
  uploadedFileId?: string | number;
  aiValidationResult?: {
    is_valid_document: boolean;
    description_message: string;
  };
}

interface DocumentUploadProps {
  documents?: DocumentItem[];
  onDocumentStatusChange?: (documents: DocumentItem[]) => void;
  onDocumentTypesLoaded?: (documents: DocumentItem[]) => void;
  formResponseId?: string | number;
  mode?: "required" | "declaration" | "endorsement";
  templateUrls?: Record<string | number, string>;
  productId?: string | number;
  endorsementId?: string;
  /**
   * When true, trust incoming documents exactly as backend source-of-truth
   * and do not merge persisted declaration-upload cache over them.
   */
  preferServerState?: boolean;
}

export const DocumentUpload = ({
  documents: propDocuments,
  onDocumentStatusChange,
  onDocumentTypesLoaded,
  formResponseId,
  mode = "required",
  templateUrls = {},
  productId,
  endorsementId,
  preferServerState = false,
}: DocumentUploadProps) => {
  const [documents, setDocuments] = useState<DocumentItem[]>(propDocuments || []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingDocs, setUploadingDocs] = useState<Set<string | number>>(new Set());
  const navigate = useNavigate();
  const { navigateBack } = useNavigationHistory();
  const { toast } = useToast();
  const getDeclarationUploads = useDeclarationUploadsStore((state) => state.getAll);
  const getDeclarationUpload = useDeclarationUploadsStore((state) => state.getUploaded);
  const setDeclarationUpload = useDeclarationUploadsStore((state) => state.setUploaded);
  const removeDeclarationUpload = useDeclarationUploadsStore((state) => state.removeUploaded);
  const getEndorsementUploads = useEndorsementUploadsStore((state) => state.getAll);
  const getEndorsementUpload = useEndorsementUploadsStore((state) => state.getUploaded);
  const setEndorsementUpload = useEndorsementUploadsStore((state) => state.setUploaded);
  const removeEndorsementUpload = useEndorsementUploadsStore((state) => state.removeUploaded);
  const getUnderwritingUploads = useUnderwritingUploadsStore((state) => state.getAll);
  const getUnderwritingUpload = useUnderwritingUploadsStore((state) => state.getUploaded);
  const setUnderwritingUpload = useUnderwritingUploadsStore((state) => state.setUploaded);
  const removeUnderwritingUpload = useUnderwritingUploadsStore((state) => state.removeUploaded);
  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (bytes >= 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${bytes} B`;
  };
  const getAiValidationResult = (payload: any) => {
    if (payload?.ai_validation_result && typeof payload.ai_validation_result === 'object') {
      return payload.ai_validation_result;
    }
    if (payload?.metadata?.aiValidation && typeof payload.metadata.aiValidation === 'object') {
      return payload.metadata.aiValidation;
    }
    return undefined;
  };
  const hasCompletedUpload = (
    doc?: Partial<DocumentItem> | null,
  ) => {
    if (!doc) return false;
    if (doc.status === "uploaded") return true;
    if (typeof doc.fileUrl === "string" && doc.fileUrl.trim() !== "") return true;
    if (typeof doc.fileName === "string" && doc.fileName.trim() !== "") return true;
    if (doc.uploadedFileId != null) return true;
    if (doc.aiValidationResult != null) return true;
    return false;
  };
  // Update local state when props change
  useEffect(() => {
    if (propDocuments) {
      // Build next documents from props (optionally merged with declaration persisted uploads).
      let nextDocs: DocumentItem[];
      if (
        (mode === "declaration" || mode === "required" || mode === "endorsement") &&
        !preferServerState &&
        formResponseId !== undefined &&
        formResponseId !== null
      ) {
        const uploadedMap =
          mode === "declaration"
            ? getDeclarationUploads(formResponseId)
            : mode === "endorsement"
              ? getEndorsementUploads(formResponseId)
              : getUnderwritingUploads(formResponseId);
        nextDocs = propDocuments.map((doc) => {
          const up = uploadedMap[String(doc.id)];
          if (up) {
            return {
              ...doc,
              status: "uploaded" as const,
              fileName: up.originalFilename || (up as any).filename || doc.fileName,
              fileUrl: up.url || (up as any).fileUrl || doc.fileUrl,
              fileSize: (up as any)?.sizeBytes ? formatSize((up as any).sizeBytes) : doc.fileSize || null,
              uploadedFileId: (up as any)?.id ?? doc.uploadedFileId,
              aiValidationResult: getAiValidationResult(up) ?? doc.aiValidationResult,
            };
          }
          return doc;
        });
      } else {
        nextDocs = propDocuments;
      }

      const docKey = (id: string | number) => String(id);

      // Preserve in-flight upload UI when parent re-renders during upload.
      // For required/endorsement, also keep a completed upload if props briefly lag behind parent state.
      setDocuments((prev) =>
        nextDocs.map((doc) => {
          if (uploadingDocs.has(doc.id) || uploadingDocs.has(docKey(doc.id))) {
            const current = prev.find((p) => docKey(p.id) === docKey(doc.id));
            if (!current) return doc;
            return {
              ...doc,
              status: "uploading" as const,
              fileName: current.fileName,
              fileUrl: current.fileUrl,
              fileSize: current.fileSize,
            };
          }
          const current = prev.find((p) => docKey(p.id) === docKey(doc.id));
          const propComplete = hasCompletedUpload(doc);
          const prevComplete = hasCompletedUpload(current);
          const hasPersistedUpload =
            formResponseId !== undefined &&
            formResponseId !== null &&
            (mode === "declaration"
              ? getDeclarationUpload(formResponseId, doc.id)
              : mode === "endorsement"
                ? getEndorsementUpload(formResponseId, doc.id)
                : mode === "required"
                  ? getUnderwritingUpload(formResponseId, doc.id)
                  : undefined);
          if (prevComplete && !propComplete && current && hasPersistedUpload) {
            return current;
          }
          return doc;
        }),
      );
      setIsLoading(false);
    }
  }, [
    propDocuments,
    mode,
    formResponseId,
    getDeclarationUploads,
    getEndorsementUploads,
    getUnderwritingUploads,
    getDeclarationUpload,
    getEndorsementUpload,
    getUnderwritingUpload,
    preferServerState,
    uploadingDocs,
  ]);

  // Disable API loading path entirely; rely on provided documents from parent
  useEffect(() => {
    if (!propDocuments || propDocuments.length === 0) {
      setIsLoading(false);
      setError(null);
    }
  }, [propDocuments]);

  const handleSubmit = () => {
    navigate('/customer/quotes');
  };

  const handleFileSelect = (docId: string | number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileUpload(docId, file);
      }
    };
    input.click();
  };

  const handleFileUpload = async (docId: string | number, file: File) => {
    try {
      // Add to uploading set
      setUploadingDocs(prev => new Set(prev).add(docId));
      
      // Update document status to uploading
      const updatedDocuments = documents.map(doc => 
        doc.id === docId 
          ? { ...doc, status: "uploading" as const }
          : doc
      );
      setDocuments(updatedDocuments);
      
      // Ensure response ID is present
      if (formResponseId === undefined || formResponseId === null) {
        throw new Error("Missing responseId. Please save the form first.");
      }
      let uploadResponse: any = null;
      const targetDoc = documents.find((doc) => String(doc.id) === String(docId));
      const displayLabel = targetDoc?.displayLabel ?? targetDoc?.name;
      if (mode === "declaration") {
        uploadResponse = await uploadDeclarationDocument(formResponseId, file, {
          displayLabel,
          validationQuestions: targetDoc?.validationQuestions ?? [],
        });
      } else if (mode === "endorsement") {
        uploadResponse = await uploadEndorsementDocument(
          formResponseId,
          file,
          {
            displayLabel,
            validationQuestions: targetDoc?.validationQuestions ?? [],
          },
          endorsementId,
        );
      } else {
        uploadResponse = await uploadRequiredDocument(formResponseId, docId, file, {
          displayLabel,
          validationQuestions: targetDoc?.validationQuestions ?? [],
        });
      }
      // Unwrap `{ data: T }` or use flat body (quote/required-doc returns flat JSON)
      const rawPayload =
        uploadResponse &&
        typeof uploadResponse === 'object' &&
        uploadResponse !== null &&
        'data' in uploadResponse &&
        (uploadResponse as any).data &&
        typeof (uploadResponse as any).data === 'object'
          ? (uploadResponse as any).data
          : uploadResponse;
      const deepUrl =
        rawPayload?.url ||
        rawPayload?.fileUrl ||
        '';
      const deepId = rawPayload?.id != null ? rawPayload.id : null;
      const deepFilename =
        rawPayload?.originalFilename ||
        rawPayload?.filename ||
        file.name;
      const sizeBytes =
        typeof rawPayload?.size === 'number' && Number.isFinite(rawPayload.size)
          ? rawPayload.size
          : file.size;
      const aiValidationResult = getAiValidationResult(rawPayload);

      // Update document with uploaded file info (functional update avoids stale closure after await)
      let mergedForCallback: DocumentItem[] | null = null;
      setDocuments((prev) => {
        const next = prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                status: "uploaded" as const,
                fileName: deepFilename,
                fileUrl: deepUrl,
                fileSize: formatSize(sizeBytes),
                aiValidationResult,
                ...((mode === 'required' || mode === 'endorsement') &&
                  deepId != null && { uploadedFileId: deepId }),
              }
            : doc,
        );
        mergedForCallback = next;
        return next;
      });

      if (mode === "declaration") {
        setDeclarationUpload(formResponseId as any, docId, {
          ...uploadResponse,
          url: deepUrl,
          originalFilename: deepFilename,
        } as any);
      } else if (mode === "required") {
        setUnderwritingUpload(formResponseId as any, docId, {
          ...uploadResponse,
          url: deepUrl,
          originalFilename: deepFilename,
          ai_validation_result: aiValidationResult,
        } as any);
      } else if (mode === "endorsement") {
        setEndorsementUpload(formResponseId as any, docId, {
          ...uploadResponse,
          url: deepUrl,
          originalFilename: deepFilename,
          ai_validation_result: aiValidationResult,
        } as any);
      }

      if (onDocumentStatusChange && mergedForCallback) {
        onDocumentStatusChange(mergedForCallback);
      }
      
      if (deepUrl) {
        toast({
          title: "File Uploaded",
          description: `${deepFilename} has been uploaded successfully.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Warning",
          description: `File may not have uploaded properly. No URL returned.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('File upload error:', error);
      
      // Revert to pending status on error
      const errorDocuments = documents.map(doc => 
        doc.id === docId 
          ? { ...doc, status: "pending" as const }
          : doc
      );
      setDocuments(errorDocuments);
      
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Remove from uploading set
      setUploadingDocs(prev => {
        const newSet = new Set(prev);
        newSet.delete(docId);
        return newSet;
      });
    }
  };

  const [deletingDocId, setDeletingDocId] = useState<string | number | null>(null);

  const handleRemoveFile = async (doc: DocumentItem) => {
    const docId = doc.id;
    const fileIdToDelete =
      mode === "declaration" && formResponseId != null
        ? getDeclarationUpload(formResponseId as any, docId)?.id ?? docId
        : doc.uploadedFileId != null
          ? doc.uploadedFileId
          : docId;
    if (doc.status === "uploaded") {
      setDeletingDocId(docId);
      try {
        await deleteUploadedFile(fileIdToDelete);
      } catch (err: any) {
        toast({
          title: "Delete Failed",
          description: err?.message || "Failed to delete file. Please try again.",
          variant: "destructive",
        });
        setDeletingDocId(null);
        return;
      }
      setDeletingDocId(null);
    }
    const updatedDocuments = documents.map(doc => 
      doc.id === docId 
        ? { 
            ...doc, 
            status: "pending" as const,
            fileName: undefined,
            fileUrl: undefined,
            fileSize: null,
            uploadedFileId: undefined,
            aiValidationResult: undefined,
          }
        : doc
    );
    setDocuments(updatedDocuments);
    if (mode === "declaration" && formResponseId !== undefined && formResponseId !== null) {
      removeDeclarationUpload(formResponseId as any, docId);
    }
    if (mode === "required" && formResponseId !== undefined && formResponseId !== null) {
      removeUnderwritingUpload(formResponseId as any, docId);
    }
    if (mode === "endorsement" && formResponseId !== undefined && formResponseId !== null) {
      removeEndorsementUpload(formResponseId as any, docId);
    }
    
    // Notify parent component about status change
    if (onDocumentStatusChange) {
      onDocumentStatusChange(updatedDocuments);
    }
    
    toast({
      title: "File Removed",
      description: "File has been removed successfully.",
      variant: "default",
    });
  };

  const uploadedDocs = documents.filter(doc => doc.status === "uploaded").length;
  const totalRequired = documents.filter(doc => doc.required).length;
  const allRequiredUploaded = documents.filter(doc => doc.required && doc.status === "uploaded").length === totalRequired;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploaded":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "uploading":
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case "pending":
        return <Clock className="w-5 h-5 text-warning" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string, required: boolean) => {
    if (status === "uploaded") {
      return <Badge variant="outline" className="text-success border-success">Uploaded</Badge>;
    }
    if (status === "uploading") {
      return <Badge variant="outline" className="text-primary border-primary">Uploading...</Badge>;
    }
    if (status === "pending" && required) {
      return <Badge variant="outline" className="text-warning border-warning">Required</Badge>;
    }
    if (status === "pending" && !required) {
      return <Badge variant="outline" className="text-muted-foreground">Optional</Badge>;
    }
    return null;
  };

  const getValidationIndicator = (
    aiValidationResult?: {
      is_valid_document: boolean;
      description_message: string;
    },
  ) => {
    if (!aiValidationResult?.description_message) return null;
    if (aiValidationResult.is_valid_document) {
      return (
        <div className="flex items-start gap-2 rounded-md border border-success/20 bg-success/5 px-3 py-2 text-xs text-success lg:text-sm">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{aiValidationResult.description_message}</span>
        </div>
      );
    }
    return (
      <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive lg:text-sm">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{aiValidationResult.description_message}</span>
      </div>
    );
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="grid gap-4 lg:gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border border-muted/30 bg-muted/5">
              <CardContent className="p-4 lg:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-1 gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-40 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-56 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-9 w-24 shrink-0 rounded-md bg-muted animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (!documents || documents.length === 0) {
    return (
      <div className="w-full">
        <Alert variant="default" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No required documents were provided. Please configure document types or pass them as props.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Document List */}
      <div className="grid gap-4 lg:gap-6">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className={cn(
                'transition-all duration-200 border',
                doc.status === 'uploaded' &&
                  'border-border bg-card shadow-sm ring-1 ring-inset ring-success/20',
                doc.status !== 'uploaded' &&
                  doc.required &&
                  'border-primary/25 bg-primary/5 hover:border-primary/35',
                doc.status !== 'uploaded' &&
                  !doc.required &&
                  'border-border bg-card/80 hover:border-primary/25',
              )}
            >
              <CardContent className="p-4 lg:p-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                    <div className="flex min-w-0 flex-1 gap-3 lg:gap-4">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40',
                          doc.status === 'uploaded' && 'border-success/30 bg-success/10',
                        )}
                      >
                        {getStatusIcon(doc.status)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-sm text-foreground lg:text-base">
                            {doc.name}
                          </h4>
                          {getStatusBadge(doc.status, doc.required)}
                        </div>
                        {doc.description ? (
                          <p className="text-xs text-muted-foreground lg:text-sm">{doc.description}</p>
                        ) : null}
                        {doc.status === 'uploaded' && doc.fileName ? (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground lg:text-sm">
                            <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-foreground">
                              <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                              <span className="truncate" title={doc.fileName}>
                                {doc.fileName}
                              </span>
                            </span>
                            {doc.fileSize ? (
                              <span className="text-muted-foreground">· {doc.fileSize}</span>
                            ) : null}
                          </div>
                        ) : null}
                        {doc.status === 'uploading' ? (
                          <p className="text-xs font-medium text-primary lg:text-sm">Uploading…</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end [&>button]:h-9 [&>button]:shrink-0">
                      {doc.status === 'uploaded' ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5 px-3 text-xs"
                            onClick={() => {
                              if (doc.fileUrl) window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
                            }}
                            disabled={!doc.fileUrl}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5 px-3 text-xs"
                            onClick={() => {
                              if (doc.fileUrl) {
                                handleDirectDownload(doc.fileUrl, doc.fileName || doc.name || 'document');
                              }
                            }}
                            disabled={!doc.fileUrl}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5 px-3 text-xs text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 hover:text-destructive"
                            onClick={() => handleRemoveFile(doc)}
                            disabled={deletingDocId === doc.id}
                          >
                            {deletingDocId === doc.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Remove
                          </Button>
                        </>
                      ) : doc.status === 'uploading' ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled
                          className="gap-2 border-primary/40 bg-primary/5 px-3 text-xs text-primary"
                        >
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Uploading…
                        </Button>
                      ) : (
                        <>
                          {mode === 'declaration' && templateUrls[doc.id] ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1.5 px-3 text-xs"
                              onClick={() =>
                                handleDirectDownload(
                                  templateUrls[doc.id],
                                  `${doc.name || 'document'} Template`,
                                )
                              }
                            >
                              <Download className="h-3.5 w-3.5" />
                              Template
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            className="gap-2 px-4 text-xs shadow-sm"
                            onClick={() => handleFileSelect(doc.id)}
                            disabled={uploadingDocs.has(doc.id)}
                          >
                            <Upload className="h-3.5 w-3.5" />
                            Upload
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {doc.status === 'uploaded' ? getValidationIndicator(doc.aiValidationResult) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
    </div>
  );
};


