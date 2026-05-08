import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Table, TableBody } from "@/components/ui/table";
import TableSkeleton from "@/components/loaders/TableSkeleton";
import { SubProjectBaseRates } from "@/features/product-config/components/pricing/SubProjectBaseRates";

type BaseRatesProps = {
  isLoading: boolean;
  error: string | null;
  projectTypesMasters: any[] | null;
  activeProjectTypes: any[] | Set<any>;
  ratingConfig: any;
  selectedProjectTypes: Set<string>;
  onSubProjectEntryChange: (...args: any[]) => void;
  onProjectTypeToggle: (...args: any[]) => void;
  onSave: () => Promise<void> | void;
  isSaving?: boolean;
};

const BaseRates: React.FC<BaseRatesProps> = ({
  isLoading,
  error,
  projectTypesMasters,
  activeProjectTypes,
  ratingConfig,
  selectedProjectTypes,
  onSubProjectEntryChange,
  onProjectTypeToggle,
  onSave,
  isSaving = false,
}) => {
  const projectTypesList = projectTypesMasters
    ? projectTypesMasters
    : Array.isArray(activeProjectTypes)
      ? activeProjectTypes
      : Array.from(activeProjectTypes as Set<any>);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Base Rates</CardTitle>
            <CardDescription>Configure base premium rates for different sub-project types</CardDescription>
          </div>
          <Button onClick={onSave} size="sm" disabled={isLoading || isSaving}>
            {isLoading || isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Loading...' : isSaving ? 'Saving...' : 'Save Base Rates'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-6">
            {/* Flattened Base Rates Table Skeleton */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-48"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-24"></div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <Table>
                    <thead>
                      <tr className="border-b bg-muted/10">
                        <th className="h-10 px-4 text-left align-middle font-medium w-[22%]">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                        </th>
                        <th className="h-10 px-4 text-left align-middle font-medium w-[28%]">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                        </th>
                        <th className="h-10 px-4 text-left align-middle font-medium w-[18%]">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-18"></div>
                        </th>
                        <th className="h-10 px-4 text-left align-middle font-medium w-[16%]">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                        </th>
                        <th className="h-10 px-4 text-left align-middle font-medium w-[16%]">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-18"></div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                        <tr key={j} className="border-b">
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="h-8 bg-gray-200 rounded animate-pulse w-full"></div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="h-8 bg-gray-200 rounded animate-pulse w-full"></div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="h-8 bg-gray-200 rounded animate-pulse w-full"></div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {!isLoading && (
          <>
            {ratingConfig.subProjectEntries?.length === 0 && (
              <div className="rounded-md border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 mb-4">
                <p className="font-medium">Yet to configure this section</p>
                <p className="text-sm mt-1">Start by selecting project types and configuring their base rates below.</p>
              </div>
            )}
            <SubProjectBaseRates
              projectTypes={projectTypesList.map((pt: any) => ({
                id: pt.id,
                value: pt.value ?? pt.label?.toLowerCase?.().replace(/[^a-z0-9]+/g, '-') ?? String(pt.id),
                label: pt.label,
                baseRate: 0,
              }))}
              subProjectEntries={ratingConfig.subProjectEntries}
              selectedProjectTypes={selectedProjectTypes}
              onSubProjectEntryChange={onSubProjectEntryChange}
              onProjectTypeToggle={onProjectTypeToggle}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BaseRates;


