import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, X, Upload } from "lucide-react";
import InsurerForm, { InsurerFormData } from "@/features/insurers/components/InsurerForm";
import { createInsurer, uploadInsurerLogoFile } from '@/features/insurers/api/insurers';
import { listMasterCountries, listMasterRegions, listMasterZones } from '@/features/product-config/masters/api/masters';;
import { useToast } from '@/shared/hooks/use-toast';
import { formatFileSize } from '@/shared/utils/fileUtils';

const CreateInsurer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const onSubmit = async (values: InsurerFormData) => {
    setServerError(null);
    if (!logoFile) {
      toast({
        title: "Logo Required",
        description: "Please upload a company logo before creating the insurer.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload logo file
      let logoUrl: string | null = null;
      let logoFileId: string | null = null;

      if (true) { // Logic changed from optional 'if (logoFile)' to mandatory usage
        try {
          const formData = new FormData();
          formData.append("logo", logoFile);

          const uploadRes = await uploadInsurerLogoFile(formData);
          logoUrl = uploadRes.logoUrl;
          logoFileId = uploadRes.logoFileId;

          toast({
            title: "Logo Uploaded",
            description: "Company logo uploaded successfully",
          });
        } catch (error: any) {
          console.error("Error uploading logo:", error);
          toast({
            title: "Logo Upload Failed",
            description: error?.message || "Failed to upload company logo. The insurer cannot be created without a successful logo upload.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return; // Stop the creation process
        }
      }

      // 2. Load master lists to map selected ids to full objects
      // This is required because the backend expects lists of objects for operating locations
      const [masterCountries, masterRegions, masterZones] = await Promise.all([
        listMasterCountries(),
        listMasterRegions(),
        listMasterZones(),
      ]);

      const selectedCountryObjects = (values.countries || [])
        .map((id) => masterCountries.find((c) => c.id === id))
        .filter((v): v is (typeof masterCountries)[number] => Boolean(v));

      const selectedRegionObjects = (values.regions || [])
        .map((id) => masterRegions.find((r) => r.id === id))
        .filter((v): v is (typeof masterRegions)[number] => Boolean(v));

      const selectedZoneObjects = (values.zones || [])
        .map((id) => masterZones.find((z) => z.id === id))
        .filter((v): v is (typeof masterZones)[number] => Boolean(v));

      // Hierarchical Validation for Geographic Coverage
      // Validation is now handled by Zod schema in InsurerForm


      // 3. Construct payload
      const payload: CreateInsurerRequest = {
        name: values.name,
        adminEmail: values.adminUserEmail,
        adminPassword: values.adminUserPassword,
        insurerEmail: values.email,
        contactNumber: values.phone,
        address: values.address,
        licenseNumber: values.licenseNumber || undefined,
        operatingCountries: selectedCountryObjects.map(c => ({
          id: c.id,
          value: c.value,
          label: c.label,
          active: true // Default to active for new selections
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
        companyLogo: logoUrl,
        companyLogoId: logoFileId,
      };

      // 4. Create Insurer
      const res = await createInsurer(payload);

      toast({
        title: "Success",
        description: res.message || "Insurer created successfully"
      });

      navigate("/market-admin/insurer-management");
    } catch (err: any) {
      console.error("Create Insurer Error:", err);
      // Correctly extract error message from Axios response object
      const msg = (err?.response?.data?.message || err?.data?.message || err?.message || "An error occurred while creating the insurer.").toString();

      // Always show toast for any error
      toast({
        title: "Creation Failed",
        description: msg,
        variant: "destructive",
      });

      // Also set server error for inline display in form
      setServerError(msg);
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
          title: "Invalid File Type",
          description: "Please upload a JPEG, PNG, SVG, or WebP image. GIF and video files are not allowed.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      setLogoFile(file);
    }
  };

  const removeLogoFile = () => {
    setLogoFile(null);
    // Reset file input value if needed, though react state handles the UI
    const fileInput = document.getElementById("insurer-logo-file") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
      <div className="flex-1 p-6">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => navigate("/market-admin/insurer-management")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Insurer</h1>
              <p className="text-muted-foreground">Add a new insurance partner to your platform</p>
            </div>
          </div>

          {/* Logo Upload Card - Placed before the main form for better flow */}
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Company Logo <span className="text-destructive">*</span>
                </CardTitle>
                <CardDescription>Upload a logo image for the insurer (required).</CardDescription>
              </CardHeader>
              <CardContent>
                {!logoFile ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                    <input
                      id="insurer-logo-file"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                      onChange={handleLogoFileChange}
                    />
                    <label htmlFor="insurer-logo-file" className="cursor-pointer flex flex-col items-center gap-3">
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
                        onClick={() => document.getElementById("insurer-logo-file")?.click()}
                      >
                        Select Image
                      </Button>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded bg-background border flex items-center justify-center overflow-hidden p-1">
                        {/* Preview if possible, else generic icon */}
                        <img
                          src={URL.createObjectURL(logoFile)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{logoFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(logoFile.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeLogoFile}
                      className="text-muted-foreground hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <InsurerForm mode="create" onSubmit={onSubmit} isSubmitting={isSubmitting} serverError={serverError} />
        </div>
      </div>
    </div>
  );
};

export default CreateInsurer;


