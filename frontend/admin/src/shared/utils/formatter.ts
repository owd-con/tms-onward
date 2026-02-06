import dayjs from 'dayjs';

/**
 * Format angka ke format mata uang Indonesia
 * @param amount - Jumlah yang akan diformat (number atau string)
 * @param currency - Kode mata uang (default: "IDR")
 * @returns String mata uang yang diformat
 * @example
 * formatCurrency(150000) // "Rp 150.000"
 * formatCurrency(150000, "USD") // "USD 150,000"
 */
export function formatCurrency(amount: number | string, currency: string = 'IDR'): string {
  // Convert string to number if needed
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Handle invalid number
  if (isNaN(numAmount)) {
    return `${currency} 0`;
  }

  // Define currency symbols
  const currencySymbols: Record<string, string> = {
    IDR: 'Rp',
    USD: '$',
    EUR: '€',
    GBP: '£',
    SGD: 'S$',
    MYR: 'RM',
  };

  // Get currency symbol or use currency code as default
  const symbol = currencySymbols[currency] || currency;

  // Format number based on currency
  const formatter = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // For IDR, place symbol before amount
  if (currency === 'IDR') {
    return `${symbol} ${formatter.format(numAmount)}`;
  }

  // For other currencies, use standard format
  return `${symbol} ${formatter.format(numAmount)}`;
}

/**
 * Format tanggal ke format yang diinginkan
 * @param date - Tanggal yang akan diformat (string atau Date)
 * @param format - Format tanggal (default: "DD/MM/YYYY")
 * @returns String tanggal yang diformat
 * @example
 * formatDate("2024-01-25") // "25/01/2024"
 * formatDate("2024-01-25", "YYYY-MM-DD") // "2024-01-25"
 */
export function formatDate(date: string | Date, format: string = 'DD/MM/YYYY'): string {
  if (!date) {
    return '-';
  }

  const parsedDate = dayjs(date);
  if (!parsedDate.isValid()) {
    return '-';
  }

  return parsedDate.format(format);
}

/**
 * Format tanggal dan waktu
 * @param date - Tanggal yang akan diformat (string atau Date)
 * @returns String tanggal dan waktu yang diformat
 * @example
 * formatDateTime("2024-01-25T14:30:00") // "25/01/2024 14:30"
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'DD/MM/YYYY HH:mm');
}

/**
 * Format nomor telepon Indonesia
 * @param phone - Nomor telepon yang akan diformat
 * @returns String nomor telepon yang diformat
 * @example
 * formatPhoneNumber("08123456789") // "0812-3456-789"
 * formatPhoneNumber("+628123456789") // "0812-3456-789"
 * formatPhoneNumber("628123456789") // "0812-3456-789"
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) {
    return '-';
  }

  // Remove all non-digit characters
  let cleanedPhone = phone.replace(/\D/g, '');

  // Handle +62 prefix
  if (cleanedPhone.startsWith('62')) {
    cleanedPhone = '0' + cleanedPhone.substring(2);
  }

  // If the number is less than 9 digits, return as is
  if (cleanedPhone.length < 9) {
    return cleanedPhone;
  }

  // Format: 0812-3456-789 (for 12 digits)
  // Format: 0812-3456-7890 (for 13 digits)
  // Format: 0812-345-67890 (for 13 digits, different pattern)

  // Common Indonesian mobile number patterns
  // 08XX-XXXX-XXXX (12 digits)
  if (cleanedPhone.length === 12) {
    return cleanedPhone.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
  }

  // 08XX-XXXX-XXXXX (13 digits)
  if (cleanedPhone.length === 13) {
    return cleanedPhone.replace(/(\d{4})(\d{4})(\d{4,5})/, '$1-$2-$3');
  }

  // Fallback: format as 4-digit groups
  const groups = cleanedPhone.match(/(\d{1,4})/g);
  if (groups) {
    return groups.join('-');
  }

  return cleanedPhone;
}

/**
 * Format angka dengan pemisah ribuan
 * @param num - Angka yang akan diformat
 * @returns String angka yang diformat
 * @example
 * formatNumber(150000) // "150.000"
 */
export function formatNumber(num: number | string): string {
  const number = typeof num === 'string' ? parseFloat(num) : num;

  if (isNaN(number)) {
    return '0';
  }

  return new Intl.NumberFormat('id-ID').format(number);
}

/**
 * Format ukuran file ke format yang readable
 * @param bytes - Ukuran file dalam bytes
 * @returns String ukuran file yang diformat
 * @example
 * formatFileSize(1024) // "1 KB"
 * formatFileSize(1048576) // "1 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format persentase
 * @param value - Nilai persentase (0-100 atau desimal)
 * @param decimals - Jumlah desimal (default: 0)
 * @returns String persentase yang diformat
 * @example
 * formatPercentage(75.5) // "75.5%"
 * formatPercentage(0.755, 1) // "75.5%"
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  // Convert decimal to percentage if value is less than or equal to 1
  const percentage = value <= 1 ? value * 100 : value;

  return `${percentage.toFixed(decimals)}%`;
}
