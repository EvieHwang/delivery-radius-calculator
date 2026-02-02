/**
 * Summary bar showing result counts.
 */

import { useQuery } from '../context/QueryContext';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export function SummaryBar() {
  const { summary, results } = useQuery();

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium">Total:</span>
        <span className="font-mono">{summary.total.toLocaleString()}</span>
      </div>

      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4" />
        <span className="font-medium">Included:</span>
        <span className="font-mono">{summary.included.toLocaleString()}</span>
      </div>

      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
        <XCircle className="h-4 w-4" />
        <span className="font-medium">Excluded:</span>
        <span className="font-mono">{summary.excluded.toLocaleString()}</span>
      </div>

      {summary.overridden > 0 && (
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <RefreshCw className="h-4 w-4" />
          <span className="font-medium">Overridden:</span>
          <span className="font-mono">{summary.overridden}</span>
        </div>
      )}
    </div>
  );
}
