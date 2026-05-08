import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useNavigationHistory } from '@/shared/hooks/use-navigation-history';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Footer } from "@/components/layout/Footer";
import { ArrowLeft, Save, Image, Upload, Eye } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { getActiveCountries, getRegionsByCountry, getZonesByRegion } from "@/lib/location-data";

const QuoteFormat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { insurerId } = useParams();
  const { navigateBack } = useNavigationHistory();
  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  
  // Detect if we're in insurer portal or market admin
  const isInsurerPortal = location.pathname.startsWith('/insurer');
  const backPath = isInsurerPortal ? '/insurer/product-config' : `/market-admin/insurer/${insurerId}/product-config`;

  const activeCountries = getActiveCountries();
  const [availableRegions, setAvailableRegions] = useState(() => getRegionsByCountry(1));
  const [availableZones, setAvailableZones] = useState(() => getZonesByRegion(1));
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  const [quoteConfig, setQuoteConfig] = useState({
    header: {
      companyName: "Emirates Insurance Company",
      companyAddress: "P.O. Box 3766, Dubai, UAE",
      contactInfo: "Phone: +971 4 373 8726\nEmail: info@emirates.com\nWebsite: www.emirates.com",
      headerColor: "#1f2937",
      headerTextColor: "#ffffff",
      logoPosition: "left"
    },
    details: {
      quotePrefix: "EIC-CAR-",
      dateFormat: "DD/MM/YYYY",
      validityDays: "30",
      geographicalScope: "United Arab Emirates",
      countries: [1],
      regions: [1],
      zones: [1],
      backdateWindow: "30",
      showQuoteNumber: true,
      showIssueDate: true,
      showValidity: true,
      showGeographicalScope: true
    },
    risk: {
      showProjectDetails: true,
      showCoverageTypes: true,
      showCoverageLimits: true,
      showDeductibles: true,
      showContractorInfo: true,
      riskSectionTitle: "Risk Details"
    },
    premium: {
      currency: "AED",
      premiumSectionTitle: "Premium Breakdown",
      showBasePremium: true,
      showRiskAdjustments: true,
      showFees: true,
      showTaxes: true,
      showTotalPremium: true
    },
    terms: {
      showWarranties: true,
      showExclusions: true,
      showDeductibleDetails: true,
      showPolicyConditions: true,
      termsSectionTitle: "Terms & Conditions",
      additionalTerms: "This insurance is subject to the terms, conditions, and exclusions of the policy wording. All claims must be reported within 7 days of occurrence."
    },
    signature: {
      showSignatureBlock: true,
      authorizedSignatory: "Ahmed Al Mansouri",
      signatoryTitle: "Senior Underwriting Manager",
      signatureText: "This quotation is issued on behalf of Emirates Insurance Company by the undersigned authorized representative."
    },
    footer: {
      showFooter: true,
      showDisclaimer: true,
      showRegulatoryInfo: true,
      generalDisclaimer: "This quotation is valid for 30 days from the date of issue. Terms and conditions apply. Premium rates are subject to underwriting approval.",
      regulatoryText: "Emirates Insurance Company is regulated by the Insurance Authority of UAE. Registration No: 123456789. Licensed to conduct general insurance business in the UAE.",
      footerBgColor: "#f8f9fa",
      footerTextColor: "#6b7280"
    }
  });

  const getInsurerName = (id: string | undefined) => {
    const insurerNames: { [key: string]: string } = {
      'emirates-insurance': 'Emirates Insurance',
      'axa-gulf': 'AXA Gulf',
      'oman-insurance': 'Oman Insurance',
      'dubai-insurance': 'Dubai Insurance'
    };
    return insurerNames[id || ''] || 'Unknown Insurer';
  };

  const updateQuoteConfig = (section: string, field: string, value: any) => {
    setQuoteConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const showPreview = () => {
    setIsPreviewDialogOpen(true);
  };

  const saveConfiguration = () => {
    showConfirmDialog(
      {
        title: "Save Quote Format Configuration",
        description: "Are you sure you want to save the quote format configuration? This will update the template settings.",
        confirmText: "Save Configuration"
      },
      () => {
        toast({
          title: "Configuration Saved",
          description: `Quote format configuration has been successfully saved for ${getInsurerName(insurerId)}.`,
        });
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(backPath)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Product Config
              </Button>
              <div className="h-8 w-px bg-border" />
              <h1 className="text-xl font-semibold">
                Quote Format
              </h1>
            </div>
            <Button onClick={saveConfiguration} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Configuration
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          
          {/* Header Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Header Configuration
              </CardTitle>
              <CardDescription>Configure quote header with logo and company information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input 
                    id="company-name" 
                    value={quoteConfig.header.companyName}
                    onChange={(e) => updateQuoteConfig('header', 'companyName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo-upload">Company Logo</Label>
                  <div className="flex gap-2">
                    <Input id="logo-upload" type="file" accept="image/*" />
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-address">Company Address</Label>
                  <Textarea 
                    id="company-address" 
                    value={quoteConfig.header.companyAddress}
                    onChange={(e) => updateQuoteConfig('header', 'companyAddress', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-info">Contact Information</Label>
                  <Textarea 
                    id="contact-info" 
                    value={quoteConfig.header.contactInfo}
                    onChange={(e) => updateQuoteConfig('header', 'contactInfo', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="header-color">Header Background Color</Label>
                  <Input 
                    id="header-color" 
                    type="color" 
                    value={quoteConfig.header.headerColor}
                    onChange={(e) => updateQuoteConfig('header', 'headerColor', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="header-text-color">Header Text Color</Label>
                  <Input 
                    id="header-text-color" 
                    type="color" 
                    value={quoteConfig.header.headerTextColor}
                    onChange={(e) => updateQuoteConfig('header', 'headerTextColor', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo-position">Logo Position</Label>
                  <Select 
                    value={quoteConfig.header.logoPosition}
                    onValueChange={(value) => updateQuoteConfig('header', 'logoPosition', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Details Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Details Configuration</CardTitle>
              <CardDescription>Configure how risk information is displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="show-project-details" 
                    checked={quoteConfig.risk.showProjectDetails}
                    onChange={(e) => updateQuoteConfig('risk', 'showProjectDetails', e.target.checked)}
                  />
                  <Label htmlFor="show-project-details">Show Project Details (Name, Location, Duration)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="show-coverage-types" 
                    checked={quoteConfig.risk.showCoverageTypes}
                    onChange={(e) => updateQuoteConfig('risk', 'showCoverageTypes', e.target.checked)}
                  />
                  <Label htmlFor="show-coverage-types">Show Coverage Types</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="show-coverage-limits" 
                    checked={quoteConfig.risk.showCoverageLimits}
                    onChange={(e) => updateQuoteConfig('risk', 'showCoverageLimits', e.target.checked)}
                  />
                  <Label htmlFor="show-coverage-limits">Show Coverage Limits</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="show-deductibles" 
                    checked={quoteConfig.risk.showDeductibles}
                    onChange={(e) => updateQuoteConfig('risk', 'showDeductibles', e.target.checked)}
                  />
                  <Label htmlFor="show-deductibles">Show Deductibles</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="show-contractor-info" 
                    checked={quoteConfig.risk.showContractorInfo}
                    onChange={(e) => updateQuoteConfig('risk', 'showContractorInfo', e.target.checked)}
                  />
                  <Label htmlFor="show-contractor-info">Show Contractor Information</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="risk-section-title">Risk Section Title</Label>
                <Input 
                  id="risk-section-title" 
                  value={quoteConfig.risk.riskSectionTitle}
                  onChange={(e) => updateQuoteConfig('risk', 'riskSectionTitle', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Premium Breakdown Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Premium Breakdown Configuration</CardTitle>
              <CardDescription>Configure how premium calculations are displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={quoteConfig.premium.currency}
                    onValueChange={(value) => updateQuoteConfig('premium', 'currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="premium-section-title">Premium Section Title</Label>
                  <Input 
                    id="premium-section-title" 
                    value={quoteConfig.premium.premiumSectionTitle}
                    onChange={(e) => updateQuoteConfig('premium', 'premiumSectionTitle', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="show-base-premium" 
                    checked={quoteConfig.premium.showBasePremium}
                    onChange={(e) => updateQuoteConfig('premium', 'showBasePremium', e.target.checked)}
                  />
                  <Label htmlFor="show-base-premium">Show Base Premium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="show-risk-adjustments" 
                    checked={quoteConfig.premium.showRiskAdjustments}
                    onChange={(e) => updateQuoteConfig('premium', 'showRiskAdjustments', e.target.checked)}
                  />
                  <Label htmlFor="show-risk-adjustments">Show Risk Adjustments</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="show-fees" 
                    checked={quoteConfig.premium.showFees}
                    onChange={(e) => updateQuoteConfig('premium', 'showFees', e.target.checked)}
                  />
                  <Label htmlFor="show-fees">Show Fees & Charges</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="show-taxes" 
                    checked={quoteConfig.premium.showTaxes}
                    onChange={(e) => updateQuoteConfig('premium', 'showTaxes', e.target.checked)}
                  />
                  <Label htmlFor="show-taxes">Show Taxes (VAT)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="show-total-premium" 
                    checked={quoteConfig.premium.showTotalPremium}
                    onChange={(e) => updateQuoteConfig('premium', 'showTotalPremium', e.target.checked)}
                  />
                  <Label htmlFor="show-total-premium">Show Total Premium</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions Configuration</CardTitle>
              <CardDescription>Configure warranties, exclusions, and deductibles display</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="show-warranties" 
                    checked={quoteConfig.terms.showWarranties}
                    onChange={(e) => updateQuoteConfig('terms', 'showWarranties', e.target.checked)}
                  />
                  <Label htmlFor="show-warranties">Show Warranties</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="show-exclusions" 
                    checked={quoteConfig.terms.showExclusions}
                    onChange={(e) => updateQuoteConfig('terms', 'showExclusions', e.target.checked)}
                  />
                  <Label htmlFor="show-exclusions">Show Exclusions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="show-deductible-details" 
                    checked={quoteConfig.terms.showDeductibleDetails}
                    onChange={(e) => updateQuoteConfig('terms', 'showDeductibleDetails', e.target.checked)}
                  />
                  <Label htmlFor="show-deductible-details">Show Deductible Details</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="show-policy-conditions" 
                    checked={quoteConfig.terms.showPolicyConditions}
                    onChange={(e) => updateQuoteConfig('terms', 'showPolicyConditions', e.target.checked)}
                  />
                  <Label htmlFor="show-policy-conditions">Show Policy Conditions</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms-section-title">Terms Section Title</Label>
                <Input 
                  id="terms-section-title" 
                  value={quoteConfig.terms.termsSectionTitle}
                  onChange={(e) => updateQuoteConfig('terms', 'termsSectionTitle', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="additional-terms">Additional Terms Text</Label>
                <Textarea 
                  id="additional-terms" 
                  value={quoteConfig.terms.additionalTerms}
                  onChange={(e) => updateQuoteConfig('terms', 'additionalTerms', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Signature Block Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Signature Block Configuration</CardTitle>
              <CardDescription>Configure signature areas and authorization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="show-signature-block" 
                  checked={quoteConfig.signature.showSignatureBlock}
                  onChange={(e) => updateQuoteConfig('signature', 'showSignatureBlock', e.target.checked)}
                />
                <Label htmlFor="show-signature-block">Show Signature Block</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="authorized-signatory">Authorized Signatory Name</Label>
                  <Input 
                    id="authorized-signatory" 
                    value={quoteConfig.signature.authorizedSignatory}
                    onChange={(e) => updateQuoteConfig('signature', 'authorizedSignatory', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signatory-title">Signatory Title</Label>
                  <Input 
                    id="signatory-title" 
                    value={quoteConfig.signature.signatoryTitle}
                    onChange={(e) => updateQuoteConfig('signature', 'signatoryTitle', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signature-text">Signature Block Text</Label>
                <Textarea 
                  id="signature-text" 
                  value={quoteConfig.signature.signatureText}
                  onChange={(e) => updateQuoteConfig('signature', 'signatureText', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Footer & Disclaimers Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Footer & Disclaimers Configuration</CardTitle>
              <CardDescription>Configure footer information and legal disclaimers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="show-footer" 
                    checked={quoteConfig.footer.showFooter}
                    onChange={(e) => updateQuoteConfig('footer', 'showFooter', e.target.checked)}
                  />
                  <Label htmlFor="show-footer">Show Footer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="show-disclaimer" 
                    checked={quoteConfig.footer.showDisclaimer}
                    onChange={(e) => updateQuoteConfig('footer', 'showDisclaimer', e.target.checked)}
                  />
                  <Label htmlFor="show-disclaimer">Show General Disclaimer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="show-regulatory-info" 
                    checked={quoteConfig.footer.showRegulatoryInfo}
                    onChange={(e) => updateQuoteConfig('footer', 'showRegulatoryInfo', e.target.checked)}
                  />
                  <Label htmlFor="show-regulatory-info">Show Regulatory Information</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="general-disclaimer">General Disclaimer Text</Label>
                <Textarea 
                  id="general-disclaimer" 
                  value={quoteConfig.footer.generalDisclaimer}
                  onChange={(e) => updateQuoteConfig('footer', 'generalDisclaimer', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regulatory-text">Regulatory Information</Label>
                <Textarea 
                  id="regulatory-text" 
                  value={quoteConfig.footer.regulatoryText}
                  onChange={(e) => updateQuoteConfig('footer', 'regulatoryText', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="footer-bg-color">Footer Background Color</Label>
                  <Input 
                    id="footer-bg-color" 
                    type="color" 
                    value={quoteConfig.footer.footerBgColor}
                    onChange={(e) => updateQuoteConfig('footer', 'footerBgColor', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer-text-color">Footer Text Color</Label>
                  <Input 
                    id="footer-text-color" 
                    type="color" 
                    value={quoteConfig.footer.footerTextColor}
                    onChange={(e) => updateQuoteConfig('footer', 'footerTextColor', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview & Save Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Preview and save your quote template configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button variant="outline" onClick={showPreview}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Template
                </Button>
                <Button onClick={saveConfiguration}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Preview Template Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quote Template Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Header Preview */}
            {quoteConfig.header && (
              <div 
                className="p-6 text-white rounded-lg"
                style={{ 
                  backgroundColor: quoteConfig.header.headerColor,
                  color: quoteConfig.header.headerTextColor 
                }}
              >
                <div className={`flex items-center ${
                  quoteConfig.header.logoPosition === 'center' ? 'justify-center' :
                  quoteConfig.header.logoPosition === 'right' ? 'justify-end' : 'justify-start'
                }`}>
                  <div className="text-center">
                    <h1 className="text-2xl font-bold">{quoteConfig.header.companyName}</h1>
                    <p className="text-sm mt-1 whitespace-pre-line">{quoteConfig.header.companyAddress}</p>
                    <p className="text-sm mt-2 whitespace-pre-line">{quoteConfig.header.contactInfo}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quote Details Preview */}
            <div className="bg-muted p-4 rounded">
              <h3 className="font-semibold text-lg mb-3">Quotation Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {quoteConfig.details.showQuoteNumber && (
                  <div><span className="font-medium">Quote Number:</span> {quoteConfig.details.quotePrefix}2024001</div>
                )}
                {quoteConfig.details.showIssueDate && (
                  <div><span className="font-medium">Date of Issue:</span> {new Date().toLocaleDateString('en-GB').split('/').join('-')}</div>
                )}
                {quoteConfig.details.showValidity && (
                  <div><span className="font-medium">Valid Until:</span> {new Date(Date.now() + parseInt(quoteConfig.details.validityDays) * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB').split('/').join('-')}</div>
                )}
                {quoteConfig.details.showGeographicalScope && (
                  <div><span className="font-medium">Geographical Scope:</span> United Arab Emirates</div>
                )}
              </div>
            </div>

            {/* Risk Details Preview */}
            {quoteConfig.risk && (
              <div className="border p-4 rounded">
                <h3 className="font-semibold text-lg mb-3">{quoteConfig.risk.riskSectionTitle}</h3>
                <div className="space-y-2 text-sm">
                  {quoteConfig.risk.showProjectDetails && (
                    <div>
                      <p><span className="font-medium">Project Name:</span> Al Marina Residential Development</p>
                      <p><span className="font-medium">Location:</span> Dubai Marina, Dubai, UAE</p>
                      <p><span className="font-medium">Duration:</span> 24 months</p>
                    </div>
                  )}
                  {quoteConfig.risk.showCoverageTypes && (
                    <p><span className="font-medium">Coverage:</span> Contractors All Risks (CAR)</p>
                  )}
                  {quoteConfig.risk.showCoverageLimits && (
                    <p><span className="font-medium">Sum Insured:</span> AED 50,000,000</p>
                  )}
                  {quoteConfig.risk.showDeductibles && (
                    <p><span className="font-medium">Deductible:</span> AED 25,000 per occurrence</p>
                  )}
                  {quoteConfig.risk.showContractorInfo && (
                    <p><span className="font-medium">Main Contractor:</span> Emirates Construction LLC</p>
                  )}
                </div>
              </div>
            )}

            {/* Premium Preview */}
            {quoteConfig.premium && (
              <div className="border p-4 rounded">
                <h3 className="font-semibold text-lg mb-3">{quoteConfig.premium.premiumSectionTitle}</h3>
                <div className="space-y-2 text-sm">
                  {quoteConfig.premium.showBasePremium && (
                    <div className="flex justify-between">
                      <span>Base Premium:</span>
                      <span>{quoteConfig.premium.currency} 140,000</span>
                    </div>
                  )}
                  {quoteConfig.premium.showRiskAdjustments && (
                    <div className="flex justify-between">
                      <span>Risk Adjustments:</span>
                      <span>{quoteConfig.premium.currency} 0</span>
                    </div>
                  )}
                  {quoteConfig.premium.showFees && (
                    <div className="flex justify-between">
                      <span>Policy Fee:</span>
                      <span>{quoteConfig.premium.currency} 2,500</span>
                    </div>
                  )}
                  {quoteConfig.premium.showTaxes && (
                    <div className="flex justify-between">
                      <span>VAT (5%):</span>
                      <span>{quoteConfig.premium.currency} 7,125</span>
                    </div>
                  )}
                  {quoteConfig.premium.showTotalPremium && (
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Total Premium:</span>
                      <span>{quoteConfig.premium.currency} 149,625</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Terms & Conditions Preview */}
            {quoteConfig.terms && (
              <div className="border p-4 rounded">
                <h3 className="font-semibold text-lg mb-3">{quoteConfig.terms.termsSectionTitle}</h3>
                <div className="text-sm space-y-2">
                  {quoteConfig.terms.showWarranties && (
                    <p><span className="font-medium">Warranties:</span> Standard policy warranties apply</p>
                  )}
                  {quoteConfig.terms.showExclusions && (
                    <p><span className="font-medium">Exclusions:</span> War, terrorism, and nuclear risks excluded</p>
                  )}
                  {quoteConfig.terms.showDeductibleDetails && (
                    <p><span className="font-medium">Deductible Terms:</span> Per occurrence basis</p>
                  )}
                  {quoteConfig.terms.additionalTerms && (
                    <p className="mt-3 text-xs">{quoteConfig.terms.additionalTerms}</p>
                  )}
                </div>
              </div>
            )}

            {/* Signature Block Preview */}
            {quoteConfig.signature && quoteConfig.signature.showSignatureBlock && (
              <div className="border p-4 rounded">
                <h3 className="font-semibold text-lg mb-3">Authorization</h3>
                <p className="text-sm mb-4">{quoteConfig.signature.signatureText}</p>
                <div className="text-sm">
                  <p className="font-medium">{quoteConfig.signature.authorizedSignatory}</p>
                  <p>{quoteConfig.signature.signatoryTitle}</p>
                  <p>{quoteConfig.header.companyName}</p>
                </div>
              </div>
            )}

            {/* Footer Preview */}
            {quoteConfig.footer && quoteConfig.footer.showFooter && (
              <div 
                className="p-4 rounded text-sm"
                style={{
                  backgroundColor: quoteConfig.footer.footerBgColor,
                  color: quoteConfig.footer.footerTextColor
                }}
              >
                {quoteConfig.footer.showDisclaimer && (
                  <p className="mb-2">{quoteConfig.footer.generalDisclaimer}</p>
                )}
                {quoteConfig.footer.showRegulatoryInfo && (
                  <p className="text-xs">{quoteConfig.footer.regulatoryText}</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog />
      <Footer />
    </div>
  );
};

export default QuoteFormat;