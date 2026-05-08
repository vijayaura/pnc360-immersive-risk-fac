import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Check, X } from 'lucide-react';

interface FetchIntegrationButtonProps {
  onExecute: () => Promise<boolean>;
  disabled?: boolean;
}

type FetchState = 'idle' | 'loading' | 'success' | 'error';

export function FetchIntegrationButton({ onExecute, disabled }: FetchIntegrationButtonProps) {
  const [state, setState] = useState<FetchState>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = async () => {
    setState('loading');
    try {
      const ok = await onExecute();
      setState(ok ? 'success' : 'error');
    } catch {
      setState('error');
    }
    timeoutRef.current = setTimeout(() => setState('idle'), 2000);
  };

  const icon = {
    idle: <Download className="h-3.5 w-3.5" />,
    loading: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    success: <Check className="h-3.5 w-3.5 text-green-600" />,
    error: <X className="h-3.5 w-3.5 text-red-600" />,
  }[state];

  return (
    <Button
      type="button"
      size="sm"
      className="h-7 gap-1 rounded px-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
      onClick={handleClick}
      disabled={disabled || state === 'loading'}
    >
      {icon}
      {state === 'loading' ? 'Fetching...' : 'Fetch'}
    </Button>
  );
}
