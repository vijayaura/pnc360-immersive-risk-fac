import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/shared/utils/lib-utils';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2 } from 'lucide-react';
import type { SupportTopic } from '@/features/support/api/support';

interface SupportSidebarProps {
  topics: SupportTopic[];
  activeTopicId: string;
  onSelectTopic: (topicId: string) => void;
  onEditTopic: (topic: SupportTopic) => void;
  onDeleteTopic: (topicId: string) => void;
  className?: string;
}

export function SupportSidebar({
  topics,
  activeTopicId,
  onSelectTopic,
  onEditTopic,
  onDeleteTopic,
  className,
}: SupportSidebarProps) {
  const topicsByCategory = topics.reduce<Record<string, SupportTopic[]>>((accumulator, topic) => {
    if (!accumulator[topic.categoryName]) {
      accumulator[topic.categoryName] = [];
    }
    accumulator[topic.categoryName].push(topic);
    return accumulator;
  }, {});

  const orderedCategories = Object.keys(topicsByCategory).sort((left, right) =>
    left.localeCompare(right),
  );

  return (
    <div className={cn('flex h-full flex-col rounded-md border border-border/70 bg-background/95 shadow-sm', className)}>
      <div className="border-b border-border/70 p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Support Topics</p>
          <p className="text-xs text-muted-foreground">Knowledge articles managed by Super Admin.</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-3">
          {orderedCategories.map((category) => (
            <div key={category} className="space-y-2">
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {category}
              </p>
              {topicsByCategory[category].map((topic) => {
                const isActive = topic.id === activeTopicId;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => onSelectTopic(topic.id)}
                    className={cn(
                      'group w-full rounded-md border px-3 py-2 text-left transition-all',
                      isActive
                        ? 'border-primary/30 bg-primary/10 shadow-sm'
                        : 'border-border/70 bg-background hover:border-primary/20 hover:bg-muted/40',
                    )}
                  >
                    <div className="flex min-h-8 items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={cn('truncate text-sm font-medium', isActive ? 'text-primary' : 'text-foreground')}>
                          {topic.title}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditTopic(topic);
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-md text-destructive opacity-100 hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteTopic(topic.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
