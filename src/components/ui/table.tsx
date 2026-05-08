import * as React from 'react';

import { cn } from '@/shared/utils/lib-utils';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  equalColumns?: boolean;
  columnCount?: number;
  minColumnWidth?: number | string;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  (
    {
      className,
      style,
      equalColumns = false,
      columnCount,
      minColumnWidth = 140,
      ...props
    },
    ref,
  ) => {
    const resolvedColumnCount = equalColumns && columnCount && columnCount > 0 ? columnCount : undefined;
    const resolvedMinColumnWidth =
      typeof minColumnWidth === 'number' ? `${minColumnWidth}px` : minColumnWidth;

    const tableStyle = {
      ...style,
      ...(resolvedColumnCount
        ? {
            ['--table-column-count' as string]: resolvedColumnCount,
            ['--table-min-column-width' as string]: resolvedMinColumnWidth,
          }
        : {}),
    } as React.CSSProperties;

    return (
      <div className="data-table-container">
        <table
          ref={ref}
          data-equal-columns={equalColumns ? 'true' : undefined}
          className={cn('data-table w-full caption-bottom text-sm ps-relative', className)}
          style={tableStyle}
          {...props}
        />
      </div>
    );
  },
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn('data-table-header [&_tr]:hover:bg-transparent', className)}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('data-table-body', className)} {...props} />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = 'TableRow';
interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  freeze?: boolean;
  // When true, column will stick to the left (used for matrix row headers).
  freezeLeft?: boolean;
  freezetop?: boolean;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, freeze = false, freezeLeft = false, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background',
        className,
        freeze && 'sticky top-0 z-30 border',
        freezeLeft && 'sticky left-0 z-40 border',
      )}
      {...props}
    />
  ),
);
TableHead.displayName = 'TableHead';

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  // For row headers that should stick on horizontal scroll.
  freezeLeft?: boolean;
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, freezeLeft = false, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        'data-table-body td p-4 align-middle [&:has([role=checkbox])]:pr-0',
        className,
        freezeLeft && 'sticky left-0 z-30 bg-background',
      )}
      {...props}
    />
  ),
);
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />
))
TableCaption.displayName = 'TableCaption'

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
