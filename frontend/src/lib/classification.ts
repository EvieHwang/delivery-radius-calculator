/**
 * Classification logic for determining if a zip code is within delivery radius.
 *
 * Thresholds:
 * - < 80% of radius: "in — distance confirmed" (no drive time check)
 * - 80-120% of radius: Check drive time (edge case)
 * - > 120% of radius: Not included in results
 */

import type { ClassificationStatus } from '../types';

/** Threshold below which we don't need to check drive time (fraction of radius) */
const INNER_THRESHOLD = 0.8;

/** Threshold above which we exclude without checking (fraction of radius) */
const OUTER_THRESHOLD = 1.2;

/**
 * Determine if a zip code needs a drive time lookup
 */
export function needsDriveTimeCheck(
  distanceMiles: number,
  radiusMiles: number
): boolean {
  const ratio = distanceMiles / radiusMiles;
  return ratio >= INNER_THRESHOLD && ratio <= OUTER_THRESHOLD;
}

/**
 * Determine if a zip code is within the search area (120% of radius)
 */
export function isWithinSearchArea(
  distanceMiles: number,
  radiusMiles: number
): boolean {
  return distanceMiles <= radiusMiles * OUTER_THRESHOLD;
}

/**
 * Classify a zip code based on distance and optional drive time
 *
 * @param distanceMiles - Distance from source in miles
 * @param radiusMiles - User-specified radius in miles
 * @param driveTimeMinutes - Actual drive time if checked (null if not checked)
 * @param driveTimeThresholdMinutes - User-specified drive time threshold
 * @returns Classification status
 */
export function classifyZipCode(
  distanceMiles: number,
  radiusMiles: number,
  driveTimeMinutes: number | null,
  driveTimeThresholdMinutes: number
): ClassificationStatus {
  const ratio = distanceMiles / radiusMiles;

  // Within 80% of radius - definitely in
  if (ratio < INNER_THRESHOLD) {
    return 'in_distance';
  }

  // In the edge zone (80-120%) - need drive time to decide
  if (ratio <= OUTER_THRESHOLD) {
    if (driveTimeMinutes === null) {
      // Drive time not yet checked - shouldn't happen in final results
      // but default to out until we know
      return 'out_drive_time';
    }

    if (driveTimeMinutes <= driveTimeThresholdMinutes) {
      return 'in_drive_time';
    } else {
      return 'out_drive_time';
    }
  }

  // Beyond 120% - this shouldn't be in results, but classify as out
  return 'out_drive_time';
}

/**
 * Get the zone a zip code falls into for UI display
 */
export type DistanceZone = 'inner' | 'edge' | 'outer';

export function getDistanceZone(
  distanceMiles: number,
  radiusMiles: number
): DistanceZone {
  const ratio = distanceMiles / radiusMiles;

  if (ratio < INNER_THRESHOLD) {
    return 'inner';
  } else if (ratio <= OUTER_THRESHOLD) {
    return 'edge';
  } else {
    return 'outer';
  }
}

/**
 * Get human-readable status label for a classification
 */
export function getStatusLabel(classification: ClassificationStatus): string {
  switch (classification) {
    case 'in_distance':
      return 'In — distance confirmed';
    case 'in_drive_time':
      return 'In — drive time confirmed';
    case 'out_drive_time':
      return 'Out — drive time exceeded';
    case 'overridden_in':
      return 'Overridden — included';
    case 'overridden_out':
      return 'Overridden — excluded';
    default:
      return 'Unknown';
  }
}
