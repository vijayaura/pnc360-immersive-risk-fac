import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download, CheckCircle, Calendar, Building, DollarSign, Shield, AlertCircle, ChevronDown, ChevronUp, User, MapPin, CreditCard, Star, FileCheck, ArrowLeft, Briefcase } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { formatNumberWithCommas } from '@/shared/utils/numberFormat';
import { formatDateDDMMYYYY } from '@/shared/utils/date-format';

// Helper functions for formatting
const formatFieldName = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

const formatFieldValue = (key: string, value: any): string => {
  if (value === null || value === undefined || value === '') return 'N/A';
  
  // Format currency fields
  if (key.includes('premium') || key.includes('amount') || key.includes('limit') || key.includes('deductible')) {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (!isNaN(numValue)) {
      return `AED ${formatNumberWithCommas(numValue.toString())}`;
    }
  }
  
  // Format dates
  if (key.includes('date') && typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return formatDateDDMMYYYY(new Date(value));
    }
  }
  
  // Format boolean values
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  return value.toString();
};

const PISuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['policy_summary']));
  const [loading, setLoading] = useState(false);

  // Get data from location state (passed from PIProposalForm)
  const piData = location.state || {
    quoteReference: 'PI-2024-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    insurerName: 'AXA Gulf',
    insurerLogo: '/lovable-uploads/a1521c76-be1d-45e9-8d86-5df99d190608.png',
    totalPremium: 5300,
    professionalInfo: {
      companyName: 'TechFlow Solutions Ltd',
      professionType: 'IT Services',
      businessDescription: 'Enterprise software development and IT consulting services',
      businessAddress: 'Dubai Internet City, Building 7, Office 401, Dubai, UAE',
      yearsInBusiness: '8',
      annualRevenue: '5000000',
      numberOfEmployees: '25'
    },
    coverageDetails: {
      limitOfIndemnity: '1000000',
      deductible: '10000',
      policyPeriod: '12 months',
      retroactiveCoverage: 'Yes',
      additionalCoverages: ['Professional Liability Extension', 'Cyber Liability Coverage']
    },
    riskProfile: {
      previousInsurer: 'Dubai Insurance Company',
      yearsWithPreviousInsurer: '3',
      lossesInLastFiveYears: 'No'
    }
  };

  const toggleSectionExpansion = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleDownloadPolicy = () => {
    toast.success('Download Started', {
      description: 'Your policy document is being prepared...'
    });
  };

  const handleBackToDashboard = () => {
    navigate('/broker/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading policy details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Header 
        title="Professional Indemnity Insurance"
        onBackToDashboard={handleBackToDashboard}
      />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto space-y-8 p-6">
          {/* Success Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Policy Generated Successfully!</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Your Professional Indemnity insurance policy has been generated and is now active.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleDownloadPolicy} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Policy
              </Button>
              <Button onClick={handleBackToDashboard} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>

          {/* Policy Reference Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm px-4 py-2">
              Policy Reference: {piData.quoteReference}
            </Badge>
          </div>

          {/* Insurer & Premium Summary */}
          <Card className="mb-6 bg-white shadow-lg border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img 
                    src={piData.insurerLogo} 
                    alt={piData.insurerName}
                    className="w-16 h-16 object-contain rounded-lg border bg-white p-2"
                  />
                  <div>
                    <CardTitle className="text-xl font-semibold">{piData.insurerName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Professional Indemnity Insurance</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Total Annual Premium</div>
                  <div className="text-3xl font-bold text-primary">
                    AED {formatNumberWithCommas(piData.totalPremium.toString())}
                  </div>
                  <Badge className="mt-2" variant="secondary">Policy Active</Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Professional Information */}
          <Card className="mb-6 bg-white shadow-lg border-0">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('professional_info')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Professional Information
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      Business and practice details
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {expandedSections.has('professional_info') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('professional_info') && (
              <CardContent className="pt-0">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid lg:grid-cols-3">
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Practice Name</div>
                      <div className="text-sm font-medium">{piData.professionalInfo.companyName}</div>
                    </div>
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Profession Type</div>
                      <div className="text-sm font-medium">{piData.professionalInfo.professionType}</div>
                    </div>
                    <div className="p-3 border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Years in Practice</div>
                      <div className="text-sm font-medium">{piData.professionalInfo.yearsInBusiness} years</div>
                    </div>
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Annual Revenue</div>
                      <div className="text-sm font-medium">AED {formatNumberWithCommas(piData.professionalInfo.annualRevenue)}</div>
                    </div>
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Number of Employees</div>
                      <div className="text-sm font-medium">{piData.professionalInfo.numberOfEmployees}</div>
                    </div>
                    <div className="p-3 border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Practice Address</div>
                      <div className="text-sm font-medium">{piData.professionalInfo.businessAddress}</div>
                    </div>
                    <div className="p-3 border-r border-gray-200 lg:col-span-3">
                      <div className="text-xs text-gray-500 mb-1">Services Description</div>
                      <div className="text-sm font-medium">{piData.professionalInfo.businessDescription}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Coverage Details */}
          <Card className="mb-6 bg-white shadow-lg border-0">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('coverage_details')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Coverage Details
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      Insurance coverage and limits
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {expandedSections.has('coverage_details') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('coverage_details') && (
              <CardContent className="pt-0">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid lg:grid-cols-3">
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Limit of Indemnity</div>
                      <div className="text-sm font-medium">AED {formatNumberWithCommas(piData.coverageDetails.limitOfIndemnity)}</div>
                    </div>
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Deductible</div>
                      <div className="text-sm font-medium">AED {formatNumberWithCommas(piData.coverageDetails.deductible)}</div>
                    </div>
                    <div className="p-3 border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Policy Period</div>
                      <div className="text-sm font-medium">{piData.coverageDetails.policyPeriod}</div>
                    </div>
                    <div className="p-3 border-r border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Retroactive Coverage</div>
                      <div className="text-sm font-medium">{piData.coverageDetails.retroactiveCoverage}</div>
                    </div>
                    <div className="p-3 lg:col-span-2">
                      <div className="text-xs text-gray-500 mb-1">Additional Coverages</div>
                      <div className="text-sm font-medium">
                        {piData.coverageDetails.additionalCoverages.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Risk Profile */}
          <Card className="mb-6 bg-white shadow-lg border-0">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('risk_profile')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <FileCheck className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Risk Profile
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      Insurance history and risk assessment
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {expandedSections.has('risk_profile') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('risk_profile') && (
              <CardContent className="pt-0">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid lg:grid-cols-3">
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Previous Insurer</div>
                      <div className="text-sm font-medium">{piData.riskProfile.previousInsurer}</div>
                    </div>
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Years with Previous Insurer</div>
                      <div className="text-sm font-medium">{piData.riskProfile.yearsWithPreviousInsurer} years</div>
                    </div>
                    <div className="p-3 border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Claims in Last 5 Years</div>
                      <div className="text-sm font-medium">{piData.riskProfile.lossesInLastFiveYears}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <Button onClick={handleDownloadPolicy} variant="outline" size="lg" className="gap-2">
              <Download className="w-4 h-4" />
              Download Policy
            </Button>
            <Button onClick={handleBackToDashboard} size="lg" className="gap-2">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PISuccess;

