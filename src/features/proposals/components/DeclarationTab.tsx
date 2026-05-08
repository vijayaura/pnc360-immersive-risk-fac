import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Download,
  Upload,
  Check,
  X,
  AlertCircle,
  Eye,
  Trash2,
  RefreshCw
} from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import {
  getRequiredDocuments,
  uploadFile,
  createDocumentSubmission
} from '@/features/quotes/api/quotes';
import { ApiError } from "@/lib/api/client";

interface DocumentItem {
  id: number;
  label: string;
  description: string;
  is_required: boolean;
  status: string;
  url: string;
  uploadedFile?: {
    name: string;
    size: string;
    uploadDate: string;
    url: string;
  };
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'error';
}

interface DeclarationTabProps {
  onPolicyIssued?: () => void; // Callback to notify parent when policy is issued
}

const DeclarationTab: React.FC<DeclarationTabProps> = ({ onPolicyIssued }) => {
  const navigate = useNavigate();
  const { toast } = useToast();


  // State management
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Get insurer and product IDs from localStorage or URL params
  const getInsurerAndProductIds = () => {
    // Try to get from localStorage first
    const storedInsurerId = localStorage.getItem('selected_insurer_id');
    const storedProductId = localStorage.getItem('selected_product_id');

    if (storedInsurerId && storedProductId) {
      return {
        insurerId: parseInt(storedInsurerId),
        productId: parseInt(storedProductId)
      };
    }

    // Fallback to URL params or default values
    const urlParams = new URLSearchParams(window.location.search);
    const insurerId = parseInt(urlParams.get('insurerId') || '1');
    const productId = parseInt(urlParams.get('productId') || '1');

    return { insurerId, productId };
  };

  // Load required documents from API
  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { insurerId, productId } = getInsurerAndProductIds();

      console.log('🔍 DeclarationTab - Loading documents for insurer:', insurerId, 'product:', productId);

      if (!insurerId || !productId) {
        throw new Error('Insurer ID or Product ID not found. Please refresh the page and try again.');
      }

      const response = await getRequiredDocuments(insurerId, productId);
      console.log('🔍 DeclarationTab - Documents loaded:', response);

      // Filter only ACTIVE documents and transform to display format
      const activeDocuments = response.documents.filter(doc => doc.status === 'ACTIVE');
      const transformedDocs: DocumentItem[] = activeDocuments.map(doc => ({
        id: doc.id,
        label: doc.label || 'Unknown Document',
        description: doc.description || '',
        is_required: !!doc.is_required,
        status: doc.status,
        url: doc.url || '',
        uploadStatus: 'pending' as const
      }));

      setDocuments(transformedDocs);

    } catch (err) {
      console.error('❌ Error loading documents:', err);

      let errorMessage = 'Failed to load required documents. Please try again.';

      if (err instanceof ApiError) {
        switch (err.status) {
          case 400:
            errorMessage = 'Invalid request. Please check your parameters and try again.';
            break;
          case 401:
            errorMessage = 'Authentication required. Please log in again.';
            break;
          case 403:
            errorMessage = 'Access denied. You do not have permission to view these documents.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = err.message || errorMessage;
        }
      }

      setError(errorMessage);

      toast({
        title: "Failed to Load Documents",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // File upload functionality
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, docId: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('🔍 DeclarationTab - Starting file upload for document ID:', docId);
    console.log('🔍 DeclarationTab - File selected:', file.name, file.size, file.type);

    // Clear the input so the same file can be selected again
    event.target.value = '';

    try {
      // Set uploading state
      setUploading(prev => new Set(prev).add(docId));

      // Update document status to uploading
      setDocuments(prevDocs =>
        prevDocs.map(doc =>
          doc.id === docId
            ? { ...doc, uploadStatus: "uploading" as const }
            : doc
        )
      );

      // Upload file using the API
      const uploadResponse = await uploadFile(file);

      if (uploadResponse.files && uploadResponse.files.length > 0) {
        const uploadedFile = uploadResponse.files[0];
        const fileSizeInMB = (uploadedFile.size_bytes / (1024 * 1024)).toFixed(1);

        // Update document with uploaded file info
        setDocuments(prevDocs => {
          const updated = prevDocs.map(doc =>
            doc.id === docId
              ? {
                ...doc,
                uploadStatus: "uploaded" as const,
                uploadedFile: {
                  name: uploadedFile.original_name,
                  size: `${fileSizeInMB} MB`,
                  uploadDate: new Date().toISOString().split('T')[0],
                  url: uploadedFile.url
                }
              }
              : doc
          );

          console.log('🔍 DeclarationTab - Document updated with upload info:', updated.find(d => d.id === docId));
          return updated;
        });

        toast({
          title: "File Uploaded Successfully",
          description: `${uploadedFile.original_name} has been uploaded successfully.`
        });
      } else {
        throw new Error('No file data returned from upload');
      }
    } catch (error: any) {
      console.error('❌ DeclarationTab - File upload error:', error);

      // Revert to pending status on error
      setDocuments(prevDocs =>
        prevDocs.map(doc =>
          doc.id === docId
            ? { ...doc, uploadStatus: "error" as const }
            : doc
        )
      );

      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    } finally {
      // Remove from uploading set
      setUploading(prev => {
        const newSet = new Set(prev);
        newSet.delete(docId);
        return newSet;
      });
    }
  };

  // Remove uploaded file
  const removeUploadedFile = (docId: number) => {
    setDocuments(prevDocs =>
      prevDocs.map(doc =>
        doc.id === docId
          ? {
            ...doc,
            uploadedFile: undefined,
            uploadStatus: "pending" as const
          }
          : doc
      )
    );

    toast({
      title: "File Removed",
      description: "Uploaded file has been removed."
    });
  };

  // Download template
  const handleDownloadTemplate = (url: string, label: string) => {
    if (!url) {
      toast({
        title: "Template Not Available",
        description: "Template file is not available for this document.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🔍 DeclarationTab - Downloading template:', url, 'for document:', label);

      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = url;

      // Extract filename from URL or use label as fallback
      const filename = url.includes('/')
        ? url.split('/').pop() || `${label}_template.pdf`
        : url;

      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Template Downloaded",
        description: `${label} template has been downloaded.`
      });
    } catch (error) {
      console.error('❌ DeclarationTab - Error downloading template:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download template. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Validate that all required documents are uploaded
  const validateRequiredDocuments = (): boolean => {
    const requiredDocs = documents.filter(doc => doc.is_required);
    const uploadedDocs = requiredDocs.filter(doc => doc.uploadedFile && doc.uploadStatus === 'uploaded');

    console.log('🔍 DeclarationTab - Validation - Total documents:', documents.length);
    console.log('🔍 DeclarationTab - Validation - Required documents:', requiredDocs.length);
    console.log('🔍 DeclarationTab - Validation - Uploaded documents:', uploadedDocs.length);
    console.log('🔍 DeclarationTab - Validation - Required docs details:', requiredDocs.map(d => ({
      id: d.id,
      label: d.label,
      hasFile: !!d.uploadedFile,
      status: d.uploadStatus
    })));

    if (uploadedDocs.length !== requiredDocs.length) {
      const missingDocs = requiredDocs.filter(doc => !doc.uploadedFile || doc.uploadStatus !== 'uploaded');
      const missingLabels = missingDocs.map(doc => doc.label).join(', ');

      console.log('🔍 DeclarationTab - Validation - Missing documents:', missingLabels);

      toast({
        title: "Missing Required Documents",
        description: `Please upload the following required documents: ${missingLabels}`,
        variant: "destructive"
      });
      return false;
    }

    console.log('🔍 DeclarationTab - Validation - All required documents uploaded successfully');
    return true;
  };

  // Submit documents and create policy
  const handleSubmitDocuments = async () => {
    try {
      setSubmitting(true);

      // Validate required documents
      if (!validateRequiredDocuments()) {
        return;
      }

      // Get quote ID from storage
      const storedQuoteId = localStorage.getItem('currentQuoteId');
      if (!storedQuoteId) {
        throw new Error('Quote ID not found in storage. Please refresh the page and try again.');
      }

      // Get product ID
      const { productId } = getInsurerAndProductIds();

      // Build declaration documents payload
      const uploadedDocs = documents.filter(doc => doc.uploadedFile && doc.uploadStatus === 'uploaded');
      const declarationDocuments = uploadedDocs.map(doc => ({
        label: doc.label,
        url: doc.uploadedFile?.url || ''
      }));

      const payload = {
        product_id: productId,
        declaration_documents: declarationDocuments
      };

      console.log('🔍 DeclarationTab - Submitting declaration documents:', payload);

      // Call the POST API
      const response = await createDocumentSubmission(parseInt(storedQuoteId), payload);

      console.log('🔍 DeclarationTab - Declaration documents submitted successfully:', response);

      // Store policy data for success page
      if (response.policy) {
        localStorage.setItem('policyId', response.policy.id.toString());
        localStorage.setItem('policyQuoteId', response.policy.quote_id.toString());
        localStorage.setItem('policyDetails', JSON.stringify(response.policy));
        console.log('🔍 DeclarationTab - Stored policy data:', {
          policyId: response.policy.id,
          quoteId: response.policy.quote_id
        });
      }

      // Show success message
      toast({
        title: "Policy Created Successfully",
        description: "All required documents have been submitted and policy has been created."
      });

      // Notify parent component that policy has been issued
      onPolicyIssued?.();

      // Navigate to success page
      navigate('/customer/success');

    } catch (err) {
      console.error('❌ DeclarationTab - Error in document submission:', err);

      let errorMessage = 'Failed to submit documents. Please try again.';

      if (err instanceof ApiError) {
        switch (err.status) {
          case 400:
            errorMessage = 'Invalid document data. Please check your uploads and try again.';
            break;
          case 401:
            errorMessage = 'Authentication required. Please log in again.';
            break;
          case 403:
            errorMessage = 'Access denied. You do not have permission to submit documents.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = err.message || errorMessage;
        }
      }

      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="w-full">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading required documents...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDocuments}
              className="ml-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-left mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Policy Issuance Documents
        </h2>
        <p className="text-sm text-gray-600">
          Please upload the required documents to complete your policy application
        </p>
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`flex items-center justify-between p-2 rounded-lg transition-colors ${doc.uploadedFile
                ? 'bg-green-50 hover:bg-green-100 border border-green-200'
                : 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
              }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{doc.label}</span>
                  {doc.is_required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                  {doc.uploadedFile && (
                    <Badge variant="default" className="text-xs bg-green-600">
                      <Check className="w-3 h-3 mr-1" />
                      Uploaded
                    </Badge>
                  )}
                </div>
                {doc.description && (
                  <p className="text-xs text-gray-600 mt-1">{doc.description}</p>
                )}
                {doc.uploadedFile && (
                  <p className="text-xs text-green-600 mt-1">
                    {doc.uploadedFile.name} ({doc.uploadedFile.size}) - Uploaded on {doc.uploadedFile.uploadDate}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {doc.uploadedFile ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(doc.uploadedFile?.url, '_blank')}
                    className="h-8 px-3 text-xs text-green-600 hover:text-green-700"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeUploadedFile(doc.id)}
                    className="h-8 px-3 text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    type="file"
                    id={`file-${doc.id}`}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, doc.id)}
                    disabled={uploading.has(doc.id)}
                    className="hidden"
                  />
                  <Label
                    htmlFor={`file-${doc.id}`}
                    className={`cursor-pointer inline-flex items-center gap-1 px-3 py-1 text-xs border rounded transition-colors ${uploading.has(doc.id)
                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed text-gray-500'
                        : 'border-blue-300 hover:border-blue-400 hover:bg-blue-100 text-blue-600'
                      }`}
                  >
                    {uploading.has(doc.id) ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3" />
                        Upload
                      </>
                    )}
                  </Label>

                  {doc.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadTemplate(doc.url, doc.label)}
                      className="h-8 px-3 text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Template
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {documents.filter(doc => doc.is_required).length} required documents
          </div>
          <Button
            onClick={handleSubmitDocuments}
            disabled={submitting || documents.filter(doc => doc.is_required).length === 0}
            className="px-8 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Creating Policy...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Submit & Create Policy
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeclarationTab;
