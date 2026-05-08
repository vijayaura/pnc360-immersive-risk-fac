import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  onPrevious: () => void;
  onNext: () => void;
  disablePrevious: boolean;
  disableNext: boolean;
  showNext?: boolean;
};

export function StepNavigationButtons({
  onPrevious,
  onNext,
  disablePrevious,
  disableNext,
  showNext = true,
}: Props) {
  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t">
      <Button variant="outline" onClick={onPrevious} disabled={disablePrevious} className="gap-2">
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>
      {showNext && (
        <Button onClick={onNext} disabled={disableNext} className="gap-2">
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

