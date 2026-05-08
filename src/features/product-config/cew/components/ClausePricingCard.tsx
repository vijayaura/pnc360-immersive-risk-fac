import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, ChevronDown, ChevronRight, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface VariableOption {
  id: number;
  label: string;
  limits: string;
  type: "percentage" | "amount";
  value: number;
}

interface ClausePricing {
  id: number;
  code: string;
  name: string;
  enabled: boolean;
  isMandatory: boolean;
  pricingType: "percentage" | "amount";
  pricingValue: number;
  variableOptions: VariableOption[];
}

interface ClausePricingCardProps {
  clause: ClausePricing;
  onToggle: () => void;
  onUpdateVariable: (clauseId: number, optionId: number, field: string, value: any) => void;
  onAddVariable: () => void;
  onRemoveVariable: (clauseId: number, optionId: number) => void;
}

export const ClausePricingCard = ({ clause, onToggle, onUpdateVariable, onAddVariable, onRemoveVariable }: ClausePricingCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-0">
        {/* Header Section */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            {/* Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={clause.enabled}
                onChange={onToggle}
                disabled={clause.isMandatory}
                className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-2"
              />
            </div>
            
            {/* Clause Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">{clause.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {clause.code}
                </Badge>
                {clause.isMandatory && (
                  <Badge className="bg-primary text-primary-foreground">
                    Mandatory
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {clause.variableOptions.length} variable option{clause.variableOptions.length !== 1 ? 's' : ''}
                {clause.isMandatory && " - Cannot be disabled"}
              </p>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center gap-3">
            {/* Pricing Type & Value */}
            <div className="flex items-center gap-2">
              <Select
                value={clause.pricingType}
                onValueChange={(value) => onUpdateVariable(clause.id, 0, 'pricingType', value)}
                disabled={!clause.enabled}
              >
                <SelectTrigger className="w-16 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">%</SelectItem>
                  <SelectItem value="amount">AED</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                type="number"
                placeholder="0"
                value={clause.pricingValue}
                onChange={(e) => onUpdateVariable(clause.id, 0, 'pricingValue', parseFloat(e.target.value) || 0)}
                disabled={!clause.enabled}
                className="w-20 h-9 text-center"
                step={clause.pricingType === "percentage" ? "0.1" : "100"}
              />
            </div>

            {/* Options Count & Expand Button */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {clause.variableOptions.length} option{clause.variableOptions.length !== 1 ? 's' : ''}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                disabled={!clause.enabled}
                className="h-9 w-9 p-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Expandable Options Section */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent>
            <div className="p-4 bg-muted/20 space-y-4 overflow-x-scroll custom-scrollbars">
              {/* Column Headers */}
              <div className="grid grid-cols-12 gap-3 text-sm font-medium text-muted-foreground px-1 min-w-[1000px]">
                <div className="col-span-3">Label</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-3">Limits</div>
                <div className="col-span-2">Type & Value</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              {/* Variable Options */}
              <div className="space-y-3 min-w-[1000px]">
                {clause.variableOptions.map((option) => (
                  <div key={option.id} className="grid grid-cols-12 gap-3 items-end p-3 bg-background rounded-lg border border-border">
                    {/* Label Input */}
                    <div className="col-span-3">
                      <Label className="text-xs text-muted-foreground mb-1 block">Label</Label>
                      <Input
                        placeholder="Standard Rate"
                        value={option.label}
                        onChange={(e) => onUpdateVariable(clause.id, option.id, 'label', e.target.value)}
                        disabled={!clause.enabled}
                        className="h-9"
                      />
                    </div>
                    {/* Description Input */}
                    <div className="col-span-3">
                      <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
                      <Input
                        placeholder="Short description"
                        value={(option as any).description || ''}
                        onChange={(e) => onUpdateVariable(clause.id, option.id, 'description', e.target.value)}
                        disabled={!clause.enabled}
                        className="h-9"
                      />
                    </div>
                    
                    {/* Limits Input */}
                    <div className="col-span-3">
                      <Label className="text-xs text-muted-foreground mb-1 block">Limits</Label>
                      <Input
                        placeholder="All Coverage"
                        value={option.limits}
                        onChange={(e) => onUpdateVariable(clause.id, option.id, 'limits', e.target.value)}
                        disabled={!clause.enabled}
                        className="h-9"
                      />
                    </div>
                    
                    {/* Type & Value */}
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground mb-1 block">Type & Value</Label>
                      <div className="flex gap-2">
                        <Select
                          value={option.type}
                          onValueChange={(value) => onUpdateVariable(clause.id, option.id, 'type', value)}
                          disabled={!clause.enabled}
                        >
                          <SelectTrigger className="w-16 h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">%</SelectItem>
                            <SelectItem value="amount">AED</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Input
                          type="number"
                          placeholder="0"
                          value={option.value}
                          onChange={(e) => onUpdateVariable(clause.id, option.id, 'value', parseFloat(e.target.value) || 0)}
                          disabled={!clause.enabled}
                          className="flex-1 h-9 text-center"
                          step={option.type === "percentage" ? "0.1" : "100"}
                        />
                      </div>
                    </div>
                    
                    {/* Remove Button with confirmation */}
                    <div className="col-span-1 flex justify-center min-w-[64px]">
                      {clause.variableOptions.length > 1 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!clause.enabled}
                              className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove variable option?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. The variable option will be permanently removed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onRemoveVariable(clause.id, option.id)}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Variable Option Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onAddVariable}
                disabled={!clause.enabled}
                className="w-full h-10 border-dashed border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Variable Option
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
