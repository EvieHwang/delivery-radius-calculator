/**
 * Type definitions for Delivery Radius Calculator
 */

/** A US zip code with geographic data */
export interface ZipCode {
  zip: string;
  city: string;
  state: string;
  county: string;
  lat: number;
  lng: number;
}

/** Query parameters for a delivery radius search */
export interface QueryParams {
  sourceZip: string;
  distanceRadiusMiles: number;
  driveTimeThresholdMinutes: number;
}

/** Classification status for a zip code result */
export type ClassificationStatus =
  | 'in_distance'        // Within 80% of radius - no drive time check needed
  | 'in_drive_time'      // In 80-120% band, drive time confirmed within threshold
  | 'out_drive_time'     // In 80-120% band, drive time exceeded threshold
  | 'overridden_in'      // Manually overridden to include
  | 'overridden_out';    // Manually overridden to exclude

/** Result for a single candidate zip code */
export interface QueryResult {
  sourceZip: ZipCode;
  candidateZip: ZipCode;
  distanceMiles: number;
  driveTimeMinutes: number | null;  // null if not checked (inside 80% or beyond 120%)
  classification: ClassificationStatus;
  originalClassification: ClassificationStatus;  // Stored for reverting overrides
  isOverridden: boolean;
}

/** Summary counts for results display */
export interface ResultsSummary {
  total: number;
  included: number;
  excluded: number;
  overridden: number;
}

/** Processing phase for progress indicator */
export type ProcessingPhase =
  | 'idle'
  | 'calculating_distances'
  | 'checking_drive_times'
  | 'complete';

/** Progress state for the calculation process */
export interface ProgressState {
  phase: ProcessingPhase;
  currentItem: number;
  totalItems: number;
  message: string;
}

/** Request body for drive time API */
export interface DriveTimeRequest {
  pairs: Array<{
    source_lat: number;
    source_lng: number;
    dest_lat: number;
    dest_lng: number;
  }>;
}

/** Response from drive time API */
export interface DriveTimeResponse {
  results: Array<{
    index: number;
    drive_time_minutes: number | null;
    status: 'ok' | 'error';
    message?: string;
  }>;
  errors: string[];
}

/** Cache key for drive time lookups */
export type DriveTimeCacheKey = `${number},${number}->${number},${number}`;

/** Check if a classification means the zip is included */
export function isIncluded(classification: ClassificationStatus): boolean {
  return classification === 'in_distance' ||
         classification === 'in_drive_time' ||
         classification === 'overridden_in';
}

/** Check if a classification means the zip is excluded */
export function isExcluded(classification: ClassificationStatus): boolean {
  return classification === 'out_drive_time' ||
         classification === 'overridden_out';
}

/** Check if a classification was manually overridden */
export function isOverridden(classification: ClassificationStatus): boolean {
  return classification === 'overridden_in' ||
         classification === 'overridden_out';
}
