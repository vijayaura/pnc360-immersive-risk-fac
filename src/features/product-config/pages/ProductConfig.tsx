import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Footer } from "@/components/layout/Footer";
import { ArrowLeft, Save, Calculator, FileText, Upload, Image } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { getActiveProjectTypes, getActiveConstructionTypes, getSubProjectTypesByProjectType } from "@/lib/masters-data";

const ProductConfig = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { insurerId } = useParams();
  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  
  // Detect if we're in insurer portal or market admin
  const isInsurerPortal = location.pathname.startsWith('/insurer');
  const basePath = isInsurerPortal ? '/insurer' : `/market-admin/insurer/${insurerId}`;
  
  const activeProjectTypes = getActiveProjectTypes();
  const activeConstructionTypes = getActiveConstructionTypes();

  // Initialize base rates from masters data
  const initializeBaseRates = () => {
    const rates: Record<string, number> = {};
    activeProjectTypes.forEach(type => {
      rates[type.value] = type.baseRate;
    });
    return rates;
  };
  
  const [ratingConfig, setRatingConfig] = useState({
    // Base Rates by Project Type (from masters data)
    baseRates: initializeBaseRates(),
    // Quote decision for each project type
    projectTypeQuoteOptions: (() => {
      const options: Record<string, string> = {};
      activeProjectTypes.forEach(type => {
        options[type.value] = 'quote'; // default to 'quote'
      });
      return options;
    })(),
    // Project Risk Factors
    projectRisk: {
      projectTypeMultipliers: {
        residential: 1.0,
        commercial: 1.2,
        infrastructure: 1.5,
      },
      durationLoadings: {
        lessThan12: 0,
        between12And18: 0.02,
        between18And24: 0.05,
        moreThan24: 0.10,
      },
      locationHazardLoadings: {
        low: 0,
        moderate: 0.10,
        high: 0.25,
      },
    },
    // Contractor Risk Factors
    contractorRisk: {
      experienceDiscounts: {
        lessThan2: 0.20,
        between2And5: 0.10,
        between5And10: 0,
        moreThan10: -0.10,
      },
      safetyRecordAdjustments: {
        poor: 0.15,
        average: 0,
        good: -0.05,
        excellent: -0.10,
      },
      subcontractorLoadings: {
        none: 0,
        limited: 0.05,
        moderate: 0.10,
        heavy: 0.15,
      },
    },
    // Coverage Options
    coverageOptions: {
      tplLimits: {
        basic: 1.0,
        standard: 1.1,
        enhanced: 1.2,
        premium: 1.3,
      },
      maintenanceExtension: {
        none: 0,
        sixMonths: 0.05,
        twelveMonths: 0.10,
        eighteenMonths: 0.15,
      },
    },
    // Deductible Adjustments
    deductibleAdjustments: {
      low: 0,
      standard: -0.05,
      high: -0.10,
      veryHigh: -0.15,
    },
    // Policy Limits
    limits: {
      minimumPremium: 25000,
      maximumCover: 50000000,
    },
  });

  const [quoteConfig, setQuoteConfig] = useState({
    header: {
      logo: "",
      companyName: "Emirates Insurance Company",
      address: "P.O. Box 3766, Dubai, UAE",
      phone: "+971 4 373 8726",
      email: "info@emirates.com",
      website: "www.emirates.com",
      showQuotationNumber: true,
      showDate: true,
      showValidityPeriod: true,
      headerColor: "#1f2937",
      textColor: "#ffffff",
    },
    footer: {
      showDisclaimer: true,
      disclaimer: "This quotation is valid for 30 days from the date of issue. Terms and conditions apply.",
      showContactInfo: true,
      showRegulatoryInfo: true,
      regulatoryText: "Emirates Insurance Company is regulated by the Insurance Authority of UAE. Registration No: 123456789",
      footerColor: "#f8f9fa",
      textColor: "#6b7280",
    },
    general: {
      currency: "AED",
      dateFormat: "DD/MM/YYYY",
      showLogo: true,
      logoPosition: "left",
      quotationNumberPrefix: "EIC-CAR-",
      validityDays: 30,
    },
  });

  const saveConfiguration = () => {
    showConfirmDialog(
      {
        title: "Save Configuration",
        description: "Are you sure you want to save the CAR insurance rating algorithm and quote template configuration?",
        confirmText: "Save Configuration"
      },
      () => {
        toast({
          title: "Configuration Saved",
          description: "CAR insurance rating algorithm and quote template have been successfully configured.",
        });
      }
    );
  };

  const updateBaseRate = (projectType: string, value: number) => {
    setRatingConfig(prev => ({
      ...prev,
      baseRates: {
        ...prev.baseRates,
        [projectType]: value,
      },
    }));
  };

  const updateProjectTypeQuoteOption = (projectType: string, option: string) => {
    setRatingConfig(prev => ({
      ...prev,
      projectTypeQuoteOptions: {
        ...prev.projectTypeQuoteOptions,
        [projectType]: option,
      },
    }));
  };

  const updateProjectRiskFactor = (category: string, key: string, value: number) => {
    setRatingConfig(prev => ({
      ...prev,
      projectRisk: {
        ...prev.projectRisk,
        [category]: {
          ...prev.projectRisk[category as keyof typeof prev.projectRisk],
          [key]: value,
        },
      },
    }));
  };

  const updateContractorRiskFactor = (category: string, key: string, value: number) => {
    setRatingConfig(prev => ({
      ...prev,
      contractorRisk: {
        ...prev.contractorRisk,
        [category]: {
          ...prev.contractorRisk[category as keyof typeof prev.contractorRisk],
          [key]: value,
        },
      },
    }));
  };

  const updateQuoteConfig = (section: string, field: string, value: any) => {
    setQuoteConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`${basePath}/dashboard`)}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">CAR Insurance - Configuration</h1>
                <p className="text-sm text-muted-foreground">Configure rating algorithm and quote templates</p>
              </div>
            </div>
            <Button onClick={saveConfiguration}>
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Three main sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Calculator className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold">Broker Assignments</h3>
              </div>
              <p className="text-sm text-muted-foreground">Configure broker settings and commission structure</p>
            </Card>
            
            <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/insurer/products')}>
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold">Products</h3>
              </div>
              <p className="text-sm text-muted-foreground">Manage products with quote, pricing, CEWs, and wording configurations</p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Image className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold">Quote Format</h3>
              </div>
              <p className="text-sm text-muted-foreground">Configure quote PDF layout and formatting</p>
            </Card>
          </div>
          
        </div>
      </div>

      <ConfirmDialog />
      <Footer />
    </div>
  );
};

export default ProductConfig;
