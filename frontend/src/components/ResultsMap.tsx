/**
 * Interactive map displaying delivery radius results.
 */

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useQuery } from '../context/QueryContext';
import { isIncluded, isOverridden } from '../types';
import { getStatusLabel } from '../lib/classification';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue with bundlers
import L from 'leaflet';
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/** Component to fit bounds when results change */
function FitBounds({ results }: { results: Array<{ lat: number; lng: number }> }) {
  const map = useMap();

  useEffect(() => {
    if (results.length > 0) {
      const bounds = L.latLngBounds(results.map(r => [r.lat, r.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [results, map]);

  return null;
}

export function ResultsMap() {
  const { results } = useQuery();

  // Get source zip coordinates
  const sourceCoords = useMemo(() => {
    if (results.length === 0) return null;
    const first = results[0];
    return {
      lat: first.sourceZip.lat,
      lng: first.sourceZip.lng,
      zip: first.sourceZip.zip,
      city: first.sourceZip.city,
      state: first.sourceZip.state
    };
  }, [results]);

  // Get all coordinates for bounds calculation
  const allCoords = useMemo(() => {
    if (!sourceCoords) return [];
    return [
      sourceCoords,
      ...results.map(r => ({
        lat: r.candidateZip.lat,
        lng: r.candidateZip.lng
      }))
    ];
  }, [results, sourceCoords]);

  if (results.length === 0 || !sourceCoords) {
    return null;
  }

  return (
    <div className="rounded-lg border overflow-hidden bg-card">
      <div className="h-[400px] md:h-[500px]">
        <MapContainer
          center={[sourceCoords.lat, sourceCoords.lng]}
          zoom={10}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds results={allCoords} />

          {/* Source zip marker - distinct style */}
          <CircleMarker
            center={[sourceCoords.lat, sourceCoords.lng]}
            radius={12}
            pathOptions={{
              color: '#1e40af',
              fillColor: '#3b82f6',
              fillOpacity: 1,
              weight: 3
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-bold text-blue-600">Source Location</div>
                <div className="font-mono">{sourceCoords.zip}</div>
                <div>{sourceCoords.city}, {sourceCoords.state}</div>
              </div>
            </Popup>
          </CircleMarker>

          {/* Candidate zip markers */}
          {results.map((result) => {
            const included = isIncluded(result.classification);
            const overridden = isOverridden(result.classification);

            // Color based on status
            const fillColor = included ? '#22c55e' : '#ef4444'; // green or red
            const strokeColor = overridden ? '#f59e0b' : (included ? '#16a34a' : '#dc2626');
            const strokeWidth = overridden ? 3 : 2;

            return (
              <CircleMarker
                key={result.candidateZip.zip}
                center={[result.candidateZip.lat, result.candidateZip.lng]}
                radius={6}
                pathOptions={{
                  color: strokeColor,
                  fillColor: fillColor,
                  fillOpacity: 0.7,
                  weight: strokeWidth
                }}
              >
                <Popup>
                  <div className="text-sm space-y-1">
                    <div className="font-mono font-bold">{result.candidateZip.zip}</div>
                    <div>{result.candidateZip.city}, {result.candidateZip.state}</div>
                    {result.candidateZip.county && (
                      <div className="text-muted-foreground">{result.candidateZip.county}</div>
                    )}
                    <div className="pt-1 border-t">
                      <div>Distance: <span className="font-mono">{result.distanceMiles.toFixed(1)} mi</span></div>
                      {result.driveTimeMinutes !== null && (
                        <div>Drive time: <span className="font-mono">{Math.round(result.driveTimeMinutes)} min</span></div>
                      )}
                    </div>
                    <div className={`pt-1 font-medium ${included ? 'text-green-600' : 'text-red-600'}`}>
                      {getStatusLabel(result.classification)}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-2 border-t bg-muted/30 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-700" />
          <span>Source</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-green-600" />
          <span>Included</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-red-600" />
          <span>Excluded</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-amber-500" />
          <span>Overridden</span>
        </div>
      </div>
    </div>
  );
}
