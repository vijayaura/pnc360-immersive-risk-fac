import { CheckCircle, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ReinsurerPolicyRecord } from '../types';

interface ReinsurerTableProps {
  rows: ReinsurerPolicyRecord[];
  onViewDetails: (policyId: string) => void;
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s.includes('bound') || s.includes('active')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="w-3 h-3" />
        {status}
      </span>
    );
  }
  if (s.includes('pend') || s.includes('review')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-yellow-50 text-yellow-700 border-yellow-200">
        <Clock className="w-3 h-3" />
        {status}
      </span>
    );
  }
  if (s.includes('declin')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-red-50 text-red-700 border-red-200">
        <Clock className="w-3 h-3" />
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-600 border-gray-200">
      <Clock className="w-3 h-3" />
      {status}
    </span>
  );
}

function TruncatedList({ values }: { values: string[] }) {
  if (!values.length) {
    return (
      <span style={{ fontSize: '12px', color: 'rgb(148 163 184)', fontStyle: 'italic' }}>—</span>
    );
  }
  const joined = values.join(', ');
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            style={{
              display: 'block',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {joined}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {joined}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ReinsurerTable({ rows, onViewDetails }: ReinsurerTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm bg-white">
      <table
        className="w-full min-w-[64rem] border-collapse"
        style={{ tableLayout: 'fixed' }}
      >
        <colgroup>
          <col style={{ width: '13%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '13%' }} />
          {/* Fixed width so View + icon are never clipped at typical insurer layout widths */}
          <col style={{ width: '8.5rem', minWidth: '8.5rem' }} />
        </colgroup>
        <thead>
          <tr style={{ backgroundColor: 'rgb(248 250 252)', borderBottom: '1px solid rgb(226 232 240)' }}>
            {(['Policy / Quote ID', 'Risk ID', 'Customer Name', 'Product Name', 'Status', 'Program', 'Treaty'] as const).map((h) => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgb(100 116 139)' }}>
                {h}
              </th>
            ))}
            <th
              className="whitespace-nowrap"
              style={{ padding: '12px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgb(100 116 139)' }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: 'rgb(100 116 139)', fontSize: '14px' }}>
                No records match your search or filters.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                style={{ borderBottom: '1px solid rgb(226 232 240)' }}
                className="hover:bg-slate-50/30 transition-colors"
              >
                <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'left', fontFamily: 'monospace', fontSize: '13px', fontWeight: 500, color: 'rgb(15 23 42)' }}>
                  {row.policyOrQuoteId}
                </td>
                <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'left', fontFamily: 'monospace', fontSize: '13px', fontWeight: 500, color: 'rgb(51 65 85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.riskId || '-'}
                </td>
                <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'left', fontSize: '14px', color: 'rgb(51 65 85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.customerName}
                </td>
                <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'left', fontSize: '14px', color: 'rgb(51 65 85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.productName}
                </td>
                <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'left' }}>
                  <StatusBadge status={row.status} />
                </td>
                <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'left', fontSize: '13px', color: 'rgb(51 65 85)' }}>
                  <TruncatedList values={row.programNames?.length ? row.programNames : row.programTypes ?? []} />
                </td>
                <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'left', fontSize: '13px', color: 'rgb(51 65 85)' }}>
                  <TruncatedList values={row.treatyNames ?? []} />
                </td>
                <td
                  className="whitespace-nowrap px-3 py-3.5 align-middle text-center"
                  style={{ width: '8.5rem', minWidth: '8.5rem' }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(row.id)}
                    className="gap-1.5 shrink-0 whitespace-nowrap px-2.5"
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    View
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
