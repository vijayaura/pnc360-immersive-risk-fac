import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Calculator, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { getPolicyDetailsById, PolicyDetailsAPIResponse } from "@/features/quotes/api/quotes";
import { cn } from "@/shared/utils/lib-utils";

const PremiumRecalculation = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const policyId = searchParams.get("policyId");
  const endorsementId = searchParams.get("endorsementId");

  const [policyData, setPolicyData] = useState<PolicyDetailsAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [policyStartDate, setPolicyStartDate] = useState<Date | null>(null);
  const [policyExpiryDate, setPolicyExpiryDate] = useState<Date | null>(null);
  const [expiryDateOpen, setExpiryDateOpen] = useState(false);
  const [originalPremium, setOriginalPremium] = useState(0);
  const [revisedPremium, setRevisedPremium] = useState(0);
  const [premiumVariation, setPremiumVariation] = useState(0);
  const [proRatedPremium, setProRatedPremium] = useState(0);
  const [autoRecalculate, setAutoRecalculate] = useState(true);
  const [manualOverride, setManualOverride] = useState(false);
  const [manualPremium, setManualPremium] = useState(0);

  useEffect(() => {
    const loadPolicyData = async () => {
      if (!policyId) {
        toast({
          title: "Policy ID Required",
          description: "Policy ID is missing from the URL.",
          variant: "destructive",
        });
        return;
      }

      try {
        setLoading(true);
        const data = await getPolicyDetailsById(policyId);
        setPolicyData(data);

        // Set dates
        if (data.policyStartDate) {
          setPolicyStartDate(new Date(data.policyStartDate));
        }
        if (data.policyEndDate) {
          setPolicyExpiryDate(new Date(data.policyEndDate));
        }

        // Set original premium
        const premium = typeof data.totalPremium === "number" ? data.totalPremium : parseFloat(String(data.totalPremium)) || 0;
        setOriginalPremium(premium);
        setRevisedPremium(premium);
      } catch (error: any) {
        console.error("Error loading policy data:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load policy data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPolicyData();
  }, [policyId, toast]);

  // Calculate premium when dates or auto-recalculate changes
  useEffect(() => {
    if (!autoRecalculate || !policyStartDate || !policyExpiryDate) return;

    // Calculate revised premium (simplified - in real app, this would call rating engine)
    const daysRemaining = Math.max(0, Math.ceil((policyExpiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
    const totalDays = Math.ceil((policyExpiryDate.getTime() - policyStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = totalDays - daysRemaining;

    // Pro-rata calculation
    const proRataFactor = daysRemaining / totalDays;
    const calculatedProRatedPremium = originalPremium * proRataFactor;

    // Revised premium (assuming changes increase premium by 10% for demo)
    const calculatedRevisedPremium = originalPremium * 1.1;

    setRevisedPremium(calculatedRevisedPremium);
    setPremiumVariation(calculatedRevisedPremium - originalPremium);
    setProRatedPremium(calculatedProRatedPremium);
  }, [autoRecalculate, policyStartDate, policyExpiryDate, originalPremium]);

  const handleRecalculate = () => {
    if (!policyStartDate || !policyExpiryDate) {
      toast({
        title: "Dates Required",
        description: "Please set both policy start and expiry dates.",
        variant: "destructive",
      });
      return;
    }

    // Trigger recalculation
    setAutoRecalculate(true);
    toast({
      title: "Premium Recalculated",
      description: "Premium has been recalculated based on the new dates.",
    });
  };

  const handleSave = () => {
    toast({
      title: "Premium Recalculation Saved",
      description: "The premium recalculation has been saved successfully.",
    });
    // Navigate to success page with endorsement flag
    navigate(`/customer/success?endorsement=true&policyId=${policyId}&endorsementId=${endorsementId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading policy data...</p>
        </div>
      </div>
    );
  }

  if (!policyData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Policy not found</p>
          <Button onClick={() => navigate("/insurer/endorsements")}>Back to Endorsements</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/insurer/endorsements")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Premium Recalculation</h1>
              <p className="text-sm text-muted-foreground">Recalculate premium for endorsement</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Policy Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Policy Dates</CardTitle>
            <CardDescription>Policy start date is not editable. Expiry date can be extended.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Policy Start Date</Label>
                <Input
                  value={policyStartDate ? format(policyStartDate, "dd-MM-yyyy") : "N/A"}
                  readOnly
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Not editable</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Policy Expiry Date</Label>
                <Popover open={expiryDateOpen} onOpenChange={setExpiryDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="expiryDate"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !policyExpiryDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {policyExpiryDate ? (
                        format(policyExpiryDate, "dd-MM-yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={policyExpiryDate || undefined}
                      onSelect={(date) => {
                        setPolicyExpiryDate(date || null);
                        setExpiryDateOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">Editable for extensions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium Calculation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Premium Recalculation</CardTitle>
                <CardDescription>Original premium, revised premium, variation, and pro-rated premium</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="autoRecalculate" className="text-sm font-normal cursor-pointer">
                  Auto Recalculate
                </Label>
                <Switch
                  id="autoRecalculate"
                  checked={autoRecalculate}
                  onCheckedChange={setAutoRecalculate}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Original Premium (AED)</Label>
                  <Input
                    value={originalPremium.toFixed(2)}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Revised Premium (AED)</Label>
                  {manualOverride ? (
                    <Input
                      type="number"
                      value={manualPremium}
                      onChange={(e) => {
                        setManualPremium(parseFloat(e.target.value) || 0);
                        setRevisedPremium(parseFloat(e.target.value) || 0);
                        setPremiumVariation((parseFloat(e.target.value) || 0) - originalPremium);
                      }}
                    />
                  ) : (
                    <Input
                      value={revisedPremium.toFixed(2)}
                      readOnly
                      className="bg-muted"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Premium Variation (AED)</Label>
                  <Input
                    value={premiumVariation.toFixed(2)}
                    readOnly
                    className={cn(
                      "bg-muted",
                      premiumVariation > 0 ? "text-green-600" : premiumVariation < 0 ? "text-red-600" : ""
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    {premiumVariation > 0 ? "Increase" : premiumVariation < 0 ? "Decrease" : "No change"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Pro-Rated Premium (AED)</Label>
                  <Input
                    value={proRatedPremium.toFixed(2)}
                    readOnly
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Remaining period premium</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t">
                <Label htmlFor="manualOverride" className="text-sm font-normal cursor-pointer">
                  Manual Override
                </Label>
                <Switch
                  id="manualOverride"
                  checked={manualOverride}
                  onCheckedChange={setManualOverride}
                />
                <span className="text-xs text-muted-foreground">(if required)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/insurer/endorsements")}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleRecalculate}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Recalculate
          </Button>
          <Button onClick={handleSave}>
            <Calculator className="mr-2 h-4 w-4" />
            Save & Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PremiumRecalculation;
