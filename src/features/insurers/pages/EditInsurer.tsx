import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
import { ArrowLeft, Plus, X, Upload } from "lucide-react";
import InsurerForm, { InsurerFormData } from "@/features/insurers/components/InsurerForm";
import { toast } from '@/shared/hooks/use-toast';
import { listMasterCountries, listMasterRegions, listMasterZones, Country, Region, Zone } from '@/features/product-config/masters/api/masters';
import { getInsurer, updateInsurer, setInsurerStatus, uploadInsurerLogoFile, UpdateInsurerRequest } from '@/features/insurers/api/insurers';;
import FormSkeleton from "@/components/loaders/FormSkeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from '@/shared/utils/fileUtils';

const EditInsurer = () => {
  const navigate = useNavigate();
  const { insurerId } = useParams<{ insurerId: string }>();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [insurerData, setInsurerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
  const [masterCountries, setMasterCountries] = useState<Country[]>([]);
  const [masterRegions, setMasterRegions] = useState<Region[]>([]);
  const [masterZones, setMasterZones] = useState<Zone[]>([]);

  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [existingLogoId, setExistingLogoId] = useState<string | null>(null);
  const [existingLogoSize, setExistingLogoSize] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      setErrorMessage(null);
      try {
        if (!insurerId) return;

        const [c, r, z, data] = await Promise.all([
          listMasterCountries(),
          listMasterRegions(),
          listMasterZones(),
          getInsurer(insurerId),
        ]);
        setMasterCountries(c);
        setMasterRegions(r);
        setMasterZones(z);

        // Resolve geo ids for pre-population: use geoCoverage first, fallback to branding.metadata
        const fromGeo = data.geoCoverage;
        const fromMeta = data.branding?.metadata;
        const countriesList =
          (fromGeo?.countries?.length ? fromGeo.countries : null) ??
          (fromMeta?.operatingCountries?.length ? fromMeta.operatingCountries : null) ??
          [];
        const regionsList =
          (fromGeo?.regions?.length ? fromGeo.regions : null) ??
          (fromMeta?.operatingRegions?.length ? fromMeta.operatingRegions : null) ??
          [];
        const zonesList =
          (fromGeo?.zones?.length ? fromGeo.zones : null) ??
          (fromMeta?.operatingZones?.length ? fromMeta.operatingZones : null) ??
          [];

        const countryIds = (countriesList as { id?: string }[])
          .map((item) => item.id)
          .filter((v): v is string => Boolean(v));
        const regionIds = (regionsList as { id?: string }[])
          .map((item) => item.id)
          .filter((v): v is string => Boolean(v));
        const zoneIds = (zonesList as { id?: string }[])
          .map((item) => item.id)
          .filter((v): v is string => Boolean(v));

        const logoUrl = data.branding?.logoFileUrl || data.companyLogo || null;
        setExistingLogoUrl(logoUrl);
        setExistingLogoSize(data.branding?.logoFileSize || null);

        // Reset ID to prevent stale state
        setExistingLogoId(null);
        if (logoUrl) {
          // Extract ID from URL if possible to support keeping existing logo
          const match = logoUrl.match(/\/insurer-logos\/([^\/.]+)\./);
          if (match && match[1]) {
            setExistingLogoId(match[1]);
          }
        }

        const mapped = {
          id: data.id,
          name: data.name,
          licenseNumber: data?.license?.licenseNumber || data.licenseNumber || "",
          email: data.tenantEmail || data.email || "",
          phone: data.contactNumber || data.phone || "",
          address: data?.branding?.metadata?.address || data.address || "",
          countries: countryIds,
          regions: regionIds,
          zones: zoneIds,
          adminUserName: data.adminName || "",
          adminUserEmail: data.adminEmail || "",
          // Don't pre-fill password for edit
          adminUserPassword: "",
          status: data.status,
          companyLogo: logoUrl,
        };

        setInsurerData(mapped);
        setIsActive(data.status.toLowerCase() !== "inactive");

      } catch (err: any) {
        console.error("Load Insurer Error:", err);
        const friendly = err?.message || "Failed to load insurer.";
        setLoadError(friendly);
        toast({
          title: "Error",
          description: friendly,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [insurerId]);

  const handleSubmit = async (formData: InsurerFormData) => {
    setErrorMessage(null);

    // Geographical coverage is mandatory; InsurerForm blocks submit and shows validation when empty
    const hasGeo =
      (formData.countries?.length ?? 0) >= 1 &&
      (formData.regions?.length ?? 0) >= 1 &&
      (formData.zones?.length ?? 0) >= 1;
    if (!hasGeo) return;

    // Logo is mandatory even on edit
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
      if (!insurerId) throw new Error("Missing insurer id");

      // 1. Handle Logo Upload
      let finalLogoUrl = existingLogoUrl;
      let finalLogoId = existingLogoId;

      if (logoFile) {
        try {
          const data = new FormData();
          data.append("logo", logoFile);
          const uploadRes = await uploadInsurerLogoFile(data);
          finalLogoUrl = uploadRes.logoUrl;
          finalLogoId = uploadRes.logoFileId;

          toast({
            title: "Logo Uploaded",
            description: "New logo uploaded successfully."
          });
        } catch (e) {
          console.error("Logo upload failed", e);
          toast({
            title: "Logo Error",
            description: "Failed to upload new logo. The update has been cancelled.",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return; // STOP process if upload fails
        }
      } else if (!existingLogoUrl) {
        // Explicitly removed (though we check above, this resets fields)
        finalLogoUrl = null;
        finalLogoId = null;
      }

      // 2. Map Selections to Full Objects
      const selectedCountryObjects = (formData.countries || [])
        .map((id) => masterCountries.find((c) => c.id === id))
        .filter((v): v is (typeof masterCountries)[number] => Boolean(v));

      const selectedRegionObjects = (formData.regions || [])
        .map((id) => masterRegions.find((r) => r.id === id))
        .filter((v): v is (typeof masterRegions)[number] => Boolean(v));

      const selectedZoneObjects = (formData.zones || [])
        .map((id) => masterZones.find((z) => z.id === id))
        .filter((v): v is (typeof masterZones)[number] => Boolean(v));

      // Hierarchical Validation for Geographic Coverage
      // Validation is now handled by Zod schema in InsurerForm


      const payload: UpdateInsurerRequest = {
        name: formData.name,
        licenseNumber: formData.licenseNumber,
        insurerEmail: formData.email,
        contactNumber: formData.phone,
        address: formData.address,
        operatingCountries: selectedCountryObjects.map(c => ({
          id: c.id,
          value: c.value,
          label: c.label,
          active: true
        })),
        operatingRegions: selectedRegionObjects.map(r => ({
          id: r.id,
          value: r.value,
          label: r.label,
          countryId: r.countryId,
          active: true
        })),
        operatingZones: selectedZoneObjects.map(z => ({
          id: z.id,
          value: z.value,
          label: z.label,
          regionId: z.regionId,
          active: true
        })),
        adminName: formData.adminUserName,
        adminEmail: formData.adminUserEmail,
        adminPassword: formData.adminUserPassword || undefined,
      };

      if (logoFile) {
        payload.companyLogo = finalLogoUrl;
        payload.companyLogoId = finalLogoId || undefined;
      }

      await updateInsurer(insurerId, payload);

      toast({
        title: "Success",
        description: "Insurer details updated successfully!"
      });

      navigate("/market-admin/insurer-management");
    } catch (error: any) {
      console.error("Update Insurer Error:", error);
      const msg = (error?.response?.data?.message || error?.data?.message || error?.message || "Failed to update.").toString();

      setErrorMessage(msg);

      toast({
        title: "Update Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (only JPEG, PNG, SVG, WebP - no GIF or videos)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File",
          description: "Please upload a JPEG, PNG, SVG, or WebP image. GIF and video files are not allowed.",
          variant: "destructive"
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max size is 5MB", variant: "destructive" });
        return;
      }
      setLogoFile(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setExistingLogoUrl(null);
    setExistingLogoId(null);
    setExistingLogoSize(null);
    const fileInput = document.getElementById("edit-insurer-logo-file") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleToggleStatus = () => {
    const newStatus = !isActive;
    setPendingStatus(newStatus);
    setShowConfirmDialog(true);
  };

  const [statusChanging, setStatusChanging] = useState(false);
  const confirmStatusChange = async () => {
    if (pendingStatus === null || !insurerId) return;
    try {
      setStatusChanging(true);
      await setInsurerStatus(insurerId, pendingStatus);
      setIsActive(pendingStatus);
      toast({ title: "Status Updated", description: `Insurer ${pendingStatus ? "activated" : "deactivated"} successfully!` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Status change failed", variant: "destructive" });
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

  if (loadError || (!insurerData && !isLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
        <div className="flex-1 p-6">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => navigate("/market-admin/insurer-management")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Error</h1>
              <p className="text-muted-foreground">{loadError || "Insurer not found"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine what to show in logo preview
  const logoPreviewSrc = logoFile
    ? URL.createObjectURL(logoFile)
    : existingLogoUrl;

  const logoName = logoFile ? logoFile.name : "Current Logo";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
      <div className="flex-1 p-6">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate("/market-admin/insurer-management")} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Edit Insurer</h1>
                <p className="text-muted-foreground">Update details for {insurerData.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card p-4 rounded-lg border">
              <Label htmlFor="insurer-status" className="text-sm font-medium">
                {isActive ? "Active" : "Inactive"}
              </Label>
              <Switch id="insurer-status" checked={isActive} onCheckedChange={handleToggleStatus} />
            </div>
          </div>

          {/* Form Content */}
          <div>
            {/* Logo Upload Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Company Logo <span className="text-destructive">*</span>
                </CardTitle>
                <CardDescription>Upload a logo image for the insurer (required).</CardDescription>
              </CardHeader>
              <CardContent>
                {!logoPreviewSrc ? (
                  <div className={`border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center transition-colors ${!isActive ? 'opacity-50 pointer-events-none' : 'hover:bg-muted/50'}`}>
                    <input
                      id="edit-insurer-logo-file"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                      onChange={handleLogoFileChange}
                      disabled={!isActive}
                    />
                    <label htmlFor="edit-insurer-logo-file" className={`flex flex-col items-center gap-3 ${!isActive ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
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
                        onClick={() => document.getElementById("edit-insurer-logo-file")?.click()}
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
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${insurerData.name}&background=random`;
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{logoName}</p>
                        {!logoFile && <p className="text-xs text-muted-foreground">{existingLogoSize ? formatFileSize(existingLogoSize) : "Existing uploaded logo"}</p>}
                        {logoFile && (
                          <>
                            <p className="text-xs text-muted-foreground">{formatFileSize(logoFile.size)}</p>
                            <p className="text-xs text-success-500">New file selected</p>
                          </>
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

            <InsurerForm
              mode="edit"
              initialData={insurerData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              serverError={errorMessage}
              disabled={!isActive}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingStatus ? "Activate" : "Deactivate"} Insurer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {pendingStatus ? "activate" : "deactivate"}{" "}
              {insurerData?.name}?
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

export default EditInsurer;


