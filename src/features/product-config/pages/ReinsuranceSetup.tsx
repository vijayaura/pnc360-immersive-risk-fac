import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Save, Upload, FileText, Building2, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from '@/shared/utils/lib-utils';
import { Switch } from "@/components/ui/switch";

type ReinsuranceType = "Treaty" | "Facultative" | "Both (Hybrid)" | "None";
type TreatyStructureType = "Quota Share (QS)" | "Surplus" | "Excess of Loss (XOL)" | "Stop Loss" | "Multi-layer";
type CedingCommissionType = "Flat" | "Sliding Scale" | "Profit Commission";
type ReinstatementPremiumType = "Pro-rata" | "Fixed" | "Sliding";
type PremiumBase = "Net Earned Premium" | "Gross Earned Premium";

interface ReinsurancePanel {
  id: string;
  reinsurerName: string;
  rating: string;
  sharePercent: number;
  isLead: boolean;
}

interface TreatyStructure {
  id: string;
  structureType: TreatyStructureType;
  name?: string; // Optional name for the structure (e.g., "Layer 1", "Primary QS")

  // Quota Share Settings
  quotaSharePercent: number;
  retentionPercent: number;
  maxTreatyCapacity: number;
  cedingCommissionType: CedingCommissionType | "";
  cedingCommissionPercent: number;
  profitCommissionMin: number;
  profitCommissionMax: number;
  lrTriggerLevels: string;

  // Surplus Settings
  surplusLines: number;
  surplusRetentionLimit: number;
  surplusMaxCapacity: number;
  surplusCedingCommission: number;
  surplusMaxTreatyCapacity: number;

  // XOL Settings
  xolLimitPerOccurrence: number;
  xolDeductible: number;
  xolAggregateLimit: number;
  xolReinstatements: number;
  xolReinstatementPremiumType: ReinstatementPremiumType | "";

  // Stop Loss Settings
  stopLossAttachment: number;
  stopLossDetachment: number;
  stopLossPremiumBase: PremiumBase | "";

  // Capacity & Panel Setup
  reinsurancePanel: ReinsurancePanel[];
  totalCessionPercent: number;

  // Commission & Financial Conditions
  brokeragePercent: number;
  overrideFrontingFeePercent: number;
  premiumPortfolioAdjustment: "Quarterly" | "Annual" | "";
  depositPremiumRules: string;
  lossPortfolioTransferAmount: number;
  lossPortfolioTransferPercent: number;
  lossPortfolioTransferDate: Date | null;

  // Documentation
  treatyDocumentUrl: string;
  slipUrl: string;
  underwritingGuidelinesLink: string;
}

interface Reinsurance {
  id: string;
  // Reinsurance Program Overview
  reinsuranceType: ReinsuranceType;
  startDate: Date | null;
  endDate: Date | null;
  treatyName: string;
  treatyCode: string;

  // Treaty Structures (multiple)
  treatyStructures: TreatyStructure[];

  // Facultative Settings
  facultativeMandatory: boolean;
  facultativeSumInsuredAbove: number;
  facultativeSpecificPerils: string;
  facultativeHighRiskIndustries: string;
  facultativeUnsatisfactoryRiskScore: number;
  facultativeSpecialAcceptance: boolean;
  defaultFacultativePanel: string;
  minimumReferralFields: string[];

  // Retention Parameters
  companyRetentionPerRisk: number;
  companyRetentionPerRiskPercent: number;
  companyRetentionPerEvent: number;
  maximumNetLine: number;
}

const ReinsuranceSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const productId = searchParams.get("productId");
  const productName = searchParams.get("productName") || "Product";
  const productVersion = searchParams.get("productVersion") || "";

  const [reinsurances, setReinsurances] = useState<Reinsurance[]>([]);
  const [selectedReinsuranceId, setSelectedReinsuranceId] = useState<string | null>(null);
  const [selectedTreatyStructureId, setSelectedTreatyStructureId] = useState<string | null>(null);
  const [selectedReinsuranceIds, setSelectedReinsuranceIds] = useState<Set<string>>(new Set());
  const [activeTreatySection, setActiveTreatySection] = useState<string>("general");
  const [isSaving, setIsSaving] = useState(false);

  const selectedReinsurance = reinsurances.find(r => r.id === selectedReinsuranceId) || null;
  const selectedTreatyStructure = selectedReinsurance?.treatyStructures.find(ts => ts.id === selectedTreatyStructureId) || null;

  const generateId = () => `reins_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const generateStructureId = () => `struct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const createNewTreatyStructure = (structureType: TreatyStructureType): TreatyStructure => ({
    id: generateStructureId(),
    structureType,
    name: "",
    quotaSharePercent: 0,
    retentionPercent: 0,
    maxTreatyCapacity: 0,
    cedingCommissionType: "",
    cedingCommissionPercent: 0,
    profitCommissionMin: 0,
    profitCommissionMax: 0,
    lrTriggerLevels: "",
    surplusLines: 0,
    surplusRetentionLimit: 0,
    surplusMaxCapacity: 0,
    surplusCedingCommission: 0,
    surplusMaxTreatyCapacity: 0,
    xolLimitPerOccurrence: 0,
    xolDeductible: 0,
    xolAggregateLimit: 0,
    xolReinstatements: 0,
    xolReinstatementPremiumType: "",
    stopLossAttachment: 0,
    stopLossDetachment: 0,
    stopLossPremiumBase: "",
    reinsurancePanel: [],
    totalCessionPercent: 0,
    brokeragePercent: 0,
    overrideFrontingFeePercent: 0,
    premiumPortfolioAdjustment: "",
    depositPremiumRules: "",
    lossPortfolioTransferAmount: 0,
    lossPortfolioTransferPercent: 0,
    lossPortfolioTransferDate: null,
    treatyDocumentUrl: "",
    slipUrl: "",
    underwritingGuidelinesLink: "",
  });

  const createNewReinsurance = (): Reinsurance => ({
    id: generateId(),
    reinsuranceType: "None",
    startDate: null,
    endDate: null,
    treatyName: "",
    treatyCode: "",
    treatyStructures: [],
    facultativeMandatory: false,
    facultativeSumInsuredAbove: 0,
    facultativeSpecificPerils: "",
    facultativeHighRiskIndustries: "",
    facultativeUnsatisfactoryRiskScore: 0,
    facultativeSpecialAcceptance: false,
    defaultFacultativePanel: "",
    minimumReferralFields: [],
    companyRetentionPerRisk: 0,
    companyRetentionPerRiskPercent: 0,
    companyRetentionPerEvent: 0,
    maximumNetLine: 0,
  });

  const handleAddReinsurance = () => {
    const newReinsurance = createNewReinsurance();
    setReinsurances([...reinsurances, newReinsurance]);
    setSelectedReinsuranceId(newReinsurance.id);
  };

  const handleDeleteReinsurance = (id: string) => {
    setReinsurances(reinsurances.filter(r => r.id !== id));
    if (selectedReinsuranceId === id) {
      setSelectedReinsuranceId(reinsurances.length > 1 ? reinsurances.find(r => r.id !== id)?.id || null : null);
    }
  };

  const handleUpdateReinsurance = (updates: Partial<Reinsurance>) => {
    if (!selectedReinsuranceId) return;
    setReinsurances(reinsurances.map(r =>
      r.id === selectedReinsuranceId ? { ...r, ...updates } : r
    ));
  };

  const handleAddPanelMember = () => {
    if (!selectedReinsuranceId || !selectedTreatyStructureId) return;
    const newPanel: ReinsurancePanel = {
      id: `panel_${Date.now()}`,
      reinsurerName: "",
      rating: "",
      sharePercent: 0,
      isLead: false,
    };
    handleUpdateTreatyStructure({
      reinsurancePanel: [...(selectedTreatyStructure?.reinsurancePanel || []), newPanel]
    });
  };

  const handleUpdatePanelMember = (panelId: string, updates: Partial<ReinsurancePanel>) => {
    if (!selectedReinsuranceId || !selectedTreatyStructureId) return;
    handleUpdateTreatyStructure({
      reinsurancePanel: selectedTreatyStructure?.reinsurancePanel.map(p =>
        p.id === panelId ? { ...p, ...updates } : p
      ) || []
    });
  };

  const handleDeletePanelMember = (panelId: string) => {
    if (!selectedReinsuranceId || !selectedTreatyStructureId) return;
    handleUpdateTreatyStructure({
      reinsurancePanel: selectedTreatyStructure?.reinsurancePanel.filter(p => p.id !== panelId) || []
    });
  };

  const handleAddTreatyStructure = (structureType: TreatyStructureType) => {
    if (!selectedReinsuranceId) return;
    const newStructure = createNewTreatyStructure(structureType);
    handleUpdateReinsurance({
      treatyStructures: [...(selectedReinsurance?.treatyStructures || []), newStructure]
    });
    setSelectedTreatyStructureId(newStructure.id);
  };

  const handleDeleteTreatyStructure = (structureId: string) => {
    if (!selectedReinsuranceId) return;
    const updatedStructures = selectedReinsurance?.treatyStructures.filter(ts => ts.id !== structureId) || [];
    handleUpdateReinsurance({
      treatyStructures: updatedStructures
    });
    if (selectedTreatyStructureId === structureId) {
      setSelectedTreatyStructureId(updatedStructures.length > 0 ? updatedStructures[0].id : null);
    }
  };

  const handleUpdateTreatyStructure = (updates: Partial<TreatyStructure>) => {
    if (!selectedReinsuranceId || !selectedTreatyStructureId) return;
    handleUpdateReinsurance({
      treatyStructures: selectedReinsurance?.treatyStructures.map(ts =>
        ts.id === selectedTreatyStructureId ? { ...ts, ...updates } : ts
      ) || []
    });
  };

  const handleAddFromExistingReinsurance = (reinsuranceId: string) => {
    const existingReinsurance = reinsurances.find(r => r.id === reinsuranceId);
    if (!existingReinsurance) return;

    // Create a copy with a new ID
    const newReinsurance: Reinsurance = {
      ...existingReinsurance,
      id: generateId(),
      treatyName: existingReinsurance.treatyName || "",
      treatyCode: existingReinsurance.treatyCode || "",
      treatyStructures: existingReinsurance.treatyStructures.map(ts => ({
        ...ts,
        id: generateStructureId(),
        name: ts.name || undefined
      }))
    };

    setReinsurances([...reinsurances, newReinsurance]);
    setSelectedReinsuranceId(newReinsurance.id);
  };

  const handleToggleReinsuranceSelection = (reinsuranceId: string) => {
    setSelectedReinsuranceIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reinsuranceId)) {
        newSet.delete(reinsuranceId);
      } else {
        newSet.add(reinsuranceId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!productId) {
      toast({
        title: "Error",
        description: "Product ID is required to save reinsurance setup",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      // TODO: Implement API call to save reinsurance setup
      // await saveReinsuranceSetup(productId, reinsurances);

      toast({
        title: "Reinsurance Setup Saved",
        description: `Reinsurance setup for ${productName}${productVersion ? ` - Version ${productVersion}` : ''} has been saved successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save reinsurance setup",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate total cession percent for selected treaty structure
  useEffect(() => {
    if (selectedTreatyStructure) {
      const total = selectedTreatyStructure.reinsurancePanel.reduce((sum, p) => sum + p.sharePercent, 0);
      handleUpdateTreatyStructure({ totalCessionPercent: total });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTreatyStructure?.reinsurancePanel]);

  // Auto-select first treaty structure when reinsurance is selected
  useEffect(() => {
    if (selectedReinsurance && selectedReinsurance.treatyStructures.length > 0) {
      if (!selectedTreatyStructureId || !selectedReinsurance.treatyStructures.find(ts => ts.id === selectedTreatyStructureId)) {
        setSelectedTreatyStructureId(selectedReinsurance.treatyStructures[0].id);
      }
    } else {
      setSelectedTreatyStructureId(null);
    }
  }, [selectedReinsuranceId, selectedReinsurance?.treatyStructures]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reinsurance Setup</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {productName}{productVersion ? ` - Version ${productVersion}` : ''}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Reinsurance List */}
        <div className="w-80 border-r bg-muted/30 p-4 overflow-y-auto">
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Reinsurance Programs</h2>
              <Button onClick={handleAddReinsurance} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
            <Select
              onValueChange={(value: string) => {
                if (value.startsWith('existing_')) {
                  handleAddFromExistingReinsurance(value.replace('existing_', ''));
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Add from existing reinsurance" />
              </SelectTrigger>
              <SelectContent>
                {reinsurances.length > 0 ? (
                  reinsurances.map((reinsurance) => (
                    <SelectItem key={reinsurance.id} value={`existing_${reinsurance.id}`}>
                      {reinsurance.treatyName || `Reinsurance ${reinsurance.id.slice(-6)}`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No existing reinsurances</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            {reinsurances.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No reinsurance programs. Click "Add" to create one.
              </div>
            ) : (
              reinsurances.map((reinsurance) => (
                <Card
                  key={reinsurance.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedReinsuranceId === reinsurance.id ? "border-primary bg-primary/5" : ""
                  )}
                  onClick={() => setSelectedReinsuranceId(reinsurance.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedReinsuranceIds.has(reinsurance.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleReinsuranceSelection(reinsurance.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {reinsurance.treatyName || `Reinsurance ${reinsurance.id.slice(-6)}`}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {reinsurance.treatyCode || "No code"}
                        </div>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {reinsurance.reinsuranceType}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReinsurance(reinsurance.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedReinsurance ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select or create a reinsurance program to configure
            </div>
          ) : (
            <div className="w-full px-4 space-y-6">
              {/* Reinsurance Program Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Reinsurance Program Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label>Reinsurance Type</Label>
                      <Select
                        value={selectedReinsurance.reinsuranceType}
                        onValueChange={(value: ReinsuranceType) => handleUpdateReinsurance({ reinsuranceType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Treaty">Treaty</SelectItem>
                          <SelectItem value="Facultative">Facultative</SelectItem>
                          <SelectItem value="Both (Hybrid)">Both (Hybrid)</SelectItem>
                          <SelectItem value="None">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Program Effective Period</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !selectedReinsurance.startDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedReinsurance.startDate ? (
                                format(selectedReinsurance.startDate, "dd-MM-yyyy")
                              ) : (
                                <span>Start Date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={selectedReinsurance.startDate || undefined}
                              onSelect={(date) => handleUpdateReinsurance({ startDate: date || null })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !selectedReinsurance.endDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedReinsurance.endDate ? (
                                format(selectedReinsurance.endDate, "dd-MM-yyyy")
                              ) : (
                                <span>End Date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={selectedReinsurance.endDate || undefined}
                              onSelect={(date) => handleUpdateReinsurance({ endDate: date || null })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label>Treaty Name</Label>
                      <Input
                        value={selectedReinsurance.treatyName}
                        onChange={(e) => handleUpdateReinsurance({ treatyName: e.target.value })}
                        placeholder="e.g., 2025 Motor XOL T1"
                      />
                    </div>
                    <div>
                      <Label>Treaty Code</Label>
                      <Input
                        value={selectedReinsurance.treatyCode}
                        onChange={(e) => handleUpdateReinsurance({ treatyCode: e.target.value })}
                        placeholder="e.g., PROP-QS-2025"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Treaty Structure */}
              {(selectedReinsurance.reinsuranceType === "Treaty" || selectedReinsurance.reinsuranceType === "Both (Hybrid)") && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Treaty Structure</CardTitle>
                      <Select
                        onValueChange={(value: TreatyStructureType) => handleAddTreatyStructure(value)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Add Structure Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Quota Share (QS)">Add Quota Share (QS)</SelectItem>
                          <SelectItem value="Surplus">Add Surplus</SelectItem>
                          <SelectItem value="Excess of Loss (XOL)">Add Excess of Loss (XOL)</SelectItem>
                          <SelectItem value="Stop Loss">Add Stop Loss</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {selectedReinsurance.treatyStructures.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No treaty structures. Add one using the dropdown above.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Treaty Structures List */}
                        <div className="space-y-2">
                          {selectedReinsurance.treatyStructures.map((structure) => (
                            <Card
                              key={structure.id}
                              className={cn(
                                "cursor-pointer transition-colors",
                                selectedTreatyStructureId === structure.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                              )}
                              onClick={() => setSelectedTreatyStructureId(structure.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-semibold text-base">
                                        {structure.name || structure.structureType}
                                      </h4>
                                      {structure.name && (
                                        <Badge variant="outline" className="text-xs">
                                          {structure.structureType}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                                      {structure.structureType === "Quota Share (QS)" && (
                                        <>
                                          <div>Share: {structure.quotaSharePercent}%</div>
                                          <div>Retention: {structure.retentionPercent}%</div>
                                          {structure.cedingCommissionPercent > 0 && (
                                            <div>Commission: {structure.cedingCommissionPercent}%</div>
                                          )}
                                        </>
                                      )}
                                      {structure.structureType === "Surplus" && (
                                        <>
                                          <div>Lines: {structure.surplusLines}</div>
                                          <div>Retention: {structure.surplusRetentionLimit.toLocaleString()}</div>
                                        </>
                                      )}
                                      {structure.structureType === "Excess of Loss (XOL)" && (
                                        <>
                                          <div>Limit: {structure.xolLimitPerOccurrence.toLocaleString()}</div>
                                          <div>Deductible: {structure.xolDeductible.toLocaleString()}</div>
                                        </>
                                      )}
                                      {structure.structureType === "Stop Loss" && (
                                        <>
                                          <div>Attachment: {structure.stopLossAttachment}%</div>
                                          <div>Detachment: {structure.stopLossDetachment}%</div>
                                        </>
                                      )}
                                      {structure.reinsurancePanel.length > 0 && (
                                        <div>Panel Members: {structure.reinsurancePanel.length}</div>
                                      )}
                                      {structure.totalCessionPercent > 0 && (
                                        <div className={cn(
                                          "font-medium",
                                          structure.totalCessionPercent === 100 ? "text-green-600" : "text-orange-600"
                                        )}>
                                          Total Cession: {structure.totalCessionPercent.toFixed(1)}%
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTreatyStructure(structure.id);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {/* Selected Treaty Structure Configuration */}
                        {selectedTreatyStructure && (
                          <div className="border rounded-lg overflow-hidden">
                            <div className="flex">
                              {/* Vertical Navigation Sidebar */}
                              <div className="w-48 border-r bg-muted/30 flex flex-col">
                                <div className="p-4 border-b">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-sm">
                                      {selectedTreatyStructure.structureType}
                                    </h4>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs">Name:</Label>
                                    <Input
                                      value={selectedTreatyStructure.name || ""}
                                      onChange={(e) => handleUpdateTreatyStructure({ name: e.target.value })}
                                      placeholder="e.g., Layer 1"
                                      className="w-full h-7 text-xs"
                                    />
                                  </div>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                  <nav className="p-2 space-y-1">
                                    <button
                                      onClick={() => setActiveTreatySection("general")}
                                      className={cn(
                                        "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2",
                                        activeTreatySection === "general"
                                          ? "bg-primary text-primary-foreground font-medium"
                                          : "hover:bg-muted"
                                      )}
                                    >
                                      {activeTreatySection === "general" && (
                                        <div className="w-1 h-4 bg-primary-foreground rounded-r" />
                                      )}
                                      <span>General Treaty Settings</span>
                                    </button>
                                    <button
                                      onClick={() => setActiveTreatySection("structure")}
                                      className={cn(
                                        "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2",
                                        activeTreatySection === "structure"
                                          ? "bg-primary text-primary-foreground font-medium"
                                          : "hover:bg-muted"
                                      )}
                                    >
                                      {activeTreatySection === "structure" && (
                                        <div className="w-1 h-4 bg-primary-foreground rounded-r" />
                                      )}
                                      <span>Structure Type Settings</span>
                                    </button>
                                    <button
                                      onClick={() => setActiveTreatySection("capacity")}
                                      className={cn(
                                        "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2",
                                        activeTreatySection === "capacity"
                                          ? "bg-primary text-primary-foreground font-medium"
                                          : "hover:bg-muted"
                                      )}
                                    >
                                      {activeTreatySection === "capacity" && (
                                        <div className="w-1 h-4 bg-primary-foreground rounded-r" />
                                      )}
                                      <span>Capacity & Panel Setup</span>
                                    </button>
                                    <button
                                      onClick={() => setActiveTreatySection("commission")}
                                      className={cn(
                                        "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2",
                                        activeTreatySection === "commission"
                                          ? "bg-primary text-primary-foreground font-medium"
                                          : "hover:bg-muted"
                                      )}
                                    >
                                      {activeTreatySection === "commission" && (
                                        <div className="w-1 h-4 bg-primary-foreground rounded-r" />
                                      )}
                                      <span>Commission & Financial</span>
                                    </button>
                                    <button
                                      onClick={() => setActiveTreatySection("claims")}
                                      className={cn(
                                        "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2",
                                        activeTreatySection === "claims"
                                          ? "bg-primary text-primary-foreground font-medium"
                                          : "hover:bg-muted"
                                      )}
                                    >
                                      {activeTreatySection === "claims" && (
                                        <div className="w-1 h-4 bg-primary-foreground rounded-r" />
                                      )}
                                      <span>Claims & Recoveries</span>
                                    </button>
                                    <button
                                      onClick={() => setActiveTreatySection("documentation")}
                                      className={cn(
                                        "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2",
                                        activeTreatySection === "documentation"
                                          ? "bg-primary text-primary-foreground font-medium"
                                          : "hover:bg-muted"
                                      )}
                                    >
                                      {activeTreatySection === "documentation" && (
                                        <div className="w-1 h-4 bg-primary-foreground rounded-r" />
                                      )}
                                      <span>Documentation</span>
                                    </button>
                                  </nav>
                                </div>
                              </div>

                              {/* Main Content Area */}
                              <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[600px]">
                                {/* General Treaty Settings */}
                                {activeTreatySection === "general" && (
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-lg mb-4">General Treaty Settings</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Treaty Structure Type</Label>
                                        <div className="mt-2 p-3 border rounded-md bg-muted/50">
                                          <Badge variant="outline">{selectedTreatyStructure.structureType}</Badge>
                                        </div>
                                      </div>
                                      <div>
                                        <Label>Structure Name</Label>
                                        <Input
                                          value={selectedTreatyStructure.name || ""}
                                          onChange={(e) => handleUpdateTreatyStructure({ name: e.target.value })}
                                          placeholder="e.g., Layer 1, Primary QS"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Notes / Description</Label>
                                      <Textarea
                                        placeholder="Add any notes or description for this treaty structure"
                                        rows={4}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Structure Type Settings */}
                                {activeTreatySection === "structure" && (
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-lg mb-4">Structure Type Settings</h4>

                                    {/* Quota Share Settings */}
                                    {selectedTreatyStructure.structureType === "Quota Share (QS)" && (
                                      <div className="space-y-4 border-l-4 border-primary pl-4">
                                        <h4 className="font-semibold">Quota Share Settings</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label>Share % (ceded)</Label>
                                            <Input
                                              type="number"
                                              value={selectedTreatyStructure.quotaSharePercent}
                                              onChange={(e) => handleUpdateTreatyStructure({ quotaSharePercent: parseFloat(e.target.value) || 0 })}
                                              placeholder="e.g., 30"
                                            />
                                          </div>
                                          <div>
                                            <Label>Retention % (net)</Label>
                                            <Input
                                              type="number"
                                              value={selectedTreatyStructure.retentionPercent}
                                              onChange={(e) => handleUpdateTreatyStructure({ retentionPercent: parseFloat(e.target.value) || 0 })}
                                              placeholder="Auto-calc or input"
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <Label>Max Treaty Capacity</Label>
                                          <Input
                                            type="number"
                                            value={selectedTreatyStructure.maxTreatyCapacity}
                                            onChange={(e) => handleUpdateTreatyStructure({ maxTreatyCapacity: parseFloat(e.target.value) || 0 })}
                                            placeholder="e.g., 5000000"
                                          />
                                        </div>
                                        <div>
                                          <Label>Ceding Commission Type</Label>
                                          <Select
                                            value={selectedTreatyStructure.cedingCommissionType}
                                            onValueChange={(value: CedingCommissionType) => handleUpdateTreatyStructure({ cedingCommissionType: value })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="Flat">Flat</SelectItem>
                                              <SelectItem value="Sliding Scale">Sliding Scale</SelectItem>
                                              <SelectItem value="Profit Commission">Profit Commission</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div>
                                          <Label>Ceding Commission % / Range</Label>
                                          <Input
                                            type="number"
                                            value={selectedTreatyStructure.cedingCommissionPercent}
                                            onChange={(e) => handleUpdateTreatyStructure({ cedingCommissionPercent: parseFloat(e.target.value) || 0 })}
                                          />
                                        </div>
                                        {selectedTreatyStructure.cedingCommissionType === "Profit Commission" && (
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label>Min PC %</Label>
                                              <Input
                                                type="number"
                                                value={selectedTreatyStructure.profitCommissionMin}
                                                onChange={(e) => handleUpdateTreatyStructure({ profitCommissionMin: parseFloat(e.target.value) || 0 })}
                                              />
                                            </div>
                                            <div>
                                              <Label>Max PC %</Label>
                                              <Input
                                                type="number"
                                                value={selectedTreatyStructure.profitCommissionMax}
                                                onChange={(e) => handleUpdateTreatyStructure({ profitCommissionMax: parseFloat(e.target.value) || 0 })}
                                              />
                                            </div>
                                          </div>
                                        )}
                                        <div>
                                          <Label>LR Trigger Levels</Label>
                                          <Input
                                            value={selectedTreatyStructure.lrTriggerLevels}
                                            onChange={(e) => handleUpdateTreatyStructure({ lrTriggerLevels: e.target.value })}
                                            placeholder="Enter loss ratio trigger levels"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Surplus Settings */}
                                    {selectedTreatyStructure.structureType === "Surplus" && (
                                      <div className="space-y-4 border-l-4 border-primary pl-4">
                                        <h4 className="font-semibold">Surplus Settings</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label>Number of Lines</Label>
                                            <Input
                                              type="number"
                                              value={selectedTreatyStructure.surplusLines}
                                              onChange={(e) => handleUpdateTreatyStructure({ surplusLines: parseInt(e.target.value) || 0 })}
                                              placeholder="e.g., 4"
                                            />
                                          </div>
                                          <div>
                                            <Label>Retention Limit (AED/USD)</Label>
                                            <Input
                                              type="number"
                                              value={selectedTreatyStructure.surplusRetentionLimit}
                                              onChange={(e) => handleUpdateTreatyStructure({ surplusRetentionLimit: parseFloat(e.target.value) || 0 })}
                                            />
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label>Max Capacity Provided by Treaty</Label>
                                            <Input
                                              type="number"
                                              value={selectedTreatyStructure.surplusMaxCapacity}
                                              onChange={(e) => handleUpdateTreatyStructure({ surplusMaxCapacity: parseFloat(e.target.value) || 0 })}
                                            />
                                          </div>
                                          <div>
                                            <Label>Ceding Commission %</Label>
                                            <Input
                                              type="number"
                                              value={selectedTreatyStructure.surplusCedingCommission}
                                              onChange={(e) => handleUpdateTreatyStructure({ surplusCedingCommission: parseFloat(e.target.value) || 0 })}
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <Label>Max Treaty Capacity</Label>
                                          <Input
                                            type="number"
                                            value={selectedTreatyStructure.surplusMaxTreatyCapacity}
                                            onChange={(e) => handleUpdateTreatyStructure({ surplusMaxTreatyCapacity: parseFloat(e.target.value) || 0 })}
                                            placeholder="e.g., 10000000"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* XOL Settings */}
                                    {selectedTreatyStructure.structureType === "Excess of Loss (XOL)" && (
                                      <div className="space-y-4 border-l-4 border-primary pl-4">
                                        <h4 className="font-semibold">XOL (Excess of Loss) Settings</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label>Limit per Occurrence</Label>
                                            <Input
                                              type="number"
                                              value={selectedTreatyStructure.xolLimitPerOccurrence}
                                              onChange={(e) => handleUpdateTreatyStructure({ xolLimitPerOccurrence: parseFloat(e.target.value) || 0 })}
                                            />
                                          </div>
                                          <div>
                                            <Label>Deductible / Retention per Occurrence</Label>
                                            <Input
                                              type="number"
                                              value={selectedTreatyStructure.xolDeductible}
                                              onChange={(e) => handleUpdateTreatyStructure({ xolDeductible: parseFloat(e.target.value) || 0 })}
                                            />
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label>Aggregate Limit</Label>
                                            <Input
                                              type="number"
                                              value={selectedTreatyStructure.xolAggregateLimit}
                                              onChange={(e) => handleUpdateTreatyStructure({ xolAggregateLimit: parseFloat(e.target.value) || 0 })}
                                            />
                                          </div>
                                          <div>
                                            <Label>Reinstatements (Number)</Label>
                                            <Input
                                              type="number"
                                              value={selectedTreatyStructure.xolReinstatements}
                                              onChange={(e) => handleUpdateTreatyStructure({ xolReinstatements: parseInt(e.target.value) || 0 })}
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <Label>Reinstatement Premium Type</Label>
                                          <Select
                                            value={selectedTreatyStructure.xolReinstatementPremiumType}
                                            onValueChange={(value: ReinstatementPremiumType) => handleUpdateTreatyStructure({ xolReinstatementPremiumType: value })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="Pro-rata">Pro-rata</SelectItem>
                                              <SelectItem value="Fixed">Fixed</SelectItem>
                                              <SelectItem value="Sliding">Sliding</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    )}

                                    {/* Stop Loss Settings */}
                                    {selectedTreatyStructure.structureType === "Stop Loss" && (
                                      <div className="space-y-4 border-l-4 border-primary pl-4">
                                        <h4 className="font-semibold">Stop Loss Settings</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label>Loss Ratio Attachment (e.g., 70%)</Label>
                                            <Input
                                              type="number"
                                              value={selectedTreatyStructure.stopLossAttachment}
                                              onChange={(e) => handleUpdateTreatyStructure({ stopLossAttachment: parseFloat(e.target.value) || 0 })}
                                            />
                                          </div>
                                          <div>
                                            <Label>Loss Ratio Detachment (e.g., 150%)</Label>
                                            <Input
                                              type="number"
                                              value={selectedTreatyStructure.stopLossDetachment}
                                              onChange={(e) => handleUpdateTreatyStructure({ stopLossDetachment: parseFloat(e.target.value) || 0 })}
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <Label>Premium Base</Label>
                                          <Select
                                            value={selectedTreatyStructure.stopLossPremiumBase}
                                            onValueChange={(value: PremiumBase) => handleUpdateTreatyStructure({ stopLossPremiumBase: value })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select base" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="Net Earned Premium">Net Earned Premium</SelectItem>
                                              <SelectItem value="Gross Earned Premium">Gross Earned Premium</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Capacity & Panel Setup */}
                                {activeTreatySection === "capacity" && (
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-lg mb-4">Capacity & Panel Setup</h4>
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <Label>Reinsurance Panel</Label>
                                        <Button onClick={handleAddPanelMember} size="sm" className="gap-2">
                                          <Plus className="w-4 h-4" />
                                          Add Member
                                        </Button>
                                      </div>
                                      {selectedTreatyStructure.reinsurancePanel.length === 0 ? (
                                        <div className="text-sm text-muted-foreground text-center py-4">
                                          No panel members. Click "Add Member" to add one.
                                        </div>
                                      ) : (
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Reinsurer Name</TableHead>
                                              <TableHead>Rating</TableHead>
                                              <TableHead>Share %</TableHead>
                                              <TableHead>Lead?</TableHead>
                                              <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {selectedTreatyStructure.reinsurancePanel.map((panel) => (
                                              <TableRow key={panel.id}>
                                                <TableCell>
                                                  <Input
                                                    value={panel.reinsurerName}
                                                    onChange={(e) => handleUpdatePanelMember(panel.id, { reinsurerName: e.target.value })}
                                                    placeholder="Reinsurer name"
                                                    className="w-full"
                                                  />
                                                </TableCell>
                                                <TableCell>
                                                  <Input
                                                    value={panel.rating}
                                                    onChange={(e) => handleUpdatePanelMember(panel.id, { rating: e.target.value })}
                                                    placeholder="S&P/AM Best/Moody's"
                                                    className="w-full"
                                                  />
                                                </TableCell>
                                                <TableCell>
                                                  <Input
                                                    type="number"
                                                    value={panel.sharePercent}
                                                    onChange={(e) => handleUpdatePanelMember(panel.id, { sharePercent: parseFloat(e.target.value) || 0 })}
                                                    className="w-full"
                                                  />
                                                </TableCell>
                                                <TableCell>
                                                  <Switch
                                                    checked={panel.isLead}
                                                    onCheckedChange={(checked) => handleUpdatePanelMember(panel.id, { isLead: checked })}
                                                  />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeletePanelMember(panel.id)}
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </Button>
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      )}
                                      <div className="flex items-center justify-between pt-2 border-t">
                                        <Label className="font-semibold">Total Cession %</Label>
                                        <Badge variant={selectedTreatyStructure.totalCessionPercent === 100 ? "default" : "destructive"}>
                                          {selectedTreatyStructure.totalCessionPercent.toFixed(2)}%
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Commission & Financial Conditions */}
                                {activeTreatySection === "commission" && (
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-lg mb-4">Commission, Premium, & Financial Conditions</h4>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label>Brokerage % (treaty brokerage)</Label>
                                          <Input
                                            type="number"
                                            value={selectedTreatyStructure.brokeragePercent}
                                            onChange={(e) => handleUpdateTreatyStructure({ brokeragePercent: parseFloat(e.target.value) || 0 })}
                                          />
                                        </div>
                                        <div>
                                          <Label>Override / Fronting Fee %</Label>
                                          <Input
                                            type="number"
                                            value={selectedTreatyStructure.overrideFrontingFeePercent}
                                            onChange={(e) => handleUpdateTreatyStructure({ overrideFrontingFeePercent: parseFloat(e.target.value) || 0 })}
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <Label>Premium Portfolio Adjustment Rules</Label>
                                        <Select
                                          value={selectedTreatyStructure.premiumPortfolioAdjustment}
                                          onValueChange={(value: "Quarterly" | "Annual" | "") => handleUpdateTreatyStructure({ premiumPortfolioAdjustment: value })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Quarterly">Quarterly</SelectItem>
                                            <SelectItem value="Annual">Annual</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label>Deposit Premium Rules</Label>
                                        <Textarea
                                          value={selectedTreatyStructure.depositPremiumRules}
                                          onChange={(e) => handleUpdateTreatyStructure({ depositPremiumRules: e.target.value })}
                                          placeholder="Enter deposit premium rules"
                                          rows={3}
                                        />
                                      </div>
                                      <div className="border-t pt-4">
                                        <Label className="text-base font-semibold mb-2 block">Loss Portfolio Transfer</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label>Amount</Label>
                                            <Input
                                              type="number"
                                              value={selectedTreatyStructure.lossPortfolioTransferAmount}
                                              onChange={(e) => handleUpdateTreatyStructure({ lossPortfolioTransferAmount: parseFloat(e.target.value) || 0 })}
                                            />
                                          </div>
                                          <div>
                                            <Label>%</Label>
                                            <Input
                                              type="number"
                                              value={selectedTreatyStructure.lossPortfolioTransferPercent}
                                              onChange={(e) => handleUpdateTreatyStructure({ lossPortfolioTransferPercent: parseFloat(e.target.value) || 0 })}
                                            />
                                          </div>
                                        </div>
                                        <div className="mt-4">
                                          <Label>Effective Date</Label>
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <Button
                                                variant="outline"
                                                className={cn(
                                                  "w-full justify-start text-left font-normal",
                                                  !selectedTreatyStructure.lossPortfolioTransferDate && "text-muted-foreground"
                                                )}
                                              >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {selectedTreatyStructure.lossPortfolioTransferDate ? (
                                                  format(selectedTreatyStructure.lossPortfolioTransferDate, "dd-MM-yyyy")
                                                ) : (
                                                  <span>Select date</span>
                                                )}
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                              <Calendar
                                                mode="single"
                                                selected={selectedTreatyStructure.lossPortfolioTransferDate || undefined}
                                                onSelect={(date) => handleUpdateTreatyStructure({ lossPortfolioTransferDate: date || null })}
                                                initialFocus
                                              />
                                            </PopoverContent>
                                          </Popover>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Claims & Recoveries Rules */}
                                {activeTreatySection === "claims" && (
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-lg mb-4">Claims & Recoveries Rules</h4>
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Claims Notification Rules</Label>
                                        <Textarea
                                          placeholder="Define rules for claims notification to reinsurers"
                                          rows={3}
                                        />
                                      </div>
                                      <div>
                                        <Label>Recovery Process Rules</Label>
                                        <Textarea
                                          placeholder="Define rules for recovery process and procedures"
                                          rows={3}
                                        />
                                      </div>
                                      <div>
                                        <Label>Claims Settlement Rules</Label>
                                        <Textarea
                                          placeholder="Define rules for claims settlement with reinsurers"
                                          rows={3}
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label>Claims Reporting Frequency</Label>
                                          <Select>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select frequency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="monthly">Monthly</SelectItem>
                                              <SelectItem value="quarterly">Quarterly</SelectItem>
                                              <SelectItem value="annually">Annually</SelectItem>
                                              {/* <SelectItem value="as-needed">As Needed</SelectItem> */}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div>
                                          <Label>Recovery Time Limit (Days)</Label>
                                          <Input
                                            type="number"
                                            placeholder="e.g., 30, 60, 90"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Documentation & Attachments */}
                                {activeTreatySection === "documentation" && (
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-lg mb-4">Documentation & Attachments</h4>
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Treaty Document Upload</Label>
                                        <div className="flex items-center gap-2 mt-2">
                                          <Input
                                            value={selectedTreatyStructure.treatyDocumentUrl}
                                            onChange={(e) => handleUpdateTreatyStructure({ treatyDocumentUrl: e.target.value })}
                                            placeholder="PDF / version control"
                                            className="flex-1"
                                          />
                                          <Button variant="outline" size="icon">
                                            <Upload className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                      <div>
                                        <Label>Slip Upload (for FAC)</Label>
                                        <div className="flex items-center gap-2 mt-2">
                                          <Input
                                            value={selectedTreatyStructure.slipUrl}
                                            onChange={(e) => handleUpdateTreatyStructure({ slipUrl: e.target.value })}
                                            placeholder="Upload slip"
                                            className="flex-1"
                                          />
                                          <Button variant="outline" size="icon">
                                            <Upload className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                      <div>
                                        <Label>Underwriting Guidelines Link</Label>
                                        <Input
                                          value={selectedTreatyStructure.underwritingGuidelinesLink}
                                          onChange={(e) => handleUpdateTreatyStructure({ underwritingGuidelinesLink: e.target.value })}
                                          placeholder="URL or link"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}


              {/* Retention Parameters */}
              <Card>
                <CardHeader>
                  <CardTitle>Retention Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Company Retention (per risk) - Amount</Label>
                      <Input
                        type="number"
                        value={selectedReinsurance.companyRetentionPerRisk}
                        onChange={(e) => handleUpdateReinsurance({ companyRetentionPerRisk: parseFloat(e.target.value) || 0 })}
                        placeholder="AED/USD"
                      />
                    </div>
                    <div>
                      <Label>Company Retention (per risk) - Percentage (optional)</Label>
                      <Input
                        type="number"
                        value={selectedReinsurance.companyRetentionPerRiskPercent}
                        onChange={(e) => handleUpdateReinsurance({ companyRetentionPerRiskPercent: parseFloat(e.target.value) || 0 })}
                        placeholder="%"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Company Retention (per event / CAT retention)</Label>
                    <Input
                      type="number"
                      value={selectedReinsurance.companyRetentionPerEvent}
                      onChange={(e) => handleUpdateReinsurance({ companyRetentionPerEvent: parseFloat(e.target.value) || 0 })}
                      placeholder="AED/USD"
                    />
                  </div>
                  <div>
                    <Label>Maximum Net Line</Label>
                    <Input
                      type="number"
                      value={selectedReinsurance.maximumNetLine}
                      onChange={(e) => handleUpdateReinsurance({ maximumNetLine: parseFloat(e.target.value) || 0 })}
                      placeholder="AED/USD"
                    />
                  </div>
                </CardContent>
              </Card>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReinsuranceSetup;

