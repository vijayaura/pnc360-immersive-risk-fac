import type { SourceRef } from "@/data/mock-properties";
import { FileSearch } from "lucide-react";

interface SourceTraceIconProps {
  sourceRef?: SourceRef;
  onNavigateToSource?: (sourceRef: SourceRef) => void;
}

export function SourceTraceIcon({ sourceRef, onNavigateToSource }: SourceTraceIconProps) {
  if (!sourceRef) return null;

  return (
    <div className="relative group inline-flex">
      <button
        onClick={() => onNavigateToSource?.(sourceRef)}
        className="p-1 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
        title={`Source: ${sourceRef.documentName}`}
      >
        <FileSearch className="h-3.5 w-3.5" />
      </button>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs whitespace-nowrap max-w-[280px]">
          <p className="font-medium text-foreground truncate">{sourceRef.documentName}</p>
          <p className="text-muted-foreground mt-0.5">{sourceRef.section}</p>
          {sourceRef.page && <p className="text-muted-foreground">Page {sourceRef.page}</p>}
          <p className="text-primary mt-1 text-[10px]">Click to view source</p>
        </div>
      </div>
    </div>
  );
}
