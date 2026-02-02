/**
 * Zip code database lookup utilities.
 *
 * The database is bundled at build time from GeoNames data.
 */

import type { ZipCode } from '../types';
import zipcodeData from '../data/zipcodes.json';

// Type assertion for the imported JSON
const zipcodesArray = zipcodeData as ZipCode[];

// Build a lookup map for O(1) access by zip code
const zipcodeLookup = new Map<string, ZipCode>();
for (const zip of zipcodesArray) {
  zipcodeLookup.set(zip.zip, zip);
}

/**
 * Look up a zip code by its 5-digit code
 *
 * @param zip - The 5-digit zip code string
 * @returns The ZipCode object or undefined if not found
 */
export function getZipCode(zip: string): ZipCode | undefined {
  return zipcodeLookup.get(zip);
}

/**
 * Check if a zip code exists in the database
 *
 * @param zip - The 5-digit zip code string
 * @returns True if the zip code exists
 */
export function isValidZipCode(zip: string): boolean {
  return zipcodeLookup.has(zip);
}

/**
 * Get all zip codes in the database
 *
 * @returns Array of all ZipCode objects
 */
export function getAllZipCodes(): ZipCode[] {
  return zipcodesArray;
}

/**
 * Get the total count of zip codes in the database
 */
export function getZipCodeCount(): number {
  return zipcodesArray.length;
}

/**
 * Search for zip codes by city name (case-insensitive partial match)
 *
 * @param cityQuery - Partial city name to search for
 * @param limit - Maximum number of results (default 10)
 * @returns Array of matching ZipCode objects
 */
export function searchByCity(cityQuery: string, limit = 10): ZipCode[] {
  const query = cityQuery.toLowerCase();
  const results: ZipCode[] = [];

  for (const zip of zipcodesArray) {
    if (zip.city.toLowerCase().includes(query)) {
      results.push(zip);
      if (results.length >= limit) break;
    }
  }

  return results;
}

/**
 * Search for zip codes by state code
 *
 * @param stateCode - 2-letter state code (e.g., "WA")
 * @returns Array of ZipCode objects in that state
 */
export function getByState(stateCode: string): ZipCode[] {
  const code = stateCode.toUpperCase();
  return zipcodesArray.filter(zip => zip.state === code);
}

/**
 * Format a zip code for display (city, state)
 *
 * @param zip - ZipCode object
 * @returns Formatted string like "Seattle, WA"
 */
export function formatZipCodeLocation(zip: ZipCode): string {
  return `${zip.city}, ${zip.state}`;
}

/**
 * Format a zip code with full details
 *
 * @param zip - ZipCode object
 * @returns Formatted string like "98122 - Seattle, WA (King County)"
 */
export function formatZipCodeFull(zip: ZipCode): string {
  const county = zip.county ? ` (${zip.county})` : '';
  return `${zip.zip} - ${zip.city}, ${zip.state}${county}`;
}
