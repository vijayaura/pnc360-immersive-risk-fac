import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft } from "lucide-react";
import ReinsuranceBrokerForm, { type ReinsuranceBrokerFormData } from "@/features/reinsurance-brokers/components/ReinsuranceBrokerForm";
import {
  getReinsuranceBroker,
  updateReinsuranceBroker,
  setReinsuranceBrokerStatus,
  type UpdateReinsuranceBrokerRequest,
} from "@/features/reinsurance-brokers/api/reinsurance-brokers";
import { listMasterCountries, listMasterRegions, listMasterZones } from "@/features/product-config/masters/api/masters";
import type { Country, Region, Zone } from "@/features/product-config/masters/api/masters";
import { useToast } from "@/shared/hooks/use-toast";
import FormSkeleton from "@/components/loaders/FormSkeleton";

const EditReinsuranceBroker = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brokerData, setBrokerData] = useState<any>(null);
  const [isDirect, setIsDirect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isActive, setIsActive] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
  const [statusChanging, setStatusChanging] = useState(false);

  const [masterCountries, setMasterCountries] = useState<Country[]>([]);
  const [masterRegions, setMasterRegions] = useState<Region[]>([]);
  const [masterZones, setMasterZones] = useState<Zone[]>([]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [c, r, z, data] = await Promise.all([
          listMasterCountries(),
          listMasterRegions(),
          listMasterZones(),
          getReinsuranceBroker(id),
        ]);
        setMasterCountries(c);
        setMasterRegions(r);
        setMasterZones(z);

        const countryIds = (data.geoCoverage?.countries || [])
          .map((c) => c.id)
          .filter((v): v is string => Boolean(v));
        const regionIds = (data.geoCoverage?.regions || [])
          .map((r) => r.id)
          .filter((v): v is string => Boolean(v));
        const zoneIds = (data.geoCoverage?.zones || [])
          .map((z) => z.id)
          .filter((v): v is string => Boolean(v));

        setIsDirect(data.isDirect ?? false);

        setBrokerData({
          id: data.id,
          name: data.name,
          licenseNumber: data.licenseNumber || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          isDirect: data.isDirect ?? false,
          countries: countryIds,
          regions: regionIds,
          zones: zoneIds,
          adminUserName: data.adminName || "",
          adminUserEmail: data.adminEmail || "",
          status: data.status,
        });
        setIsActive(data.status?.toLowerCase() !== "inactive");
      } catch (err: any) {
        const friendly = err?.message || "Failed to load reinsurance broker.";
        setLoadError(friendly);
        toast({ title: "Error", description: friendly, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (formData: ReinsuranceBrokerFormData) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      if (!id) throw new Error("Missing broker id");

      const selectedCountryObjects = (formData.countries || [])
        .map((cId) => masterCountries.find((c) => c.id === cId))
        .filter((v): v is (typeof masterCountries)[number] => Boolean(v));

      const selectedRegionObjects = (formData.regions || [])
        .map((rId) => masterRegions.find((r) => r.id === rId))
        .filter((v): v is (typeof masterRegions)[number] => Boolean(v));

      const selectedZoneObjects = (formData.zones || [])
        .map((zId) => masterZones.find((z) => z.id === zId))
        .filter((v): v is (typeof masterZones)[number] => Boolean(v));

      const payload: UpdateReinsuranceBrokerRequest = {
        name: formData.name,
        licenseNumber: formData.licenseNumber || undefined,
        contactEmail: formData.email,
        phone: formData.phone,
        address: formData.address,
        isDirect: formData.isDirect ?? false,
        operatingCountries: selectedCountryObjects.map((c) => ({
          id: c.id,
          value: c.value,
          label: c.label,
          active: true,
        })),
        operatingRegions: selectedRegionObjects.map((r) => ({
          id: r.id,
          value: r.value,
          label: r.label,
          countryId: r.countryId,
          active: true,
        })),
        operatingZones: selectedZoneObjects.map((z) => ({
          id: z.id,
          value: z.value,
          label: z.label,
          regionId: z.regionId,
          active: true,
        })),
        adminEmail: formData.adminUserEmail,
        adminName: formData.adminUserName,
      };

      await updateReinsuranceBroker(id, payload);
      toast({ title: "Success", description: "Reinsurance broker updated successfully!" });
      navigate("/market-admin/reinsurance-management");
    } catch (error: any) {
      const msg = (
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        "Failed to update reinsurance broker."
      ).toString();
      setErrorMessage(msg);
      toast({ title: "Update Failed", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = () => {
    setPendingStatus(!isActive);
    setShowConfirmDialog(true);
  };

  const confirmStatusChange = async () => {
    if (pendingStatus === null || !id) return;
    try {
      setStatusChanging(true);
      await setReinsuranceBrokerStatus(id, pendingStatus);
      setIsActive(pendingStatus);
      toast({
        title: "Status Updated",
        description: `Reinsurance broker ${pendingStatus ? "activated" : "deactivated"} successfully!`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Status change failed.",
        variant: "destructive",
      });
    } finally {
      setShowConfirmDialog(false);
      setPendingStatus(null);
      setStatusChanging(false);
    }
  };

  const cancelStatusChange = () => {
    setShowConfirmDialog(false);
    setPendingStatus(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
        <div className="flex-1 p-6">
          <div className="w-full max-w-7xl mx-auto">
            <FormSkeleton pairs={6} />
          </div>
        </div>
      </div>
    );
  }

  if (loadError || (!brokerData && !isLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
        <div className="flex-1 p-6">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              onClick={() => navigate("/market-admin/reinsurance-management")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Error</h1>
              <p className="text-muted-foreground">{loadError || "Reinsurance broker not found."}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
      <div className="flex-1 p-6">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/market-admin/reinsurance-management")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Edit Reinsurance Broker
                </h1>
                <p className="text-muted-foreground">
                  Update details for {brokerData?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card p-4 rounded-lg border">
              <Label htmlFor="broker-status" className="text-sm font-medium">
                {isActive ? "Active" : "Inactive"}
              </Label>
              <Switch id="broker-status" checked={isActive} onCheckedChange={handleToggleStatus} />
            </div>
          </div>

          <div className={`transition-all duration-300 ${!isActive ? "opacity-75" : ""}`}>
            <ReinsuranceBrokerForm
              mode="edit"
              initialData={brokerData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              serverError={errorMessage}
            />
          </div>
        </div>
      </div>

      {/* Status Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus ? "Activate" : "Deactivate"} Reinsurance Broker
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {pendingStatus ? "activate" : "deactivate"}{" "}
              {brokerData?.name}?
              {!pendingStatus && " This will disable all their access and services."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelStatusChange}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange} disabled={statusChanging}>
              {statusChanging ? "Updating..." : pendingStatus ? "Activate" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditReinsuranceBroker;
