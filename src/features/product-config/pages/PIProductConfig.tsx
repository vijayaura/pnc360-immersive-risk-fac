import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollableTabs } from "@/components/ui/ScrollableTabs";
import { ArrowLeft, Save, FileText, Calculator, Upload, Layout, User, MapPin, Eye, Image, Plus, X, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Footer } from "@/components/layout/Footer";
import { useToast } from '@/shared/hooks/use-toast';

const PIProductConfig = () => {
  const navigate = useNavigate();
  const { insurerId } = useParams();
  const location = useLocation();
  const isMarketAdmin = location.pathname.includes('/market-admin');
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("quote-config");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Mock data for PI configuration
  const [quoteConfig, setQuoteConfig] = useState({
    details: {
      validityDays: "30",
      countries: ["UAE", "GCC", "Middle East"],
      regions: [],
      zones: [],
      quotePrefix: "PI"
    },
    header: {
      companyName: "Professional Indemnity Insurance Co.",
      companyAddress: "123 Business District, Dubai, UAE",
      contactInfo: "Phone: +971 4 123 4567\nEmail: info@pi-insurance.com",
      headerColor: "#1e40af",
      headerTextColor: "#ffffff",
      logoPosition: "left"
    },
    risk: {
      showProjectDetails: true,
      showCoverageTypes: true,
      showCoverageLimits: true,
      showDeductibles: true,
      riskSectionTitle: "Risk Information"
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
      showPolicyConditions: true,
      termsSectionTitle: "Terms & Conditions",
      additionalTerms: ""
    },
    signature: {
      showSignatureBlock: true,
      authorizedSignatory: "John Smith",
      signatoryTitle: "Underwriting Manager",
      signatureText: "This quotation is valid for 30 days from the date of issue."
    },
    footer: {
      showFooter: true,
      showDisclaimer: true,
      footerText: "Professional Indemnity Insurance Co. - Licensed by UAE Insurance Authority",
      disclaimerText: "This quotation is subject to our standard terms and conditions."
    }
  });

  // Mock insurer metadata for PI
  const [insurerMetadata] = useState({
    operating_countries: ["UAE", "GCC", "Middle East", "Asia", "Europe", "North America", "Worldwide"]
  });

  // Mock required documents data
  const [requiredDocuments, setRequiredDocuments] = useState([
    {
      id: 1,
      label: "Business Registration Certificate",
      description: "Valid business license or registration certificate",
      required: true,
      active: true,
      order: 1,
      template: null
    },
    {
      id: 2,
      label: "Professional Qualifications",
      description: "Certificates of professional qualifications and memberships",
      required: true,
      active: true,
      order: 2,
      template: null
    },
    {
      id: 3,
      label: "Financial Statements",
      description: "Latest audited financial statements (last 2 years)",
      required: true,
      active: true,
      order: 3,
      template: null
    },
    {
      id: 4,
      label: "Claims History",
      description: "Previous claims history and loss runs",
      required: false,
      active: true,
      order: 4,
      template: null
    }
  ]);

  const [newDocument, setNewDocument] = useState({
    label: "",
    description: "",
    required: false,
    active: true,
    template: null
  });

  // Mock policy wordings data
  const [policyWordings, setPolicyWordings] = useState([
    {
      id: 1,
      label: "Professional Indemnity Standard Policy Wording v1.0",
      is_active: true,
      file_url: "/documents/pi-standard-wording.pdf"
    },
    {
      id: 2,
      label: "Professional Indemnity Extended Coverage Wording v1.0",
      is_active: true,
      file_url: "/documents/pi-extended-wording.pdf"
    },
    {
      id: 3,
      label: "Professional Indemnity Exclusions and Conditions v1.0",
      is_active: false,
      file_url: "/documents/pi-exclusions.pdf"
    }
  ]);

  const [isWordingUploadDialogOpen, setIsWordingUploadDialogOpen] = useState(false);
  const [editingWording, setEditingWording] = useState<any>(null);
  const [wordingUploadTitle, setWordingUploadTitle] = useState("");
  const [wordingUploadFile, setWordingUploadFile] = useState<File | null>(null);
  const [wordingUploadActive, setWordingUploadActive] = useState(true);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Pricing configurator state
  const [activePricingTab, setActivePricingTab] = useState("base-rates");
  const [pricingConfig, setPricingConfig] = useState({
    baseRates: [
      { id: 1, profession: "Consulting Services", pricingType: "percentage", baseRate: "0.30", quoteOption: "quote" },
      { id: 2, profession: "Legal Services", pricingType: "percentage", baseRate: "0.45", quoteOption: "quote" },
      { id: 3, profession: "Accounting & Finance", pricingType: "percentage", baseRate: "0.35", quoteOption: "quote" },
      { id: 4, profession: "Architecture & Engineering", pricingType: "percentage", baseRate: "0.55", quoteOption: "quote" },
      { id: 5, profession: "IT Services", pricingType: "percentage", baseRate: "0.40", quoteOption: "quote" },
      { id: 6, profession: "Medical Services", pricingType: "percentage", baseRate: "0.75", quoteOption: "quote" },
      { id: 7, profession: "Miscellaneous", pricingType: "percentage", baseRate: "0.40", quoteOption: "quote" }
    ],
    minimumPremiums: [
      { id: 1, profession: "Consulting Services", riskType: "low", pricingType: "fixed", minimumPremium: "3000", quoteOption: "quote" },
      { id: 2, profession: "Legal Services", riskType: "mid", pricingType: "fixed", minimumPremium: "5000", quoteOption: "quote" },
      { id: 3, profession: "Accounting & Finance", riskType: "low", pricingType: "fixed", minimumPremium: "3500", quoteOption: "quote" },
      { id: 4, profession: "Architecture & Engineering", riskType: "high", pricingType: "fixed", minimumPremium: "6000", quoteOption: "quote" },
      { id: 5, profession: "IT Services", riskType: "mid", pricingType: "fixed", minimumPremium: "4000", quoteOption: "quote" },
      { id: 6, profession: "Medical Services", riskType: "very-high", pricingType: "fixed", minimumPremium: "8000", quoteOption: "quote" },
      { id: 7, profession: "Miscellaneous", riskType: "mid", pricingType: "fixed", minimumPremium: "4000", quoteOption: "quote" }
    ],
    feeIncome: [
      { id: 1, from: 0, to: 500000, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
      { id: 2, from: 500000, to: 1000000, pricingType: 'percentage', loadingDiscount: 5, quoteOption: 'quote' },
      { id: 3, from: 1000000, to: 2500000, pricingType: 'percentage', loadingDiscount: 10, quoteOption: 'quote' },
      { id: 4, from: 2500000, to: 999999999, pricingType: 'percentage', loadingDiscount: 15, quoteOption: 'quote' }
    ],
    coverages: [
      { id: 1, from: 0, to: 500000, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
      { id: 2, from: 500000, to: 1000000, pricingType: 'percentage', loadingDiscount: 5, quoteOption: 'quote' },
      { id: 3, from: 1000000, to: 5000000, pricingType: 'percentage', loadingDiscount: 10, quoteOption: 'quote' },
      { id: 4, from: 5000000, to: 999999999, pricingType: 'percentage', loadingDiscount: 15, quoteOption: 'quote' }
    ],
    policyPeriodRanges: [
      { id: 1, from: 1, to: 6, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
      { id: 2, from: 7, to: 12, pricingType: 'percentage', loadingDiscount: -5, quoteOption: 'quote' },
      { id: 3, from: 13, to: 24, pricingType: 'percentage', loadingDiscount: -10, quoteOption: 'quote' },
      { id: 4, from: 25, to: 999, pricingType: 'percentage', loadingDiscount: -15, quoteOption: 'quote' }
    ],
    retroactiveCoverage: [
      { id: 1, from: 0, to: 12, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
      { id: 2, from: 13, to: 24, pricingType: 'percentage', loadingDiscount: 5, quoteOption: 'quote' },
      { id: 3, from: 25, to: 60, pricingType: 'percentage', loadingDiscount: 15, quoteOption: 'quote' },
      { id: 4, from: 61, to: 999, pricingType: 'percentage', loadingDiscount: 25, quoteOption: 'quote' }
    ],
    additionalCoverages: [
      { id: 1, profession: "Consulting Services", title: "Cyber Liability Coverage", subtitle: "Protection against data breaches", pricingType: "fixed", value: "2000" },
      { id: 2, profession: "Legal Services", title: "Extended Defense Costs", subtitle: "Additional legal defense coverage", pricingType: "percentage", value: "0.15" },
      { id: 3, profession: "IT Services", title: "Data Recovery Coverage", subtitle: "Coverage for data recovery expenses", pricingType: "fixed", value: "5000" }
    ],
    feeTypes: [
      { id: 1, label: "VAT", pricingType: "percentage", value: "5", status: "active" },
      { id: 2, label: "Policy Fee", pricingType: "fixed", value: "100", status: "active" },
      { id: 3, label: "Stamp Duty", pricingType: "percentage", value: "0.5", status: "active" }
    ],
    limits: {
      maximumCover: 10000000,
      minimumPremium: 3000,
      baseBrokerCommission: 15,
      maximumBrokerCommission: 25,
      minimumBrokerCommission: 10
    },
    coverRequirements: {
      deductibles: [
        { id: 1, value: "5000", quoteOption: "quote", loadingDiscount: "0" },
        { id: 2, value: "10000", quoteOption: "quote", loadingDiscount: "5" }
      ]
    },
    // Risk Factors (similar to contractor risk factors in CAR)
    riskFactors: {
      experienceDiscounts: [
        { id: 1, from: 0, to: 2, pricingType: 'percentage', loadingDiscount: 20, quoteOption: 'quote' },
        { id: 2, from: 2, to: 5, pricingType: 'percentage', loadingDiscount: 10, quoteOption: 'quote' },
        { id: 3, from: 5, to: 10, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
        { id: 4, from: 10, to: 999, pricingType: 'percentage', loadingDiscount: -10, quoteOption: 'quote' }
      ],
      employeeCounts: [
        { id: 1, from: 1, to: 5, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
        { id: 2, from: 6, to: 20, pricingType: 'percentage', loadingDiscount: 5, quoteOption: 'quote' },
        { id: 3, from: 21, to: 50, pricingType: 'percentage', loadingDiscount: 10, quoteOption: 'quote' },
        { id: 4, from: 51, to: 999, pricingType: 'percentage', loadingDiscount: 15, quoteOption: 'quote' }
      ],
      policyPeriod: [
        { id: 1, from: 1, to: 6, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
        { id: 2, from: 7, to: 12, pricingType: 'percentage', loadingDiscount: -5, quoteOption: 'quote' },
        { id: 3, from: 13, to: 24, pricingType: 'percentage', loadingDiscount: -10, quoteOption: 'quote' },
        { id: 4, from: 25, to: 999, pricingType: 'percentage', loadingDiscount: -15, quoteOption: 'quote' }
      ],
      claimFrequency: [
        { id: 1, from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
        { id: 2, from: 1, to: 2, pricingType: 'percentage', loadingDiscount: 15, quoteOption: 'quote' },
        { id: 3, from: 3, to: 999, pricingType: 'percentage', loadingDiscount: 30, quoteOption: 'no-quote' }
      ],
      claimAmountCategories: [
        { id: 1, from: 0, to: 50000, pricingType: 'percentage', loadingDiscount: 5, quoteOption: 'quote' },
        { id: 2, from: 50000, to: 100000, pricingType: 'percentage', loadingDiscount: 15, quoteOption: 'quote' },
        { id: 3, from: 100000, to: 999999999, pricingType: 'percentage', loadingDiscount: 25, quoteOption: 'no-quote' }
      ],
    }
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement actual save functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Configuration Saved",
        description: "PI product configuration has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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

  // Mock functions for regions and zones (like CAR version)
  const getAvailableRegions = () => {
    return [
      { name: "Dubai", country: "UAE" },
      { name: "Abu Dhabi", country: "UAE" },
      { name: "Sharjah", country: "UAE" },
      { name: "Riyadh", country: "Saudi Arabia" },
      { name: "Doha", country: "Qatar" }
    ];
  };

  const getAvailableZones = () => {
    return [
      { name: "Downtown Dubai", region: "Dubai", country: "UAE" },
      { name: "Marina", region: "Dubai", country: "UAE" },
      { name: "Business Bay", region: "Dubai", country: "UAE" },
      { name: "Corniche", region: "Abu Dhabi", country: "UAE" }
    ];
  };

  // Wording management functions
  const openUploadDialog = () => {
    setEditingWording(null);
    setWordingUploadTitle("");
    setWordingUploadFile(null);
    setWordingUploadActive(true);
    setIsWordingUploadDialogOpen(true);
  };

  const openEditDialog = (wording: any) => {
    setEditingWording(wording);
    setWordingUploadTitle(wording.label);
    setWordingUploadFile(null);
    setWordingUploadActive(wording.is_active);
    setIsWordingUploadDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setIsUploadingFile(true);
      // Simulate file upload
      setTimeout(() => {
        setWordingUploadFile(file);
        setIsUploadingFile(false);
        toast({ title: 'File uploaded', description: 'File uploaded successfully.' });
      }, 1000);
    } else {
      setWordingUploadFile(null);
    }
  };

  const handleSavePolicyWording = () => {
    setIsSaving(true);
    setTimeout(() => {
      if (editingWording) {
        // Update existing wording
        const updatedWordings = policyWordings.map(w =>
          w.id === editingWording.id
            ? { ...w, label: wordingUploadTitle, is_active: wordingUploadActive }
            : w
        );
        setPolicyWordings(updatedWordings);
        toast({ title: 'Wording updated', description: 'Policy wording updated successfully.' });
      } else {
        // Add new wording
        const newWording = {
          id: Math.max(...policyWordings.map(w => w.id)) + 1,
          label: wordingUploadTitle,
          is_active: wordingUploadActive,
          file_url: `/documents/${wordingUploadFile?.name || 'document.pdf'}`
        };
        setPolicyWordings([...policyWordings, newWording]);
        toast({ title: 'Wording added', description: 'Policy wording added successfully.' });
      }
      setIsWordingUploadDialogOpen(false);
      setIsSaving(false);
    }, 1000);
  };

  const handleToggleWordingActive = (wording: any, isActive: boolean) => {
    const updatedWordings = policyWordings.map(w =>
      w.id === wording.id ? { ...w, is_active: isActive } : w
    );
    setPolicyWordings(updatedWordings);
    toast({
      title: isActive ? 'Wording activated' : 'Wording deactivated',
      description: `Policy wording ${isActive ? 'activated' : 'deactivated'} successfully.`
    });
  };

  const handleDeleteWording = (wording: any) => {
    const updatedWordings = policyWordings.filter(w => w.id !== wording.id);
    setPolicyWordings(updatedWordings);
    toast({ title: 'Wording deleted', description: 'Policy wording deleted successfully.' });
  };

  // Pricing configurator functions
  const updateBaseRate = (id: number, field: string, value: string) => {
    setPricingConfig(prev => ({
      ...prev,
      baseRates: prev.baseRates.map(rate =>
        rate.id === id ? { ...rate, [field]: value } : rate
      )
    }));
  };

  const updateMinimumPremium = (id: number, field: string, value: string) => {
    setPricingConfig(prev => ({
      ...prev,
      minimumPremiums: prev.minimumPremiums.map(premium =>
        premium.id === id ? { ...premium, [field]: value } : premium
      )
    }));
  };

  // Fee Income helper functions
  const addFeeIncomeEntry = () => {
    setPricingConfig(prev => ({
      ...prev,
      feeIncome: [
        ...prev.feeIncome,
        { id: Date.now(), from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' }
      ]
    }));
  };

  const updateFeeIncomeEntry = (id: number, field: string, value: any) => {
    setPricingConfig(prev => ({
      ...prev,
      feeIncome: prev.feeIncome.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const removeFeeIncomeEntry = (id: number) => {
    setPricingConfig(prev => ({
      ...prev,
      feeIncome: prev.feeIncome.filter(entry => entry.id !== id)
    }));
  };

  // Coverages helper functions
  const addCoveragesEntry = () => {
    setPricingConfig(prev => ({
      ...prev,
      coverages: [
        ...prev.coverages,
        { id: Date.now(), from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' }
      ]
    }));
  };

  const updateCoveragesEntry = (id: number, field: string, value: any) => {
    setPricingConfig(prev => ({
      ...prev,
      coverages: prev.coverages.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const removeCoveragesEntry = (id: number) => {
    setPricingConfig(prev => ({
      ...prev,
      coverages: prev.coverages.filter(entry => entry.id !== id)
    }));
  };

  // Policy Period Ranges helper functions
  const addPolicyPeriodRangesEntry = () => {
    setPricingConfig(prev => ({
      ...prev,
      policyPeriodRanges: [
        ...prev.policyPeriodRanges,
        { id: Date.now(), from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' }
      ]
    }));
  };

  const updatePolicyPeriodRangesEntry = (id: number, field: string, value: any) => {
    setPricingConfig(prev => ({
      ...prev,
      policyPeriodRanges: prev.policyPeriodRanges.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const removePolicyPeriodRangesEntry = (id: number) => {
    setPricingConfig(prev => ({
      ...prev,
      policyPeriodRanges: prev.policyPeriodRanges.filter(entry => entry.id !== id)
    }));
  };

  // Retroactive Coverage helper functions
  const addRetroactiveCoverageEntry = () => {
    setPricingConfig(prev => ({
      ...prev,
      retroactiveCoverage: [
        ...prev.retroactiveCoverage,
        { id: Date.now(), from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' }
      ]
    }));
  };

  const updateRetroactiveCoverageEntry = (id: number, field: string, value: any) => {
    setPricingConfig(prev => ({
      ...prev,
      retroactiveCoverage: prev.retroactiveCoverage.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const removeRetroactiveCoverageEntry = (id: number) => {
    setPricingConfig(prev => ({
      ...prev,
      retroactiveCoverage: prev.retroactiveCoverage.filter(entry => entry.id !== id)
    }));
  };

  // Additional Coverages helper functions
  const addAdditionalCoveragesEntry = () => {
    setPricingConfig(prev => ({
      ...prev,
      additionalCoverages: [
        ...prev.additionalCoverages,
        { id: Date.now(), profession: "Consulting Services", title: "", subtitle: "", pricingType: 'fixed', value: "0" }
      ]
    }));
  };

  const updateAdditionalCoveragesEntry = (id: number, field: string, value: any) => {
    setPricingConfig(prev => ({
      ...prev,
      additionalCoverages: prev.additionalCoverages.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const removeAdditionalCoveragesEntry = (id: number) => {
    setPricingConfig(prev => ({
      ...prev,
      additionalCoverages: prev.additionalCoverages.filter(entry => entry.id !== id)
    }));
  };

  // Fee Types helper functions
  const addFeeTypeEntry = () => {
    setPricingConfig(prev => ({
      ...prev,
      feeTypes: [
        ...prev.feeTypes,
        { id: Date.now(), label: "", pricingType: "percentage", value: "0", status: "active" }
      ]
    }));
  };

  const updateFeeTypeEntry = (id: number, field: string, value: any) => {
    setPricingConfig(prev => ({
      ...prev,
      feeTypes: prev.feeTypes.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const removeFeeTypeEntry = (id: number) => {
    setPricingConfig(prev => ({
      ...prev,
      feeTypes: prev.feeTypes.filter(entry => entry.id !== id)
    }));
  };

  // Risk factors helper functions
  const addRiskFactorEntry = (category: string) => {
    setPricingConfig(prev => ({
      ...prev,
      riskFactors: {
        ...prev.riskFactors,
        [category]: [
          ...prev.riskFactors[category],
          { id: Date.now(), from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' }
        ]
      }
    }));
  };

  const updateRiskFactorEntry = (category: string, id: number, field: string, value: any) => {
    setPricingConfig(prev => ({
      ...prev,
      riskFactors: {
        ...prev.riskFactors,
        [category]: prev.riskFactors[category].map((entry: any) =>
          entry.id === id ? { ...entry, [field]: value } : entry
        )
      }
    }));
  };

  const removeRiskFactorEntry = (category: string, id: number) => {
    setPricingConfig(prev => ({
      ...prev,
      riskFactors: {
        ...prev.riskFactors,
        [category]: prev.riskFactors[category].filter((entry: any) => entry.id !== id)
      }
    }));
  };

  const updateLimits = (key: string, value: number) => {
    setPricingConfig(prev => ({
      ...prev,
      limits: { ...prev.limits, [key]: value }
    }));
  };

  const addCoverRequirementEntry = (category: string) => {
    const existingEntries = pricingConfig.coverRequirements[category as keyof typeof pricingConfig.coverRequirements] || [];
    const newId = existingEntries.length > 0 ? Math.max(...existingEntries.map((e: any) => e.id)) + 1 : 1;

    const newEntry = category === 'subLimits'
      ? { id: newId, title: "", description: "", value: "0", pricingType: "fixed" }
      : { id: newId, value: "0", quoteOption: "quote", loadingDiscount: "0" };

    setPricingConfig(prev => ({
      ...prev,
      coverRequirements: {
        ...prev.coverRequirements,
        [category]: [...existingEntries, newEntry]
      }
    }));
  };

  const updateCoverRequirementEntry = (category: string, id: number, field: string, value: any) => {
    setPricingConfig(prev => ({
      ...prev,
      coverRequirements: {
        ...prev.coverRequirements,
        [category]: (prev.coverRequirements[category as keyof typeof prev.coverRequirements] || []).map((entry: any) =>
          entry.id === id ? { ...entry, [field]: value } : entry
        )
      }
    }));
  };

  const removeCoverRequirementEntry = (category: string, id: number) => {
    setPricingConfig(prev => ({
      ...prev,
      coverRequirements: {
        ...prev.coverRequirements,
        [category]: (prev.coverRequirements[category as keyof typeof prev.coverRequirements] || []).filter((entry: any) => entry.id !== id)
      }
    }));
  };

  const basePath = isMarketAdmin ? `/market-admin/insurer/${insurerId}` : '/insurer';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b bg-card">
        <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`${basePath}/product-config`)}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Product Studio
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Professional Indemnity Insurance - Product Configuration</h1>
                <p className="text-sm text-muted-foreground">PI</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-8">
          <Tabs value={activeTab} onValueChange={(val) => { handleTabChange(val); setTimeout(() => { document.querySelector<HTMLElement>('[role="tab"][data-state="active"]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }); }, 50); }} className="space-y-6">
            <ScrollableTabs className="w-full">
              <TabsList className="inline-flex min-w-max w-full bg-primary/5 p-1 gap-1.5 rounded-lg border border-primary/10 shadow-sm transition-all duration-300">
                <TabsTrigger value="quote-config" className="shrink-0 flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                  <FileText className="w-4 h-4" />
                  Quote Coverage
                </TabsTrigger>
                <TabsTrigger value="pricing" className="shrink-0 flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                  <Calculator className="w-4 h-4" />
                  Pricing Configurator
                </TabsTrigger>
                <TabsTrigger value="wording" className="shrink-0 flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                  <Upload className="w-4 h-4" />
                  Wording Configurations
                </TabsTrigger>
                <TabsTrigger value="quote-format" className="shrink-0 flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                  <Layout className="w-4 h-4" />
                  Quote Format
                </TabsTrigger>
                <TabsTrigger value="required-documents" className="shrink-0 flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                  <FileText className="w-4 h-4" />
                  Required Documents
                </TabsTrigger>
              </TabsList>
            </ScrollableTabs>

            {/* Quote Coverage Tab */}
            <TabsContent value="quote-config" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Quote Coverage Configuration</CardTitle>
                      <CardDescription>Configure quotation coverage, validity, and operating regions</CardDescription>
                    </div>
                    <Button
                      type="button"
                      onClick={saveConfiguration}
                      size="sm"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Quote Coverage
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <div className="space-y-6">
                      {/* Form Fields Skeleton */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-36"></div>
                          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Validity Period (Days)</label>
                        <input
                          id="validity-days"
                          name="validity_days"
                          type="number"
                          autoComplete="off"
                          value={quoteConfig.details.validityDays}
                          onChange={(e) => updateQuoteConfig('details', 'validityDays', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md"
                        />
                      </div>

                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          Geographic Coverage
                        </h3>

                        {quoteConfig.details.countries && quoteConfig.details.countries.length > 0 && (
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-xs text-blue-600">
                              <span className="font-medium">Selected:</span> {quoteConfig.details.countries.length} country(ies)
                              {quoteConfig.details.regions && quoteConfig.details.regions.length > 0 && (
                                <span>, {quoteConfig.details.regions.length} region(s)</span>
                              )}
                              {quoteConfig.details.zones && quoteConfig.details.zones.length > 0 && (
                                <span>, {quoteConfig.details.zones.length} zone(s)</span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="space-y-6">
                          <div className="space-y-3">
                            <label className="text-sm font-medium">Operating Countries</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg">
                              {insurerMetadata.operating_countries.map((countryName) => (
                                <div key={countryName} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`country-${countryName}`}
                                    checked={quoteConfig.details.countries?.includes(countryName)}
                                    onChange={(e) => {
                                      const currentValue = quoteConfig.details.countries || [];
                                      if (e.target.checked) {
                                        const newValue = [...currentValue, countryName];
                                        updateQuoteConfig('details', 'countries', newValue);
                                        updateQuoteConfig('details', 'regions', []);
                                        updateQuoteConfig('details', 'zones', []);
                                      } else {
                                        const newValue = currentValue.filter((name) => name !== countryName);
                                        updateQuoteConfig('details', 'countries', newValue);
                                        updateQuoteConfig('details', 'regions', []);
                                        updateQuoteConfig('details', 'zones', []);
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <label
                                    htmlFor={`country-${countryName}`}
                                    className="text-sm font-medium leading-none cursor-pointer"
                                  >
                                    {countryName}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {quoteConfig.details.countries && quoteConfig.details.countries.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <label className="text-sm font-medium">Operating Regions</label>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <span>•</span>
                                  <span>Available for selected countries</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border rounded-lg max-h-48 overflow-y-auto bg-muted/20">
                                {(getAvailableRegions() || []).map((region, index) => (
                                  <div key={index} className="flex items-start space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`region-${index}`}
                                      checked={quoteConfig.details.regions?.includes(region.name)}
                                      onChange={(e) => {
                                        const currentValue = quoteConfig.details.regions || [];
                                        let newValue: string[];
                                        if (e.target.checked) {
                                          newValue = [...currentValue, region.name];
                                          updateQuoteConfig('details', 'regions', newValue);
                                          updateQuoteConfig('details', 'zones', []);
                                        } else {
                                          newValue = currentValue.filter((name) => name !== region.name);
                                          updateQuoteConfig('details', 'regions', newValue);
                                          updateQuoteConfig('details', 'zones', []);
                                        }
                                      }}
                                      className="mt-1 rounded"
                                    />
                                    <div className="flex flex-col">
                                      <label
                                        htmlFor={`region-${index}`}
                                        className="text-sm font-medium leading-none cursor-pointer"
                                      >
                                        {region.name}
                                      </label>
                                      <span className="text-xs text-muted-foreground mt-1">
                                        {region.country}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                {(getAvailableRegions() || []).length === 0 && (
                                  <div className="col-span-full text-sm text-muted-foreground p-2 text-center">
                                    No regions available for selected countries
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {quoteConfig.details.regions && quoteConfig.details.regions.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <label className="text-sm font-medium">Operating Zones</label>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <span>•</span>
                                  <span>Available for selected regions</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border rounded-lg max-h-48 overflow-y-auto bg-muted/20">
                                {(getAvailableZones() || []).map((zone, index) => (
                                  <div key={index} className="flex items-start space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`zone-${index}`}
                                      checked={quoteConfig.details.zones?.includes(zone.name)}
                                      onChange={(e) => {
                                        const currentValue = quoteConfig.details.zones || [];
                                        if (e.target.checked) {
                                          updateQuoteConfig('details', 'zones', [...currentValue, zone.name]);
                                        } else {
                                          updateQuoteConfig('details', 'zones', currentValue.filter((name) => name !== zone.name));
                                        }
                                      }}
                                      className="mt-1 rounded"
                                    />
                                    <div className="flex flex-col">
                                      <label
                                        htmlFor={`zone-${index}`}
                                        className="text-sm font-medium leading-none cursor-pointer"
                                      >
                                        {zone.name}
                                      </label>
                                      <span className="text-xs text-muted-foreground mt-1">
                                        {zone.region}, {zone.country}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                {(getAvailableZones() || []).length === 0 && (
                                  <div className="col-span-full text-sm text-muted-foreground p-2 text-center">
                                    No zones available for selected regions
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing Configurator Tab */}
            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Pricing Configuration
                    </CardTitle>
                    <CardDescription>Configure base rates and policy limits for Professional Indemnity Insurance</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 h-[calc(100vh-20rem)] overflow-scroll custom-scrollbars">
                    {/* Sidebar Navigation */}
                    <div className="w-64 bg-muted/30 rounded-lg p-4 overflow-y-scroll custom-scrollbars">
                      <h3 className="font-semibold text-foreground mb-4">Pricing Configuration</h3>
                      <div className="space-y-2">
                        {[
                          { id: "base-rates", label: "Base Rates by Profession" },
                          { id: "minimum-premiums", label: "Min. Premium by Profession" },
                          { id: "fee-income", label: "Fee Income" },
                          { id: "coverages", label: "Coverages" },
                          { id: "additional-coverages", label: "Additional Coverages" },
                          { id: "risk-factors", label: "Risk Factors" },
                          { id: "limits-deductibles", label: "Policy Limits & Deductibles" },
                          { id: "fee-types", label: "Fee Types" }
                        ].map((section) => (
                          <button
                            key={section.id}
                            onClick={() => setActivePricingTab(section.id)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activePricingTab === section.id
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                          >
                            {section.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbars">
                      {/* Base Rates Tab */}
                      {activePricingTab === "base-rates" && (
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle>Base Rates by Profession</CardTitle>
                                <CardDescription>Configure base premium rates for different professional services</CardDescription>
                              </div>
                              <Button onClick={saveConfiguration} disabled={isSaving} size="sm">
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Base Rates'}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {!pricingConfig.baseRates.length && (
                              <div className="rounded-md border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 mb-4">
                                <p className="font-medium">No base rates configured</p>
                                <p className="text-sm mt-1">Configure rates for professional categories below.</p>
                              </div>
                            )}

                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-1/4">Profession Type</TableHead>
                                  <TableHead className="w-1/4">Pricing Type</TableHead>
                                  <TableHead className="w-1/4">Base Rate</TableHead>
                                  <TableHead className="w-1/4">Quote</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pricingConfig.baseRates.map((rate) => (
                                  <TableRow key={rate.id}>
                                    <TableCell className="font-medium">{rate.profession}</TableCell>
                                    <TableCell>
                                      <Select
                                        value={rate.pricingType}
                                        onValueChange={(value) => updateBaseRate(rate.id, 'pricingType', value)}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="percentage">Percentage</SelectItem>
                                          <SelectItem value="fixed">Fixed Rate</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={rate.baseRate}
                                        onChange={(e) => updateBaseRate(rate.id, 'baseRate', e.target.value)}
                                        placeholder="0.00"
                                        className="w-full"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={rate.quoteOption}
                                        onValueChange={(value) => updateBaseRate(rate.id, 'quoteOption', value)}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="quote">Quote</SelectItem>
                                          <SelectItem value="no-quote">No Quote</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      )}

                      {/* Minimum Premium by Profession Tab */}
                      {activePricingTab === "minimum-premiums" && (
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle>Minimum Premium by Profession</CardTitle>
                                <CardDescription>Configure minimum premium amounts for different professional services</CardDescription>
                              </div>
                              <Button onClick={saveConfiguration} disabled={isSaving} size="sm">
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Minimum Premiums'}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {!pricingConfig.minimumPremiums.length && (
                              <div className="rounded-md border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 mb-4">
                                <p className="font-medium">No minimum premiums configured</p>
                                <p className="text-sm mt-1">Configure minimum premiums for professional categories below.</p>
                              </div>
                            )}

                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Profession Type</TableHead>
                                  <TableHead>Risk Type</TableHead>
                                  <TableHead>Pricing Type</TableHead>
                                  <TableHead>Minimum Premium (AED)</TableHead>
                                  <TableHead>Quote Option</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pricingConfig.minimumPremiums.map((premium) => (
                                  <TableRow key={premium.id}>
                                    <TableCell className="font-medium">{premium.profession}</TableCell>
                                    <TableCell>
                                      <Select
                                        value={premium.riskType}
                                        onValueChange={(value) => updateMinimumPremium(premium.id, 'riskType', value)}
                                      >
                                        <SelectTrigger className="w-[140px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="low">Low</SelectItem>
                                          <SelectItem value="mid">Mid</SelectItem>
                                          <SelectItem value="high">High</SelectItem>
                                          <SelectItem value="very-high">Very High</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={premium.pricingType}
                                        onValueChange={(value) => updateMinimumPremium(premium.id, 'pricingType', value)}
                                      >
                                        <SelectTrigger className="w-[140px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="percentage">Percentage</SelectItem>
                                          <SelectItem value="fixed">Fixed Rate</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        value={premium.minimumPremium}
                                        onChange={(e) => updateMinimumPremium(premium.id, 'minimumPremium', e.target.value)}
                                        placeholder="0"
                                        className="w-32"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={premium.quoteOption}
                                        onValueChange={(value) => updateMinimumPremium(premium.id, 'quoteOption', value)}
                                      >
                                        <SelectTrigger className="w-[140px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="quote">Quote</SelectItem>
                                          <SelectItem value="no-quote">No Quote</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      )}

                      {/* Fee Income Tab */}
                      {activePricingTab === "fee-income" && (
                        <Card className="border border-border bg-card">
                          <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <div>
                              <CardTitle>Fee Income</CardTitle>
                              <CardDescription>Rate based on annual fee income ranges (AED)</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={addFeeIncomeEntry}
                              >
                                Add Row
                              </Button>
                              <Button onClick={saveConfiguration} disabled={isSaving} size="sm">
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Fee Income'}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-1/6">From (AED)</TableHead>
                                  <TableHead className="w-1/6">To (AED)</TableHead>
                                  <TableHead className="w-1/5">Pricing Type</TableHead>
                                  <TableHead className="w-1/5">Loading/Discount</TableHead>
                                  <TableHead className="w-1/5">Quote Option</TableHead>
                                  <TableHead className="w-16">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pricingConfig.feeIncome.map((entry: any) => (
                                  <TableRow key={entry.id}>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        value={entry.from}
                                        onChange={(e) => updateFeeIncomeEntry(entry.id, 'from', parseFloat(e.target.value) || 0)}
                                        className="w-full"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        value={entry.to}
                                        onChange={(e) => updateFeeIncomeEntry(entry.id, 'to', parseFloat(e.target.value) || 0)}
                                        className="w-full"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={entry.pricingType}
                                        onValueChange={(value) => updateFeeIncomeEntry(entry.id, 'pricingType', value)}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="percentage">Percentage</SelectItem>
                                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={entry.loadingDiscount}
                                        onChange={(e) => updateFeeIncomeEntry(entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                        className="w-full"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={entry.quoteOption}
                                        onValueChange={(value) => updateFeeIncomeEntry(entry.id, 'quoteOption', value)}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="quote">Auto Quote</SelectItem>
                                          <SelectItem value="no-quote">No Quote</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFeeIncomeEntry(entry.id)}
                                        className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                      >
                                        Remove
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      )}

                      {/* Coverages Tab */}
                      {activePricingTab === "coverages" && (
                        <div className="space-y-6">
                          {/* Header with Title and Save Button */}
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <CardTitle>Coverages</CardTitle>
                              <CardDescription>Configure coverage limits, policy period, and retroactive coverage ranges</CardDescription>
                            </div>
                            <Button onClick={saveConfiguration} disabled={isSaving} size="sm">
                              <Save className="w-4 h-4 mr-2" />
                              {isSaving ? 'Saving...' : 'Save Coverages'}
                            </Button>
                          </div>

                          {/* Limit of Indemnity Section */}
                          <Card className="border border-border bg-card">
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                              <div>
                                <CardTitle className="text-sm">Limit of Indemnity</CardTitle>
                                <p className="text-xs text-muted-foreground">Rate based on limit of indemnity ranges (AED)</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={addCoveragesEntry}
                                >
                                  Add Row
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-1/6">From (AED)</TableHead>
                                    <TableHead className="w-1/6">To (AED)</TableHead>
                                    <TableHead className="w-1/5">Pricing Type</TableHead>
                                    <TableHead className="w-1/5">Loading/Discount</TableHead>
                                    <TableHead className="w-1/5">Quote Option</TableHead>
                                    <TableHead className="w-16">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {pricingConfig.coverages.map((entry: any) => (
                                    <TableRow key={entry.id}>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          value={entry.from}
                                          onChange={(e) => updateCoveragesEntry(entry.id, 'from', parseFloat(e.target.value) || 0)}
                                          className="w-full"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          value={entry.to}
                                          onChange={(e) => updateCoveragesEntry(entry.id, 'to', parseFloat(e.target.value) || 0)}
                                          className="w-full"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Select
                                          value={entry.pricingType}
                                          onValueChange={(value) => updateCoveragesEntry(entry.id, 'pricingType', value)}
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={entry.loadingDiscount}
                                          onChange={(e) => updateCoveragesEntry(entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                          className="w-full"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Select
                                          value={entry.quoteOption}
                                          onValueChange={(value) => updateCoveragesEntry(entry.id, 'quoteOption', value)}
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="quote">Auto Quote</SelectItem>
                                            <SelectItem value="no-quote">No Quote</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeCoveragesEntry(entry.id)}
                                          className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                        >
                                          Remove
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>

                          {/* Policy Period Section */}
                          <Card className="border border-border bg-card">
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                              <div>
                                <CardTitle className="text-sm">Policy Period</CardTitle>
                                <p className="text-xs text-muted-foreground">Rate based on policy period ranges (months)</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={addPolicyPeriodRangesEntry}
                                >
                                  Add Row
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-1/6">From (Months)</TableHead>
                                    <TableHead className="w-1/6">To (Months)</TableHead>
                                    <TableHead className="w-1/5">Pricing Type</TableHead>
                                    <TableHead className="w-1/5">Loading/Discount</TableHead>
                                    <TableHead className="w-1/5">Quote Option</TableHead>
                                    <TableHead className="w-16">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {pricingConfig.policyPeriodRanges.map((entry: any) => (
                                    <TableRow key={entry.id}>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          value={entry.from}
                                          onChange={(e) => updatePolicyPeriodRangesEntry(entry.id, 'from', parseFloat(e.target.value) || 0)}
                                          className="w-full"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          value={entry.to}
                                          onChange={(e) => updatePolicyPeriodRangesEntry(entry.id, 'to', parseFloat(e.target.value) || 0)}
                                          className="w-full"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Select
                                          value={entry.pricingType}
                                          onValueChange={(value) => updatePolicyPeriodRangesEntry(entry.id, 'pricingType', value)}
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={entry.loadingDiscount}
                                          onChange={(e) => updatePolicyPeriodRangesEntry(entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                          className="w-full"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Select
                                          value={entry.quoteOption}
                                          onValueChange={(value) => updatePolicyPeriodRangesEntry(entry.id, 'quoteOption', value)}
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="quote">Auto Quote</SelectItem>
                                            <SelectItem value="no-quote">No Quote</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removePolicyPeriodRangesEntry(entry.id)}
                                          className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                        >
                                          Remove
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>

                          {/* Retroactive Coverage Section */}
                          <Card className="border border-border bg-card">
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                              <div>
                                <CardTitle className="text-sm">Retroactive Coverage</CardTitle>
                                <p className="text-xs text-muted-foreground">Rate based on retroactive coverage period (months)</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={addRetroactiveCoverageEntry}
                                >
                                  Add Row
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-1/6">From (Months)</TableHead>
                                    <TableHead className="w-1/6">To (Months)</TableHead>
                                    <TableHead className="w-1/5">Pricing Type</TableHead>
                                    <TableHead className="w-1/5">Loading/Discount</TableHead>
                                    <TableHead className="w-1/5">Quote Option</TableHead>
                                    <TableHead className="w-16">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {pricingConfig.retroactiveCoverage.map((entry: any) => (
                                    <TableRow key={entry.id}>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          value={entry.from}
                                          onChange={(e) => updateRetroactiveCoverageEntry(entry.id, 'from', parseFloat(e.target.value) || 0)}
                                          className="w-full"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          value={entry.to}
                                          onChange={(e) => updateRetroactiveCoverageEntry(entry.id, 'to', parseFloat(e.target.value) || 0)}
                                          className="w-full"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Select
                                          value={entry.pricingType}
                                          onValueChange={(value) => updateRetroactiveCoverageEntry(entry.id, 'pricingType', value)}
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={entry.loadingDiscount}
                                          onChange={(e) => updateRetroactiveCoverageEntry(entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                          className="w-full"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Select
                                          value={entry.quoteOption}
                                          onValueChange={(value) => updateRetroactiveCoverageEntry(entry.id, 'quoteOption', value)}
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="quote">Auto Quote</SelectItem>
                                            <SelectItem value="no-quote">No Quote</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeRetroactiveCoverageEntry(entry.id)}
                                          className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                        >
                                          Remove
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Additional Coverages Tab */}
                      {activePricingTab === "additional-coverages" && (
                        <Card className="border border-border bg-card">
                          <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <div>
                              <CardTitle>Additional Coverages</CardTitle>
                              <CardDescription>Configure additional coverage options by profession</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={addAdditionalCoveragesEntry}
                              >
                                Add Row
                              </Button>
                              <Button onClick={saveConfiguration} disabled={isSaving} size="sm">
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Additional Coverages'}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {pricingConfig.additionalCoverages.map((entry: any, index: number) => (
                                <div key={entry.id}>
                                  <div className="grid grid-cols-12 gap-4 p-4 border border-border rounded-lg bg-card">
                                    {/* First Row */}
                                    <div className="col-span-10">
                                      <Label className="text-xs font-medium mb-1.5 block">Profession</Label>
                                      <Select
                                        value={entry.profession}
                                        onValueChange={(value) => updateAdditionalCoveragesEntry(entry.id, 'profession', value)}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Consulting Services">Consulting Services</SelectItem>
                                          <SelectItem value="Legal Services">Legal Services</SelectItem>
                                          <SelectItem value="Accounting & Finance">Accounting & Finance</SelectItem>
                                          <SelectItem value="Architecture & Engineering">Architecture & Engineering</SelectItem>
                                          <SelectItem value="IT Services">IT Services</SelectItem>
                                          <SelectItem value="Medical Services">Medical Services</SelectItem>
                                          <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="col-span-2 flex items-end">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeAdditionalCoveragesEntry(entry.id)}
                                        className="w-full text-destructive hover:text-destructive border-destructive/30"
                                      >
                                        Remove
                                      </Button>
                                    </div>

                                    {/* Second Row */}
                                    <div className="col-span-6">
                                      <Label className="text-xs font-medium mb-1.5 block">Title</Label>
                                      <Input
                                        type="text"
                                        value={entry.title}
                                        onChange={(e) => updateAdditionalCoveragesEntry(entry.id, 'title', e.target.value)}
                                        className="w-full"
                                        placeholder="Coverage title"
                                      />
                                    </div>
                                    <div className="col-span-6">
                                      <Label className="text-xs font-medium mb-1.5 block">Description</Label>
                                      <Input
                                        type="text"
                                        value={entry.subtitle}
                                        onChange={(e) => updateAdditionalCoveragesEntry(entry.id, 'subtitle', e.target.value)}
                                        className="w-full"
                                        placeholder="Coverage description"
                                      />
                                    </div>

                                    {/* Third Row */}
                                    <div className="col-span-6">
                                      <Label className="text-xs font-medium mb-1.5 block">Pricing Type</Label>
                                      <Select
                                        value={entry.pricingType}
                                        onValueChange={(value) => updateAdditionalCoveragesEntry(entry.id, 'pricingType', value)}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="percentage">Percentage</SelectItem>
                                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="col-span-6">
                                      <Label className="text-xs font-medium mb-1.5 block">Value</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={entry.value}
                                        onChange={(e) => updateAdditionalCoveragesEntry(entry.id, 'value', e.target.value)}
                                        className="w-full"
                                      />
                                    </div>
                                  </div>
                                  {index < pricingConfig.additionalCoverages.length - 1 && (
                                    <div className="my-4 border-t border-border/50" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Risk Factors Tab */}
                      {activePricingTab === "risk-factors" && (
                        <Card className="h-full">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle>Risk Factors</CardTitle>
                                <CardDescription>Configure risk adjustments based on professional profile</CardDescription>
                              </div>
                              <Button onClick={saveConfiguration} disabled={isSaving} size="sm">
                                <Save className="w-4 h-4 mr-1" />
                                {isSaving ? 'Saving...' : 'Save Risk Factors'}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="space-y-6">
                              {/* Experience Loadings/Discounts */}
                              <Card className="border border-border bg-card">
                                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                  <div>
                                    <CardTitle className="text-sm">Experience Loadings/Discounts</CardTitle>
                                    <p className="text-xs text-muted-foreground">Experience in years</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addRiskFactorEntry('experienceDiscounts')}
                                    >
                                      Add Row
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-1/6">From</TableHead>
                                        <TableHead className="w-1/6">To</TableHead>
                                        <TableHead className="w-1/6">Pricing Type</TableHead>
                                        <TableHead className="w-1/6">Loading/Discount</TableHead>
                                        <TableHead className="w-1/6">Quote Option</TableHead>
                                        <TableHead className="w-1/6">Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {pricingConfig.riskFactors.experienceDiscounts.map((entry: any) => (
                                        <TableRow key={entry.id}>
                                          <TableCell>
                                            <Input
                                              type="number"
                                              value={entry.from}
                                              onChange={(e) => updateRiskFactorEntry('experienceDiscounts', entry.id, 'from', parseFloat(e.target.value) || 0)}
                                              className="w-full"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Input
                                              type="number"
                                              value={entry.to}
                                              onChange={(e) => updateRiskFactorEntry('experienceDiscounts', entry.id, 'to', parseFloat(e.target.value) || 0)}
                                              className="w-full"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Select
                                              value={entry.pricingType}
                                              onValueChange={(value) => updateRiskFactorEntry('experienceDiscounts', entry.id, 'pricingType', value)}
                                            >
                                              <SelectTrigger className="w-full">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="percentage">Percentage</SelectItem>
                                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </TableCell>
                                          <TableCell>
                                            <Input
                                              type="number"
                                              step="0.01"
                                              value={entry.loadingDiscount}
                                              onChange={(e) => updateRiskFactorEntry('experienceDiscounts', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                              className="w-full"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Select
                                              value={entry.quoteOption}
                                              onValueChange={(value) => updateRiskFactorEntry('experienceDiscounts', entry.id, 'quoteOption', value)}
                                            >
                                              <SelectTrigger className="w-full">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="quote">Auto Quote</SelectItem>
                                                <SelectItem value="no-quote">No Quote</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </TableCell>
                                          <TableCell>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeRiskFactorEntry('experienceDiscounts', entry.id)}
                                              className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                            >
                                              Remove
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>

                              {/* Employee Counts */}
                              <Card className="border border-border bg-card">
                                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                  <div>
                                    <CardTitle className="text-sm">Employee Counts</CardTitle>
                                    <p className="text-xs text-muted-foreground">Number of employees</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addRiskFactorEntry('employeeCounts')}
                                    >
                                      Add Row
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-1/6">From</TableHead>
                                        <TableHead className="w-1/6">To</TableHead>
                                        <TableHead className="w-1/6">Pricing Type</TableHead>
                                        <TableHead className="w-1/6">Loading/Discount</TableHead>
                                        <TableHead className="w-1/6">Quote Option</TableHead>
                                        <TableHead className="w-1/6">Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {pricingConfig.riskFactors.employeeCounts.map((entry: any) => (
                                        <TableRow key={entry.id}>
                                          <TableCell>
                                            <Input
                                              type="number"
                                              value={entry.from}
                                              onChange={(e) => updateRiskFactorEntry('employeeCounts', entry.id, 'from', parseFloat(e.target.value) || 0)}
                                              className="w-full"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Input
                                              type="number"
                                              value={entry.to}
                                              onChange={(e) => updateRiskFactorEntry('employeeCounts', entry.id, 'to', parseFloat(e.target.value) || 0)}
                                              className="w-full"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Select
                                              value={entry.pricingType}
                                              onValueChange={(value) => updateRiskFactorEntry('employeeCounts', entry.id, 'pricingType', value)}
                                            >
                                              <SelectTrigger className="w-full">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="percentage">Percentage</SelectItem>
                                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </TableCell>
                                          <TableCell>
                                            <Input
                                              type="number"
                                              step="0.01"
                                              value={entry.loadingDiscount}
                                              onChange={(e) => updateRiskFactorEntry('employeeCounts', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                              className="w-full"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Select
                                              value={entry.quoteOption}
                                              onValueChange={(value) => updateRiskFactorEntry('employeeCounts', entry.id, 'quoteOption', value)}
                                            >
                                              <SelectTrigger className="w-full">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="quote">Auto Quote</SelectItem>
                                                <SelectItem value="no-quote">No Quote</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </TableCell>
                                          <TableCell>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeRiskFactorEntry('employeeCounts', entry.id)}
                                              className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                            >
                                              Remove
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>

                              {/* Policy Period */}
                              <Card className="border border-border bg-card">
                                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                  <div>
                                    <CardTitle className="text-sm">Policy Period</CardTitle>
                                    <p className="text-xs text-muted-foreground">Policy period in months</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addRiskFactorEntry('policyPeriod')}
                                    >
                                      Add Row
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-1/6">From</TableHead>
                                        <TableHead className="w-1/6">To</TableHead>
                                        <TableHead className="w-1/6">Pricing Type</TableHead>
                                        <TableHead className="w-1/6">Loading/Discount</TableHead>
                                        <TableHead className="w-1/6">Quote Option</TableHead>
                                        <TableHead className="w-1/6">Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {pricingConfig.riskFactors.policyPeriod.map((entry: any) => (
                                        <TableRow key={entry.id}>
                                          <TableCell>
                                            <Input
                                              type="number"
                                              value={entry.from}
                                              onChange={(e) => updateRiskFactorEntry('policyPeriod', entry.id, 'from', parseFloat(e.target.value) || 0)}
                                              className="w-full"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Input
                                              type="number"
                                              value={entry.to}
                                              onChange={(e) => updateRiskFactorEntry('policyPeriod', entry.id, 'to', parseFloat(e.target.value) || 0)}
                                              className="w-full"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Select
                                              value={entry.pricingType}
                                              onValueChange={(value) => updateRiskFactorEntry('policyPeriod', entry.id, 'pricingType', value)}
                                            >
                                              <SelectTrigger className="w-full">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="percentage">Percentage</SelectItem>
                                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </TableCell>
                                          <TableCell>
                                            <Input
                                              type="number"
                                              step="0.01"
                                              value={entry.loadingDiscount}
                                              onChange={(e) => updateRiskFactorEntry('policyPeriod', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                              className="w-full"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Select
                                              value={entry.quoteOption}
                                              onValueChange={(value) => updateRiskFactorEntry('policyPeriod', entry.id, 'quoteOption', value)}
                                            >
                                              <SelectTrigger className="w-full">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="quote">Auto Quote</SelectItem>
                                                <SelectItem value="no-quote">No Quote</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </TableCell>
                                          <TableCell>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeRiskFactorEntry('policyPeriod', entry.id)}
                                              className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                            >
                                              Remove
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>

                              {/* Claims Based Loading/Discount */}
                              <Card className="border border-border bg-card">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm">Claims Based Loading/Discount</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-4">
                                    {/* Claim Frequency */}
                                    <div>
                                      <div className="flex items-center justify-between mb-3">
                                        <Label className="text-sm font-medium">Claim Frequency (Last 5 Years)</Label>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addRiskFactorEntry('claimFrequency')}
                                          >
                                            Add Row
                                          </Button>
                                        </div>
                                      </div>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead className="w-1/6">From</TableHead>
                                            <TableHead className="w-1/6">To</TableHead>
                                            <TableHead className="w-1/6">Pricing Type</TableHead>
                                            <TableHead className="w-1/6">Loading/Discount</TableHead>
                                            <TableHead className="w-1/6">Quote Option</TableHead>
                                            <TableHead className="w-1/6">Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {pricingConfig.riskFactors.claimFrequency.map((entry: any) => (
                                            <TableRow key={entry.id}>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  value={entry.from}
                                                  onChange={(e) => updateRiskFactorEntry('claimFrequency', entry.id, 'from', parseFloat(e.target.value) || 0)}
                                                  className="w-full"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  value={entry.to}
                                                  onChange={(e) => updateRiskFactorEntry('claimFrequency', entry.id, 'to', parseFloat(e.target.value) || 0)}
                                                  className="w-full"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Select
                                                  value={entry.pricingType}
                                                  onValueChange={(value) => updateRiskFactorEntry('claimFrequency', entry.id, 'pricingType', value)}
                                                >
                                                  <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="percentage">Percentage</SelectItem>
                                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  step="0.01"
                                                  value={entry.loadingDiscount}
                                                  onChange={(e) => updateRiskFactorEntry('claimFrequency', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                                  className="w-full"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Select
                                                  value={entry.quoteOption}
                                                  onValueChange={(value) => updateRiskFactorEntry('claimFrequency', entry.id, 'quoteOption', value)}
                                                >
                                                  <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="quote">Auto Quote</SelectItem>
                                                    <SelectItem value="no-quote">No Quote</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => removeRiskFactorEntry('claimFrequency', entry.id)}
                                                  className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                                >
                                                  Remove
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>

                                    {/* Claim Amount Categories */}
                                    <div>
                                      <div className="flex items-center justify-between mb-3">
                                        <Label className="text-sm font-medium">Claim Amount Categories</Label>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addRiskFactorEntry('claimAmountCategories')}
                                          >
                                            Add Row
                                          </Button>
                                        </div>
                                      </div>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead className="w-1/6">From (AED)</TableHead>
                                            <TableHead className="w-1/6">To (AED)</TableHead>
                                            <TableHead className="w-1/6">Pricing Type</TableHead>
                                            <TableHead className="w-1/6">Loading/Discount</TableHead>
                                            <TableHead className="w-1/6">Quote Option</TableHead>
                                            <TableHead className="w-1/6">Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {pricingConfig.riskFactors.claimAmountCategories.map((entry: any) => (
                                            <TableRow key={entry.id}>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  value={entry.from}
                                                  onChange={(e) => updateRiskFactorEntry('claimAmountCategories', entry.id, 'from', parseFloat(e.target.value) || 0)}
                                                  className="w-full"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  value={entry.to}
                                                  onChange={(e) => updateRiskFactorEntry('claimAmountCategories', entry.id, 'to', parseFloat(e.target.value) || 0)}
                                                  className="w-full"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Select
                                                  value={entry.pricingType}
                                                  onValueChange={(value) => updateRiskFactorEntry('claimAmountCategories', entry.id, 'pricingType', value)}
                                                >
                                                  <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="percentage">Percentage</SelectItem>
                                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  step="0.01"
                                                  value={entry.loadingDiscount}
                                                  onChange={(e) => updateRiskFactorEntry('claimAmountCategories', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                                  className="w-full"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Select
                                                  value={entry.quoteOption}
                                                  onValueChange={(value) => updateRiskFactorEntry('claimAmountCategories', entry.id, 'quoteOption', value)}
                                                >
                                                  <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="quote">Auto Quote</SelectItem>
                                                    <SelectItem value="no-quote">No Quote</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => removeRiskFactorEntry('claimAmountCategories', entry.id)}
                                                  className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                                >
                                                  Remove
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Policy Limits & Deductibles Tab */}
                      {activePricingTab === "limits-deductibles" && (
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle>Policy Limits & Deductibles</CardTitle>
                                <CardDescription>Configure policy limits and deductible adjustments</CardDescription>
                              </div>
                              <Button onClick={saveConfiguration} disabled={isSaving} size="sm">
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Limits & Deductibles'}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {!pricingConfig.limits?.minimumPremium && (
                              <div className="rounded-md border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 mb-6">
                                <p className="font-medium">Yet to configure this section</p>
                                <p className="text-sm mt-1">Configure policy limits below.</p>
                              </div>
                            )}

                            {/* Policy Limits */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold">Policy Limits</h3>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Limit Type</TableHead>
                                    <TableHead>Value</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow>
                                    <TableCell className="font-medium">Maximum Cover (AED)</TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        value={pricingConfig.limits.maximumCover}
                                        onChange={(e) => updateLimits('maximumCover', Number(e.target.value))}
                                        className="max-w-xs"
                                      />
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell className="font-medium">Minimum Premium (AED)</TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        value={pricingConfig.limits.minimumPremium}
                                        onChange={(e) => updateLimits('minimumPremium', Number(e.target.value))}
                                        className="max-w-xs"
                                      />
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell className="font-medium">Base Broker Commission (%)</TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        value={pricingConfig.limits.baseBrokerCommission}
                                        onChange={(e) => updateLimits('baseBrokerCommission', Number(e.target.value))}
                                        className="max-w-xs"
                                      />
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell className="font-medium">Maximum Broker Commission (%)</TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        value={pricingConfig.limits.maximumBrokerCommission}
                                        onChange={(e) => updateLimits('maximumBrokerCommission', Number(e.target.value))}
                                        className="max-w-xs"
                                      />
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell className="font-medium">Minimum Broker Commission (%)</TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        value={pricingConfig.limits.minimumBrokerCommission}
                                        onChange={(e) => updateLimits('minimumBrokerCommission', Number(e.target.value))}
                                        className="max-w-xs"
                                      />
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>

                            {/* Deductibles */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Deductibles</h3>
                                <Button onClick={() => addCoverRequirementEntry('deductibles')} size="sm" variant="outline">
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add Deductible
                                </Button>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Deductible Value (AED)</TableHead>
                                    <TableHead>Quote Option</TableHead>
                                    <TableHead>Loading/Discount (%)</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {pricingConfig.coverRequirements.deductibles.map((deductible) => (
                                    <TableRow key={deductible.id}>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          value={deductible.value}
                                          onChange={(e) => updateCoverRequirementEntry('deductibles', deductible.id, 'value', e.target.value)}
                                          className="w-40"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Select
                                          value={deductible.quoteOption}
                                          onValueChange={(value) => updateCoverRequirementEntry('deductibles', deductible.id, 'quoteOption', value)}
                                        >
                                          <SelectTrigger className="w-[150px]">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="quote">Quote</SelectItem>
                                            <SelectItem value="no-quote">No Quote</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          value={deductible.loadingDiscount}
                                          onChange={(e) => updateCoverRequirementEntry('deductibles', deductible.id, 'loadingDiscount', e.target.value)}
                                          className="w-32"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeCoverRequirementEntry('deductibles', deductible.id)}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Fee Types Tab */}
                      {activePricingTab === "fee-types" && (
                        <Card className="border border-border bg-card">
                          <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <div>
                              <CardTitle>Fee Types</CardTitle>
                              <CardDescription>Configure fee types and their values (VAT, GST, etc.)</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={addFeeTypeEntry}
                              >
                                Add Row
                              </Button>
                              <Button onClick={saveConfiguration} disabled={isSaving} size="sm">
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Fee Types'}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-1/4">Label</TableHead>
                                  <TableHead className="w-1/4">Pricing Type</TableHead>
                                  <TableHead className="w-1/4">Value</TableHead>
                                  <TableHead className="w-1/4">Status</TableHead>
                                  <TableHead className="w-16">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pricingConfig.feeTypes.map((fee: any) => (
                                  <TableRow key={fee.id}>
                                    <TableCell>
                                      <Input
                                        type="text"
                                        value={fee.label}
                                        onChange={(e) => updateFeeTypeEntry(fee.id, 'label', e.target.value)}
                                        className="w-full"
                                        placeholder="Enter fee type name"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={fee.pricingType}
                                        onValueChange={(value) => updateFeeTypeEntry(fee.id, 'pricingType', value)}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="percentage">Percentage</SelectItem>
                                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          step={fee.pricingType === "percentage" ? "0.01" : "1"}
                                          value={fee.value}
                                          onChange={(e) => updateFeeTypeEntry(fee.id, 'value', e.target.value)}
                                          className="w-32"
                                        />
                                        <span className="text-sm text-muted-foreground">
                                          {fee.pricingType === "percentage" ? "%" : "AED"}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={fee.status}
                                        onValueChange={(value) => updateFeeTypeEntry(fee.id, 'status', value)}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="active">Active</SelectItem>
                                          <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFeeTypeEntry(fee.id)}
                                        className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                        disabled={pricingConfig.feeTypes.length === 1}
                                      >
                                        Remove
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wording Configurations Tab */}
            <TabsContent value="wording" className="space-y-6">
              {/* Header Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">Policy Wording Documents</h2>
                  <p className="text-muted-foreground">Upload and manage policy wording documents</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button className="gap-2" onClick={saveConfiguration}>
                    <Save className="w-4 h-4" />
                    Save Configuration
                  </Button>
                  <Button variant="outline" onClick={openUploadDialog} className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Document
                  </Button>
                </div>
              </div>

              {!policyWordings?.length && !isLoading && (
                <div className="rounded-md border border-primary/20 bg-primary/5 text-primary px-4 py-3 mb-4">
                  <p className="font-medium">Yet to configure this section</p>
                  <p className="text-sm mt-1">Upload policy wording documents using the button above.</p>
                </div>
              )}

              {/* Uploaded Policy Wordings Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Uploaded Policy Wordings</h3>

                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-6 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
                            <div className="space-y-2">
                              <div className="w-48 h-5 bg-gray-200 rounded animate-pulse" />
                              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                            </div>
                          </div>
                          <div className="w-20 h-6 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {policyWordings.map((wording, index) => (
                      <div key={index} className="p-6 border rounded-lg bg-card">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">{wording.label}</h4>
                              <p className="text-sm text-muted-foreground">
                                {wording.is_active ? 'Active' : 'Inactive'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {wording.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <Switch
                                checked={wording.is_active}
                                onCheckedChange={(checked) => {
                                  handleToggleWordingActive(wording, checked);
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" className="gap-1">
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => openEditDialog(wording)} className="gap-1">
                                <Edit className="w-4 h-4" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                onClick={() => handleDeleteWording(wording)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload/Edit Wording Dialog */}
              <Dialog open={isWordingUploadDialogOpen} onOpenChange={setIsWordingUploadDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                      {editingWording ? 'Edit Policy Wording' : 'Upload Policy Wording'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingWording ? 'Update the policy wording document details.' : 'Upload a new policy wording document for customers to download.'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {/* Document Title */}
                    <div className="space-y-2">
                      <Label htmlFor="wording-title" className="text-sm font-medium">
                        Document Title *
                      </Label>
                      <Input
                        id="wording-title"
                        value={wordingUploadTitle}
                        onChange={(e) => setWordingUploadTitle(e.target.value)}
                        placeholder="e.g., Professional Indemnity Policy Wording v2.1"
                        className="h-10"
                      />
                    </div>

                    {/* File Upload */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Document File *
                      </Label>

                      {/* File Input Area */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <div className="space-y-4">
                          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Upload className="w-6 h-6 text-primary" />
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                              {isUploadingFile
                                ? 'Uploading file...'
                                : wordingUploadFile
                                  ? 'File uploaded successfully'
                                  : 'Choose a PDF file to upload'
                              }
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('wording-file')?.click()}
                              disabled={isUploadingFile}
                              className="gap-2"
                            >
                              {isUploadingFile ? (
                                <>
                                  <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></span>
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  Choose File
                                </>
                              )}
                            </Button>
                          </div>

                          <Input
                            id="wording-file"
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                          />

                          <p className="text-xs text-gray-500">
                            PDF files only, max 10MB
                          </p>
                        </div>
                      </div>

                      {/* Selected File Display */}
                      {wordingUploadFile && (
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-green-50 border-green-200">
                          <FileText className="w-5 h-5 flex-shrink-0 text-green-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-green-800">
                              {wordingUploadFile.name}
                            </p>
                            <p className="text-xs text-green-600">
                              {`${(wordingUploadFile.size / 1024).toFixed(1)} KB • Uploaded`}
                            </p>
                          </div>
                          {!isUploadingFile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setWordingUploadFile(null);
                                const fileInput = document.getElementById('wording-file') as HTMLInputElement;
                                if (fileInput) fileInput.value = '';
                              }}
                              className="flex-shrink-0 text-green-600 hover:text-green-800"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="wording-active"
                        checked={wordingUploadActive}
                        onCheckedChange={setWordingUploadActive}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="wording-active" className="text-sm font-medium cursor-pointer">
                          Active Document
                        </Label>
                        <p className="text-xs text-gray-600">
                          When active, this document will be available for customers to download
                        </p>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsWordingUploadDialogOpen(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSavePolicyWording}
                      disabled={!wordingUploadTitle || (!editingWording && !wordingUploadFile) || isSaving || isUploadingFile}
                      className="min-w-[120px]"
                    >
                      {isSaving ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Saving…
                        </span>
                      ) : isUploadingFile ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Uploading File…
                        </span>
                      ) : (
                        editingWording ? 'Update Wording' : 'Save Wording'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Quote Format Tab */}
            <TabsContent value="quote-format" className="space-y-6">
              {!quoteConfig?.header?.companyName && !isLoading && (
                <div className="rounded-md border border-primary/20 bg-primary/5 text-primary px-4 py-3 mb-4">
                  <p className="font-medium">Yet to configure this section</p>
                  <p className="text-sm mt-1">Configure quote format settings, header, footer, and content sections below.</p>
                </div>
              )}

              {isLoading && (
                <div className="space-y-6">
                  <div className="p-4 border rounded-md space-y-4">
                    <div className="w-56 h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="h-10 bg-gray-200 rounded animate-pulse" />
                      <div className="h-10 bg-gray-200 rounded animate-pulse" />
                      <div className="h-10 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="p-4 border rounded-md space-y-4">
                    <div className="w-56 h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              )}

              {!isLoading && (
                <>
                  {/* Header Configuration */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Image className="w-5 h-5" />
                            Header Configuration
                          </CardTitle>
                          <CardDescription>Configure quote header with logo and company information</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            Preview Template
                          </Button>
                          <Button onClick={saveConfiguration} size="sm" disabled={isSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save Quote Format'}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company-name">Company Name</Label>
                          <Input
                            id="company-name"
                            name="company_name"
                            autoComplete="organization"
                            value={quoteConfig.header.companyName}
                            onChange={(e) => updateQuoteConfig('header', 'companyName', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quote-prefix">Quotation Number Prefix</Label>
                          <Input
                            id="quote-prefix"
                            name="quotation_prefix"
                            autoComplete="off"
                            value={quoteConfig.details.quotePrefix}
                            onChange={(e) => updateQuoteConfig('details', 'quotePrefix', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="logo-upload">Company Logo</Label>
                          <div className="flex gap-2">
                            <Input
                              id="logo-upload"
                              name="logo"
                              type="file"
                              accept="image/*"
                              disabled={false}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('logo-upload')?.click()}
                            >
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
                            name="company_address"
                            autoComplete="street-address"
                            value={quoteConfig.header.companyAddress}
                            onChange={(e) => updateQuoteConfig('header', 'companyAddress', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact-info">Contact Information</Label>
                          <Textarea
                            id="contact-info"
                            name="contact_info"
                            autoComplete="on"
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
                            name="header_bg_color"
                            type="color"
                            value={quoteConfig.header.headerColor}
                            onChange={(e) => updateQuoteConfig('header', 'headerColor', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="header-text-color">Header Text Color</Label>
                          <Input
                            id="header-text-color"
                            name="header_text_color"
                            type="color"
                            value={quoteConfig.header.headerTextColor}
                            onChange={(e) => updateQuoteConfig('header', 'headerTextColor', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="logo-position">Logo Position</Label>
                          <Select
                            name="logo_position"
                            value={quoteConfig.header.logoPosition}
                            onValueChange={(value) => updateQuoteConfig('header', 'logoPosition', value)}
                          >
                            <SelectTrigger id="logo-position" aria-label="Logo Position">
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
                          <Checkbox
                            id="show-project-details"
                            checked={quoteConfig.risk.showProjectDetails}
                            onCheckedChange={(checked) => updateQuoteConfig('risk', 'showProjectDetails', checked)}
                          />
                          <Label htmlFor="show-project-details">Show Project Details (Name, Location, Duration)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show-coverage-types"
                            checked={quoteConfig.risk.showCoverageTypes}
                            onCheckedChange={(checked) => updateQuoteConfig('risk', 'showCoverageTypes', checked)}
                          />
                          <Label htmlFor="show-coverage-types">Show Coverage Types</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show-coverage-limits"
                            checked={quoteConfig.risk.showCoverageLimits}
                            onCheckedChange={(checked) => updateQuoteConfig('risk', 'showCoverageLimits', checked)}
                          />
                          <Label htmlFor="show-coverage-limits">Show Coverage Limits</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show-deductibles"
                            checked={quoteConfig.risk.showDeductibles}
                            onCheckedChange={(checked) => updateQuoteConfig('risk', 'showDeductibles', checked)}
                          />
                          <Label htmlFor="show-deductibles">Show Deductibles</Label>
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
                            <SelectTrigger id="currency" aria-label="Currency">
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
                          <Checkbox
                            id="show-base-premium"
                            checked={quoteConfig.premium.showBasePremium}
                            onCheckedChange={(checked) => updateQuoteConfig('premium', 'showBasePremium', checked)}
                          />
                          <Label htmlFor="show-base-premium">Show Base Premium</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show-risk-adjustments"
                            checked={quoteConfig.premium.showRiskAdjustments}
                            onCheckedChange={(checked) => updateQuoteConfig('premium', 'showRiskAdjustments', checked)}
                          />
                          <Label htmlFor="show-risk-adjustments">Show Risk Adjustments</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show-fees"
                            checked={quoteConfig.premium.showFees}
                            onCheckedChange={(checked) => updateQuoteConfig('premium', 'showFees', checked)}
                          />
                          <Label htmlFor="show-fees">Show Fees & Charges</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show-taxes"
                            checked={quoteConfig.premium.showTaxes}
                            onCheckedChange={(checked) => updateQuoteConfig('premium', 'showTaxes', checked)}
                          />
                          <Label htmlFor="show-taxes">Show Taxes (VAT)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show-total-premium"
                            checked={quoteConfig.premium.showTotalPremium}
                            onCheckedChange={(checked) => updateQuoteConfig('premium', 'showTotalPremium', checked)}
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
                      <CardDescription>Configure policy conditions display</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show-policy-conditions"
                            checked={quoteConfig.terms.showPolicyConditions}
                            onCheckedChange={(checked) => updateQuoteConfig('terms', 'showPolicyConditions', checked)}
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
                        <Checkbox
                          id="show-signature-block"
                          checked={quoteConfig.signature.showSignatureBlock}
                          onCheckedChange={(checked) => updateQuoteConfig('signature', 'showSignatureBlock', checked)}
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
                          <Checkbox
                            id="show-footer"
                            checked={quoteConfig.footer.showFooter}
                            onCheckedChange={(checked) => updateQuoteConfig('footer', 'showFooter', checked)}
                          />
                          <Label htmlFor="show-footer">Show Footer</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show-disclaimer"
                            checked={quoteConfig.footer.showDisclaimer}
                            onCheckedChange={(checked) => updateQuoteConfig('footer', 'showDisclaimer', checked)}
                          />
                          <Label htmlFor="show-disclaimer">Show General Disclaimer</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="footer-text">Footer Text</Label>
                        <Textarea
                          id="footer-text"
                          value={quoteConfig.footer.footerText}
                          onChange={(e) => updateQuoteConfig('footer', 'footerText', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="disclaimer-text">Disclaimer Text</Label>
                        <Textarea
                          id="disclaimer-text"
                          value={quoteConfig.footer.disclaimerText}
                          onChange={(e) => updateQuoteConfig('footer', 'disclaimerText', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Required Documents Tab */}
            <TabsContent value="required-documents" className="space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 border rounded-md">
                      <div className="w-56 h-5 bg-gray-200 rounded animate-pulse mb-3" />
                      <div className="h-10 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Documents required for policy to be issued */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Documents required for policy to be issued
                          </CardTitle>
                          <CardDescription>
                            Manage document types required for policy issuance
                          </CardDescription>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="gap-2">
                              <Plus className="w-4 h-4" />
                              Add New
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[525px]">
                            <DialogHeader>
                              <DialogTitle>Add New Document Type</DialogTitle>
                              <DialogDescription>
                                Create a new document type for policy issuance
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="doc-label">Display Label *</Label>
                                <Input
                                  id="doc-label"
                                  value={newDocument.label}
                                  onChange={(e) => setNewDocument({ ...newDocument, label: e.target.value })}
                                  placeholder="e.g., Business Registration Certificate"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="doc-description">Description</Label>
                                <Input
                                  id="doc-description"
                                  value={newDocument.description || ""}
                                  onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                                  placeholder="e.g., Valid business license or registration certificate"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="doc-template">Template (Optional)</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    id="doc-template"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    className="hidden"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('doc-template')?.click()}
                                    className="w-full"
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {newDocument.template ? "Change Template" : "Upload Template"}
                                  </Button>
                                </div>
                                {newDocument.template && (
                                  <div className="flex items-center justify-between bg-muted p-2 rounded">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4" />
                                      <span className="text-sm">{newDocument.template.name}</span>
                                      <span className="text-xs text-muted-foreground">({newDocument.template.size})</span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setNewDocument({ ...newDocument, template: null })}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="doc-required"
                                  checked={newDocument.required || false}
                                  onCheckedChange={(checked) => setNewDocument({ ...newDocument, required: checked })}
                                />
                                <Label htmlFor="doc-required">Required Document</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="doc-active"
                                  checked={newDocument.active}
                                  onCheckedChange={(checked) => setNewDocument({ ...newDocument, active: checked })}
                                />
                                <Label htmlFor="doc-active">Active</Label>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={() => {
                                const newDoc = {
                                  id: Math.max(...requiredDocuments.map(d => d.id)) + 1,
                                  label: newDocument.label,
                                  description: newDocument.description || "",
                                  required: newDocument.required,
                                  active: newDocument.active,
                                  order: Math.max(...requiredDocuments.map(d => d.order)) + 1,
                                  template: newDocument.template
                                };
                                setRequiredDocuments([...requiredDocuments, newDoc]);
                                setNewDocument({ label: "", description: "", required: false, active: true, template: null });
                                toast({ title: 'Document added', description: 'Required document created successfully.' });
                              }}>
                                Add Document
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Display Label</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-center">
                              <div className="flex justify-center">Required</div>
                            </TableHead>
                            <TableHead className="text-center">Template</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {requiredDocuments
                            .sort((a, b) => a.order - b.order)
                            .map((doc) => (
                              <TableRow key={doc.id}>
                                <TableCell className="font-medium">{doc.order}</TableCell>
                                <TableCell>{doc.label}</TableCell>
                                <TableCell className="max-w-xs truncate">{doc.description}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center">
                                    <Badge variant={doc.required ? "default" : "secondary"}>
                                      {doc.required ? "Required" : "Optional"}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {doc.template ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <FileText className="w-4 h-4" />
                                      <span className="text-sm">{doc.template.name}</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">No template</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={doc.active ? "default" : "secondary"}>
                                    {doc.active ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updatedDocs = requiredDocuments.map(d =>
                                          d.id === doc.id ? { ...d, active: !d.active } : d
                                        );
                                        setRequiredDocuments(updatedDocs);
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updatedDocs = requiredDocuments.filter(d => d.id !== doc.id);
                                        setRequiredDocuments(updatedDocs);
                                        toast({ title: 'Document deleted', description: 'Required document removed successfully.' });
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                            )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PIProductConfig;


