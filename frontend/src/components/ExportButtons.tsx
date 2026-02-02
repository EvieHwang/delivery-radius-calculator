/**
 * Export buttons for downloading results as CSV.
 */

import { Button } from '@/components/ui/button';
import { useQuery } from '../context/QueryContext';
import { generateCSV } from '../lib/csv-export';
import { Download } from 'lucide-react';
import { isIncluded } from '../types';

export function ExportButtons() {
  const { results, params } = useQuery();

  if (results.length === 0) {
    return null;
  }

  const handleExport = (includeAll: boolean) => {
    const dataToExport = includeAll
      ? results
      : results.filter(r => isIncluded(r.classification));

    const csv = generateCSV(dataToExport);

    // Generate filename with source zip and date
    const date = new Date().toISOString().split('T')[0];
    const suffix = includeAll ? 'all' : 'included';
    const filename = `delivery-radius-${params.sourceZip}-${date}-${suffix}.csv`;

    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const includedCount = results.filter(r => isIncluded(r.classification)).length;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport(false)}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Export Included ({includedCount})
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport(true)}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Export All ({results.length})
      </Button>
    </div>
  );
}
