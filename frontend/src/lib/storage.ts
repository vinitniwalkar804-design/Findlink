import { api } from './api';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function validateImageFile(file: File): string | null {
  if (!file) return 'Please choose an image file.';
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Unsupported image format. Use JPG, JPEG, PNG, or WEBP.';
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Image must be 10 MB or smaller.';
  }
  return null;
}

export async function uploadImage(file: File, folder: string): Promise<{ url: string; error: string | null }> {
  const validationError = validateImageFile(file);
  if (validationError) {
    return { url: '', error: validationError };
  }

  return api.uploadImage(file, folder);
}

