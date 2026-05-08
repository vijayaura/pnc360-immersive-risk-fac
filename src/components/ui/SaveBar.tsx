import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Save } from 'lucide-react';
import { useUnsavedChanges } from '@/shared/hooks/use-unsaved-changes';

export function SaveBar() {
  const { isDirty } = useUnsavedChanges();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isDirty);
  }, [isDirty]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 rounded-full border bg-background/95 backdrop-blur px-4 py-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <span className="text-sm">You have unsaved changes.</span>
        <Button size="sm" className="gap-1 save-pulse" onClick={() => (document.getElementById('primary-save-button') as HTMLButtonElement | null)?.click()}>
          <Save className="w-4 h-4" />
          Save
        </Button>
      </div>
    </div>
  );
}

export default SaveBar;


