"""
OSRM client for drive time calculations.

Uses the public OSRM demo server (router.project-osrm.org) for routing.
For production use, consider self-hosting OSRM.
"""

import json
import time
import urllib.error
import urllib.request

# OSRM public demo server
OSRM_BASE_URL = "https://router.project-osrm.org"

# Request timeout in seconds
REQUEST_TIMEOUT = 10

# Minimum delay between requests to avoid rate limiting
MIN_REQUEST_DELAY = 0.1


def get_drive_time(
    source_lat: float,
    source_lng: float,
    dest_lat: float,
    dest_lng: float
) -> float | None:
    """
    Get the drive time between two points using OSRM.

    Args:
        source_lat: Source latitude
        source_lng: Source longitude
        dest_lat: Destination latitude
        dest_lng: Destination longitude

    Returns:
        Drive time in minutes, or None if route not found/error occurred
    """
    # OSRM uses lng,lat order
    url = (
        f"{OSRM_BASE_URL}/route/v1/driving/"
        f"{source_lng},{source_lat};{dest_lng},{dest_lat}"
        f"?overview=false"
    )

    try:
        request = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'delivery-radius-calculator/1.0'
            }
        )

        with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT) as response:
            data = json.loads(response.read().decode('utf-8'))

            if data.get('code') != 'Ok':
                return None

            routes = data.get('routes', [])
            if not routes:
                return None

            # Duration is in seconds, convert to minutes
            duration_seconds = routes[0].get('duration', 0)
            return duration_seconds / 60.0

    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError, TimeoutError) as e:
        print(f"OSRM request failed: {e}")
        return None


def get_drive_times_batch(
    pairs: list[dict]
) -> list[dict]:
    """
    Get drive times for multiple coordinate pairs.

    Args:
        pairs: List of dicts with source_lat, source_lng, dest_lat, dest_lng

    Returns:
        List of dicts with index, drive_time_minutes, status, message
    """
    results = []

    for i, pair in enumerate(pairs):
        drive_time = get_drive_time(
            pair['source_lat'],
            pair['source_lng'],
            pair['dest_lat'],
            pair['dest_lng']
        )

        if drive_time is not None:
            results.append({
                'index': i,
                'drive_time_minutes': round(drive_time, 1),
                'status': 'ok'
            })
        else:
            results.append({
                'index': i,
                'drive_time_minutes': None,
                'status': 'error',
                'message': 'No route found or request failed'
            })

        # Small delay to avoid rate limiting
        if i < len(pairs) - 1:
            time.sleep(MIN_REQUEST_DELAY)

    return results
