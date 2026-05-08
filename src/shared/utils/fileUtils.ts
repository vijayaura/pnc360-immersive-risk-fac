/**
 * Format bytes to human-readable file size
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string (e.g., "1.5 MB", "500 KB")
 */
export function formatFileSize(bytes: number | null | undefined, decimals: number = 2): string {
    if (bytes === null || bytes === undefined || bytes === 0) {
        return '0 Bytes';
    }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Get file size from File object or number
 * @param file - File object or size in bytes
 * @returns File size in bytes or null
 */
export function getFileSize(file: File | number | null | undefined): number | null {
    if (file === null || file === undefined) {
        return null;
    }

    if (typeof file === 'number') {
        return file;
    }

    if (file instanceof File) {
        return file.size;
    }

    return null;
}

export const MAX_CHAT_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_CHAT_FILE_SIZE_LABEL = '10MB';

const ALLOWED_CHAT_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const CHAT_FILE_ACCEPT = 'application/pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx';

export function validateChatFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_CHAT_MIME_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
        return { valid: false, error: `${file.name} is not a supported file type. Allowed: PDF, Images, Excel (.xlsx)` };
    }
    if (file.size > MAX_CHAT_FILE_SIZE_BYTES) {
        return { valid: false, error: `${file.name} exceeds ${MAX_CHAT_FILE_SIZE_LABEL}. Please upload a smaller file.` };
    }
    return { valid: true };
}

/**
 * Download a chat attachment via the backend download endpoint.
 * The backend returns a presigned S3 URL with Content-Disposition: attachment,
 * which forces the browser to download instead of displaying the file.
 */
export const downloadChatAttachment = async (referralId: string, attachmentId: string) => {
    try {
        const { api } = await import('@/lib/api/client');
        const response = await api.get<{ downloadUrl: string }>(
            `/referrals/${encodeURIComponent(referralId)}/chat/attachments/${encodeURIComponent(attachmentId)}/download`,
        );
        const downloadUrl = response.data.downloadUrl;
        const anchor = document.createElement('a');
        anchor.style.display = 'none';
        anchor.href = downloadUrl;
        anchor.download = '';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    } catch (error) {
        console.error('[downloadChatAttachment] Failed for referralId:', referralId, 'attachmentId:', attachmentId, error);
    }
};

export const handleDirectDownload = async (url: string, fileName?: string) => {
    const name = fileName || 'document';
    const isAbsoluteUrl = url.startsWith('http://') || url.startsWith('https://');

    const triggerDownload = (blob: Blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.style.display = 'none';
        anchor.href = blobUrl;
        anchor.download = name;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    };

    // For absolute URLs (S3/Azure presigned), fetch directly — no auth needed
    if (isAbsoluteUrl) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
            triggerDownload(await response.blob());
            return;
        } catch (error) {
            console.error('[handleDirectDownload] Direct fetch failed', error);
            window.open(url, '_blank');
            return;
        }
    }

    // For relative API paths, use the Axios client (has auth token)
    try {
        const { api } = await import('@/lib/api/client');
        const response = await api.get(url, { responseType: 'blob' });
        triggerDownload(response.data);
    } catch (error) {
        console.error('[handleDirectDownload] Axios download failed', error);
        window.open(url, '_blank');
    }
};
