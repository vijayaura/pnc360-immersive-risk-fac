import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings2, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface ColumnDefinition {
  id: string;
  label: string;
  isMandatory?: boolean; // If true, cannot be hidden
}

interface ColumnVisibilityDropdownProps {
  columns: ColumnDefinition[];
  visibleColumns: string[];
  onToggleColumn: (columnId: string) => void;
  onReset?: () => void;
  align?: 'start' | 'center' | 'end';
}

export const ColumnVisibilityDropdown = ({
  columns,
  visibleColumns,
  onToggleColumn,
  onReset,
  align = 'end'
}: ColumnVisibilityDropdownProps) => {
  const hiddenCount = columns.length - visibleColumns.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="group h-10 gap-2 border-dashed bg-background hover:bg-accent hover:text-accent-foreground shadow-sm transition-all px-3"
        >
          <Settings2 className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
          <span className="font-medium">Columns</span>
          {hiddenCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-muted group-hover:bg-accent-foreground group-hover:text-accent transition-colors">
              {visibleColumns.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 shadow-xl border-border/50 backdrop-blur-sm" align={align}>
        <div className="p-3 border-b border-border/50 flex items-center justify-between bg-muted/30">
           <span className="text-xs font-bold text-foreground/70 uppercase tracking-widest flex items-center gap-2">
             <Settings2 className="h-3 w-3" />
             Table Views
           </span>
           {onReset && (
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={onReset} 
               className="h-7 px-2 text-[10px] text-primary hover:text-primary/80 hover:bg-primary/5 transition-colors gap-1.5"
             >
               <RotateCcw className="h-3 w-3" />
               Reset Default
             </Button>
           )}
        </div>
        <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
           <div className="space-y-1">
             {columns.map((column) => (
               <div
                 key={column.id}
                 className={`flex items-center space-x-2 rounded-md px-3 py-2 transition-all group ${
                   visibleColumns.includes(column.id) 
                     ? 'bg-primary/5 hover:bg-primary/10' 
                     : 'hover:bg-muted/50'
                 }`}
               >
                 <Checkbox
                   id={`col-${column.id}`}
                   checked={visibleColumns.includes(column.id)}
                   disabled={column.isMandatory}
                   onCheckedChange={() => onToggleColumn(column.id)}
                   className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                 />
                 <label
                   htmlFor={`col-${column.id}`}
                   className={`flex-1 cursor-pointer text-sm font-medium leading-none transition-colors ${
                     column.isMandatory ? 'opacity-50 cursor-not-allowed' : 'group-hover:text-primary'
                   }`}
                 >
                   {column.label}
                 </label>
                 {column.isMandatory && (
                   <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded italic">
                     Fixed
                   </span>
                 )}
               </div>
             ))}
           </div>
        </div>
        <div className="p-3 bg-muted/20 border-t border-border/50 text-center">
          <p className="text-[10px] text-muted-foreground">
            Displaying {visibleColumns.length} of {columns.length} columns
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
