import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { formatDateDDMMYYYY } from '@/shared/utils/date-format';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client';
import { compressVideo } from '@/utils/videoCompression.ts';

export interface SupportCategoryDto {
  id: string;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportFaqDto {
  id: string;
  topicId: string;
  question: string;
  answer: string;
  media?: SupportMediaUploadDto[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportTopicDto {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  media?: SupportMediaUploadDto[];
  faqs: SupportFaqDto[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportMediaUploadDto {
  fileId: string;
  id?: string;
  url: string;
  mediaUrl?: string;
  mediaType: 'image' | 'video';
  mimeType?: string;
  fileType?: string;
  fileName?: string;
  fileSize?: number;
  originalWidth?: number;
  originalHeight?: number;
  poster?: string | null;
  createdAt?: string;
}

export interface SupportMediaUploadResponseDto {
  success: boolean;
  message?: string;
  data: SupportMediaUploadDto;
}

export interface PresignedMediaUrlPayload {
  fileName: string;
  fileType: string;
  fileSize: number;
  module: SupportMediaModule;
}

export interface PresignedMediaUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export interface DeleteSupportMediaResponseDto {
  success: boolean;
  message?: string;
}

export interface SupportListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SupportListResponse<T> {
  data: T[];
  meta: SupportListMeta;
}

export interface SupportCategory {
  id: string;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportFaq {
  id: string;
  topicId: string;
  question: string;
  answer: string;
  media: SupportMediaUpload[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportTopic {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  media: SupportMediaUpload[];
  faqs: SupportFaq[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportMediaUpload {
  fileId: string;
  url: string;
  mediaType: 'image' | 'video';
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
  originalWidth?: number;
  originalHeight?: number;
  poster?: string | null;
  createdAt?: string;
}

export interface GetSupportCategoriesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetSupportTopicsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
}

export interface CreateSupportCategoryPayload {
  categoryName: string;
}

export interface CreateSupportTopicPayload {
  categoryId: string;
  title: string;
  description: string;
}

export interface UpdateSupportTopicPayload {
  categoryId?: string;
  title?: string;
  description?: string;
}

export interface CreateSupportFaqPayload {
  topicId: string;
  question: string;
  answer: string;
}

export interface UpdateSupportFaqPayload {
  question?: string;
  answer?: string;
}

export interface UploadSupportMediaPayload {
  file: File;
  mediaType: 'image' | 'video';
  module: SupportMediaModule;
  topicId: string;
  faqId?: string;
  source: SupportMediaSource;
  onProgress?: (progress: number) => void;
  onStatusChange?: (status: string) => void;
}

export type SupportMediaModule = 'support_topic' | 'support_faq';
export type SupportMediaSource = 'support-topic' | 'support-faq';

interface RegisterSupportMediaPayload {
  mediaType: 'image' | 'video';
  topicId: string;
  faqId?: string;
  source: SupportMediaSource;
  mediaKey: string;
  mediaUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

const SUPPORT_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const SUPPORT_VIDEO_MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED_SUPPORT_IMAGE_TYPES = ['image/png', 'image/jpeg'];
const ALLOWED_SUPPORT_VIDEO_TYPES = ['video/mp4'];

function buildQueryString<T extends object>(params?: T) {
  const query = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === '') return;
    query.set(key, String(value));
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

function mapSupportCategory(dto: SupportCategoryDto): SupportCategory {
  return {
    id: dto.id,
    categoryName: dto.categoryName,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function mapSupportFaq(dto: SupportFaqDto): SupportFaq {
  const media = Array.isArray(dto.media) ? dto.media.map(mapSupportMediaUpload) : [];

  return {
    id: dto.id,
    topicId: dto.topicId,
    question: dto.question,
    answer: replaceRichTextMediaUrls(dto.answer, media),
    media,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function mapSupportTopic(dto: SupportTopicDto): SupportTopic {
  const media = Array.isArray(dto.media) ? dto.media.map(mapSupportMediaUpload) : [];

  return {
    id: dto.id,
    categoryId: dto.categoryId,
    categoryName: dto.categoryName,
    title: dto.title,
    description: replaceRichTextMediaUrls(dto.description, media),
    media,
    faqs: Array.isArray(dto.faqs) ? dto.faqs.map(mapSupportFaq) : [],
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function mapSupportMediaUpload(dto: SupportMediaUploadDto): SupportMediaUpload {
  return {
    fileId: dto.fileId || dto.id || '',
    url: dto.url || dto.mediaUrl || '',
    mediaType: dto.mediaType,
    mimeType: dto.mimeType || dto.fileType,
    fileName: dto.fileName,
    fileSize: dto.fileSize,
    originalWidth: dto.originalWidth,
    originalHeight: dto.originalHeight,
    poster: dto.poster,
    createdAt: dto.createdAt,
  };
}

function replaceRichTextMediaUrls(html: string, media: SupportMediaUpload[]) {
  if (!html || media.length === 0 || typeof DOMParser === 'undefined') return html;

  const mediaUrlByFileId = new Map(
    media
      .filter((item) => item.fileId && item.url)
      .map((item) => [item.fileId, item.url] as const),
  );

  if (mediaUrlByFileId.size === 0) return html;

  const document = new DOMParser().parseFromString(html, 'text/html');
  document.querySelectorAll('[data-rich-text-media-wrapper]').forEach((node) => {
    const wrapper = node as HTMLElement;
    const wrapperFileId = wrapper.dataset.fileId;
    const mediaElement = wrapper.querySelector('img, video') as
      | HTMLImageElement
      | HTMLVideoElement
      | null;
    const fileId = wrapperFileId || mediaElement?.dataset.fileId;
    const freshUrl = fileId ? mediaUrlByFileId.get(fileId) : undefined;

    if (!freshUrl || !mediaElement) return;

    mediaElement.src = freshUrl;
    mediaElement.dataset.fileId = fileId;
    wrapper.dataset.fileId = fileId;

    if (mediaElement instanceof HTMLVideoElement) {
      mediaElement.querySelectorAll('source').forEach((source) => {
        source.src = freshUrl;
      });
    }
  });

  return document.body.innerHTML;
}

export function formatSupportTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return formatDateDDMMYYYY(parsed);
}

export const supportQueryKeys = {
  all: ['support'] as const,
  categories: (params?: GetSupportCategoriesParams) => ['support', 'categories', params ?? {}] as const,
  adminTopics: (params?: GetSupportTopicsParams) => ['support', 'admin-topics', params ?? {}] as const,
  portalTopics: (params?: GetSupportTopicsParams) => ['support', 'portal-topics', params ?? {}] as const,
};

export const supportApi = {
  listCategories: async (
    params: GetSupportCategoriesParams = {},
  ): Promise<SupportListResponse<SupportCategory>> => {
    const response = await apiGet<SupportListResponse<SupportCategoryDto>>(
      `/support/categories${buildQueryString(params)}`,
    );

    return {
      data: response.data.map(mapSupportCategory),
      meta: response.meta,
    };
  },

  createCategory: async (payload: CreateSupportCategoryPayload): Promise<SupportCategory> => {
    const response = await apiPost<SupportCategoryDto>('/support/categories', payload);
    return mapSupportCategory(response);
  },

  listAdminTopics: async (
    params: GetSupportTopicsParams = {},
  ): Promise<SupportListResponse<SupportTopic>> => {
    const response = await apiGet<SupportListResponse<SupportTopicDto>>(
      `/support/admin/topics${buildQueryString(params)}`,
    );

    return {
      data: response.data.map(mapSupportTopic),
      meta: response.meta,
    };
  },

  listPortalTopics: async (
    params: GetSupportTopicsParams = {},
  ): Promise<SupportListResponse<SupportTopic>> => {
    const response = await apiGet<SupportListResponse<SupportTopicDto>>(
      `/support/topics${buildQueryString(params)}`,
    );

    return {
      data: response.data.map(mapSupportTopic),
      meta: response.meta,
    };
  },

  createTopic: async (payload: CreateSupportTopicPayload): Promise<SupportTopic> => {
    const response = await apiPost<SupportTopicDto>('/support/topics', payload);
    return mapSupportTopic(response);
  },

  updateTopic: async (topicId: string, payload: UpdateSupportTopicPayload): Promise<SupportTopic> => {
    const response = await apiPatch<SupportTopicDto>(`/support/topics/${topicId}`, payload);
    return mapSupportTopic(response);
  },

  deleteTopic: (topicId: string): Promise<void> => apiDelete<void>(`/support/topics/${topicId}`),

  uploadMedia: async (payload: UploadSupportMediaPayload): Promise<SupportMediaUpload> => {
    validateSupportMediaRelation(payload);
    validateSupportMediaType(payload.file, payload.mediaType);

    payload.onStatusChange?.(
      payload.mediaType === 'video' && payload.file.size > 10 * 1024 * 1024
        ? 'Compressing video...'
        : 'Preparing upload...',
    );
    payload.onProgress?.(10);

    const uploadFile = payload.mediaType === 'video' ? await compressVideo(payload.file) : payload.file;

    validateSupportMediaFile(uploadFile, payload.mediaType);
    const uploadFileType = uploadFile.type || payload.file.type || 'application/octet-stream';
    payload.onStatusChange?.('Requesting upload URL...');
    payload.onProgress?.(35);

    const presignedUrl = unwrapPresignedMediaResponse(await apiPost('/media/presigned-url', {
      fileName: uploadFile.name,
      fileType: uploadFileType,
      fileSize: uploadFile.size,
      module: payload.module,
    } satisfies PresignedMediaUrlPayload));

    payload.onStatusChange?.('Uploading media...');
    payload.onProgress?.(60);

    const uploadResponse = await fetch(presignedUrl.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': uploadFileType,
      },
      body: uploadFile,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Media upload failed with status ${uploadResponse.status}.`);
    }

    payload.onStatusChange?.('Registering media...');
    payload.onProgress?.(90);

    const registeredMedia = unwrapSupportMediaResponse(await apiPost('/support/media', {
      mediaType: payload.mediaType,
      topicId: payload.topicId,
      faqId: payload.faqId,
      source: payload.source,
      mediaKey: presignedUrl.key,
      mediaUrl: presignedUrl.fileUrl,
      fileName: uploadFile.name,
      fileType: uploadFileType,
      fileSize: uploadFile.size,
    } satisfies RegisterSupportMediaPayload));

    payload.onStatusChange?.('Upload complete.');
    payload.onProgress?.(100);

    return registeredMedia;
  },

  deleteMedia: (fileId: string): Promise<DeleteSupportMediaResponseDto> =>
    apiDelete<DeleteSupportMediaResponseDto>(`/support/media/${encodeURIComponent(fileId)}`),

  createFaq: async (payload: CreateSupportFaqPayload): Promise<SupportFaq> => {
    const response = await apiPost<SupportFaqDto>('/support/faqs', payload);
    return mapSupportFaq(response);
  },

  updateFaq: async (faqId: string, payload: UpdateSupportFaqPayload): Promise<SupportFaq> => {
    const response = await apiPatch<SupportFaqDto>(`/support/faqs/${faqId}`, payload);
    return mapSupportFaq(response);
  },

  deleteFaq: (faqId: string): Promise<void> => apiDelete<void>(`/support/faqs/${faqId}`),
};

function unwrapPresignedMediaResponse(response: unknown): PresignedMediaUrlResponse {
  const candidate =
    response &&
    typeof response === 'object' &&
    'data' in response &&
    (response as { data?: unknown }).data &&
    typeof (response as { data?: unknown }).data === 'object'
      ? (response as { data: unknown }).data
      : response;

  const uploadUrl = (candidate as PresignedMediaUrlResponse)?.uploadUrl;
  const fileUrl = (candidate as PresignedMediaUrlResponse)?.fileUrl;
  const key = (candidate as PresignedMediaUrlResponse)?.key;

  if (!uploadUrl || !fileUrl || !key) {
    throw new Error('The upload URL response was missing required media URLs.');
  }

  return { uploadUrl, fileUrl, key };
}

function unwrapSupportMediaResponse(response: unknown): SupportMediaUpload {
  const candidate =
    response &&
    typeof response === 'object' &&
    'data' in response &&
    (response as { data?: unknown }).data &&
    typeof (response as { data?: unknown }).data === 'object'
      ? (response as { data: SupportMediaUploadDto }).data
      : (response as SupportMediaUploadDto);

  return mapSupportMediaUpload(candidate);
}

function validateSupportMediaRelation(payload: UploadSupportMediaPayload) {
  if (!payload.topicId) {
    throw new Error('Please save the support topic first, then upload media.');
  }

  if (payload.source === 'support-faq' && !payload.faqId) {
    throw new Error('Please save the FAQ first, then upload media into the FAQ answer.');
  }
}

function validateSupportMediaType(file: File, mediaType: 'image' | 'video') {
  const allowedTypes = mediaType === 'image' ? ALLOWED_SUPPORT_IMAGE_TYPES : ALLOWED_SUPPORT_VIDEO_TYPES;

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      mediaType === 'image'
        ? 'Please upload a PNG or JPEG image.'
        : 'Please upload an MP4 video.',
    );
  }
}

function validateSupportMediaFile(file: File, mediaType: 'image' | 'video') {
  validateSupportMediaType(file, mediaType);
  const maxSize = mediaType === 'image' ? SUPPORT_IMAGE_MAX_SIZE : SUPPORT_VIDEO_MAX_SIZE;
  if (file.size > maxSize) {
    throw new Error(
      mediaType === 'image'
        ? 'Please upload an image smaller than 5MB.'
        : 'Please upload a video smaller than 50MB.',
    );
  }
}

export function useSupportCategories(params: GetSupportCategoriesParams = {}) {
  return useQuery({
    queryKey: supportQueryKeys.categories(params),
    queryFn: () => supportApi.listCategories(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useAdminSupportTopics(params: GetSupportTopicsParams = {}) {
  return useQuery({
    queryKey: supportQueryKeys.adminTopics(params),
    queryFn: () => supportApi.listAdminTopics(params),
    staleTime: 1000 * 30,
  });
}

export function usePortalSupportTopics(params: GetSupportTopicsParams = {}) {
  return useQuery({
    queryKey: supportQueryKeys.portalTopics(params),
    queryFn: () => supportApi.listPortalTopics(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateSupportCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: supportApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportQueryKeys.all });
    },
  });
}

export function useCreateSupportTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: supportApi.createTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportQueryKeys.all });
    },
  });
}

export function useUploadSupportMedia() {
  return useMutation({
    mutationFn: supportApi.uploadMedia,
  });
}

export function useDeleteSupportMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: supportApi.deleteMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportQueryKeys.all });
    },
  });
}

export function useUpdateSupportTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ topicId, payload }: { topicId: string; payload: UpdateSupportTopicPayload }) =>
      supportApi.updateTopic(topicId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportQueryKeys.all });
    },
  });
}

export function useDeleteSupportTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: supportApi.deleteTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportQueryKeys.all });
    },
  });
}

export function useCreateSupportFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: supportApi.createFaq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportQueryKeys.all });
    },
  });
}

export function useUpdateSupportFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ faqId, payload }: { faqId: string; payload: UpdateSupportFaqPayload }) =>
      supportApi.updateFaq(faqId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportQueryKeys.all });
    },
  });
}

export function useDeleteSupportFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: supportApi.deleteFaq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportQueryKeys.all });
    },
  });
}
