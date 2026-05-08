import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useNavigationHistory } from '@/shared/hooks/use-navigation-history';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Footer } from "@/components/layout/Footer";
import { ArrowLeft, Save, Calculator } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { getActiveProjectTypes, getActiveConstructionTypes } from "@/lib/masters-data";
import { ProjectTypeBaseRates } from "@/features/product-config/components/pricing/ProjectTypeBaseRates";

const InsurerProductConfig = () => {
  const navigate = useNavigate();
  const { insurerId } = useParams();
  const { navigateBack } = useNavigationHistory();
  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  
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

  const saveConfiguration = () => {
    showConfirmDialog(
      {
        title: "Save Configuration",
        description: "Are you sure you want to save the CAR insurance rating algorithm configuration?",
        confirmText: "Save Configuration"
      },
      () => {
        toast({
          title: "Configuration Saved",
          description: `CAR insurance rating algorithm has been successfully configured for ${insurerId}.`,
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

  const getInsurerName = (id: string | undefined) => {
    const insurerNames: { [key: string]: string } = {
      'emirates-insurance': 'Emirates Insurance',
      'axa-gulf': 'AXA Gulf',
      'oman-insurance': 'Oman Insurance',
      'dubai-insurance': 'Dubai Insurance'
    };
    return insurerNames[id || ''] || 'Unknown Insurer';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateBack()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Rate Configuration
                </h1>
                <p className="text-sm text-muted-foreground">Configure comprehensive risk factors and premium calculations</p>
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Algorithm Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Rating Algorithm Structure
              </CardTitle>
              <CardDescription>
                Premium = (Base Rate × Sum Insured) × Risk Adjustment Factors
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Base Rates Configuration */}
          <ProjectTypeBaseRates
            projectTypes={activeProjectTypes}
            baseRates={ratingConfig.baseRates}
            quoteOptions={ratingConfig.projectTypeQuoteOptions}
            onBaseRateChange={updateBaseRate}
            onQuoteOptionChange={updateProjectTypeQuoteOption}
          />

          {/* Project Risk Factors */}
          <Card>
            <CardHeader>
              <CardTitle>2. Project Risk Factors</CardTitle>
              <CardDescription>Configure risk multipliers based on project characteristics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Duration Loadings */}
              <div>
                <h4 className="font-medium mb-4">Duration Loading (Additional % for longer projects)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Less than 12 months</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.projectRisk.durationLoadings.lessThan12}
                      onChange={(e) => updateProjectRiskFactor('durationLoadings', 'lessThan12', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>12-18 months</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.projectRisk.durationLoadings.between12And18}
                      onChange={(e) => updateProjectRiskFactor('durationLoadings', 'between12And18', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>18-24 months</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.projectRisk.durationLoadings.between18And24}
                      onChange={(e) => updateProjectRiskFactor('durationLoadings', 'between18And24', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>More than 24 months</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.projectRisk.durationLoadings.moreThan24}
                      onChange={(e) => updateProjectRiskFactor('durationLoadings', 'moreThan24', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Location Hazard Loadings */}
              <div>
                <h4 className="font-medium mb-4">Location Hazard Loading (%)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Low Risk Zone</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.projectRisk.locationHazardLoadings.low}
                      onChange={(e) => updateProjectRiskFactor('locationHazardLoadings', 'low', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Moderate Risk Zone</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.projectRisk.locationHazardLoadings.moderate}
                      onChange={(e) => updateProjectRiskFactor('locationHazardLoadings', 'moderate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>High Risk Zone</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.projectRisk.locationHazardLoadings.high}
                      onChange={(e) => updateProjectRiskFactor('locationHazardLoadings', 'high', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contractor Risk Factors */}
          <Card>
            <CardHeader>
              <CardTitle>3. Contractor Risk Factors</CardTitle>
              <CardDescription>Configure adjustments based on contractor profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Experience Adjustments */}
              <div>
                <h4 className="font-medium mb-4">Experience Adjustments (% discount/loading)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Less than 2 years</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.contractorRisk.experienceDiscounts.lessThan2}
                      onChange={(e) => updateContractorRiskFactor('experienceDiscounts', 'lessThan2', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>2-5 years</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.contractorRisk.experienceDiscounts.between2And5}
                      onChange={(e) => updateContractorRiskFactor('experienceDiscounts', 'between2And5', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>5-10 years</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.contractorRisk.experienceDiscounts.between5And10}
                      onChange={(e) => updateContractorRiskFactor('experienceDiscounts', 'between5And10', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>More than 10 years</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.contractorRisk.experienceDiscounts.moreThan10}
                      onChange={(e) => updateContractorRiskFactor('experienceDiscounts', 'moreThan10', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Safety Record Adjustments */}
              <div>
                <h4 className="font-medium mb-4">Safety Record Adjustments (%)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Poor</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.contractorRisk.safetyRecordAdjustments.poor}
                      onChange={(e) => updateContractorRiskFactor('safetyRecordAdjustments', 'poor', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Average</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.contractorRisk.safetyRecordAdjustments.average}
                      onChange={(e) => updateContractorRiskFactor('safetyRecordAdjustments', 'average', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Good</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.contractorRisk.safetyRecordAdjustments.good}
                      onChange={(e) => updateContractorRiskFactor('safetyRecordAdjustments', 'good', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Excellent</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.contractorRisk.safetyRecordAdjustments.excellent}
                      onChange={(e) => updateContractorRiskFactor('safetyRecordAdjustments', 'excellent', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Subcontractor Loadings */}
              <div>
                <h4 className="font-medium mb-4">Subcontractor Use Loading (%)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>None</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.contractorRisk.subcontractorLoadings.none}
                      onChange={(e) => updateContractorRiskFactor('subcontractorLoadings', 'none', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Limited</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.contractorRisk.subcontractorLoadings.limited}
                      onChange={(e) => updateContractorRiskFactor('subcontractorLoadings', 'limited', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Moderate</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.contractorRisk.subcontractorLoadings.moderate}
                      onChange={(e) => updateContractorRiskFactor('subcontractorLoadings', 'moderate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Heavy</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.contractorRisk.subcontractorLoadings.heavy}
                      onChange={(e) => updateContractorRiskFactor('subcontractorLoadings', 'heavy', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coverage Options */}
          <Card>
            <CardHeader>
              <CardTitle>4. Coverage Options & Extensions</CardTitle>
              <CardDescription>Configure premium adjustments for coverage variations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* TPL Limits */}
              <div>
                <h4 className="font-medium mb-4">Third Party Liability Limits (Multiplier)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Basic Coverage</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.coverageOptions.tplLimits.basic}
                      onChange={(e) => setRatingConfig(prev => ({
                        ...prev,
                        coverageOptions: {
                          ...prev.coverageOptions,
                          tplLimits: {
                            ...prev.coverageOptions.tplLimits,
                            basic: parseFloat(e.target.value) || 0,
                          },
                        },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Standard Coverage</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.coverageOptions.tplLimits.standard}
                      onChange={(e) => setRatingConfig(prev => ({
                        ...prev,
                        coverageOptions: {
                          ...prev.coverageOptions,
                          tplLimits: {
                            ...prev.coverageOptions.tplLimits,
                            standard: parseFloat(e.target.value) || 0,
                          },
                        },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Enhanced Coverage</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.coverageOptions.tplLimits.enhanced}
                      onChange={(e) => setRatingConfig(prev => ({
                        ...prev,
                        coverageOptions: {
                          ...prev.coverageOptions,
                          tplLimits: {
                            ...prev.coverageOptions.tplLimits,
                            enhanced: parseFloat(e.target.value) || 0,
                          },
                        },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Premium Coverage</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.coverageOptions.tplLimits.premium}
                      onChange={(e) => setRatingConfig(prev => ({
                        ...prev,
                        coverageOptions: {
                          ...prev.coverageOptions,
                          tplLimits: {
                            ...prev.coverageOptions.tplLimits,
                            premium: parseFloat(e.target.value) || 0,
                          },
                        },
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Maintenance Extension */}
              <div>
                <h4 className="font-medium mb-4">Maintenance Period Extension (%)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>No Extension</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.coverageOptions.maintenanceExtension.none}
                      onChange={(e) => setRatingConfig(prev => ({
                        ...prev,
                        coverageOptions: {
                          ...prev.coverageOptions,
                          maintenanceExtension: {
                            ...prev.coverageOptions.maintenanceExtension,
                            none: parseFloat(e.target.value) || 0,
                          },
                        },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>6 Months</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.coverageOptions.maintenanceExtension.sixMonths}
                      onChange={(e) => setRatingConfig(prev => ({
                        ...prev,
                        coverageOptions: {
                          ...prev.coverageOptions,
                          maintenanceExtension: {
                            ...prev.coverageOptions.maintenanceExtension,
                            sixMonths: parseFloat(e.target.value) || 0,
                          },
                        },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>12 Months</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.coverageOptions.maintenanceExtension.twelveMonths}
                      onChange={(e) => setRatingConfig(prev => ({
                        ...prev,
                        coverageOptions: {
                          ...prev.coverageOptions,
                          maintenanceExtension: {
                            ...prev.coverageOptions.maintenanceExtension,
                            twelveMonths: parseFloat(e.target.value) || 0,
                          },
                        },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>18 Months</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.coverageOptions.maintenanceExtension.eighteenMonths}
                      onChange={(e) => setRatingConfig(prev => ({
                        ...prev,
                        coverageOptions: {
                          ...prev.coverageOptions,
                          maintenanceExtension: {
                            ...prev.coverageOptions.maintenanceExtension,
                            eighteenMonths: parseFloat(e.target.value) || 0,
                          },
                        },
                      }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policy Limits */}
          <Card>
            <CardHeader>
              <CardTitle>5. Policy Limits & Deductibles</CardTitle>
              <CardDescription>Configure premium bounds and deductible adjustments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="minimum">Minimum Premium (AED)</Label>
                  <Input
                    id="minimum"
                    type="number"
                    value={ratingConfig.limits.minimumPremium}
                    onChange={(e) => setRatingConfig(prev => ({
                      ...prev,
                      limits: {
                        ...prev.limits,
                        minimumPremium: parseInt(e.target.value) || 0,
                      },
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maximum">Maximum Cover (AED)</Label>
                  <Input
                    id="maximum"
                    type="number"
                    value={ratingConfig.limits.maximumCover}
                    onChange={(e) => setRatingConfig(prev => ({
                      ...prev,
                      limits: {
                        ...prev.limits,
                        maximumCover: parseInt(e.target.value) || 0,
                      },
                    }))}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Deductible Adjustments (% discount)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Low Deductible</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.deductibleAdjustments.low}
                      onChange={(e) => setRatingConfig(prev => ({
                        ...prev,
                        deductibleAdjustments: {
                          ...prev.deductibleAdjustments,
                          low: parseFloat(e.target.value) || 0,
                        },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Standard Deductible</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.deductibleAdjustments.standard}
                      onChange={(e) => setRatingConfig(prev => ({
                        ...prev,
                        deductibleAdjustments: {
                          ...prev.deductibleAdjustments,
                          standard: parseFloat(e.target.value) || 0,
                        },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>High Deductible</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.deductibleAdjustments.high}
                      onChange={(e) => setRatingConfig(prev => ({
                        ...prev,
                        deductibleAdjustments: {
                          ...prev.deductibleAdjustments,
                          high: parseFloat(e.target.value) || 0,
                        },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Very High Deductible</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ratingConfig.deductibleAdjustments.veryHigh}
                      onChange={(e) => setRatingConfig(prev => ({
                        ...prev,
                        deductibleAdjustments: {
                          ...prev.deductibleAdjustments,
                          veryHigh: parseFloat(e.target.value) || 0,
                        },
                      }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <ConfirmDialog />
      <Footer />
    </div>
  );
};

export default InsurerProductConfig;