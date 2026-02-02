/**
 * Query context for managing application state.
 *
 * Provides:
 * - Query parameters
 * - Results list
 * - Loading/progress state
 * - Drive time cache (session-scoped)
 * - Override management
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type {
  QueryParams,
  QueryResult,
  ProgressState,
  DriveTimeCacheKey
} from '../types';
import {
  calculateRadius,
  getEdgeCases,
  updateWithDriveTimes,
  toggleOverride as toggleOverrideUtil,
  calculateSummary
} from '../lib/calculate-radius';
import { fetchDriveTimes } from '../lib/api';

/** Default query parameters */
const DEFAULT_PARAMS: QueryParams = {
  sourceZip: '',
  distanceRadiusMiles: 15,
  driveTimeThresholdMinutes: 25
};

/** Context state */
interface QueryContextState {
  // Query parameters
  params: QueryParams;
  setParams: (params: Partial<QueryParams>) => void;

  // Results
  results: QueryResult[];
  summary: { total: number; included: number; excluded: number; overridden: number };

  // Loading state
  isLoading: boolean;
  progress: ProgressState;

  // Actions
  runQuery: () => Promise<void>;
  toggleOverride: (zipCode: string) => void;
  resetQuery: () => void;

  // Confirmation state for reset
  hasUnsavedOverrides: boolean;
}

const QueryContext = createContext<QueryContextState | null>(null);

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // State
  const [params, setParamsState] = useState<QueryParams>(DEFAULT_PARAMS);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    phase: 'idle',
    currentItem: 0,
    totalItems: 0,
    message: ''
  });

  // Session-scoped drive time cache
  const driveTimeCache = useRef<Map<DriveTimeCacheKey, number | null>>(new Map());

  // Update params partially
  const setParams = useCallback((newParams: Partial<QueryParams>) => {
    setParamsState(prev => ({ ...prev, ...newParams }));
  }, []);

  // Calculate summary
  const summary = calculateSummary(results);

  // Check for unsaved overrides
  const hasUnsavedOverrides = results.some(r => r.isOverridden);

  // Run the query
  const runQuery = useCallback(async () => {
    if (!params.sourceZip || isLoading) return;

    setIsLoading(true);
    setResults([]);

    try {
      // Phase 1: Calculate distances
      setProgress({
        phase: 'calculating_distances',
        currentItem: 0,
        totalItems: 0,
        message: 'Calculating distances...'
      });

      const distanceResults = calculateRadius(
        params.sourceZip,
        params.distanceRadiusMiles,
        params.driveTimeThresholdMinutes,
        setProgress
      );

      if (!distanceResults) {
        setProgress({
          phase: 'idle',
          currentItem: 0,
          totalItems: 0,
          message: 'Invalid source zip code'
        });
        setIsLoading(false);
        return;
      }

      // Phase 2: Get drive times for edge cases
      const edgeCases = getEdgeCases(distanceResults, params.distanceRadiusMiles);

      if (edgeCases.length > 0) {
        setProgress({
          phase: 'checking_drive_times',
          currentItem: 0,
          totalItems: edgeCases.length,
          message: `Checking drive times for ${edgeCases.length} edge cases...`
        });

        // Build pairs for API call, checking cache first
        const uncachedPairs: Array<{
          index: number;
          sourceZip: QueryResult['sourceZip'];
          candidateZip: QueryResult['candidateZip'];
        }> = [];

        const cachedDriveTimes = new Map<string, number | null>();

        for (let i = 0; i < edgeCases.length; i++) {
          const result = edgeCases[i];
          const cacheKey: DriveTimeCacheKey =
            `${result.sourceZip.lat},${result.sourceZip.lng}->${result.candidateZip.lat},${result.candidateZip.lng}`;

          if (driveTimeCache.current.has(cacheKey)) {
            cachedDriveTimes.set(result.candidateZip.zip, driveTimeCache.current.get(cacheKey)!);
          } else {
            uncachedPairs.push({
              index: i,
              sourceZip: result.sourceZip,
              candidateZip: result.candidateZip
            });
          }
        }

        // Fetch uncached drive times
        if (uncachedPairs.length > 0) {
          const pairs = uncachedPairs.map(p => ({
            source_lat: p.sourceZip.lat,
            source_lng: p.sourceZip.lng,
            dest_lat: p.candidateZip.lat,
            dest_lng: p.candidateZip.lng
          }));

          try {
            const response = await fetchDriveTimes(
              pairs,
              (current, _total) => {
                setProgress({
                  phase: 'checking_drive_times',
                  currentItem: current + (edgeCases.length - uncachedPairs.length),
                  totalItems: edgeCases.length,
                  message: `Checking drive times... ${current + (edgeCases.length - uncachedPairs.length)} of ${edgeCases.length}`
                });
              }
            );

            // Process results and update cache
            for (const result of response.results) {
              const pair = uncachedPairs[result.index];
              const driveTime = result.status === 'ok' ? result.drive_time_minutes : null;

              // Cache the result
              const cacheKey: DriveTimeCacheKey =
                `${pair.sourceZip.lat},${pair.sourceZip.lng}->${pair.candidateZip.lat},${pair.candidateZip.lng}`;
              driveTimeCache.current.set(cacheKey, driveTime);

              // Add to results map
              cachedDriveTimes.set(pair.candidateZip.zip, driveTime);
            }
          } catch (error) {
            console.error('Error fetching drive times:', error);
            // Continue with partial results
          }
        }

        // Update results with drive times
        const updatedResults = updateWithDriveTimes(
          distanceResults,
          cachedDriveTimes,
          params.distanceRadiusMiles,
          params.driveTimeThresholdMinutes
        );

        setResults(updatedResults);
      } else {
        setResults(distanceResults);
      }

      setProgress({
        phase: 'complete',
        currentItem: 0,
        totalItems: 0,
        message: 'Complete'
      });
    } catch (error) {
      console.error('Query error:', error);
      setProgress({
        phase: 'idle',
        currentItem: 0,
        totalItems: 0,
        message: 'An error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  }, [params, isLoading]);

  // Toggle override for a zip code
  const toggleOverride = useCallback((zipCode: string) => {
    setResults(prev => toggleOverrideUtil(prev, zipCode));
  }, []);

  // Reset to new search
  const resetQuery = useCallback(() => {
    setParamsState(DEFAULT_PARAMS);
    setResults([]);
    setProgress({
      phase: 'idle',
      currentItem: 0,
      totalItems: 0,
      message: ''
    });
    // Note: We preserve the drive time cache for future queries
  }, []);

  return (
    <QueryContext.Provider
      value={{
        params,
        setParams,
        results,
        summary,
        isLoading,
        progress,
        runQuery,
        toggleOverride,
        resetQuery,
        hasUnsavedOverrides
      }}
    >
      {children}
    </QueryContext.Provider>
  );
}

export function useQuery() {
  const context = useContext(QueryContext);
  if (!context) {
    throw new Error('useQuery must be used within a QueryProvider');
  }
  return context;
}
