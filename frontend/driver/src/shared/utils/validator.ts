/**
 * Validator utilities for TMS Onward Driver App
 */

// ============================================================================
// PHONE VALIDATION
// ============================================================================

/**
 * Indonesian phone number validation
 * Valid formats:
 * - 08xxxxxxxxxx (12-13 digits)
 * - 628xxxxxxxxxx (with country code)
 * - +628xxxxxxxxxx (with + prefix)
 * @param phone - Phone number string
 * @returns Object with isValid and error message
 */
export function validatePhone(phone: string | null | undefined): {
  isValid: boolean;
  error?: string;
} {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Nomor telepon wajib diisi' };
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Check length (Indonesian numbers: 11-13 digits with 0, 12-14 with 62)
  if (cleaned.length < 11 || cleaned.length > 14) {
    return {
      isValid: false,
      error: 'Nomor telepon harus 11-13 digit',
    };
  }

  // Check if starts with valid prefix (0 or 62)
  if (!cleaned.startsWith('0') && !cleaned.startsWith('62')) {
    return {
      isValid: false,
      error: 'Nomor telepon harus diawali dengan 0 atau 62',
    };
  }

  // Check if starts with valid Indonesian mobile prefix (08x or 628x)
  const mobileRegex = /^(0|62)8[0-9]{8,11}$/;
  if (!mobileRegex.test(cleaned)) {
    return {
      isValid: false,
      error: 'Format nomor telepon tidak valid',
    };
  }

  return { isValid: true };
}

/**
 * Check if phone number is valid (boolean return)
 * @param phone - Phone number string
 * @returns true if valid, false otherwise
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  return validatePhone(phone).isValid;
}

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Email validation
 * @param email - Email string
 * @returns Object with isValid and error message
 */
export function validateEmail(email: string | null | undefined): {
  isValid: boolean;
  error?: string;
} {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email wajib diisi' };
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return {
      isValid: false,
      error: 'Format email tidak valid',
    };
  }

  // Check for common TLD
  const tld = email.split('.').pop();
  if (!tld || tld.length < 2) {
    return {
      isValid: false,
      error: 'Format email tidak valid',
    };
  }

  return { isValid: true };
}

/**
 * Check if email is valid (boolean return)
 * @param email - Email string
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string | null | undefined): boolean {
  return validateEmail(email).isValid;
}

// ============================================================================
// REQUIRED FIELD VALIDATION
// ============================================================================

/**
 * Validate required field
 * @param value - Value to validate
 * @param fieldName - Field name for error message
 * @returns Object with isValid and error message
 */
export function validateRequired(
  value: string | null | undefined,
  fieldName: string = 'Field ini'
): {
  isValid: boolean;
  error?: string;
} {
  if (value === null || value === undefined || value.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName} wajib diisi`,
    };
  }

  return { isValid: true };
}

/**
 * Check if value is present (boolean return)
 * @param value - Value to check
 * @returns true if present, false otherwise
 */
export function isPresent(value: string | null | undefined): boolean {
  return validateRequired(value).isValid;
}

// ============================================================================
// LENGTH VALIDATION
// ============================================================================

/**
 * Validate minimum length
 * @param value - Value to validate
 * @param minLength - Minimum length
 * @param fieldName - Field name for error message
 * @returns Object with isValid and error message
 */
export function validateMinLength(
  value: string | null | undefined,
  minLength: number,
  fieldName: string = 'Field ini'
): {
  isValid: boolean;
  error?: string;
} {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName} wajib diisi`,
    };
  }

  if (value.trim().length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} minimal ${minLength} karakter`,
    };
  }

  return { isValid: true };
}

/**
 * Validate maximum length
 * @param value - Value to validate
 * @param maxLength - Maximum length
 * @param fieldName - Field name for error message
 * @returns Object with isValid and error message
 */
export function validateMaxLength(
  value: string | null | undefined,
  maxLength: number,
  fieldName: string = 'Field ini'
): {
  isValid: boolean;
  error?: string;
} {
  if (value && value.trim().length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} maksimal ${maxLength} karakter`,
    };
  }

  return { isValid: true };
}

/**
 * Validate exact length (useful for codes, IDs, etc.)
 * @param value - Value to validate
 * @param length - Exact length
 * @param fieldName - Field name for error message
 * @returns Object with isValid and error message
 */
export function validateExactLength(
  value: string | null | undefined,
  length: number,
  fieldName: string = 'Field ini'
): {
  isValid: boolean;
  error?: string;
} {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName} wajib diisi`,
    };
  }

  if (value.trim().length !== length) {
    return {
      isValid: false,
      error: `${fieldName} harus ${length} karakter`,
    };
  }

  return { isValid: true };
}

// ============================================================================
// NUMERIC VALIDATION
// ============================================================================

/**
 * Validate numeric value
 * @param value - Value to validate
 * @param fieldName - Field name for error message
 * @returns Object with isValid and error message
 */
export function validateNumeric(
  value: string | null | undefined,
  fieldName: string = 'Field ini'
): {
  isValid: boolean;
  error?: string;
} {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName} wajib diisi`,
    };
  }

  const num = parseFloat(value);
  if (isNaN(num)) {
    return {
      isValid: false,
      error: `${fieldName} harus berupa angka`,
    };
  }

  return { isValid: true };
}

/**
 * Validate minimum value
 * @param value - Value to validate
 * @param minValue - Minimum value
 * @param fieldName - Field name for error message
 * @returns Object with isValid and error message
 */
export function validateMinValue(
  value: string | number | null | undefined,
  minValue: number,
  fieldName: string = 'Field ini'
): {
  isValid: boolean;
  error?: string;
} {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (num === null || num === undefined || isNaN(num)) {
    return {
      isValid: false,
      error: `${fieldName} wajib diisi`,
    };
  }

  if (num < minValue) {
    return {
      isValid: false,
      error: `${fieldName} minimal ${minValue}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate maximum value
 * @param value - Value to validate
 * @param maxValue - Maximum value
 * @param fieldName - Field name for error message
 * @returns Object with isValid and error message
 */
export function validateMaxValue(
  value: string | number | null | undefined,
  maxValue: number,
  fieldName: string = 'Field ini'
): {
  isValid: boolean;
  error?: string;
} {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (num === null || num === undefined || isNaN(num)) {
    return {
      isValid: false,
      error: `${fieldName} wajib diisi`,
    };
  }

  if (num > maxValue) {
    return {
      isValid: false,
      error: `${fieldName} maksimal ${maxValue}`,
    };
  }

  return { isValid: true };
}

// ============================================================================
// URL VALIDATION
// ============================================================================

/**
 * URL validation
 * @param url - URL string
 * @returns Object with isValid and error message
 */
export function validateURL(url: string | null | undefined): {
  isValid: boolean;
  error?: string;
} {
  if (!url || url.trim() === '') {
    return { isValid: false, error: 'URL wajib diisi' };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'Format URL tidak valid',
    };
  }
}

/**
 * Check if URL is valid (boolean return)
 * @param url - URL string
 * @returns true if valid, false otherwise
 */
export function isValidURL(url: string | null | undefined): boolean {
  return validateURL(url).isValid;
}

// ============================================================================
// FILE VALIDATION
// ============================================================================

/**
 * Validate file size
 * @param file - File object
 * @param maxSizeMB - Maximum size in MB
 * @returns Object with isValid and error message
 */
export function validateFileSize(
  file: File | null | undefined,
  maxSizeMB: number
): {
  isValid: boolean;
  error?: string;
} {
  if (!file) {
    return { isValid: false, error: 'File wajib dipilih' };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `Ukuran file maksimal ${maxSizeMB}MB`,
    };
  }

  return { isValid: true };
}

/**
 * Validate file type
 * @param file - File object
 * @param allowedTypes - Array of allowed MIME types
 * @returns Object with isValid and error message
 */
export function validateFileType(
  file: File | null | undefined,
  allowedTypes: string[]
): {
  isValid: boolean;
  error?: string;
} {
  if (!file) {
    return { isValid: false, error: 'File wajib dipilih' };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Tipe file tidak diizinkan. Format yang diizinkan: ${allowedTypes.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate image file (JPEG, PNG, GIF, WebP)
 * @param file - File object
 * @returns Object with isValid and error message
 */
export function validateImageFile(
  file: File | null | undefined
): {
  isValid: boolean;
  error?: string;
} {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validateFileType(file, allowedTypes);
}

// ============================================================================
// FORM VALIDATION HELPERS
// ============================================================================

/**
 * Validate multiple fields and return all errors
 * @param validations - Array of validation results
 * @returns Object with isValid and errors object
 */
export function validateForm(
  validations: Array<{ field: string; result: { isValid: boolean; error?: string } }>
): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const { field, result } of validations) {
    if (!result.isValid && result.error) {
      errors[field] = result.error;
      isValid = false;
    }
  }

  return { isValid, errors };
}

/**
 * Collect form errors from validation results
 * @param validations - Object with field names and validation results
 * @returns Object with isValid and errors object
 */
export function collectErrors(
  validations: Record<string, { isValid: boolean; error?: string }>
): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [field, result] of Object.entries(validations)) {
    if (!result.isValid && result.error) {
      errors[field] = result.error;
      isValid = false;
    }
  }

  return { isValid, errors };
}
