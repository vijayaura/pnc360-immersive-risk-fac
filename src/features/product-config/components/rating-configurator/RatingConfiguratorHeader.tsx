import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';

type Props = {
  productName: string;
  productVersion?: string;
  onBack: () => void;
  onPreviewProposalParameters: () => void;
  onSaveConfiguration: () => void;
};

export function RatingConfiguratorHeader({
  productName,
  productVersion,
  onBack,
  onPreviewProposalParameters,
  onSaveConfiguration,
}: Props) {
  return (
    <div className="border-b bg-background px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Rating Structure Design</h1>
          <p className="text-xs text-muted-foreground">
            {productName}
            {productVersion ? ` v${productVersion}` : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onPreviewProposalParameters}>
          Preview Proposal Parameters
        </Button>
        {/* <Button onClick={onSaveConfiguration} className="gap-2">
          <Save className="w-4 h-4" />
          Save Configuration
        </Button> */}
      </div>
    </div>
  );
}

