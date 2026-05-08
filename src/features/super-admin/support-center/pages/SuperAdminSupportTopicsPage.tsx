import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Loader2, Plus } from 'lucide-react';
import { SupportSidebar } from '../components/SupportSidebar';
import { SupportTopicView } from '../components/SupportTopicView';
import type { SupportCenterOutletContext } from './SuperAdminSupportCenter';

const SuperAdminSupportTopicsPage = () => {
  const {
    supportTopics,
    activeTopic,
    activeTopicId,
    topicFaqs,
    isLoading,
    setActiveTopicId,
    openCreateTopic,
    openCreateFaq,
    openEditTopic,
    deleteTopic,
    openEditFaq,
    deleteFaq,
  } = useOutletContext<SupportCenterOutletContext>();

  return (
    <div className="min-h-full overflow-y-auto bg-background p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-foreground">Support</h1>
            <p className="text-muted-foreground">
              Manage support topics and publish structured guidance for Super Admin users.
            </p>
          </div>

          <Button size="lg" className="self-start gap-2" onClick={openCreateTopic}>
            <Plus className="h-4 w-4" />
            Create Topic
          </Button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-3xl px-6 py-10">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading support topics...
            </div>
          </div>
        ) : activeTopic ? (
          <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="hidden xl:block">
              <SupportSidebar
                topics={supportTopics}
                activeTopicId={activeTopicId}
                onSelectTopic={setActiveTopicId}
                onEditTopic={openEditTopic}
                onDeleteTopic={deleteTopic}
                className="sticky top-0 h-[calc(100vh-240px)]"
              />
            </div>

            <div className="space-y-4">
              <SupportSidebar
                topics={supportTopics}
                activeTopicId={activeTopicId}
                onSelectTopic={setActiveTopicId}
                onEditTopic={openEditTopic}
                onDeleteTopic={deleteTopic}
                className="xl:hidden"
              />

              <SupportTopicView
                topic={activeTopic}
                faqs={topicFaqs}
                onAddFaq={() => openCreateFaq(activeTopic.id)}
                onEditFaq={openEditFaq}
                onDeleteFaq={deleteFaq}
                onEdit={openEditTopic}
              />
            </div>
          </div>
        ) : (
          <div className="flex min-h-[420px] items-center justify-center rounded-3xl px-6 py-10">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary shadow-sm">
                <BookOpen className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                No support topics are available yet
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Create your first support topic to start publishing guidance and FAQs for Super
                Admin users.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminSupportTopicsPage;
