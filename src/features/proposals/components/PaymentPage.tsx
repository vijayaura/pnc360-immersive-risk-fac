import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDateDDMMYYYY } from '@/shared/utils/date-format';
import { formatCurrency } from '@/shared/utils/lib-utils';
import { checkAcceptanceExistsForQuote, issuePolicy } from '@/features/quotes/api/policies';
import { useToast } from '@/shared/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { CreditCard, CheckCircle, AlertCircle, Loader2, Receipt, Lock, Shield } from 'lucide-react';
import { usePlanSelectionStore } from '@/shared/stores/usePlanSelectionStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';

interface PaymentPageProps {
  amount?: number;
  currency?: string;
  quoteId: string | number;
  onPaymentSuccess?: () => void;
  onPaymentFailure?: () => void;
}

export const PaymentPage = ({
  amount = 2500,
  currency = 'AED',
  quoteId,
  onPaymentSuccess,
  onPaymentFailure,
}: PaymentPageProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [policyNumber, setPolicyNumber] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [transactionId] = useState(() => Math.floor(Math.random() * 1000000));
  const {
    netPremium,
    brokerCommissionPercent,
    brokerCommissionAmount,
    totalAnnualPremium,
    currency: storeCurrency,
    insurerName,
    coverageAmount,
  } = usePlanSelectionStore();

  const resolvedBasePremium = netPremium > 0 ? netPremium : amount;
  const resolvedTotalDue = totalAnnualPremium > 0 ? totalAnnualPremium : amount;

  const handlePayNow = async () => {
    setStatus('processing');

    try {
      if (quoteId) {
        // 1. Get acceptanceId from quote
        const acceptanceId = await checkAcceptanceExistsForQuote(quoteId);

        if (!acceptanceId) {
          throw new Error('Could not find acceptance ID for this quote');
        }

        // 2. Issue Policy
        const issueRes = await issuePolicy({ acceptanceId });
        setPolicyNumber(issueRes.policyNumber);
        setStatus('success');
        if (onPaymentSuccess) onPaymentSuccess();

        setTimeout(() => {
          const userType = user?.userType;
          const basePath = userType === 'broker' ? 'broker' : 'insurer';
          navigate(`/${basePath}/policy/${issueRes.id}`, {
            replace: true,
            state: { fromPayment: true },
          });
        }, 2000);
        return;
      }

      // Simulate API call delay
      setTimeout(() => {
        // 80% success rate for demo purposes
        const isSuccess = Math.random() > 0.2;

        if (isSuccess) {
          setStatus('success');
          if (onPaymentSuccess) onPaymentSuccess();
          // For demo, we don't have an ID, so we just stay on success page
        } else {
          setStatus('failed');
          if (onPaymentFailure) onPaymentFailure();
        }
      }, 2500);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process policy issuance';
      console.error('Payment/Policy Error:', error);
      setStatus('failed');
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      if (onPaymentFailure) onPaymentFailure();
    }
  };

  const handleRetry = () => {
    setStatus('idle');
  };

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 min-h-[400px]">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
        <h3 className="text-xl font-semibold">Processing Payment...</h3>
        <p className="text-muted-foreground">
          Please do not close this window while we verify your details.
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center min-h-[400px]">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-green-700">Payment Successful!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your transaction has been completed successfully. Your policy documents have been
            generated.
          </p>
        </div>
        <div className="p-4 bg-muted rounded-lg w-full max-w-md border border-border">
          {policyNumber ? (
            <div className="text-sm mb-2 grid grid-cols-[10rem_1fr] items-baseline">
              <span className="text-muted-foreground">Policy Number:</span>
              <span className="font-mono font-medium tabular-nums">{policyNumber}</span>
            </div>
          ) : (
            <div className="text-sm mb-2 grid grid-cols-[10rem_1fr] items-baseline">
              <span className="text-muted-foreground">Transaction ID:</span>
              <span className="font-mono font-medium tabular-nums">
                TXN-{transactionId}
              </span>
            </div>
          )}
          <div className="text-sm mb-2 grid grid-cols-[10rem_1fr] items-baseline">
            <span className="text-muted-foreground">Date:</span>
            <span className="font-medium">{formatDateDDMMYYYY(new Date())}</span>
          </div>
          <Separator className="my-2" />
          <div className="text-sm font-bold grid grid-cols-[10rem_1fr] items-baseline">
            <span>Amount Paid:</span>
            <span className="tabular-nums whitespace-nowrap">
              {formatCurrency(resolvedTotalDue, currency)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center min-h-[400px]">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-red-700">Payment Failed</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            We couldn't process your payment. Please check your card details or try a different
            payment method.
          </p>
        </div>
        <Button onClick={handleRetry} variant="default" size="lg" className="min-w-[150px]">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        {/* Summary */}
        <div className="md:col-span-1 order-2 md:order-1">
          <Card className="border-border shadow-sm h-full">
            <CardHeader className="pb-0 px-0 pt-0">
              <div className="bg-primary px-5 py-4 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-base text-primary-foreground">
                  <Receipt className="w-4 h-4" /> Order Summary
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Data rows */}
              <div className="divide-y divide-border">
                {insurerName && (
                  <div className="px-5 py-3 bg-muted/30">
                    <div className="text-xs text-muted-foreground mb-0.5">Insurer</div>
                    <div className="text-sm font-semibold text-foreground">{insurerName}</div>
                  </div>
                )}
                {typeof coverageAmount === 'number' && coverageAmount > 0 && (
                  <div className="px-5 py-3">
                    <div className="text-xs text-muted-foreground mb-0.5">Coverage Limit</div>
                    <div className="text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(coverageAmount, currency)}
                    </div>
                  </div>
                )}
                <div className="px-5 py-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-0.5">Base Premium</div>
                  <div className="text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(resolvedBasePremium, currency)}
                  </div>
                </div>
                {brokerCommissionAmount > 0 && (
                  <div className="px-5 py-3">
                    <div className="text-xs text-muted-foreground mb-0.5">
                      Broker Commission{brokerCommissionPercent ? ` (${brokerCommissionPercent}%)` : ''}
                    </div>
                    <div className="text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(brokerCommissionAmount, currency)}
                    </div>
                  </div>
                )}
                <div className="px-5 py-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-0.5">Taxes & Fees</div>
                  <div className="text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(0, currency)}
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="px-5 py-4 bg-primary/10 border-t-2 border-primary/20">
                <div className="text-xs font-semibold uppercase tracking-wide text-primary/70 mb-1">Total Premium</div>
                <div className="text-2xl font-bold tabular-nums text-primary">
                  {formatCurrency(resolvedTotalDue, currency)}
                </div>
              </div>

              {/* Security badge */}
              <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-xs text-muted-foreground">Secure SSL Encrypted Transaction</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <div className="md:col-span-2 order-1 md:order-2 flex flex-col">
          <Card className="border-border shadow-sm flex-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" /> Secure Checkout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="card" className="flex gap-2">
                    <CreditCard className="w-4 h-4" /> Credit / Debit Card
                  </TabsTrigger>
                  <TabsTrigger value="bank" className="flex gap-2">
                    <div className="w-4 h-4 border rounded-sm flex items-center justify-center text-[10px] font-bold">
                      $
                    </div>{' '}
                    Bank Transfer
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="card"
                  className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div className="space-y-2">
                    <Label>Card Information</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="0000 0000 0000 0000" className="pl-10 font-mono" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Expiry Date</Label>
                      <Input placeholder="MM / YY" className="font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label>CVC / CVV</Label>
                      <Input placeholder="123" maxLength={4} className="font-mono" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Cardholder Name</Label>
                    <Input placeholder="Name on card" />
                  </div>
                </TabsContent>

                <TabsContent
                  value="bank"
                  className="animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div className="p-6 bg-muted/50 border border-dashed border-border rounded-lg text-center space-y-2">
                    <p className="text-sm font-medium">Bank Transfer Instructions</p>
                    <p className="text-xs text-muted-foreground">
                      Select this option to receive an invoice with bank transfer details. Your
                      policy will be issued once funds are cleared.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <Button className="w-full text-lg py-6" size="lg" onClick={handlePayNow}>
                Pay {formatCurrency(resolvedTotalDue, currency)}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

