import * as FileSystem from 'expo-file-system/legacy';
import type { Attachment } from './types';

/**
 * Convert a local attachment / URI into a base64 data URI for backend upload.
 * Backend compresses with Sharp and stores on Cloudinary.
 */
export async function resolveAttachmentForUpload(
  file: Attachment | null | undefined,
  existingUrl?: string | null
): Promise<string | null> {
  if (file?.uri && (file.uri.startsWith('http://') || file.uri.startsWith('https://'))) {
    return file.uri;
  }

  if (file?.base64) {
    return `data:${file.mime || 'image/jpeg'};base64,${file.base64}`;
  }

  if (file?.uri && file.kind === 'image') {
    try {
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:${file.mime || 'image/jpeg'};base64,${base64}`;
    } catch {
      return null;
    }
  }

  if (existingUrl && !existingUrl.startsWith('file:')) {
    return existingUrl;
  }

  return null;
}

export async function resolveUriForUpload(uri: string, mime = 'image/jpeg'): Promise<string | null> {
  if (!uri) return null;
  if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
  if (uri.startsWith('data:')) return uri;

  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
}
