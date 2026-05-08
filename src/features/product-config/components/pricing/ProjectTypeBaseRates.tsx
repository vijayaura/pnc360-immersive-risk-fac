import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Info } from "lucide-react";
import { ProjectTypeCard } from "./ProjectTypeCard";

interface ProjectType {
  id: number;
  value: string;
  label: string;
  baseRate: number;
}

interface ProjectTypeBaseRatesProps {
  projectTypes: ProjectType[];
  baseRates: Record<string, number>;
  quoteOptions: Record<string, string>;
  onBaseRateChange: (projectType: string, value: number) => void;
  onQuoteOptionChange: (projectType: string, value: string) => void;
}

export const ProjectTypeBaseRates = ({
  projectTypes,
  baseRates,
  quoteOptions,
  onBaseRateChange,
  onQuoteOptionChange,
}: ProjectTypeBaseRatesProps) => {
  const getQuoteOptionStats = () => {
    const stats = {
      quote: 0,
      'no-quote': 0,
      'quote-and-refer': 0,
    };
    
    projectTypes.forEach(type => {
      const option = quoteOptions[type.value] || 'quote';
      if (option in stats) {
        stats[option as keyof typeof stats]++;
      }
    });
    
    return stats;
  };

  const stats = getQuoteOptionStats();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                <span className="text-lg font-bold">1</span>
              </div>
              Base Rates by Project Type
            </CardTitle>
            <CardDescription className="mt-2">
              Configure base premium rates and quote decisions for different project categories
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {projectTypes.length} Project Types
            </Badge>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg mt-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Quote Overview:</span>
          </div>
          <div className="flex gap-4">
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              {stats.quote} Auto Quote
            </Badge>
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
              {stats['referral']} Referral
            </Badge>
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
              {stats['no-quote']} No Quote
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projectTypes.map((projectType) => (
            <ProjectTypeCard
              key={projectType.value}
              projectType={projectType}
              baseRate={baseRates[projectType.value] || 0}
              quoteOption={quoteOptions[projectType.value] || 'quote'}
              onBaseRateChange={(value) => onBaseRateChange(projectType.value, value)}
              onQuoteOptionChange={(value) => onQuoteOptionChange(projectType.value, value)}
            />
          ))}
        </div>
        
        {/* Info Section */}
        <div className="mt-6 p-4 bg-blue-50/50 border border-blue-200/50 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">Premium Calculation</h4>
              <p className="text-xs text-blue-700">
                Base rate is applied as a percentage of the sum insured. Quote decisions determine if the system can auto-quote, 
                requires manual review, or rejects the risk entirely.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};