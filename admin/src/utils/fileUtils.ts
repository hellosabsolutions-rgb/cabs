/**
 * File utility helpers for multi-format document uploads (Images and PDFs)
 */

export const ACCEPT_DOC_TYPES = 'image/jpeg,image/png,image/webp,image/jpg,application/pdf,.pdf';

export const isPdfDocument = (fileName?: string | null, urlOrBase64?: string | null): boolean => {
  if (fileName && /\.pdf$/i.test(fileName)) return true;
  if (urlOrBase64) {
    if (urlOrBase64.startsWith('data:application/pdf')) return true;
    if (urlOrBase64.toLowerCase().endsWith('.pdf') || urlOrBase64.toLowerCase().includes('.pdf?')) return true;
  }
  return false;
};

export const getFileExtension = (fileName?: string | null): string => {
  if (!fileName) return '';
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toUpperCase() : '';
};
