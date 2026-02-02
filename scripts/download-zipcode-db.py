#!/usr/bin/env python3
"""
Download and format US zip code database for frontend bundling.

Data source: GeoNames US Postal Codes (public domain)
https://download.geonames.org/export/zip/

Output: frontend/src/data/zipcodes.json
"""

import json
import os
import urllib.request
import zipfile
from pathlib import Path

# GeoNames US zip codes (public domain, no auth required)
DOWNLOAD_URL = "https://download.geonames.org/export/zip/US.zip"
OUTPUT_DIR = Path(__file__).parent.parent / "frontend" / "src" / "data"
OUTPUT_FILE = OUTPUT_DIR / "zipcodes.json"
TEMP_DIR = Path(__file__).parent / "temp"


def download_and_extract():
    """Download the zip file and extract."""
    TEMP_DIR.mkdir(exist_ok=True)
    zip_path = TEMP_DIR / "US.zip"

    print(f"Downloading from {DOWNLOAD_URL}...")

    # Add user agent to avoid 403
    request = urllib.request.Request(
        DOWNLOAD_URL,
        headers={'User-Agent': 'Mozilla/5.0 (delivery-radius-calculator)'}
    )

    with urllib.request.urlopen(request) as response:
        with open(zip_path, 'wb') as f:
            f.write(response.read())

    print("Extracting...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(TEMP_DIR)

    # GeoNames extracts to US.txt
    txt_path = TEMP_DIR / "US.txt"
    if not txt_path.exists():
        raise FileNotFoundError("US.txt not found in downloaded archive")

    return txt_path


def parse_geonames(txt_path: Path) -> list[dict]:
    """
    Parse GeoNames format.

    GeoNames columns (tab-separated):
    0: country code
    1: postal code
    2: place name (city)
    3: admin name1 (state name)
    4: admin code1 (state code)
    5: admin name2 (county)
    6: admin code2
    7: admin name3
    8: admin code3
    9: latitude
    10: longitude
    11: accuracy
    """
    zipcodes = []
    seen_zips = set()  # Deduplicate

    print(f"Parsing {txt_path}...")
    with open(txt_path, 'r', encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split('\t')
            if len(parts) < 11:
                continue

            zip_code = parts[1]

            # Skip if we've already seen this zip (GeoNames has duplicates for multi-city zips)
            if zip_code in seen_zips:
                continue
            seen_zips.add(zip_code)

            # Skip non-standard zip codes (military, territories, etc.)
            if not zip_code.isdigit() or len(zip_code) != 5:
                continue

            try:
                lat = float(parts[9])
                lng = float(parts[10])
            except ValueError:
                continue

            zipcode = {
                "zip": zip_code,
                "city": parts[2],
                "state": parts[4],  # State code (e.g., "WA")
                "county": parts[5] if len(parts) > 5 else "",
                "lat": lat,
                "lng": lng
            }
            zipcodes.append(zipcode)

    return zipcodes


def write_json(zipcodes: list[dict]):
    """Write zip codes to JSON file."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Sort by zip code for consistent output
    zipcodes.sort(key=lambda z: z["zip"])

    print(f"Writing {len(zipcodes)} zip codes to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(zipcodes, f, separators=(',', ':'))

    # Calculate file size
    size_bytes = OUTPUT_FILE.stat().st_size
    size_mb = size_bytes / (1024 * 1024)
    print(f"Output file size: {size_mb:.2f} MB")


def cleanup():
    """Remove temporary files."""
    import shutil
    if TEMP_DIR.exists():
        shutil.rmtree(TEMP_DIR)
        print("Cleaned up temporary files.")


def main():
    try:
        txt_path = download_and_extract()
        zipcodes = parse_geonames(txt_path)
        write_json(zipcodes)
        print(f"\nSuccess! {len(zipcodes)} zip codes written to {OUTPUT_FILE}")
    finally:
        cleanup()


if __name__ == "__main__":
    main()
