import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigationHistory } from '@/shared/hooks/use-navigation-history';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';

const CreatePlan = () => {
  const navigate = useNavigate();
  const { navigateBack } = useNavigationHistory();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    planName: "",
    planType: "",
    description: "",
    projectValueMin: "",
    projectValueMax: "",
    constructionPeriodMax: "",
    maintenancePeriodMax: "",
    projectTypes: [] as string[],
    constructionTypes: [] as string[],
    siteLocationTypes: [] as string[],
    coverageTypes: [] as string[],
    riskAreas: [] as string[],
    blastingAllowed: false,
    previousLossHistoryRequired: false,
    contractorExperienceMin: "",
    sumInsuredComponents: [] as string[],
    safetyArrangements: [] as string[],
    premiumRate: "",
    status: "draft"
  });

  const projectTypeOptions = [
    "Residential Building",
    "Commercial Building", 
    "Industrial Facility",
    "Infrastructure",
    "Bridge Construction",
    "Road Construction",
    "Shopping Center",
    "Hospital/Healthcare",
    "Educational Facility",
    "Mining Project",
    "Marine Construction"
  ];

  const constructionTypeOptions = [
    "New Construction",
    "Renovation/Refurbishment", 
    "Extension/Addition",
    "Demolition",
    "Civil Works",
    "Mechanical/Electrical",
    "Infrastructure Works",
    "Specialty Construction"
  ];

  const siteLocationOptions = [
    "Urban Area",
    "Rural Area",
    "Coastal Area",
    "Flood Prone Area",
    "Earthquake Zone",
    "Industrial Zone",
    "Environmentally Sensitive Area",
    "High Security Zone"
  ];

  const coverageTypeOptions = [
    "Material Damage",
    "Third Party Liability",
    "Delay in Start-up",
    "Professional Indemnity",
    "Public Liability",
    "Product Liability",
    "Employer's Liability",
    "Environmental Liability"
  ];

  const riskAreaOptions = [
    "Low Risk",
    "Medium Risk", 
    "High Risk",
    "Flood Prone Area",
    "Earthquake Zone",
    "Coastal Area",
    "Industrial Zone"
  ];

  const sumInsuredOptions = [
    "Building Works",
    "Plant & Equipment",
    "Materials & Supplies",
    "Temporary Works",
    "Third Party Property",
    "Professional Fees",
    "Debris Removal",
    "Extra Costs"
  ];

  const safetyArrangementOptions = [
    "Safety Officer On-Site",
    "Regular Safety Training",
    "Personal Protective Equipment",
    "Safety Management System",
    "Emergency Response Plan",
    "First Aid Facilities",
    "Fire Prevention System",
    "Environmental Protection Measures"
  ];

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field as keyof typeof prev] as string[]), value]
        : (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Plan Created Successfully",
      description: `${formData.planName} has been created and saved as ${formData.status}.`,
    });
    navigate("/insurer/product-config");
  };

  return (
    <div className="min-h-screen bg-background">
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
                <h1 className="text-xl font-semibold text-foreground">Create New Plan</h1>
                <p className="text-sm text-muted-foreground">Configure a new insurance plan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Define the core details of your insurance plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="planName">Plan Name *</Label>
                  <Input
                    id="planName"
                    value={formData.planName}
                    onChange={(e) => setFormData(prev => ({ ...prev, planName: e.target.value }))}
                    placeholder="e.g., Premium Construction Cover"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="planType">Plan Type *</Label>
                  <Select value={formData.planType} onValueChange={(value) => setFormData(prev => ({ ...prev, planType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="specialized">Specialized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the plan features and benefits"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Project Parameters */}
          <Card>
            <CardHeader>
              <CardTitle>Project Parameters</CardTitle>
              <CardDescription>Define the project value ranges and duration limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="projectValueMin">Minimum Project Value ($)</Label>
                  <Input
                    id="projectValueMin"
                    type="number"
                    value={formData.projectValueMin}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectValueMin: e.target.value }))}
                    placeholder="100000"
                  />
                </div>
                <div>
                  <Label htmlFor="projectValueMax">Maximum Project Value ($)</Label>
                  <Input
                    id="projectValueMax"
                    type="number"
                    value={formData.projectValueMax}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectValueMax: e.target.value }))}
                    placeholder="10000000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="constructionPeriodMax">Max Construction Period (months)</Label>
                  <Input
                    id="constructionPeriodMax"
                    type="number"
                    value={formData.constructionPeriodMax}
                    onChange={(e) => setFormData(prev => ({ ...prev, constructionPeriodMax: e.target.value }))}
                    placeholder="36"
                  />
                </div>
                <div>
                  <Label htmlFor="maintenancePeriodMax">Max Maintenance Period (months)</Label>
                  <Input
                    id="maintenancePeriodMax"
                    type="number"
                    value={formData.maintenancePeriodMax}
                    onChange={(e) => setFormData(prev => ({ ...prev, maintenancePeriodMax: e.target.value }))}
                    placeholder="60"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="blastingAllowed"
                  checked={formData.blastingAllowed}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, blastingAllowed: checked as boolean }))}
                />
                <Label htmlFor="blastingAllowed">Allow Blasting/Deep Excavation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="previousLossHistoryRequired"
                  checked={formData.previousLossHistoryRequired}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, previousLossHistoryRequired: checked as boolean }))}
                />
                <Label htmlFor="previousLossHistoryRequired">Require Previous Loss History</Label>
              </div>
              <div>
                <Label htmlFor="contractorExperienceMin">Minimum Contractor Experience (No. of Projects)</Label>
                <Input
                  id="contractorExperienceMin"
                  type="number"
                  value={formData.contractorExperienceMin}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractorExperienceMin: e.target.value }))}
                  placeholder="5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Project Types */}
          <Card>
            <CardHeader>
              <CardTitle>Eligible Project Types</CardTitle>
              <CardDescription>Select the types of projects this plan covers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {projectTypeOptions.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`project-${type}`}
                      checked={formData.projectTypes.includes(type)}
                      onCheckedChange={(checked) => handleCheckboxChange('projectTypes', type, checked as boolean)}
                    />
                    <Label htmlFor={`project-${type}`} className="text-sm">{type}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Site Location Types */}
          <Card>
            <CardHeader>
              <CardTitle>Site Location Types</CardTitle>
              <CardDescription>Define the site location types and risk flags this plan covers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {siteLocationOptions.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`location-${type}`}
                      checked={formData.siteLocationTypes.includes(type)}
                      onCheckedChange={(checked) => handleCheckboxChange('siteLocationTypes', type, checked as boolean)}
                    />
                    <Label htmlFor={`location-${type}`} className="text-sm">{type}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Construction Types */}
          <Card>
            <CardHeader>
              <CardTitle>Construction Types</CardTitle>
              <CardDescription>Select the construction types covered by this plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {constructionTypeOptions.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`construction-${type}`}
                      checked={formData.constructionTypes.includes(type)}
                      onCheckedChange={(checked) => handleCheckboxChange('constructionTypes', type, checked as boolean)}
                    />
                    <Label htmlFor={`construction-${type}`} className="text-sm">{type}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Coverage Types */}
          <Card>
            <CardHeader>
              <CardTitle>Coverage Types</CardTitle>
              <CardDescription>Define what types of coverage this plan includes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {coverageTypeOptions.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`coverage-${type}`}
                      checked={formData.coverageTypes.includes(type)}
                      onCheckedChange={(checked) => handleCheckboxChange('coverageTypes', type, checked as boolean)}
                    />
                    <Label htmlFor={`coverage-${type}`} className="text-sm">{type}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sum Insured Components */}
          <Card>
            <CardHeader>
              <CardTitle>Sum Insured Components</CardTitle>
              <CardDescription>Select the components that can be insured under this plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {sumInsuredOptions.map((component) => (
                  <div key={component} className="flex items-center space-x-2">
                    <Checkbox
                      id={`component-${component}`}
                      checked={formData.sumInsuredComponents.includes(component)}
                      onCheckedChange={(checked) => handleCheckboxChange('sumInsuredComponents', component, checked as boolean)}
                    />
                    <Label htmlFor={`component-${component}`} className="text-sm">{component}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Safety Arrangements */}
          <Card>
            <CardHeader>
              <CardTitle>Required Safety Arrangements</CardTitle>
              <CardDescription>Define the safety arrangements required for this plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {safetyArrangementOptions.map((arrangement) => (
                  <div key={arrangement} className="flex items-center space-x-2">
                    <Checkbox
                      id={`safety-${arrangement}`}
                      checked={formData.safetyArrangements.includes(arrangement)}
                      onCheckedChange={(checked) => handleCheckboxChange('safetyArrangements', arrangement, checked as boolean)}
                    />
                    <Label htmlFor={`safety-${arrangement}`} className="text-sm">{arrangement}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Status */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Status</CardTitle>
              <CardDescription>Set the premium rate and plan status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="premiumRate">Premium Rate (%)</Label>
                  <Input
                    id="premiumRate"
                    type="number"
                    step="0.01"
                    value={formData.premiumRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, premiumRate: e.target.value }))}
                    placeholder="1.25"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigateBack()}
            >
              Cancel
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlan;