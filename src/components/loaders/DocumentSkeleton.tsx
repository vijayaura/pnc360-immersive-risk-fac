import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const DocumentSkeleton = () => {
  return (
    <div className="w-full">
      <div className="text-left mb-6">
        <Skeleton className="h-6 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Document List Skeleton */}
      <div className="grid gap-4 lg:gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="border-2 border-border bg-card/50">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 lg:space-x-4 flex-1">
                  <div className="mt-1">
                    <Skeleton className="w-5 h-5 rounded-full" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 lg:space-x-3 mb-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-3/4 mb-3" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 lg:space-x-2 ml-3 lg:ml-4">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DocumentSkeleton;
