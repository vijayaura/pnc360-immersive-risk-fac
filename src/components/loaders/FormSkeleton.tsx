import { Skeleton } from "@/components/ui/skeleton";

interface FormSkeletonProps {
  pairs?: number; // number of label+input pairs
  showHeader?: boolean;
  showSubmit?: boolean;
}

export const FormSkeleton = ({ pairs = 6, showHeader = true, showSubmit = true }: FormSkeletonProps) => {
  return (
    <div>
      {showHeader && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-28" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
      )}

      <div className="space-y-4">
        {Array.from({ length: pairs }).map((_, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}

        {showSubmit && (
          <div className="flex justify-end">
            <Skeleton className="h-10 w-36" />
          </div>
        )}
      </div>
    </div>
  );
};

export default FormSkeleton;


