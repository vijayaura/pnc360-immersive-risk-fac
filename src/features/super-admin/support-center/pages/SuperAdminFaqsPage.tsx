import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { FAQList } from '../components/FAQList';
import type { SupportCenterOutletContext } from './SuperAdminSupportCenter';

const SuperAdminFaqsPage = () => {
  const { faqs, openCreateFaq, openEditFaq, deleteFaq } =
    useOutletContext<SupportCenterOutletContext>();

  return (
    <div className="min-h-full overflow-y-auto bg-background p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-foreground">FAQs</h1>
            <p className="text-muted-foreground">
              Create, edit, and organize reusable answers managed from the Super Admin portal.
            </p>
          </div>

          <Button size="lg" className="self-start gap-2" onClick={openCreateFaq}>
            <Plus className="h-4 w-4" />
            Add FAQ
          </Button>
        </div>

        <FAQList faqs={faqs} onEdit={openEditFaq} onDelete={deleteFaq} />
      </div>
    </div>
  );
};

export default SuperAdminFaqsPage;
