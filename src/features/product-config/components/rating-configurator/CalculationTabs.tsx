import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollableTabs } from '@/components/ui/ScrollableTabs';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

type Props = {
  value: 'sumInsured' | 'premium'; // | 'basePremium' - Commented out for now
  onValueChange: (value: 'sumInsured' | 'premium') => void; // | 'basePremium') => void; - Commented out for now
  sumInsuredHasFormula: boolean;
  premiumHasFormula: boolean;
  // basePremiumHasFormula?: boolean; - Commented out for now
  sumInsuredHasMissing?: boolean;
  premiumHasMissing?: boolean;
  // basePremiumHasMissing?: boolean; - Commented out for now
};

export function CalculationTabs({
  value,
  onValueChange,
  sumInsuredHasFormula,
  premiumHasFormula,
  // basePremiumHasFormula, - Commented out for now
  sumInsuredHasMissing,
  premiumHasMissing,
  // basePremiumHasMissing, - Commented out for now
}: Props) {
  return (
    <Tabs value={value || 'sumInsured'} onValueChange={(v) => onValueChange(v as 'sumInsured' | 'premium')}>
      <ScrollableTabs>
        <TabsList className="grid w-full grid-cols-2"> {/* grid-cols-3 when basePremium is enabled */}
          {/* Base Premium tab - Commented out for now
          <TabsTrigger value="basePremium" className="flex items-center gap-2">
            {basePremiumHasMissing ? <AlertTriangle className="w-4 h-4 text-red-600" /> : null}
            {basePremiumHasFormula && <CheckCircle2 className="w-4 h-4 text-green-600" />}
            Base Premium
          </TabsTrigger>
          */}
          <TabsTrigger value="sumInsured" className="flex items-center gap-2">
            {sumInsuredHasMissing ? (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            ) : null}
            {sumInsuredHasFormula && <CheckCircle2 className="w-4 h-4 text-green-600" />}
            Sum Insured Calculation
          </TabsTrigger>
          <TabsTrigger value="premium" className="flex items-center gap-2">
            {premiumHasMissing ? <AlertTriangle className="w-4 h-4 text-red-600" /> : null}
            {premiumHasFormula && <CheckCircle2 className="w-4 h-4 text-green-600" />}
            Premium Calculation
          </TabsTrigger>
        </TabsList>
      </ScrollableTabs>
      {/* Base Premium tab content - Commented out for now
      <TabsContent value="basePremium" className="mt-4" />
      */}
      <TabsContent value="sumInsured" className="mt-4" />
      <TabsContent value="premium" className="mt-4" />
    </Tabs>
  );
}
