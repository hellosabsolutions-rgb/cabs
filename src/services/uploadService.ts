import { api } from './api';

export interface UploadResult {
  success: boolean;
  url: string;
  public_id?: string;
  format?: string;
  resource_type?: string;
  bytes?: number;
  error?: string;
}

/**
 * Upload a single file (image, PDF, etc.) to Cloudinary via backend /api/upload endpoint.
 *
 * @param file - The File or Blob to upload
 * @param folder - Cloudinary target folder (e.g. 'fleetos/vehicles', 'fleetos/compliance', 'fleetos/receipts')
 * @returns UploadResult containing the secure Cloudinary HTTPS URL
 */
export const uploadFileToCloudinary = async (
  file: File | Blob,
  folder: string = 'fleetos/documents'
): Promise<UploadResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const token = localStorage.getItem('fleetos_auth_token') || localStorage.getItem('token');

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to upload file to Cloudinary');
    }

    return {
      success: true,
      url: data.url || data.data?.secure_url,
      public_id: data.data?.public_id,
      format: data.data?.format,
      resource_type: data.data?.resource_type,
      bytes: data.data?.bytes
    };
  } catch (err: any) {
    console.error('❌ [UploadService] Error uploading file:', err);
    return {
      success: false,
      url: '',
      error: err.message || 'Upload failed'
    };
  }
};

/**
 * Upload a Base64 string (data URI) to Cloudinary via backend.
 *
 * @param base64 - The data URI string (e.g. "data:image/jpeg;base64,..." or "data:application/pdf;base64,...")
 * @param folder - Cloudinary target folder
 * @returns UploadResult containing the secure Cloudinary HTTPS URL
 */
export const uploadBase64ToCloudinary = async (
  base64: string,
  folder: string = 'fleetos/documents'
): Promise<UploadResult> => {
  try {
    const res = await api.post<{
      success: boolean;
      url: string;
      data?: any;
      error?: string;
    }>('/upload', {
      file: base64,
      folder
    });

    if (!res.success) {
      throw new Error(res.error || 'Failed to upload base64 to Cloudinary');
    }

    return {
      success: true,
      url: res.url || res.data?.secure_url,
      public_id: res.data?.public_id,
      format: res.data?.format,
      resource_type: res.data?.resource_type,
      bytes: res.data?.bytes
    };
  } catch (err: any) {
    console.error('❌ [UploadService] Error uploading base64:', err);
    return {
      success: false,
      url: '',
      error: err.message || 'Base64 upload failed'
    };
  }
};

/**
 * Upload multiple files to Cloudinary in parallel.
 *
 * @param files - Array of File or Blob objects
 * @param folder - Cloudinary target folder
 * @returns Array of uploaded secure URLs
 */
export const uploadMultipleFilesToCloudinary = async (
  files: (File | Blob)[],
  folder: string = 'fleetos/documents'
): Promise<string[]> => {
  if (!files.length) return [];

  try {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('folder', folder);

    const token = localStorage.getItem('fleetos_auth_token') || localStorage.getItem('token');

    const response = await fetch('/api/upload/multiple', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to upload multiple files');
    }

    return data.urls || [];
  } catch (err: any) {
    console.error('❌ [UploadService] Error uploading multiple files:', err);
    return [];
  }
};
