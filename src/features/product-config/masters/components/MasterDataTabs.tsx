import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Trash2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import TableSkeleton from "@/components/loaders/TableSkeleton";

export type MasterDataTabsProps = {
  activePricingTab: string;
  activeConstructionTypes: any[];
  activeCountries: any[];
  ratingConfig: any;
  onSave: () => void;
  markAsChanged: () => void;
  setRatingConfig: (updater: (prev: any) => any) => void;
  isLoadingClauseMetadata: boolean;
  clauseMetadataError: string | null;
  clauseMetadata: any[];
  isLoadingClausePricing: boolean;
  clausePricingError: string | null;
  clausePricingData: any;
  isSavingClausePricing: boolean;
  handleSaveClausePricing: () => void;
  // Master Data props
  constructionTypesData: any[];
  isLoadingConstructionTypes: boolean;
  constructionTypesError: string | null;
  roleTypesData: any[];
  isLoadingRoleTypes: boolean;
  roleTypesError: string | null;
  contractTypesData: any[];
  isLoadingContractTypes: boolean;
  contractTypesError: string | null;
  soilTypesData: any[];
  isLoadingSoilTypes: boolean;
  soilTypesError: string | null;
  subcontractorTypesData: any[];
  isLoadingSubcontractorTypes: boolean;
  subcontractorTypesError: string | null;
  consultantRolesData: any[];
  isLoadingConsultantRoles: boolean;
  consultantRolesError: string | null;
  securityTypesData: any[];
  isLoadingSecurityTypes: boolean;
  securityTypesError: string | null;
  areaTypesData: any[];
  isLoadingAreaTypes: boolean;
  areaTypesError: string | null;
  // Quote Config Location Data props
  countriesData: string[];
  isLoadingCountries: boolean;
  countriesError: string | null;
  regionsData: string[];
  isLoadingRegions: boolean;
  regionsError: string | null;
  zonesData: string[];
  isLoadingZones: boolean;
  zonesError: string | null;
  // Construction Types Configuration props
  constructionTypesConfigData: any[];
  isLoadingConstructionTypesConfig: boolean;
  constructionTypesConfigError: string | null;
  isSavingConstructionTypesConfig: boolean;
  handleSaveConstructionTypesConfiguration: (formData: {[key: string]: any}) => Promise<void>;
  // Countries Configuration props
  countriesConfigData: any[];
  isLoadingCountriesConfig: boolean;
  countriesConfigError: string | null;
  isSavingCountriesConfig: boolean;
  handleSaveCountriesConfiguration: (formData: {[key: string]: any}) => Promise<void>;
  // Regions Configuration props
  regionsConfigData: any[];
  isLoadingRegionsConfig: boolean;
  regionsConfigError: string | null;
  isSavingRegionsConfig: boolean;
  handleSaveRegionsConfiguration: (formData: {[key: string]: any}) => Promise<void>;
  // Zones Configuration props
  zonesConfigData: any[];
  isLoadingZonesConfig: boolean;
  zonesConfigError: string | null;
  isSavingZonesConfig: boolean;
  handleSaveZonesConfiguration: (formData: {[key: string]: any}) => Promise<void>;
  // Contract Types Configuration props
  contractTypesConfigData: any[];
  isLoadingContractTypesConfig: boolean;
  contractTypesConfigError: string | null;
  isSavingContractTypesConfig: boolean;
  handleSaveContractTypesConfiguration: (formData: {[key: string]: any}) => Promise<void>;
  // Role Types Configuration props
  roleTypesConfigData: any[];
  isLoadingRoleTypesConfig: boolean;
  roleTypesConfigError: string | null;
  isSavingRoleTypesConfig: boolean;
  handleSaveRoleTypesConfiguration: (formData: {[key: string]: any}) => Promise<void>;
  // Soil Types Configuration props
  soilTypesConfigData: any[];
  isLoadingSoilTypesConfig: boolean;
  soilTypesConfigError: string | null;
  isSavingSoilTypesConfig: boolean;
  handleSaveSoilTypesConfiguration: (formData: {[key: string]: any}) => Promise<void>;
  // Subcontractor Types Configuration props
  subcontractorTypesConfigData: any[];
  isLoadingSubcontractorTypesConfig: boolean;
  subcontractorTypesConfigError: string | null;
  isSavingSubcontractorTypesConfig: boolean;
  handleSaveSubcontractorTypesConfiguration: (formData: {[key: string]: any}) => Promise<void>;

  // Consultant Roles Configuration props
  consultantRolesConfigData: any[];
  isLoadingConsultantRolesConfig: boolean;
  consultantRolesConfigError: string | null;
  isSavingConsultantRolesConfig: boolean;
  handleSaveConsultantRolesConfiguration: (formData: {[key: string]: any}) => Promise<void>;

  // Security Types Configuration props
  securityTypesConfigData: any[];
  isLoadingSecurityTypesConfig: boolean;
  securityTypesConfigError: string | null;
  isSavingSecurityTypesConfig: boolean;
  handleSaveSecurityTypesConfiguration: (formData: {[key: string]: any}) => Promise<void>;

  // Area Types Configuration props
  areaTypesConfigData: any[];
  isLoadingAreaTypesConfig: boolean;
  areaTypesConfigError: string | null;
  isSavingAreaTypesConfig: boolean;
  handleSaveAreaTypesConfiguration: (formData: {[key: string]: any}) => Promise<void>;
};

const MasterDataTabs: React.FC<MasterDataTabsProps> = ({
  activePricingTab,
  activeConstructionTypes,
  activeCountries,
  ratingConfig,
  onSave,
  markAsChanged,
  setRatingConfig,
  isLoadingClauseMetadata,
  clauseMetadataError,
  clauseMetadata,
  isLoadingClausePricing,
  clausePricingError,
  clausePricingData,
  isSavingClausePricing,
  handleSaveClausePricing,
  // Master Data props
  constructionTypesData,
  isLoadingConstructionTypes,
  constructionTypesError,
  roleTypesData,
  isLoadingRoleTypes,
  roleTypesError,
  contractTypesData,
  isLoadingContractTypes,
  contractTypesError,
  soilTypesData,
  isLoadingSoilTypes,
  soilTypesError,
  subcontractorTypesData,
  isLoadingSubcontractorTypes,
  subcontractorTypesError,
  consultantRolesData,
  isLoadingConsultantRoles,
  consultantRolesError,
  securityTypesData,
  isLoadingSecurityTypes,
  securityTypesError,
  areaTypesData,
  isLoadingAreaTypes,
  areaTypesError,
  // Quote Config Location Data props
  countriesData,
  isLoadingCountries,
  countriesError,
  regionsData,
  isLoadingRegions,
  regionsError,
  zonesData,
  isLoadingZones,
  zonesError,
  // Construction Types Configuration props
  constructionTypesConfigData,
  isLoadingConstructionTypesConfig,
  constructionTypesConfigError,
  isSavingConstructionTypesConfig,
  handleSaveConstructionTypesConfiguration,
  // Countries Configuration props
  countriesConfigData,
  isLoadingCountriesConfig,
  countriesConfigError,
  isSavingCountriesConfig,
  handleSaveCountriesConfiguration,
  // Regions Configuration props
  regionsConfigData,
  isLoadingRegionsConfig,
  regionsConfigError,
  isSavingRegionsConfig,
  handleSaveRegionsConfiguration,
  // Zones Configuration props
  zonesConfigData,
  isLoadingZonesConfig,
  zonesConfigError,
  isSavingZonesConfig,
  handleSaveZonesConfiguration,
  // Contract Types Configuration props
  contractTypesConfigData,
  isLoadingContractTypesConfig,
  contractTypesConfigError,
  isSavingContractTypesConfig,
  handleSaveContractTypesConfiguration,
  // Role Types Configuration props
  roleTypesConfigData,
  isLoadingRoleTypesConfig,
  roleTypesConfigError,
  isSavingRoleTypesConfig,
  handleSaveRoleTypesConfiguration,
  // Soil Types Configuration props
  soilTypesConfigData,
  isLoadingSoilTypesConfig,
  soilTypesConfigError,
  isSavingSoilTypesConfig,
  handleSaveSoilTypesConfiguration,
  // Subcontractor Types Configuration props
  subcontractorTypesConfigData,
  isLoadingSubcontractorTypesConfig,
  subcontractorTypesConfigError,
  isSavingSubcontractorTypesConfig,
  handleSaveSubcontractorTypesConfiguration,

  // Consultant Roles Configuration props
  consultantRolesConfigData,
  isLoadingConsultantRolesConfig,
  consultantRolesConfigError,
  isSavingConsultantRolesConfig,
  handleSaveConsultantRolesConfiguration,

  // Security Types Configuration props
  securityTypesConfigData,
  isLoadingSecurityTypesConfig,
  securityTypesConfigError,
  isSavingSecurityTypesConfig,
  handleSaveSecurityTypesConfiguration,

  // Area Types Configuration props
  areaTypesConfigData,
  isLoadingAreaTypesConfig,
  areaTypesConfigError,
  isSavingAreaTypesConfig,
  handleSaveAreaTypesConfiguration,
}) => {
  // Simple state for Construction Types form values - direct approach
  const [constructionTypesFormData, setConstructionTypesFormData] = useState<{[key: string]: any}>({});
  
  // Simple state for Countries form values - direct approach
  const [countriesFormData, setCountriesFormData] = useState<{[key: string]: any}>({});
  
  // Simple state for Regions form values - direct approach
  const [regionsFormData, setRegionsFormData] = useState<{[key: string]: any}>({});
  
  // Simple state for Zones form values - direct approach
  const [zonesFormData, setZonesFormData] = useState<{[key: string]: any}>({});
  
  // Simple state for Contract Types form values - direct approach
  const [contractTypesFormData, setContractTypesFormData] = useState<{[key: string]: any}>({});
  
  // Simple state for Role Types form values - direct approach
  const [roleTypesFormData, setRoleTypesFormData] = useState<{[key: string]: any}>({});
  
  // Simple state for Soil Types form values - direct approach
  const [soilTypesFormData, setSoilTypesFormData] = useState<{[key: string]: any}>({});
  
  // Simple state for Subcontractor Types form values - direct approach
  const [subcontractorTypesFormData, setSubcontractorTypesFormData] = useState<{[key: string]: any}>({});
  
  // Simple state for Consultant Roles form values - direct approach
  const [consultantRolesFormData, setConsultantRolesFormData] = useState<{[key: string]: any}>({});

  // Simple state for Security Types form values - direct approach
  const [securityTypesFormData, setSecurityTypesFormData] = useState<{[key: string]: any}>({});

  // Simple state for Area Types form values - direct approach
  const [areaTypesFormData, setAreaTypesFormData] = useState<{[key: string]: any}>({});

  // Clause Pricing state - moved to top level to avoid conditional hooks
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());
  const [clauseRows, setClauseRows] = useState<{[key: number]: any[]}>({});
  const [activeToggles, setActiveToggles] = useState<{[key: number]: boolean}>({});

  // Simple effect to populate form data when API data is available
  useEffect(() => {
    console.log('🔍 Construction Types Effect Triggered:', {
      activePricingTab,
      hasConfigData: !!constructionTypesConfigData,
      configDataLength: constructionTypesConfigData?.length,
      configData: constructionTypesConfigData
    });

    if (activePricingTab === "construction-types" && constructionTypesConfigData && constructionTypesConfigData.length > 0) {
      console.log('✅ Populating Construction Types form data...');
      const formData: {[key: string]: any} = {};
      
      // Simple direct mapping
      constructionTypesConfigData.forEach((configItem: any) => {
        console.log('📝 Processing config item:', configItem);
        formData[configItem.name] = {
          pricingType: configItem.pricing_type === 'FIXED_RATE' ? 'fixed' : 'percentage',
          value: String(configItem.value || 0),
          quoteOption: configItem.quote_option === 'NO_QUOTE' ? 'no-quote' : 'quote'
        };
      });
      
      setConstructionTypesFormData(formData);
      console.log('✅ Form data populated:', formData);
    }
  }, [activePricingTab, constructionTypesConfigData]);

  // Simple effect to populate countries form data when API data is available
  useEffect(() => {
    console.log('🔍 Countries Effect Triggered:', {
      activePricingTab,
      hasConfigData: !!countriesConfigData,
      configDataLength: countriesConfigData?.length,
      configData: countriesConfigData
    });

    if (activePricingTab === "countries" && countriesConfigData && countriesConfigData.length > 0) {
      console.log('✅ Populating Countries form data...');
      const formData: {[key: string]: any} = {};
      
      // Simple direct mapping - handle both 'country' and 'name' fields
      countriesConfigData.forEach((configItem: any) => {
        console.log('📝 Processing config item:', configItem);
        const countryName = configItem.country || configItem.name;
        if (countryName) {
          formData[countryName] = {
            pricingType: configItem.pricing_type === 'FIXED_RATE' ? 'fixed' : 'percentage',
            value: String(configItem.value || 0),
            quoteOption: configItem.quote_option === 'NO_QUOTE' ? 'no-quote' : 'quote'
          };
        }
      });
      
      setCountriesFormData(formData);
      console.log('✅ Countries form data populated:', formData);
    }
  }, [activePricingTab, countriesConfigData]);

  // Simple effect to populate regions form data when API data is available
  useEffect(() => {
    console.log('🔍 Regions Effect Triggered:', {
      activePricingTab,
      hasConfigData: !!regionsConfigData,
      configDataLength: regionsConfigData?.length,
      configData: regionsConfigData
    });

    if (activePricingTab === "regions" && regionsConfigData && regionsConfigData.length > 0) {
      console.log('✅ Populating Regions form data...');
      const formData: {[key: string]: any} = {};
      
      // Simple direct mapping using name field
      regionsConfigData.forEach((configItem: any) => {
        console.log('📝 Processing config item:', configItem);
        const regionName = configItem.name;
        if (regionName) {
          formData[regionName] = {
            pricingType: configItem.pricing_type === 'FIXED_RATE' ? 'fixed' : 'percentage',
            value: String(configItem.value || 0),
            quoteOption: configItem.quote_option === 'NO_QUOTE' ? 'no-quote' : 'quote'
          };
        }
      });
      
      setRegionsFormData(formData);
      console.log('✅ Regions form data populated:', formData);
    }
  }, [activePricingTab, regionsConfigData]);

  // Simple effect to populate zones form data when API data is available
  useEffect(() => {
    console.log('🔍 Zones Effect Triggered:', {
      activePricingTab,
      hasConfigData: !!zonesConfigData,
      configDataLength: zonesConfigData?.length,
      configData: zonesConfigData
    });

    if (activePricingTab === "zones" && zonesConfigData && zonesConfigData.length > 0) {
      console.log('✅ Populating Zones form data...');
      const formData: {[key: string]: any} = {};
      
      // Simple direct mapping using name field
      zonesConfigData.forEach((configItem: any) => {
        console.log('📝 Processing config item:', configItem);
        const zoneName = configItem.name;
        if (zoneName) {
          formData[zoneName] = {
            pricingType: configItem.pricing_type === 'FIXED_RATE' ? 'fixed' : 'percentage',
            value: String(configItem.value || 0),
            quoteOption: configItem.quote_option === 'NO_QUOTE' ? 'no-quote' : 'quote'
          };
        }
      });
      
      setZonesFormData(formData);
      console.log('✅ Zones form data populated:', formData);
    }
  }, [activePricingTab, zonesConfigData]);

  // Simple effect to populate contract types form data when API data is available
  useEffect(() => {
    console.log('🔍 Contract Types Effect Triggered:', {
      activePricingTab,
      hasConfigData: !!contractTypesConfigData,
      configDataLength: contractTypesConfigData?.length,
      configData: contractTypesConfigData
    });

    if (activePricingTab === "contract-types" && contractTypesConfigData && contractTypesConfigData.length > 0) {
      console.log('✅ Populating Contract Types form data...');
      const formData: {[key: string]: any} = {};
      
      // Simple direct mapping using name field
      contractTypesConfigData.forEach((configItem: any) => {
        console.log('📝 Processing config item:', configItem);
        const contractTypeName = configItem.name;
        if (contractTypeName) {
          formData[contractTypeName] = {
            pricingType: configItem.pricing_type === 'FIXED_RATE' ? 'fixed' : 'percentage',
            value: String(configItem.value || 0),
            quoteOption: configItem.quote_option === 'NO_QUOTE' ? 'no-quote' : 'quote'
          };
        }
      });
      
      setContractTypesFormData(formData);
      console.log('✅ Contract Types form data populated:', formData);
    }
  }, [activePricingTab, contractTypesConfigData]);

  // Simple effect to populate role types form data when API data is available
  useEffect(() => {
    console.log('🔍 Role Types Effect Triggered:', {
      activePricingTab,
      hasConfigData: !!roleTypesConfigData,
      configDataLength: roleTypesConfigData?.length,
      configData: roleTypesConfigData
    });

    if (activePricingTab === "role-types" && roleTypesConfigData && roleTypesConfigData.length > 0) {
      console.log('✅ Populating Role Types form data...');
      const formData: {[key: string]: any} = {};
      
      // Simple direct mapping using name field
      roleTypesConfigData.forEach((configItem: any) => {
        console.log('📝 Processing config item:', configItem);
        const roleTypeName = configItem.name;
        if (roleTypeName) {
          formData[roleTypeName] = {
            pricingType: configItem.pricing_type === 'FIXED_RATE' ? 'fixed' : 'percentage',
            value: String(configItem.value || 0),
            quoteOption: configItem.quote_option === 'NO_QUOTE' ? 'no-quote' : 'quote'
          };
        }
      });
      
      setRoleTypesFormData(formData);
      console.log('✅ Role Types form data populated:', formData);
    }
  }, [activePricingTab, roleTypesConfigData]);

  // Simple effect to populate soil types form data when API data is available
  useEffect(() => {
    console.log('🔍 Soil Types Effect Triggered:', {
      activePricingTab,
      hasConfigData: !!soilTypesConfigData,
      configDataLength: soilTypesConfigData?.length,
      configData: soilTypesConfigData
    });

    if (activePricingTab === "soil-types" && soilTypesConfigData && soilTypesConfigData.length > 0) {
      console.log('✅ Populating Soil Types form data...');
      const formData: {[key: string]: any} = {};
      
      // Simple direct mapping using name field
      soilTypesConfigData.forEach((configItem: any) => {
        console.log('📝 Processing config item:', configItem);
        const soilTypeName = configItem.name;
        if (soilTypeName) {
          formData[soilTypeName] = {
            pricingType: configItem.pricing_type === 'FIXED_RATE' ? 'fixed' : 'percentage',
            value: String(configItem.value || 0),
            quoteOption: configItem.quote_option === 'NO_QUOTE' ? 'no-quote' : 'quote'
          };
        }
      });
      
      setSoilTypesFormData(formData);
      console.log('✅ Soil Types form data populated:', formData);
    }
  }, [activePricingTab, soilTypesConfigData]);

  // Simple effect to populate subcontractor types form data when API data is available
  useEffect(() => {
    console.log('🔍 Subcontractor Types Effect Triggered:', {
      activePricingTab,
      hasConfigData: !!subcontractorTypesConfigData,
      configDataLength: subcontractorTypesConfigData?.length,
      configData: subcontractorTypesConfigData
    });

    if (activePricingTab === "subcontractor-types" && subcontractorTypesConfigData && subcontractorTypesConfigData.length > 0) {
      console.log('✅ Populating Subcontractor Types form data...');
      const formData: {[key: string]: any} = {};
      
      // Simple direct mapping using name field
      subcontractorTypesConfigData.forEach((configItem: any) => {
        console.log('📝 Processing config item:', configItem);
        const subcontractorTypeName = configItem.name;
        if (subcontractorTypeName) {
          formData[subcontractorTypeName] = {
            pricingType: configItem.pricing_type === 'FIXED_RATE' ? 'fixed' : 'percentage',
            value: String(configItem.value || 0),
            quoteOption: configItem.quote_option === 'NO_QUOTE' ? 'no-quote' : 'quote'
          };
        }
      });
      
      setSubcontractorTypesFormData(formData);
      console.log('✅ Subcontractor Types form data populated:', formData);
    }
  }, [activePricingTab, subcontractorTypesConfigData]);

  // Simple effect to populate consultant roles form data when API data is available
  useEffect(() => {
    console.log('🔍 Consultant Roles Effect Triggered:', {
      activePricingTab,
      hasConfigData: !!consultantRolesConfigData,
      configDataLength: consultantRolesConfigData?.length,
      configData: consultantRolesConfigData
    });

    if (activePricingTab === "consultant-roles" && consultantRolesConfigData && consultantRolesConfigData.length > 0) {
      console.log('✅ Populating Consultant Roles form data...');
      const formData: {[key: string]: any} = {};
      
      // Simple direct mapping using name field
      consultantRolesConfigData.forEach((configItem: any) => {
        console.log('📝 Processing config item:', configItem);
        const consultantRoleName = configItem.name;
        if (consultantRoleName) {
          formData[consultantRoleName] = {
            pricingType: configItem.pricing_type === 'FIXED_RATE' ? 'fixed' : 'percentage',
            value: String(configItem.value || 0),
            quoteOption: configItem.quote_option === 'NO_QUOTE' ? 'no-quote' : 'quote'
          };
        }
      });
      
      setConsultantRolesFormData(formData);
      console.log('✅ Consultant Roles form data populated:', formData);
    }
  }, [activePricingTab, consultantRolesConfigData]);

  // Simple effect to populate security types form data when API data is available
  useEffect(() => {
    console.log('🔍 Security Types Effect Triggered:', {
      activePricingTab,
      hasConfigData: !!securityTypesConfigData,
      configDataLength: securityTypesConfigData?.length,
      configData: securityTypesConfigData
    });

    if (activePricingTab === "security-types" && securityTypesConfigData && securityTypesConfigData.length > 0) {
      console.log('✅ Populating Security Types form data...');
      const formData: {[key: string]: any} = {};
      
      // Simple direct mapping using name field
      securityTypesConfigData.forEach((configItem: any) => {
        console.log('📝 Processing config item:', configItem);
        const securityTypeName = configItem.name;
        if (securityTypeName) {
          formData[securityTypeName] = {
            pricingType: configItem.pricing_type === 'FIXED_RATE' ? 'fixed' : 'percentage',
            value: String(configItem.value || 0),
            quoteOption: configItem.quote_option === 'NO_QUOTE' ? 'no-quote' : 'quote'
          };
        }
      });
      
      setSecurityTypesFormData(formData);
      console.log('✅ Security Types form data populated:', formData);
    }
  }, [activePricingTab, securityTypesConfigData]);

  // Simple effect to populate area types form data when API data is available
  useEffect(() => {
    console.log('🔍 Area Types Effect Triggered:', {
      activePricingTab,
      hasConfigData: !!areaTypesConfigData,
      configDataLength: areaTypesConfigData?.length,
      configData: areaTypesConfigData
    });

    if (activePricingTab === "area-types" && areaTypesConfigData && areaTypesConfigData.length > 0) {
      console.log('✅ Populating Area Types form data...');
      const formData: {[key: string]: any} = {};
      
      // Simple direct mapping using name field
      areaTypesConfigData.forEach((configItem: any) => {
        console.log('📝 Processing config item:', configItem);
        const areaTypeName = configItem.name;
        if (areaTypeName) {
          formData[areaTypeName] = {
            pricingType: configItem.pricing_type === 'FIXED_RATE' ? 'fixed' : 'percentage',
            value: String(configItem.value || 0),
            quoteOption: configItem.quote_option === 'NO_QUOTE' ? 'no-quote' : 'quote'
          };
        }
      });
      
      setAreaTypesFormData(formData);
      console.log('✅ Area Types form data populated:', formData);
    }
  }, [activePricingTab, areaTypesConfigData]);

  // Effect to synchronize clauseRows with ratingConfig.clausesPricing
  useEffect(() => {
    if (ratingConfig.clausesPricing && ratingConfig.clausesPricing.length > 0) {
      const newClauseRows: {[key: number]: any[]} = {};
      
      ratingConfig.clausesPricing.forEach((clause: any) => {
        const clauseMetadataItem = clauseMetadata.find(c => c.clause_code === clause.code);
        if (clauseMetadataItem && clause.variableOptions) {
          newClauseRows[clauseMetadataItem.id] = clause.variableOptions.map((option: any) => ({
            id: option.id,
            label: option.label || "",
            limits: option.limits || "",
            type: option.type || "percentage",
            value: option.value || 0
          }));
        }
      });
      
      setClauseRows(prev => ({ ...prev, ...newClauseRows }));
    }
  }, [ratingConfig.clausesPricing, clauseMetadata]);

  // Clause Pricing functions
  if (activePricingTab === "clause-pricing") {

    const toggleClause = (clauseId: number) => {
      const newExpanded = new Set(expandedClauses);
      if (newExpanded.has(clauseId)) {
        newExpanded.delete(clauseId);
      } else {
        newExpanded.add(clauseId);
        // Initialize with one default row if not exists
        if (!clauseRows[clauseId]) {
          setClauseRows(prev => ({
            ...prev,
            [clauseId]: [{ id: 1, label: "Standard Rate", limits: "All Coverage", type: "percentage", value: 2 }]
          }));
        }
      }
      setExpandedClauses(newExpanded);
    };

    const addRow = (clauseId: number) => {
      const currentRows = clauseRows[clauseId] || [];
      const newRow = {
        id: Date.now(),
        label: "",
        limits: "",
        type: "percentage",
        value: 0
      };
      setClauseRows(prev => ({
        ...prev,
        [clauseId]: [...currentRows, newRow]
      }));
      
      // Also update ratingConfig.clausesPricing
      setRatingConfig(prev => ({
        ...prev,
        clausesPricing: prev.clausesPricing?.map((p: any) => 
          p.code === clauseMetadata.find(c => c.id === clauseId)?.clause_code
            ? {
                ...p,
                variableOptions: [...(p.variableOptions || []), newRow]
              }
            : p
        ) || []
      }));
      
      // Expand the section when adding a new row
      setExpandedClauses(prev => new Set([...prev, clauseId]));
      markAsChanged();
    };

    const removeRow = (clauseId: number, rowId: number) => {
      setClauseRows(prev => ({
        ...prev,
        [clauseId]: prev[clauseId]?.filter(row => row.id !== rowId) || []
      }));
      
      // Also update ratingConfig.clausesPricing
      setRatingConfig(prev => ({
        ...prev,
        clausesPricing: prev.clausesPricing?.map((p: any) => 
          p.code === clauseMetadata.find(c => c.id === clauseId)?.clause_code
            ? {
                ...p,
                variableOptions: p.variableOptions?.filter((option: any) => option.id !== rowId) || []
              }
            : p
        ) || []
      }));
      
      markAsChanged();
    };

    const updateRowField = (clauseId: number, rowId: number, field: string, value: any) => {
      // Update clauseRows state
      setClauseRows(prev => ({
        ...prev,
        [clauseId]: prev[clauseId]?.map(row => 
          row.id === rowId ? { ...row, [field]: value } : row
        ) || []
      }));
      
      // Also update ratingConfig.clausesPricing
      setRatingConfig(prev => ({
        ...prev,
        clausesPricing: prev.clausesPricing?.map((p: any) => 
          p.code === clauseMetadata.find(c => c.id === clauseId)?.clause_code
            ? {
                ...p,
                variableOptions: p.variableOptions?.map((option: any) => 
                  option.id === rowId ? { ...option, [field]: value } : option
                ) || []
              }
            : p
        ) || []
      }));
      
      markAsChanged();
    };

    const getRowCount = (clauseId: number) => {
      return clauseRows[clauseId]?.length || 1;
    };

    const handleToggleChange = (clauseId: number, checked: boolean) => {
      setActiveToggles(prev => ({
        ...prev,
        [clauseId]: checked
      }));
      
      // Also update ratingConfig.clausesPricing to reflect the toggle change
      const clause = clauseMetadata.find((c: any) => c.id === clauseId);
      if (clause) {
        setRatingConfig((prev: any) => {
          const existingPricingIndex = (prev.clausesPricing || []).findIndex(
            (pricing: any) => pricing.code === clause.clause_code
          );
          
          if (existingPricingIndex !== -1) {
            // Update existing pricing entry
            const updatedPricing = [...(prev.clausesPricing || [])];
            updatedPricing[existingPricingIndex] = {
              ...updatedPricing[existingPricingIndex],
              enabled: checked
            };
            return {
              ...prev,
              clausesPricing: updatedPricing
            };
          } else {
            // Create new pricing entry if it doesn't exist
            const newPricing = {
              id: clauseId,
              code: clause.clause_code,
              name: clause.title,
              enabled: checked,
              isMandatory: clause.show_type === "MANDATORY",
              pricingType: (clause.clause_type === "CLAUSE" ? "percentage" : "amount") as "percentage" | "amount",
              pricingValue: 0,
              variableOptions: [{
                id: 1,
                label: "Standard Rate",
                limits: "All Coverage",
                type: (clause.clause_type === "CLAUSE" ? "percentage" : "amount") as "percentage" | "amount",
                value: 2
              }]
            };
            return {
              ...prev,
              clausesPricing: [...(prev.clausesPricing || []), newPricing]
            };
          }
        });
      }
      
      markAsChanged();
    };

    const isClauseActive = (clause: any) => {
      // Use state if available (user has explicitly toggled)
      if (activeToggles[clause.id] !== undefined) {
        return activeToggles[clause.id];
      }
      
      // Check pricing data from ratingConfig (saved/loaded data)
      const pricingData = ratingConfig.clausesPricing?.find((p: any) => p.code === clause.clause_code);
      if (pricingData !== undefined) {
        return pricingData.enabled;
      }
      
      // Default behavior for clauses without pricing data:
      // - Mandatory clauses: enabled (true)
      // - Optional clauses: enabled (true) - show as active so they can be configured
      // User can explicitly toggle them off if needed
      return true;
    };

    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clause Pricing Configuration</CardTitle>
              <CardDescription>Configure pricing for specific policy clauses</CardDescription>
            </div>
            <Button onClick={handleSaveClausePricing} size="sm" disabled={isLoadingClauseMetadata || isLoadingClausePricing || isSavingClausePricing}>
              {isLoadingClauseMetadata || isLoadingClausePricing || isSavingClausePricing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              {isLoadingClauseMetadata || isLoadingClausePricing ? 'Loading...' : isSavingClausePricing ? 'Saving...' : 'Save Clause Pricing'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(clauseMetadataError || clausePricingError) && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{clauseMetadataError || clausePricingError}</span>
            </div>
          )}

          {isLoadingClauseMetadata || isLoadingClausePricing ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clause</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pricing Type</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableSkeleton numRows={8} numCols={4} />
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="space-y-4">
              {clauseMetadata && clauseMetadata.length > 0 ? (
                clauseMetadata.map((clause: any) => {
                  const rowCount = getRowCount(clause.id);
                  
                  // Get pricing data for this clause
                  const pricingData = ratingConfig.clausesPricing?.find((p: any) => p.code === clause.clause_code);
                  
                  // Use pricing data if available, otherwise use default rows
                  const currentRows = clauseRows[clause.id] || (pricingData?.variableOptions?.length > 0 
                    ? pricingData.variableOptions.map((option: any, index: number) => ({
                        id: index + 1,
                        label: option.label,
                        limits: option.limits,
                        type: option.type,
                        value: option.value
                      }))
                    : [{ id: 1, label: "Standard Rate", limits: "All Coverage", type: "percentage", value: 2 }]
                  );
                  
                  const isActive = isClauseActive(clause);
                  
                  return (
                    <Card key={clause.id} className={`border border-border transition-all duration-200 ${
                      isActive ? 'bg-card' : 'bg-muted/50 opacity-60'
                    }`}>
                      {/* Parent Clause Card */}
                      <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant={
                                  clause.clause_type === 'CLAUSE' ? "default" : 
                                  clause.clause_type === 'EXCLUSION' ? "destructive" : 
                                  "secondary"
                                } 
                                className="text-xs"
                              >
                                {clause.clause_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{clause.clause_code}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base font-semibold">{clause.title}</CardTitle>
                              <Badge variant={clause.show_type === 'MANDATORY' ? "default" : "outline"} className="text-xs">
                                {clause.show_type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Select 
                            value={
                              ratingConfig.clausesPricing?.find((p: any) => p.code === clause.clause_code)?.pricingType ?? "percentage"
                            }
                            onValueChange={(value) => {
                              setRatingConfig(prev => ({
                                ...prev,
                                clausesPricing: prev.clausesPricing?.map((p: any) => 
                                  p.code === clause.clause_code 
                                    ? { ...p, pricingType: value }
                                    : p
                                ) || []
                              }));
                              markAsChanged();
                            }}
                            disabled={!isActive}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="amount">AED</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Input 
                            type="number" 
                            value={
                              ratingConfig.clausesPricing?.find((p: any) => p.code === clause.clause_code)?.pricingValue ?? 0
                            }
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              setRatingConfig(prev => ({
                                ...prev,
                                clausesPricing: prev.clausesPricing?.map((p: any) => 
                                  p.code === clause.clause_code 
                                    ? { ...p, pricingValue: value }
                                    : p
                                ) || []
                              }));
                              markAsChanged();
                            }}
                            className="w-24 text-center"
                            placeholder="0.00"
                            disabled={!isActive}
                          />
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => addRow(clause.id)}
                            disabled={!isActive}
                          >
                            Add Row
                          </Button>
                          
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id={`clause-${clause.id}`} 
                              checked={isActive}
                              onCheckedChange={(checked) => handleToggleChange(clause.id, checked)}
                            />
                            <Label htmlFor={`clause-${clause.id}`} className="text-xs text-muted-foreground">
                              {isActive ? 'Active' : 'Inactive'}
                            </Label>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleClause(clause.id)}
                            className="p-1 h-8 w-8"
                            disabled={!isActive}
                          >
                            {expandedClauses.has(clause.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>

                      {/* Expanded Child Rows */}
                      {expandedClauses.has(clause.id) && isActive && (
                        <CardContent className="p-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-1/4">Label</TableHead>
                                <TableHead className="w-1/3">Limits</TableHead>
                                <TableHead className="w-1/6">Type</TableHead>
                                <TableHead className="w-1/6">Value</TableHead>
                                <TableHead className="w-20">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentRows.map((row: any) => (
                                <TableRow key={row.id}>
                                  <TableCell>
                                    <Input 
                                      value={row.label || ""} 
                                      onChange={(e) => updateRowField(clause.id, row.id, 'label', e.target.value)}
                                      className="w-full"
                                      placeholder="Label"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input 
                                      value={row.limits || ""} 
                                      onChange={(e) => updateRowField(clause.id, row.id, 'limits', e.target.value)}
                                      className="w-full"
                                      placeholder="Limits"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Select 
                                      value={row.type || "percentage"}
                                      onValueChange={(value) => updateRowField(clause.id, row.id, 'type', value)}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="percentage">%</SelectItem>
                                        <SelectItem value="fixed">AED</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Input 
                                      type="number" 
                                      value={row.value || 0} 
                                      onChange={(e) => updateRowField(clause.id, row.id, 'value', parseFloat(e.target.value) || 0)}
                                      className="w-full text-center"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => removeRow(clause.id, row.id)}
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
                      )}
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No clause metadata available</p>
                  <p className="text-sm mt-2">Click on the tab to load clause data</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }







  // Generic master data table for other tabs
  const getMasterDataConfig = () => {
    switch (activePricingTab) {
      case "construction-types":
        return { 
          title: "Construction Types", 
          description: "Configure pricing for different construction types", 
          data: constructionTypesData.map(item => item.label),
          isLoading: isLoadingConstructionTypes || isLoadingConstructionTypesConfig,
          error: constructionTypesError || constructionTypesConfigError,
          configData: constructionTypesConfigData
        };
      case "role-types":
        return { 
          title: "Role Types", 
          description: "Configure pricing for different role types", 
          data: roleTypesData.map(item => item.label),
          isLoading: isLoadingRoleTypes,
          error: roleTypesError
        };
      case "contract-types":
        return { 
          title: "Contract Types", 
          description: "Configure pricing for different contract types", 
          data: contractTypesData.map(item => item.label),
          isLoading: isLoadingContractTypes,
          error: contractTypesError
        };
      case "soil-types":
        return { 
          title: "Soil Types", 
          description: "Configure pricing for different soil types", 
          data: soilTypesData.map(item => item.label),
          isLoading: isLoadingSoilTypes,
          error: soilTypesError
        };
      case "subcontractor-types":
        return { 
          title: "Subcontractor Types", 
          description: "Configure pricing for different subcontractor types", 
          data: subcontractorTypesData.map(item => item.label),
          isLoading: isLoadingSubcontractorTypes,
          error: subcontractorTypesError
        };
      case "consultant-roles":
        return { 
          title: "Consultant Roles", 
          description: "Configure pricing for different consultant roles", 
          data: consultantRolesData.map(item => item.label || item.name || String(item)),
          isLoading: isLoadingConsultantRoles || isLoadingConsultantRolesConfig,
          error: consultantRolesError || consultantRolesConfigError,
          configData: consultantRolesConfigData
        };
      case "security-types":
        return { 
          title: "Security Types", 
          description: "Configure pricing for different security types", 
          data: securityTypesData.map(item => item.label),
          isLoading: isLoadingSecurityTypes || isLoadingSecurityTypesConfig,
          error: securityTypesError || securityTypesConfigError,
          configData: securityTypesConfigData
        };
      case "area-types":
        return { 
          title: "Area Types", 
          description: "Configure pricing for different area types", 
          data: areaTypesData.map(item => item.label),
          isLoading: isLoadingAreaTypes || isLoadingAreaTypesConfig,
          error: areaTypesError || areaTypesConfigError,
          configData: areaTypesConfigData
        };
      case "countries":
        return { 
          title: "Countries", 
          description: "Configure pricing for different countries", 
          data: countriesData,
          isLoading: isLoadingCountries || isLoadingCountriesConfig,
          error: countriesError || countriesConfigError,
          configData: countriesConfigData
        };
      case "regions":
        return { 
          title: "Regions", 
          description: "Configure pricing for different regions", 
          data: regionsData,
          isLoading: isLoadingRegions || isLoadingRegionsConfig,
          error: regionsError || regionsConfigError,
          configData: regionsConfigData
        };
      case "zones":
        return { 
          title: "Zones", 
          description: "Configure pricing for different zones", 
          data: zonesData,
          isLoading: isLoadingZones || isLoadingZonesConfig,
          error: zonesError || zonesConfigError,
          configData: zonesConfigData
        };
      case "contract-types":
        return { 
          title: "Contract Types", 
          description: "Configure pricing for different contract types", 
          data: contractTypesData,
          isLoading: isLoadingContractTypes || isLoadingContractTypesConfig,
          error: contractTypesError || contractTypesConfigError,
          configData: contractTypesConfigData
        };
      case "role-types":
        return { 
          title: "Role Types", 
          description: "Configure pricing for different role types", 
          data: roleTypesData,
          isLoading: isLoadingRoleTypes || isLoadingRoleTypesConfig,
          error: roleTypesError || roleTypesConfigError,
          configData: roleTypesConfigData
        };
      case "soil-types":
        return { 
          title: "Soil Types", 
          description: "Configure pricing for different soil types", 
          data: soilTypesData,
          isLoading: isLoadingSoilTypes || isLoadingSoilTypesConfig,
          error: soilTypesError || soilTypesConfigError,
          configData: soilTypesConfigData
        };
      case "subcontractor-types":
        return { 
          title: "Subcontractor Types", 
          description: "Configure pricing for different subcontractor types", 
          data: subcontractorTypesData,
          isLoading: isLoadingSubcontractorTypes || isLoadingSubcontractorTypesConfig,
          error: subcontractorTypesError || subcontractorTypesConfigError,
          configData: subcontractorTypesConfigData
        };
      default:
        return null;
    }
  };

  const config = getMasterDataConfig();
  if (!config) return null;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
          <Button 
            onClick={
              activePricingTab === "construction-types" 
                ? () => handleSaveConstructionTypesConfiguration(constructionTypesFormData)
                : activePricingTab === "countries"
                ? () => handleSaveCountriesConfiguration(countriesFormData)
                : activePricingTab === "regions"
                ? () => handleSaveRegionsConfiguration(regionsFormData)
                : activePricingTab === "zones"
                ? () => handleSaveZonesConfiguration(zonesFormData)
                : activePricingTab === "contract-types"
                ? () => handleSaveContractTypesConfiguration(contractTypesFormData)
                : activePricingTab === "role-types"
                ? () => handleSaveRoleTypesConfiguration(roleTypesFormData)
                : activePricingTab === "soil-types"
                ? () => handleSaveSoilTypesConfiguration(soilTypesFormData)
                : activePricingTab === "subcontractor-types"
                ? () => handleSaveSubcontractorTypesConfiguration(subcontractorTypesFormData)
                : activePricingTab === "consultant-roles"
                ? () => handleSaveConsultantRolesConfiguration(consultantRolesFormData)
                : activePricingTab === "security-types"
                ? () => handleSaveSecurityTypesConfiguration(securityTypesFormData)
                : activePricingTab === "area-types"
                ? () => handleSaveAreaTypesConfiguration(areaTypesFormData)
                : onSave
            } 
            size="sm" 
            disabled={
              activePricingTab === "construction-types" 
                ? (config.isLoading || isSavingConstructionTypesConfig)
                : activePricingTab === "countries"
                ? (config.isLoading || isSavingCountriesConfig)
                : activePricingTab === "regions"
                ? (config.isLoading || isSavingRegionsConfig)
                : activePricingTab === "zones"
                ? (config.isLoading || isSavingZonesConfig)
                : activePricingTab === "contract-types"
                ? (config.isLoading || isSavingContractTypesConfig)
                : activePricingTab === "role-types"
                ? (config.isLoading || isSavingRoleTypesConfig)
                : activePricingTab === "soil-types"
                ? (config.isLoading || isSavingSoilTypesConfig)
                : activePricingTab === "subcontractor-types"
                ? (config.isLoading || isSavingSubcontractorTypesConfig)
                : activePricingTab === "consultant-roles"
                ? (config.isLoading || isSavingConsultantRolesConfig)
                : activePricingTab === "security-types"
                ? (config.isLoading || isSavingSecurityTypesConfig)
                : activePricingTab === "area-types"
                ? (config.isLoading || isSavingAreaTypesConfig)
                : config.isLoading
            }
          >
            <Save className="w-4 h-4 mr-1" />
            {activePricingTab === "construction-types" 
              ? (isSavingConstructionTypesConfig ? 'Saving...' : 'Save')
              : activePricingTab === "countries"
              ? (isSavingCountriesConfig ? 'Saving...' : 'Save')
              : activePricingTab === "regions"
              ? (isSavingRegionsConfig ? 'Saving...' : 'Save')
              : activePricingTab === "zones"
              ? (isSavingZonesConfig ? 'Saving...' : 'Save')
              : activePricingTab === "contract-types"
              ? (isSavingContractTypesConfig ? 'Saving...' : 'Save')
              : activePricingTab === "role-types"
              ? (isSavingRoleTypesConfig ? 'Saving...' : 'Save')
              : activePricingTab === "soil-types"
              ? (isSavingSoilTypesConfig ? 'Saving...' : 'Save')
              : activePricingTab === "subcontractor-types"
              ? (isSavingSubcontractorTypesConfig ? 'Saving...' : 'Save')
              : activePricingTab === "security-types"
              ? (isSavingSecurityTypesConfig ? 'Saving...' : 'Save')
              : activePricingTab === "area-types"
              ? (isSavingAreaTypesConfig ? 'Saving...' : 'Save')
              : (config.isLoading ? 'Loading...' : 'Save')
            }
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {config.configData?.length === 0 && !config.isLoading && (
          <div className="rounded-md border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 mb-6">
            <p className="font-medium">Yet to configure this section</p>
            <p className="text-sm mt-1">Configure {config.title.toLowerCase()} and their pricing values below.</p>
          </div>
        )}

        {config.isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Pricing Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Quote Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeleton numRows={5} numCols={4} />
            </TableBody>
          </Table>
        ) : (
          <Table key={activePricingTab === "construction-types" ? `construction-${config.configData?.length || 0}` : activePricingTab}>
            <TableHeader>
              <TableRow>
                <TableHead>{config.title.slice(0, -1)}</TableHead>
                <TableHead>Pricing Type</TableHead>
                <TableHead>Loading/Discount</TableHead>
                <TableHead>Quote Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No {config.title.toLowerCase()} available
                  </TableCell>
                </TableRow>
              ) : (
                config.data.map((item: string, index: number) => {
                  // Simple direct approach for Construction Types, Countries, Regions, Zones, Contract Types, Role Types, Soil Types, and Subcontractor Types
                  const formData = activePricingTab === "construction-types" ? constructionTypesFormData[item] 
                    : activePricingTab === "countries" ? countriesFormData[item] 
                    : activePricingTab === "regions" ? regionsFormData[item]
                    : activePricingTab === "zones" ? zonesFormData[item]
                    : activePricingTab === "contract-types" ? contractTypesFormData[item]
                    : activePricingTab === "role-types" ? roleTypesFormData[item]
                    : activePricingTab === "soil-types" ? soilTypesFormData[item]
                    : activePricingTab === "subcontractor-types" ? subcontractorTypesFormData[item]
                    : activePricingTab === "consultant-roles" ? consultantRolesFormData[item]
                    : activePricingTab === "security-types" ? securityTypesFormData[item]
                    : activePricingTab === "area-types" ? areaTypesFormData[item]
                    : null;
                  
                  console.log(`🔍 Rendering row for "${item}":`, {
                    formData,
                    hasFormData: !!formData,
                    allFormData: constructionTypesFormData
                  });
                  
                  return (
                    <TableRow key={`${item}-${index}`}>
                      <TableCell className="font-medium">{item}</TableCell>
                      <TableCell>
                        <Select 
                          value={formData?.pricingType || 'percentage'}
                          onValueChange={(value) => {
                            if (activePricingTab === "construction-types") {
                              setConstructionTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  pricingType: value
                                }
                              }));
                            } else if (activePricingTab === "countries") {
                              setCountriesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  pricingType: value
                                }
                              }));
                            } else if (activePricingTab === "regions") {
                              setRegionsFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  pricingType: value
                                }
                              }));
                            } else if (activePricingTab === "zones") {
                              setZonesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  pricingType: value
                                }
                              }));
                            } else if (activePricingTab === "contract-types") {
                              setContractTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  pricingType: value
                                }
                              }));
                            } else if (activePricingTab === "role-types") {
                              setRoleTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  pricingType: value
                                }
                              }));
                            } else if (activePricingTab === "soil-types") {
                              setSoilTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  pricingType: value
                                }
                              }));
                            } else if (activePricingTab === "subcontractor-types") {
                              setSubcontractorTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  pricingType: value
                                }
                              }));
                            } else if (activePricingTab === "consultant-roles") {
                              setConsultantRolesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  pricingType: value
                                }
                              }));
                            } else if (activePricingTab === "security-types") {
                              setSecurityTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  pricingType: value
                                }
                              }));
                            } else if (activePricingTab === "area-types") {
                              setAreaTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  pricingType: value
                                }
                              }));
                            }
                          }}
                        >
                          <SelectTrigger className="w-32">
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
                          value={formData?.value || '0'}
                          onChange={(e) => {
                            if (activePricingTab === "construction-types") {
                              setConstructionTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  value: e.target.value
                                }
                              }));
                            } else if (activePricingTab === "countries") {
                              setCountriesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  value: e.target.value
                                }
                              }));
                            } else if (activePricingTab === "regions") {
                              setRegionsFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  value: e.target.value
                                }
                              }));
                            } else if (activePricingTab === "zones") {
                              setZonesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  value: e.target.value
                                }
                              }));
                            } else if (activePricingTab === "contract-types") {
                              setContractTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  value: e.target.value
                                }
                              }));
                            } else if (activePricingTab === "role-types") {
                              setRoleTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  value: e.target.value
                                }
                              }));
                            } else if (activePricingTab === "soil-types") {
                              setSoilTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  value: e.target.value
                                }
                              }));
                            } else if (activePricingTab === "subcontractor-types") {
                              setSubcontractorTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  value: e.target.value
                                }
                              }));
                            } else if (activePricingTab === "consultant-roles") {
                              setConsultantRolesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  value: e.target.value
                                }
                              }));
                            } else if (activePricingTab === "security-types") {
                              setSecurityTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  value: e.target.value
                                }
                              }));
                            } else if (activePricingTab === "area-types") {
                              setAreaTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  value: e.target.value
                                }
                              }));
                            }
                          }}
                          className="w-24" 
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={formData?.quoteOption || 'quote'}
                          onValueChange={(value) => {
                            if (activePricingTab === "construction-types") {
                              setConstructionTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  quoteOption: value
                                }
                              }));
                            } else if (activePricingTab === "countries") {
                              setCountriesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  quoteOption: value
                                }
                              }));
                            } else if (activePricingTab === "regions") {
                              setRegionsFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  quoteOption: value
                                }
                              }));
                            } else if (activePricingTab === "zones") {
                              setZonesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  quoteOption: value
                                }
                              }));
                            } else if (activePricingTab === "contract-types") {
                              setContractTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  quoteOption: value
                                }
                              }));
                            } else if (activePricingTab === "role-types") {
                              setRoleTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  quoteOption: value
                                }
                              }));
                            } else if (activePricingTab === "soil-types") {
                              setSoilTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  quoteOption: value
                                }
                              }));
                            } else if (activePricingTab === "subcontractor-types") {
                              setSubcontractorTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  quoteOption: value
                                }
                              }));
                            } else if (activePricingTab === "consultant-roles") {
                              setConsultantRolesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  quoteOption: value
                                }
                              }));
                            } else if (activePricingTab === "security-types") {
                              setSecurityTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  quoteOption: value
                                }
                              }));
                            } else if (activePricingTab === "area-types") {
                              setAreaTypesFormData(prev => ({
                                ...prev,
                                [item]: { 
                                  ...prev[item], 
                                  quoteOption: value
                                }
                              }));
                            }
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="quote">Auto Quote</SelectItem>
                            <SelectItem value="no-quote">No Quote</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default MasterDataTabs;



