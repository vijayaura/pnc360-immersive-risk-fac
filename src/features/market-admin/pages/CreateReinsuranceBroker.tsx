import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ReinsuranceBrokerForm, {
  buildFacultativeTreatyPayload,
  buildFacilityIntelligencePayload,
  type ReinsuranceBrokerFormData,
} from "@/features/reinsurance-brokers/components/ReinsuranceBrokerForm";
import {
  createReinsuranceBroker,
  type CreateReinsuranceBrokerRequest,
} from "@/features/reinsurance-brokers/api/reinsurance-brokers";
import { useToast } from "@/shared/hooks/use-toast";

const CreateReinsuranceBroker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (values: ReinsuranceBrokerFormData) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const payload: CreateReinsuranceBrokerRequest = {
        name: values.name,
        licenseNumber: values.licenseNumber || undefined,
        contactEmail: values.email,
        phone: values.phone,
        address: values.address,
        isDirect: values.isDirect ?? false,
        adminEmail: values.adminUserEmail || undefined,
        adminName: values.adminUserName || undefined,
        facultativeTreaty: buildFacultativeTreatyPayload(values),
        facilityIntelligence: buildFacilityIntelligencePayload(values),
      };

      const res = await createReinsuranceBroker(payload);
      toast({ title: "Success", description: res.message || "Reinsurance broker created successfully." });
      navigate("/market-admin/reinsurance-management");
    } catch (err: any) {
      const msg = (
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        "An error occurred while creating the reinsurance broker."
      ).toString();
      toast({ title: "Creation Failed", description: msg, variant: "destructive" });
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
      <div className="flex-1 p-6">
        <div className="w-full max-w-7xl mx-auto">
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
              <h1 className="text-3xl font-bold text-foreground">Create New Reinsurance Broker</h1>
              <p className="text-muted-foreground">Add a new reinsurance broker to your platform</p>
            </div>
          </div>

          <ReinsuranceBrokerForm
            mode="create"
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            serverError={serverError}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateReinsuranceBroker;
