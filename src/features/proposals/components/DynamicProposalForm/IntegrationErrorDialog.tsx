import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface IntegrationErrorDialogProps {
  open: boolean;
  title: string;
  message: string;
  redirectUrl?: string | null;
  onClose: () => void;
  onRedirect?: (url: string) => void;
}

export function IntegrationErrorDialog({
  open,
  title,
  message,
  redirectUrl,
  onClose,
  onRedirect,
}: IntegrationErrorDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title || 'API Integration Error'}</AlertDialogTitle>
          <AlertDialogDescription>{message || 'An unexpected error occurred while executing the API integration.'}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {redirectUrl && onRedirect && (
            <Button variant="outline" onClick={() => onRedirect(redirectUrl)}>
              Go to Error Page
            </Button>
          )}
          <AlertDialogAction onClick={onClose}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
