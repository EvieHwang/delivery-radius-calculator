# Delivery Radius Calculator

A web-based tool that enables supply chain operations staff to determine which zip codes fall within a deliverable radius of a source location. Reduces the per-client delivery zone calculation from ~2 hours to under 5 minutes.

## Features

- **Distance-based search**: Enter a source zip code and find all zip codes within your specified radius
- **Smart drive time checking**: Only checks actual drive times for edge cases (80-120% of radius), minimizing API calls
- **Interactive results table**: Sortable, color-coded table showing all candidate zip codes with distance, drive time, and status
- **Manual overrides**: Toggle any zip code between included/excluded to apply local knowledge
- **Interactive map**: Visualize results geographically with color-coded markers
- **CSV export**: Download results as CSV (included only or all with status)
- **Session caching**: Drive time results are cached for faster repeat queries
- **Mobile responsive**: Works on phone, tablet, and desktop

## How It Works

1. **Enter parameters**: Source zip code, distance radius (default 15 miles), drive time threshold (default 25 minutes)
2. **Distance calculation**: All zip codes within 120% of radius are found using bundled GeoNames database
3. **Classification**:
   - < 80% of radius: Automatically included ("in — distance confirmed")
   - 80-120% of radius: Drive time checked via OSRM routing
   - > 120% of radius: Not included
4. **Review & adjust**: Use the table and map to review results and make manual overrides
5. **Export**: Download CSV for use in downstream business processes

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui, Leaflet maps
- **Backend**: Python 3.12, AWS Lambda, API Gateway
- **Data**: GeoNames US zip code database (bundled), OSRM for drive times
- **Infrastructure**: AWS SAM, CloudFront, S3
- **CI/CD**: GitHub Actions

## Local Development

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && pip install -r requirements.txt

# Download zip code database (run once)
python scripts/download-zipcode-db.py

# Run frontend dev server
cd frontend && npm run dev

# Run backend locally (requires SAM CLI)
sam local start-api
```

## Deployment

Merging a PR to `main` triggers automatic deployment:

1. **CI** runs lint, tests, security scans (on PR)
2. **You approve and merge** the PR (your deploy gate)
3. **Deploy** runs SAM deploy and syncs frontend to S3
4. **CloudFront** cache is invalidated

After deployment, the app is available at `https://delivery-radius-calculator.evehwang.com`

## Project Structure

```
delivery-radius-calculator/
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── InputForm.tsx   # Source zip + parameters
│   │   │   ├── ResultsTable.tsx # Sortable results table
│   │   │   ├── ResultsMap.tsx  # Leaflet map
│   │   │   └── ...
│   │   ├── context/            # React context for state
│   │   ├── lib/                # Utilities (haversine, classification, etc.)
│   │   ├── data/               # Bundled zip code database
│   │   └── types/              # TypeScript definitions
│   └── ...
├── backend/
│   ├── src/
│   │   ├── handler.py          # Lambda handler
│   │   └── osrm_client.py      # OSRM routing client
│   └── ...
├── scripts/
│   └── download-zipcode-db.py  # Fetch zip code data
├── specs/
│   └── 001-delivery-radius-tool/ # Feature specification
└── template.yaml               # SAM template
```

## Data Sources

- **Zip codes**: [GeoNames](https://www.geonames.org/) (public domain, ~41,000 US zip codes)
- **Drive times**: [OSRM](https://project-osrm.org/) (OpenStreetMap routing)
- **Map tiles**: OpenStreetMap

## Cost Guardrails

- Uses OSRM public demo server (consider self-hosting for production)
- Drive time checks only for edge cases (80-120% band)
- Session caching reduces redundant API calls
- No always-on compute resources

## License

MIT
