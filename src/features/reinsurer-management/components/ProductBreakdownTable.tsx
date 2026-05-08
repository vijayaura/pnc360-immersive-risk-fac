import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { cn, formatCurrency } from '@/shared/utils/lib-utils';
import type { ReinsurerProductNode } from '../types';

interface ProductBreakdownTableProps {
  productBreakdown: ReinsurerProductNode[];
  policyId?: string;
  quoteNumber?: string;
  customerName?: string;
  breakdownBasePath?: string;
  readOnly?: boolean;
}

const thStyle: React.CSSProperties = {
  padding: '10px 8px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'rgb(100 116 139)',
  whiteSpace: 'nowrap',
};

const tdBase: React.CSSProperties = {
  padding: '10px 8px',
  verticalAlign: 'middle',
  textAlign: 'left',
  fontSize: '12px',
  color: 'rgb(51 65 85)',
};

export function ProductBreakdownTable({
  productBreakdown,
  policyId: propPolicyId,
  quoteNumber,
  customerName,
  breakdownBasePath = '/insurer/reinsurer-management/full-breakdown',
  readOnly = false,
}: ProductBreakdownTableProps) {
  const params = useParams<{ policyId: string }>();
  const policyId = propPolicyId || params.policyId;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm bg-white">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: 'rgb(248 250 252)', borderBottom: '1px solid rgb(226 232 240)' }}>
            <th style={thStyle}>Product / Cover</th>
            <th style={thStyle}>Unit</th>
            <th style={thStyle}>Program</th>
            <th style={thStyle}>Treaty</th>
            <th style={thStyle}>Sum Insured</th>
            <th style={thStyle}>Ceded SI</th>
            <th style={thStyle}>Retained SI</th>
            <th style={thStyle}>Premium</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {productBreakdown.map((product) => (
            <React.Fragment key={product.id}>
              {productBreakdown.length > 1 && (
                <tr style={{ backgroundColor: 'rgba(248 250 252 / 0.3)', borderBottom: '1px solid rgb(226 232 240)' }}>
                  <td colSpan={9} style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: '12px', color: 'hsl(var(--primary))', fontWeight: 700 }}>
                      Product: {product.title}
                    </span>
                  </td>
                </tr>
              )}
              {product.covers.map((cover) => (
                <React.Fragment key={cover.id}>
                  {cover.units.map((unit, unitIdx) => {
                    const cededSI = unit.reinsurance?.cededSumInsured ?? 0;
                    const retainedSI = unit.reinsurance?.retainedSumInsured ?? (unit.sumInsured - cededSI);
                    return (
                    <tr
                      key={unit.id}
                      style={{ borderBottom: '1px solid rgb(226 232 240)' }}
                      className="hover:bg-slate-50/30 transition-colors"
                    >
                      {/* Product / Cover */}
                      <td style={tdBase}>
                        {unitIdx === 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 400, color: 'rgb(15 23 42)' }}>
                              {cover.title}
                            </span>
                          </div>
                        ) : null}
                      </td>

                      {/* Unit */}
                      <td style={tdBase}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 400, color: 'rgb(15 23 42)' }}>{unit.title}</span>
                        </div>
                      </td>

                      {/* Program */}
                      <td style={tdBase}>
                        {unit.reinsurance ? (
                          <span style={{ fontSize: '13px', fontWeight: 500 }}>{unit.reinsurance.programName}</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'rgb(148 163 184)', fontStyle: 'italic' }}>—</span>
                        )}
                      </td>

                      {/* Treaty */}
                      <td style={tdBase}>
                        {unit.reinsurance ? (
                          <span style={{ fontSize: '13px', fontWeight: 500 }}>{unit.reinsurance.type}</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'rgb(148 163 184)', fontStyle: 'italic' }}>—</span>
                        )}
                      </td>

                      {/* Sum Insured */}
                      <td style={{ ...tdBase, fontWeight: 400, fontVariantNumeric: 'tabular-nums', color: 'rgb(15 23 42)', whiteSpace: 'nowrap' }}>
                        {formatCurrency(unit.sumInsured)}
                      </td>

                      {/* Ceded SI */}
                      <td style={{ ...tdBase, fontWeight: 400, fontVariantNumeric: 'tabular-nums', color: 'rgb(15 23 42)', whiteSpace: 'nowrap' }}>
                        {unit.reinsurance ? (
                          formatCurrency(cededSI)
                        ) : (
                          <span style={{ fontSize: '12px', color: 'rgb(148 163 184)', fontStyle: 'italic' }}>—</span>
                        )}
                      </td>

                      {/* Retained SI */}
                      <td style={{ ...tdBase, fontWeight: 400, fontVariantNumeric: 'tabular-nums', color: 'rgb(15 23 42)', whiteSpace: 'nowrap' }}>
                        {unit.reinsurance ? (
                          formatCurrency(retainedSI)
                        ) : (
                          formatCurrency(unit.sumInsured)
                        )}
                      </td>

                      {/* Premium */}
                      <td style={{ ...tdBase, fontWeight: 400, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--primary))', whiteSpace: 'nowrap' }}>
                        {formatCurrency(unit.premium)}
                      </td>

                      {/* Action */}
                      <td style={{ ...tdBase, textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {unit.reinsurance ? (
                            <Link
                              to={`${breakdownBasePath}/${policyId}/${unit.id}`}
                              state={{ coverName: unit.title, quoteNumber, customerName }}
                              className={cn(
                                buttonVariants({ variant: 'default', size: 'sm' }),
                                'h-8 min-w-[140px] px-3 text-[11px] font-medium transition-all shadow-sm'
                              )}
                            >
                              Reinsurance
                            </Link>
                          ) : readOnly ? (
                            <span style={{ fontSize: '12px', color: 'rgb(148 163 184)', fontStyle: 'italic' }}>—</span>
                          ) : (
                            <Link
                              to={`${breakdownBasePath}/${policyId}/${unit.id}`}
                              state={{ coverName: unit.title, quoteNumber, customerName }}
                              title="No treaty matched — open to arrange facultative"
                              className={cn(
                                buttonVariants({ variant: 'default', size: 'sm' }),
                                'h-8 min-w-[140px] px-3 text-[11px] font-medium transition-all shadow-sm'
                              )}
                            >
                              Request Facultative
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
          {productBreakdown.length === 0 && (
            <tr>
              <td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: 'rgb(100 116 139)' }}>
                No product breakdown available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
