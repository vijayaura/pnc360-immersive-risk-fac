import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building, Factory, Home, Zap, TrendingUp, Settings } from "lucide-react";
import { getSubProjectTypesByProjectType } from "@/lib/masters-data";

interface ProjectType {
  id: number;
  value: string;
  label: string;
  baseRate: number;
}

interface ProjectTypeCardProps {
  projectType: ProjectType;
  baseRate: number;
  quoteOption: string;
  onBaseRateChange: (value: number) => void;
  onQuoteOptionChange: (value: string) => void;
}

const getProjectTypeIcon = (value: string) => {
  switch (value.toLowerCase()) {
    case 'residential':
      return <Home className="w-5 h-5" />;
    case 'commercial':
      return <Building className="w-5 h-5" />;
    case 'industrial':
      return <Factory className="w-5 h-5" />;
    case 'infrastructure':
      return <Zap className="w-5 h-5" />;
    default:
      return <Settings className="w-5 h-5" />;
  }
};

const getQuoteOptionColor = (option: string) => {
  switch (option) {
    case 'quote':
      return 'bg-success/10 text-success border-success/20';
    case 'no-quote':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'quote-and-refer':
      return 'bg-warning/10 text-warning border-warning/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getQuoteOptionLabel = (option: string) => {
  switch (option) {
    case 'quote':
      return 'Auto Quote';
    case 'no-quote':
      return 'No Quote';
    case 'referral':
      return 'Referral';
    default:
      return option;
  }
};

export const ProjectTypeCard = ({
  projectType,
  baseRate,
  quoteOption,
  onBaseRateChange,
  onQuoteOptionChange,
}: ProjectTypeCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const subProjectTypes = getSubProjectTypesByProjectType(projectType.id);

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${
        isHovered ? 'ring-1 ring-primary/20' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
            {getProjectTypeIcon(projectType.value)}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{projectType.label}</h3>
            <Badge 
              variant="outline" 
              className={`mt-1 ${getQuoteOptionColor(quoteOption)}`}
            >
              {getQuoteOptionLabel(quoteOption)}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Base Rate Input */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Base Rate (%)</Label>
          </div>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={baseRate}
            onChange={(e) => onBaseRateChange(parseFloat(e.target.value) || 0)}
            className="font-mono"
            placeholder="0.00"
          />
        </div>

        {/* Quote Option Select */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quote Decision</Label>
          <Select value={quoteOption} onValueChange={onQuoteOptionChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quote">Auto Quote</SelectItem>
              <SelectItem value="no-quote">No Quote</SelectItem>
              <SelectItem value="quote-and-refer">Quote and Refer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sub Project Types */}
        {subProjectTypes.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Sub Project Types
            </Label>
            <div className="flex flex-wrap gap-1">
              {subProjectTypes.map((subType) => (
                <Badge 
                  key={subType.id} 
                  variant="secondary" 
                  className="text-xs px-2 py-1"
                >
                  {subType.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};