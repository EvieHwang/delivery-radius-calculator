# Feature Specification: Delivery Radius Tool

**Feature Branch**: `001-delivery-radius-tool`
**Created**: 2026-02-01
**Status**: Ready for Implementation
**Input**: `docs/spec.md`

## Overview

A web-based tool that enables supply chain operations staff to determine which zip codes fall within a deliverable radius of a source location. The tool replaces a manual, per-client process that currently takes approximately two hours per client and creates a bottleneck in the client onboarding workflow.

**Key insight**: By using a tiered approach—fast distance calculation from a bundled database for all zip codes, with drive-time lookups only for edge cases in the 80-120% boundary zone—we minimize API costs while maintaining accuracy where it matters most.

---

## User Scenarios & Testing

### US-1: Enter Source Parameters (Priority: P1)

**As an** operations team member,
**I want to** enter a source zip code and see editable default values for distance radius and drive time threshold,
**So that** I can confirm or adjust the delivery parameters before the system begins calculating.

**Why this priority**: This is the entry point for all functionality—nothing works without it.

**Independent Test**: Enter zip code "98122" with default parameters and verify the system accepts it and displays "Seattle, WA" as confirmation. Change the distance to 25 miles, resubmit, and verify the results reflect the wider radius.

**Acceptance Scenarios**:

1. **Given** the input form is displayed, **When** I enter a valid 5-digit zip code, **Then** the system validates it against the database and shows city/state confirmation
2. **Given** an invalid zip code is entered, **When** I submit, **Then** a clear error message is displayed
3. **Given** default values are shown (15 miles, 25 minutes), **When** I modify them, **Then** the calculation uses my custom values

---

### US-2: Calculate Zip Codes Within Distance Radius (Priority: P1)

**As an** operations team member,
**I want** the system to identify all zip codes whose geographic center is within 120% of my stated distance radius from the source zip code,
**So that** I can see both the zip codes clearly within range and those in the boundary zone that may or may not be reachable.

**Why this priority**: Core calculation logic—foundation for all results.

**Independent Test**: Enter a source zip code with a 15-mile radius. Verify that results include zip codes up to approximately 18 miles away. Confirm that a zip code at 19+ miles is not included.

**Acceptance Scenarios**:

1. **Given** a source zip code and 15-mile radius, **When** calculation runs, **Then** all zip codes within 18 miles (120%) are included
2. **Given** calculation completes, **When** I view results, **Then** each zip code shows its calculated distance from source
3. **Given** the bundled database, **When** distance is calculated, **Then** haversine formula is used on centroid lat/long

---

### US-3: Filter by Drive Time for Edge Cases (Priority: P1)

**As an** operations team member,
**I want** the system to check actual drive time only for zip codes near the distance boundary,
**So that** we accurately classify edge cases without spending API calls on zip codes that are obviously in or obviously out.

**Why this priority**: Critical for accuracy in boundary cases while controlling costs.

**Independent Test**: For a source zip code in a mountainous or water-adjacent area, verify that some zip codes within the 80-120% distance band are correctly excluded due to drive time exceeding 25 minutes, while others in that band are included.

**Acceptance Scenarios**:

1. **Given** a zip code within 80% of radius (e.g., <12 miles for 15-mile radius), **When** classified, **Then** it is "in — distance confirmed" with no drive-time lookup
2. **Given** a zip code between 80-120% of radius, **When** classified, **Then** OSRM drive time is checked
3. **Given** drive time exceeds threshold for edge-case zip, **When** classified, **Then** it is "out — drive time exceeded"
4. **Given** drive time is within threshold for edge-case zip, **When** classified, **Then** it is "in — drive time confirmed"

---

### US-4: Display Results in a Sortable, Color-Coded Table (Priority: P1)

**As an** operations team member,
**I want to** see all candidate zip codes in a sortable, color-coded table that clearly shows which zip codes are in the coverage area and which are outside it,
**So that** I can quickly assess the results and identify any that need manual adjustment.

**Why this priority**: Primary interface for reviewing results.

**Independent Test**: Run a query and verify that the table is populated with color-coded rows. Sort by distance and verify the order changes. Sort by status and verify grouping. Confirm the summary counts match the visible rows.

**Acceptance Scenarios**:

1. **Given** results are displayed, **When** I view the table, **Then** I see columns: zip pair, city, county/metro, state, distance, drive time (or "—"), status, coverage indicator
2. **Given** the table, **When** I click a column header, **Then** the table sorts by that column
3. **Given** included zip codes, **When** displayed, **Then** they have green color coding
4. **Given** excluded zip codes, **When** displayed, **Then** they have red color coding
5. **Given** results, **When** I view the summary, **Then** I see total/in/out/overridden counts

---

### US-5: Override Coverage Decisions (Priority: P2)

**As an** operations team member,
**I want to** manually override the system's classification for any zip code,
**So that** I can apply my local knowledge of the area to correct for situations the automated logic doesn't capture.

**Why this priority**: Important for real-world usability but not core calculation.

**Independent Test**: Run a query. Find a red (excluded) zip code, override it to included, and verify it turns green with an override indicator. Find a green (included) zip code, override it to excluded, and verify the reverse. Confirm the summary counts update.

**Acceptance Scenarios**:

1. **Given** any row in results, **When** I toggle the override control, **Then** the status changes to "overridden — included" or "overridden — excluded"
2. **Given** an overridden zip code, **When** displayed, **Then** it has distinct visual treatment (border/icon)
3. **Given** overrides are made, **When** I view summary, **Then** counts update in real time

---

### US-6: Display Results on a Map (Priority: P2)

**As an** operations team member,
**I want to** see the included and excluded zip codes displayed on a map,
**So that** I can visually validate the delivery area and spot any obvious gaps or inclusions that don't make sense geographically.

**Why this priority**: Visual validation is valuable but table provides core functionality.

**Independent Test**: Run a query, verify the map shows a geographic cluster of green markers/polygons around the source with red ones at the periphery. Toggle a zip code in the table and verify the map updates.

**Acceptance Scenarios**:

1. **Given** results, **When** map displays, **Then** source zip is visually distinct from candidates
2. **Given** polygon data available, **When** displayed, **Then** zip codes show as filled polygons; otherwise as point markers
3. **Given** a zip code on the map, **When** I hover/click, **Then** I see its details (zip, city, distance, status)
4. **Given** I toggle a zip in the table, **When** I view map, **Then** it updates accordingly

---

### US-7: Export Results to CSV (Priority: P2)

**As an** operations team member,
**I want to** download the results as a CSV file,
**So that** I can use the results in downstream business processes.

**Why this priority**: Essential for integration with existing workflows.

**Independent Test**: Run a query, make some overrides, export "included only" and verify only in-status zip codes appear. Export "all" and verify every displayed zip code appears with correct status.

**Acceptance Scenarios**:

1. **Given** results displayed, **When** I click "Export included only", **Then** CSV downloads with only in-status zips
2. **Given** results displayed, **When** I click "Export all", **Then** CSV downloads with all zips and status column
3. **Given** export, **When** file downloads, **Then** filename includes source zip and date (e.g., `delivery-radius-98122-2026-02-01.csv`)

---

### US-8: Processing Progress Indicator (Priority: P2)

**As an** operations team member,
**I want to** see a progress indicator while the system is calculating results,
**So that** I know the tool is working and can estimate how long the process will take.

**Why this priority**: UX polish for longer operations.

**Independent Test**: Submit a query and verify that the progress indicator appears, updates during drive-time lookups, and disappears when results are displayed.

**Acceptance Scenarios**:

1. **Given** query submitted, **When** processing, **Then** progress indicator shows current phase
2. **Given** drive-time lookups in progress, **When** displayed, **Then** shows "Checking drive times... (12 of 47)"
3. **Given** processing completes, **When** results ready, **Then** indicator is replaced by results

---

### US-9: Cache Results for Faster Repeat Queries (Priority: P3)

**As an** operations team member,
**I want** the system to cache previously calculated results during my session,
**So that** repeat or similar queries complete faster without redundant drive-time lookups.

**Why this priority**: Performance optimization, not core functionality.

**Independent Test**: Run a query for zip code "98122" with a 15-mile radius. Note the processing time. Change the radius to 20 miles and resubmit. Verify that the second query completes faster because previously checked drive times are reused.

**Acceptance Scenarios**:

1. **Given** a drive-time lookup completed, **When** same pair queried again, **Then** cached result is used
2. **Given** session cache, **When** browser closed, **Then** cache is cleared
3. **Given** different source zip, **When** overlapping pairs exist in cache, **Then** they are reused

---

### US-10: Start a New Search (Priority: P2)

**As an** operations team member,
**I want** a clearly visible "New Search" button that resets the screen to the initial input form,
**So that** I can quickly move on to the next client without refreshing the browser.

**Why this priority**: Essential workflow support.

**Independent Test**: Run a query, make some overrides, click "New Search," confirm the prompt, and verify the screen resets to the input form with defaults. Run a second query and verify the session cache speeds up overlapping drive-time lookups.

**Acceptance Scenarios**:

1. **Given** results displayed, **When** I click "New Search", **Then** confirmation prompt appears if overrides exist
2. **Given** I confirm reset, **When** form displays, **Then** fields show defaults with empty zip code
3. **Given** reset, **When** I run new query, **Then** drive-time cache from prior queries is preserved

---

### Edge Cases

- **Water/mountain barriers**: Zip codes may be close by distance but unreachable by road—drive time check catches these
- **Polygon data unavailable**: Fall back to point markers on map gracefully
- **OSRM timeout or error**: Display error state for affected zip codes, allow retry
- **Very dense urban area**: May have many zip codes in boundary zone; progress indicator essential
- **Zip code at exact boundary**: 80% and 120% thresholds handled consistently (80% exclusive, 120% inclusive for lookup eligibility)

---

## Requirements

### Functional Requirements

**Input & Validation**

- **FR-001**: System MUST accept a 5-digit US zip code as source input
- **FR-002**: System MUST validate zip code against bundled database
- **FR-003**: System MUST display city, state, lat/long for confirmed source zip
- **FR-004**: System MUST provide editable distance radius field (default: 15 miles)
- **FR-005**: System MUST provide editable drive time threshold field (default: 25 minutes)

**Distance Calculation**

- **FR-006**: System MUST calculate haversine distance from source to all candidate zip codes
- **FR-007**: System MUST include all zip codes within 120% of specified radius
- **FR-008**: System MUST use bundled zip code database (no external API for distance)

**Drive Time Classification**

- **FR-009**: System MUST classify zip codes <80% radius as "in — distance confirmed" without drive-time lookup
- **FR-010**: System MUST perform OSRM drive-time lookup for zip codes between 80-120% of radius
- **FR-011**: System MUST classify based on drive time vs. threshold for edge-case zip codes

**Results Display**

- **FR-012**: System MUST display results in sortable table with specified columns
- **FR-013**: System MUST color-code rows (green=in, red=out)
- **FR-014**: System MUST show summary counts (total, in, out, overridden)
- **FR-015**: System MUST allow sorting by any column

**Overrides**

- **FR-016**: System MUST allow toggling any zip code between in/out
- **FR-017**: System MUST visually distinguish overridden zip codes
- **FR-018**: System MUST update summary counts on override

**Map**

- **FR-019**: System MUST display interactive map with zoom/pan
- **FR-020**: System MUST show source zip distinctly from candidates
- **FR-021**: System MUST sync map with table state (including overrides)
- **FR-022**: System SHOULD display zip code polygons if data available; MUST fall back to points

**Export**

- **FR-023**: System MUST provide "Export included only" option
- **FR-024**: System MUST provide "Export all" option with status column
- **FR-025**: System MUST name files with source zip and date

**Session Management**

- **FR-026**: System MUST cache drive-time results for session duration
- **FR-027**: System MUST provide "New Search" button visible from results
- **FR-028**: System MUST prompt before clearing results with unsaved overrides

---

### Non-Functional Requirements

- **NFR-001**: Distance calculation SHOULD complete within 3 seconds
- **NFR-002**: Drive-time lookups SHOULD complete within 60 seconds for typical 50-150 edge cases
- **NFR-003**: System MUST be mobile responsive (phone and tablet usable)
- **NFR-004**: System MUST work on Chrome, Firefox, Safari, Edge (desktop and mobile)
- **NFR-005**: System MUST NOT persist data between sessions unless exported

---

### Key Entities

**ZipCode**
- zip_code (string, 5 digits, primary key)
- city (string)
- state (string, 2-letter code)
- county (string)
- latitude (decimal)
- longitude (decimal)

**QueryResult**
- source_zip (ZipCode reference)
- candidate_zip (ZipCode reference)
- distance_miles (decimal)
- drive_time_minutes (decimal, nullable)
- classification (enum: in_distance, in_drive_time, out_drive_time, overridden_in, overridden_out)

**QueryParameters**
- source_zip (string)
- distance_radius_miles (decimal, default 15)
- drive_time_threshold_minutes (integer, default 25)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: A new client's delivery radius can be determined in under 5 minutes (vs. current ~2 hours)
- **SC-002**: Drive-time API calls are limited to zip codes in 80-120% distance band only
- **SC-003**: Operator can complete full workflow without technical knowledge
- **SC-004**: Results are exportable and immediately usable in downstream processes
- **SC-005**: Tool works standalone—no internal system access required

---

## Assumptions

- Comprehensive US zip code database is freely available (census.gov, GeoNames, or similar)
- OpenStreetMap routing via OSRM is available (self-hosted or public instance)
- 15-mile / 25-minute defaults are standard but adjustable per query
- Small number of internal users (not public-facing scale)
- Standalone utility, not part of larger platform
- Polygon data may not be available; point markers are acceptable fallback

---

## Out of Scope (Future Considerations)

- Multi-source queries (multiple origin zip codes in one session)
- Batch processing of sequential source zip codes
- Saved queries or historical lookups
- User authentication or multi-user support
- Integration with downstream systems (export files only)
- Non-US postal codes

---

## Dependencies

- **Zip Code Database**: Public source with zip, city, state, county, lat, long (bundled at build time)
- **OSRM**: OpenStreetMap-based routing service for drive-time lookups
- **Map Tiles**: OpenStreetMap or equivalent for interactive map display
- **Polygon Data (optional)**: US Census TIGER/Line shapefiles for zip code boundaries
