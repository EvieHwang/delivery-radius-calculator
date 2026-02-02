/**
 * Radius calculation engine.
 *
 * Calculates all zip codes within 120% of the specified radius
 * and classifies them based on distance thresholds.
 */

import type { QueryResult, ClassificationStatus, ProgressState } from '../types';
import { getAllZipCodes, getZipCode } from './zipcode-db';
import { haversineRounded } from './haversine';
import { classifyZipCode, needsDriveTimeCheck, isWithinSearchArea } from './classification';

/** Progress callback type */
export type ProgressCallback = (progress: ProgressState) => void;

/**
 * Calculate all zip codes within the delivery radius.
 *
 * This performs the initial distance-based calculation.
 * Drive time lookups for edge cases are handled separately.
 *
 * @param sourceZipCode - The source zip code string
 * @param radiusMiles - The delivery radius in miles
 * @param driveTimeThreshold - The drive time threshold in minutes
 * @param onProgress - Optional callback for progress updates
 * @returns Array of QueryResult objects, or null if source zip is invalid
 */
export function calculateRadius(
  sourceZipCode: string,
  radiusMiles: number,
  _driveTimeThreshold: number,
  onProgress?: ProgressCallback
): QueryResult[] | null {
  // Validate source zip code
  const sourceZip = getZipCode(sourceZipCode);
  if (!sourceZip) {
    return null;
  }

  const allZips = getAllZipCodes();
  const results: QueryResult[] = [];

  // Update progress
  onProgress?.({
    phase: 'calculating_distances',
    currentItem: 0,
    totalItems: allZips.length,
    message: 'Calculating distances...'
  });

  // Calculate distance to every zip code
  for (let i = 0; i < allZips.length; i++) {
    const candidateZip = allZips[i];

    // Skip the source zip code itself
    if (candidateZip.zip === sourceZipCode) {
      continue;
    }

    // Calculate distance
    const distance = haversineRounded(
      sourceZip.lat,
      sourceZip.lng,
      candidateZip.lat,
      candidateZip.lng
    );

    // Skip if beyond 120% of radius
    if (!isWithinSearchArea(distance, radiusMiles)) {
      continue;
    }

    // Classify based on distance (drive time will be added later for edge cases)
    // For now, edge cases get null drive time and tentative classification
    const needsDriveTime = needsDriveTimeCheck(distance, radiusMiles);
    const driveTimeMinutes = needsDriveTime ? null : null; // Will be populated later

    // Initial classification - edge cases will be reclassified after drive time lookup
    let classification: ClassificationStatus;
    if (!needsDriveTime && distance < radiusMiles * 0.8) {
      classification = 'in_distance';
    } else {
      // Edge case - needs drive time check, tentatively mark as needing lookup
      classification = 'out_drive_time'; // Will be updated after drive time check
    }

    results.push({
      sourceZip,
      candidateZip,
      distanceMiles: distance,
      driveTimeMinutes,
      classification,
      isOverridden: false
    });

    // Update progress every 1000 items
    if (i % 1000 === 0) {
      onProgress?.({
        phase: 'calculating_distances',
        currentItem: i,
        totalItems: allZips.length,
        message: `Calculating distances... ${i.toLocaleString()} of ${allZips.length.toLocaleString()}`
      });
    }
  }

  // Sort by distance
  results.sort((a, b) => a.distanceMiles - b.distanceMiles);

  onProgress?.({
    phase: 'calculating_distances',
    currentItem: allZips.length,
    totalItems: allZips.length,
    message: `Found ${results.length} zip codes within range`
  });

  return results;
}

/**
 * Get the zip codes that need drive time lookups (edge cases in 80-120% band)
 */
export function getEdgeCases(results: QueryResult[], radiusMiles: number): QueryResult[] {
  return results.filter(r => needsDriveTimeCheck(r.distanceMiles, radiusMiles));
}

/**
 * Update results with drive time data and reclassify edge cases
 */
export function updateWithDriveTimes(
  results: QueryResult[],
  driveTimes: Map<string, number | null>,
  radiusMiles: number,
  driveTimeThreshold: number
): QueryResult[] {
  return results.map(result => {
    const key = `${result.candidateZip.zip}`;
    const driveTime = driveTimes.get(key);

    // If we have drive time data for this zip code
    if (driveTime !== undefined) {
      const newClassification = classifyZipCode(
        result.distanceMiles,
        radiusMiles,
        driveTime,
        driveTimeThreshold
      );

      return {
        ...result,
        driveTimeMinutes: driveTime,
        classification: result.isOverridden ? result.classification : newClassification
      };
    }

    return result;
  });
}

/**
 * Toggle override for a specific result
 */
export function toggleOverride(
  results: QueryResult[],
  zipCode: string
): QueryResult[] {
  return results.map(result => {
    if (result.candidateZip.zip !== zipCode) {
      return result;
    }

    // Determine new classification based on current state
    let newClassification: ClassificationStatus;
    let newIsOverridden: boolean;

    if (result.isOverridden) {
      // Remove override - restore original classification
      newIsOverridden = false;
      newClassification = result.driveTimeMinutes !== null
        ? (result.distanceMiles < result.distanceMiles * 0.8 ? 'in_distance' :
           (result.driveTimeMinutes <= 25 ? 'in_drive_time' : 'out_drive_time'))
        : (result.distanceMiles < result.distanceMiles * 0.8 ? 'in_distance' : 'out_drive_time');
    } else {
      // Add override - flip the inclusion status
      newIsOverridden = true;
      const wasIncluded = result.classification === 'in_distance' ||
                          result.classification === 'in_drive_time';
      newClassification = wasIncluded ? 'overridden_out' : 'overridden_in';
    }

    return {
      ...result,
      classification: newClassification,
      isOverridden: newIsOverridden
    };
  });
}

/**
 * Calculate summary statistics for results
 */
export function calculateSummary(results: QueryResult[]): {
  total: number;
  included: number;
  excluded: number;
  overridden: number;
} {
  let included = 0;
  let excluded = 0;
  let overridden = 0;

  for (const result of results) {
    if (result.isOverridden) {
      overridden++;
    }

    if (
      result.classification === 'in_distance' ||
      result.classification === 'in_drive_time' ||
      result.classification === 'overridden_in'
    ) {
      included++;
    } else {
      excluded++;
    }
  }

  return {
    total: results.length,
    included,
    excluded,
    overridden
  };
}
