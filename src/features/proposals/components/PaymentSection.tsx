import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from '@/shared/utils/lib-utils';
import { useNavigate, Link } from "react-router-dom";
import { useNavigationHistory } from '@/shared/hooks/use-navigation-history';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollableTabs } from '@/components/ui/ScrollableTabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CreditCard,
  Shield,
  Calendar,
  CheckCircle,
  DollarSign,
  Lock,
  Receipt,
  AlertCircle,
  FileText,
} from "lucide-react";
import { issuePolicy } from '@/features/quotes/api/quotes';
import { useQuoteSelectionStore } from '@/shared/stores/useQuoteSelectionStore';
import { useToast } from "@/components/ui/use-toast";
import { useDeclarationUploadsStore } from '@/shared/stores/useDeclarationUploadsStore';

export const PaymentSection = () => {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [showPreview, setShowPreview] = useState(false);
  const [latestFormData, setLatestFormData] = useState<Record<string, any> | null>(null);
  const navigate = useNavigate();
  const { navigateBack } = useNavigationHistory();

  // Read uploaded declaration documents directly from the Zustand store
  const responseId = useQuoteSelectionStore((s) => s.responseId);
  const uploadsByResponse = useDeclarationUploadsStore((s) => s.uploadsByResponse);
  const uploadedDocuments = useMemo(() => {
    const result: Array<{ docId: string; responseId: string; url: string; filename: string }> = [];
    if (!responseId) return result;
    
    // Only map the documents for the CURRENT response
    const byDoc = uploadsByResponse[String(responseId)] || {};
    for (const [docId, item] of Object.entries(byDoc)) {
      const url = item.url || (item as any)?.data?.url || item.fileUrl || (item as any)?.data?.fileUrl || '';
      const name = item.originalFilename || (item as any)?.data?.originalFilename || item.filename || (item as any)?.data?.filename || docId;
      if (url) result.push({ docId, responseId: String(responseId), url, filename: name });
    }
    return result;
  }, [uploadsByResponse, responseId]);



  const { toast } = useToast();

  const handlePayment = () => {
    // In a real app, you would process payment here
    navigate('/customer/declaration');
  };

  useEffect(() => {
    (async () => {
      try {
        const { getProposals } = await import("@/__mocks__/api/mockProposals");
        const proposals = await getProposals();
        if (Array.isArray(proposals) && proposals.length > 0) {
          const sorted = [...proposals].sort((a, b) => {
            const ta = new Date(a.metadata.updatedAt || a.metadata.createdAt || 0).getTime();
            const tb = new Date(b.metadata.updatedAt || b.metadata.createdAt || 0).getTime();
            return tb - ta;
          });
          setLatestFormData(sorted[0]?.formData || null);
        }
      } catch { }
    })();
  }, []);

  const selectedQuote = {
    insurer: "SecureShield Insurance",
    premium: 24850,
    coverageLimit: formatCurrency(2000000),
    deductible: formatCurrency(25000)
  };


  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Complete Your Payment
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <Card className="border-border shadow-medium sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Receipt className="w-5 h-5" />
                  <span>Payment Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">{selectedQuote.insurer}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coverage Limit:</span>
                      <span>{selectedQuote.coverageLimit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deductible:</span>
                      <span>{selectedQuote.deductible}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Premium:</span>
                    <span>{formatCurrency(selectedQuote.premium)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Policy Fee:</span>
                    <span>{formatCurrency(50)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">State Tax:</span>
                    <span>{formatCurrency(125)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Due:</span>
                  <span className="text-primary">{formatCurrency(selectedQuote.premium + 175)}</span>
                </div>

                <div className="bg-success-light p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-success">Instant Policy Issuance</p>
                      <p className="text-success/80">Your policy certificate will be emailed immediately after payment.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card className="border-border shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Secure Payment</span>
                </CardTitle>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>256-bit SSL encryption</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setShowPreview(true)}>
                    Preview Proposal
                  </Button>
                </div>
                {/* Payment Method */}
                <div>
                  <Label className="text-base font-semibold mb-4 block">Payment Method</Label>
                  <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                    <ScrollableTabs>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="card">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Credit/Debit Card
                        </TabsTrigger>
                        <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
                        <TabsTrigger value="finance">Financing</TabsTrigger>
                      </TabsList>
                    </ScrollableTabs>

                    <TabsContent value="card" className="space-y-4 mt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input id="firstName" placeholder="John" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input id="lastName" placeholder="Doe" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number *</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          className="font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="expiry">Expiry Date *</Label>
                          <Input id="expiry" placeholder="MM/YY" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV *</Label>
                          <Input id="cvv" placeholder="123" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="billingAddress">Billing Address *</Label>
                        <Input id="billingAddress" placeholder="123 Main Street" />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input id="city" placeholder="New York" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State *</Label>
                          <Input id="state" placeholder="NY" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zip">ZIP Code *</Label>
                          <Input id="zip" placeholder="10001" />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="bank" className="space-y-4 mt-6">
                      <div className="bg-primary-light p-6 rounded-lg">
                        <h4 className="font-semibold mb-3">Bank Transfer Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Bank Name:</span>
                            <span>SecureShield Insurance Bank</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Account Number:</span>
                            <span>1234567890</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Routing Number:</span>
                            <span>987654321</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Reference:</span>
                            <span>CAR-INS-2024-001</span>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-warning-light rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
                            <p className="text-sm text-warning">
                              Policy will be issued after payment confirmation (1-3 business days).
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="finance" className="space-y-4 mt-6">
                      <div className="bg-muted/50 p-6 rounded-lg text-center">
                        <h4 className="font-semibold mb-3">Premium Financing Available</h4>
                        <p className="text-muted-foreground mb-4">
                          Spread your premium over 12 months with competitive financing rates starting at 4.9% APR.
                        </p>
                        <Button variant="outline">Apply for Financing</Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Terms and Payment Button */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <input type="checkbox" id="terms" className="mt-1" />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the <a href="#" className="text-primary hover:underline">Terms and Conditions</a> and
                      <a href="#" className="text-primary hover:underline ml-1">Privacy Policy</a>
                    </Label>
                  </div>

                  <Button
                    variant="hero"
                    size="xl"
                    className="w-full"
                    onClick={handlePayment}
                    disabled={paymentMethod === "bank"}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    {paymentMethod === "bank"
                      ? "Complete Bank Transfer"
                      : `Pay ${formatCurrency(selectedQuote.premium + 175)} Now`
                    }
                  </Button>

                  <div className="flex justify-center">
                    <Button variant="outline" asChild>
                      <Link to="/customer/quotes">← Back</Link>
                    </Button>
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    <p>Powered by SecurePay | Your payment information is encrypted and secure</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Proposal Preview</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh]">
              <div className="space-y-5 pr-4">

                {/* ── Uploaded Documents ─────────────────────────── */}
                {uploadedDocuments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 pb-1 border-b">
                      Uploaded Documents
                    </h4>
                    <div className="space-y-2">
                      {uploadedDocuments.map((up, i) => (
                        <div key={`${up.responseId}-${up.docId}-${i}`} className="flex items-center gap-2 text-sm border border-border/40 rounded px-3 py-2">
                          <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                          <a
                            href={up.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium flex-1 truncate"
                            title={up.filename}
                          >
                            {up.filename}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Proposal Form Data ──────────────────────────── */}
                {latestFormData ? (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 pb-1 border-b">
                      Proposal Form Data
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(latestFormData).map(([key, value]) => {
                        let display = "-";
                        if (Array.isArray(value)) {
                          display = value.length
                            ? value.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(", ")
                            : "-";
                        } else if (value && typeof value === "object") {
                          try { display = JSON.stringify(value); } catch { display = String(value); }
                        } else if (value !== undefined && value !== null && value !== "") {
                          display = String(value);
                        }
                        return (
                          <div key={key} className="grid grid-cols-[14rem_1fr] gap-3 text-sm border-b border-border/30 pb-1.5">
                            <span className="text-muted-foreground font-medium truncate" title={key}>{key}</span>
                            <span className="break-words">{display}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No proposal data found to preview. Please use the proposal flow.
                  </p>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};
