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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, X, Upload } from "lucide-react";
import ReinsurerForm, { type ReinsurerFormData } from "@/features/reinsurers/components/ReinsurerForm";
import {
  getReinsurer,
  updateReinsurer,
  setReinsurerStatus,
  uploadReinsurerLogoFile,
  type UpdateReinsurerRequest,
} from "@/features/reinsurers/api/reinsurers";
import { listMasterCountries, listMasterRegions, listMasterZones } from "@/features/product-config/masters/api/masters";
import type { Country, Region, Zone } from "@/features/product-config/masters/api/masters";
import { useToast } from "@/shared/hooks/use-toast";
import FormSkeleton from "@/components/loaders/FormSkeleton";
import { formatFileSize } from "@/shared/utils/fileUtils";

type EditReinsurerInitialData = Partial<ReinsurerFormData> & {
  id?: string;
  status?: string;
};

function messageFromUnknown(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const o = err as Record<string, unknown>;
    const response = o.response as Record<string, unknown> | undefined;
    const data = (response?.data ?? o.data) as Record<string, unknown> | undefined;
    const msg = data?.message ?? o.message;
    if (typeof msg === "string" && msg.length > 0) return msg;
  }
  return fallback;
}

const EditReinsurer = () => {
  const navigate = useNavigate();
  const { reinsurerMapId } = useParams<{ reinsurerMapId: string }>();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reinsurerData, setReinsurerData] = useState<EditReinsurerInitialData | null>(null);
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

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [existingLogoId, setExistingLogoId] = useState<string | null>(null);
  const [existingLogoSize, setExistingLogoSize] = useState<number | null>(null);

  useEffect(() => {
    if (!reinsurerMapId) return;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [c, r, z, data] = await Promise.all([
          listMasterCountries(),
          listMasterRegions(),
          listMasterZones(),
          getReinsurer(reinsurerMapId),
        ]);
        setMasterCountries(c);
        setMasterRegions(r);
        setMasterZones(z);

        const countryIds = (data.geoCoverage?.countries || [])
          .map((co) => co.id)
          .filter((v): v is string => Boolean(v));
        const regionIds = (data.geoCoverage?.regions || [])
          .map((reg) => reg.id)
          .filter((v): v is string => Boolean(v));
        const zoneIds = (data.geoCoverage?.zones || [])
          .map((zo) => zo.id)
          .filter((v): v is string => Boolean(v));

        const logoUrl = data.companyLogo || null;
        setExistingLogoUrl(logoUrl);
        setExistingLogoSize(null);
        setExistingLogoId(null);
        if (logoUrl) {
          const uuidMatch = logoUrl.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
          if (uuidMatch?.[1]) setExistingLogoId(uuidMatch[1]);
        }

        setReinsurerData({
          id: data.id,
          name: data.name,
          gradeId: data.gradeId || "",
          licenseNumber: data.licenseNumber || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          countries: countryIds,
          regions: regionIds,
          zones: zoneIds,
          adminUserName: data.adminName || "",
          adminUserEmail: data.adminEmail || "",
          adminUserPassword: "",
          status: data.status,
        });
        setIsActive(data.status?.toLowerCase() !== "inactive");
      } catch (err: unknown) {
        const friendly = messageFromUnknown(err, "Failed to load reinsurer.");
        setLoadError(friendly);
        toast({ title: "Error", description: friendly, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per reinsurer id
  }, [reinsurerMapId]);

  const handleSubmit = async (formData: ReinsurerFormData) => {
    setErrorMessage(null);
    if (!isActive) {
      toast({
        title: "Reinsurer Inactive",
        description: "Activate the reinsurer to edit details.",
        variant: "destructive",
      });
      return;
    }

    if (!logoFile && !existingLogoUrl) {
      toast({
        title: "Logo Required",
        description: "A company logo is required. Please upload one.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!reinsurerMapId) throw new Error("Missing reinsurer id");

      let finalLogoUrl = existingLogoUrl;
      let finalLogoId = existingLogoId;

      if (logoFile) {
        try {
          const fd = new FormData();
          fd.append("file", logoFile);
          fd.append("key", "companyLogo");
          const uploadRes = await uploadReinsurerLogoFile(fd);
          finalLogoUrl = uploadRes.logoUrl || finalLogoUrl;
          finalLogoId = uploadRes.logoFileId || finalLogoId;
          toast({ title: "Logo Uploaded", description: "New logo uploaded successfully." });
        } catch (e) {
          console.error("Logo upload failed", e);
          toast({
            title: "Logo Error",
            description: "Failed to upload new logo. The update has been cancelled.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      const selectedCountryObjects = (formData.countries || [])
        .map((id) => masterCountries.find((co) => co.id === id))
        .filter((v): v is (typeof masterCountries)[number] => Boolean(v));

      const selectedRegionObjects = (formData.regions || [])
        .map((id) => masterRegions.find((reg) => reg.id === id))
        .filter((v): v is (typeof masterRegions)[number] => Boolean(v));

      const selectedZoneObjects = (formData.zones || [])
        .map((id) => masterZones.find((zo) => zo.id === id))
        .filter((v): v is (typeof masterZones)[number] => Boolean(v));

      const payload: UpdateReinsurerRequest = {
        name: formData.name,
        gradeId: formData.gradeId,
        licenseNumber: formData.licenseNumber || undefined,
        contactEmail: formData.email,
        phone: formData.phone,
        address: formData.address,
        operatingCountries: selectedCountryObjects.map((co) => ({
          id: co.id,
          value: co.value,
          label: co.label,
          active: true,
        })),
        operatingRegions: selectedRegionObjects.map((reg) => ({
          id: reg.id,
          value: reg.value,
          label: reg.label,
          countryId: reg.countryId,
          active: true,
        })),
        operatingZones: selectedZoneObjects.map((zo) => ({
          id: zo.id,
          value: zo.value,
          label: zo.label,
          regionId: zo.regionId,
          active: true,
        })),
        adminEmail: formData.adminUserEmail,
        adminName: formData.adminUserName,
        adminPassword: formData.adminUserPassword || undefined,
        companyLogo: finalLogoUrl ?? null,
        companyLogoId: finalLogoId ?? null,
      };

      await updateReinsurer(reinsurerMapId, payload);
      toast({ title: "Success", description: "Reinsurer details updated successfully!" });
      navigate("/market-admin/reinsurance-management");
    } catch (error: unknown) {
      const msg = messageFromUnknown(error, "Failed to update reinsurer.");
      setErrorMessage(msg);
      toast({ title: "Update Failed", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File",
        description: "Please upload a JPEG, PNG, SVG, or WebP image. GIF and video files are not allowed.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 5MB", variant: "destructive" });
      return;
    }
    setLogoFile(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setExistingLogoUrl(null);
    setExistingLogoId(null);
    setExistingLogoSize(null);
    const fileInput = document.getElementById("edit-reinsurer-logo-file") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleToggleStatus = () => {
    setPendingStatus(!isActive);
    setShowConfirmDialog(true);
  };

  const confirmStatusChange = async () => {
    if (pendingStatus === null || !reinsurerMapId) return;
    try {
      setStatusChanging(true);
      await setReinsurerStatus(reinsurerMapId, pendingStatus);
      setIsActive(pendingStatus);
      toast({
        title: "Status Updated",
        description: `Reinsurer ${pendingStatus ? "activated" : "deactivated"} successfully!`,
      });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: messageFromUnknown(err, "Status change failed."),
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

  if (loadError || (!reinsurerData && !isLoading)) {
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
              <p className="text-muted-foreground">{loadError || "Reinsurer not found."}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const logoPreviewSrc = logoFile ? URL.createObjectURL(logoFile) : existingLogoUrl;
  const logoName = logoFile ? logoFile.name : "Current Logo";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
      <div className="flex-1 p-6">
        <div className="w-full max-w-7xl mx-auto">
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
                <h1 className="text-3xl font-bold text-foreground">Edit Reinsurer</h1>
                <p className="text-muted-foreground">Update details for {reinsurerData?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card p-4 rounded-lg border">
              <Label htmlFor="reinsurer-status" className="text-sm font-medium">
                {isActive ? "Active" : "Inactive"}
              </Label>
              <Switch id="reinsurer-status" checked={isActive} onCheckedChange={handleToggleStatus} />
            </div>
          </div>

          <div className={`transition-all duration-300 ${!isActive ? "opacity-75" : ""}`}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Company Logo <span className="text-destructive">*</span>
                </CardTitle>
                <CardDescription>Upload a logo image for the reinsurer (required).</CardDescription>
              </CardHeader>
              <CardContent>
                {!logoPreviewSrc ? (
                  <div
                    className={`border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center transition-colors ${
                      !isActive ? "opacity-50 pointer-events-none" : "hover:bg-muted/50"
                    }`}
                  >
                    <input
                      id="edit-reinsurer-logo-file"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                      onChange={handleLogoFileChange}
                      disabled={!isActive}
                    />
                    <label
                      htmlFor="edit-reinsurer-logo-file"
                      className={`flex flex-col items-center gap-3 ${!isActive ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">Click to upload logo</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, SVG, WebP up to 5MB</p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="mt-2"
                        disabled={!isActive}
                        onClick={() => document.getElementById("edit-reinsurer-logo-file")?.click()}
                      >
                        Select Image
                      </Button>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded bg-background border flex items-center justify-center overflow-hidden p-1">
                        <img
                          src={logoPreviewSrc}
                          alt="Logo Preview"
                          className="w-full h-full object-cover"
                          onLoad={(e) => {
                            if (logoFile) URL.revokeObjectURL((e.target as HTMLImageElement).src);
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              reinsurerData?.name || "R",
                            )}&background=random`;
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{logoName}</p>
                        {!logoFile && (
                          <p className="text-xs text-muted-foreground">
                            {existingLogoSize ? formatFileSize(existingLogoSize) : "Existing uploaded logo"}
                          </p>
                        )}
                        {logoFile && (
                          <p className="text-xs text-muted-foreground">{formatFileSize(logoFile.size)}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeLogo}
                      disabled={!isActive}
                      className="text-muted-foreground hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <ReinsurerForm
              mode="edit"
              initialData={reinsurerData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              serverError={errorMessage}
              disabled={!isActive}
            />
          </div>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus ? "Activate" : "Deactivate"} Reinsurer
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {pendingStatus ? "activate" : "deactivate"}{" "}
              {reinsurerData?.name}?
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

export default EditReinsurer;
