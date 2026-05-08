import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/shared/utils/lib-utils';
import * as LucideIcons from 'lucide-react';

const {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Highlighter,
  ImagePlus,
  IndentDecrease,
  IndentIncrease,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Underline,
  Undo2,
  Upload,
  Video,
  Eye,
  Plus,
  Minus,
  Rows3,
  Columns3,
} = LucideIcons;

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  toolbarClassName?: string;
  toolbarEndContent?: React.ReactNode;
  editorWrapperClassName?: string;
  editorClassName?: string;
  contentClassName?: string;
  editorHeightClassName?: string;
  helperText?: string | null;
  previewTitle?: string;
  emptyPreviewText?: string;
  showUploadPlaceholder?: boolean;
  onImageUpload?: (file: File, options?: RichTextUploadOptions) => Promise<RichTextUploadedImage>;
  onImageUploadError?: (error: unknown) => void;
  onVideoUpload?: (file: File, options?: RichTextUploadOptions) => Promise<RichTextUploadedVideo>;
  onVideoUploadError?: (error: unknown) => void;
  onMediaDelete?: (fileId: string) => Promise<void>;
  onMediaDeleteError?: (error: unknown) => void;
  onMediaDeleteConfirm?: (mediaKind: 'image' | 'video') => boolean | Promise<boolean>;
}

export interface RichTextUploadOptions {
  onProgress?: (progress: number) => void;
  onStatusChange?: (status: string) => void;
}

export interface RichTextUploadedImage {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  fileId?: string;
}

export interface RichTextUploadedVideo {
  src: string;
  type?: string;
  width?: number;
  height?: number;
  poster?: string;
  fileId?: string;
}

const RICH_TEXT_CONTENT_CLASS = cn(
  'text-sm text-foreground',
  '[&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight',
  '[&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight',
  '[&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-snug',
  '[&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:leading-snug',
  '[&_p]:mb-3 [&_p]:leading-7',
  '[&_blockquote]:mb-3 [&_blockquote]:rounded-r-lg [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:bg-primary/5 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground',
  '[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6',
  '[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_li]:mb-1 [&_li>ul]:mt-2 [&_li>ol]:mt-2',
  '[&_strong]:font-semibold',
  '[&_table]:mb-0 [&_table]:w-full [&_table]:border-separate [&_table]:border-spacing-0 [&_table]:rounded-xl [&_table]:overflow-hidden',
  '[&_table]:shadow-[inset_0_0_0_1px_hsl(var(--border))]',
  '[&_td]:border [&_td]:border-solid [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top',
  '[&_th]:border [&_th]:border-solid [&_th]:border-border [&_th]:bg-muted/60 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold',
  '[&_div[data-rich-text-table-wrapper]]:my-4 [&_div[data-rich-text-table-wrapper]]:overflow-hidden [&_div[data-rich-text-table-wrapper]]:rounded-xl [&_div[data-rich-text-table-wrapper]]:border [&_div[data-rich-text-table-wrapper]]:border-solid [&_div[data-rich-text-table-wrapper]]:border-border',
  '[&_div[data-rich-text-table-wrapper]]:shadow-sm',
  '[&_div[data-rich-text-table-wrapper]_table]:overflow-hidden',
  '[&_div[data-rich-text-table-wrapper]_table_thead_tr:first-child_th:first-child]:rounded-tl-xl',
  '[&_div[data-rich-text-table-wrapper]_table_thead_tr:first-child_th:last-child]:rounded-tr-xl',
  '[&_div[data-rich-text-table-wrapper]_table_tbody_tr:last-child_td:first-child]:rounded-bl-xl',
  '[&_div[data-rich-text-table-wrapper]_table_tbody_tr:last-child_td:last-child]:rounded-br-xl',
  '[&_table_thead_tr:first-child_th:first-child]:rounded-tl-xl',
  '[&_table_thead_tr:first-child_th:last-child]:rounded-tr-xl',
  '[&_table_tbody_tr:last-child_td:first-child]:rounded-bl-xl',
  '[&_table_tbody_tr:last-child_td:last-child]:rounded-br-xl',
  '[&_div[data-rich-text-table-wrapper]_table_th:first-child]:border-l-0',
  '[&_div[data-rich-text-table-wrapper]_table_td:first-child]:border-l-0',
  '[&_div[data-rich-text-table-wrapper]_table_th:last-child]:border-r-0',
  '[&_div[data-rich-text-table-wrapper]_table_td:last-child]:border-r-0',
  '[&_div[data-rich-text-table-wrapper]_table_thead_tr:first-child_th]:border-t-0',
  '[&_div[data-rich-text-table-wrapper]_table_tbody_tr:last-child_td]:border-b-0',
  '[&_div[data-rich-text-media-wrapper]]:my-4 [&_div[data-rich-text-media-wrapper]]:max-w-full [&_div[data-rich-text-media-wrapper]]:overflow-hidden [&_div[data-rich-text-media-wrapper]]:rounded-none [&_div[data-rich-text-media-wrapper]]:border [&_div[data-rich-text-media-wrapper]]:border-border [&_div[data-rich-text-media-wrapper]]:bg-background [&_div[data-rich-text-media-wrapper]]:shadow-sm',
  '[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-border [&_img]:object-contain [&_img]:shadow-sm',
  '[&_div[data-rich-text-media-wrapper]_img]:my-0 [&_div[data-rich-text-media-wrapper]_img]:h-full [&_div[data-rich-text-media-wrapper]_img]:w-full [&_div[data-rich-text-media-wrapper]_img]:rounded-none [&_div[data-rich-text-media-wrapper]_img]:border-0 [&_div[data-rich-text-media-wrapper]_img]:shadow-none',
  '[&_iframe]:my-4 [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-xl [&_iframe]:border [&_iframe]:border-border [&_iframe]:bg-black',
  '[&_div[data-rich-text-media-wrapper]_iframe]:my-0 [&_div[data-rich-text-media-wrapper]_iframe]:h-full [&_div[data-rich-text-media-wrapper]_iframe]:w-full [&_div[data-rich-text-media-wrapper]_iframe]:rounded-none [&_div[data-rich-text-media-wrapper]_iframe]:border-0',
  '[&_video]:my-4 [&_video]:w-full [&_video]:rounded-xl [&_video]:border [&_video]:border-border [&_video]:bg-black',
  '[&_div[data-rich-text-media-wrapper]_video]:my-0 [&_div[data-rich-text-media-wrapper]_video]:h-full [&_div[data-rich-text-media-wrapper]_video]:w-full [&_div[data-rich-text-media-wrapper]_video]:rounded-none [&_div[data-rich-text-media-wrapper]_video]:border-0',
);

export const RICH_TEXT_CHROMELESS_MEDIA_CLASS = cn(
  '[&_div[data-rich-text-media-wrapper]]:border-0',
  '[&_div[data-rich-text-media-wrapper]]:bg-transparent',
  '[&_div[data-rich-text-media-wrapper]]:shadow-none',
  '[&_img]:border-0 [&_img]:shadow-none',
  '[&_iframe]:border-0',
  '[&_video]:border-0',
);

const DEFAULT_RICH_TEXT_HELPER_TEXT =
  'Use the toolbar for formatting, media embeds, tables, and indentation.';

type BlockType = 'p' | 'h1' | 'h2' | 'h3' | 'h4';
type Alignment = 'left' | 'center' | 'right' | 'justify';

type ActiveFormats = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  blockquote: boolean;
  unorderedList: boolean;
  orderedList: boolean;
  blockType: BlockType;
  alignment: Alignment;
};

type PendingMediaUpload = {
  file: File;
  kind: 'image' | 'video';
  previewUrl: string;
};

type MediaAlignment = 'left' | 'center' | 'right';

const DEFAULT_FORMATS: ActiveFormats = {
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  blockquote: false,
  unorderedList: false,
  orderedList: false,
  blockType: 'p',
  alignment: 'left',
};

const TOOLBAR_BUTTON_CLASS =
  'h-9 min-w-9 rounded-lg border border-transparent px-2 text-muted-foreground transition-colors hover:border-border hover:bg-background hover:text-foreground';

const TEXT_COLORS = ['#0f172a', '#1d4ed8', '#0f766e', '#7c3aed', '#dc2626', '#f59e0b'];
const HIGHLIGHT_COLORS = ['#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#fee2e2', '#ede9fe'];
const FONT_SIZE_OPTIONS = [
  { label: '12', value: '2' },
  { label: '14', value: '3' },
  { label: '18', value: '4' },
  { label: '24', value: '5' },
  { label: '32', value: '6' },
];

const TABLE_BORDER_STYLE = '1px solid hsl(var(--border))';

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter content',
  className,
  toolbarClassName,
  toolbarEndContent,
  editorWrapperClassName,
  editorClassName,
  contentClassName,
  editorHeightClassName = 'h-[320px]',
  helperText = DEFAULT_RICH_TEXT_HELPER_TEXT,
  previewTitle = 'Preview',
  emptyPreviewText = 'No content to preview yet.',
  showUploadPlaceholder = true,
  onImageUpload,
  onImageUploadError,
  onVideoUpload,
  onVideoUploadError,
  onMediaDelete,
  onMediaDeleteError,
  onMediaDeleteConfirm,
}: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const videoFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const savedRangeRef = React.useRef<Range | null>(null);
  const toolbarScrollRef = React.useRef<HTMLDivElement | null>(null);

  const [activeFormats, setActiveFormats] = React.useState<ActiveFormats>(DEFAULT_FORMATS);
  const [textColor, setTextColor] = React.useState('#0f172a');
  const [highlightColor, setHighlightColor] = React.useState('#fef3c7');
  const [fontSize, setFontSize] = React.useState('3');
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = React.useState(false);
  const [videoUrl, setVideoUrl] = React.useState('');
  const [isTableDialogOpen, setIsTableDialogOpen] = React.useState(false);
  const [tableRows, setTableRows] = React.useState('3');
  const [tableColumns, setTableColumns] = React.useState('3');
  const [isEditorFocused, setIsEditorFocused] = React.useState(false);
  const [showToolbarLeftArrow, setShowToolbarLeftArrow] = React.useState(false);
  const [showToolbarRightArrow, setShowToolbarRightArrow] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = React.useState(false);
  const [mediaUploadProgress, setMediaUploadProgress] = React.useState(0);
  const [mediaUploadStatus, setMediaUploadStatus] = React.useState('');
  const [pendingMediaUpload, setPendingMediaUpload] = React.useState<PendingMediaUpload | null>(null);
  const [deletingMediaIds, setDeletingMediaIds] = React.useState<Set<string>>(() => new Set());
  const [selectedMediaId, setSelectedMediaId] = React.useState<string | null>(null);
  const selectedMediaWrapperRef = React.useRef<HTMLDivElement | null>(null);

  const hasVisibleContent = React.useMemo(() => hasMeaningfulContent(value), [value]);
  const isUploadingPendingMedia = isUploadingImage || isUploadingVideo;
  const isMediaSelected = selectedMediaId !== null;

  React.useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (getSanitizedEditorHtml(editor) !== (value || '')) {
      editor.innerHTML = value || '';
      restorePersistedMediaWrappers(editor);
      normalizeMediaWrappers(editor);
    }
    decorateEditableMediaWrappers(editor);

    if (selectedMediaId) {
      const selectedWrapper = editor.querySelector(
        `[data-media-id="${selectedMediaId}"]`,
      ) as HTMLDivElement | null;

      if (selectedWrapper) {
        selectedMediaWrapperRef.current = selectedWrapper;
        applyMediaSelectionStyles(selectedWrapper, true);
      } else {
        clearSelectedMediaWrapper(selectedMediaWrapperRef, setSelectedMediaId);
      }
    }
  }, [selectedMediaId, value]);

  React.useEffect(() => {
    const editor = editorRef.current;
    if (!editor || typeof ResizeObserver === 'undefined') return;

    let resizeTimeoutId: number | null = null;
    let hasPendingResizeSync = false;
    const observedWrappers = new Set<HTMLDivElement>();

    const flushMediaResize = () => {
      resizeTimeoutId = null;
      hasPendingResizeSync = false;
      const hasChanges = normalizeMediaWrappers(editor);
      if (hasChanges) {
        onChange(getSanitizedEditorHtml(editor));
      }
    };

    const scheduleMediaResizeSync = () => {
      hasPendingResizeSync = true;

      if (resizeTimeoutId !== null) {
        window.clearTimeout(resizeTimeoutId);
      }

      resizeTimeoutId = window.setTimeout(flushMediaResize, 160);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      const hasMediaWrapperResize = entries.some((entry) =>
        (entry.target as HTMLElement).matches('[data-rich-text-media-wrapper]'),
      );

      if (hasMediaWrapperResize) {
        scheduleMediaResizeSync();
      }
    });

    const observeWrapper = (wrapper: HTMLDivElement) => {
      if (observedWrappers.has(wrapper)) return;
      observedWrappers.add(wrapper);
      resizeObserver.observe(wrapper);
    };

    const unobserveWrapper = (wrapper: HTMLDivElement) => {
      if (!observedWrappers.has(wrapper)) return;
      observedWrappers.delete(wrapper);
      resizeObserver.unobserve(wrapper);
    };

    editor.querySelectorAll('[data-rich-text-media-wrapper]').forEach((node) => {
      observeWrapper(node as HTMLDivElement);
    });

    const mutationObserver = new MutationObserver((mutations) => {
      let shouldScheduleSync = false;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;

          if (node.matches('[data-rich-text-media-wrapper]')) {
            observeWrapper(node as HTMLDivElement);
            shouldScheduleSync = true;
          }

          node.querySelectorAll('[data-rich-text-media-wrapper]').forEach((child) => {
            observeWrapper(child as HTMLDivElement);
            shouldScheduleSync = true;
          });
        });

        mutation.removedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;

          if (node.matches('[data-rich-text-media-wrapper]')) {
            unobserveWrapper(node as HTMLDivElement);
          }

          node.querySelectorAll('[data-rich-text-media-wrapper]').forEach((child) => {
            unobserveWrapper(child as HTMLDivElement);
          });
        });
      });

      if (shouldScheduleSync) {
        scheduleMediaResizeSync();
      }
    });

    const flushPendingResizeSync = () => {
      if (hasPendingResizeSync) {
        if (resizeTimeoutId !== null) {
          window.clearTimeout(resizeTimeoutId);
        }
        flushMediaResize();
      }
    };

    window.addEventListener('mouseup', flushPendingResizeSync);
    window.addEventListener('touchend', flushPendingResizeSync);
    window.addEventListener('pointerup', flushPendingResizeSync);

    mutationObserver.observe(editor, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('mouseup', flushPendingResizeSync);
      window.removeEventListener('touchend', flushPendingResizeSync);
      window.removeEventListener('pointerup', flushPendingResizeSync);
      if (resizeTimeoutId !== null) {
        window.clearTimeout(resizeTimeoutId);
      }
    };
  }, [onChange]);

  React.useEffect(() => {
    return () => {
      if (pendingMediaUpload) {
        URL.revokeObjectURL(pendingMediaUpload.previewUrl);
      }
    };
  }, [pendingMediaUpload]);

  const syncContent = React.useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      onChange('');
      return;
    }

    normalizeMediaWrappers(editor);
    onChange(getSanitizedEditorHtml(editor));
  }, [onChange]);

  const focusEditor = React.useCallback(() => {
    editorRef.current?.focus();
  }, []);

  const ensureEditableBlock = React.useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (editor.innerHTML.trim() === '') {
      editor.innerHTML = '<p><br></p>';
      const selection = window.getSelection();
      const range = document.createRange();
      const paragraph = editor.querySelector('p') || editor;
      range.selectNodeContents(paragraph);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, []);

  const captureSelection = React.useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (editorRef.current?.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  }, []);

  const restoreSelection = React.useCallback(() => {
    const selection = window.getSelection();
    const range = savedRangeRef.current;
    if (!selection || !range) return false;
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }, []);

  const refreshToolbarState = React.useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (selectedMediaId) {
      const selectedMediaWrapper = editor.querySelector(
        `[data-media-id="${selectedMediaId}"]`,
      ) as HTMLDivElement | null;

      if (selectedMediaWrapper) {
        const alignment =
          (selectedMediaWrapper.dataset.alignment as Alignment | undefined) || 'left';
        setActiveFormats({
          ...DEFAULT_FORMATS,
          alignment,
        });
        return;
      }
    }

    const selection = window.getSelection();
    const node =
      selection?.anchorNode?.nodeType === Node.ELEMENT_NODE
        ? (selection.anchorNode as HTMLElement)
        : selection?.anchorNode?.parentElement;
    const block = node?.closest('h1, h2, h3, h4, p')?.tagName.toLowerCase() as BlockType | undefined;
    const blockquote = Boolean(node?.closest('blockquote'));
    const alignment = getCurrentAlignment(node);

    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      blockquote,
      unorderedList: document.queryCommandState('insertUnorderedList'),
      orderedList: document.queryCommandState('insertOrderedList'),
      blockType: block || 'p',
      alignment,
    });

    const queriedTextColor = String(document.queryCommandValue('foreColor') || '').trim();
    if (queriedTextColor) setTextColor(toHexColor(queriedTextColor));

    const queriedHighlight = String(
      document.queryCommandValue('hiliteColor') || document.queryCommandValue('backColor') || '',
    ).trim();
    if (queriedHighlight) setHighlightColor(toHexColor(queriedHighlight));

    const queriedFontSize = String(document.queryCommandValue('fontSize') || '').trim();
    if (queriedFontSize) setFontSize(queriedFontSize);
  }, [selectedMediaId]);

  React.useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      if (!editorRef.current?.contains(range.commonAncestorContainer)) return;

      const selectedMediaWrapper = getClosestMediaWrapper(range.commonAncestorContainer, editorRef.current);
      if (!selectedMediaWrapper && selectedMediaWrapperRef.current) {
        clearSelectedMediaWrapper(selectedMediaWrapperRef, setSelectedMediaId);
      }

      captureSelection();
      refreshToolbarState();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [captureSelection, refreshToolbarState]);

  React.useEffect(() => {
    refreshToolbarState();
  }, [refreshToolbarState, selectedMediaId]);

  const updateToolbarScrollState = React.useCallback(() => {
    const container = toolbarScrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowToolbarLeftArrow(scrollLeft > 0);
    setShowToolbarRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  React.useEffect(() => {
    updateToolbarScrollState();
    window.addEventListener('resize', updateToolbarScrollState);
    return () => window.removeEventListener('resize', updateToolbarScrollState);
  }, [updateToolbarScrollState]);

  const scrollToolbarBy = React.useCallback((offset: number) => {
    const container = toolbarScrollRef.current;
    if (!container) return;
    container.scrollBy({ left: offset, behavior: 'smooth' });
  }, []);

  const runCommand = React.useCallback(
    (command: string, commandValue?: string) => {
      focusEditor();
      ensureEditableBlock();
      document.execCommand('styleWithCSS', false, 'true');
      document.execCommand(command, false, commandValue);
      syncContent();
      refreshToolbarState();
    },
    [ensureEditableBlock, focusEditor, refreshToolbarState, syncContent],
  );

  const applyBlockType = React.useCallback(
    (nextBlockType: BlockType) => {
      focusEditor();
      ensureEditableBlock();
      document.execCommand('formatBlock', false, nextBlockType);
      syncContent();
      refreshToolbarState();
    },
    [ensureEditableBlock, focusEditor, refreshToolbarState, syncContent],
  );

  const toggleBlockquote = React.useCallback(() => {
    focusEditor();
    ensureEditableBlock();
    restoreSelection();

    const selection = window.getSelection();
    const node =
      selection?.anchorNode?.nodeType === Node.ELEMENT_NODE
        ? (selection.anchorNode as HTMLElement)
        : selection?.anchorNode?.parentElement;
    const existingBlockquote = node?.closest('blockquote');

    if (existingBlockquote) {
      const paragraph = document.createElement('p');
      paragraph.innerHTML = existingBlockquote.innerHTML || '<br>';
      existingBlockquote.replaceWith(paragraph);
      syncContent();
      refreshToolbarState();
      return;
    }

    document.execCommand('formatBlock', false, 'blockquote');
    syncContent();
    refreshToolbarState();
  }, [ensureEditableBlock, focusEditor, refreshToolbarState, restoreSelection, syncContent]);

  const applyAlignment = React.useCallback(
    (alignment: Alignment) => {
    const commandMap: Record<Alignment, string> = {
        left: 'justifyLeft',
        center: 'justifyCenter',
        right: 'justifyRight',
        justify: 'justifyFull',
      };

      if (selectedMediaWrapperRef.current) {
        if (alignment === 'justify') return;

        applyMediaAlignment(selectedMediaWrapperRef.current, alignment);
        syncContent();
        refreshToolbarState();
        return;
      }

      runCommand(commandMap[alignment]);
    },
    [refreshToolbarState, runCommand, syncContent],
  );

  const applyTextColor = React.useCallback(
    (nextColor: string) => {
      setTextColor(nextColor);
      runCommand('foreColor', nextColor);
    },
    [runCommand],
  );

  const applyHighlightColor = React.useCallback(
    (nextColor: string) => {
      setHighlightColor(nextColor);
      runCommand('hiliteColor', nextColor);
    },
    [runCommand],
  );

  const handleTextPaletteColorClick = React.useCallback(
    (nextColor: string) => {
      if (selectionHasMatchingInlineStyle(editorRef.current, 'color', nextColor)) {
        applyTextColor('#000000');
        return;
      }

      applyTextColor(nextColor);
    },
    [applyTextColor],
  );

  const handleHighlightPaletteColorClick = React.useCallback(
    (nextColor: string) => {
      if (selectionHasMatchingInlineStyle(editorRef.current, 'backgroundColor', nextColor)) {
        applyHighlightColor('#ffffff');
        return;
      }

      applyHighlightColor(nextColor);
    },
    [applyHighlightColor],
  );

  const insertNode = React.useCallback(
    (node: HTMLElement, options?: { sync?: boolean; refreshToolbar?: boolean }) => {
      const shouldSync = options?.sync ?? true;
      const shouldRefreshToolbar = options?.refreshToolbar ?? true;

      focusEditor();
      ensureEditableBlock();
      restoreSelection();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        editorRef.current?.appendChild(node);
        if (shouldSync) {
          syncContent();
        }
        return node;
      }

      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(node);

      const afterRange = document.createRange();
      afterRange.setStartAfter(node);
      afterRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(afterRange);
      savedRangeRef.current = afterRange.cloneRange();

      if (shouldSync) {
        syncContent();
      }
      if (shouldRefreshToolbar) {
        refreshToolbarState();
      }
      return node;
    },
    [ensureEditableBlock, focusEditor, refreshToolbarState, restoreSelection, syncContent],
  );

  const uploadImageFile = React.useCallback(
    async (file: File) => {
      try {
        setIsUploadingImage(true);
        setMediaUploadProgress(0);
        setMediaUploadStatus('Preparing upload...');
        const placeholder = insertNode(createUploadingMediaPlaceholder('image', file.name, showUploadPlaceholder), {
          sync: false,
        }) as HTMLDivElement;

        if (onImageUpload) {
          const uploadedImage = await onImageUpload(file, {
            onProgress: setMediaUploadProgress,
            onStatusChange: setMediaUploadStatus,
          });
          const image = document.createElement('img');
          image.src = uploadedImage.src;
          image.alt = uploadedImage.alt || file.name || 'Uploaded image';

          const wrapper = createResizableMediaWrapper(image, 'image');
          applyUploadedImageMetadata(wrapper, image, uploadedImage);
          replaceUploadPlaceholder(placeholder, wrapper);
          syncContent();
          return true;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const image = document.createElement('img');
          image.src = String(reader.result || '');
          image.alt = file.name || 'Uploaded image';

          const wrapper = createResizableMediaWrapper(image, 'image');
          replaceUploadPlaceholder(placeholder, wrapper);
          syncContent();
        };
        reader.onerror = () => {
          removeUploadPlaceholder(placeholder);
          syncContent();
        };
        reader.readAsDataURL(file);
        return true;
      } catch (error) {
        removeUploadPlaceholderFromEditor(editorRef.current);
        syncContent();
        onImageUploadError?.(error);
        if (!onImageUploadError) {
          console.error('Failed to upload image', error);
        }
        return false;
      } finally {
        setIsUploadingImage(false);
      }
    },
    [insertNode, onImageUpload, onImageUploadError, syncContent],
  );

  const handleImageUpload = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPendingMediaUpload((current) => {
      if (current) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return { file, kind: 'image', previewUrl };
    });
  }, []);

  const submitVideo = React.useCallback(() => {
    if (!videoUrl.trim()) return;

    const embedUrl = toEmbedUrl(videoUrl.trim());
    if (embedUrl.type === 'iframe') {
      const iframe = document.createElement('iframe');
      iframe.src = embedUrl.url;
      iframe.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.title = 'Embedded video';
      insertNode(createResizableMediaWrapper(iframe, 'video'));
    } else {
      const video = createPlayableVideo(embedUrl.url);
      insertNode(createResizableMediaWrapper(video, 'video'));
    }

    setVideoUrl('');
    setIsVideoDialogOpen(false);
  }, [insertNode, videoUrl]);

  const uploadVideoFile = React.useCallback(
    async (file: File) => {
      try {
        setIsUploadingVideo(true);
        setMediaUploadProgress(0);
        setMediaUploadStatus('Preparing upload...');
        const placeholder = insertNode(createUploadingMediaPlaceholder('video', file.name, showUploadPlaceholder), {
          sync: false,
        }) as HTMLDivElement;

        if (onVideoUpload) {
          const uploadedVideo = await onVideoUpload(file, {
            onProgress: setMediaUploadProgress,
            onStatusChange: setMediaUploadStatus,
          });
          const video = createPlayableVideo(uploadedVideo.src, uploadedVideo.type || file.type || 'video/mp4');

          if (uploadedVideo.poster) {
            video.poster = uploadedVideo.poster;
          }

          const wrapper = createResizableMediaWrapper(video, 'video');
          applyUploadedVideoMetadata(wrapper, video, uploadedVideo);
          video.load();
          replaceUploadPlaceholder(placeholder, wrapper);
          syncContent();
          return true;
        }

        const objectUrl = URL.createObjectURL(file);
        const video = createPlayableVideo(objectUrl, file.type || 'video/mp4');
        const wrapper = createResizableMediaWrapper(video, 'video');
        wrapper.dataset.objectUrl = objectUrl;
        video.dataset.objectUrl = objectUrl;
        video.load();
        replaceUploadPlaceholder(placeholder, wrapper);
        syncContent();
        return true;
      } catch (error) {
        removeUploadPlaceholderFromEditor(editorRef.current);
        syncContent();
        onVideoUploadError?.(error);
        if (!onVideoUploadError) {
          console.error('Failed to upload video', error);
        }
        return false;
      } finally {
        setIsUploadingVideo(false);
      }
    },
    [insertNode, onVideoUpload, onVideoUploadError, syncContent],
  );

  const handleVideoUpload = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPendingMediaUpload((current) => {
      if (current) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return { file, kind: 'video', previewUrl };
    });
  }, []);

  const deleteMediaWrapper = React.useCallback(
    async (wrapper: HTMLDivElement) => {
      const mediaId = wrapper.dataset.mediaId || null;
      const mediaKind: 'image' | 'video' = wrapper.querySelector('video, iframe') ? 'video' : 'image';
      const fileId =
        wrapper.dataset.fileId ||
        (wrapper.querySelector('img, video') as HTMLElement | null)?.dataset.fileId ||
        '';

      if (fileId && deletingMediaIds.has(fileId)) return;

      if (onMediaDeleteConfirm) {
        const shouldDelete = await onMediaDeleteConfirm(mediaKind);
        if (!shouldDelete) return;
      }

      if (fileId) {
        setDeletingMediaIds((current) => {
          const next = new Set(current);
          next.add(fileId);
          return next;
        });
      }

      const parent = wrapper.parentElement;
      const nextSibling = wrapper.nextSibling;

      try {
        if (mediaId && selectedMediaId === mediaId) {
          clearSelectedMediaWrapper(selectedMediaWrapperRef, setSelectedMediaId);
        }

        wrapper.remove();
        syncContent();

        if (fileId && onMediaDelete) {
          await onMediaDelete(fileId);
        }
      } catch (error) {
        if (parent) {
          parent.insertBefore(wrapper, nextSibling);
          decorateEditableMediaWrappers(parent);
        }
        syncContent();
        onMediaDeleteError?.(error);
        if (!onMediaDeleteError) {
          console.error('Failed to delete media', error);
        }
      } finally {
        if (fileId) {
          setDeletingMediaIds((current) => {
            const next = new Set(current);
            next.delete(fileId);
            return next;
          });
        }
      }
    },
    [
      deletingMediaIds,
      onMediaDelete,
      onMediaDeleteConfirm,
      onMediaDeleteError,
      selectedMediaId,
      syncContent,
    ],
  );

  const handleEditorClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      const deleteButton = target?.closest('[data-rich-text-media-delete]') as HTMLButtonElement | null;
      if (deleteButton) {
        event.preventDefault();
        event.stopPropagation();

        const wrapper = deleteButton.closest('[data-rich-text-media-wrapper]') as HTMLDivElement | null;
        if (!wrapper) return;

        void deleteMediaWrapper(wrapper);
        return;
      }

      const mediaWrapper = target?.closest('[data-rich-text-media-wrapper]') as HTMLDivElement | null;
      if (mediaWrapper) {
        return;
      }

      clearSelectedMediaWrapper(selectedMediaWrapperRef, setSelectedMediaId);
      refreshToolbarState();
    },
    [deleteMediaWrapper, refreshToolbarState],
  );

  const handleEditorMouseDown = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const deleteButton = target.closest('[data-rich-text-media-delete]') as HTMLButtonElement | null;
      if (deleteButton) return;

      const mediaWrapper = target.closest('[data-rich-text-media-wrapper]') as HTMLDivElement | null;
      if (!mediaWrapper) return;

      const isAlreadySelected = selectedMediaWrapperRef.current === mediaWrapper;
      if (isAlreadySelected) return;

      event.preventDefault();
      event.stopPropagation();
      setSelectedMediaWrapper(selectedMediaWrapperRef, mediaWrapper, setSelectedMediaId);
      refreshToolbarState();
    },
    [refreshToolbarState],
  );

  const handleEditorKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Backspace' && event.key !== 'Delete') return;

      if (shouldPreventMediaKeyboardDeletion(editorRef.current, event.key)) {
        event.preventDefault();
        event.stopPropagation();
        captureSelection();
      }
    },
    [captureSelection],
  );

  const closePendingMediaDialog = React.useCallback(() => {
    setPendingMediaUpload((current) => {
      if (current) {
        URL.revokeObjectURL(current.previewUrl);
      }
      setMediaUploadProgress(0);
      setMediaUploadStatus('');
      return null;
    });
  }, []);

  const confirmPendingMediaUpload = React.useCallback(async () => {
    const pendingUpload = pendingMediaUpload;
    if (!pendingUpload) return;

    const wasUploaded =
      pendingUpload.kind === 'image'
        ? await uploadImageFile(pendingUpload.file)
        : await uploadVideoFile(pendingUpload.file);

    if (wasUploaded) {
      closePendingMediaDialog();
    }
  }, [closePendingMediaDialog, pendingMediaUpload, uploadImageFile, uploadVideoFile]);

  const insertTable = React.useCallback(() => {
    const rows = clampCount(tableRows, 1, 8);
    const columns = clampCount(tableColumns, 1, 6);
    const table = document.createElement('table');
    table.style.borderSpacing = '0';
    table.style.borderCollapse = 'separate';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
      const cell = document.createElement('th');
      cell.style.border = TABLE_BORDER_STYLE;
      cell.textContent = `Column ${columnIndex + 1}`;
      headRow.appendChild(cell);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
      const row = document.createElement('tr');
      for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
        const cell = document.createElement('td');
        cell.style.border = TABLE_BORDER_STYLE;
        cell.innerHTML = '&nbsp;';
        row.appendChild(cell);
      }
      tbody.appendChild(row);
    }
    table.appendChild(tbody);

    const wrapper = document.createElement('div');
    wrapper.className = 'overflow-x-auto';
    wrapper.setAttribute('data-rich-text-table-wrapper', 'true');
    wrapper.style.border = TABLE_BORDER_STYLE;
    wrapper.style.borderRadius = '0.75rem';
    wrapper.appendChild(table);

    insertNode(wrapper);
    setIsTableDialogOpen(false);
  }, [insertNode, tableColumns, tableRows]);

  const mutateTable = React.useCallback(
    (mutation: 'add-row' | 'remove-row' | 'add-column' | 'remove-column' | 'delete-table') => {
      const table = getSelectedTable(editorRef.current);
      if (!table) return;
      const wrapper = table.closest('[data-rich-text-table-wrapper]') as HTMLDivElement | null;
      if (wrapper) {
        wrapper.style.border = TABLE_BORDER_STYLE;
        wrapper.style.borderRadius = '0.75rem';
      }

      if (mutation === 'delete-table') {
        table.remove();
        syncContent();
        return;
      }

      if (mutation === 'add-row') {
        const columnCount = table.rows[0]?.cells.length || 1;
        const row = table.insertRow(-1);
        for (let index = 0; index < columnCount; index += 1) {
          const cell = row.insertCell(-1);
          cell.style.border = TABLE_BORDER_STYLE;
          cell.innerHTML = '&nbsp;';
        }
      }

      if (mutation === 'remove-row' && table.rows.length > 2) {
        table.deleteRow(table.rows.length - 1);
      }

      if (mutation === 'add-column') {
        Array.from(table.rows).forEach((row, index) => {
          const cell = row.insertCell(-1);
          if (index === 0) {
            cell.outerHTML = `<th style="border:${TABLE_BORDER_STYLE}">New column</th>`;
          } else {
            cell.style.border = TABLE_BORDER_STYLE;
            cell.innerHTML = '&nbsp;';
          }
        });
      }

      if (mutation === 'remove-column') {
        Array.from(table.rows).forEach((row) => {
          if (row.cells.length > 1) row.deleteCell(row.cells.length - 1);
        });
      }

      syncContent();
      refreshToolbarState();
    },
    [refreshToolbarState, syncContent],
  );

  return (
    <div className={cn('flex min-h-0 flex-col space-y-3', className)}>
      <div
        className={cn(
          'relative flex min-w-0 rounded-2xl border border-border/80 bg-gradient-to-b from-muted/40 to-background shadow-sm',
          toolbarClassName,
        )}
      >
        <div
          className={cn(
            'pointer-events-none absolute left-0 inset-y-0 z-10 w-16 rounded-l-2xl transition-opacity duration-300',
            showToolbarLeftArrow ? 'opacity-100' : 'opacity-0',
          )}
          style={{ background: 'linear-gradient(to right, hsl(var(--background)) 40%, transparent)' }}
        />

        {showToolbarLeftArrow ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute left-1 top-1/2 z-20 h-8 w-8 -translate-y-1/2 rounded-full border border-primary/20 bg-white/95 text-primary shadow-[0_4px_12px_rgba(0,0,0,0.15)] backdrop-blur-sm transition-all active:scale-90 hover:bg-white"
            onClick={() => scrollToolbarBy(-220)}
            aria-label="Scroll toolbar left"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        ) : null}

        <div
          ref={toolbarScrollRef}
          className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide"
          onScroll={updateToolbarScrollState}
        >
          <div className="flex min-w-max flex-nowrap items-center gap-2 p-3">
            <ToolbarGroup className={getToolbarDisabledClass(isMediaSelected)}>
              <ToolbarButton
                isActive={activeFormats.bold}
                label="Bold"
                onMouseDown={(event) => {
                  event.preventDefault();
                  runCommand('bold');
                }}
              >
                <Bold className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                isActive={activeFormats.italic}
                label="Italic"
                onMouseDown={(event) => {
                  event.preventDefault();
                  runCommand('italic');
                }}
              >
                <Italic className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                isActive={activeFormats.underline}
                label="Underline"
                onMouseDown={(event) => {
                  event.preventDefault();
                  runCommand('underline');
                }}
              >
                <Underline className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                isActive={activeFormats.strikeThrough}
                label="Strike through"
                onMouseDown={(event) => {
                  event.preventDefault();
                  runCommand('strikeThrough');
                }}
              >
                <Strikethrough className="h-4 w-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup className={getToolbarDisabledClass(isMediaSelected)}>
              <Select
                value={activeFormats.blockType}
                onValueChange={(next) => applyBlockType(next as BlockType)}
                disabled={isMediaSelected}
              >
                <SelectTrigger className="h-9 w-[148px] rounded-lg border-border/80 bg-background text-xs font-medium">
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="p">
                    <div className="flex items-center gap-2">
                      <Pilcrow className="h-4 w-4" />
                      Paragraph
                    </div>
                  </SelectItem>
                  <SelectItem value="h1">
                    <div className="flex items-center gap-2">
                      <Heading1 className="h-4 w-4" />
                      Heading 1
                    </div>
                  </SelectItem>
                  <SelectItem value="h2">
                    <div className="flex items-center gap-2">
                      <Heading2 className="h-4 w-4" />
                      Heading 2
                    </div>
                  </SelectItem>
                  <SelectItem value="h3">
                    <div className="flex items-center gap-2">
                      <Heading3 className="h-4 w-4" />
                      Heading 3
                    </div>
                  </SelectItem>
                  <SelectItem value="h4">
                    <div className="flex items-center gap-2">
                      <Heading4 className="h-4 w-4" />
                      Heading 4
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={fontSize}
                disabled={isMediaSelected}
                onValueChange={(next) => {
                  setFontSize(next);
                  runCommand('fontSize', next);
                }}
              >
                <SelectTrigger className="h-9 w-[92px] rounded-lg border-border/80 bg-background text-xs font-medium">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ToolbarGroup>

            <ToolbarGroup>
              <ToolbarButton
                isActive={activeFormats.alignment === 'left'}
                label="Align left"
                onMouseDown={(event) => {
                  event.preventDefault();
                  applyAlignment('left');
                }}
              >
                <AlignLeft className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                isActive={activeFormats.alignment === 'center'}
                label="Align center"
                onMouseDown={(event) => {
                  event.preventDefault();
                  applyAlignment('center');
                }}
              >
                <AlignCenter className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                isActive={activeFormats.alignment === 'right'}
                label="Align right"
                onMouseDown={(event) => {
                  event.preventDefault();
                  applyAlignment('right');
                }}
              >
                <AlignRight className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                isActive={activeFormats.alignment === 'justify'}
                label="Justify"
                onMouseDown={(event) => {
                  event.preventDefault();
                  applyAlignment('justify');
                }}
              >
                <AlignJustify className="h-4 w-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup className={getToolbarDisabledClass(isMediaSelected)}>
              <ToolbarButton
                isActive={activeFormats.unorderedList}
                label="Bulleted list"
                onMouseDown={(event) => {
                  event.preventDefault();
                  runCommand('insertUnorderedList');
                }}
              >
                <List className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                isActive={activeFormats.orderedList}
                label="Numbered list"
                onMouseDown={(event) => {
                  event.preventDefault();
                  runCommand('insertOrderedList');
                }}
              >
                <ListOrdered className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                isActive={activeFormats.blockquote}
                label="Block quote"
                onMouseDown={(event) => {
                  event.preventDefault();
                  toggleBlockquote();
                }}
              >
                <Quote className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                label="Decrease indent"
                onMouseDown={(event) => {
                  event.preventDefault();
                  runCommand('outdent');
                }}
              >
                <IndentDecrease className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                label="Increase indent"
                onMouseDown={(event) => {
                  event.preventDefault();
                  runCommand('indent');
                }}
              >
                <IndentIncrease className="h-4 w-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup className={getToolbarDisabledClass(isMediaSelected)}>
              <ColorSwatchPicker
                label="Text color"
                icon={<ChevronDown className="h-3.5 w-3.5" />}
                value={textColor}
                palette={TEXT_COLORS}
                defaultColor="#000000"
                disabled={isMediaSelected}
                onPaletteColorClick={handleTextPaletteColorClick}
                onChange={applyTextColor}
              />
              <ColorSwatchPicker
                label="Highlight color"
                icon={<Highlighter className="h-4 w-4" />}
                value={highlightColor}
                palette={HIGHLIGHT_COLORS}
                defaultColor="#ffffff"
                disabled={isMediaSelected}
                onPaletteColorClick={handleHighlightPaletteColorClick}
                onChange={applyHighlightColor}
              />
            </ToolbarGroup>

            <ToolbarGroup className={getToolbarDisabledClass(isMediaSelected)}>
              <ToolbarButton
                label="Insert image"
                onMouseDown={(event) => {
                  event.preventDefault();
                  if (isUploadingImage) return;
                  captureSelection();
                  fileInputRef.current?.click();
                }}
              >
                <ImagePlus className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                label="Embed video"
                onMouseDown={(event) => {
                  event.preventDefault();
                  captureSelection();
                  setIsVideoDialogOpen(true);
                }}
              >
                <Video className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                label="Upload video"
                onMouseDown={(event) => {
                  event.preventDefault();
                  if (isUploadingVideo) return;
                  captureSelection();
                  videoFileInputRef.current?.click();
                }}
              >
                <Upload className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                label="Insert table"
                onMouseDown={(event) => {
                  event.preventDefault();
                  captureSelection();
                  setIsTableDialogOpen(true);
                }}
              >
                <Table2 className="h-4 w-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup className={getToolbarDisabledClass(isMediaSelected)}>
              <ToolbarButton
                label="Add table row"
                onMouseDown={(event) => {
                  event.preventDefault();
                  mutateTable('add-row');
                }}
              >
                <Rows3 className="h-4 w-4" />
                <Plus className="h-3 w-3" />
              </ToolbarButton>
              <ToolbarButton
                label="Remove table row"
                onMouseDown={(event) => {
                  event.preventDefault();
                  mutateTable('remove-row');
                }}
              >
                <Rows3 className="h-4 w-4" />
                <Minus className="h-3 w-3" />
              </ToolbarButton>
              <ToolbarButton
                label="Add table column"
                onMouseDown={(event) => {
                  event.preventDefault();
                  mutateTable('add-column');
                }}
              >
                <Columns3 className="h-4 w-4" />
                <Plus className="h-3 w-3" />
              </ToolbarButton>
              <ToolbarButton
                label="Remove table column"
                onMouseDown={(event) => {
                  event.preventDefault();
                  mutateTable('remove-column');
                }}
              >
                <Columns3 className="h-4 w-4" />
                <Minus className="h-3 w-3" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup className={getToolbarDisabledClass(isMediaSelected)}>
              <ToolbarButton
                label="Undo"
                onMouseDown={(event) => {
                  event.preventDefault();
                  runCommand('undo');
                }}
              >
                <Undo2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                label="Redo"
                onMouseDown={(event) => {
                  event.preventDefault();
                  runCommand('redo');
                }}
              >
                <Redo2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                label="Preview"
                onMouseDown={(event) => {
                  event.preventDefault();
                  setIsPreviewOpen(true);
                }}
              >
                <Eye className="h-4 w-4" />
              </ToolbarButton>
            </ToolbarGroup>

          </div>
        </div>

        {toolbarEndContent ? (
          <div className="z-20 flex shrink-0 items-center border-l border-border/70 bg-background/95 px-3">
            {toolbarEndContent}
          </div>
        ) : null}

        <div
          className={cn(
            'pointer-events-none absolute inset-y-0 z-10 w-16 transition-opacity duration-300',
            toolbarEndContent ? 'right-16' : 'right-0 rounded-r-2xl',
            showToolbarRightArrow ? 'opacity-100' : 'opacity-0',
          )}
          style={{ background: 'linear-gradient(to left, hsl(var(--background)) 40%, transparent)' }}
        />

        {showToolbarRightArrow ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'absolute top-1/2 z-20 h-8 w-8 -translate-y-1/2 rounded-full border border-primary/20 bg-white/95 text-primary shadow-[0_4px_12px_rgba(0,0,0,0.15)] backdrop-blur-sm transition-all active:scale-90 hover:bg-white',
              toolbarEndContent ? 'right-[4.25rem]' : 'right-1',
            )}
            onClick={() => scrollToolbarBy(220)}
            aria-label="Scroll toolbar right"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        ) : null}
      </div>

      <div className={cn('relative min-h-0 flex-1', editorWrapperClassName)}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncContent}
          onMouseDown={handleEditorMouseDown}
          onClick={handleEditorClick}
          onMouseUp={captureSelection}
          onKeyDown={handleEditorKeyDown}
          onKeyUp={captureSelection}
          onFocus={() => {
            setIsEditorFocused(true);
            ensureEditableBlock();
            refreshToolbarState();
          }}
          onBlur={() => {
            setIsEditorFocused(false);
            syncContent();
          }}
          className={cn(
            'overflow-y-auto rounded-2xl border border-border/80 bg-background px-4 py-3 shadow-sm outline-none ring-offset-background transition focus-within:ring-2 focus-within:ring-primary/25',
            editorHeightClassName,
            RICH_TEXT_CONTENT_CLASS,
            contentClassName,
            editorClassName,
          )}
        />
        {!isEditorFocused && !hasVisibleContent ? (
          <p className="pointer-events-none absolute left-4 top-3 text-sm text-muted-foreground">
            {placeholder}
          </p>
        ) : null}
      </div>

      {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
        disabled={isUploadingImage}
      />
      <input
        ref={videoFileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoUpload}
        disabled={isUploadingVideo}
      />

      <Dialog
        open={Boolean(pendingMediaUpload)}
        onOpenChange={(open) => {
          if (!open && !isUploadingPendingMedia) {
            closePendingMediaDialog();
          }
        }}
      >
        <DialogContent showClose={false} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {pendingMediaUpload?.kind === 'video' ? 'Preview Video' : 'Preview Image'}
            </DialogTitle>
          </DialogHeader>
          {pendingMediaUpload ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-none border border-border bg-muted/30">
                {pendingMediaUpload.kind === 'video' ? (
                  <video
                    className="max-h-[55vh] w-full bg-black"
                    controls
                    preload="metadata"
                    src={pendingMediaUpload.previewUrl}
                  />
                ) : (
                  <img
                    className="max-h-[55vh] w-full object-contain"
                    src={pendingMediaUpload.previewUrl}
                    alt={pendingMediaUpload.file.name || 'Selected image preview'}
                  />
                )}
              </div>
              <div className="rounded-lg border border-border bg-background px-3 py-2">
                <p className="truncate text-sm font-medium text-foreground">
                  {pendingMediaUpload.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pendingMediaUpload.file.type || 'Unknown type'} ·{' '}
                  {formatFileSize(pendingMediaUpload.file.size)}
                </p>
              </div>
              {isUploadingPendingMedia ? (
                <div className="space-y-2 rounded-lg border border-border bg-background px-3 py-3">
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{mediaUploadStatus || 'Uploading media...'}</span>
                    <span>{Math.round(mediaUploadProgress)}%</span>
                  </div>
                  <Progress value={mediaUploadProgress} className="h-2" />
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closePendingMediaDialog}
              disabled={isUploadingPendingMedia}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmPendingMediaUpload}
              disabled={!pendingMediaUpload || isUploadingPendingMedia}
            >
              {isUploadingPendingMedia ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Embed Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsVideoDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitVideo} disabled={!videoUrl.trim()}>
                Embed
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Table</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="table-rows">Rows</Label>
              <Input
                id="table-rows"
                value={tableRows}
                onChange={(event) => setTableRows(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table-columns">Columns</Label>
              <Input
                id="table-columns"
                value={tableColumns}
                onChange={(event) => setTableColumns(event.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsTableDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={insertTable}>Insert Table</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-border/80 bg-background p-6">
            {value && value.trim() !== '' ? (
              <RichTextContent html={value} className={contentClassName} />
            ) : (
              <p className="text-sm text-muted-foreground">{emptyPreviewText}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RichTextContentProps {
  html?: string | null;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!contentRef.current) return;
    prepareRenderedMedia(contentRef.current);
  }, [html]);

  return (
    <div
      ref={contentRef}
      className={cn(RICH_TEXT_CONTENT_CLASS, className)}
      dangerouslySetInnerHTML={{ __html: html || '' }}
    />
  );
}

function ToolbarGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex shrink-0 items-center gap-1 rounded-xl border border-border/70 bg-background/70 p-1', className)}>
      {children}
    </div>
  );
}

function ToolbarButton({
  children,
  isActive = false,
  label,
  onMouseDown,
}: {
  children: React.ReactNode;
  isActive?: boolean;
  label: string;
  onMouseDown: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(TOOLBAR_BUTTON_CLASS, isActive && 'border-primary/20 bg-primary/10 text-primary')}
      onMouseDown={onMouseDown}
      title={label}
      aria-label={label}
    >
      {children}
    </Button>
  );
}

function ColorSwatchPicker({
  icon,
  label,
  value,
  palette,
  defaultColor,
  disabled = false,
  onPaletteColorClick,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  palette: string[];
  defaultColor: string;
  disabled?: boolean;
  onPaletteColorClick?: (value: string) => void;
  onChange: (value: string) => void;
}) {
  const [draftValue, setDraftValue] = React.useState(value);
  const pickerState = React.useMemo(() => hexToHsv(normalizeHexColor(draftValue)), [draftValue]);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setDraftValue(value);
  }, [value]);

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        if (disabled) {
          setIsOpen(false);
          return;
        }
        setIsOpen(open);
        if (open) setDraftValue(value);
      }}
    >
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-border/80 bg-background px-2 py-1',
          disabled && 'pointer-events-none opacity-45 saturate-50',
        )}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          {palette.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                'h-5 w-5 rounded-full border transition-transform hover:scale-110',
                value === color ? 'border-foreground shadow-sm' : 'border-border',
              )}
              style={{ backgroundColor: color }}
              onMouseDown={(event) => {
                event.preventDefault();
                if (onPaletteColorClick) {
                  onPaletteColorClick(color);
                  return;
                }

                onChange(color);
              }}
              aria-label={`${label} ${color}`}
              title={color}
            />
          ))}
        </div>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`Expand ${label} picker`}
            title={`More ${label} options`}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-72 rounded-2xl border border-border/80 p-4" align="center">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">Pick a custom color or enter a hex code.</p>
            </div>
          </div>

          <div className="space-y-2">
            <InlineColorPicker
              hue={pickerState.h}
              saturation={pickerState.s}
              value={pickerState.v}
              onChange={(nextColor) => setDraftValue(nextColor)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Label
              htmlFor={`${label}-hex`}
              className="shrink-0 text-xs font-medium text-muted-foreground"
            >
              Hex Code :
            </Label>
            <Input
              id={`${label}-hex`}
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              placeholder="#3498db"
              className="h-9"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setDraftValue(defaultColor);
                onChange(defaultColor);
                setIsOpen(false);
              }}
            >
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const normalized = normalizeHexColor(draftValue);
                setDraftValue(normalized);
                onChange(normalized);
                setIsOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const getToolbarDisabledClass = (isDisabled: boolean) =>
  isDisabled ? 'pointer-events-none opacity-45 saturate-50 select-none' : '';

function InlineColorPicker({
  hue,
  saturation,
  value,
  onChange,
}: {
  hue: number;
  saturation: number;
  value: number;
  onChange: (value: string) => void;
}) {
  const paletteRef = React.useRef<HTMLDivElement | null>(null);

  const updateFromPalette = React.useCallback(
    (clientX: number, clientY: number) => {
      const palette = paletteRef.current;
      if (!palette) return;

      const rect = palette.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
      const nextSaturation = rect.width === 0 ? 0 : (x / rect.width) * 100;
      const nextValue = rect.height === 0 ? 0 : 100 - (y / rect.height) * 100;

      onChange(hsvToHex(hue, nextSaturation, nextValue));
    },
    [hue, onChange],
  );

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      updateFromPalette(event.clientX, event.clientY);

      const handleMove = (moveEvent: PointerEvent) => {
        updateFromPalette(moveEvent.clientX, moveEvent.clientY);
      };

      const handleUp = () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },
    [updateFromPalette],
  );

  return (
    <div className="space-y-3 rounded-2xl border border-border/80 bg-background p-3">
      <div
        ref={paletteRef}
        className="relative h-44 w-full cursor-crosshair overflow-hidden rounded-xl border border-border"
        style={{ backgroundColor: `hsl(${hue} 100% 50%)` }}
        onPointerDown={handlePointerDown}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_2px_rgba(0,0,0,0.45)]"
          style={{
            left: `${saturation}%`,
            top: `${100 - value}%`,
          }}
        />
      </div>

      <div className="flex items-center gap-3">
        <span
          className="h-10 w-10 shrink-0 rounded-full border border-border shadow-sm"
          style={{ backgroundColor: hsvToHex(hue, saturation, value) }}
        />
        <input
          type="range"
          min="0"
          max="360"
          value={hue}
          onChange={(event) => onChange(hsvToHex(Number(event.target.value), saturation, value))}
          className="h-3 w-full cursor-pointer appearance-none rounded-full border border-border"
          style={{
            background:
              'linear-gradient(90deg, #ff0000 0%, #ffff00 16%, #00ff00 33%, #00ffff 50%, #0000ff 66%, #ff00ff 83%, #ff0000 100%)',
          }}
          title="Hue"
        />
      </div>
    </div>
  );
}

const toHexColor = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith('#')) return normalized;

  const rgbMatch = normalized.match(/\d+/g);
  if (!rgbMatch || rgbMatch.length < 3) return '#0f172a';

  const [red, green, blue] = rgbMatch.slice(0, 3).map((part) => Number(part));
  return `#${[red, green, blue]
    .map((part) => Math.max(0, Math.min(255, part)).toString(16).padStart(2, '0'))
    .join('')}`;
};

const colorsMatch = (left: string, right: string) =>
  toHexColor(left).toLowerCase() === normalizeHexColor(right).toLowerCase();

const getElementFromNode = (node: Node | null) => {
  if (!node) return null;
  return node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
};

const elementHasMatchingInlineStyle = (
  element: Element | null,
  styleProperty: 'color' | 'backgroundColor',
  color: string,
) => {
  if (!(element instanceof HTMLElement)) return false;
  const styleValue = element.style[styleProperty];
  return Boolean(styleValue) && colorsMatch(styleValue, color);
};

const nodeOrAncestorHasMatchingInlineStyle = (
  node: Node | null,
  editor: HTMLDivElement,
  styleProperty: 'color' | 'backgroundColor',
  color: string,
) => {
  let element = getElementFromNode(node);

  while (element && editor.contains(element)) {
    if (elementHasMatchingInlineStyle(element, styleProperty, color)) return true;
    element = element.parentElement;
  }

  return false;
};

const selectionHasMatchingInlineStyle = (
  editor: HTMLDivElement | null,
  styleProperty: 'color' | 'backgroundColor',
  color: string,
) => {
  if (!editor) return false;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return false;

  if (
    nodeOrAncestorHasMatchingInlineStyle(range.startContainer, editor, styleProperty, color) ||
    nodeOrAncestorHasMatchingInlineStyle(range.endContainer, editor, styleProperty, color)
  ) {
    return true;
  }

  const fragment = range.cloneContents();
  const elements = Array.from(fragment.querySelectorAll('*'));
  return elements.some((element) => elementHasMatchingInlineStyle(element, styleProperty, color));
};

const hexToHsv = (hex: string) => {
  const normalized = normalizeHexColor(hex).replace('#', '');
  const red = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
  }

  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  return {
    h: hue,
    s: max === 0 ? 0 : (delta / max) * 100,
    v: max * 100,
  };
};

const hsvToHex = (hue: number, saturation: number, value: number) => {
  const s = saturation / 100;
  const v = value / 100;
  const chroma = v * s;
  const segment = hue / 60;
  const x = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = v - chroma;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment >= 0 && segment < 1) {
    red = chroma;
    green = x;
  } else if (segment >= 1 && segment < 2) {
    red = x;
    green = chroma;
  } else if (segment >= 2 && segment < 3) {
    green = chroma;
    blue = x;
  } else if (segment >= 3 && segment < 4) {
    green = x;
    blue = chroma;
  } else if (segment >= 4 && segment < 5) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  return `#${[red, green, blue]
    .map((channel) => Math.round((channel + match) * 255).toString(16).padStart(2, '0'))
    .join('')}`;
};

const getCurrentAlignment = (node?: HTMLElement | null): Alignment => {
  const alignedNode = node?.closest('[style*="text-align"]') as HTMLElement | null;
  const textAlign = alignedNode?.style.textAlign;

  if (textAlign === 'center') return 'center';
  if (textAlign === 'right') return 'right';
  if (textAlign === 'justify') return 'justify';
  return 'left';
};

const createResizableMediaWrapper = (
  media: HTMLImageElement | HTMLVideoElement | HTMLIFrameElement,
  kind: 'image' | 'video',
) => {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-rich-text-media-wrapper', kind);
  wrapper.dataset.mediaId = createMediaWrapperId();
  wrapper.contentEditable = 'false';
  wrapper.style.position = 'relative';
  wrapper.style.resize = 'both';
  wrapper.style.overflow = 'hidden';
  wrapper.style.width = kind === 'image' ? '320px' : '480px';
  wrapper.style.maxWidth = '100%';
  wrapper.style.minWidth = kind === 'image' ? '160px' : '280px';
  wrapper.style.minHeight = kind === 'image' ? '120px' : '180px';
  wrapper.style.aspectRatio = kind === 'image' ? '4 / 3' : '16 / 9';
  wrapper.style.display = 'block';
  wrapper.style.cursor = 'pointer';
  applyMediaAlignment(wrapper, 'left');

  media.setAttribute('draggable', 'false');
  media.style.width = '100%';
  media.style.height = '100%';
  media.style.display = 'block';
  media.style.cursor = 'pointer';

  if (media instanceof HTMLImageElement) {
    media.style.objectFit = 'contain';
  }

  if (media instanceof HTMLVideoElement) {
    media.controls = true;
    media.playsInline = true;
    media.preload = 'metadata';
  }

  if (media instanceof HTMLIFrameElement) {
    media.style.background = 'black';
  }

  wrapper.appendChild(media);
  appendMediaDeleteButton(wrapper);
  return wrapper;
};

const createUploadingMediaPlaceholder = (
  kind: 'image' | 'video',
  fileName?: string,
  isVisible = true,
) => {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-rich-text-upload-placeholder', kind);
  wrapper.contentEditable = 'false';
  wrapper.style.display = isVisible ? 'block' : 'none';

  if (!isVisible) {
    return wrapper;
  }

  wrapper.style.width = kind === 'image' ? '320px' : '480px';
  wrapper.style.maxWidth = '100%';
  wrapper.style.minWidth = kind === 'image' ? '160px' : '280px';
  wrapper.style.minHeight = kind === 'image' ? '120px' : '180px';
  wrapper.style.aspectRatio = kind === 'image' ? '4 / 3' : '16 / 9';
  wrapper.className =
    'my-4 overflow-hidden rounded-xl border border-border bg-muted/40 shadow-sm';

  const skeleton = document.createElement('div');
  skeleton.className = 'flex h-full w-full flex-col gap-4 p-4 animate-pulse';

  const header = document.createElement('div');
  header.className = 'flex items-center gap-3';

  const avatar = document.createElement('div');
  avatar.className = 'h-10 w-10 rounded-full bg-muted';

  const headerLines = document.createElement('div');
  headerLines.className = 'flex min-w-0 flex-1 flex-col gap-2';

  const lineOne = document.createElement('div');
  lineOne.className = 'h-3 w-1/3 rounded-full bg-muted';

  const lineTwo = document.createElement('div');
  lineTwo.className = 'h-3 w-2/3 rounded-full bg-muted';

  headerLines.append(lineOne, lineTwo);
  header.append(avatar, headerLines);

  const body = document.createElement('div');
  body.className = 'mt-auto flex flex-col gap-2';

  const bodyLineOne = document.createElement('div');
  bodyLineOne.className = 'h-3 w-full rounded-full bg-muted';

  const bodyLineTwo = document.createElement('div');
  bodyLineTwo.className = 'h-3 w-5/6 rounded-full bg-muted';

  const label = document.createElement('p');
  label.className = 'text-xs font-medium text-muted-foreground';
  label.textContent = `Uploading ${kind}${fileName ? `: ${fileName}` : '...'}`;

  body.append(label, bodyLineOne, bodyLineTwo);
  skeleton.append(header, body);
  wrapper.appendChild(skeleton);

  return wrapper;
};

const replaceUploadPlaceholder = (placeholder: HTMLDivElement, node: HTMLElement) => {
  if (placeholder.isConnected) {
    placeholder.replaceWith(node);
    return;
  }

  placeholder.remove();
};

const appendMediaDeleteButton = (wrapper: HTMLDivElement) => {
  if (wrapper.querySelector('[data-rich-text-media-delete]')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Delete';
  button.setAttribute('data-rich-text-media-delete', 'true');
  button.setAttribute('aria-label', 'Delete media');
  button.contentEditable = 'false';
  button.className =
    'absolute right-2 top-2 z-20 rounded-md bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground opacity-0 shadow-lg transition-opacity hover:bg-destructive/90 focus:opacity-100 group-hover/rich-text-media:opacity-100';

  wrapper.classList.add('group/rich-text-media');
  wrapper.appendChild(button);
};

const applyMediaAlignment = (wrapper: HTMLDivElement, alignment: MediaAlignment) => {
  wrapper.dataset.alignment = alignment;

  if (alignment === 'center') {
    wrapper.style.marginLeft = 'auto';
    wrapper.style.marginRight = 'auto';
    return;
  }

  if (alignment === 'right') {
    wrapper.style.marginLeft = 'auto';
    wrapper.style.marginRight = '0';
    return;
  }

  wrapper.style.marginLeft = '0';
  wrapper.style.marginRight = 'auto';
};

const applyMediaSelectionStyles = (wrapper: HTMLDivElement, isSelected: boolean) => {
  if (isSelected) {
    wrapper.dataset.selected = 'true';
    wrapper.style.borderColor = 'hsl(var(--primary))';
    wrapper.style.boxShadow = '0 0 0 2px hsl(var(--primary) / 0.25)';
    return;
  }

  wrapper.removeAttribute('data-selected');
  wrapper.style.borderColor = '';
  wrapper.style.boxShadow = '';
};

const setSelectedMediaWrapper = (
  selectedMediaWrapperRef: React.MutableRefObject<HTMLDivElement | null>,
  nextWrapper: HTMLDivElement,
  setSelectedMediaId: React.Dispatch<React.SetStateAction<string | null>>,
) => {
  if (selectedMediaWrapperRef.current && selectedMediaWrapperRef.current !== nextWrapper) {
    applyMediaSelectionStyles(selectedMediaWrapperRef.current, false);
  }

  selectedMediaWrapperRef.current = nextWrapper;
  applyMediaSelectionStyles(nextWrapper, true);
  setSelectedMediaId(nextWrapper.dataset.mediaId || null);
};

const clearSelectedMediaWrapper = (
  selectedMediaWrapperRef: React.MutableRefObject<HTMLDivElement | null>,
  setSelectedMediaId: React.Dispatch<React.SetStateAction<string | null>>,
) => {
  if (selectedMediaWrapperRef.current) {
    applyMediaSelectionStyles(selectedMediaWrapperRef.current, false);
  }

  selectedMediaWrapperRef.current = null;
  setSelectedMediaId(null);
};

const decorateEditableMediaWrappers = (root: ParentNode) => {
  root.querySelectorAll('[data-rich-text-media-wrapper]').forEach((node) => {
    const wrapper = node as HTMLDivElement;
    const media = wrapper.querySelector('img, video, iframe') as HTMLElement | null;
    const kind = wrapper.getAttribute('data-rich-text-media-wrapper');

    wrapper.contentEditable = 'false';
    wrapper.style.position = 'relative';
    wrapper.style.display = 'block';
    wrapper.style.resize = 'both';
    wrapper.style.overflow = 'hidden';
    wrapper.style.maxWidth = '100%';
    wrapper.style.minWidth = kind === 'image' ? '160px' : '280px';
    wrapper.style.minHeight = kind === 'image' ? '120px' : '180px';
    wrapper.style.cursor = 'pointer';
    if (!wrapper.dataset.mediaId) {
      wrapper.dataset.mediaId = createMediaWrapperId();
    }
    applyMediaAlignment(
      wrapper,
      (wrapper.dataset.alignment as MediaAlignment | undefined) || 'left',
    );

    if (media) {
      media.setAttribute('draggable', 'false');
      media.style.width = '100%';
      media.style.height = '100%';
      media.style.display = 'block';
      media.style.cursor = 'pointer';
    }

    if (media instanceof HTMLImageElement) {
      media.draggable = false;
      media.style.userSelect = 'none';
      media.style.setProperty('-webkit-user-drag', 'none');
      media.style.objectFit = 'contain';
    }

    if (media instanceof HTMLVideoElement) {
      media.controls = true;
      media.playsInline = true;
      media.preload = 'metadata';
    }

    if (media instanceof HTMLIFrameElement) {
      media.style.background = 'black';
    }

    appendMediaDeleteButton(wrapper);
  });
};

const removeMediaDeleteButtons = (root: ParentNode) => {
  root.querySelectorAll('[data-rich-text-media-delete]').forEach((node) => node.remove());
};

const removeUploadPlaceholders = (root: ParentNode) => {
  root.querySelectorAll('[data-rich-text-upload-placeholder]').forEach((node) => node.remove());
};

const removeUploadPlaceholder = (placeholder: HTMLDivElement) => {
  if (placeholder.isConnected) {
    placeholder.remove();
  }
};

const removeUploadPlaceholderFromEditor = (editor: HTMLDivElement | null) => {
  if (!editor) return;
  removeUploadPlaceholders(editor);
};

const shouldPreventMediaKeyboardDeletion = (
  editor: HTMLDivElement | null,
  key: 'Backspace' | 'Delete',
) => {
  if (!editor) return false;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return false;

  if (!range.collapsed) {
    return selectionRangeContainsMediaWrapper(range, editor);
  }

  const adjacentNode = getAdjacentDeletionCandidate(
    range.startContainer,
    range.startOffset,
    key === 'Backspace' ? 'backward' : 'forward',
    editor,
  );

  return Boolean(getClosestMediaWrapper(adjacentNode, editor));
};

const selectionRangeContainsMediaWrapper = (range: Range, editor: HTMLDivElement) => {
  return Array.from(editor.querySelectorAll('[data-rich-text-media-wrapper]')).some((node) => {
    try {
      return range.intersectsNode(node);
    } catch {
      return false;
    }
  });
};

const getAdjacentDeletionCandidate = (
  container: Node,
  offset: number,
  direction: 'backward' | 'forward',
  editor: HTMLDivElement,
): Node | null => {
  if (container.nodeType === Node.TEXT_NODE) {
    const text = container.textContent || '';
    if (direction === 'backward' && offset > 0) return null;
    if (direction === 'forward' && offset < text.length) return null;

    return direction === 'backward'
      ? getPreviousDeletionCandidate(container, editor)
      : getNextDeletionCandidate(container, editor);
  }

  if (container.nodeType !== Node.ELEMENT_NODE) return null;

  const element = container as Element;
  const childNodes = Array.from(element.childNodes);

  if (direction === 'backward') {
    if (offset > 0) {
      return getDeepestDeletionCandidate(childNodes[offset - 1], direction);
    }

    return getPreviousDeletionCandidate(element, editor);
  }

  if (offset < childNodes.length) {
    return getDeepestDeletionCandidate(childNodes[offset], direction);
  }

  return getNextDeletionCandidate(element, editor);
};

const getPreviousDeletionCandidate = (node: Node, editor: HTMLDivElement): Node | null => {
  let current: Node | null = node;

  while (current && current !== editor) {
    if (current.previousSibling) {
      return getDeepestDeletionCandidate(current.previousSibling, 'backward');
    }

    current = current.parentNode;
  }

  return null;
};

const getNextDeletionCandidate = (node: Node, editor: HTMLDivElement): Node | null => {
  let current: Node | null = node;

  while (current && current !== editor) {
    if (current.nextSibling) {
      return getDeepestDeletionCandidate(current.nextSibling, 'forward');
    }

    current = current.parentNode;
  }

  return null;
};

const getDeepestDeletionCandidate = (
  node: Node | undefined,
  direction: 'backward' | 'forward',
): Node | null => {
  if (!node) return null;

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    if (element.matches('[data-rich-text-media-wrapper]')) return element;

    const children = Array.from(element.childNodes);
    if (children.length > 0) {
      const nextNode = direction === 'backward' ? children[children.length - 1] : children[0];
      return getDeepestDeletionCandidate(nextNode, direction);
    }
  }

  return node;
};

const getClosestMediaWrapper = (node: Node | null, editor: HTMLDivElement) => {
  if (!node) return null;

  const element =
    node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  const wrapper = element?.closest('[data-rich-text-media-wrapper]') as HTMLDivElement | null;

  return wrapper && editor.contains(wrapper) ? wrapper : null;
};

const createMediaWrapperId = () => `media-${Math.random().toString(36).slice(2, 10)}`;

const getSanitizedEditorHtml = (editor: HTMLDivElement) => {
  const sanitizedEditor = editor.cloneNode(true) as HTMLDivElement;
  removeUploadPlaceholders(sanitizedEditor);
  removeMediaDeleteButtons(sanitizedEditor);
  sanitizedEditor.querySelectorAll('[data-rich-text-media-wrapper]').forEach((node) => {
    applyMediaSelectionStyles(node as HTMLDivElement, false);
  });
  return sanitizedEditor.innerHTML || '';
};

const createPlayableVideo = (src: string, type?: string) => {
  const video = document.createElement('video');
  video.controls = true;
  video.playsInline = true;
  video.preload = 'metadata';

  const source = document.createElement('source');
  source.src = src;
  if (type) source.type = type;

  video.appendChild(source);
  video.src = src;
  return video;
};

const applyUploadedVideoMetadata = (
  wrapper: HTMLDivElement,
  video: HTMLVideoElement,
  uploadedVideo: RichTextUploadedVideo,
) => {
  if (uploadedVideo.fileId) {
    wrapper.dataset.fileId = uploadedVideo.fileId;
    video.dataset.fileId = uploadedVideo.fileId;
  }

  if (uploadedVideo.width && uploadedVideo.width > 0) {
    wrapper.style.width = `${uploadedVideo.width}px`;
    wrapper.dataset.width = String(uploadedVideo.width);
    video.setAttribute('width', String(uploadedVideo.width));
  }

  if (uploadedVideo.height && uploadedVideo.height > 0) {
    wrapper.style.height = `${uploadedVideo.height}px`;
    wrapper.dataset.height = String(uploadedVideo.height);
    video.setAttribute('height', String(uploadedVideo.height));
  }

  if (uploadedVideo.width && uploadedVideo.height) {
    wrapper.style.aspectRatio = `${uploadedVideo.width} / ${uploadedVideo.height}`;
  }

  if (uploadedVideo.poster) {
    wrapper.dataset.poster = uploadedVideo.poster;
    video.poster = uploadedVideo.poster;
  }
};

const applyUploadedImageMetadata = (
  wrapper: HTMLDivElement,
  image: HTMLImageElement,
  uploadedImage: RichTextUploadedImage,
) => {
  if (uploadedImage.fileId) {
    wrapper.dataset.fileId = uploadedImage.fileId;
    image.dataset.fileId = uploadedImage.fileId;
  }

  if (uploadedImage.width && uploadedImage.width > 0) {
    wrapper.style.width = `${uploadedImage.width}px`;
    wrapper.dataset.width = String(uploadedImage.width);
    image.setAttribute('width', String(uploadedImage.width));
  }

  if (uploadedImage.height && uploadedImage.height > 0) {
    wrapper.style.height = `${uploadedImage.height}px`;
    wrapper.dataset.height = String(uploadedImage.height);
    image.setAttribute('height', String(uploadedImage.height));
  }

  if (uploadedImage.width && uploadedImage.height) {
    wrapper.style.aspectRatio = `${uploadedImage.width} / ${uploadedImage.height}`;
  }
};

const parsePositiveDimension = (value?: string | null) => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getPersistedMediaDimensions = (wrapper: HTMLDivElement, media: HTMLElement | null) => {
  const mediaWidth =
    media instanceof HTMLImageElement || media instanceof HTMLVideoElement
      ? parsePositiveDimension(media.getAttribute('width'))
      : null;
  const mediaHeight =
    media instanceof HTMLImageElement || media instanceof HTMLVideoElement
      ? parsePositiveDimension(media.getAttribute('height'))
      : null;

  return {
    savedWidth:
      parsePositiveDimension(wrapper.dataset.width) ||
      parsePositiveDimension(wrapper.style.width) ||
      mediaWidth,
    savedHeight:
      parsePositiveDimension(wrapper.dataset.height) ||
      parsePositiveDimension(wrapper.style.height) ||
      mediaHeight,
  };
};

const applyPersistedMediaDimensions = (wrapper: HTMLDivElement, media: HTMLElement | null) => {
  const { savedWidth, savedHeight } = getPersistedMediaDimensions(wrapper, media);

  if (savedWidth) {
    wrapper.dataset.width = String(savedWidth);
    wrapper.style.width = `${savedWidth}px`;
  }

  if (savedHeight) {
    wrapper.dataset.height = String(savedHeight);
    wrapper.style.height = `${savedHeight}px`;
  }

  if (savedWidth && savedHeight) {
    wrapper.style.aspectRatio = `${savedWidth} / ${savedHeight}`;
  }

  if (media instanceof HTMLImageElement || media instanceof HTMLVideoElement) {
    if (savedWidth) {
      media.setAttribute('width', String(savedWidth));
    }
    if (savedHeight) {
      media.setAttribute('height', String(savedHeight));
    }
  }
};

const restorePersistedMediaWrappers = (root: ParentNode) => {
  root.querySelectorAll('[data-rich-text-media-wrapper]').forEach((node) => {
    const wrapper = node as HTMLDivElement;
    const media = wrapper.querySelector('img, video, iframe') as HTMLElement | null;
    applyPersistedMediaDimensions(wrapper, media);
  });
};

const normalizeMediaWrappers = (root: ParentNode) => {
  let hasChanges = false;

  root.querySelectorAll('[data-rich-text-media-wrapper]').forEach((node) => {
    const wrapper = node as HTMLDivElement;
    const media = wrapper.querySelector('img, video, iframe') as HTMLElement | null;
    const width = Math.round(wrapper.getBoundingClientRect().width);
    const height = Math.round(wrapper.getBoundingClientRect().height);

    if (width > 0) {
      const nextWidth = String(width);
      if (wrapper.dataset.width !== nextWidth || wrapper.style.width !== `${width}px`) {
        hasChanges = true;
      }
      wrapper.dataset.width = nextWidth;
      wrapper.style.width = `${width}px`;
    }

    if (height > 0) {
      const nextHeight = String(height);
      if (wrapper.dataset.height !== nextHeight || wrapper.style.height !== `${height}px`) {
        hasChanges = true;
      }
      wrapper.dataset.height = nextHeight;
      wrapper.style.height = `${height}px`;
    }

    if (width > 0 && height > 0) {
      const nextAspectRatio = `${width} / ${height}`;
      if (wrapper.style.aspectRatio !== nextAspectRatio) {
        hasChanges = true;
      }
      wrapper.style.aspectRatio = nextAspectRatio;
    }

    if (media instanceof HTMLImageElement || media instanceof HTMLVideoElement) {
      if (width > 0) {
        const nextWidth = String(width);
        if (media.getAttribute('width') !== nextWidth) {
          hasChanges = true;
        }
        media.setAttribute('width', nextWidth);
      }
      if (height > 0) {
        const nextHeight = String(height);
        if (media.getAttribute('height') !== nextHeight) {
          hasChanges = true;
        }
        media.setAttribute('height', nextHeight);
      }
    }
  });

  return hasChanges;
};

const prepareRenderedMedia = (root: ParentNode) => {
  removeMediaDeleteButtons(root);

  root.querySelectorAll('[data-rich-text-media-wrapper]').forEach((node) => {
    const wrapper = node as HTMLDivElement;
    wrapper.removeAttribute('contenteditable');
    applyMediaSelectionStyles(wrapper, false);
    wrapper.style.resize = 'none';
    wrapper.style.overflow = 'visible';
    wrapper.style.maxWidth = '100%';

    const media = wrapper.querySelector('img, video, iframe') as HTMLElement | null;
    applyPersistedMediaDimensions(wrapper, media);
    if (!media) return;

    media.setAttribute('draggable', 'false');
    media.style.width = '100%';
    media.style.height = '100%';
    media.style.display = 'block';

    if (media instanceof HTMLImageElement) {
      media.draggable = false;
      media.style.userSelect = 'none';
      media.style.setProperty('-webkit-user-drag', 'none');
      media.style.objectFit = 'contain';
    }

    if (media instanceof HTMLVideoElement) {
      media.controls = true;
      media.playsInline = true;
      media.preload = 'metadata';
    }
  });

  root.querySelectorAll('img').forEach((node) => {
    const image = node as HTMLImageElement;
    image.draggable = false;
    image.setAttribute('draggable', 'false');
    image.style.userSelect = 'none';
    image.style.setProperty('-webkit-user-drag', 'none');
  });
};

const getSelectedTable = (editor: HTMLDivElement | null) => {
  const selection = window.getSelection();
  const node =
    selection?.anchorNode?.nodeType === Node.ELEMENT_NODE
      ? (selection.anchorNode as HTMLElement)
      : selection?.anchorNode?.parentElement;

  const table = node?.closest('table');
  if (!table || !editor?.contains(table)) return null;
  return table as HTMLTableElement;
};

const clampCount = (value: string, min: number, max: number) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.max(min, Math.min(max, parsed));
};

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
};

const normalizeHexColor = (value: string) => {
  const trimmed = value.trim();
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash : '#000000';
};

const toEmbedUrl = (rawUrl: string): { type: 'iframe' | 'video'; url: string } => {
  try {
    const url = new URL(rawUrl);

    if (url.hostname.includes('youtube.com')) {
      const videoId = url.searchParams.get('v');
      return { type: 'iframe', url: `https://www.youtube.com/embed/${videoId}` };
    }

    if (url.hostname.includes('youtu.be')) {
      return { type: 'iframe', url: `https://www.youtube.com/embed${url.pathname}` };
    }

    if (url.hostname.includes('vimeo.com')) {
      return { type: 'iframe', url: `https://player.vimeo.com/video${url.pathname}` };
    }
  } catch {
    return { type: 'video', url: rawUrl };
  }

  return { type: 'video', url: rawUrl };
};

export const hasMeaningfulContent = (html: string | null | undefined) => {
  if (!html) return false;

  const normalized = html
    .replace(/<br\s*\/?>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/<div>\s*<\/div>/gi, '')
    .trim();

  if (normalized === '') return false;

  if (typeof document === 'undefined') {
    return normalized.replace(/<[^>]+>/g, '').trim().length > 0;
  }

  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent?.replace(/\u00a0/g, ' ').trim().length > 0 || /<(img|video|iframe|table)\b/i.test(html);
};
