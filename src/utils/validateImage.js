// Client-side image validation (size and mime type)
export const validateImage = (file, maxMb = 5, allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) => {
  if (!file) return { valid: false, error: 'No file provided' };

  // Check type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Only JPEG, PNG, and WEBP are allowed.`,
    };
  }

  // Check size (bytes to MB)
  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Max limit is ${maxMb} MB.`,
    };
  }

  return { valid: true, error: null };
};
