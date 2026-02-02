/**
 * Input form for delivery radius query parameters.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useQuery } from '../context/QueryContext';
import { getZipCode, formatZipCodeLocation } from '../lib/zipcode-db';
import { MapPin, Ruler, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export function InputForm() {
  const { params, setParams, runQuery, isLoading } = useQuery();
  const [zipError, setZipError] = useState<string | null>(null);
  const [validatedZip, setValidatedZip] = useState<{
    zip: string;
    location: string;
    lat: number;
    lng: number;
  } | null>(null);

  // Validate zip code as user types
  useEffect(() => {
    const zip = params.sourceZip.trim();

    if (zip.length === 0) {
      setZipError(null);
      setValidatedZip(null);
      return;
    }

    if (!/^\d{5}$/.test(zip)) {
      setZipError('Please enter a 5-digit zip code');
      setValidatedZip(null);
      return;
    }

    const zipData = getZipCode(zip);
    if (!zipData) {
      setZipError('Zip code not found in database');
      setValidatedZip(null);
      return;
    }

    setZipError(null);
    setValidatedZip({
      zip: zipData.zip,
      location: formatZipCodeLocation(zipData),
      lat: zipData.lat,
      lng: zipData.lng
    });
  }, [params.sourceZip]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatedZip && !isLoading) {
      runQuery();
    }
  };

  const canSubmit = validatedZip !== null && !isLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Delivery Radius Calculator
        </CardTitle>
        <CardDescription>
          Enter a source zip code to find all zip codes within your delivery area
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Source Zip Code */}
          <div className="space-y-2">
            <label htmlFor="sourceZip" className="text-sm font-medium flex items-center gap-1">
              Source Zip Code
            </label>
            <div className="flex gap-2">
              <Input
                id="sourceZip"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={5}
                placeholder="e.g., 98122"
                value={params.sourceZip}
                onChange={(e) => setParams({ sourceZip: e.target.value.replace(/\D/g, '') })}
                className={zipError ? 'border-destructive' : validatedZip ? 'border-green-500' : ''}
              />
            </div>
            {zipError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {zipError}
              </p>
            )}
            {validatedZip && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {validatedZip.location} ({validatedZip.lat.toFixed(4)}, {validatedZip.lng.toFixed(4)})
              </p>
            )}
          </div>

          {/* Distance Radius */}
          <div className="space-y-2">
            <label htmlFor="radius" className="text-sm font-medium flex items-center gap-1">
              <Ruler className="h-4 w-4" />
              Distance Radius (miles)
            </label>
            <Input
              id="radius"
              type="number"
              min={1}
              max={100}
              step={1}
              value={params.distanceRadiusMiles}
              onChange={(e) => setParams({ distanceRadiusMiles: parseInt(e.target.value) || 15 })}
            />
            <p className="text-xs text-muted-foreground">
              Zip codes within 80% of this radius are automatically included.
              Edge cases (80-120%) are checked by drive time.
            </p>
          </div>

          {/* Drive Time Threshold */}
          <div className="space-y-2">
            <label htmlFor="driveTime" className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Drive Time Threshold (minutes)
            </label>
            <Input
              id="driveTime"
              type="number"
              min={5}
              max={120}
              step={5}
              value={params.driveTimeThresholdMinutes}
              onChange={(e) => setParams({ driveTimeThresholdMinutes: parseInt(e.target.value) || 25 })}
            />
            <p className="text-xs text-muted-foreground">
              Edge cases with drive time below this threshold are included.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {isLoading ? 'Calculating...' : 'Calculate Delivery Radius'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
