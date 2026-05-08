import { Loader2 } from 'lucide-react';

interface IntegrationLoadingOverlayProps {
  visible: boolean;
}

export function IntegrationLoadingOverlay({ visible }: IntegrationLoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Processing API request...</p>
      </div>
    </div>
  );
}
