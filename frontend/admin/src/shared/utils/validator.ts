/**
 * Validator utility functions for TMS Onward
 * Provides validation helpers for common input formats in Indonesian logistics context
 */

/**
 * Validates email format
 * @param email - Email string to validate
 * @returns true if email format is valid, false otherwise
 *
 * @example
 * validateEmail('user@example.com') // true
 * validateEmail('invalid.email') // false
 */
export function validateEmail(email: string): boolean {
  if (!email || email.trim() === '') {
    return false;
  }

  // RFC 5322 compliant email regex pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return emailRegex.test(email.trim());
}

/**
 * Validates Indonesian phone number format
 * Supports:
 * - Mobile numbers: 08xxxxxxxx (10-13 digits)
 * - Landline numbers: 021xxxxxxxxxx, 022xxxxxxxxxx, etc.
 * - Numbers with dashes/spaces allowed
 * @param phone - Phone number string to validate
 * @returns true if phone number format is valid, false otherwise
 *
 * @example
 * validatePhone('08123456789') // true
 * validatePhone('02112345678') // true
 * validatePhone('0812-3456-7890') // true
 * validatePhone('12345') // false
 */
export function validatePhone(phone: string): boolean {
  if (!phone || phone.trim() === '') {
    return false;
  }

  // Remove all non-digit characters
  const cleanedPhone = phone.replace(/\D/g, '');

  // Check if starts with 0 (Indonesian prefix)
  if (!cleanedPhone.startsWith('0')) {
    return false;
  }

  // Check length: minimum 10 digits, maximum 13 digits
  const digitCount = cleanedPhone.length;
  if (digitCount < 10 || digitCount > 13) {
    return false;
  }

  // Validate format patterns
  // Mobile: 08xxxxxxxx (starts with 08)
  // Landline: 0xx (area code 2-3 digits, followed by 6-8 digits)
  const phoneRegex = /^0(8\d{8,10}|[1-9]\d{7,10})$/;

  return phoneRegex.test(cleanedPhone);
}

/**
 * Validates Indonesian vehicle plate number format
 * Format: [City Code] [Number] [Area Code]
 * - City Code: 1-2 letters (B, D, AB, etc.)
 * - Number: 1-4 digits
 * - Area Code: 1-3 letters
 * @param plate - Plate number string to validate
 * @returns true if plate number format is valid, false otherwise
 *
 * @example
 * validatePlateNumber('B 1234 ABC') // true
 * validatePlateNumber('D 5678 XZ') // true
 * validatePlateNumber('AB 1234 CD') // true
 * validatePlateNumber('B1234ABC') // true (no spaces)
 * validatePlateNumber('INVALID') // false
 */
export function validatePlateNumber(plate: string): boolean {
  if (!plate || plate.trim() === '') {
    return false;
  }

  // Remove all spaces for validation
  const cleanedPlate = plate.replace(/\s/g, '').toUpperCase();

  // Indonesian plate number format: [1-2 letters][1-4 digits][1-3 letters]
  // Examples: B1234ABC, D5678XZ, AB1234CD
  const plateRegex = /^[A-Z]{1,2}\d{1,4}[A-Z]{1,3}$/;

  return plateRegex.test(cleanedPlate);
}

/**
 * Validates if a string is empty or only whitespace
 * @param value - String to validate
 * @returns true if string is empty or whitespace only, false otherwise
 *
 * @example
 * isEmpty('') // true
 * isEmpty('   ') // true
 * isEmpty('hello') // false
 */
export function isEmpty(value: string): boolean {
  return !value || value.trim() === '';
}

/**
 * Validates if a string meets minimum length requirement
 * @param value - String to validate
 * @param minLength - Minimum required length
 * @returns true if string meets minimum length, false otherwise
 *
 * @example
 * validateMinLength('hello', 3) // true
 * validateMinLength('hi', 3) // false
 */
export function validateMinLength(value: string, minLength: number): boolean {
  if (!value) {
    return false;
  }
  return value.trim().length >= minLength;
}

/**
 * Validates if a string meets maximum length requirement
 * @param value - String to validate
 * @param maxLength - Maximum allowed length
 * @returns true if string is within maximum length, false otherwise
 *
 * @example
 * validateMaxLength('hello', 10) // true
 * validateMaxLength('hello world', 5) // false
 */
export function validateMaxLength(value: string, maxLength: number): boolean {
  if (!value) {
    return true; // Empty string is valid for max length
  }
  return value.trim().length <= maxLength;
}

/**
 * Validates if a number is within a specified range
 * @param value - Number to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns true if number is within range, false otherwise
 *
 * @example
 * validateRange(5, 1, 10) // true
 * validateRange(15, 1, 10) // false
 */
export function validateRange(value: number, min: number, max: number): boolean {
  if (isNaN(value)) {
    return false;
  }
  return value >= min && value <= max;
}

/**
 * Validates if a value is a positive number
 * @param value - Number to validate
 * @returns true if value is positive, false otherwise
 *
 * @example
 * isPositive(10) // true
 * isPositive(0) // false
 * isPositive(-5) // false
 */
export function isPositive(value: number): boolean {
  if (isNaN(value)) {
    return false;
  }
  return value > 0;
}

/**
 * Validates if a string contains only alphabetic characters and spaces
 * @param value - String to validate
 * @returns true if string contains only letters and spaces, false otherwise
 *
 * @example
 * validateAlpha('Hello World') // true
 * validateAlpha('Hello123') // false
 */
export function validateAlpha(value: string): boolean {
  if (!value) {
    return false;
  }
  const alphaRegex = /^[a-zA-Z\s]+$/;
  return alphaRegex.test(value.trim());
}

/**
 * Validates if a string contains only alphanumeric characters
 * @param value - String to validate
 * @returns true if string contains only letters and numbers, false otherwise
 *
 * @example
 * validateAlphanumeric('ABC123') // true
 * validateAlphanumeric('ABC-123') // false
 */
export function validateAlphanumeric(value: string): boolean {
  if (!value) {
    return false;
  }
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  return alphanumericRegex.test(value.trim());
}

/**
 * Validates Indonesian postal code format (5 digits)
 * @param postalCode - Postal code to validate
 * @returns true if postal code is valid, false otherwise
 *
 * @example
 * validatePostalCode('12345') // true
 * validatePostalCode('1234') // false
 * validatePostalCode('123456') // false
 */
export function validatePostalCode(postalCode: string): boolean {
  if (!postalCode) {
    return false;
  }
  const postalCodeRegex = /^\d{5}$/;
  return postalCodeRegex.test(postalCode.trim());
}
