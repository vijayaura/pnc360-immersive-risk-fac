import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ConfirmDialogConfig {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmDialogConfig | null>(null);
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void | Promise<void>) | null>(null);
  const [onCancelCallback, setOnCancelCallback] = useState<(() => void) | null>(null);

  const showConfirmDialog = (
    config: ConfirmDialogConfig,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
  ) => {
    setConfig(config);
    setOnConfirmCallback(() => onConfirm);
    setOnCancelCallback(() => onCancel || null);
    setIsOpen(true);
  };

  const showConfirmDialogAsync = (config: ConfirmDialogConfig) => {
    return new Promise<boolean>((resolve) => {
      showConfirmDialog(
        config,
        () => resolve(true),
        () => resolve(false),
      );
    });
  };

  const resetDialog = () => {
    setIsOpen(false);
    setConfig(null);
    setOnConfirmCallback(null);
    setOnCancelCallback(null);
  };

  const handleConfirm = async () => {
    try {
      if (onConfirmCallback) {
        await onConfirmCallback();
      }
    } finally {
      resetDialog();
    }
  };

  const handleCancel = () => {
    if (onCancelCallback) {
      onCancelCallback();
    }
    resetDialog();
  };

  const ConfirmDialog = () => {
    if (!config) return null;

    return (
      <AlertDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (open) {
            setIsOpen(true);
          } else {
            handleCancel();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{config.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {config.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={(event) => {
                event.preventDefault();
                handleCancel();
              }}
            >
              {config.cancelText || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(event) => {
                event.preventDefault();
                void handleConfirm();
              }}
              className={config.variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {config.confirmText || "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return {
    showConfirmDialog,
    showConfirmDialogAsync,
    ConfirmDialog,
  };
}
