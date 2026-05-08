import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import {
  RichTextContent,
  RICH_TEXT_CHROMELESS_MEDIA_CLASS,
} from '@/features/product-config/proposal-form/components/RichTextEditor';
import { initialFaqs } from '@/features/super-admin/support-center/data';
import { ArrowLeft } from 'lucide-react';
import { PortalHelpLayout } from './PortalHelpLayout';

const PortalFaqsPage = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const dashboardPath = useMemo(() => {
    if (pathname.startsWith('/market-admin/')) return '/market-admin/dashboard';
    if (pathname.startsWith('/insurer/')) return '/insurer/dashboard';
    if (pathname.startsWith('/broker/')) return '/broker/dashboard';
    return '/';
  }, [pathname]);

  return (
    <PortalHelpLayout onBack={() => navigate(dashboardPath)}>
      <div className="h-full min-h-0 bg-background">
        <div className="border-b border-border/70 px-8 py-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(dashboardPath)}
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">FAQs</h1>
              <p className="text-muted-foreground">
                Explore common questions and answers available in the shared FAQ library.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <Accordion type="single" collapsible className="space-y-4">
            {initialFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="overflow-hidden rounded-3xl border border-border/70 bg-background shadow-sm"
              >
                <AccordionTrigger className="px-6 py-5 text-left text-base font-medium text-foreground hover:no-underline">
                  <span className="truncate">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="border-t border-border/70 px-6 py-5">
                    <RichTextContent html={faq.answer} className={RICH_TEXT_CHROMELESS_MEDIA_CLASS} />
                  </CardContent>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </PortalHelpLayout>
  );
};

export default PortalFaqsPage;
