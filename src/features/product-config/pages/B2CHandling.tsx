import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, ShoppingCart, Globe, CreditCard, FileText, CheckCircle2, Circle } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import { Badge } from "@/components/ui/badge";

interface B2CConfig {
  enabled: boolean;
  productName: string;
  productDescription: string;
  pricingModel: "STANDARD" | "DYNAMIC" | "QUOTE_BASED";
  paymentOptions: {
    onlinePayment: boolean;
    installmentPlans: boolean;
    maxInstallments: number;
  };
  availability: {
    startDate: string;
    endDate?: string; // Optional end date
  };
  customerRequirements: {
    requireRegistration: boolean;
    verificationMethods: ("EMAIL" | "OTP")[];
    minAge: number;
    allowedCustomerTypes: ("INDIVIDUAL" | "BUSINESS")[];
  };
  displaySettings: {
    showOnWebsite: boolean;
    showOnMobileApp: boolean;
    featured: boolean;
    tags: string[];
  };
  faq: Array<{ question: string; answer: string }>;
}

const B2CHandling = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const productName = searchParams.get("productName") || "";
  const productVersion = searchParams.get("productVersion") || "";
  const productId = searchParams.get("productId") || "";

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [b2cConfig, setB2CConfig] = useState<B2CConfig>({
    enabled: false,
    productName: productName,
    productDescription: "",
    pricingModel: "STANDARD",
    paymentOptions: {
      onlinePayment: true,
      installmentPlans: false,
      maxInstallments: 3,
    },
    availability: {
      startDate: new Date().toISOString().split("T")[0],
      endDate: undefined,
    },
    customerRequirements: {
      requireRegistration: true,
      verificationMethods: [],
      minAge: 18,
      allowedCustomerTypes: productName.toLowerCase().includes("money") ? ["BUSINESS"] : ["INDIVIDUAL"],
    },
    displaySettings: {
      showOnWebsite: true,
      showOnMobileApp: false,
      featured: false,
      tags: [],
    },
    faq: [],
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validate if enabled
      if (b2cConfig.enabled) {
        if (!b2cConfig.productDescription) {
          toast({
            title: "Validation Error",
            description: "Product description is required when B2C is enabled.",
            variant: "destructive",
          });
          return;
        }
      }

      // TODO: Save to API
      // const response = await saveB2CConfig(productId, b2cConfig);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsSaved(true);
      toast({
        title: "Configuration Saved",
        description: `B2C Handling has been ${b2cConfig.enabled ? "enabled" : "disabled"} successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save B2C configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addFAQ = () => {
    setB2CConfig((prev) => ({
      ...prev,
      faq: [...prev.faq, { question: "", answer: "" }],
    }));
    setIsSaved(false);
  };

  const removeFAQ = (index: number) => {
    setB2CConfig((prev) => ({
      ...prev,
      faq: prev.faq.filter((_, i) => i !== index),
    }));
    setIsSaved(false);
  };

  const updateFAQ = (index: number, field: "question" | "answer", value: string) => {
    setB2CConfig((prev) => ({
      ...prev,
      faq: prev.faq.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
    setIsSaved(false);
  };

  const addTag = (tag: string) => {
    if (tag && !b2cConfig.displaySettings.tags.includes(tag)) {
      setB2CConfig((prev) => ({
        ...prev,
        displaySettings: {
          ...prev.displaySettings,
          tags: [...prev.displaySettings.tags, tag],
        },
      }));
      setIsSaved(false);
    }
  };

  const removeTag = (tag: string) => {
    setB2CConfig((prev) => ({
      ...prev,
      displaySettings: {
        ...prev.displaySettings,
        tags: prev.displaySettings.tags.filter((t) => t !== tag),
      },
    }));
    setIsSaved(false);
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
                <h1 className="text-2xl font-bold text-foreground">B2C Handling</h1>
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

          {/* Enable/Disable Toggle */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Enable B2C Direct Customer Access</CardTitle>
                  <CardDescription>
                    Enable this product to be available directly to customers through B2C channels
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={b2cConfig.enabled ? "default" : "secondary"}>
                    {b2cConfig.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Switch
                    checked={b2cConfig.enabled}
                    onCheckedChange={(checked) => {
                      setB2CConfig((prev) => ({ ...prev, enabled: checked }));
                      setIsSaved(false);
                    }}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          {b2cConfig.enabled && (
            <div className="space-y-6">
              {/* Product Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Product Information</CardTitle>
                  <CardDescription>Configure how the product appears to customers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input
                      id="product-name"
                      value={b2cConfig.productName}
                      onChange={(e) => {
                        setB2CConfig((prev) => ({ ...prev, productName: e.target.value }));
                        setIsSaved(false);
                      }}
                      placeholder="Enter product name for B2C"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-description">Product Description</Label>
                    <Textarea
                      id="product-description"
                      value={b2cConfig.productDescription}
                      onChange={(e) => {
                        setB2CConfig((prev) => ({ ...prev, productDescription: e.target.value }));
                        setIsSaved(false);
                      }}
                      placeholder="Enter detailed product description for customers"
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricing-model">Pricing Model</Label>
                    <Select
                      value={b2cConfig.pricingModel}
                      onValueChange={(value: "STANDARD" | "DYNAMIC" | "QUOTE_BASED") => {
                        setB2CConfig((prev) => ({ ...prev, pricingModel: value }));
                        setIsSaved(false);
                      }}
                    >
                      <SelectTrigger id="pricing-model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STANDARD">Standard Pricing</SelectItem>
                        <SelectItem value="DYNAMIC">Dynamic Pricing</SelectItem>
                        <SelectItem value="QUOTE_BASED">Quote-Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Options</CardTitle>
                  <CardDescription>Configure payment methods available to customers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="online-payment">Online Payment</Label>
                      <p className="text-sm text-muted-foreground">Allow customers to pay online</p>
                    </div>
                    <Switch
                      id="online-payment"
                      checked={b2cConfig.paymentOptions.onlinePayment}
                      onCheckedChange={(checked) => {
                        setB2CConfig((prev) => ({
                          ...prev,
                          paymentOptions: { ...prev.paymentOptions, onlinePayment: checked },
                        }));
                        setIsSaved(false);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="installment-plans">Installment Plans</Label>
                      <p className="text-sm text-muted-foreground">Allow customers to pay in installments</p>
                    </div>
                    <Switch
                      id="installment-plans"
                      checked={b2cConfig.paymentOptions.installmentPlans}
                      onCheckedChange={(checked) => {
                        setB2CConfig((prev) => ({
                          ...prev,
                          paymentOptions: { ...prev.paymentOptions, installmentPlans: checked },
                        }));
                        setIsSaved(false);
                      }}
                    />
                  </div>
                  {b2cConfig.paymentOptions.installmentPlans && (
                    <div className="space-y-2">
                      <Label htmlFor="max-installments">Maximum Installments</Label>
                      <Input
                        id="max-installments"
                        type="number"
                        value={b2cConfig.paymentOptions.maxInstallments}
                        onChange={(e) => {
                          setB2CConfig((prev) => ({
                            ...prev,
                            paymentOptions: {
                              ...prev.paymentOptions,
                              maxInstallments: parseInt(e.target.value) || 3,
                            },
                          }));
                          setIsSaved(false);
                        }}
                        min="1"
                        max="12"
                        className="w-32"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Availability */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Availability</CardTitle>
                  <CardDescription>Configure when the product is available (Country: UAE - controlled from Masters)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Available Country:</strong> UAE (controlled from Masters Management)
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={b2cConfig.availability.startDate}
                        onChange={(e) => {
                          setB2CConfig((prev) => ({
                            ...prev,
                            availability: { ...prev.availability, startDate: e.target.value },
                          }));
                          setIsSaved(false);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date (Optional)</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={b2cConfig.availability.endDate || ""}
                        onChange={(e) => {
                          setB2CConfig((prev) => ({
                            ...prev,
                            availability: { ...prev.availability, endDate: e.target.value || undefined },
                          }));
                          setIsSaved(false);
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Requirements</CardTitle>
                  <CardDescription>Configure eligibility requirements for customers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="require-registration">Require Registration</Label>
                      <p className="text-sm text-muted-foreground">Customers must register before purchasing</p>
                    </div>
                    <Switch
                      id="require-registration"
                      checked={b2cConfig.customerRequirements.requireRegistration}
                      onCheckedChange={(checked) => {
                        setB2CConfig((prev) => ({
                          ...prev,
                          customerRequirements: {
                            ...prev.customerRequirements,
                            requireRegistration: checked,
                          },
                        }));
                        setIsSaved(false);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Verification Methods</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="verification-email"
                          checked={b2cConfig.customerRequirements.verificationMethods.includes("EMAIL")}
                          onChange={(e) => {
                            setB2CConfig((prev) => ({
                              ...prev,
                              customerRequirements: {
                                ...prev.customerRequirements,
                                verificationMethods: e.target.checked
                                  ? [...prev.customerRequirements.verificationMethods, "EMAIL"]
                                  : prev.customerRequirements.verificationMethods.filter((m) => m !== "EMAIL"),
                              },
                            }));
                            setIsSaved(false);
                          }}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="verification-email" className="cursor-pointer">
                          Email Verification
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="verification-otp"
                          checked={b2cConfig.customerRequirements.verificationMethods.includes("OTP")}
                          onChange={(e) => {
                            setB2CConfig((prev) => ({
                              ...prev,
                              customerRequirements: {
                                ...prev.customerRequirements,
                                verificationMethods: e.target.checked
                                  ? [...prev.customerRequirements.verificationMethods, "OTP"]
                                  : prev.customerRequirements.verificationMethods.filter((m) => m !== "OTP"),
                              },
                            }));
                            setIsSaved(false);
                          }}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="verification-otp" className="cursor-pointer">
                          OTP Verification
                        </Label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-age">Minimum Age</Label>
                    <Input
                      id="min-age"
                      type="number"
                      value={b2cConfig.customerRequirements.minAge}
                      onChange={(e) => {
                        setB2CConfig((prev) => ({
                          ...prev,
                          customerRequirements: {
                            ...prev.customerRequirements,
                            minAge: parseInt(e.target.value) || 18,
                          },
                        }));
                        setIsSaved(false);
                      }}
                      min="18"
                      max="100"
                      className="w-32"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Allowed Customer Types</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="customer-individual"
                          checked={b2cConfig.customerRequirements.allowedCustomerTypes.includes("INDIVIDUAL")}
                          onChange={(e) => {
                            setB2CConfig((prev) => ({
                              ...prev,
                              customerRequirements: {
                                ...prev.customerRequirements,
                                allowedCustomerTypes: e.target.checked
                                  ? [...prev.customerRequirements.allowedCustomerTypes, "INDIVIDUAL"]
                                  : prev.customerRequirements.allowedCustomerTypes.filter((t) => t !== "INDIVIDUAL"),
                              },
                            }));
                            setIsSaved(false);
                          }}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="customer-individual" className="cursor-pointer">
                          Individual
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="customer-business"
                          checked={b2cConfig.customerRequirements.allowedCustomerTypes.includes("BUSINESS")}
                          onChange={(e) => {
                            setB2CConfig((prev) => ({
                              ...prev,
                              customerRequirements: {
                                ...prev.customerRequirements,
                                allowedCustomerTypes: e.target.checked
                                  ? [...prev.customerRequirements.allowedCustomerTypes, "BUSINESS"]
                                  : prev.customerRequirements.allowedCustomerTypes.filter((t) => t !== "BUSINESS"),
                              },
                            }));
                            setIsSaved(false);
                          }}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="customer-business" className="cursor-pointer">
                          Business
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Display Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Display Settings</CardTitle>
                  <CardDescription>Configure where and how the product is displayed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-website">Show on Website</Label>
                      <p className="text-sm text-muted-foreground">Display product on company website</p>
                    </div>
                    <Switch
                      id="show-website"
                      checked={b2cConfig.displaySettings.showOnWebsite}
                      onCheckedChange={(checked) => {
                        setB2CConfig((prev) => ({
                          ...prev,
                          displaySettings: { ...prev.displaySettings, showOnWebsite: checked },
                        }));
                        setIsSaved(false);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-mobile">Show on Mobile App</Label>
                      <p className="text-sm text-muted-foreground">Display product on mobile application</p>
                    </div>
                    <Switch
                      id="show-mobile"
                      checked={b2cConfig.displaySettings.showOnMobileApp}
                      onCheckedChange={(checked) => {
                        setB2CConfig((prev) => ({
                          ...prev,
                          displaySettings: { ...prev.displaySettings, showOnMobileApp: checked },
                        }));
                        setIsSaved(false);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="featured">Featured Product</Label>
                      <p className="text-sm text-muted-foreground">Highlight as featured product</p>
                    </div>
                    <Switch
                      id="featured"
                      checked={b2cConfig.displaySettings.featured}
                      onCheckedChange={(checked) => {
                        setB2CConfig((prev) => ({
                          ...prev,
                          displaySettings: { ...prev.displaySettings, featured: checked },
                        }));
                        setIsSaved(false);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {b2cConfig.displaySettings.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag and press Enter"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag(e.currentTarget.value);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
                      <CardDescription>Add common questions and answers for customers</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={addFAQ}>
                      Add FAQ
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {b2cConfig.faq.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>FAQ #{index + 1}</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFAQ(index)}
                              className="text-destructive"
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label>Question</Label>
                            <Input
                              value={item.question}
                              onChange={(e) => updateFAQ(index, "question", e.target.value)}
                              placeholder="Enter question"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Answer</Label>
                            <Textarea
                              value={item.answer}
                              onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                              placeholder="Enter answer"
                              rows={3}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {b2cConfig.faq.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No FAQs added yet. Click "Add FAQ" to add one.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default B2CHandling;

