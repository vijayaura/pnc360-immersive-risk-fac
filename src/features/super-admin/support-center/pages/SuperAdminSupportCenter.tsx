import { Outlet } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useToast } from '@/shared/hooks/use-toast';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { apiErrorToToast } from '@/shared/utils/apiErrorToMessage';
import { FAQDialog } from '../components/FAQDialog';
import { SupportTopicDialog } from '../components/SupportTopicDialog';
import {
  useAdminSupportTopics,
  useCreateSupportCategory,
  useCreateSupportFaq,
  useCreateSupportTopic,
  useDeleteSupportFaq,
  useDeleteSupportMedia,
  useDeleteSupportTopic,
  useSupportCategories,
  useUploadSupportMedia,
  useUpdateSupportFaq,
  useUpdateSupportTopic,
  type SupportFaq,
  type SupportMediaModule,
  type SupportTopic,
  type UploadSupportMediaPayload,
} from '@/features/support/api/support';

export interface SupportCenterOutletContext {
  supportTopics: SupportTopic[];
  activeTopic: SupportTopic | null;
  activeTopicId: string;
  topicFaqs: SupportFaq[];
  isLoading: boolean;
  setActiveTopicId: (topicId: string) => void;
  openCreateTopic: () => void;
  openEditTopic: (topic: SupportTopic) => void;
  deleteTopic: (topicId: string) => void;
  openCreateFaq: (topicId: string) => void;
  openEditFaq: (faq: SupportFaq) => void;
  deleteFaq: (faqId: string) => void;
}

const SuperAdminSupportCenter = () => {
  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  const topicsQuery = useAdminSupportTopics({ page: 1, limit: 100 });
  const categoriesQuery = useSupportCategories({ page: 1, limit: 100 });
  const createCategoryMutation = useCreateSupportCategory();
  const createTopicMutation = useCreateSupportTopic();
  const updateTopicMutation = useUpdateSupportTopic();
  const deleteTopicMutation = useDeleteSupportTopic();
  const createFaqMutation = useCreateSupportFaq();
  const updateFaqMutation = useUpdateSupportFaq();
  const deleteFaqMutation = useDeleteSupportFaq();
  const uploadSupportMediaMutation = useUploadSupportMedia();
  const deleteSupportMediaMutation = useDeleteSupportMedia();

  const supportTopics = topicsQuery.data?.data ?? [];
  const categories = categoriesQuery.data?.data ?? [];
  const [activeTopicId, setActiveTopicId] = useState('');
  const [editingTopic, setEditingTopic] = useState<SupportTopic | null>(null);
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<SupportFaq | null>(null);
  const [faqTopicId, setFaqTopicId] = useState('');
  const [isFaqDialogOpen, setIsFaqDialogOpen] = useState(false);
  const backgroundTopicIdRef = useRef('');
  const backgroundFaqIdRef = useRef('');
  const topicDialogCommittedRef = useRef(false);
  const faqDialogCommittedRef = useRef(false);
  const backgroundTopicCreatePromiseRef = useRef<Promise<void> | null>(null);
  const backgroundFaqCreatePromiseRef = useRef<Promise<void> | null>(null);

  const resolvedActiveTopicId = supportTopics.some((topic) => topic.id === activeTopicId)
    ? activeTopicId
    : supportTopics[0]?.id || '';
  const activeTopic = supportTopics.find((topic) => topic.id === resolvedActiveTopicId) || null;
  const topicFaqs = activeTopic?.faqs ?? [];
  const existingCategories = categories;
  const isLoading =
    topicsQuery.isPending ||
    topicsQuery.isLoading ||
    categoriesQuery.isPending ||
    categoriesQuery.isLoading;
  const hasError = topicsQuery.isError || categoriesQuery.isError;

  const openCreateTopic = () => {
    setEditingTopic(null);
    backgroundTopicIdRef.current = '';
    topicDialogCommittedRef.current = false;
    backgroundTopicCreatePromiseRef.current = null;
    setIsTopicDialogOpen(true);
  };

  const openEditTopic = (topic: SupportTopic) => {
    setEditingTopic(topic);
    backgroundTopicIdRef.current = '';
    topicDialogCommittedRef.current = false;
    backgroundTopicCreatePromiseRef.current = null;
    setIsTopicDialogOpen(true);
  };

  const openCreateFaq = (topicId: string) => {
    setEditingFaq(null);
    setFaqTopicId(topicId);
    backgroundFaqIdRef.current = '';
    faqDialogCommittedRef.current = false;
    backgroundFaqCreatePromiseRef.current = null;
    setIsFaqDialogOpen(true);
  };

  const openEditFaq = (faq: SupportFaq) => {
    setEditingFaq(faq);
    setFaqTopicId(faq.topicId);
    backgroundFaqIdRef.current = '';
    faqDialogCommittedRef.current = false;
    backgroundFaqCreatePromiseRef.current = null;
    setIsFaqDialogOpen(true);
  };

  const deleteFaq = (faqId: string) => {
    const faq = supportTopics.flatMap((topic) => topic.faqs).find((item) => item.id === faqId);
    const faqQuestion = faq?.question || 'this FAQ';

    showConfirmDialog(
      {
        title: 'Delete FAQ',
        description: `Are you sure you want to delete the "${faqQuestion}" FAQ? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'destructive',
      },
      async () => {
        try {
          await deleteFaqMutation.mutateAsync(faqId);
          toast({
            title: 'FAQ deleted',
            description: 'The FAQ entry was removed successfully.',
          });
        } catch (error) {
          toast(apiErrorToToast(error, 'Failed to delete FAQ.'));
        }
      },
    );
  };

  const deleteTopic = (topicId: string) => {
    const topic = supportTopics.find((item) => item.id === topicId);
    const topicTitle = topic?.title || 'this support topic';

    showConfirmDialog(
      {
        title: 'Delete Support Topic',
        description: `Are you sure you want to delete the "${topicTitle}" support topic and all its FAQs? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'destructive',
      },
      async () => {
        try {
          await deleteTopicMutation.mutateAsync(topicId);
          if (resolvedActiveTopicId === topicId) {
            setActiveTopicId('');
          }
          toast({
            title: 'Support topic deleted',
            description: 'The support topic was removed successfully.',
          });
        } catch (error) {
          toast(apiErrorToToast(error, 'Failed to delete support topic.'));
        }
      },
    );
  };

  const ensureTopicForUpload = async ({
    categoryId,
    title,
    description,
  }: {
    categoryId: string;
    title: string;
    description: string;
  }) => {
    if (editingTopic?.id || backgroundTopicIdRef.current) return;

    if (!backgroundTopicCreatePromiseRef.current) {
      backgroundTopicCreatePromiseRef.current = createTopicMutation
        .mutateAsync({
          categoryId,
          title,
          description,
        })
        .then((topic) => {
          backgroundTopicIdRef.current = topic.id;
          setActiveTopicId(topic.id);
          toast({
            title: 'Support topic created',
            description: 'The topic was created so media can be attached.',
          });
        })
        .finally(() => {
          backgroundTopicCreatePromiseRef.current = null;
        });
    }

    await backgroundTopicCreatePromiseRef.current;
  };

  const ensureFaqForUpload = async ({
    question,
    answer,
  }: {
    question: string;
    answer: string;
  }) => {
    if (editingFaq?.id || backgroundFaqIdRef.current) return;

    if (!backgroundFaqCreatePromiseRef.current) {
      backgroundFaqCreatePromiseRef.current = createFaqMutation
        .mutateAsync({
          topicId: faqTopicId,
          question,
          answer,
        })
        .then((faq) => {
          backgroundFaqIdRef.current = faq.id;
          toast({
            title: 'FAQ created',
            description: 'The FAQ was created so media can be attached.',
          });
        })
        .finally(() => {
          backgroundFaqCreatePromiseRef.current = null;
        });
    }

    await backgroundFaqCreatePromiseRef.current;
  };

  const handleTopicDialogOpenChange = async (open: boolean) => {
    if (open) {
      setIsTopicDialogOpen(true);
      return;
    }

    setIsTopicDialogOpen(false);

    const backgroundTopicId = backgroundTopicIdRef.current;
    if (!editingTopic && backgroundTopicId && !topicDialogCommittedRef.current) {
      backgroundTopicIdRef.current = '';
      try {
        await deleteTopicMutation.mutateAsync(backgroundTopicId);
        if (resolvedActiveTopicId === backgroundTopicId) {
          setActiveTopicId('');
        }
      } catch (error) {
        toast(apiErrorToToast(error, 'Failed to discard the unsaved support topic.'));
      }
    }
  };

  const handleFaqDialogOpenChange = async (open: boolean) => {
    if (open) {
      setIsFaqDialogOpen(true);
      return;
    }

    setIsFaqDialogOpen(false);

    const backgroundFaqId = backgroundFaqIdRef.current;
    if (!editingFaq && backgroundFaqId && !faqDialogCommittedRef.current) {
      backgroundFaqIdRef.current = '';
      try {
        await deleteFaqMutation.mutateAsync(backgroundFaqId);
      } catch (error) {
        toast(apiErrorToToast(error, 'Failed to discard the unsaved FAQ.'));
      }
    }
  };

  const uploadSupportImage = async (
    file: File,
    module: SupportMediaModule,
    topicId: string,
    faqId: string | undefined,
    source: UploadSupportMediaPayload['source'],
    options?: Pick<UploadSupportMediaPayload, 'onProgress' | 'onStatusChange'>,
  ) => {
    const uploadedMedia = await uploadSupportMediaMutation.mutateAsync({
      file,
      mediaType: 'image',
      module,
      topicId,
      faqId,
      source,
      ...options,
    });

    return {
      src: uploadedMedia.url,
      alt: uploadedMedia.fileName || file.name,
      width: uploadedMedia.originalWidth,
      height: uploadedMedia.originalHeight,
      fileId: uploadedMedia.fileId,
    };
  };

  const uploadSupportVideo = async (
    file: File,
    module: SupportMediaModule,
    topicId: string,
    faqId: string | undefined,
    source: UploadSupportMediaPayload['source'],
    options?: Pick<UploadSupportMediaPayload, 'onProgress' | 'onStatusChange'>,
  ) => {
    const uploadedMedia = await uploadSupportMediaMutation.mutateAsync({
      file,
      mediaType: 'video',
      module,
      topicId,
      faqId,
      source,
      ...options,
    });

    return {
      src: uploadedMedia.url,
      type: uploadedMedia.mimeType || file.type,
      width: uploadedMedia.originalWidth,
      height: uploadedMedia.originalHeight,
      poster: uploadedMedia.poster || undefined,
      fileId: uploadedMedia.fileId,
    };
  };

  const uploadSupportTopicImage = (
    file: File,
    options?: Pick<UploadSupportMediaPayload, 'onProgress' | 'onStatusChange'>,
  ) =>
    uploadSupportImage(
      file,
      'support_topic',
      editingTopic?.id || backgroundTopicIdRef.current || '',
      undefined,
      'support-topic',
      options,
    );

  const uploadSupportTopicVideo = (
    file: File,
    options?: Pick<UploadSupportMediaPayload, 'onProgress' | 'onStatusChange'>,
  ) =>
    uploadSupportVideo(
      file,
      'support_topic',
      editingTopic?.id || backgroundTopicIdRef.current || '',
      undefined,
      'support-topic',
      options,
    );

  const uploadSupportFaqImage = (
    file: File,
    options?: Pick<UploadSupportMediaPayload, 'onProgress' | 'onStatusChange'>,
  ) =>
    uploadSupportImage(
      file,
      'support_faq',
      faqTopicId || editingFaq?.topicId || '',
      editingFaq?.id || backgroundFaqIdRef.current || undefined,
      'support-faq',
      options,
    );

  const uploadSupportFaqVideo = (
    file: File,
    options?: Pick<UploadSupportMediaPayload, 'onProgress' | 'onStatusChange'>,
  ) =>
    uploadSupportVideo(
      file,
      'support_faq',
      faqTopicId || editingFaq?.topicId || '',
      editingFaq?.id || backgroundFaqIdRef.current || undefined,
      'support-faq',
      options,
    );

  const deleteSupportMedia = async (fileId: string) => {
    await deleteSupportMediaMutation.mutateAsync(fileId);
  };

  if (hasError) {
    return (
      <div className="min-h-full overflow-y-auto bg-background p-6">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-foreground">Support</h1>
            <p className="text-muted-foreground">
              Manage support topics and publish structured guidance for Super Admin users.
            </p>
          </div>

          <div className="flex min-h-[420px] items-center justify-center rounded-3xl px-6 py-10">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                No support found
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Support topics are not available right now.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Outlet
        context={
          {
            supportTopics,
            activeTopic,
            activeTopicId: resolvedActiveTopicId,
            topicFaqs,
            isLoading,
            setActiveTopicId,
            openCreateTopic,
            openEditTopic,
            deleteTopic,
            openCreateFaq,
            openEditFaq,
            deleteFaq,
          } satisfies SupportCenterOutletContext
        }
      />

      <SupportTopicDialog
        open={isTopicDialogOpen}
        topic={editingTopic}
        existingCategories={existingCategories}
        isSaving={createTopicMutation.isPending || updateTopicMutation.isPending}
        isCreatingCategory={createCategoryMutation.isPending}
        onOpenChange={handleTopicDialogOpenChange}
        onCreateCategory={async (categoryName) => {
          try {
            const category = await createCategoryMutation.mutateAsync({ categoryName });
            toast({
              title: 'Category created',
              description: 'The support category is now available for new topics.',
            });
            return category.id;
          } catch (error) {
            toast(apiErrorToToast(error, 'Failed to create category.'));
            return undefined;
          }
        }}
        onSave={async ({ categoryId, title, description }) => {
          try {
            const existingTopicId = editingTopic?.id || backgroundTopicIdRef.current;
            const topic = existingTopicId
              ? await updateTopicMutation.mutateAsync({
                  topicId: existingTopicId,
                  payload: { categoryId, title, description },
                })
              : await createTopicMutation.mutateAsync({
                  categoryId,
                  title,
                  description,
                });

            topicDialogCommittedRef.current = true;
            backgroundTopicIdRef.current = '';
            setActiveTopicId(topic.id);
            setIsTopicDialogOpen(false);
            toast({
              title: editingTopic ? 'Support topic updated' : 'Support topic created',
              description: 'The support topic has been saved successfully.',
            });
          } catch (error) {
            toast(apiErrorToToast(error, 'Failed to save support topic.'));
          }
        }}
        onEnsureTopicForUpload={ensureTopicForUpload}
        onImageUpload={uploadSupportTopicImage}
        onVideoUpload={uploadSupportTopicVideo}
        onMediaDelete={deleteSupportMedia}
        onMediaUploadError={(error) => {
          toast(apiErrorToToast(error, 'Failed to upload support media.'));
        }}
        onMediaDeleteError={(error) => {
          toast(apiErrorToToast(error, 'Failed to delete support media.'));
        }}
      />

      <FAQDialog
        open={isFaqDialogOpen}
        faq={editingFaq}
        isSaving={createFaqMutation.isPending || updateFaqMutation.isPending}
        onOpenChange={handleFaqDialogOpenChange}
        onSave={async ({ question, answer }) => {
          try {
            const existingFaqId = editingFaq?.id || backgroundFaqIdRef.current;
            await (existingFaqId
              ? updateFaqMutation.mutateAsync({
                  faqId: existingFaqId,
                  payload: { question, answer },
                })
              : createFaqMutation.mutateAsync({
                  topicId: faqTopicId,
                  question,
                  answer,
                }));

            faqDialogCommittedRef.current = true;
            backgroundFaqIdRef.current = '';
            setIsFaqDialogOpen(false);
            toast({
              title: editingFaq ? 'FAQ updated' : 'FAQ created',
              description: 'The FAQ has been saved successfully.',
            });
          } catch (error) {
            toast(apiErrorToToast(error, 'Failed to save FAQ.'));
          }
        }}
        onEnsureFaqForUpload={ensureFaqForUpload}
        onImageUpload={uploadSupportFaqImage}
        onVideoUpload={uploadSupportFaqVideo}
        onMediaDelete={deleteSupportMedia}
        onMediaUploadError={(error) => {
          toast(apiErrorToToast(error, 'Failed to upload support media.'));
        }}
        onMediaDeleteError={(error) => {
          toast(apiErrorToToast(error, 'Failed to delete support media.'));
        }}
      />

      <ConfirmDialog />
    </>
  );
};

export default SuperAdminSupportCenter;
