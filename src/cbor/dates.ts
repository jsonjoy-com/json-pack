/**
 * Utilities for handling CBOR date tags as defined in RFC 8943.
 * 
 * - Tag 100: Number of days since the epoch date 1970-01-01
 * - Tag 1004: RFC 3339 full-date string (YYYY-MM-DD)
 */

/**
 * The epoch date (1970-01-01) used for tag 100 calculations.
 */
const EPOCH_DATE = new Date(1970, 0, 1); // January 1, 1970

/**
 * Converts a JavaScript Date object to the number of days since 1970-01-01.
 * Used for CBOR tag 100.
 * 
 * @param date - The Date object to convert
 * @returns The number of days since the epoch date (can be negative for dates before 1970)
 */
export function dateToDaysSinceEpoch(date: Date): number {
  // Get the date part only (ignore time) by creating a new date with time set to midnight
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const epochDate = new Date(1970, 0, 1);
  
  // Calculate the difference in milliseconds and convert to days
  const diffInMs = dateOnly.getTime() - epochDate.getTime();
  const diffInDays = Math.floor(diffInMs / (24 * 60 * 60 * 1000));
  
  return diffInDays;
}

/**
 * Converts the number of days since 1970-01-01 back to a JavaScript Date object.
 * Used for decoding CBOR tag 100.
 * 
 * @param days - The number of days since the epoch date
 * @returns A Date object representing the date (time will be set to midnight UTC)
 */
export function daysSinceEpochToDate(days: number): Date {
  const epochDate = new Date(1970, 0, 1);
  const resultDate = new Date(epochDate);
  resultDate.setDate(epochDate.getDate() + days);
  return resultDate;
}

/**
 * Converts a JavaScript Date object to an RFC 3339 full-date string.
 * Used for CBOR tag 1004.
 * 
 * @param date - The Date object to convert
 * @returns A date string in YYYY-MM-DD format
 */
export function dateToRfc3339String(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Converts an RFC 3339 full-date string back to a JavaScript Date object.
 * Used for decoding CBOR tag 1004.
 * 
 * @param dateString - The date string in YYYY-MM-DD format
 * @returns A Date object representing the date (time will be set to midnight in local timezone)
 * @throws Error if the date string is invalid
 */
export function rfc3339StringToDate(dateString: string): Date {
  // Validate the format using a regex
  const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dateString.match(dateRegex);
  
  if (!match) {
    throw new Error(`Invalid RFC 3339 date format: ${dateString}`);
  }
  
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // Month is 0-indexed in JavaScript
  const day = parseInt(match[3], 10);
  
  // Validate the date values
  if (month < 0 || month > 11) {
    throw new Error(`Invalid month in date: ${dateString}`);
  }
  
  const date = new Date(year, month, day);
  
  // Check if the date is valid (JavaScript Date constructor may adjust invalid dates)
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    throw new Error(`Invalid date: ${dateString}`);
  }
  
  return date;
}