import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Environment } from '@/features/super-admin/api/super-admin';
import { Globe, Building2, Users, Shield, Calendar, Activity, Mail } from "lucide-react";
import { formatDateTimeDDMMYYYY } from '@/shared/utils/date-format';

interface EnvironmentDetailsDialogProps {
  environment: Environment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnvironmentDetailsDialog({
  environment,
  open,
  onOpenChange,
}: EnvironmentDetailsDialogProps) {
  if (!environment) return null;

  const getStatusColor = (status: string = "") => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-primary text-primary-foreground hover:bg-primary/80";
      case "inactive":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/80";
      case "pending":
        return "bg-warning text-warning-foreground hover:bg-warning/80";
      case "failed":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/80";
      default:
        return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return formatDateTimeDDMMYYYY(dateString);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <DialogTitle>Environment Details</DialogTitle>
          </div>
          <DialogDescription>
            Detailed information for {environment.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Header Info */}
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <h3 className="text-lg font-semibold">{environment.name}</h3>
              <p className="text-sm text-muted-foreground">{environment.clientName}</p>
            </div>
            <Badge className={getStatusColor(environment.status)}>
              {environment.status?.toUpperCase()}
            </Badge>
          </div>

          {/* Description */}
          {environment.description && (
            <div className="grid gap-2">
              <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
              <p className="text-sm">{environment.description}</p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Market Admins</span>
              </div>
              <p className="text-xl font-bold">{environment.marketAdmins ?? 0}</p>
            </div>
            <div className="p-3 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-accent" />
                <span className="text-xs font-medium text-muted-foreground">Insurers</span>
              </div>
              <p className="text-xl font-bold">{environment.insurers ?? 0}</p>
            </div>
            <div className="p-3 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-secondary" />
                <span className="text-xs font-medium text-muted-foreground">Brokers</span>
              </div>
              <p className="text-xl font-bold">{environment.brokers ?? 0}</p>
            </div>
            <div className="p-3 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Reinsurers</span>
              </div>
              <p className="text-xl font-bold">{environment.reinsurers ?? 0}</p>
            </div>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span className="text-xs">Created At</span>
              </div>
              <p className="text-sm font-medium">{formatDate(environment.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span className="text-xs">Updated At</span>
              </div>
              <p className="text-sm font-medium">{formatDate(environment.updatedAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs">Market ID</span>
              </div>
              <p className="text-sm font-medium">{environment.marketId}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs">Environment ID</span>
              </div>
              <p className="text-sm font-medium">{environment.id}</p>
            </div>
          </div>

          {/* Admin Email */}
          {environment.adminEmail && (
            <div className="pt-2 border-t">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <span className="text-xs">Admin Email</span>
                </div>
                <p className="text-sm font-medium break-all">{environment.adminEmail}</p>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
