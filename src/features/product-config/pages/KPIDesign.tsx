import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { formatDateDDMMYYYY } from '@/shared/utils/date-format';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Plus, Trash2, BarChart3, Gauge, PieChart, TrendingUp, Grid3x3, Calculator, GripVertical, X, Edit } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollableTabs } from "@/components/ui/ScrollableTabs";

// Types
interface DataSource {
  id: string;
  name: string;
  label: string;
  fields: DataSourceField[];
}

interface DataSourceField {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "date" | "boolean" | "dropdown";
}

interface FormulaStep {
  id: string;
  type: "field" | "aggregate" | "operator" | "number" | "function" | "if";
  value: string;
  label?: string;
  params?: any;
}

interface Filter {
  id: string;
  fieldId: string;
  operator: "equals" | "notEquals" | "greaterThan" | "lessThan" | "contains" | "in" | "between";
  value: string | string[] | { min: string; max: string };
}

interface KPI {
  id: string;
  name: string;
  description?: string;
  dataSourceId: string;
  baseMetric: {
    type: "count" | "sum" | "average" | "min" | "max" | "custom";
    fieldId?: string;
  };
  filters: Filter[];
  formula: FormulaStep[];
  visualizationType: "card" | "line" | "bar" | "pie" | "gauge" | "trend" | "heatmap";
  conditionalLogic?: {
    condition: string;
    trueValue: string;
    falseValue: string;
  };
  createdAt: string;
  updatedAt: string;
}

const KPIDesign = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const productName = searchParams.get("productName") || "Product";
  const productVersion = searchParams.get("productVersion") || "";

  // Data Sources
  const [dataSources] = useState<DataSource[]>([
    {
      id: "quotes",
      name: "quotes",
      label: "Quotes",
      fields: [
        { id: "quoteId", name: "quoteId", label: "Quote ID", type: "text" },
        { id: "status", name: "status", label: "Status", type: "dropdown" },
        { id: "premium", name: "premium", label: "Premium", type: "number" },
        { id: "product", name: "product", label: "Product", type: "text" },
        { id: "createdDate", name: "createdDate", label: "Created Date", type: "date" },
        { id: "converted", name: "converted", label: "Converted", type: "boolean" },
      ],
    },
    {
      id: "policies",
      name: "policies",
      label: "Policies",
      fields: [
        { id: "policyId", name: "policyId", label: "Policy ID", type: "text" },
        { id: "status", name: "status", label: "Status", type: "dropdown" },
        { id: "premium", name: "premium", label: "Premium", type: "number" },
        { id: "product", name: "product", label: "Product", type: "text" },
        { id: "policyType", name: "policyType", label: "Policy Type", type: "dropdown" },
        { id: "startDate", name: "startDate", label: "Start Date", type: "date" },
        { id: "endDate", name: "endDate", label: "End Date", type: "date" },
      ],
    },
    {
      id: "claims",
      name: "claims",
      label: "Claims",
      fields: [
        { id: "claimId", name: "claimId", label: "Claim ID", type: "text" },
        { id: "status", name: "status", label: "Status", type: "dropdown" },
        { id: "amount", name: "amount", label: "Amount", type: "number" },
        { id: "paidAmount", name: "paidAmount", label: "Paid Amount", type: "number" },
        { id: "product", name: "product", label: "Product", type: "text" },
        { id: "claimDate", name: "claimDate", label: "Claim Date", type: "date" },
      ],
    },
    {
      id: "endorsements",
      name: "endorsements",
      label: "Endorsements",
      fields: [
        { id: "endorsementId", name: "endorsementId", label: "Endorsement ID", type: "text" },
        { id: "type", name: "type", label: "Type", type: "dropdown" },
        { id: "premium", name: "premium", label: "Premium", type: "number" },
        { id: "effectiveDate", name: "effectiveDate", label: "Effective Date", type: "date" },
      ],
    },
    {
      id: "payments",
      name: "payments",
      label: "Payments",
      fields: [
        { id: "paymentId", name: "paymentId", label: "Payment ID", type: "text" },
        { id: "amount", name: "amount", label: "Amount", type: "number" },
        { id: "status", name: "status", label: "Status", type: "dropdown" },
        { id: "paymentDate", name: "paymentDate", label: "Payment Date", type: "date" },
      ],
    },
    {
      id: "uwDecisions",
      name: "uwDecisions",
      label: "UW Decisions",
      fields: [
        { id: "decisionId", name: "decisionId", label: "Decision ID", type: "text" },
        { id: "decision", name: "decision", label: "Decision", type: "dropdown" },
        { id: "underwriter", name: "underwriter", label: "Underwriter", type: "text" },
        { id: "decisionDate", name: "decisionDate", label: "Decision Date", type: "date" },
      ],
    },
  ]);

  const [kpis, setKpis] = useState<KPI[]>([
    {
      id: "kpi1",
      name: "Conversion Rate",
      description: "Percentage of quotes converted to policies",
      dataSourceId: "quotes",
      baseMetric: { type: "count" },
      filters: [],
      formula: [
        { id: "step1", type: "aggregate", value: "count", label: "Count(Status='Converted')" },
        { id: "step2", type: "operator", value: "/" },
        { id: "step3", type: "aggregate", value: "count", label: "Count(All)" },
        { id: "step4", type: "operator", value: "*" },
        { id: "step5", type: "number", value: "100" },
      ],
      visualizationType: "gauge",
      createdAt: "2024-01-15",
      updatedAt: "2024-01-15",
    },
  ]);

  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);
  const [isAddKPIDialogOpen, setIsAddKPIDialogOpen] = useState(false);
  const [newKPIName, setNewKPIName] = useState("");
  const [newKPIDescription, setNewKPIDescription] = useState("");
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [currentStep, setCurrentStep] = useState<"dataSource" | "baseMetric" | "filters" | "formula" | "conditional" | "visualization">("dataSource");
  const [kpiBuilder, setKpiBuilder] = useState<Partial<KPI>>({
    baseMetric: { type: "count" },
    filters: [],
    formula: [],
  });
  const [draggedFormulaItem, setDraggedFormulaItem] = useState<string | null>(null);

  const handleAddKPI = () => {
    if (!newKPIName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a KPI name.",
        variant: "destructive",
      });
      return;
    }

    const newKPI: KPI = {
      id: `kpi-${Date.now()}`,
      name: newKPIName,
      description: newKPIDescription,
      dataSourceId: kpiBuilder.dataSourceId || dataSources[0].id,
      baseMetric: kpiBuilder.baseMetric || { type: "count" },
      filters: kpiBuilder.filters || [],
      formula: kpiBuilder.formula || [],
      visualizationType: kpiBuilder.visualizationType || "card",
      conditionalLogic: kpiBuilder.conditionalLogic,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    setKpis([...kpis, newKPI]);
    setIsAddKPIDialogOpen(false);
    setNewKPIName("");
    setNewKPIDescription("");
    setKpiBuilder({
      baseMetric: { type: "count" },
      filters: [],
      formula: [],
    });
    setCurrentStep("dataSource");
    setSelectedDataSource(null);
    toast({
      title: "KPI Created",
      description: `${newKPIName} has been created.`,
    });
  };

  const handleStartEditing = (kpi: KPI) => {
    setSelectedKPI(kpi);
    setKpiBuilder({
      dataSourceId: kpi.dataSourceId,
      baseMetric: kpi.baseMetric,
      filters: kpi.filters,
      formula: kpi.formula,
      visualizationType: kpi.visualizationType,
      conditionalLogic: kpi.conditionalLogic,
    });
    const ds = dataSources.find(d => d.id === kpi.dataSourceId);
    setSelectedDataSource(ds || null);
    setCurrentStep("dataSource");
  };

  const handleDragStart = (item: string) => {
    setDraggedFormulaItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropFormula = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedFormulaItem) return;

    const newStep: FormulaStep = {
      id: `step-${Date.now()}`,
      type: draggedFormulaItem.includes("(") ? "aggregate" : draggedFormulaItem.match(/[+\-*/]/) ? "operator" : draggedFormulaItem === "IF()" ? "if" : "number",
      value: draggedFormulaItem,
      label: draggedFormulaItem,
    };

    setKpiBuilder({
      ...kpiBuilder,
      formula: [...(kpiBuilder.formula || []), newStep],
    });
    setDraggedFormulaItem(null);
  };

  const handleRemoveFormulaStep = (stepId: string) => {
    setKpiBuilder({
      ...kpiBuilder,
      formula: (kpiBuilder.formula || []).filter(s => s.id !== stepId),
    });
  };

  const getVisualizationIcon = (type: string) => {
    switch (type) {
      case "card": return <BarChart3 className="w-4 h-4" />;
      case "line": return <TrendingUp className="w-4 h-4" />;
      case "bar": return <BarChart3 className="w-4 h-4" />;
      case "pie": return <PieChart className="w-4 h-4" />;
      case "gauge": return <Gauge className="w-4 h-4" />;
      case "trend": return <TrendingUp className="w-4 h-4" />;
      case "heatmap": return <Grid3x3 className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const renderFormulaBuilder = () => {
    const aggregates = ["Count()", "Sum()", "Average()", "Min()", "Max()"];
    const operators = ["+", "-", "*", "/", "%"];
    const functions = ["IF()", "ABS()", "ROUND()"];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Aggregates</Label>
            <div className="space-y-1">
              {aggregates.map((agg) => (
                <Badge
                  key={agg}
                  variant="outline"
                  className="w-full justify-start p-2 cursor-move hover:bg-primary/10"
                  draggable
                  onDragStart={() => handleDragStart(agg)}
                >
                  <GripVertical className="w-4 h-4 mr-2" />
                  {agg}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Operators</Label>
            <div className="space-y-1">
              {operators.map((op) => (
                <Badge
                  key={op}
                  variant="outline"
                  className="w-full justify-start p-2 cursor-move hover:bg-primary/10"
                  draggable
                  onDragStart={() => handleDragStart(op)}
                >
                  <GripVertical className="w-4 h-4 mr-2" />
                  {op}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Functions</Label>
            <div className="space-y-1">
              {functions.map((func) => (
                <Badge
                  key={func}
                  variant="outline"
                  className="w-full justify-start p-2 cursor-move hover:bg-primary/10"
                  draggable
                  onDragStart={() => handleDragStart(func)}
                >
                  <GripVertical className="w-4 h-4 mr-2" />
                  {func}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {selectedDataSource && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Fields from {selectedDataSource.label}</Label>
            <div className="grid grid-cols-2 gap-2">
              {selectedDataSource.fields.map((field) => (
                <Badge
                  key={field.id}
                  variant="secondary"
                  className="w-full justify-start p-2 cursor-move hover:bg-primary/10"
                  draggable
                  onDragStart={() => handleDragStart(field.name)}
                >
                  <GripVertical className="w-4 h-4 mr-2" />
                  {field.label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Formula Builder</Label>
          <div
            className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 min-h-[100px] bg-muted/5"
            onDragOver={handleDragOver}
            onDrop={handleDropFormula}
          >
            {kpiBuilder.formula && kpiBuilder.formula.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {kpiBuilder.formula.map((step) => (
                  <Badge
                    key={step.id}
                    variant="default"
                    className="cursor-pointer"
                    onClick={() => handleRemoveFormulaStep(step.id)}
                  >
                    {step.label || step.value}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                Drag and drop items here to build formula
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
            <h1 className="text-2xl font-bold text-foreground">KPI Design</h1>
            <p className="text-sm text-muted-foreground">
              {productName} {productVersion ? `v${productVersion}` : ""}
            </p>
          </div>
        </div>
        <Button onClick={() => {
          toast({
            title: "Saved",
            description: "KPIs have been saved.",
          });
        }}>
          <Save className="w-4 h-4 mr-2" />
          Save KPIs
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left Sidebar - KPIs List */}
        <div className="w-80 border-r bg-muted/20 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">KPIs</h2>
            <Button
              size="sm"
              onClick={() => {
                setSelectedKPI(null);
                setKpiBuilder({
                  baseMetric: { type: "count" },
                  filters: [],
                  formula: [],
                });
                setCurrentStep("dataSource");
                setSelectedDataSource(null);
                setIsAddKPIDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {kpis.map((kpi) => (
              <Card
                key={kpi.id}
                className={`cursor-pointer transition-colors ${
                  selectedKPI?.id === kpi.id ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => handleStartEditing(kpi)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{kpi.name}</CardTitle>
                    {getVisualizationIcon(kpi.visualizationType)}
                  </div>
                  {kpi.description && (
                    <CardDescription className="text-xs">{kpi.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground">
                    {dataSources.find(d => d.id === kpi.dataSourceId)?.label} • Updated: {formatDateDDMMYYYY(kpi.updatedAt)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Content */}
        {selectedKPI || isAddKPIDialogOpen ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={currentStep} onValueChange={(v) => setCurrentStep(v as any)} className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b px-6 py-2">
                <ScrollableTabs>
                  <TabsList className="grid w-full grid-cols-6 h-auto">
                    <TabsTrigger value="dataSource" className="py-2">1. Data Source</TabsTrigger>
                    <TabsTrigger value="baseMetric" className="py-2">2. Base Metric</TabsTrigger>
                    <TabsTrigger value="filters" className="py-2">3. Filters</TabsTrigger>
                    <TabsTrigger value="formula" className="py-2">4. Formula</TabsTrigger>
                    <TabsTrigger value="conditional" className="py-2">5. Conditional</TabsTrigger>
                    <TabsTrigger value="visualization" className="py-2">6. Visualization</TabsTrigger>
                  </TabsList>
                </ScrollableTabs>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <TabsContent value="dataSource" className="mt-0">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Select Data Source</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {dataSources.map((ds) => (
                          <Card
                            key={ds.id}
                            className={`cursor-pointer transition-colors ${
                              (kpiBuilder.dataSourceId || selectedKPI?.dataSourceId) === ds.id ? "border-primary bg-primary/5" : ""
                            }`}
                            onClick={() => {
                              setKpiBuilder({ ...kpiBuilder, dataSourceId: ds.id });
                              setSelectedDataSource(ds);
                            }}
                          >
                            <CardHeader>
                              <CardTitle className="text-sm">{ds.label}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-xs text-muted-foreground">
                                {ds.fields.length} fields available
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="baseMetric" className="mt-0">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Define Base Metric</h3>
                      <div className="space-y-2">
                        <Label>Metric Type</Label>
                        <Select
                          value={kpiBuilder.baseMetric?.type || "count"}
                          onValueChange={(value) => {
                            setKpiBuilder({
                              ...kpiBuilder,
                              baseMetric: { type: value as any },
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="count">Count</SelectItem>
                            <SelectItem value="sum">Sum</SelectItem>
                            <SelectItem value="average">Average</SelectItem>
                            <SelectItem value="min">Min</SelectItem>
                            <SelectItem value="max">Max</SelectItem>
                            <SelectItem value="custom">Custom Formula</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedDataSource && kpiBuilder.baseMetric?.type !== "count" && kpiBuilder.baseMetric?.type !== "custom" && (
                        <div className="space-y-2 mt-4">
                          <Label>Select Field</Label>
                          <Select
                            value={kpiBuilder.baseMetric?.fieldId || ""}
                            onValueChange={(value) => {
                              setKpiBuilder({
                                ...kpiBuilder,
                                baseMetric: {
                                  ...kpiBuilder.baseMetric!,
                                  fieldId: value,
                                },
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedDataSource.fields.map((field) => (
                                <SelectItem key={field.id} value={field.id}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="filters" className="mt-0">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Apply Filters</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add filters to narrow down the data for your KPI calculation.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const newFilter: Filter = {
                            id: `filter-${Date.now()}`,
                            fieldId: selectedDataSource?.fields[0]?.id || "",
                            operator: "equals",
                            value: "",
                          };
                          setKpiBuilder({
                            ...kpiBuilder,
                            filters: [...(kpiBuilder.filters || []), newFilter],
                          });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Filter
                      </Button>
                      <div className="space-y-2 mt-4">
                        {kpiBuilder.filters?.map((filter) => (
                          <Card key={filter.id}>
                            <CardContent className="pt-4">
                              <div className="grid grid-cols-4 gap-2">
                                <Select
                                  value={filter.fieldId}
                                  onValueChange={(value) => {
                                    setKpiBuilder({
                                      ...kpiBuilder,
                                      filters: (kpiBuilder.filters || []).map(f =>
                                        f.id === filter.id ? { ...f, fieldId: value } : f
                                      ),
                                    });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Field" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedDataSource?.fields.map((field) => (
                                      <SelectItem key={field.id} value={field.id}>
                                        {field.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={filter.operator}
                                  onValueChange={(value) => {
                                    setKpiBuilder({
                                      ...kpiBuilder,
                                      filters: (kpiBuilder.filters || []).map(f =>
                                        f.id === filter.id ? { ...f, operator: value as any } : f
                                      ),
                                    });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="equals">Equals</SelectItem>
                                    <SelectItem value="notEquals">Not Equals</SelectItem>
                                    <SelectItem value="greaterThan">Greater Than</SelectItem>
                                    <SelectItem value="lessThan">Less Than</SelectItem>
                                    <SelectItem value="contains">Contains</SelectItem>
                                    <SelectItem value="in">In</SelectItem>
                                    <SelectItem value="between">Between</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  value={typeof filter.value === "string" ? filter.value : ""}
                                  onChange={(e) => {
                                    setKpiBuilder({
                                      ...kpiBuilder,
                                      filters: (kpiBuilder.filters || []).map(f =>
                                        f.id === filter.id ? { ...f, value: e.target.value } : f
                                      ),
                                    });
                                  }}
                                  placeholder="Value"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setKpiBuilder({
                                      ...kpiBuilder,
                                      filters: (kpiBuilder.filters || []).filter(f => f.id !== filter.id),
                                    });
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="formula" className="mt-0">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Build Formula</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Drag and drop aggregates, operators, functions, and fields to build your formula.
                      </p>
                      {renderFormulaBuilder()}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="conditional" className="mt-0">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Conditional Logic (Optional)</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add conditional logic to display different values based on conditions.
                      </p>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Condition</Label>
                          <Input
                            placeholder="e.g., Loss Ratio > 60"
                            value={kpiBuilder.conditionalLogic?.condition || ""}
                            onChange={(e) => {
                              setKpiBuilder({
                                ...kpiBuilder,
                                conditionalLogic: {
                                  ...kpiBuilder.conditionalLogic,
                                  condition: e.target.value,
                                } as any,
                              });
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>True Value</Label>
                            <Input
                              placeholder="e.g., High Risk"
                              value={kpiBuilder.conditionalLogic?.trueValue || ""}
                              onChange={(e) => {
                                setKpiBuilder({
                                  ...kpiBuilder,
                                  conditionalLogic: {
                                    ...kpiBuilder.conditionalLogic,
                                    trueValue: e.target.value,
                                  } as any,
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>False Value</Label>
                            <Input
                              placeholder="e.g., Healthy"
                              value={kpiBuilder.conditionalLogic?.falseValue || ""}
                              onChange={(e) => {
                                setKpiBuilder({
                                  ...kpiBuilder,
                                  conditionalLogic: {
                                    ...kpiBuilder.conditionalLogic,
                                    falseValue: e.target.value,
                                  } as any,
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="visualization" className="mt-0">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Choose Visualization</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: "card", label: "KPI Card", icon: BarChart3 },
                          { value: "line", label: "Line Chart", icon: TrendingUp },
                          { value: "bar", label: "Bar Chart", icon: BarChart3 },
                          { value: "pie", label: "Pie Chart", icon: PieChart },
                          { value: "gauge", label: "Gauge", icon: Gauge },
                          { value: "trend", label: "Trend", icon: TrendingUp },
                          { value: "heatmap", label: "Heatmap", icon: Grid3x3 },
                        ].map((viz) => {
                          const Icon = viz.icon;
                          return (
                            <Card
                              key={viz.value}
                              className={`cursor-pointer transition-colors ${
                                (kpiBuilder.visualizationType || selectedKPI?.visualizationType) === viz.value
                                  ? "border-primary bg-primary/5"
                                  : ""
                              }`}
                              onClick={() => {
                                setKpiBuilder({ ...kpiBuilder, visualizationType: viz.value as any });
                              }}
                            >
                              <CardHeader>
                                <Icon className="w-6 h-6 mx-auto mb-2" />
                                <CardTitle className="text-sm text-center">{viz.label}</CardTitle>
                              </CardHeader>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>

              <div className="border-t px-6 py-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep === "dataSource") {
                      setIsAddKPIDialogOpen(false);
                      setSelectedKPI(null);
                    } else {
                      const steps = ["dataSource", "baseMetric", "filters", "formula", "conditional", "visualization"];
                      const currentIndex = steps.indexOf(currentStep);
                      if (currentIndex > 0) {
                        setCurrentStep(steps[currentIndex - 1] as any);
                      }
                    }
                  }}
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    if (currentStep === "visualization") {
                      if (selectedKPI) {
                        // Update existing KPI
                        const updated = kpis.map(k =>
                          k.id === selectedKPI.id
                            ? {
                                ...k,
                                ...kpiBuilder,
                                updatedAt: new Date().toISOString().split("T")[0],
                              }
                            : k
                        );
                        setKpis(updated);
                        setSelectedKPI(null);
                        toast({
                          title: "KPI Updated",
                          description: "KPI has been updated successfully.",
                        });
                      } else {
                        handleAddKPI();
                      }
                    } else {
                      const steps = ["dataSource", "baseMetric", "filters", "formula", "conditional", "visualization"];
                      const currentIndex = steps.indexOf(currentStep);
                      if (currentIndex < steps.length - 1) {
                        setCurrentStep(steps[currentIndex + 1] as any);
                      }
                    }
                  }}
                >
                  {currentStep === "visualization" ? (selectedKPI ? "Update KPI" : "Create KPI") : "Next"}
                </Button>
              </div>
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No KPI Selected</h3>
              <p className="text-muted-foreground mb-4">
                Select a KPI from the left sidebar or create a new one to get started.
              </p>
              <Button onClick={() => setIsAddKPIDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New KPI
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add KPI Dialog - Step 1 */}
      <Dialog open={isAddKPIDialogOpen && !selectedKPI && currentStep === "dataSource"} onOpenChange={setIsAddKPIDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New KPI</DialogTitle>
            <DialogDescription>
              Enter basic information for your KPI.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>KPI Name *</Label>
              <Input
                value={newKPIName}
                onChange={(e) => setNewKPIName(e.target.value)}
                placeholder="e.g., Conversion Rate"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newKPIDescription}
                onChange={(e) => setNewKPIDescription(e.target.value)}
                placeholder="KPI description (optional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddKPIDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (newKPIName.trim()) {
                setIsAddKPIDialogOpen(false);
                setCurrentStep("dataSource");
              } else {
                toast({
                  title: "Validation Error",
                  description: "Please enter a KPI name.",
                  variant: "destructive",
                });
              }
            }}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KPIDesign;

