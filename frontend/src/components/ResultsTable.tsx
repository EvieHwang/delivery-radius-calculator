/**
 * Sortable, color-coded results table.
 */

import { useState, useMemo } from 'react';
import { useQuery } from '../context/QueryContext';
import { getStatusLabel } from '../lib/classification';
import { isIncluded, isOverridden } from '../types';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QueryResult } from '../types';

type SortKey = 'zip' | 'city' | 'county' | 'state' | 'distance' | 'driveTime' | 'status';
type SortDirection = 'asc' | 'desc';

export function ResultsTable() {
  const { results, toggleOverride } = useQuery();
  const [sortKey, setSortKey] = useState<SortKey>('distance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Sort results
  const sortedResults = useMemo(() => {
    const sorted = [...results];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case 'zip':
          comparison = a.candidateZip.zip.localeCompare(b.candidateZip.zip);
          break;
        case 'city':
          comparison = a.candidateZip.city.localeCompare(b.candidateZip.city);
          break;
        case 'county':
          comparison = a.candidateZip.county.localeCompare(b.candidateZip.county);
          break;
        case 'state':
          comparison = a.candidateZip.state.localeCompare(b.candidateZip.state);
          break;
        case 'distance':
          comparison = a.distanceMiles - b.distanceMiles;
          break;
        case 'driveTime':
          // Nulls sort last
          if (a.driveTimeMinutes === null && b.driveTimeMinutes === null) comparison = 0;
          else if (a.driveTimeMinutes === null) comparison = 1;
          else if (b.driveTimeMinutes === null) comparison = -1;
          else comparison = a.driveTimeMinutes - b.driveTimeMinutes;
          break;
        case 'status':
          comparison = a.classification.localeCompare(b.classification);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [results, sortKey, sortDirection]);

  if (results.length === 0) {
    return null;
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  const getRowClassName = (result: QueryResult) => {
    const included = isIncluded(result.classification);
    const overridden = isOverridden(result.classification);

    let base = 'border-b transition-colors hover:bg-muted/50';

    if (overridden) {
      base += included
        ? ' bg-green-50 dark:bg-green-950/30 border-l-4 border-l-amber-500'
        : ' bg-red-50 dark:bg-red-950/30 border-l-4 border-l-amber-500';
    } else if (included) {
      base += ' bg-green-50 dark:bg-green-950/20';
    } else {
      base += ' bg-red-50 dark:bg-red-950/20';
    }

    return base;
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 font-medium">
                <button
                  onClick={() => handleSort('zip')}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  Zip Code Pair
                  <SortIcon columnKey="zip" />
                </button>
              </th>
              <th className="text-left p-2 font-medium">
                <button
                  onClick={() => handleSort('city')}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  City
                  <SortIcon columnKey="city" />
                </button>
              </th>
              <th className="text-left p-2 font-medium hidden md:table-cell">
                <button
                  onClick={() => handleSort('county')}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  County
                  <SortIcon columnKey="county" />
                </button>
              </th>
              <th className="text-left p-2 font-medium">
                <button
                  onClick={() => handleSort('state')}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  State
                  <SortIcon columnKey="state" />
                </button>
              </th>
              <th className="text-right p-2 font-medium">
                <button
                  onClick={() => handleSort('distance')}
                  className="flex items-center gap-1 hover:text-primary ml-auto"
                >
                  Distance
                  <SortIcon columnKey="distance" />
                </button>
              </th>
              <th className="text-right p-2 font-medium">
                <button
                  onClick={() => handleSort('driveTime')}
                  className="flex items-center gap-1 hover:text-primary ml-auto"
                >
                  Drive Time
                  <SortIcon columnKey="driveTime" />
                </button>
              </th>
              <th className="text-left p-2 font-medium hidden lg:table-cell">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  Status
                  <SortIcon columnKey="status" />
                </button>
              </th>
              <th className="text-center p-2 font-medium w-20">
                Coverage
              </th>
              <th className="text-center p-2 font-medium w-20">
                Override
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result) => {
              const included = isIncluded(result.classification);
              const overridden = isOverridden(result.classification);

              return (
                <tr key={result.candidateZip.zip} className={getRowClassName(result)}>
                  <td className="p-2 font-mono text-xs">
                    {result.sourceZip.zip} → {result.candidateZip.zip}
                  </td>
                  <td className="p-2">{result.candidateZip.city}</td>
                  <td className="p-2 hidden md:table-cell text-muted-foreground">
                    {result.candidateZip.county || '—'}
                  </td>
                  <td className="p-2">{result.candidateZip.state}</td>
                  <td className="p-2 text-right font-mono">
                    {result.distanceMiles.toFixed(1)} mi
                  </td>
                  <td className="p-2 text-right font-mono">
                    {result.driveTimeMinutes !== null
                      ? `${Math.round(result.driveTimeMinutes)} min`
                      : '—'}
                  </td>
                  <td className="p-2 hidden lg:table-cell text-xs text-muted-foreground">
                    {getStatusLabel(result.classification)}
                  </td>
                  <td className="p-2 text-center">
                    {included ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mx-auto" />
                    )}
                  </td>
                  <td className="p-2 text-center">
                    <Button
                      variant="ghost"
                      size="compact"
                      onClick={() => toggleOverride(result.candidateZip.zip)}
                      title={overridden ? 'Remove override' : 'Toggle coverage'}
                    >
                      {overridden ? (
                        <ToggleRight className="h-5 w-5 text-amber-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
