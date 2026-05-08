import { Button } from "@/components/ui/button";

interface Props {
  currentPageIndex: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  isSubmitting: boolean;
  disableBack?: boolean;
  isIntegrationLoading?: boolean;
  nextLabel?: string;
}

export function FormNavigation({
  currentPageIndex,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isSaving,
  isSubmitting,
  disableBack = false,
  isIntegrationLoading = false,
  nextLabel = "Next",
}: Props) {
  return (
    <div className="flex items-center gap-3">
      {currentPageIndex > 0 && (
        <Button variant="outline" onClick={onBack} disabled={disableBack}>
          Previous
        </Button>
      )}

      {currentPageIndex < totalSteps - 1 ? (
        <Button onClick={onNext} disabled={isSaving || isIntegrationLoading}>
          {isIntegrationLoading ? "Processing..." : isSaving ? "Saving..." : nextLabel}
        </Button>
      ) : (
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      )}
    </div>
  );
}
