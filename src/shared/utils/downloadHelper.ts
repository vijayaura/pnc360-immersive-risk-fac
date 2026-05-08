/**
 * Utility function to handle document downloads, including presigned URLs
 */

export interface PresignedUrlResponse {
  message?: string;
  presigned_url: string;
  presigned_expires_in_seconds?: number;
}

/**
 * Handles document download, supporting both direct URLs and presigned URL responses
 * @param url - Either a direct URL or a JSON string containing presigned URL response
 * @param filename - The filename for the download
 */
export const handleDocumentDownload = async (url: string, filename: string): Promise<void> => {
  try {
    console.log('handleDocumentDownload - Input URL:', url);
    console.log('handleDocumentDownload - Input filename:', filename);
    
    let downloadUrl = url;
    
    // Check if the URL is a presigned URL response (JSON string)
    if (url.includes('presigned_url') || url.startsWith('{')) {
      console.log('handleDocumentDownload - Detected presigned URL response, parsing...');
      try {
        const response: PresignedUrlResponse = JSON.parse(url);
        console.log('handleDocumentDownload - Parsed response:', response);
        if (response.presigned_url) {
          downloadUrl = response.presigned_url;
          console.log('handleDocumentDownload - Using presigned URL for download:', downloadUrl);
        } else {
          throw new Error('No presigned_url found in response');
        }
      } catch (parseError) {
        console.warn('handleDocumentDownload - Could not parse URL as JSON, using as direct URL:', parseError);
        // If parsing fails, use the original URL
      }
    } else if (url.includes('/api/v1/documents/download') || url.includes('car-api.stg.aurainsuretech.com')) {
      // This is an API endpoint that returns presigned URL JSON, fetch it first
      console.log('handleDocumentDownload - Detected API endpoint, fetching presigned URL...');
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: PresignedUrlResponse = await response.json();
        console.log('handleDocumentDownload - Fetched presigned URL response:', data);
        
        if (data.presigned_url) {
          downloadUrl = data.presigned_url;
          console.log('handleDocumentDownload - Using fetched presigned URL for download:', downloadUrl);
        } else {
          throw new Error('No presigned_url found in API response');
        }
      } catch (fetchError) {
        console.error('handleDocumentDownload - Error fetching presigned URL:', fetchError);
        throw new Error(`Failed to fetch download URL: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }
    } else {
      console.log('handleDocumentDownload - Using direct URL:', downloadUrl);
    }
    
    // Validate the download URL
    if (!downloadUrl || downloadUrl.trim() === '') {
      throw new Error('Invalid download URL');
    }
    
    // Create download link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer'; // Security best practice
    
    console.log('handleDocumentDownload - Created link with href:', link.href);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`handleDocumentDownload - Download initiated for: ${filename}`);
  } catch (error) {
    console.error('handleDocumentDownload - Error:', error);
    throw new Error(`Failed to download document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Checks if a URL string is a presigned URL response
 * @param url - The URL string to check
 * @returns true if it appears to be a presigned URL response
 */
export const isPresignedUrlResponse = (url: string): boolean => {
  return url.includes('presigned_url') || url.startsWith('{');
};

/**
 * Extracts the actual download URL from a presigned URL response
 * @param url - The URL string (either direct URL or presigned URL response)
 * @returns The actual download URL
 */
export const extractDownloadUrl = (url: string): string => {
  if (isPresignedUrlResponse(url)) {
    try {
      const response: PresignedUrlResponse = JSON.parse(url);
      return response.presigned_url || url;
    } catch {
      return url;
    }
  }
  return url;
};
