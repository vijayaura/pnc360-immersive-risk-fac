import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from '@/shared/utils/date-format';
import {
  FileText,
  Download,
  CheckCircle,
  Calendar,
  Building,
  DollarSign,
  Shield,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  CreditCard,
  Star,
  Users,
  FileCheck,
  ArrowLeft,
  FolderOpen,
} from 'lucide-react';
import {
  getProposalBundle,
  ProposalBundleResponse,
  getPolicyDetailsById,
  PolicyDetailsAPIResponse,
} from '@/features/quotes/api/quotes';
import { getPolicyWordings, PolicyWording } from '@/features/insurers/api/insurers';
import { getInsurerPricingConfig, InsurerPricingConfigResponse } from '@/features/quotes/api/quotes';
import { toast } from '@/components/ui/sonner';
import jsPDF from 'jspdf';

// Helper functions for formatting
const formatFieldName = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace(/Id\b/g, 'ID')
    .replace(/Tpl\b/g, 'TPL')
    .replace(/Cew\b/g, 'CEW');
};

const formatFieldValue = (key: string, value: any): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  if (key.includes('date') || key.includes('_at') || key.includes('time')) {
    try {
      return formatDateDDMMYYYY(new Date(value));
    } catch {
      return value.toString();
    }
  }

  if (
    key.includes('amount') ||
    key.includes('premium') ||
    key.includes('sum_insured') ||
    key.includes('value')
  ) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return `AED ${num.toLocaleString()}`;
    }
  }

  return value.toString();
};

const getFormValue = (data: PolicyDetailsAPIResponse | null, fieldName: string): string => {
  if (!data?.formResponseData?.values) return '-';
  const field = data.formResponseData.values.find((v) => v.fieldName === fieldName);
  return field?.valueText || '-';
};

// PDF Generation Function for Policy/Proposal
const generateProposalPDF = (policy: PolicyDetailsAPIResponse) => {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const labelWidth = 80;
  const valueWidth = pageWidth - labelWidth - 30;

  // Helper function to add table row
  const addTableRow = (label: string, value: string, isHeader: boolean = false) => {
    if (yPosition > pageHeight - 15) {
      doc.addPage();
      yPosition = 20;
    }

    const fontSize = isHeader ? 10 : 8;
    const isBold = isHeader;
    const rowHeight = isHeader ? 7 : 6;

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');

    // Draw border with reduced padding - no borders for section headers
    if (!isHeader) {
      doc.setDrawColor(200, 200, 200);
      doc.rect(10, yPosition - 2, labelWidth, rowHeight + 1);
      doc.rect(10 + labelWidth, yPosition - 2, valueWidth, rowHeight + 1);
    }

    // Add text with proper vertical centering and reduced padding
    const textY = yPosition + rowHeight / 2 - 1;
    doc.text(label, 11, textY);
    doc.text(value, 11 + labelWidth, textY);

    // Reduce spacing for continuous table appearance
    yPosition += isHeader ? rowHeight : rowHeight + 1;
  };

  // Helper function to add section header
  const addSectionHeader = (title: string) => {
    addTableRow(title, '', true);
  };

  // Header background with dark blue color
  doc.setFillColor(0, 64, 128);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Header with Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('INSURANCE POLICY', 10, 15);
  doc.text('DOCUMENT', 10, 22);

  // Policy Details on the right side
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const createdDate = policy.createdAt
    ? formatDateDDMMYYYY(policy.createdAt)
    : 'N/A';

  doc.text(`Date: ${createdDate}`, pageWidth - 80, 22);

  // Quote Reference
  doc.setFontSize(8);
  doc.text(`Quote Reference: ${policy.quoteReference || 'N/A'}`, 10, 30);

  // Reset text color to black for table content
  doc.setTextColor(0, 0, 0);
  yPosition = 40;

  // Render form values in PDF
  addSectionHeader('FORM RESPONSE DATA');
  policy.formResponseData?.values?.forEach((field) => {
    addTableRow(formatFieldName(field.fieldName || ''), field.valueText || '-');
  });

  // Save the PDF
  const fileName = `Policy_${policy.quoteReference || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [proposalBundle, setProposalBundle] = useState<ProposalBundleResponse | null>(null);
  const [policyWordings, setPolicyWordings] = useState<PolicyWording[]>([]);
  const [policyDetails, setPolicyDetails] = useState<PolicyDetailsAPIResponse | null>(null);
  const [productBundle, setProductBundle] = useState<InsurerPricingConfigResponse | null>(null);
  const [selectedExtensions, setSelectedExtensions] = useState<any[]>([]);
  const [expandedWordings, setExpandedWordings] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [policyData, setPolicyData] = useState<{
    policyId: string | null;
    policyQuoteId: string | null;
    policyDetails: any | null;
  }>({
    policyId: null,
    policyQuoteId: null,
    policyDetails: null,
  });

  useEffect(() => {
    const loadPolicyData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get policy data from localStorage
        const policyId = localStorage.getItem('policyId');
        const policyQuoteId = localStorage.getItem('policyQuoteId');
        const policyDetailsStr = localStorage.getItem('policyDetails');
        const policyDetailsLocal = policyDetailsStr ? JSON.parse(policyDetailsStr) : null;

        // Set policy data
        setPolicyData({
          policyId,
          policyQuoteId,
          policyDetails: policyDetailsLocal,
        });

        // If we have a policy ID, fetch policy details
        if (policyId) {
          const policyDetailsData = await getPolicyDetailsById(policyId);
          setPolicyDetails(policyDetailsData);
        }

        if (!policyQuoteId) {
          throw new Error('Quote ID not found. Please start the process again.');
        }

        // Get proposal bundle with all data using policyQuoteId
        const bundleData = await getProposalBundle(policyQuoteId);
        setProposalBundle(bundleData);

        // Get policy wordings
        const wordingsData = await getPolicyWordings(bundleData.quote_meta.insurer_id, 1);
        setPolicyWordings(wordingsData.wordings);

        // Get product bundle configuration
        const insurerId = bundleData.quote_meta.insurer_id;
        const productBundleData = await getInsurerPricingConfig(insurerId);
        setProductBundle(productBundleData);
      } catch (err: any) {
        console.error('Error loading policy data:', err);
        setError(err.message || 'Failed to load policy details. Please try again.');
        toast.error('Error Loading Policy Details', {
          description: err.message || 'Failed to load policy details. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadPolicyData();
  }, []);

  // Process selected extensions when both proposalBundle and productBundle are loaded
  useEffect(() => {
    if (proposalBundle && productBundle) {
      const clausePricingConfig = productBundle.clause_pricing_config || [];
      const policyExtensions = proposalBundle.plans[0]?.extensions?.selected_extensions || {};
      const toKey = (v?: string) => (v ?? '').toString().trim().toLowerCase();

      const processedExtensions = Object.entries(policyExtensions).map(
        ([extensionKey, extensionData]) => {
          const extensionCode = (extensionData as any)?.code;
          const matchingClause = clausePricingConfig.find((clause: any) => {
            const clauseCode = clause.clause_code;
            return clauseCode && extensionCode && toKey(clauseCode) === toKey(extensionCode);
          });

          if (matchingClause) {
            const meta = (matchingClause as any).meta || {};
            return {
              policy_key: extensionKey,
              clause_code: matchingClause.clause_code,
              title:
                meta.title || meta.clause_title || (extensionData as any)?.label || extensionKey,
              clause_wording: meta.clause_wording || '',
              clause_type: meta.clause_type || 'Extension',
              show_type: (meta.show_type || 'default').toString().toLowerCase(),
              extension_data: extensionData,
              clause_config: matchingClause,
            };
          }

          return {
            policy_key: extensionKey,
            clause_code: extensionCode || extensionKey,
            title: (extensionData as any)?.label || extensionKey,
            clause_wording: '',
            clause_type: 'Extension',
            show_type: 'default',
            extension_data: extensionData,
            clause_config: null,
          };
        },
      );

      setSelectedExtensions(processedExtensions);
    }
  }, [proposalBundle, productBundle]);

  const toggleWordingExpansion = (extensionKey: string) => {
    setExpandedWordings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(extensionKey)) {
        newSet.delete(extensionKey);
      } else {
        newSet.add(extensionKey);
      }
      return newSet;
    });
  };

  const toggleSectionExpansion = (sectionKey: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  const handleDownloadDocument = async (url: string, filename: string) => {
    try {
      toast.success('Download Started', {
        description: `Downloading ${filename}...`,
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/pdf,application/octet-stream,*/*' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download Failed', {
        description:
          error instanceof Error ? error.message : 'Failed to download document. Please try again.',
      });
    }
  };

  const handlePrintPolicy = () => {
    if (!policyDetails) {
      toast.error('Error', {
        description: 'Policy data not available for printing.',
      });
      return;
    }

    try {
      generateProposalPDF(policyDetails);
      toast.success('PDF Generated', {
        description: 'Policy PDF has been generated and downloaded.',
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('PDF Generation Failed', {
        description: 'Failed to generate PDF. Please try again.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">Loading...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Header />
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Success Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Policy Created Successfully!</h1>
              <p className="text-lg text-gray-600 mt-1">Your insurance policy has been created.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handlePrintPolicy}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Print Policy
            </Button>
            <Button
              onClick={() => navigate('/broker/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </Button>
          </div>
        </div>

        {/* Policy Summary */}
        {policyDetails && (
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Policy Summary
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      Policy overview and key details
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Total Premium</div>
                  <div className="text-sm text-gray-600 font-medium">
                    {formatFieldValue('base_premium', policyDetails.selectedPremium.basePremium)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid lg:grid-cols-4">
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Policy ID</div>
                    <div className="text-sm font-medium">{policyDetails.policyNumber}</div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Policy Start Date</div>
                    <div className="text-sm font-medium">
                      {formatFieldValue('start_date', policyDetails.policyStartDate)}
                    </div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Policy End Date</div>
                    <div className="text-sm font-medium">
                      {formatFieldValue('end_date', policyDetails.policyEndDate)}
                    </div>
                  </div>
                  <div className="p-3 border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Status</div>
                    <div className="text-sm font-medium">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {formatFieldValue('status', policyDetails.formResponseData.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Details */}
        {proposalBundle && (
          <Card className="bg-white shadow-lg border-0">
            <CardHeader
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('project_details')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <Building className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Project Details
                    </CardTitle>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Project Name</div>
                    <div className="text-sm font-medium">
                      {formatFieldValue('project_name', proposalBundle.project.project_name)}
                    </div>
                  </div>
                  {expandedSections.has('project_details') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('project_details') && (
              <CardContent className="pt-0">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid lg:grid-cols-3">
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Project Name</div>
                      <div className="text-sm font-medium">
                        {formatFieldValue('project_name', proposalBundle.project.project_name)}
                      </div>
                    </div>
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Project Type</div>
                      <div className="text-sm font-medium">
                        {formatFieldValue('project_type', proposalBundle.project.project_type)}
                      </div>
                    </div>
                    <div className="p-3 border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Completion Date</div>
                      <div className="text-sm font-medium">
                        {formatFieldValue(
                          'completion_date',
                          proposalBundle.project.completion_date,
                        )}
                      </div>
                    </div>
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Sub Project Type</div>
                      <div className="text-sm font-medium">
                        {formatFieldValue(
                          'sub_project_type',
                          proposalBundle.project.sub_project_type,
                        )}
                      </div>
                    </div>
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Construction Type</div>
                      <div className="text-sm font-medium">
                        {formatFieldValue(
                          'construction_type',
                          proposalBundle.project.construction_type,
                        )}
                      </div>
                    </div>
                    <div className="p-3 border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Maintenance Period Months</div>
                      <div className="text-sm font-medium">
                        {formatFieldValue(
                          'maintenance_period_months',
                          proposalBundle.project.maintenance_period_months,
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Insured Details */}
        {proposalBundle && (
          <Card className="bg-white shadow-lg border-0">
            <CardHeader
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('insured_details')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Insured Details
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatFieldValue(
                        'insured_name',
                        proposalBundle.insured.details.insured_name,
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Insured Name</div>
                    <div className="text-sm font-medium">
                      {formatFieldValue(
                        'role_of_insured',
                        proposalBundle.insured.details.role_of_insured,
                      )}
                    </div>
                  </div>
                  {expandedSections.has('insured_details') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('insured_details') && (
              <CardContent className="pt-0">
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="grid lg:grid-cols-3">
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Insured Name</div>
                        <div className="text-sm font-medium">
                          {formatFieldValue(
                            'insured_name',
                            proposalBundle.insured.details.insured_name,
                          )}
                        </div>
                      </div>
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Role of Insured</div>
                        <div className="text-sm font-medium">
                          {formatFieldValue(
                            'role_of_insured',
                            proposalBundle.insured.details.role_of_insured,
                          )}
                        </div>
                      </div>
                      <div className="p-3 border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Had Losses Last 5 Years</div>
                        <div className="text-sm font-medium">
                          {formatFieldValue(
                            'had_losses_last_5yrs',
                            proposalBundle.insured.details.had_losses_last_5yrs,
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Claims History */}
                  {proposalBundle.insured.claims && proposalBundle.insured.claims.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Claims History</h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-4 gap-0">
                          <div className="p-3 bg-gray-50 border-r border-b border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Claim Year</div>
                          </div>
                          <div className="p-3 bg-gray-50 border-r border-b border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Description</div>
                          </div>
                          <div className="p-3 bg-gray-50 border-r border-b border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Count of Claims</div>
                          </div>
                          <div className="p-3 bg-gray-50 border-b border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Amount of Claims</div>
                          </div>
                          {proposalBundle.insured.claims.map((claim, index) => (
                            <>
                              <div
                                key={`year-${index}`}
                                className="p-3 border-r border-b border-gray-200"
                              >
                                <div className="text-sm font-medium">{claim.claim_year}</div>
                              </div>
                              <div
                                key={`desc-${index}`}
                                className="p-3 border-r border-b border-gray-200"
                              >
                                <div className="text-sm font-medium">{claim.description}</div>
                              </div>
                              <div
                                key={`count-${index}`}
                                className="p-3 border-r border-b border-gray-200"
                              >
                                <div className="text-sm font-medium">{claim.count_of_claims}</div>
                              </div>
                              <div key={`amount-${index}`} className="p-3 border-b border-gray-200">
                                <div className="text-sm font-medium">
                                  AED {parseFloat(claim.amount_of_claims).toLocaleString()}
                                </div>
                              </div>
                            </>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Site Risk Assessment */}
        {proposalBundle && (
          <Card className="bg-white shadow-lg border-0">
            <CardHeader
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('site_risks')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Site Risk Assessment
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      Risk factors and site conditions
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Soil Type</div>
                    <div className="text-sm font-medium">
                      {formatFieldValue('soil_type', proposalBundle.site_risks.soil_type)}
                    </div>
                  </div>
                  {expandedSections.has('site_risks') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('site_risks') && (
              <CardContent className="pt-0">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid lg:grid-cols-3">
                    {Object.entries(proposalBundle.site_risks)
                      .filter(
                        ([key]) => !['id', 'project_id', 'created_at', 'updated_at'].includes(key),
                      )
                      .map(([key, value], idx) => (
                        <div
                          key={key}
                          className="p-3 border-r border-b border-gray-200 last:border-r-0"
                        >
                          <div className="text-xs text-gray-500 mb-1">{formatFieldName(key)}</div>
                          <div className="text-sm font-medium">{formatFieldValue(key, value)}</div>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Cover Requirements */}
        {proposalBundle && (
          <Card className="bg-white shadow-lg border-0">
            <CardHeader
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('cover_requirements')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Cover Requirements
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">Insurance coverage details</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Sum Insured</div>
                    <div className="text-sm font-medium">
                      {formatFieldValue(
                        'sum_insured',
                        proposalBundle.cover_requirements.sum_insured,
                      )}
                    </div>
                  </div>
                  {expandedSections.has('cover_requirements') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('cover_requirements') && (
              <CardContent className="pt-0">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid lg:grid-cols-3">
                    {Object.entries(proposalBundle.cover_requirements)
                      .filter(
                        ([key]) =>
                          ![
                            'id',
                            'project_id',
                            'created_at',
                            'updated_at',
                            'cross_liability_cover',
                          ].includes(key),
                      )
                      .map(([key, value], idx) => {
                        let displayValue = value;
                        if (
                          key.includes('works') ||
                          key.includes('equipment') ||
                          key.includes('materials') ||
                          key.includes('property') ||
                          key.includes('sum_insured') ||
                          key.includes('computed_sum_insured')
                        ) {
                          const num = parseFloat(String(value));
                          if (!isNaN(num) && num >= 0) {
                            displayValue = `AED ${num.toLocaleString()}`;
                          }
                        }

                        return (
                          <div
                            key={key}
                            className="p-3 border-r border-b border-gray-200 last:border-r-0"
                          >
                            <div className="text-xs text-gray-500 mb-1">{formatFieldName(key)}</div>
                            <div className="text-sm font-medium">
                              {typeof displayValue === 'string' && displayValue.startsWith('AED')
                                ? displayValue
                                : formatFieldValue(key, displayValue)}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Selected Plan Details */}
        {proposalBundle && (
          <Card className="bg-white shadow-lg border-0">
            <CardHeader
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('selected_plan_details')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Selected Plan Details
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">Insurance plan configuration</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Premium Amount</div>
                    <div className="text-sm text-gray-600 font-medium">
                      AED{' '}
                      {parseFloat(
                        proposalBundle.plans[0]?.premium_amount?.toString() || '0',
                      ).toLocaleString()}
                    </div>
                  </div>
                  {expandedSections.has('selected_plan_details') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('selected_plan_details') && (
              <CardContent className="pt-0">
                {proposalBundle.plans.map((plan, index) => (
                  <div
                    key={plan.id || index}
                    className="border border-gray-200 rounded-lg overflow-hidden mb-4 last:mb-0"
                  >
                    <div className="grid lg:grid-cols-3">
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Premium Amount</div>
                        <div className="text-sm font-medium">
                          {formatFieldValue('premium_amount', plan.premium_amount)}
                        </div>
                      </div>
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Minimum Premium</div>
                        <div className="text-sm font-medium">
                          {formatFieldValue('minimum_premium_value', plan.minimum_premium_value)}
                        </div>
                      </div>
                      <div className="p-3 border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Minimum Applied</div>
                        <div className="text-sm font-medium">
                          {plan.is_minimum_premium_applied ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </div>

                    {/* Extensions */}
                    {plan.extensions && (
                      <div className="p-4 bg-gray-50">
                        <h4 className="font-medium text-gray-900 mb-3">Extensions</h4>
                        <div className="space-y-4">
                          {plan.extensions.tpl_limit && (
                            <div className="border border-gray-200 rounded-lg p-3">
                              <div className="text-sm font-medium text-gray-900 mb-2">
                                TPL Limit Extension
                              </div>
                              <div className="grid lg:grid-cols-3 gap-4">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Label</div>
                                  <div className="text-sm font-medium">
                                    {plan.extensions.tpl_limit.label}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Impact %</div>
                                  <div className="text-sm font-medium">
                                    {plan.extensions.tpl_limit.impact_pct}%
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Description</div>
                                  <div className="text-sm font-medium">
                                    {plan.extensions.tpl_limit.description}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {plan.extensions.selected_plan && (
                            <div className="border border-gray-200 rounded-lg p-3">
                              <div className="text-sm font-medium text-gray-900 mb-2">
                                Selected Plan Details
                              </div>
                              <div className="grid lg:grid-cols-3 gap-4">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Deductible</div>
                                  <div className="text-sm font-medium">
                                    AED {plan.extensions.selected_plan.deductible?.toLocaleString()}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Base Premium</div>
                                  <div className="text-sm font-medium">
                                    AED{' '}
                                    {plan.extensions.selected_plan.base_premium?.toLocaleString()}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Coverage Amount</div>
                                  <div className="text-sm font-medium">
                                    AED{' '}
                                    {plan.extensions.selected_plan.coverage_amount?.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        )}

        {/* Required Documents (Underwriting Documents) */}
        {proposalBundle &&
          proposalBundle.required_documents &&
          Object.keys(proposalBundle.required_documents).length > 0 && (
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <FolderOpen className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Underwriting Documents
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      {Object.keys(proposalBundle.required_documents).length} document(s)
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {Object.entries(proposalBundle.required_documents).map(([key, doc]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium">{doc.label}</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc.url, doc.label)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        {/* Declaration Documents */}
        {proposalBundle && proposalBundle.required_documents_for_policy_issue && (
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <FileCheck className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Policy Issuance Documents
                  </CardTitle>
                  <div className="text-xs text-gray-400 mt-1">
                    {Array.isArray(proposalBundle.required_documents_for_policy_issue)
                      ? `${proposalBundle.required_documents_for_policy_issue.length} document(s)`
                      : typeof proposalBundle.required_documents_for_policy_issue === 'object'
                        ? `${Object.keys(proposalBundle.required_documents_for_policy_issue).length} document(s)`
                        : 'Document(s) available'}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {Array.isArray(proposalBundle.required_documents_for_policy_issue) ? (
                  proposalBundle.required_documents_for_policy_issue.map(
                    (doc: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="text-sm font-medium">
                              {doc.label || doc.name || `Document ${index + 1}`}
                            </div>
                            {doc.uploaded_at && (
                              <div className="text-xs text-gray-500">
                                Uploaded:{' '}
                                {formatDateTimeDDMMYYYY(doc.uploaded_at)}
                              </div>
                            )}
                          </div>
                        </div>
                        {doc.url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDocument(doc.url, doc.label || doc.name)}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        )}
                      </div>
                    ),
                  )
                ) : typeof proposalBundle.required_documents_for_policy_issue === 'object' ? (
                  Object.entries(proposalBundle.required_documents_for_policy_issue).map(
                    ([key, doc]: [string, any]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="text-sm font-medium">{doc.label || key}</div>
                            {doc.uploaded_at && (
                              <div className="text-xs text-gray-500">
                                Uploaded:{' '}
                                {formatDateTimeDDMMYYYY(doc.uploaded_at)}
                              </div>
                            )}
                          </div>
                        </div>
                        {doc.url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDocument(doc.url, doc.label || key)}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400 px-2 py-1">Not uploaded</span>
                        )}
                      </div>
                    ),
                  )
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">
                      {typeof proposalBundle.required_documents_for_policy_issue === 'string'
                        ? proposalBundle.required_documents_for_policy_issue
                        : JSON.stringify(proposalBundle.required_documents_for_policy_issue)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Policy Documents */}
        {policyWordings && policyWordings.length > 0 && (
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Policy Documents
                  </CardTitle>
                  <div className="text-xs text-gray-400 mt-1">
                    Download policy documents and wordings
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {policyWordings.map((wording, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">{wording.label}</div>
                        <div className="text-xs text-gray-500">
                          {wording.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDocument(wording.url, wording.label)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Success;
