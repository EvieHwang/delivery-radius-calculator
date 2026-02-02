/**
 * API client for backend services.
 */

import type { DriveTimeRequest, DriveTimeResponse } from '../types';

/** API base URL - uses relative path in production, can be overridden for local dev */
const API_BASE = import.meta.env.VITE_API_URL || '/api';

/** Batch size for parallel OSRM requests */
const BATCH_SIZE = 10;

/**
 * Fetch drive times for a batch of coordinate pairs.
 *
 * @param pairs - Array of source/destination coordinate pairs
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to drive time results
 */
export async function fetchDriveTimes(
  pairs: DriveTimeRequest['pairs'],
  onProgress?: (current: number, total: number) => void
): Promise<DriveTimeResponse> {
  const allResults: DriveTimeResponse['results'] = [];
  const allErrors: string[] = [];

  // Process in batches
  for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
    const batch = pairs.slice(i, i + BATCH_SIZE);
    const batchIndices = batch.map((_, idx) => i + idx);

    try {
      const response = await fetch(`${API_BASE}/drive-times`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pairs: batch })
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data: DriveTimeResponse = await response.json();

      // Map batch indices back to original indices
      for (const result of data.results) {
        allResults.push({
          ...result,
          index: batchIndices[result.index]
        });
      }

      if (data.errors) {
        allErrors.push(...data.errors);
      }
    } catch (error) {
      // Add error results for failed batch
      for (const idx of batchIndices) {
        allResults.push({
          index: idx,
          drive_time_minutes: null,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Update progress
    onProgress?.(Math.min(i + BATCH_SIZE, pairs.length), pairs.length);

    // Small delay between batches to avoid overwhelming the server
    if (i + BATCH_SIZE < pairs.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { results: allResults, errors: allErrors };
}

/**
 * Health check for the API
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
