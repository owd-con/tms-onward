/**
 * Formatter utilities for TMS Onward Driver App
 */

// ============================================================================
// DATE & TIME FORMATTERS
// ============================================================================

/**
 * Format date to DD/MM/YYYY
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string or empty string if invalid
 */
export function formatDate(date: string | Date | number | null | undefined): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    if (isNaN(dateObj.getTime())) return '-';

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
}

/**
 * Format date and time to DD/MM/YYYY HH:mm
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted datetime string or empty string if invalid
 */
export function formatDateTime(date: string | Date | number | null | undefined): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    if (isNaN(dateObj.getTime())) return '-';

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return '-';
  }
}

/**
 * Format time to HH:mm
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted time string or empty string if invalid
 */
export function formatTime(date: string | Date | number | null | undefined): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    if (isNaN(dateObj.getTime())) return '-';

    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
  } catch {
    return '-';
  }
}

/**
 * Format date to relative time (e.g., "2 hours ago", "in 3 days")
 * @param date - Date string, Date object, or timestamp
 * @returns Relative time string or empty string if invalid
 */
export function formatRelativeTime(date: string | Date | number | null | undefined): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    if (isNaN(dateObj.getTime())) return '-';

    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'baru saja';
    if (diffMin < 60) return `${diffMin} menit yang lalu`;
    if (diffHour < 24) return `${diffHour} jam yang lalu`;
    if (diffDay < 7) return `${diffDay} hari yang lalu`;

    return formatDate(dateObj);
  } catch {
    return '-';
  }
}

/**
 * Format scheduled time string (e.g., "09:00-12:00")
 * @param startTime - Start time string
 * @param endTime - End time string (optional)
 * @returns Formatted time range
 */
export function formatScheduledTime(
  startTime: string | null | undefined,
  endTime?: string | null | undefined
): string {
  if (!startTime) return '-';

  if (endTime) {
    return `${startTime} - ${endTime}`;
  }

  return startTime;
}

// ============================================================================
// PHONE NUMBER FORMATTER
// ============================================================================

/**
 * Format phone number to Indonesia format (+62)
 * Handles various input formats:
 * - 08xxxxxxxxxx -> +62 8xxxxxxxxxx
 * - 628xxxxxxxxxx -> +62 8xxxxxxxxxx
 * - +628xxxxxxxxxx -> +62 8xxxxxxxxxx
 * @param phone - Phone number string
 * @returns Formatted phone number or empty string if invalid
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-';

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Handle empty after cleaning
  if (!cleaned) return '-';

  // Convert 0 prefix to 62
  if (cleaned.startsWith('0')) {
    const formatted = '+62 ' + cleaned.substring(1);
    return formatPhoneWithSpaces(formatted);
  }

  // Add +62 prefix if not present
  if (cleaned.startsWith('62')) {
    const formatted = '+62 ' + cleaned.substring(2);
    return formatPhoneWithSpaces(formatted);
  }

  // Already has country code
  if (cleaned.startsWith('62') && phone.startsWith('+')) {
    return formatPhoneWithSpaces(phone);
  }

  // Default: add +62 prefix
  return '+62 ' + cleaned;
}

/**
 * Add spaces to phone number for better readability
 * Format: +62 812 3456 7890
 */
function formatPhoneWithSpaces(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;

  // Add +62 prefix if not present
  const digits = cleaned.startsWith('62') ? cleaned.substring(2) : cleaned;

  // Format: 812 3456 7890
  if (digits.length <= 4) {
    return '+62 ' + digits;
  }
  if (digits.length <= 8) {
    return '+62 ' + digits.substring(0, 4) + ' ' + digits.substring(4);
  }
  return (
    '+62 ' +
    digits.substring(0, 4) +
    ' ' +
    digits.substring(4, 8) +
    ' ' +
    digits.substring(8, 12)
  );
}

/**
 * Create tel: protocol link for phone numbers
 * @param phone - Phone number string
 * @returns tel: link or empty string if invalid
 */
export function formatPhoneLink(phone: string | null | undefined): string {
  if (!phone) return '';

  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';

  // Convert to international format without spaces
  const international = cleaned.startsWith('0')
    ? '62' + cleaned.substring(1)
    : cleaned.startsWith('62')
    ? cleaned
    : '62' + cleaned;

  return 'tel:' + international;
}

// ============================================================================
// CURRENCY FORMATTER
// ============================================================================

/**
 * Format amount to Indonesian Rupiah (IDR)
 * @param amount - Amount in number or string
 * @returns Formatted currency string (e.g., "Rp 1.500.000" or "-")
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '-';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) return '-';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

/**
 * Format amount to compact Indonesian Rupiah (e.g., "Rp 1,5jt")
 * @param amount - Amount in number or string
 * @returns Compact formatted currency string
 */
export function formatCurrencyCompact(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '-';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) return '-';

  if (numAmount >= 1000000000) {
    return `Rp ${(numAmount / 1000000000).toFixed(1)} miliar`;
  }
  if (numAmount >= 1000000) {
    return `Rp ${(numAmount / 1000000).toFixed(1)} juta`;
  }
  if (numAmount >= 1000) {
    return `Rp ${(numAmount / 1000).toFixed(1)} ribu`;
  }

  return formatCurrency(numAmount);
}

// ============================================================================
// NUMBER FORMATTER
// ============================================================================

/**
 * Format weight in kg
 * @param weight - Weight in kg
 * @returns Formatted weight string
 */
export function formatWeight(weight: number | null | undefined): string {
  if (weight === null || weight === undefined) return '-';

  return `${weight.toLocaleString('id-ID')} kg`;
}

/**
 * Format distance in km
 * @param distance - Distance in meters
 * @returns Formatted distance string
 */
export function formatDistance(distance: number | null | undefined): string {
  if (distance === null || distance === undefined) return '-';

  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)} km`;
  }

  return `${distance} m`;
}

// ============================================================================
// TEXT FORMATTER
// ============================================================================

/**
 * Truncate text to specified length and add ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string | null | undefined, maxLength: number = 50): string {
  if (!text) return '-';

  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength) + '...';
}

/**
 * Capitalize first letter of string
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalize(text: string | null | undefined): string {
  if (!text) return '';

  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Format name to title case
 * @param name - Name to format
 * @returns Formatted name
 */
export function formatName(name: string | null | undefined): string {
  if (!name) return '-';

  return name
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================================================
// ADDRESS FORMATTER
// ============================================================================

/**
 * Format address components into a single string
 * @param address - Address object with components
 * @returns Formatted address string
 */
export function formatAddress(address: {
  locationName?: string | null;
  locationAddress?: string | null;
  district?: string | null;
  city?: string | null;
  province?: string | null;
}): string {
  const parts = [
    address.locationName,
    address.locationAddress,
    address.district,
    address.city,
    address.province,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : '-';
}

/**
 * Format short address (name + city only)
 * @param address - Address object with components
 * @returns Formatted short address string
 */
export function formatShortAddress(address: {
  locationName?: string | null;
  city?: string | null;
}): string {
  if (address.locationName && address.city) {
    return `${address.locationName}, ${address.city}`;
  }

  return address.locationName || address.city || '-';
}
