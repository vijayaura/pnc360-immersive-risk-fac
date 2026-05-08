import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Bell, Mail, MessageSquare, CheckSquare, Eye, EyeOff, Users } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface NotificationConfig {
  email: {
    enabled: boolean;
    smtpHost: string;
    smtpPort: string;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  whatsapp: {
    enabled: boolean;
    apiKey: string;
    apiSecret: string;
    phoneNumberId: string;
    businessAccountId: string;
  };
  milestones: string[];
  milestoneRecipients: {
    [key: string]: ("broker" | "underwriter" | "underwriting-manager")[];
  };
  emailTemplates: {
    [key: string]: {
      subject: string;
      body: string;
    };
  };
  whatsappTemplates: {
    [key: string]: {
      message: string;
    };
  };
}

const milestoneOptions = [
  { value: "quote-created", label: "Quote Created" },
  { value: "quote-submitted", label: "Quote Submitted" },
  { value: "quote-approved", label: "Quote Approved" },
  { value: "quote-rejected", label: "Quote Rejected" },
  { value: "policy-issued", label: "Policy Issued" },
  { value: "policy-renewed", label: "Policy Renewed" },
  { value: "policy-expired", label: "Policy Expired" },
  { value: "claim-submitted", label: "Claim Submitted" },
  { value: "claim-approved", label: "Claim Approved" },
  { value: "claim-rejected", label: "Claim Rejected" },
  { value: "payment-received", label: "Payment Received" },
  { value: "payment-due", label: "Payment Due" },
  { value: "document-uploaded", label: "Document Uploaded" },
  { value: "document-approved", label: "Document Approved" },
  { value: "document-rejected", label: "Document Rejected" },
];

const NotificationsManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const productName = searchParams.get("productName") || "";
  const productVersion = searchParams.get("productVersion") || "";
  const productId = searchParams.get("productId") || "";

  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [showWhatsAppSecret, setShowWhatsAppSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recipientDialogOpen, setRecipientDialogOpen] = useState(false);
  const [pendingMilestone, setPendingMilestone] = useState<string | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<("broker" | "underwriter" | "underwriting-manager")[]>([]);

  const [config, setConfig] = useState<NotificationConfig>({
    email: {
      enabled: false,
      smtpHost: "",
      smtpPort: "587",
      smtpUsername: "",
      smtpPassword: "",
      fromEmail: "",
      fromName: "",
    },
    whatsapp: {
      enabled: false,
      apiKey: "",
      apiSecret: "",
      phoneNumberId: "",
      businessAccountId: "",
    },
    milestones: [],
    milestoneRecipients: {},
    emailTemplates: {},
    whatsappTemplates: {},
  });

  // Initialize templates for selected milestones
  useEffect(() => {
    const newEmailTemplates: { [key: string]: { subject: string; body: string } } = {};
    const newWhatsAppTemplates: { [key: string]: { message: string } } = {};

    config.milestones.forEach((milestone) => {
      if (!config.emailTemplates[milestone]) {
        newEmailTemplates[milestone] = {
          subject: `Notification: ${milestoneOptions.find((m) => m.value === milestone)?.label || milestone}`,
          body: `Dear Customer,\n\nThis is a notification regarding: ${milestoneOptions.find((m) => m.value === milestone)?.label || milestone}.\n\nBest regards,\nYour Insurance Team`,
        };
      } else {
        newEmailTemplates[milestone] = config.emailTemplates[milestone];
      }

      if (!config.whatsappTemplates[milestone]) {
        newWhatsAppTemplates[milestone] = {
          message: `Notification: ${milestoneOptions.find((m) => m.value === milestone)?.label || milestone}. Please check your account for details.`,
        };
      } else {
        newWhatsAppTemplates[milestone] = config.whatsappTemplates[milestone];
      }
    });

    setConfig((prev) => ({
      ...prev,
      emailTemplates: newEmailTemplates,
      whatsappTemplates: newWhatsAppTemplates,
    }));
  }, [config.milestones]);

  const handleMilestoneToggle = (milestone: string) => {
    const isCurrentlyActive = config.milestones.includes(milestone);
    
    if (isCurrentlyActive) {
      // Deactivating - remove from milestones and recipients
      setConfig((prev) => {
        const newMilestoneRecipients = { ...prev.milestoneRecipients };
        delete newMilestoneRecipients[milestone];
        return {
          ...prev,
          milestones: prev.milestones.filter((m) => m !== milestone),
          milestoneRecipients: newMilestoneRecipients,
        };
      });
    } else {
      // Activating - show dialog to select recipients
      setPendingMilestone(milestone);
      setSelectedRecipients([]);
      setRecipientDialogOpen(true);
    }
  };

  const handleConfirmRecipients = () => {
    if (!pendingMilestone || selectedRecipients.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one recipient.",
        variant: "destructive",
      });
      return;
    }

    setConfig((prev) => ({
      ...prev,
      milestones: [...prev.milestones, pendingMilestone!],
      milestoneRecipients: {
        ...prev.milestoneRecipients,
        [pendingMilestone!]: selectedRecipients,
      },
    }));

    setRecipientDialogOpen(false);
    setPendingMilestone(null);
    setSelectedRecipients([]);
    
    toast({
      title: "Notification Activated",
      description: `Notification for ${milestoneOptions.find((m) => m.value === pendingMilestone)?.label || pendingMilestone} has been activated.`,
    });
  };

  const handleCancelRecipients = () => {
    setRecipientDialogOpen(false);
    setPendingMilestone(null);
    setSelectedRecipients([]);
  };

  const toggleRecipient = (recipient: "broker" | "underwriter" | "underwriting-manager") => {
    setSelectedRecipients((prev) =>
      prev.includes(recipient)
        ? prev.filter((r) => r !== recipient)
        : [...prev, recipient]
    );
  };

  const getRecipientLabel = (recipient: string) => {
    switch (recipient) {
      case "broker":
        return "Distributor";
      case "underwriter":
        return "Underwriter";
      case "underwriting-manager":
        return "Underwriting Manager";
      default:
        return recipient;
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement API call to save notification configuration
      // await saveNotificationConfig(productId, config);
      
      toast({
        title: "Notifications Configuration Saved",
        description: "Notification settings have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save notification configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6">
        <div className="w-full px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Notifications Management
              </h1>
              <p className="text-muted-foreground mt-1">
                {productName && `Configure notifications for ${productName}${productVersion ? ` - ${productVersion}` : ""}`}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Milestones Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />
                  Select Milestones
                </CardTitle>
                <CardDescription>
                  Choose the pages/milestones where notifications should be triggered
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {milestoneOptions.map((milestone) => {
                    const isActive = config.milestones.includes(milestone.value);
                    const recipients = config.milestoneRecipients[milestone.value] || [];
                    return (
                      <div
                        key={milestone.value}
                        className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-muted/50"
                      >
                        <Checkbox
                          id={milestone.value}
                          checked={isActive}
                          onCheckedChange={() => handleMilestoneToggle(milestone.value)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={milestone.value}
                            className="text-sm font-medium cursor-pointer block"
                          >
                            {milestone.label}
                          </Label>
                          {isActive && recipients.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {recipients.map((recipient) => (
                                <Badge
                                  key={recipient}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  <Users className="w-3 h-3 mr-1" />
                                  {getRecipientLabel(recipient)}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Email and WhatsApp Configuration */}
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Notifications
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp Notifications
                </TabsTrigger>
              </TabsList>

              {/* Email Configuration */}
              <TabsContent value="email" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Mail className="w-5 h-5" />
                          Email Configuration
                        </CardTitle>
                        <CardDescription>
                          Configure email notification settings and credentials
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="email-enabled">Enable Email Notifications</Label>
                        <Switch
                          id="email-enabled"
                          checked={config.email.enabled}
                          onCheckedChange={(checked) =>
                            setConfig((prev) => ({
                              ...prev,
                              email: { ...prev.email, enabled: checked },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-host">SMTP Host *</Label>
                        <Input
                          id="smtp-host"
                          value={config.email.smtpHost}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              email: { ...prev.email, smtpHost: e.target.value },
                            }))
                          }
                          placeholder="smtp.gmail.com"
                          disabled={!config.email.enabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-port">SMTP Port *</Label>
                        <Input
                          id="smtp-port"
                          value={config.email.smtpPort}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              email: { ...prev.email, smtpPort: e.target.value },
                            }))
                          }
                          placeholder="587"
                          disabled={!config.email.enabled}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-username">SMTP Username *</Label>
                        <Input
                          id="smtp-username"
                          value={config.email.smtpUsername}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              email: { ...prev.email, smtpUsername: e.target.value },
                            }))
                          }
                          placeholder="your-email@example.com"
                          disabled={!config.email.enabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-password">SMTP Password *</Label>
                        <div className="relative">
                          <Input
                            id="smtp-password"
                            type={showEmailPassword ? "text" : "password"}
                            value={config.email.smtpPassword}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                email: { ...prev.email, smtpPassword: e.target.value },
                              }))
                            }
                            placeholder="Enter password"
                            disabled={!config.email.enabled}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowEmailPassword(!showEmailPassword)}
                            disabled={!config.email.enabled}
                          >
                            {showEmailPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="from-email">From Email *</Label>
                        <Input
                          id="from-email"
                          value={config.email.fromEmail}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              email: { ...prev.email, fromEmail: e.target.value },
                            }))
                          }
                          placeholder="noreply@example.com"
                          disabled={!config.email.enabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="from-name">From Name *</Label>
                        <Input
                          id="from-name"
                          value={config.email.fromName}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              email: { ...prev.email, fromName: e.target.value },
                            }))
                          }
                          placeholder="Insurance Company"
                          disabled={!config.email.enabled}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Email Templates */}
                {config.milestones.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Email Templates</CardTitle>
                      <CardDescription>
                        Draft email content for each selected milestone
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {config.milestones.map((milestone) => {
                        const milestoneLabel = milestoneOptions.find((m) => m.value === milestone)?.label || milestone;
                        return (
                          <div key={milestone} className="space-y-4 p-4 border rounded-lg">
                            <h4 className="font-semibold">{milestoneLabel}</h4>
                            <div className="space-y-2">
                              <Label htmlFor={`email-subject-${milestone}`}>Subject</Label>
                              <Input
                                id={`email-subject-${milestone}`}
                                value={config.emailTemplates[milestone]?.subject || ""}
                                onChange={(e) =>
                                  setConfig((prev) => ({
                                    ...prev,
                                    emailTemplates: {
                                      ...prev.emailTemplates,
                                      [milestone]: {
                                        ...prev.emailTemplates[milestone],
                                        subject: e.target.value,
                                        body: prev.emailTemplates[milestone]?.body || "",
                                      },
                                    },
                                  }))
                                }
                                disabled={!config.email.enabled}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`email-body-${milestone}`}>Body</Label>
                              <Textarea
                                id={`email-body-${milestone}`}
                                value={config.emailTemplates[milestone]?.body || ""}
                                onChange={(e) =>
                                  setConfig((prev) => ({
                                    ...prev,
                                    emailTemplates: {
                                      ...prev.emailTemplates,
                                      [milestone]: {
                                        ...prev.emailTemplates[milestone],
                                        subject: prev.emailTemplates[milestone]?.subject || "",
                                        body: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                rows={6}
                                disabled={!config.email.enabled}
                                placeholder="Enter email body content..."
                              />
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* WhatsApp Configuration */}
              <TabsContent value="whatsapp" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          WhatsApp Configuration
                        </CardTitle>
                        <CardDescription>
                          Configure WhatsApp notification settings and credentials
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="whatsapp-enabled">Enable WhatsApp Notifications</Label>
                        <Switch
                          id="whatsapp-enabled"
                          checked={config.whatsapp.enabled}
                          onCheckedChange={(checked) =>
                            setConfig((prev) => ({
                              ...prev,
                              whatsapp: { ...prev.whatsapp, enabled: checked },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp-api-key">API Key *</Label>
                        <Input
                          id="whatsapp-api-key"
                          value={config.whatsapp.apiKey}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              whatsapp: { ...prev.whatsapp, apiKey: e.target.value },
                            }))
                          }
                          placeholder="Enter WhatsApp API Key"
                          disabled={!config.whatsapp.enabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp-api-secret">API Secret *</Label>
                        <div className="relative">
                          <Input
                            id="whatsapp-api-secret"
                            type={showWhatsAppSecret ? "text" : "password"}
                            value={config.whatsapp.apiSecret}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                whatsapp: { ...prev.whatsapp, apiSecret: e.target.value },
                              }))
                            }
                            placeholder="Enter API Secret"
                            disabled={!config.whatsapp.enabled}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowWhatsAppSecret(!showWhatsAppSecret)}
                            disabled={!config.whatsapp.enabled}
                          >
                            {showWhatsAppSecret ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp-phone-number-id">Phone Number ID *</Label>
                        <Input
                          id="whatsapp-phone-number-id"
                          value={config.whatsapp.phoneNumberId}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              whatsapp: { ...prev.whatsapp, phoneNumberId: e.target.value },
                            }))
                          }
                          placeholder="Enter Phone Number ID"
                          disabled={!config.whatsapp.enabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp-business-account-id">Business Account ID *</Label>
                        <Input
                          id="whatsapp-business-account-id"
                          value={config.whatsapp.businessAccountId}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              whatsapp: { ...prev.whatsapp, businessAccountId: e.target.value },
                            }))
                          }
                          placeholder="Enter Business Account ID"
                          disabled={!config.whatsapp.enabled}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* WhatsApp Templates */}
                {config.milestones.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>WhatsApp Templates</CardTitle>
                      <CardDescription>
                        Draft WhatsApp message content for each selected milestone
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {config.milestones.map((milestone) => {
                        const milestoneLabel = milestoneOptions.find((m) => m.value === milestone)?.label || milestone;
                        return (
                          <div key={milestone} className="space-y-4 p-4 border rounded-lg">
                            <h4 className="font-semibold">{milestoneLabel}</h4>
                            <div className="space-y-2">
                              <Label htmlFor={`whatsapp-message-${milestone}`}>Message</Label>
                              <Textarea
                                id={`whatsapp-message-${milestone}`}
                                value={config.whatsappTemplates[milestone]?.message || ""}
                                onChange={(e) =>
                                  setConfig((prev) => ({
                                    ...prev,
                                    whatsappTemplates: {
                                      ...prev.whatsappTemplates,
                                      [milestone]: {
                                        message: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                rows={4}
                                disabled={!config.whatsapp.enabled}
                                placeholder="Enter WhatsApp message content..."
                              />
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="gap-2"
                disabled={isLoading}
              >
                <Save className="w-4 h-4" />
                {isLoading ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Recipient Selection Dialog */}
      <Dialog open={recipientDialogOpen} onOpenChange={setRecipientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Notification Recipients</DialogTitle>
            <DialogDescription>
              Choose who should receive notifications for{" "}
              <strong>
                {pendingMilestone
                  ? milestoneOptions.find((m) => m.value === pendingMilestone)?.label || pendingMilestone
                  : ""}
              </strong>
              . You can select multiple recipients.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div
                className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleRecipient("broker")}
              >
                <Checkbox
                  checked={selectedRecipients.includes("broker")}
                  onCheckedChange={() => toggleRecipient("broker")}
                />
                <Label className="text-sm font-medium cursor-pointer flex-1">
                  Distributor
                </Label>
              </div>
              <div
                className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleRecipient("underwriter")}
              >
                <Checkbox
                  checked={selectedRecipients.includes("underwriter")}
                  onCheckedChange={() => toggleRecipient("underwriter")}
                />
                <Label className="text-sm font-medium cursor-pointer flex-1">
                  Underwriter
                </Label>
              </div>
              <div
                className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleRecipient("underwriting-manager")}
              >
                <Checkbox
                  checked={selectedRecipients.includes("underwriting-manager")}
                  onCheckedChange={() => toggleRecipient("underwriting-manager")}
                />
                <Label className="text-sm font-medium cursor-pointer flex-1">
                  Underwriting Manager
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelRecipients}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmRecipients}
              disabled={selectedRecipients.length === 0}
            >
              Activate Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationsManagement;

