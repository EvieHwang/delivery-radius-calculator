/**
 * CSV export utilities.
 */

import type { QueryResult } from '../types';
import { getStatusLabel } from './classification';
import { isIncluded } from '../types';

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generate CSV content from query results.
 */
export function generateCSV(results: QueryResult[]): string {
  const headers = [
    'Source Zip',
    'Candidate Zip',
    'City',
    'County',
    'State',
    'Distance (miles)',
    'Drive Time (minutes)',
    'Status',
    'Included'
  ];

  const rows = results.map(result => [
    result.sourceZip.zip,
    result.candidateZip.zip,
    escapeCSV(result.candidateZip.city),
    escapeCSV(result.candidateZip.county || ''),
    result.candidateZip.state,
    result.distanceMiles.toFixed(2),
    result.driveTimeMinutes !== null ? Math.round(result.driveTimeMinutes).toString() : '',
    escapeCSV(getStatusLabel(result.classification)),
    isIncluded(result.classification) ? 'Yes' : 'No'
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}
