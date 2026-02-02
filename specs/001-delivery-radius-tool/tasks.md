# Task Breakdown: Delivery Radius Tool

**Plan**: [plan.md](./plan.md)
**Created**: 2026-02-01
**Status**: Not Started

## Task Summary

| Phase | Tasks | Completed |
|-------|-------|-----------|
| Phase 1: Data Foundation | 5 | 0 |
| Phase 2: Input & Basic Calculation | 6 | 0 |
| Phase 3: Drive Time Integration | 6 | 0 |
| Phase 4: Results Table | 5 | 0 |
| Phase 5: Map Visualization | 6 | 0 |
| Phase 6: Export & Polish | 7 | 0 |
| **Total** | **35** | **0** |

---

## Phase 1: Data Foundation

### T-1.1: Create Zip Code Download Script

- **Description**: Create Python script to download, parse, and format US zip code data from SimpleMaps or GeoNames into a JSON file suitable for frontend bundling
- **Dependencies**: None
- **Files**:
  - Create: `scripts/download-zipcode-db.py`
- **Acceptance**: Running script produces `frontend/src/data/zipcodes.json` with ~42,000 entries containing zip, city, state, county, lat, lng
- **Status**: [ ] Not Started

### T-1.2: Bundle Zip Database in Frontend

- **Description**: Add the generated zip code JSON to frontend, configure Vite to bundle it efficiently, and create a lookup utility
- **Dependencies**: T-1.1
- **Files**:
  - Create: `frontend/src/data/zipcodes.json`
  - Create: `frontend/src/lib/zipcode-db.ts`
- **Acceptance**: Can import zip database and look up any zip code by string in <1ms
- **Status**: [ ] Not Started

### T-1.3: Implement Haversine Distance Function

- **Description**: Create utility function to calculate great-circle distance between two lat/lng points using haversine formula
- **Dependencies**: None
- **Files**:
  - Create: `frontend/src/lib/haversine.ts`
- **Acceptance**: `haversine(47.6062, -122.3321, 47.6097, -122.3331)` returns correct distance in miles; unit tests pass
- **Status**: [ ] Not Started

### T-1.4: Create TypeScript Type Definitions

- **Description**: Define TypeScript interfaces for all entities: ZipCode, QueryParams, QueryResult, Classification status enum
- **Dependencies**: None
- **Files**:
  - Create: `frontend/src/types/index.ts`
- **Acceptance**: All types exported and importable; matches spec entity definitions
- **Status**: [ ] Not Started

### T-1.5: Write Unit Tests for Distance Calculation

- **Description**: Create test suite for haversine function with known distance pairs
- **Dependencies**: T-1.3
- **Files**:
  - Create: `frontend/src/lib/__tests__/haversine.test.ts`
- **Acceptance**: Tests cover: same point (0), short distance, cross-country distance, edge cases (poles, date line)
- **Status**: [ ] Not Started

---

## Phase 2: Input & Basic Calculation

### T-2.1: Build InputForm Component

- **Description**: Create form component with source zip code input, distance radius field (default 15), and drive time threshold field (default 25)
- **Dependencies**: T-1.4
- **Files**:
  - Create: `frontend/src/components/InputForm.tsx`
- **Acceptance**: Form renders with all fields, validates zip format, prevents submission if invalid
- **Status**: [ ] Not Started

### T-2.2: Add Zip Code Validation and Display

- **Description**: Validate entered zip code against database, display city/state/lat/lng confirmation when valid
- **Dependencies**: T-1.2, T-2.1
- **Files**:
  - Modify: `frontend/src/components/InputForm.tsx`
- **Acceptance**: Valid zip shows "Seattle, WA (47.6062, -122.3321)"; invalid zip shows error message
- **Status**: [ ] Not Started

### T-2.3: Create QueryContext for State Management

- **Description**: Create React context to manage query parameters, results list, loading state, and session cache
- **Dependencies**: T-1.4
- **Files**:
  - Create: `frontend/src/context/QueryContext.tsx`
- **Acceptance**: Context provides query params, results, loading state, and methods to update each
- **Status**: [ ] Not Started

### T-2.4: Implement Classification Logic

- **Description**: Create utility to classify zip codes based on distance thresholds (80%/120%) and drive time
- **Dependencies**: T-1.3, T-1.4
- **Files**:
  - Create: `frontend/src/lib/classification.ts`
- **Acceptance**: Given distance and optional drive time, returns correct classification enum value
- **Status**: [ ] Not Started

### T-2.5: Build Distance Calculation Engine

- **Description**: Create function that takes source zip and radius, returns all zip codes within 120% radius with distances and preliminary classifications
- **Dependencies**: T-1.2, T-1.3, T-2.4
- **Files**:
  - Create: `frontend/src/lib/calculate-radius.ts`
- **Acceptance**: `calculateRadius("98122", 15)` returns array of results with distances; completes in <1 second
- **Status**: [ ] Not Started

### T-2.6: Wire Up Form Submission to Calculation

- **Description**: Connect InputForm submit to calculation engine via QueryContext; display basic results list
- **Dependencies**: T-2.1, T-2.3, T-2.5
- **Files**:
  - Modify: `frontend/src/components/InputForm.tsx`
  - Modify: `frontend/src/context/QueryContext.tsx`
  - Modify: `frontend/src/App.tsx`
- **Acceptance**: Submit form → see list of zip codes with distances; can submit new query
- **Status**: [ ] Not Started

---

## Phase 3: Drive Time Integration

### T-3.1: Create Lambda Drive Time Handler

- **Description**: Create Lambda function that accepts batch of coordinate pairs and returns drive times from OSRM
- **Dependencies**: None
- **Files**:
  - Create: `backend/src/drive_time.py`
  - Modify: `backend/src/handler.py`
- **Acceptance**: POST to /api/drive-times with pairs returns drive times; handles errors gracefully
- **Status**: [ ] Not Started

### T-3.2: Implement OSRM Client

- **Description**: Create Python client to call OSRM API (public router.project-osrm.org) for driving route duration
- **Dependencies**: None
- **Files**:
  - Create: `backend/src/osrm_client.py`
- **Acceptance**: `get_drive_time(lat1, lng1, lat2, lng2)` returns duration in minutes or error
- **Status**: [ ] Not Started

### T-3.3: Add Drive Time API Endpoint to SAM Template

- **Description**: Configure API Gateway route for drive-time endpoint in SAM template
- **Dependencies**: T-3.1
- **Files**:
  - Modify: `template.yaml`
- **Acceptance**: `sam local start-api` exposes /api/drive-times endpoint
- **Status**: [ ] Not Started

### T-3.4: Build Frontend API Client

- **Description**: Create TypeScript client to call backend drive-time API
- **Dependencies**: T-1.4
- **Files**:
  - Create: `frontend/src/lib/api.ts`
- **Acceptance**: `fetchDriveTimes(pairs)` returns array of drive times; handles errors
- **Status**: [ ] Not Started

### T-3.5: Implement Session Drive Time Cache

- **Description**: Add cache to QueryContext that stores drive-time results by coordinate pair; persists across queries within session
- **Dependencies**: T-2.3, T-3.4
- **Files**:
  - Modify: `frontend/src/context/QueryContext.tsx`
- **Acceptance**: Same pair queried twice uses cached value; cache cleared on page refresh
- **Status**: [ ] Not Started

### T-3.6: Integrate Drive Time into Calculation Flow

- **Description**: After distance calculation, identify edge cases (80-120%), call API for drive times, update classifications
- **Dependencies**: T-2.5, T-3.4, T-3.5
- **Files**:
  - Modify: `frontend/src/lib/calculate-radius.ts`
  - Modify: `frontend/src/context/QueryContext.tsx`
- **Acceptance**: Edge-case zip codes show actual drive times; classifications update based on threshold
- **Status**: [ ] Not Started

---

## Phase 4: Results Table

### T-4.1: Build ResultsTable Component

- **Description**: Create table component displaying all result columns: zip pair, city, county, state, distance, drive time, status, coverage
- **Dependencies**: T-1.4, T-2.3
- **Files**:
  - Create: `frontend/src/components/ResultsTable.tsx`
- **Acceptance**: Table renders all columns with correct data; drive time shows "—" when not checked
- **Status**: [ ] Not Started

### T-4.2: Implement Column Sorting

- **Description**: Add click handlers to column headers for sorting; support ascending/descending toggle
- **Dependencies**: T-4.1
- **Files**:
  - Modify: `frontend/src/components/ResultsTable.tsx`
- **Acceptance**: Click any column header → table sorts by that column; click again → reverses order
- **Status**: [ ] Not Started

### T-4.3: Add Color Coding and Override Styling

- **Description**: Apply green/red row styling based on classification; add distinct styling for overridden rows
- **Dependencies**: T-4.1
- **Files**:
  - Modify: `frontend/src/components/ResultsTable.tsx`
- **Acceptance**: In rows are green, out rows are red, overridden rows have border/icon
- **Status**: [ ] Not Started

### T-4.4: Build SummaryBar Component

- **Description**: Create component showing total count, in count, out count, overridden count
- **Dependencies**: T-2.3
- **Files**:
  - Create: `frontend/src/components/SummaryBar.tsx`
- **Acceptance**: Counts display and update in real time when overrides change
- **Status**: [ ] Not Started

### T-4.5: Add Override Toggle Per Row

- **Description**: Add toggle/button to each row allowing user to flip in/out status; update state and styling
- **Dependencies**: T-4.1, T-2.3
- **Files**:
  - Modify: `frontend/src/components/ResultsTable.tsx`
  - Modify: `frontend/src/context/QueryContext.tsx`
- **Acceptance**: Toggle changes classification to "overridden — included/excluded"; summary updates
- **Status**: [ ] Not Started

---

## Phase 5: Map Visualization

### T-5.1: Install and Configure Leaflet

- **Description**: Add react-leaflet and leaflet dependencies; configure CSS imports
- **Dependencies**: None
- **Files**:
  - Modify: `frontend/package.json`
  - Modify: `frontend/src/index.css` (or import in component)
- **Acceptance**: Leaflet map renders without errors in dev server
- **Status**: [ ] Not Started

### T-5.2: Build ResultsMap Component

- **Description**: Create map component that displays OpenStreetMap tiles centered on source zip code
- **Dependencies**: T-5.1, T-2.3
- **Files**:
  - Create: `frontend/src/components/ResultsMap.tsx`
- **Acceptance**: Map displays, centers on source zip, supports zoom/pan
- **Status**: [ ] Not Started

### T-5.3: Display Source Zip Code Marker

- **Description**: Add distinct marker (different color/icon) for source zip code
- **Dependencies**: T-5.2
- **Files**:
  - Modify: `frontend/src/components/ResultsMap.tsx`
- **Acceptance**: Source zip has visually distinct marker (e.g., blue star vs. colored circles)
- **Status**: [ ] Not Started

### T-5.4: Display Candidate Zip Code Markers

- **Description**: Add markers for all candidate zip codes with color coding matching table (green/red)
- **Dependencies**: T-5.2, T-2.3
- **Files**:
  - Modify: `frontend/src/components/ResultsMap.tsx`
- **Acceptance**: All candidates shown; green for in, red for out, distinct style for overridden
- **Status**: [ ] Not Started

### T-5.5: Add Marker Popups with Details

- **Description**: On hover or click, show popup with zip code, city, county, distance, drive time, status
- **Dependencies**: T-5.4
- **Files**:
  - Modify: `frontend/src/components/ResultsMap.tsx`
- **Acceptance**: Click marker → popup shows all relevant details
- **Status**: [ ] Not Started

### T-5.6: Sync Map with Table Overrides

- **Description**: When override toggled in table, update corresponding marker on map in real time
- **Dependencies**: T-5.4, T-4.5
- **Files**:
  - Modify: `frontend/src/components/ResultsMap.tsx`
- **Acceptance**: Toggle in table → marker color changes immediately on map
- **Status**: [ ] Not Started

---

## Phase 6: Export & Polish

### T-6.1: Implement CSV Generation

- **Description**: Create utility to generate CSV string from results array with all required columns
- **Dependencies**: T-1.4
- **Files**:
  - Create: `frontend/src/lib/csv-export.ts`
- **Acceptance**: Generates valid CSV with headers and all data; handles special characters
- **Status**: [ ] Not Started

### T-6.2: Build ExportButtons Component

- **Description**: Create component with "Export included only" and "Export all" buttons that trigger CSV download
- **Dependencies**: T-6.1, T-2.3
- **Files**:
  - Create: `frontend/src/components/ExportButtons.tsx`
- **Acceptance**: Both buttons work; files download with correct naming convention
- **Status**: [ ] Not Started

### T-6.3: Build ProgressIndicator Component

- **Description**: Create component showing processing phase and progress (e.g., "Checking drive times... 12 of 47")
- **Dependencies**: T-2.3
- **Files**:
  - Create: `frontend/src/components/ProgressIndicator.tsx`
- **Acceptance**: Shows phase name; shows count during drive-time lookups; disappears when complete
- **Status**: [ ] Not Started

### T-6.4: Integrate Progress Updates

- **Description**: Update QueryContext and calculation flow to emit progress events; connect to ProgressIndicator
- **Dependencies**: T-6.3, T-3.6
- **Files**:
  - Modify: `frontend/src/context/QueryContext.tsx`
  - Modify: `frontend/src/lib/calculate-radius.ts`
- **Acceptance**: Progress indicator updates in real time during calculation
- **Status**: [ ] Not Started

### T-6.5: Implement New Search Flow

- **Description**: Add "New Search" button; show confirmation if unsaved overrides exist; reset to input form
- **Dependencies**: T-2.3, T-4.5
- **Files**:
  - Create: `frontend/src/components/NewSearchButton.tsx`
  - Modify: `frontend/src/context/QueryContext.tsx`
- **Acceptance**: Button visible; confirmation shows if overrides exist; resets form but preserves cache
- **Status**: [ ] Not Started

### T-6.6: Mobile Responsive Layout

- **Description**: Add responsive styles for phone/tablet: stacked layout, scrollable table, appropriate map sizing
- **Dependencies**: T-4.1, T-5.2
- **Files**:
  - Modify: `frontend/src/App.tsx`
  - Modify: `frontend/src/components/ResultsTable.tsx`
  - Modify: `frontend/src/components/ResultsMap.tsx`
- **Acceptance**: Usable on iPhone/iPad; table scrolls horizontally; map is visible
- **Status**: [ ] Not Started

### T-6.7: End-to-End Testing and README Update

- **Description**: Test full workflow on deployed environment; update README with features and usage
- **Dependencies**: All previous tasks
- **Files**:
  - Modify: `README.md`
- **Acceptance**: Full workflow completes in <5 minutes; README reflects current capabilities
- **Status**: [ ] Not Started

---

## Critical Path

Tasks that block other work and should be prioritized:

1. **T-1.1 → T-1.2** (zip database must exist before lookups)
2. **T-1.3 + T-1.4** (can run in parallel, both needed for T-2.4)
3. **T-2.1 → T-2.2 → T-2.6** (form must work before calculation)
4. **T-3.1 → T-3.3 → T-3.6** (backend must exist before frontend integration)
5. **T-4.1 → T-4.5** (table is core display before map)

## Parallelization Opportunities

Tasks that can be worked on simultaneously:

- **Phase 1**: T-1.3 and T-1.4 can run in parallel (no dependencies)
- **Phase 2**: T-2.1 and T-2.3 can start together
- **Phase 3**: T-3.1/T-3.2/T-3.3 (backend) can run parallel to T-3.4/T-3.5 (frontend prep)
- **Phase 4 + 5**: T-5.1 can start while Phase 4 is in progress
- **Phase 6**: T-6.1, T-6.3 can run in parallel

---

## File Checklist

All files that will be created or modified:

**New Files**:
- [ ] `scripts/download-zipcode-db.py`
- [ ] `frontend/src/data/zipcodes.json`
- [ ] `frontend/src/lib/zipcode-db.ts`
- [ ] `frontend/src/lib/haversine.ts`
- [ ] `frontend/src/lib/__tests__/haversine.test.ts`
- [ ] `frontend/src/lib/classification.ts`
- [ ] `frontend/src/lib/calculate-radius.ts`
- [ ] `frontend/src/lib/api.ts`
- [ ] `frontend/src/lib/csv-export.ts`
- [ ] `frontend/src/types/index.ts`
- [ ] `frontend/src/context/QueryContext.tsx`
- [ ] `frontend/src/components/InputForm.tsx`
- [ ] `frontend/src/components/ResultsTable.tsx`
- [ ] `frontend/src/components/ResultsMap.tsx`
- [ ] `frontend/src/components/SummaryBar.tsx`
- [ ] `frontend/src/components/ProgressIndicator.tsx`
- [ ] `frontend/src/components/ExportButtons.tsx`
- [ ] `frontend/src/components/NewSearchButton.tsx`
- [ ] `backend/src/drive_time.py`
- [ ] `backend/src/osrm_client.py`
- [ ] `backend/tests/test_drive_time.py`

**Modified Files**:
- [ ] `frontend/package.json` (add leaflet dependencies)
- [ ] `frontend/src/App.tsx`
- [ ] `frontend/src/index.css`
- [ ] `backend/src/handler.py`
- [ ] `template.yaml`
- [ ] `README.md`

---

## Progress Log

| Date | Tasks Completed | Notes |
|------|-----------------|-------|
| | | |
