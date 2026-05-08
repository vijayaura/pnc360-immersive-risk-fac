import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RichTextContent,
  RICH_TEXT_CHROMELESS_MEDIA_CLASS,
} from '@/features/product-config/proposal-form/components/RichTextEditor';
import { Plus } from 'lucide-react';
import { FAQList } from './FAQList';
import type { SupportFaq, SupportTopic } from '@/features/support/api/support';

interface SupportTopicViewProps {
  topic: SupportTopic;
  faqs: SupportFaq[];
  onAddFaq: () => void;
  onEditFaq: (faq: SupportFaq) => void;
  onDeleteFaq: (faqId: string) => void;
  onEdit: (topic: SupportTopic) => void;
}

export function SupportTopicView({
  topic,
  faqs,
  onAddFaq,
  onEditFaq,
  onDeleteFaq,
  onEdit,
}: SupportTopicViewProps) {
  return (
    <Card className="overflow-hidden rounded-md border-border/70 shadow-sm xl:h-[calc(100vh-240px)]">
      <CardHeader className="border-b border-border/70 bg-gradient-to-r from-primary/10 via-background to-background px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{topic.title}</h2>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 py-0 xl:h-[calc(100%-93px)]">
        <ScrollArea className="h-full">
          <div className="px-6 py-6">
            <RichTextContent html={topic.description} className={RICH_TEXT_CHROMELESS_MEDIA_CLASS} />

            <div className="mt-8 border-t border-border/70 pt-6">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-foreground">FAQs</h3>
                  <p className="text-sm text-muted-foreground">
                    Add and manage FAQs for this support topic.
                  </p>
                </div>

                <Button size="lg" className="self-start gap-2" onClick={onAddFaq}>
                  <Plus className="h-4 w-4" />
                  Add FAQ
                </Button>
              </div>

              <FAQList
                faqs={faqs}
                onEdit={onEditFaq}
                onDelete={onDeleteFaq}
                emptyMessage="No FAQs have been added for this support topic yet."
              />
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
