import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useNavigationHistory } from '@/shared/hooks/use-navigation-history';
import { Button } from "@/components/ui/button";
import { isDemoMode } from "@/lib/demo-mode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/layout/Footer";
import { ArrowLeft, Save, Calculator, FileText, Upload, Eye, Plus, Minus, Image, ChevronDown, ChevronRight, Trash2, X, MapPin, Building2, Shield, Building, User, Briefcase, Home as HomeIcon, Plane, Lock, Package, Ship, Anchor } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import { getActiveProjectTypes, getActiveConstructionTypes, getSubProjectTypesByProjectType } from "@/lib/masters-data";
import { getActiveCountries, getRegionsByCountry, getZonesByRegion } from "@/lib/location-data";
import { ClausePricingCard } from '@/features/product-config/cew/components/ClausePricingCard';
import { ProductCard } from "@/components/shared/ProductCard";
import { getProducts, getProduct, type Product } from '@/features/product-config/api/products';
import { deriveProductCode } from '@/shared/utils/common-methods';

interface VariableOption {
  id: number;
  label: string;
  limits: string;
  type: "percentage" | "amount";
  value: number;
}

interface ClausePricing {
  id: number;
  code: string;
  name: string;
  enabled: boolean;
  isMandatory: boolean;
  pricingType: "percentage" | "amount";
  pricingValue: number;
  variableOptions: VariableOption[];
}

interface InsuranceProduct {
  code: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: string;
  available: boolean;
}

const InsurerProductConfig = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { insurerId } = useParams();
  const location = useLocation();
  const isMarketAdmin = location.pathname.includes('/market-admin');

  // State for coming soon dialog
  const [isComingSoonDialogOpen, setIsComingSoonDialogOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      setProductsError(null);
      try {
        const resp = await getProducts();
        const items = resp.items || [];
        setProducts(items as unknown as Product[]);
      } catch (err: any) {
        setProducts([]);
        const status = err?.status;
        const msg =
          status === 401
            ? 'Unauthorized. Please log in again.'
            : status === 403
              ? 'You do not have permission to view products.'
              : status >= 500
                ? 'Server error while loading products. Please try again.'
                : err?.message || 'Failed to load products.';
        setProductsError(msg);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  const handleProductSelect = (selectedId: string) => {
    if (selectedId) {
      if (isMarketAdmin) {
        navigate(`/market-admin/insurer/${insurerId}/products/${selectedId}`);
      } else {
        navigate(`/insurer/products/${selectedId}`);
      }
    } else {
      setIsComingSoonDialogOpen(true);
    }
  };

  const activeProjectTypes = getActiveProjectTypes();
  const activeConstructionTypes = getActiveConstructionTypes();
  const activeCountries = getActiveCountries();
  
  // State for geographic selection
  const [selectedCountries, setSelectedCountries] = useState<number[]>([1]); // UAE by default
  const [selectedRegions, setSelectedRegions] = useState<number[]>([1]); // Dubai by default
  const [availableRegions, setAvailableRegions] = useState(() => getRegionsByCountry(1));
  const [availableZones, setAvailableZones] = useState(() => getZonesByRegion(1));

  // Handle geographic selection changes
  const handleCountryChange = (countryIds: number[]) => {
    setSelectedCountries(countryIds);
    const regions = countryIds.flatMap(countryId => getRegionsByCountry(countryId));
    setAvailableRegions(regions);
    updateQuoteConfig('details', 'countries', countryIds);
    updateQuoteConfig('details', 'regions', []);
    updateQuoteConfig('details', 'zones', []);
    setSelectedRegions([]);
    setAvailableZones([]);
  };

  const handleRegionChange = (regionIds: number[]) => {
    setSelectedRegions(regionIds);
    const zones = regionIds.flatMap(regionId => getZonesByRegion(regionId));
    setAvailableZones(zones);
    updateQuoteConfig('details', 'regions', regionIds);
    updateQuoteConfig('details', 'zones', []);
  };

  // Initialize base rates from masters data
  const initializeBaseRates = () => {
    const rates: Record<string, number> = {};
    activeProjectTypes.forEach(type => {
      rates[type.value] = type.baseRate;
    });
    return rates;
  };


  // Initialize sub project types as individual entries
  const initializeSubProjectEntries = () => {
    const entries: Array<{
      projectType: string;
      subProjectType: string;
      size: string;
      pricingType: string;
      baseRate: number;
      quoteOption: string;
    }> = [];
    
    activeProjectTypes.forEach(type => {
      const subTypes = getSubProjectTypesByProjectType(type.id);
      subTypes.forEach(subType => {
        entries.push({
          projectType: type.value,
          subProjectType: subType.label,
          size: '0-10',
          pricingType: 'percentage',
          baseRate: type.baseRate,
          quoteOption: 'quote'
        });
      });
    });
    
    return entries;
  };
  
  const [activeTab, setActiveTab] = useState("brokers");
  const [uploadedWordings, setUploadedWordings] = useState([
    { id: 1, name: "Standard CAR Policy Wording v2.1", uploadDate: "2024-01-15", size: "245 KB", active: true },
    { id: 2, name: "Enhanced Coverage Wording", uploadDate: "2024-01-10", size: "189 KB", active: false }
  ]);
  const [isNewWordingDialogOpen, setIsNewWordingDialogOpen] = useState(false);
  const [newWordingName, setNewWordingName] = useState("");
  const [isEditClauseDialogOpen, setIsEditClauseDialogOpen] = useState(false);
  const [selectedClause, setSelectedClause] = useState<any>(null);
  const [isAddClauseDialogOpen, setIsAddClauseDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [newClause, setNewClause] = useState({
    code: "",
    title: "",
    type: "Clause",
    show: "Optional",
    wording: "",
    purpose: "",
    pricingType: "percentage", // "percentage" or "fixed"
    pricingValue: 0
  });

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
      countries: [1], // Array of country IDs
      regions: [1], // Array of region IDs 
      zones: [1], // Array of zone IDs
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

  // Mock data for brokers
  const [brokersData, setBrokersData] = useState([
    { 
      id: 1, 
      name: "Gulf Insurance Brokers", 
      email: "info@gulfbrokers.ae", 
      license: "BRK-001-2024",
      isAssigned: true,
      minCommission: 2.0,
      maxCommission: 5.0,
      status: "Active"
    },
    { 
      id: 2, 
      name: "Emirates Risk Management", 
      email: "contact@emiratesrisk.com", 
      license: "BRK-002-2024",
      isAssigned: true,
      minCommission: 1.5,
      maxCommission: 4.5,
      status: "Active"
    },
    { 
      id: 3, 
      name: "Dubai Insurance Services", 
      email: "hello@dubaiinsurance.ae", 
      license: "BRK-003-2024",
      isAssigned: false,
      minCommission: 2.5,
      maxCommission: 6.0,
      status: "Active"
    },
    { 
      id: 4, 
      name: "Al Khaleej Insurance Brokers", 
      email: "info@alkhaleejbrokers.com", 
      license: "BRK-004-2024",
      isAssigned: false,
      minCommission: 1.8,
      maxCommission: 4.8,
      status: "Inactive"
    },
    { 
      id: 5, 
      name: "Middle East Insurance Partners", 
      email: "partners@meipartners.ae", 
      license: "BRK-005-2024",
      isAssigned: true,
      minCommission: 3.0,
      maxCommission: 7.0,
      status: "Active"
    }
  ]);

  // Mock data for clauses, exclusions, and warranties
  const [clausesData, setClausesData] = useState([
    { 
      code: "MRe 001", 
      title: "SRCC Coverage", 
      type: "Clause", 
      show: "Mandatory",
      wording: "It is hereby agreed and understood that this Policy is extended to cover loss of or damage to the insured property directly caused by:\n\nStrikers, locked-out workers, or persons taking part in labour disturbances, riots, or civil commotions;\n\nThe action of any lawfully constituted authority in suppressing or attempting to suppress any such disturbances or minimizing the consequences of such disturbances;\n\nMalicious acts committed by any person, whether or not such act is committed in connection with a disturbance of the public peace;\n\nprovided that such loss or damage is not otherwise excluded under this Policy.\n\nHowever, the insurers shall not be liable for:\n\nLoss or damage arising out of or in connection with war, invasion, act of foreign enemy, hostilities or warlike operations (whether war be declared or not), civil war, mutiny, insurrection, rebellion, revolution, military or usurped power, or any act of terrorism.\n\nConsequential loss of any kind or description.\n\nSubject otherwise to the terms, conditions, and exclusions of the Policy."
    },
    { 
      code: "MRe 002", 
      title: "Cross Liability", 
      type: "Clause", 
      show: "Mandatory",
      wording: "It is hereby agreed and understood that, subject to the limits of indemnity stated in the Policy and subject otherwise to the terms, exclusions, provisions and conditions of the Policy, where the insured comprises more than one party, the insurance afforded by this Policy shall apply in the same manner and to the same extent as if individual insurance contracts had been issued to each such party.\n\nHowever, the total liability of the Insurer shall not exceed the limits of indemnity stated in the Schedule, regardless of the number of insured parties."
    },
    { 
      code: "MRe 003", 
      title: "Maintenance Visits", 
      type: "Clause", 
      show: "Mandatory",
      wording: "It is hereby agreed and understood that this Policy covers maintenance visits and inspections conducted during the policy period. All maintenance activities must be carried out in accordance with manufacturer specifications and industry best practices.\n\nThe Insurer reserves the right to inspect the insured property at reasonable intervals to ensure compliance with maintenance requirements."
    },
    { code: "MRe 004", title: "Extended Maintenance", type: "Clause", show: "Mandatory" },
    { code: "MRe 005", title: "Time Schedule Condition", type: "Clause", show: "Optional" },
    { code: "MRe 006", title: "Overtime/Night Work/Express Freight", type: "Clause", show: "Optional" },
    { code: "MRe 007", title: "Airfreight Expenses", type: "Clause", show: "Optional" },
    { code: "MRe 008", title: "Structures in Earthquake Zones Warranty", type: "Clause", show: "Optional" },
    { code: "MRe 009", title: "Earthquake Clause", type: "Exclusion", show: "Optional" },
    { code: "MRe 010", title: "Flood And Inundation Clause", type: "Exclusion", show: "Optional" },
    { code: "MRe 011", title: "Serial Losses Clause", type: "Clause", show: "Optional" },
    { code: "MRe 012", title: "Windstorm Or Wind Related Water Damage", type: "Exclusion", show: "Optional" },
    { code: "MRe 013", title: "Property In Off-Site Storage Clause", type: "Warranty", show: "Optional" }
  ]);

  // State for selected project types
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<Set<string>>(new Set());

  const [ratingConfig, setRatingConfig] = useState({
    // Base Rates by Project Type (from masters data)
    baseRates: initializeBaseRates(),
    // Sub project entries with individual pricing
    subProjectEntries: initializeSubProjectEntries(),
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
    // Clauses Pricing - now derived from configured CEWs
    clausesPricing: clausesData.map((clause, index) => ({
      id: index + 1,
      code: clause.code,
      name: clause.title,
      enabled: clause.show === "Mandatory" ? true : false, // Mandatory always enabled
      isMandatory: clause.show === "Mandatory",
      pricingType: (clause.type === "Clause" ? "percentage" : "amount") as "percentage" | "amount",
      pricingValue: clause.type === "Clause" ? 2.5 : 500, // Default 2.5% for clauses, AED 500 for others
      variableOptions: [
        {
          id: 1,
          label: clause.show === "Mandatory" ? "Standard Rate" : "Base Option",
          limits: clause.show === "Mandatory" ? "All Coverage" : "Standard Coverage",
          type: (clause.type === "Clause" ? "percentage" : "amount") as "percentage" | "amount",
          value: clause.show === "Mandatory" 
            ? (clause.type === "Clause" ? [2, 3.5, 1.5][index] || 2 : [1500, 2500, 800][Math.floor(index/2)] || 1500)
            : (clause.type === "Clause" ? 5 : 1000)
        }
      ]
    })),
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const newWording = {
        id: uploadedWordings.length + 1,
        name: file.name,
        uploadDate: new Date().toISOString().split('T')[0],
        size: `${Math.round(file.size / 1024)} KB`,
        active: true
      };
      setUploadedWordings([...uploadedWordings, newWording]);
      toast({
        title: "Document Uploaded",
        description: `${file.name} has been successfully uploaded.`,
      });
    }
  };

  const saveConfiguration = () => {
    toast({
      title: "Configuration Saved",
      description: `Product configuration has been successfully saved for ${getInsurerName(insurerId)}.`,
    });
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

  const updateSubProjectEntry = (index: number, field: string, value: string | number) => {
    setRatingConfig(prev => ({
      ...prev,
      subProjectEntries: prev.subProjectEntries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
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

  const updateVariableOption = (clauseId: number, optionId: number, field: string, value: any) => {
    // Handle clause-level fields
    if (field === 'pricingType' || field === 'pricingValue') {
      setRatingConfig(prev => ({
        ...prev,
        clausesPricing: prev.clausesPricing.map(clause =>
          clause.id === clauseId ? { ...clause, [field]: value } : clause
        ),
      }));
      return;
    }

    // Handle variable option fields
    setRatingConfig(prev => ({
      ...prev,
      clausesPricing: prev.clausesPricing.map(clause =>
        clause.id === clauseId ? {
          ...clause,
          variableOptions: clause.variableOptions.map(option =>
            option.id === optionId ? { ...option, [field]: value } : option
          )
        } : clause
      ),
    }));
  };

  const addVariableOption = (clauseId: number) => {
    setRatingConfig(prev => ({
      ...prev,
      clausesPricing: prev.clausesPricing.map(clause =>
        clause.id === clauseId ? {
          ...clause,
          variableOptions: [...clause.variableOptions, {
            id: clause.variableOptions.length + 1,
            label: "",
            limits: "",
            type: "percentage",
            value: 0
          }]
        } : clause
      ),
    }));
  };

  const removeVariableOption = (clauseId: number, optionId: number) => {
    setRatingConfig(prev => ({
      ...prev,
      clausesPricing: prev.clausesPricing.map(clause =>
        clause.id === clauseId ? {
          ...clause,
          variableOptions: clause.variableOptions.filter(option => option.id !== optionId)
        } : clause
      ),
    }));
  };

  const toggleClause = (clauseId: number) => {
    setRatingConfig(prev => ({
      ...prev,
      clausesPricing: prev.clausesPricing.map(clause =>
        clause.id === clauseId && !clause.isMandatory ? { ...clause, enabled: !clause.enabled } : clause
      ),
    }));
  };

  const addNewClause = () => {
    const newClauseData = {
      code: newClause.code,
      title: newClause.title,
      type: newClause.type as "Clause" | "Exclusion" | "Warranty",
      show: newClause.show as "Mandatory" | "Optional",
      wording: newClause.wording
    };

    // Add to clauses data
    setClausesData(prev => [...prev, newClauseData]);

    // Add to pricing config
    const newPricingItem = {
      id: ratingConfig.clausesPricing.length + 1,
      code: newClause.code,
      name: newClause.title,
      enabled: newClause.show === "Mandatory",
      isMandatory: newClause.show === "Mandatory",
      pricingType: newClause.pricingType as "percentage" | "amount",
      pricingValue: newClause.pricingValue,
      variableOptions: [{
        id: 1,
        label: "Standard Rate",
        limits: "Standard Coverage",
        type: newClause.pricingType as "percentage" | "amount",
        value: newClause.pricingValue
      }]
    };

    setRatingConfig(prev => ({
      ...prev,
      clausesPricing: [...prev.clausesPricing, newPricingItem]
    }));

    // Reset form and close dialog
    setNewClause({
      code: "",
      title: "",
      type: "Clause",
      show: "Optional",
      wording: "",
      purpose: "",
      pricingType: "percentage",
      pricingValue: 0
    });
    setIsAddClauseDialogOpen(false);

    toast({
      title: "Success",
      description: "New clause added successfully",
    });
  };

  const toggleBrokerAssignment = (brokerId: number) => {
    setBrokersData(prev => 
      prev.map(broker => 
        broker.id === brokerId 
          ? { ...broker, isAssigned: !broker.isAssigned }
          : broker
      )
    );

    const broker = brokersData.find(b => b.id === brokerId);
    toast({
      title: broker?.isAssigned ? "Broker Unassigned" : "Broker Assigned",
      description: `${broker?.name} has been ${broker?.isAssigned ? 'unassigned from' : 'assigned to'} this product.`,
    });
  };

  const updateBrokerCommission = (brokerId: number, field: 'minCommission' | 'maxCommission', value: number) => {
    setBrokersData(prev => 
      prev.map(broker => 
        broker.id === brokerId 
          ? { ...broker, [field]: value }
          : broker
      )
    );
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

  const toggleProjectType = (projectType: string) => {
    setSelectedProjectTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectType)) {
        newSet.delete(projectType);
      } else {
        newSet.add(projectType);
      }
      return newSet;
    });
  };

  const showPreview = () => {
    setIsPreviewDialogOpen(true);
  };


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Product Configuration
              </h1>
              <p className="text-sm text-muted-foreground">Configure pricing parameters and policy wordings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          
          {/* Insurance products grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {isLoadingProducts ? (
              // Skeleton loader — matches the ProductCard grid layout
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/3" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-5/6" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : productsError ? (
              <Card className="col-span-full">
                <CardContent className="p-12 text-center space-y-4">
                  <p className="text-destructive font-medium">{productsError}</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsLoadingProducts(true);
                      setProductsError(null);
                      getProducts()
                        .then((resp) => setProducts((resp.items || []) as unknown as Product[]))
                        .catch((err: any) => {
                          setProductsError(err?.message || 'Failed to load products.');
                          setProducts([]);
                        })
                        .finally(() => setIsLoadingProducts(false));
                    }}
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : (isDemoMode()
                ? products.filter(p => p.code === 'PI_Arch')
                : products
              ).length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    No products found.
                  </p>
                </CardContent>
              </Card>
            ) : (
              (isDemoMode()
                ? products.filter(p => p.code === 'PI_Arch')
                : products
              ).map(p => (
                <ProductCard
                  key={p.id}
                  code={(p.code as string) || deriveProductCode(p.name)}
                  name={p.name}
                  description={p.description}
                  icon={<Package className="w-6 h-6" />}
                  color="primary"
                  onClick={() => handleProductSelect(p.id)}
                />
              ))
            )}
          </div>

          {/* Coming Soon Dialog */}
          <Dialog open={isComingSoonDialogOpen} onOpenChange={setIsComingSoonDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Coming Soon</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-muted-foreground">
                  This insurance product configuration will be available soon. We're working hard to bring you this feature.
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setIsComingSoonDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default InsurerProductConfig;
