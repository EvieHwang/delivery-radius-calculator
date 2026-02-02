# Technical Plan: Delivery Radius Tool

**Spec**: [spec.md](./spec.md)
**Created**: 2026-02-01
**Status**: Draft

## Architecture Overview

The application follows a frontend-heavy architecture where distance calculations happen entirely client-side using a bundled zip code database. Only drive-time lookups require backend calls, minimizing latency and infrastructure costs.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ Input Form  │  │ Results Table│  │    Map (Leaflet)        │ │
│  │             │  │ (sortable)   │  │                         │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
│         │                │                      │               │
│         ▼                ▼                      ▼               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              State Management (React Context)               ││
│  │  - Query params    - Results list    - Override state       ││
│  │  - Drive-time cache (session)                               ││
│  └─────────────────────────────────────────────────────────────┘│
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │           Calculation Engine (client-side)                  ││
│  │  - Haversine distance (bundled zip database)                ││
│  │  - Classification logic (80%/120% thresholds)               ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ POST /api/drive-times
                              │ (only for 80-120% band)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (AWS Lambda)                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Drive Time Handler                             ││
│  │  - Receives batch of zip code pairs                         ││
│  │  - Calls OSRM for each pair                                 ││
│  │  - Returns drive times                                      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OSRM (OpenStreetMap Routing)                  │
│                    Public: router.project-osrm.org               │
│                    (or self-hosted for production)               │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
delivery-radius-calculator/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui (existing)
│   │   │   ├── InputForm.tsx          # Source zip + params
│   │   │   ├── ResultsTable.tsx       # Sortable, color-coded table
│   │   │   ├── ResultsMap.tsx         # Leaflet map display
│   │   │   ├── ProgressIndicator.tsx  # Processing status
│   │   │   ├── ExportButtons.tsx      # CSV export options
│   │   │   └── SummaryBar.tsx         # Counts display
│   │   ├── lib/
│   │   │   ├── haversine.ts           # Distance calculation
│   │   │   ├── classification.ts      # In/out logic
│   │   │   ├── csv-export.ts          # CSV generation
│   │   │   └── api.ts                 # Backend API client
│   │   ├── data/
│   │   │   └── zipcodes.json          # Bundled zip database
│   │   ├── context/
│   │   │   └── QueryContext.tsx       # App state + cache
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── public/
├── backend/
│   ├── src/
│   │   ├── handler.py                 # Lambda entry point
│   │   ├── drive_time.py              # OSRM integration
│   │   └── utils/
│   │       └── secrets.py             # (existing)
│   └── tests/
│       └── test_drive_time.py
├── scripts/
│   └── download-zipcode-db.py         # Fetch zip data at build
├── specs/
│   └── 001-delivery-radius-tool/
└── template.yaml                       # SAM template
```

## Technology Choices

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Frontend Framework | React 18 + TypeScript | Already in template, component reusability |
| UI Components | shadcn/ui + Tailwind | Already in template, consistent design |
| Map Library | Leaflet + react-leaflet | Lightweight, OSM-native, well-documented |
| Distance Calculation | Client-side haversine | No latency, no API costs, simple math |
| Zip Code Database | Bundled JSON (~3MB) | Fast lookups, no runtime dependency |
| Routing Service | OSRM (public or self-hosted) | Free, OSM-based, fast responses |
| Backend | Python Lambda | Already in template, simple OSRM proxy |
| State Management | React Context | Sufficient for single-page app |
| CSV Export | Client-side generation | No backend needed, instant download |

## Data Sources

### Zip Code Database

**Source**: [SimpleMaps US Zip Codes](https://simplemaps.com/data/us-zips) (free tier) or [GeoNames](https://www.geonames.org/)

**Required fields**:
- `zip` - 5-digit zip code
- `city` - City name
- `state_id` - 2-letter state code
- `county_name` - County name
- `lat` - Latitude (centroid)
- `lng` - Longitude (centroid)

**Size**: ~42,000 zip codes, ~3MB JSON (gzipped: ~500KB)

**Integration**: Downloaded during build, bundled in frontend

### Zip Code Polygons (Optional Enhancement)

**Source**: [US Census TIGER/Line](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html)

**Format**: GeoJSON or TopoJSON

**Size**: ~150MB raw, ~15MB TopoJSON (may need tiling strategy)

**Decision**: Start with point markers; add polygons as future enhancement if needed

## Implementation Phases

### Phase 1: Data Foundation

**Goal**: Establish zip code database and distance calculation

- [ ] Create script to download and format zip code data
- [ ] Bundle zip database in frontend (JSON)
- [ ] Implement haversine distance function
- [ ] Create TypeScript types for all entities
- [ ] Write unit tests for distance calculation

**Verification**: Can calculate distance between any two zip codes client-side in <10ms

---

### Phase 2: Input & Basic Calculation

**Goal**: Working input form with distance-based results (no drive time yet)

- [ ] Build InputForm component with validation
- [ ] Implement zip code lookup/autocomplete
- [ ] Create QueryContext for state management
- [ ] Build classification logic (80%/120% thresholds)
- [ ] Generate initial results list (distance only)

**Verification**: Enter zip code, see list of nearby zip codes with distances and preliminary classifications

---

### Phase 3: Drive Time Integration

**Goal**: Backend API for OSRM calls, integrated with frontend

- [ ] Create Lambda handler for drive-time batch requests
- [ ] Implement OSRM client in Python
- [ ] Build frontend API client
- [ ] Implement session-scoped drive-time cache
- [ ] Update classification with actual drive times

**Verification**: Edge-case zip codes get drive-time lookups; results show actual drive times

---

### Phase 4: Results Table

**Goal**: Full-featured sortable, color-coded results table

- [ ] Build ResultsTable component with all columns
- [ ] Implement column sorting
- [ ] Add color coding (green/red/override styling)
- [ ] Build SummaryBar with counts
- [ ] Add override toggle per row

**Verification**: Table displays all results with sorting, color coding, and working overrides

---

### Phase 5: Map Visualization

**Goal**: Interactive map showing results geographically

- [ ] Integrate Leaflet with react-leaflet
- [ ] Display source zip code marker (distinct style)
- [ ] Display candidate zip codes as markers
- [ ] Color-code markers matching table
- [ ] Add hover/click popups with details
- [ ] Sync map with table overrides

**Verification**: Map shows geographic distribution; clicking table row highlights on map

---

### Phase 6: Export & Polish

**Goal**: CSV export, progress indicator, new search flow

- [ ] Implement CSV generation (included only / all)
- [ ] Build ProgressIndicator component
- [ ] Add progress updates during drive-time phase
- [ ] Implement "New Search" with confirmation
- [ ] Mobile responsive layout adjustments
- [ ] End-to-end testing

**Verification**: Full workflow completes in under 5 minutes; exports work correctly

---

## API Design

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/drive-times | Get drive times for batch of zip code pairs |

### Request/Response Examples

```json
// POST /api/drive-times
// Request
{
  "pairs": [
    {"source_lat": 47.6062, "source_lng": -122.3321, "dest_lat": 47.6097, "dest_lng": -122.3331},
    {"source_lat": 47.6062, "source_lng": -122.3321, "dest_lat": 47.6205, "dest_lng": -122.3493}
  ]
}

// Response
{
  "results": [
    {"index": 0, "drive_time_minutes": 8.5, "status": "ok"},
    {"index": 1, "drive_time_minutes": 12.3, "status": "ok"}
  ],
  "errors": []
}

// Error response for individual pair
{
  "results": [
    {"index": 0, "drive_time_minutes": null, "status": "error", "message": "No route found"}
  ]
}
```

## Data Flow

1. **User enters source zip + parameters** → InputForm validates against bundled database
2. **Submit triggers calculation** → QueryContext initiates processing
3. **Distance calculation runs** → All zip codes within 120% radius identified (client-side, fast)
4. **Classification pass 1** → Zip codes <80% marked "in — distance confirmed"
5. **Edge cases identified** → Zip codes 80-120% queued for drive-time lookup
6. **Drive-time API called** → Lambda batches OSRM requests
7. **Classification pass 2** → Edge cases classified based on drive time
8. **Results displayed** → Table and map render synchronized state
9. **User overrides** → State updated, visuals sync
10. **Export** → CSV generated from current state

## Deployment Strategy

1. **Build**:
   - Download zip code database: `python scripts/download-zipcode-db.py`
   - Build frontend: `npm run build`
   - Build backend: `sam build`

2. **Test**:
   - Unit tests: `npm test && pytest`
   - Integration test: Local SAM + frontend dev server

3. **Deploy**:
   - `sam deploy` (backend + infrastructure)
   - `npm run build && aws s3 sync` (frontend)
   - CloudFront invalidation

4. **Verify**:
   - Hit deployed URL
   - Test with known zip code (98122 → Seattle)
   - Verify drive-time lookups work

## Rollback Points

Safe stopping points where the system remains functional:

1. **After Phase 2**: App shows distance-based results (no drive times)
2. **After Phase 4**: Full table with manual classification (drive times informational)
3. **After Phase 5**: Complete feature set without export/polish

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OSRM public server rate limits | Medium | High | Plan for self-hosted OSRM if needed; batch requests |
| Zip database missing entries | Low | Medium | Use comprehensive source (SimpleMaps has 42k entries) |
| Large polygon files slow map | Medium | Medium | Start with points; add polygons later with tiling |
| Drive-time lookup timeout | Low | Medium | Set reasonable timeout; allow retry; show partial results |
| Mobile layout complexity | Medium | Low | Stacked layout; table horizontal scroll |

## Open Questions

- [x] ~~Use public OSRM or self-host?~~ Start with public; self-host if rate limited
- [x] ~~Polygon data source?~~ Defer to future phase; points are acceptable
- [ ] Batch size for OSRM calls? (suggest: 10 parallel, avoid overwhelming server)
- [ ] Need loading skeleton for initial zip database load? (~500KB gzipped)
