import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import {
  RichTextContent,
  RICH_TEXT_CHROMELESS_MEDIA_CLASS,
} from '@/features/product-config/proposal-form/components/RichTextEditor';
import { cn } from '@/shared/utils/lib-utils';
import { Edit3, Trash2 } from 'lucide-react';
import type { SupportFaq } from '@/features/support/api/support';

interface FAQListProps {
  faqs: SupportFaq[];
  onEdit?: (faq: SupportFaq) => void;
  onDelete?: (faqId: string) => void;
  className?: string;
  emptyMessage?: string;
}

export function FAQList({
  faqs,
  onEdit,
  onDelete,
  className,
  emptyMessage = 'No FAQs available.',
}: FAQListProps) {
  if (faqs.length === 0) {
    return (
      <Card className={cn('rounded-md border-border/70 shadow-sm', className)}>
        <CardContent className="px-6 py-8 text-sm text-muted-foreground">{emptyMessage}</CardContent>
      </Card>
    );
  }

  return (
    <Accordion type="single" collapsible className={cn('space-y-4', className)}>
      {faqs.map((faq) => (
        <FAQAccordionItem key={faq.id} faq={faq} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </Accordion>
  );
}

interface FAQAccordionItemProps {
  faq: SupportFaq;
  onEdit?: (faq: SupportFaq) => void;
  onDelete?: (faqId: string) => void;
}

export function FAQAccordionItem({ faq, onEdit, onDelete }: FAQAccordionItemProps) {
  return (
    <Card className="overflow-hidden rounded-md border-border/70 shadow-sm">
      <AccordionItem value={faq.id} className="border-none">
        <AccordionTrigger className="gap-4 px-6 py-5 text-left text-base font-medium text-foreground hover:no-underline">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate">{faq.question}</p>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit?.(faq);
                }}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full text-destructive hover:text-destructive"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete?.(faq.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <CardContent className="border-t border-border/70 px-6 py-5">
            <div className="rounded-md border border-border/60 bg-muted/20 p-4">
              <RichTextContent html={faq.answer} className={RICH_TEXT_CHROMELESS_MEDIA_CLASS} />
              <div className="mt-4 flex items-center gap-2 md:hidden">
                <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => onEdit?.(faq)}>
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="gap-2 rounded-full text-destructive" onClick={() => onDelete?.(faq.id)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </AccordionContent>
      </AccordionItem>
    </Card>
  );
}
