import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronDown, ChevronUp, FileText, Eye } from 'lucide-react';
import type {
  ProposalBundleResponseV2,
  TemplatePageItem,
  TemplatePageSection,
  TemplateFieldItem,
} from '@/features/quotes/api/quotes';
import {
  formatFieldName,
  formatFieldValue,
  formatMultiselectValue,
  formatDatePeriodValue,
} from '../../utils/QuoteDetailsV2/formatters';
import { getOptionLabel } from '@/shared/utils/form-helpers';
import {
  formatTemplateNumberField,
  tryFormatNumericTextField,
} from '../../utils/QuoteDetailsV2/policyDetailsNumericDisplay';

const isActive = (item?: { metadata?: { active?: unknown } | null } | null) =>
  item?.metadata?.active !== false;

interface TemplateFileItem {
  url: string;
  metadata?: { rowIndex?: number };
}

interface ConsentDocumentValue {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  active?: boolean;
  fileName?: string | null;
  signedUrl?: string | null;
  url?: string | null;
}

function isConsentDocumentValue(
  item: ConsentDocumentValue | null,
): item is ConsentDocumentValue {
  return item !== null;
}

function getFileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segment = pathname.split('/').pop() ?? '';
    return decodeURIComponent(segment) || 'Document';
  } catch {
    return 'Document';
  }
}

function canPreviewByUrl(url: string): 'image' | 'pdf' | false {
  const lower = url.toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp|bmp|svg)(\?|$)/i.test(lower)) return 'image';
  if (/\.pdf(\?|$)/i.test(lower)) return 'pdf';
  return false;
}

function FileDisplay({
  files,
  displayFileName,
  forceShowViewButton = false,
}: {
  files: TemplateFileItem[];
  displayFileName?: string | null;
  forceShowViewButton?: boolean;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<'image' | 'pdf' | false>(false);

  const getDisplayName = (file: TemplateFileItem, index: number) =>
    displayFileName && files.length === 1 ? displayFileName : getFileNameFromUrl(file.url);

  if (!files?.length) return <span className="text-sm text-gray-500">No files uploaded</span>;

  const openPreview = (file: TemplateFileItem) => {
    const kind = canPreviewByUrl(file.url);
    setPreviewKind(kind);
    setPreviewUrl(file.url);
  };

  return (
    <div className="flex flex-col gap-2">
      {files.map((file, idx) => {
        const name = getDisplayName(file, idx);
        const previewable = canPreviewByUrl(file.url);
        const showViewButton = forceShowViewButton || previewable;
        return (
          <div
            key={idx}
            className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded border border-gray-200"
          >
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate flex-1 min-w-0" title={name}>
              {name}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {showViewButton && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (previewable) {
                      openPreview(file);
                      return;
                    }
                    window.open(file.url, '_blank', 'noopener,noreferrer');
                  }}
                  title="View"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {previewUrl
                ? displayFileName && files.length === 1
                  ? displayFileName
                  : getFileNameFromUrl(previewUrl)
                : ''}
            </DialogTitle>
          </DialogHeader>
          {previewUrl &&
            (previewKind === 'image' ? (
              <div className="w-full flex-1 flex items-center justify-center bg-muted min-h-0">
                <img
                  src={previewUrl}
                  alt="File preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : previewKind === 'pdf' ? (
              <iframe
                src={previewUrl}
                className="w-full flex-1 min-h-0 border-0"
                title="File Preview"
              />
            ) : (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                Preview not available. Use download to open the file.
              </div>
            ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TemplatePagesProps {
  v2Response: ProposalBundleResponseV2;
  expandedSections: Set<string>;
  onToggle: (key: string) => void;
}

type RenderableTemplatePage = {
  page: TemplatePageItem;
  key: string;
  source: 'proposal' | 'additionalInformation';
};

const formatValue = (field: TemplateFieldItem) => {
  if (field.value === null || field.value === undefined || field.value === '') {
    return 'Not specified';
  }

  // Use utility functions for special field types
  if (field.type === 'dropdown') {
    return getOptionLabel(
      field.options as unknown as Parameters<typeof getOptionLabel>[0],
      String(field.value),
    );
  }

  if (field.type === 'multiselect' || field.type === 'multiselectDropdown') {
    return formatMultiselectValue(field.value);
  }

  if (field.type === 'datePeriod' || field.type === 'policyPeriod') {
    return formatDatePeriodValue(field.value);
  }

  if (field.type === 'number') {
    return formatTemplateNumberField(field.value, field.name, field.label);
  }

  if (field.type === 'text' || field.type === 'textarea') {
    const numericText = tryFormatNumericTextField(field.value, field.name, field.label);
    if (numericText !== null) return numericText;
  }

  return formatFieldValue(field.name, field.value);
};

type CombinationRow = { [key: string]: unknown; _rowLabel?: string };

function parseConsentValue(field: TemplateFieldItem): {
  accepted: boolean;
  documents: ConsentDocumentValue[];
} {
  const raw =
    typeof field.value === 'string'
      ? (() => {
          try {
            return JSON.parse(field.value);
          } catch {
            return field.value;
          }
        })()
      : field.value;

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { accepted: raw === true, documents: [] };
  }

  const record = raw as Record<string, unknown>;
  const rawDocuments = record.documents;
  const documents: ConsentDocumentValue[] = Array.isArray(rawDocuments)
    ? rawDocuments
        .filter(
          (item): item is Record<string, unknown> =>
            !!item && typeof item === 'object' && !Array.isArray(item),
        )
        .map((item) => ({
          id: typeof item.id === 'string' ? item.id : '',
          label: typeof item.label === 'string' ? item.label : 'Document',
          description: typeof item.description === 'string' ? item.description : undefined,
          required: item.required === true,
          active: item.active === true,
          fileName: typeof item.fileName === 'string' ? item.fileName : null,
          signedUrl: typeof item.signedUrl === 'string' ? item.signedUrl : null,
          url: typeof item.url === 'string' ? item.url : null,
        }))
    : rawDocuments && typeof rawDocuments === 'object'
      ? Object.entries(rawDocuments as Record<string, unknown>)
          .map<ConsentDocumentValue | null>(([id, item]) => {
            if (item instanceof File) {
              return {
                id,
                label: id,
                required: false,
                active: true,
                fileName: item.name,
                signedUrl: null,
                url: null,
              } satisfies ConsentDocumentValue;
            }

            if (typeof item === 'string') {
              const trimmed = item.trim();
              if (!trimmed) return null;
              const isUrl = trimmed.startsWith('http') || trimmed.startsWith('/api/v1/');
              return {
                id,
                label: id,
                required: false,
                active: true,
                fileName: isUrl ? null : trimmed,
                signedUrl: isUrl ? trimmed : null,
                url: isUrl ? trimmed : null,
              } satisfies ConsentDocumentValue;
            }

            if (item && typeof item === 'object' && !Array.isArray(item)) {
              const entry = item as Record<string, unknown>;
              return {
                id: typeof entry.id === 'string' ? entry.id : id,
                label: typeof entry.label === 'string' ? entry.label : id,
                description: typeof entry.description === 'string' ? entry.description : undefined,
                required: entry.required === true,
                active: entry.active !== false,
                fileName: typeof entry.fileName === 'string' ? entry.fileName : null,
                signedUrl: typeof entry.signedUrl === 'string' ? entry.signedUrl : null,
                url: typeof entry.url === 'string' ? entry.url : null,
              } satisfies ConsentDocumentValue;
            }

            return null;
          })
          .filter(isConsentDocumentValue)
      : [];

  return {
    accepted: record.accepted === true,
    documents,
  };
}

function ConsentValueDisplay({ field }: { field: TemplateFieldItem }) {
  const consentValue = parseConsentValue(field);
  const uploadedDocuments = consentValue.documents.filter(
    (doc) => Boolean(doc.fileName) || Boolean(doc.signedUrl) || Boolean(doc.url),
  );

  return (
    <div className="space-y-3">
      {uploadedDocuments.length > 0 && (
        <div className="space-y-2">
          {uploadedDocuments.map((doc) => {
            const docUrl = doc.signedUrl || doc.url || '';
            const fileName = doc.fileName || doc.label || 'Document';

            return (
              <div key={doc.id || `${doc.label}-${fileName}`} className="space-y-1">
                <div className="text-xs font-medium text-gray-600">{doc.label}</div>
                {docUrl ? (
                  <FileDisplay
                    files={[{ url: docUrl }]}
                    displayFileName={fileName}
                    forceShowViewButton
                  />
                ) : (
                  <div className="flex items-center gap-2 rounded border border-gray-200 bg-muted/50 p-2 text-sm">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{fileName}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CombinationField({ field }: { field: TemplateFieldItem }) {
  const visibleSubFields = (field.subFields || []).filter(isActive);
  if (visibleSubFields.length === 0) {
    return <div className="text-sm text-gray-500">No data available</div>;
  }

  // Parse value - it could be array of objects or stringified array
  let rowsData: CombinationRow[] = [];
  try {
    const f = field as {
      value?: unknown;
      valueJson?: unknown;
      valueText?: unknown;
    };
    const raw = f.valueJson ?? f.value ?? f.valueText;
    if (typeof raw === 'string') {
      try {
        rowsData = JSON.parse(raw) as CombinationRow[];
      } catch {
        rowsData = [];
      }
    } else if (Array.isArray(raw)) {
      rowsData = raw as CombinationRow[];
    } else if (raw && typeof raw === 'object') {
      rowsData = [raw as CombinationRow];
    }

    const firstRowValue = (rowsData[0] as unknown as Record<string, unknown>)?.['value'];
    if (rowsData.length > 0 && Array.isArray(firstRowValue)) {
      rowsData = rowsData.map((row) => {
        const rowValue = (row as unknown as Record<string, unknown>)?.['value'];
        if (row && Array.isArray(rowValue)) {
          const normalized: Record<string, unknown> = {};

          const rowLabel = (row as unknown as Record<string, unknown>)?.['label'];
          if (typeof rowLabel === 'string' && rowLabel) {
            normalized._rowLabel = rowLabel;
          }

          (rowValue as Array<{ label?: string; value?: unknown }>).forEach((item) => {
            const subField = visibleSubFields.find((sf) => sf.label === item.label);
            if (subField) {
              normalized[subField.name] = item.value;
            }
          });
          return normalized;
        }
        return row;
      });
    }
  } catch (e) {
    return <div className="text-sm text-gray-500">Invalid data format</div>;
  }

  // Filter out empty rows
  rowsData = rowsData.filter((row) => row && Object.keys(row).length > 0);

  if (rowsData.length === 0) {
    return <div className="text-sm text-gray-500">No entries added</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {/* <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              #
            </th> */}
            {visibleSubFields.map((subField) => (
              <th
                key={subField.id}
                className="border-b border-r border-gray-200 px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 last:border-r-0"
              >
                {subField.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {rowsData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {/* <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                {row._rowLabel || rowIndex + 1}
              </td> */}
              {visibleSubFields.map((subField) => {
                const subFieldWithFiles = subField as typeof subField & {
                  files?: TemplateFileItem[];
                };
                if (subField.type === 'file') {
                  const rowFiles =
                    subFieldWithFiles.files?.filter(
                      (f) => (f.metadata?.rowIndex ?? 0) === rowIndex,
                    ) ?? [];
                  const rowFileName =
                    row[subField.name] != null && row[subField.name] !== ''
                      ? String(row[subField.name])
                      : undefined;
                  return (
                    <td
                      key={subField.id}
                      className="border-b border-r border-gray-200 px-3 py-2 text-sm text-gray-900 last:border-r-0"
                    >
                      <FileDisplay files={rowFiles} displayFileName={rowFileName} />
                    </td>
                  );
                }
                const value = row[subField.name];
                const isEmpty =
                  value === null ||
                  value === undefined ||
                  value === '' ||
                  (Array.isArray(value) && value.length === 0);
                let displayValue = '-';
                if (!isEmpty) {
                  if (subField.type === 'dropdown') {
                    displayValue = getOptionLabel(
                      subField.options as unknown as Parameters<typeof getOptionLabel>[0],
                      String(value),
                    );
                  } else if (subField.type === 'multiselect' || subField.type === 'multiselectDropdown') {
                    displayValue = formatMultiselectValue(value);
                  } else if (subField.type === 'datePeriod' || subField.type === 'policyPeriod') {
                    displayValue = formatDatePeriodValue(value);
                  } else if (subField.type === 'number') {
                    if (Array.isArray(value)) {
                      displayValue = (value as (number | string)[])
                        .map((v) =>
                          formatTemplateNumberField(v, subField.name, subField.label),
                        )
                        .join(', ');
                    } else {
                      displayValue = formatTemplateNumberField(
                        value,
                        subField.name,
                        subField.label,
                      );
                    }
                  } else if (subField.type === 'text' || subField.type === 'textarea') {
                    const coerced = tryFormatNumericTextField(
                      value,
                      subField.name,
                      subField.label,
                    );
                    displayValue =
                      coerced !== null
                        ? coerced
                        : formatFieldValue(subField.name, value);
                  } else {
                    displayValue = formatFieldValue(subField.name, value);
                  }
                }
                return (
                  <td
                    key={subField.id}
                    className="border-b border-r border-gray-200 px-3 py-2 text-sm text-gray-900 last:border-r-0"
                  >
                    {displayValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionFields({ section }: { section: TemplatePageSection }) {
  if (!isActive(section)) return null;
  if (!section.fields || section.fields.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      {section.title && (
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-800">{section.title}</div>
          {section.subtitle && <div className="text-xs text-gray-500">{section.subtitle}</div>}
        </div>
      )}
      <div className="grid lg:grid-cols-3">
        {section.fields.map((field) => {
          if (!isActive(field)) return null;
          // Combination fields with subFields need special rendering
          if (field.type === 'combination' && field.subFields && field.subFields.length > 0) {
            return (
              <div key={field.id} className="p-3 border-b border-gray-200 lg:col-span-3">
                <div className="text-xs text-gray-500 mb-2">
                  {field.label || formatFieldName(field.name)}
                </div>
                <CombinationField field={field} />
              </div>
            );
          }

          const fieldWithFiles = field as TemplateFieldItem & { files?: TemplateFileItem[] };
          if (field.type === 'file') {
            return (
              <div key={field.id} className="p-3 border-r border-b border-gray-200 last:border-r-0">
                <div className="text-xs text-gray-500 mb-1">
                  {field.label || formatFieldName(field.name)}
                </div>
                <FileDisplay
                  files={fieldWithFiles.files ?? []}
                  displayFileName={
                    field.value != null && field.value !== '' ? String(field.value) : undefined
                  }
                />
              </div>
            );
          }

          if (field.type === 'consent') {
            return (
              <div key={field.id} className="p-3 border-r border-b border-gray-200 last:border-r-0">
                <div
                  className={`mb-1 text-xs font-medium ${
                    parseConsentValue(field).accepted ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {parseConsentValue(field).accepted ? '✓ ' : 'X '}
                  {field.label || formatFieldName(field.name)}
                </div>
                <ConsentValueDisplay field={field} />
              </div>
            );
          }

          // Regular fields (including combination fields without subFields)
          return (
            <div key={field.id} className="p-3 border-r border-b border-gray-200 last:border-r-0">
              <div className="text-xs text-gray-500 mb-1">
                {field.label || formatFieldName(field.name)}
              </div>
              <div className="text-sm font-medium break-words">{formatValue(field)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PageCard({
  page,
  source,
  expanded,
  onToggle,
}: {
  page: TemplatePageItem;
  source: RenderableTemplatePage['source'];
  expanded: boolean;
  onToggle: () => void;
}) {
  const sourceLabel = source === 'additionalInformation' ? 'Additional Information' : null;

  return (
    <Card className="bg-white border border-blue-200 mb-4" data-section={`page_${page.id}`}>
      <CardHeader className="pb-3 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">{page.title}</CardTitle>
              {page.subtitle && <div className="text-xs text-gray-400 mt-1">{page.subtitle}</div>}
              {sourceLabel && <div className="text-xs text-blue-600 mt-1">{sourceLabel}</div>}
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          {page.sections?.length ? (
            page.sections
              .sort((a, b) => a.sectionOrder - b.sectionOrder)
              .map((section) => <SectionFields key={section.id} section={section} />)
          ) : (
            <div className="text-sm text-gray-500">No fields available for this page.</div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function TemplatePages({ v2Response, expandedSections, onToggle }: TemplatePagesProps) {
  const pages: RenderableTemplatePage[] = [
    ...(v2Response.template?.pages ?? []).map((page) => ({
      page,
      key: `page_${page.id}`,
      source: 'proposal' as const,
    })),
    ...(v2Response.template?.additionalInformationPages ?? []).map((page) => ({
      page,
      key: `additional_information_page_${page.id}`,
      source: 'additionalInformation' as const,
    })),
  ].sort((a, b) => {
    if (a.source !== b.source) {
      return a.source === 'proposal' ? -1 : 1;
    }
    return a.page.pageOrder - b.page.pageOrder;
  });

  return (
    <>
      {pages.filter(({ page }) => isActive(page)).map(({ page, key, source }) => {
        const expanded = expandedSections.has(key);
        return (
          <PageCard
            key={key}
            page={page}
            source={source}
            expanded={expanded}
            onToggle={() => onToggle(key)}
          />
        );
      })}
    </>
  );
}
