/**
 * Progress indicator for calculation phases.
 */

import { useQuery } from '../context/QueryContext';
import { Loader2, MapPin, Car } from 'lucide-react';

export function ProgressIndicator() {
  const { progress, isLoading } = useQuery();

  if (!isLoading && progress.phase === 'idle') {
    return null;
  }

  if (progress.phase === 'complete') {
    return null;
  }

  const getIcon = () => {
    switch (progress.phase) {
      case 'calculating_distances':
        return <MapPin className="h-5 w-5" />;
      case 'checking_drive_times':
        return <Car className="h-5 w-5" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin" />;
    }
  };

  const getPhaseLabel = () => {
    switch (progress.phase) {
      case 'calculating_distances':
        return 'Calculating distances...';
      case 'checking_drive_times':
        return 'Checking drive times...';
      default:
        return 'Processing...';
    }
  };

  const percentage = progress.totalItems > 0
    ? Math.round((progress.currentItem / progress.totalItems) * 100)
    : 0;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="text-primary">
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{getPhaseLabel()}</span>
            {progress.totalItems > 0 && (
              <span className="text-sm text-muted-foreground">
                {progress.currentItem.toLocaleString()} of {progress.totalItems.toLocaleString()}
              </span>
            )}
          </div>
          {progress.totalItems > 0 && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          )}
          {progress.message && (
            <p className="mt-1 text-xs text-muted-foreground">{progress.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
