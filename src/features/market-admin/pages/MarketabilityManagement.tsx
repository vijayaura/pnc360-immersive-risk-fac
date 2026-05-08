import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollableTabs } from "@/components/ui/ScrollableTabs";
import { ArrowLeft, Save, DollarSign, Users, Network, Gift, TrendingUp, CheckCircle2, Circle } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

type DistributionChannel = "BROKER" | "SALES_AGENT" | "AGENCY" | "DIRECT" | "ONLINE";
type CommissionType = "BASE" | "PROFIT" | "CAMPAIGN" | "INCENTIVE";
type CampaignType = "INCENTIVE" | "PROFIT_COMMISSION" | "OVERRIDE";
type AssignmentType = "ROLE" | "USER";
type ConditionType = "NONE" | "POLICY_COUNT" | "PREMIUM_AMOUNT";

interface Assignment {
  type: AssignmentType;
  roleId?: string;
  roleName?: string;
  userId?: string;
  userName?: string;
}

interface BaseCommissionConfig {
  id: string;
  channelType: DistributionChannel;
  baseCommission: number; // Percentage
  minCommission: number; // Percentage
  maxCommission: number; // Percentage
  assignment: Assignment; // Role or specific user
  isActive: boolean;
}

interface ProfitCommissionConfig {
  id: string;
  channelType: DistributionChannel;
  lossRatioCondition: string; // e.g., "<20%", "20-50%", "50-80%", ">80%"
  profitPercentage: number; // Percentage of profit
  assignment: Assignment; // Role or specific user
  isActive: boolean;
}

interface DistributionChannelOverride {
  id: string;
  channelType: DistributionChannel;
  overrideCommission: number; // Percentage override
  conditions?: string; // Optional conditions for override
  assignment: Assignment; // Role or specific user
  isActive: boolean;
}

interface CampaignProfitCommission {
  lossRatioCondition: string; // e.g., "<20%", "20-50%", "50-80%", ">80%"
  profitPercentage: number; // Percentage of profit
}

interface CampaignIncentive {
  id: string;
  incentiveName: string;
  description: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  conditionType: ConditionType; // None / Policy Count / Premium Amount
  conditionValue?: number; // Policy count or premium amount threshold
}

interface CampaignCommission {
  id: string;
  campaignName: string;
  startDate: string;
  endDate: string;
  campaignType: CampaignType; // Incentive / Profit Commission / Override
  commissionValue: number; // Percentage or fixed amount (for Override type)
  applicableChannels: DistributionChannel[];
  assignedDistributors: string[]; // Distributor IDs or names
  conditionType: ConditionType; // None / Policy Count / Premium Amount
  conditionValue?: number; // Policy count or premium amount threshold
  profitCommission?: CampaignProfitCommission; // Optional profit commission config
  incentives: CampaignIncentive[]; // Array of incentives
  assignment: Assignment; // Role or specific user
  isActive: boolean;
}

interface Incentive {
  id: string;
  incentiveName: string;
  description: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  conditionType: ConditionType; // None / Policy Count / Premium Amount
  conditionValue?: number; // Policy count or premium amount threshold
  applicableChannels: DistributionChannel[];
  assignment: Assignment; // Role or specific user
  isActive: boolean;
}

const MarketabilityManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const productName = searchParams.get("productName") || "";
  const productVersion = searchParams.get("productVersion") || "";
  const productId = searchParams.get("productId") || "";

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Mock roles and users for assignment
  const mockRoles = [
    { id: "role-1", name: "Broker" },
    { id: "role-2", name: "Sales Agent" },
    { id: "role-3", name: "Agency Manager" },
    { id: "role-4", name: "Underwriter" },
  ];

  const mockUsers = [
    { id: "user-1", name: "Ahmed Al-Mansoori", email: "ahmed@broker.com" },
    { id: "user-2", name: "Sarah Johnson", email: "sarah@broker.com" },
    { id: "user-3", name: "Mohammed Hassan", email: "mohammed@broker.com" },
    { id: "user-4", name: "Fatima Al-Zahra", email: "fatima@agent.com" },
    { id: "user-5", name: "Ali Ahmad", email: "ali@agency.com" },
  ];

  // Base Commission Configurations
  const [baseCommissions, setBaseCommissions] = useState<BaseCommissionConfig[]>([
    {
      id: "base-1",
      channelType: "BROKER",
      baseCommission: 15,
      minCommission: 10,
      maxCommission: 25,
      assignment: { type: "ROLE", roleId: "role-1", roleName: "Broker" },
      isActive: true,
    },
    {
      id: "base-2",
      channelType: "SALES_AGENT",
      baseCommission: 12,
      minCommission: 8,
      maxCommission: 20,
      assignment: { type: "ROLE", roleId: "role-2", roleName: "Sales Agent" },
      isActive: true,
    },
    {
      id: "base-3",
      channelType: "AGENCY",
      baseCommission: 14,
      minCommission: 9,
      maxCommission: 22,
      assignment: { type: "ROLE", roleId: "role-3", roleName: "Agency Manager" },
      isActive: true,
    },
    {
      id: "base-4",
      channelType: "DIRECT",
      baseCommission: 0,
      minCommission: 0,
      maxCommission: 0,
      assignment: { type: "ROLE", roleId: "role-4", roleName: "Underwriter" },
      isActive: true,
    },
    {
      id: "base-5",
      channelType: "ONLINE",
      baseCommission: 10,
      minCommission: 5,
      maxCommission: 18,
      assignment: { type: "ROLE", roleId: "role-1", roleName: "Broker" },
      isActive: true,
    },
  ]);

  // Profit Commission Configurations
  const [profitCommissions, setProfitCommissions] = useState<ProfitCommissionConfig[]>([
    {
      id: "profit-1",
      channelType: "BROKER",
      lossRatioCondition: "<20%",
      profitPercentage: 20,
      assignment: { type: "ROLE", roleId: "role-1", roleName: "Broker" },
      isActive: true,
    },
    {
      id: "profit-2",
      channelType: "SALES_AGENT",
      lossRatioCondition: "20-50%",
      profitPercentage: 15,
      assignment: { type: "ROLE", roleId: "role-2", roleName: "Sales Agent" },
      isActive: true,
    },
    {
      id: "profit-3",
      channelType: "AGENCY",
      lossRatioCondition: "50-80%",
      profitPercentage: 18,
      assignment: { type: "ROLE", roleId: "role-3", roleName: "Agency Manager" },
      isActive: true,
    },
    {
      id: "profit-4",
      channelType: "ONLINE",
      lossRatioCondition: ">80%",
      profitPercentage: 12,
      assignment: { type: "ROLE", roleId: "role-1", roleName: "Broker" },
      isActive: true,
    },
  ]);

  // Distribution Channel Overrides
  const [channelOverrides, setChannelOverrides] = useState<DistributionChannelOverride[]>([
    {
      id: "override-1",
      channelType: "BROKER",
      overrideCommission: 18,
      conditions: "For premium customers",
      assignment: { type: "ROLE", roleId: "role-1", roleName: "Broker" },
      isActive: true,
    },
    {
      id: "override-2",
      channelType: "SALES_AGENT",
      overrideCommission: 14,
      conditions: "Volume discount",
      assignment: { type: "USER", userId: "user-1", userName: "Ahmed Al-Mansoori" },
      isActive: true,
    },
  ]);

  // Campaign Commissions
  const [campaignCommissions, setCampaignCommissions] = useState<CampaignCommission[]>([
    {
      id: "campaign-1",
      campaignName: "Q1 2024 Boost",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
      campaignType: "INCENTIVE",
      commissionValue: 5,
      applicableChannels: ["BROKER", "SALES_AGENT", "AGENCY"],
      assignedDistributors: ["Ahmed Al-Mansoori", "Sarah Johnson"],
      conditionType: "NONE",
      profitCommission: {
        lossRatioCondition: "<20%",
        profitPercentage: 20,
      },
      incentives: [
        {
          id: "inc-1",
          incentiveName: "Volume Bonus",
          description: "Additional commission for high volume",
          type: "PERCENTAGE",
          value: 3,
          conditionType: "POLICY_COUNT",
          conditionValue: 50,
        },
        {
          id: "inc-2",
          incentiveName: "Revenue Milestone",
          description: "Fixed bonus for reaching revenue targets",
          type: "FIXED_AMOUNT",
          value: 10000,
          conditionType: "PREMIUM_AMOUNT",
          conditionValue: 500000,
        },
      ],
      assignment: { type: "ROLE", roleId: "role-1", roleName: "Broker" },
      isActive: true,
    },
  ]);

  // Incentives
  const [incentives, setIncentives] = useState<Incentive[]>([
    {
      id: "incentive-1",
      incentiveName: "Volume Bonus",
      description: "Additional commission for high volume",
      type: "PERCENTAGE",
      value: 3,
      conditionType: "POLICY_COUNT",
      conditionValue: 50,
      applicableChannels: ["BROKER"],
      assignment: { type: "ROLE", roleId: "role-1", roleName: "Broker" },
      isActive: true,
    },
    {
      id: "incentive-2",
      incentiveName: "Revenue Milestone",
      description: "Fixed bonus for reaching revenue targets",
      type: "FIXED_AMOUNT",
      value: 10000,
      conditionType: "PREMIUM_AMOUNT",
      conditionValue: 500000,
      applicableChannels: ["BROKER", "SALES_AGENT", "AGENCY"],
      assignment: { type: "USER", userId: "user-2", userName: "Sarah Johnson" },
      isActive: true,
    },
  ]);

  const channelLabels: Record<DistributionChannel, string> = {
    BROKER: "Broker",
    SALES_AGENT: "Sales Agent",
    AGENCY: "Agency",
    DIRECT: "Direct",
    ONLINE: "Online (B2C)",
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // TODO: Save to API
      // const response = await saveMarketabilityConfig(productId, {
      //   baseCommissions,
      //   campaignCommissions, // Includes profitCommission and incentives within each campaign
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsSaved(true);
      toast({
        title: "Configuration Saved",
        description: "Commission structuring configuration has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save commission structuring configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-auto">
        <div className="w-full px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Commission Structuring</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {productName}
                  {productVersion && ` - Version ${productVersion}`}
                </p>
              </div>
            </div>
            <Button onClick={handleSave} className="gap-2" disabled={isSaving || isSaved}>
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : isSaved ? "Saved" : "Save Configuration"}
            </Button>
          </div>

          <Tabs defaultValue="base-commission" className="space-y-6">
            <ScrollableTabs>
              <TabsList>
                <TabsTrigger value="base-commission">Base Commission</TabsTrigger>
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              </TabsList>
            </ScrollableTabs>

            {/* Base Commission Tab */}
            <TabsContent value="base-commission" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Base Commission Configuration</CardTitle>
                  <CardDescription>
                    Set base commission rates and min/max limits for each distribution channel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead>Base Commission (%)</TableHead>
                        <TableHead>Min Commission (%)</TableHead>
                        <TableHead>Max Commission (%)</TableHead>
                        <TableHead>Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {baseCommissions.map((config) => (
                        <TableRow key={config.id}>
                          <TableCell className="font-medium">{channelLabels[config.channelType]}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={config.baseCommission}
                              onChange={(e) => {
                                setBaseCommissions((prev) =>
                                  prev.map((c) =>
                                    c.id === config.id
                                      ? { ...c, baseCommission: parseFloat(e.target.value) || 0 }
                                      : c
                                  )
                                );
                                setIsSaved(false);
                              }}
                              className="w-24"
                              step="0.1"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={config.minCommission}
                              onChange={(e) => {
                                setBaseCommissions((prev) =>
                                  prev.map((c) =>
                                    c.id === config.id
                                      ? { ...c, minCommission: parseFloat(e.target.value) || 0 }
                                      : c
                                  )
                                );
                                setIsSaved(false);
                              }}
                              className="w-24"
                              step="0.1"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={config.maxCommission}
                              onChange={(e) => {
                                setBaseCommissions((prev) =>
                                  prev.map((c) =>
                                    c.id === config.id
                                      ? { ...c, maxCommission: parseFloat(e.target.value) || 0 }
                                      : c
                                  )
                                );
                                setIsSaved(false);
                              }}
                              className="w-24"
                              step="0.1"
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={config.isActive}
                              onCheckedChange={(checked) => {
                                setBaseCommissions((prev) =>
                                  prev.map((c) => (c.id === config.id ? { ...c, isActive: checked } : c))
                                );
                                setIsSaved(false);
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Campaign Commissions</CardTitle>
                      <CardDescription>
                        Configure time-limited campaign commissions and incentives
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newCampaign: CampaignCommission = {
                          id: `campaign-${Date.now()}`,
                          campaignName: "",
                          startDate: new Date().toISOString().split("T")[0],
                          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                          campaignType: "INCENTIVE",
                          commissionValue: 0,
                          applicableChannels: [],
                          assignedDistributors: [],
                          conditionType: "NONE",
                          incentives: [],
                          assignment: { type: "ROLE", roleId: mockRoles[0].id, roleName: mockRoles[0].name },
                          isActive: true,
                        };
                        setCampaignCommissions((prev) => [...prev, newCampaign]);
                        setIsSaved(false);
                      }}
                    >
                      Add Campaign
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaignCommissions.map((campaign) => (
                      <Card key={campaign.id}>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label>Campaign Name</Label>
                              <Input
                                value={campaign.campaignName}
                                onChange={(e) => {
                                  setCampaignCommissions((prev) =>
                                    prev.map((c) =>
                                      c.id === campaign.id ? { ...c, campaignName: e.target.value } : c
                                    )
                                  );
                                  setIsSaved(false);
                                }}
                                placeholder="e.g., Q1 2024 Boost"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Start Date</Label>
                              <Input
                                type="date"
                                value={campaign.startDate}
                                onChange={(e) => {
                                  setCampaignCommissions((prev) =>
                                    prev.map((c) =>
                                      c.id === campaign.id ? { ...c, startDate: e.target.value } : c
                                    )
                                  );
                                  setIsSaved(false);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>End Date</Label>
                              <Input
                                type="date"
                                value={campaign.endDate}
                                onChange={(e) => {
                                  setCampaignCommissions((prev) =>
                                    prev.map((c) =>
                                      c.id === campaign.id ? { ...c, endDate: e.target.value } : c
                                    )
                                  );
                                  setIsSaved(false);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Campaign Type</Label>
                              <Select
                                value={campaign.campaignType}
                                onValueChange={(value: CampaignType) => {
                                  setCampaignCommissions((prev) =>
                                    prev.map((c) =>
                                      c.id === campaign.id ? { ...c, campaignType: value } : c
                                    )
                                  );
                                  setIsSaved(false);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="INCENTIVE">Incentive</SelectItem>
                                  <SelectItem value="PROFIT_COMMISSION">Profit Commission</SelectItem>
                                  <SelectItem value="OVERRIDE">Override</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Commission Value (%)</Label>
                              <Input
                                type="number"
                                value={campaign.commissionValue}
                                onChange={(e) => {
                                  setCampaignCommissions((prev) =>
                                    prev.map((c) =>
                                      c.id === campaign.id
                                        ? { ...c, commissionValue: parseFloat(e.target.value) || 0 }
                                        : c
                                    )
                                  );
                                  setIsSaved(false);
                                }}
                                step="0.1"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Condition Type</Label>
                              <Select
                                value={campaign.conditionType}
                                onValueChange={(value: ConditionType) => {
                                  setCampaignCommissions((prev) =>
                                    prev.map((c) =>
                                      c.id === campaign.id
                                        ? { ...c, conditionType: value, conditionValue: value === "NONE" ? undefined : 0 }
                                        : c
                                    )
                                  );
                                  setIsSaved(false);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NONE">None</SelectItem>
                                  <SelectItem value="POLICY_COUNT">Policy Count</SelectItem>
                                  <SelectItem value="PREMIUM_AMOUNT">Premium Amount</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {campaign.conditionType !== "NONE" && (
                              <div className="space-y-2">
                                <Label>
                                  {campaign.conditionType === "POLICY_COUNT" ? "Min Policy Count" : "Min Premium Amount (AED)"}
                                </Label>
                                <Input
                                  type="number"
                                  value={campaign.conditionValue || ""}
                                  onChange={(e) => {
                                    setCampaignCommissions((prev) =>
                                      prev.map((c) =>
                                        c.id === campaign.id
                                          ? { ...c, conditionValue: parseFloat(e.target.value) || undefined }
                                          : c
                                      )
                                    );
                                    setIsSaved(false);
                                  }}
                                  placeholder={campaign.conditionType === "POLICY_COUNT" ? "e.g., 50" : "e.g., 500000"}
                                />
                              </div>
                            )}
                            <div className="space-y-2 md:col-span-2">
                              <Label>Applicable Channels</Label>
                              <div className="flex gap-2">
                                {(["BROKER", "SALES_AGENT", "AGENCY", "DIRECT", "ONLINE"] as DistributionChannel[]).map((channel) => (
                                  <div key={channel} className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={campaign.applicableChannels.includes(channel)}
                                      onCheckedChange={(checked) => {
                                        setCampaignCommissions((prev) =>
                                          prev.map((c) =>
                                            c.id === campaign.id
                                              ? {
                                                ...c,
                                                applicableChannels: checked
                                                  ? [...c.applicableChannels, channel]
                                                  : c.applicableChannels.filter((ch) => ch !== channel),
                                              }
                                              : c
                                          )
                                        );
                                        setIsSaved(false);
                                      }}
                                    />
                                    <Label className="text-sm">{channelLabels[channel]}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label>Assigned Distributors</Label>
                              <Input
                                value={campaign.assignedDistributors.join(", ")}
                                onChange={(e) => {
                                  setCampaignCommissions((prev) =>
                                    prev.map((c) =>
                                      c.id === campaign.id
                                        ? { ...c, assignedDistributors: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }
                                        : c
                                    )
                                  );
                                  setIsSaved(false);
                                }}
                                placeholder="Comma-separated distributor names"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label>Assignment</Label>
                              <div className="flex gap-2">
                                <Select
                                  value={campaign.assignment.type}
                                  onValueChange={(value: AssignmentType) => {
                                    setCampaignCommissions((prev) =>
                                      prev.map((c) =>
                                        c.id === campaign.id
                                          ? {
                                            ...c,
                                            assignment: {
                                              type: value,
                                              roleId: value === "ROLE" ? mockRoles[0].id : undefined,
                                              roleName: value === "ROLE" ? mockRoles[0].name : undefined,
                                              userId: value === "USER" ? mockUsers[0].id : undefined,
                                              userName: value === "USER" ? mockUsers[0].name : undefined,
                                            },
                                          }
                                          : c
                                      )
                                    );
                                    setIsSaved(false);
                                  }}
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ROLE">Role</SelectItem>
                                    <SelectItem value="USER">User</SelectItem>
                                  </SelectContent>
                                </Select>
                                {campaign.assignment.type === "ROLE" ? (
                                  <Select
                                    value={campaign.assignment.roleId || ""}
                                    onValueChange={(value) => {
                                      const role = mockRoles.find((r) => r.id === value);
                                      setCampaignCommissions((prev) =>
                                        prev.map((c) =>
                                          c.id === campaign.id
                                            ? {
                                              ...c,
                                              assignment: {
                                                type: "ROLE",
                                                roleId: role?.id,
                                                roleName: role?.name,
                                              },
                                            }
                                            : c
                                        )
                                      );
                                      setIsSaved(false);
                                    }}
                                  >
                                    <SelectTrigger className="w-40">
                                      <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {mockRoles.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                          {role.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Select
                                    value={campaign.assignment.userId || ""}
                                    onValueChange={(value) => {
                                      const user = mockUsers.find((u) => u.id === value);
                                      setCampaignCommissions((prev) =>
                                        prev.map((c) =>
                                          c.id === campaign.id
                                            ? {
                                              ...c,
                                              assignment: {
                                                type: "USER",
                                                userId: user?.id,
                                                userName: user?.name,
                                              },
                                            }
                                            : c
                                        )
                                      );
                                      setIsSaved(false);
                                    }}
                                  >
                                    <SelectTrigger className="w-40">
                                      <SelectValue placeholder="Select user" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {mockUsers.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                          {user.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            </div>

                            {/* Profit Commission Section */}
                            <div className="space-y-4 md:col-span-2 border-t pt-4 mt-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Profit Commission</Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCampaignCommissions((prev) =>
                                      prev.map((c) =>
                                        c.id === campaign.id
                                          ? {
                                            ...c,
                                            profitCommission: {
                                              lossRatioCondition: "<20%",
                                              profitPercentage: 20,
                                            },
                                          }
                                          : c
                                      )
                                    );
                                    setIsSaved(false);
                                  }}
                                  disabled={!!campaign.profitCommission}
                                >
                                  {campaign.profitCommission ? "Configured" : "Add Profit Commission"}
                                </Button>
                              </div>
                              {campaign.profitCommission && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                                  <div className="space-y-2">
                                    <Label>Loss Ratio Condition</Label>
                                    <Select
                                      value={campaign.profitCommission.lossRatioCondition}
                                      onValueChange={(value) => {
                                        setCampaignCommissions((prev) =>
                                          prev.map((c) =>
                                            c.id === campaign.id && c.profitCommission
                                              ? {
                                                ...c,
                                                profitCommission: {
                                                  ...c.profitCommission,
                                                  lossRatioCondition: value,
                                                },
                                              }
                                              : c
                                          )
                                        );
                                        setIsSaved(false);
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="<20%">&lt;20%</SelectItem>
                                        <SelectItem value="20-50%">20-50%</SelectItem>
                                        <SelectItem value="50-80%">50-80%</SelectItem>
                                        <SelectItem value=">80%">&gt;80%</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Profit %</Label>
                                    <Input
                                      type="number"
                                      value={campaign.profitCommission.profitPercentage}
                                      onChange={(e) => {
                                        setCampaignCommissions((prev) =>
                                          prev.map((c) =>
                                            c.id === campaign.id && c.profitCommission
                                              ? {
                                                ...c,
                                                profitCommission: {
                                                  ...c.profitCommission,
                                                  profitPercentage: parseFloat(e.target.value) || 0,
                                                },
                                              }
                                              : c
                                          )
                                        );
                                        setIsSaved(false);
                                      }}
                                      step="0.1"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setCampaignCommissions((prev) =>
                                          prev.map((c) =>
                                            c.id === campaign.id ? { ...c, profitCommission: undefined } : c
                                          )
                                        );
                                        setIsSaved(false);
                                      }}
                                    >
                                      Remove Profit Commission
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Incentives Section */}
                            <div className="space-y-4 md:col-span-2 border-t pt-4 mt-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Incentives</Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCampaignCommissions((prev) =>
                                      prev.map((c) =>
                                        c.id === campaign.id
                                          ? {
                                            ...c,
                                            incentives: [
                                              ...c.incentives,
                                              {
                                                id: `inc-${Date.now()}`,
                                                incentiveName: "",
                                                description: "",
                                                type: "PERCENTAGE",
                                                value: 0,
                                                conditionType: "NONE",
                                              },
                                            ],
                                          }
                                          : c
                                      )
                                    );
                                    setIsSaved(false);
                                  }}
                                >
                                  Add Incentive
                                </Button>
                              </div>
                              {campaign.incentives.map((incentive, idx) => (
                                <div key={incentive.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                                  <div className="space-y-2">
                                    <Label>Incentive Name</Label>
                                    <Input
                                      value={incentive.incentiveName}
                                      onChange={(e) => {
                                        setCampaignCommissions((prev) =>
                                          prev.map((c) =>
                                            c.id === campaign.id
                                              ? {
                                                ...c,
                                                incentives: c.incentives.map((inc) =>
                                                  inc.id === incentive.id ? { ...inc, incentiveName: e.target.value } : inc
                                                ),
                                              }
                                              : c
                                          )
                                        );
                                        setIsSaved(false);
                                      }}
                                      placeholder="e.g., Volume Bonus"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select
                                      value={incentive.type}
                                      onValueChange={(value: "PERCENTAGE" | "FIXED_AMOUNT") => {
                                        setCampaignCommissions((prev) =>
                                          prev.map((c) =>
                                            c.id === campaign.id
                                              ? {
                                                ...c,
                                                incentives: c.incentives.map((inc) =>
                                                  inc.id === incentive.id ? { ...inc, type: value } : inc
                                                ),
                                              }
                                              : c
                                          )
                                        );
                                        setIsSaved(false);
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                        <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Value</Label>
                                    <Input
                                      type="number"
                                      value={incentive.value}
                                      onChange={(e) => {
                                        setCampaignCommissions((prev) =>
                                          prev.map((c) =>
                                            c.id === campaign.id
                                              ? {
                                                ...c,
                                                incentives: c.incentives.map((inc) =>
                                                  inc.id === incentive.id ? { ...inc, value: parseFloat(e.target.value) || 0 } : inc
                                                ),
                                              }
                                              : c
                                          )
                                        );
                                        setIsSaved(false);
                                      }}
                                      step={incentive.type === "PERCENTAGE" ? "0.1" : "1"}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      {incentive.type === "PERCENTAGE" ? "%" : "AED"}
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Condition Type</Label>
                                    <Select
                                      value={incentive.conditionType}
                                      onValueChange={(value: ConditionType) => {
                                        setCampaignCommissions((prev) =>
                                          prev.map((c) =>
                                            c.id === campaign.id
                                              ? {
                                                ...c,
                                                incentives: c.incentives.map((inc) =>
                                                  inc.id === incentive.id
                                                    ? { ...inc, conditionType: value, conditionValue: value === "NONE" ? undefined : 0 }
                                                    : inc
                                                ),
                                              }
                                              : c
                                          )
                                        );
                                        setIsSaved(false);
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="NONE">None</SelectItem>
                                        <SelectItem value="POLICY_COUNT">Policy Count</SelectItem>
                                        <SelectItem value="PREMIUM_AMOUNT">Premium Amount</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  {incentive.conditionType !== "NONE" && (
                                    <div className="space-y-2">
                                      <Label>
                                        {incentive.conditionType === "POLICY_COUNT" ? "Min Policy Count" : "Min Premium Amount (AED)"}
                                      </Label>
                                      <Input
                                        type="number"
                                        value={incentive.conditionValue || ""}
                                        onChange={(e) => {
                                          setCampaignCommissions((prev) =>
                                            prev.map((c) =>
                                              c.id === campaign.id
                                                ? {
                                                  ...c,
                                                  incentives: c.incentives.map((inc) =>
                                                    inc.id === incentive.id
                                                      ? { ...inc, conditionValue: parseFloat(e.target.value) || undefined }
                                                      : inc
                                                  ),
                                                }
                                                : c
                                            )
                                          );
                                          setIsSaved(false);
                                        }}
                                        placeholder={incentive.conditionType === "POLICY_COUNT" ? "e.g., 50" : "e.g., 500000"}
                                      />
                                    </div>
                                  )}
                                  <div className="space-y-2 md:col-span-2">
                                    <Label>Description</Label>
                                    <Input
                                      value={incentive.description}
                                      onChange={(e) => {
                                        setCampaignCommissions((prev) =>
                                          prev.map((c) =>
                                            c.id === campaign.id
                                              ? {
                                                ...c,
                                                incentives: c.incentives.map((inc) =>
                                                  inc.id === incentive.id ? { ...inc, description: e.target.value } : inc
                                                ),
                                              }
                                              : c
                                          )
                                        );
                                        setIsSaved(false);
                                      }}
                                      placeholder="Brief description"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setCampaignCommissions((prev) =>
                                          prev.map((c) =>
                                            c.id === campaign.id
                                              ? {
                                                ...c,
                                                incentives: c.incentives.filter((inc) => inc.id !== incentive.id),
                                              }
                                              : c
                                          )
                                        );
                                        setIsSaved(false);
                                      }}
                                    >
                                      Remove Incentive
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="space-y-2">
                              <Label>Active</Label>
                              <div>
                                <Switch
                                  checked={campaign.isActive}
                                  onCheckedChange={(checked) => {
                                    setCampaignCommissions((prev) =>
                                      prev.map((c) => (c.id === campaign.id ? { ...c, isActive: checked } : c))
                                    );
                                    setIsSaved(false);
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MarketabilityManagement;

