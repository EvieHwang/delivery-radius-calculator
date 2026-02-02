/**
 * New Search button with confirmation for unsaved overrides.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQuery } from '../context/QueryContext';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export function NewSearchButton() {
  const { results, hasUnsavedOverrides, resetQuery } = useQuery();
  const [showConfirm, setShowConfirm] = useState(false);

  if (results.length === 0) {
    return null;
  }

  const handleClick = () => {
    if (hasUnsavedOverrides) {
      setShowConfirm(true);
    } else {
      resetQuery();
    }
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    resetQuery();
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
        <span className="text-sm">You have unsaved overrides. Discard and start new search?</span>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleConfirm}>
            Discard & Reset
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className="flex items-center gap-2"
    >
      <RotateCcw className="h-4 w-4" />
      New Search
    </Button>
  );
}
