# Feature Specification: Delivery Radius Tool

**Feature Branch**: `001-delivery-radius-tool`
**Created**: 2026-02-01
**Status**: Draft

## Overview

A web-based tool that enables supply chain operations staff to determine which zip codes fall within a deliverable radius of a source location. The tool replaces a manual, per-client process that currently takes approximately two hours per client and creates a bottleneck in the client onboarding workflow.

## Problem Statement

When onboarding a new client, an operations team member must identify the source zip code where the client operates, then determine every other zip code that can be reached within the delivery constraints (15 miles distance or 25 minutes drive time, by default). This is currently done by hand — researching zip codes one at a time, checking distances and drive times, and assembling the results into a usable format.

This manual process:
- Takes approximately 2 hours per new client
- Is tedious and error-prone
- Creates a bottleneck in the onboarding pipeline
- Offers no reusability between similar source locations

The tool should reduce this per-client effort to minutes while giving the operator enough transparency and control to trust and adjust the results.

## User Scenarios & Requirements

### US-1: Enter Source Parameters

**As an** operations team member,
**I want to** enter a source zip code and see editable default values for distance radius and drive time threshold,
**So that** I can confirm or adjust the delivery parameters before the system begins calculating.

**Acceptance Criteria:**
- The user is presented with an input form containing:
  - A source zip code field (five-digit US zip code)
  - A distance radius field, pre-populated with a default of 15 miles, editable by the user
  - A drive time threshold field, pre-populated with a default of 25 minutes, editable by the user
- The system validates that the zip code is a real US zip code present in the database
- On submission, the system begins calculating results using the entered parameters
- If the zip code is invalid or not found, the system displays a clear error message
- The source zip code and its location infoFlying rmation (city, state, latitude, longitude) are displayed for confirmation after submission

**Independent Test:** Enter zip code "98122" with default parameters and verify the system accepts it and displays "Seattle, WA" as confirmation. Change the distance to 25 miles, resubmit, and verify the results reflect the wider radius.

---

### US-2: Calculate Zip Codes Within Distance Radius

**As an** operations team member,
**I want** the system to identify all zip codes whose geographic center is within 120% of my stated distance radius from the source zip code,
**So that** I can see both the zip codes clearly within range and those in the boundary zone that may or may not be reachable.

**Acceptance Criteria:**
- The system uses the latitude and longitude of the geographic center of each zip code to calculate straight-line (haversine) distance from the source
- The system searches for all zip codes up to 120% of the user-specified distance radius (e.g., if the radius is 15 miles, the search extends to 18 miles)
- All zip codes found within this extended range are included in the results display
- The calculated distance for each zip code is displayed to the user
- Distance calculation uses a zip code database that is bundled with the application, downloaded from a public source during build or setup — no external API calls are required for distance calculation
- The zip code database must include at minimum: zip code, city, state, county (or metropolitan area), latitude, longitude

**Independent Test:** Enter a source zip code with a 15-mile radius. Verify that results include zip codes up to approximately 18 miles away. Confirm that a zip code at 19+ miles is not included.

---

### US-3: Filter by Drive Time for Edge Cases

**As an** operations team member,
**I want** the system to check actual drive time only for zip codes near the distance boundary,
**So that** we accurately classify edge cases without spending API calls on zip codes that are obviously in or obviously out.

**Acceptance Criteria:**
- Zip codes within 80% of the stated distance radius (e.g., within 12 miles for a 15-mile radius) are classified as "in — distance confirmed" and do not receive a drive-time lookup
- Zip codes between 80% and 120% of the stated distance radius (e.g., between 12 and 18 miles for a 15-mile radius) receive an actual drive-time lookup
- Drive time is calculated using a routing service based on OpenStreetMap data (e.g., OSRM)
- For edge-case zip codes where drive time is checked:
  - If drive time is within the user-specified threshold (default 25 minutes): classified as "in — drive time confirmed"
  - If drive time exceeds the threshold: classified as "out — drive time exceeded"
- Zip codes beyond 120% of the distance radius are not included in results at all (they are excluded by the distance search in US-2)
- The classification status and reasoning are visible to the user for each zip code

**Independent Test:** For a source zip code in a mountainous or water-adjacent area, verify that some zip codes within the 80-120% distance band are correctly excluded due to drive time exceeding 25 minutes, while others in that band are included.

---

### US-4: Display Results in a Sortable, Color-Coded Table

**As an** operations team member,
**I want to** see all candidate zip codes in a sortable, color-coded table that clearly shows which zip codes are in the coverage area and which are outside it,
**So that** I can quickly assess the results and identify any that need manual adjustment.

**Acceptance Criteria:**
- Results are displayed in a table with the following columns:
  - Zip code pair: source zip code → candidate zip code (both displayed so the relationship is always clear)
  - City
  - County or metropolitan area
  - State
  - Distance from source (miles)
  - Drive time: the actual drive time value if it was checked; a hyphen ("—") if drive time was not checked because the zip code was too close (under 80%) or too far (over 120%) to warrant a lookup
  - Classification status: "in — distance confirmed," "in — drive time confirmed," "out — drive time exceeded," or "overridden in/out" (see US-5)
  - Coverage indicator: a color-coded visual element showing whether the zip code is in or out of the coverage area
- Color coding:
  - Green for zip codes classified as in the coverage area
  - Red for zip codes classified as outside the coverage area
  - A distinct visual treatment (e.g., different shade, border, or icon) for manually overridden zip codes
- The table is sortable by any column
- A summary is displayed showing: total results, total in, total out, total overridden

**Independent Test:** Run a query and verify that the table is populated with color-coded rows. Sort by distance and verify the order changes. Sort by status and verify grouping. Confirm the summary counts match the visible rows.

---

### US-5: Override Coverage Decisions

**As an** operations team member,
**I want to** manually override the system's classification for any zip code — adding one that was excluded or removing one that was included,
**So that** I can apply my local knowledge of the area to correct for situations the automated logic doesn't capture.

**Acceptance Criteria:**
- Each row in the results table has a toggle or control to flip a zip code between "in" and "out"
- When a user overrides a classification, the zip code's status changes to "overridden — included" or "overridden — excluded"
- Overridden zip codes are visually distinguishable in both the table and the map (see US-6)
- Overrides update the summary counts in real time
- Overrides persist for the duration of the session (until the user runs a new query or closes the tool)
- There is no limit on the number of overrides a user can make

**Independent Test:** Run a query. Find a red (excluded) zip code, override it to included, and verify it turns green with an override indicator. Find a green (included) zip code, override it to excluded, and verify the reverse. Confirm the summary counts update.

---

### US-6: Display Results on a Map

**As an** operations team member,
**I want to** see the included and excluded zip codes displayed on a map,
**So that** I can visually validate the delivery area and spot any obvious gaps or inclusions that don't make sense geographically.

**Acceptance Criteria:**
- A map displays the source zip code and all candidate zip codes
- If zip code boundary polygon data is available, display zip codes as filled polygons; otherwise, display as point markers at centroids (points are acceptable; polygons are preferred but not required)
- Included zip codes are visually distinct from excluded zip codes (matching the green/red color coding from the table)
- Manually overridden zip codes are visually distinguishable on the map
- The map is interactive (zoom, pan)
- Clicking or hovering on a map element shows the zip code details (zip code, city, county or metropolitan area, distance, drive time, status)
- The map updates when the user toggles zip codes in the table
- The source zip code is visually distinct from all candidate zip codes (e.g., different marker style or color)

**Independent Test:** Run a query, verify the map shows a geographic cluster of green markers/polygons around the source with red ones at the periphery. Toggle a zip code in the table and verify the map updates.

---

### US-7: Export Results to CSV

**As an** operations team member,
**I want to** download the results as a CSV file, with the option to export only included zip codes or all displayed zip codes,
**So that** I can use the results in downstream business processes.

**Acceptance Criteria:**
- The user has two export options:
  - "Export included only" — downloads a CSV containing only zip codes classified as in the coverage area (including those overridden to included)
  - "Export all" — downloads a CSV containing all displayed zip codes with their status indicated
- Both exports include the following columns: source zip code, candidate zip code, city, county or metropolitan area, state, distance from source, drive time (actual value or hyphen if not checked), classification status
- The exported file uses a clear naming convention that includes the source zip code and date (e.g., `delivery-radius-98122-2026-02-01.csv`)
- Manual overrides are reflected in the exported data

**Independent Test:** Run a query, make some overrides, export "included only" and verify only in-status zip codes appear. Export "all" and verify every displayed zip code appears with correct status.

---

### US-8: Processing Progress Indicator

**As an** operations team member,
**I want to** see a progress indicator while the system is calculating results,
**So that** I know the tool is working and can estimate how long the process will take.

**Acceptance Criteria:**
- When the user submits a query, a progress indicator is displayed
- The progress indicator communicates at minimum which phase is active (e.g., "Calculating distances…", "Checking drive times for edge cases… (12 of 47)")
- For drive-time lookups, the indicator shows incremental progress (how many of the edge-case zip codes have been checked so far)
- The user interface remains responsive during processing (the progress indicator updates smoothly and the user is not blocked from viewing partial results if available)
- When processing is complete, the progress indicator is replaced by the results view

**Independent Test:** Submit a query and verify that the progress indicator appears, updates during drive-time lookups, and disappears when results are displayed.

---

### US-9: Cache Results for Faster Repeat Queries

**As an** operations team member,
**I want** the system to cache previously calculated results during my session,
**So that** repeat or similar queries complete faster without redundant drive-time lookups.

**Acceptance Criteria:**
- Drive-time lookup results are cached for the duration of the session so that if the same source-to-candidate zip code pair is queried again (e.g., with a different radius), the cached drive time is reused instead of making a new routing call
- Distance calculations from the bundled database do not require caching (they are already fast), but drive-time results — which involve external routing calls — are cached
- If the user runs a new query with the same source zip code but different parameters, cached drive times for previously checked pairs are reused
- If the user runs a query with a different source zip code, the cache still retains any overlapping pairs from prior queries
- The cache is session-scoped (cleared when the browser tab is closed or the application is restarted)
- Cached results are not visible to the user as a separate feature; caching is transparent and only manifests as faster processing on repeat queries

**Independent Test:** Run a query for zip code "98122" with a 15-mile radius. Note the processing time for drive-time lookups. Change the radius to 20 miles and resubmit. Verify that the second query completes faster because previously checked drive times are reused, and only new edge-case pairs require fresh lookups.

---

### US-10: Start a New Search

**As an** operations team member,
**I want** a clearly visible "New Search" button that resets the screen to the initial input form,
**So that** I can quickly move on to the next client without refreshing the browser.

**Acceptance Criteria:**
- A "New Search" button is visible at all times when results are displayed
- Clicking the button clears the current results (table, map, and summary) and returns the user to the input form
- The input form is reset to default values (default distance and drive time thresholds) with an empty zip code field
- The session cache of drive-time results is preserved (see US-9) so that future queries benefit from prior lookups
- Any unsaved work (overrides not yet exported) is discarded; if the user has made overrides, a brief confirmation prompt warns them before clearing results

**Independent Test:** Run a query, make some overrides, click "New Search," confirm the prompt, and verify the screen resets to the input form with defaults. Run a second query and verify the session cache speeds up overlapping drive-time lookups.

---

## Success Criteria

- A new client's delivery radius can be determined in under 5 minutes, compared to the current ~2 hours
- The operator can visually validate results on a map and make manual adjustments
- Drive-time lookups are minimized — only zip codes in the 80%-120% distance band require routing calls
- The tool works as a standalone web application requiring no internal system access
- The operator does not need technical knowledge to use the tool
- Results are exportable as CSV and ready for use in downstream business processes
- Default parameters (15 miles, 25 minutes) are editable per query so the tool can adapt to different business rules if needed

## Scope

### In Scope
- US zip codes only
- Single source zip code per query
- Editable default parameters for distance radius and drive time threshold
- Distance calculation from a bundled public zip code database
- Drive-time calculation via OpenStreetMap-based routing (OSRM or equivalent)
- Sortable, color-coded results table with zip code pairs, county/metro area, and coverage indicator
- Drive time column showing actual values for checked pairs and a hyphen for unchecked pairs
- Manual override of coverage decisions
- Progress indicator during processing with phase and incremental count
- Session-scoped caching of drive-time results across queries
- "New Search" button to reset the interface for the next client
- Interactive map visualization (polygons preferred, points acceptable)
- Dual CSV export (included only, or all with status)
- Mobile responsive layout

### Out of Scope
- Multi-source queries (multiple origin zip codes in one session)
- Batch processing of sequential source zip codes
- Saved queries or historical lookups
- User authentication or multi-user support
- Integration with specific downstream systems (the tool produces export files only)
- Non-US postal codes

## Assumptions

- A comprehensive US zip code database is freely available from a public source and can be downloaded during build or setup (e.g., from census.gov, GeoNames, or similar)
- OpenStreetMap routing data is available via a self-hosted or public OSRM instance for drive-time calculations, and the project will bear any associated hosting or API costs
- The 15-mile / 25-minute defaults are the standard business rules but may be adjusted per query by the operator
- The application will be used by a small number of internal operations staff, not a large public user base
- The tool is a standalone utility, not part of a larger application platform
- Zip code boundary polygon data may or may not be available from the public source; the application should gracefully fall back to point markers if polygon data is not bundled

## Dependencies

- Public US zip code data source (zip code, city, county or metropolitan area, state, latitude, longitude — bundled with the application at build/setup time)
- OpenStreetMap-based routing service for drive-time lookups (OSRM or equivalent)
- Map tile provider for the interactive map display (OpenStreetMap tiles or equivalent)
- Optional: zip code boundary polygon data from a public source (e.g., US Census TIGER/Line shapefiles)

## Non-Functional Requirements

- The initial distance calculation (before drive-time lookups) should complete within a few seconds
- Drive-time lookups for edge-case zip codes should complete within a reasonable time (under 60 seconds for a typical set of 50-150 edge-case zip codes)
- The application must be mobile responsive — fully usable on phone and tablet screens with appropriate layout adjustments (e.g., table scrolling, stacked map/table layout on narrow screens)
- The application should be usable on a standard laptop browser (Chrome, Firefox, Safari, Edge) and mobile browsers (iOS Safari, Android Chrome)
- Drive-time results are cached in the session to avoid redundant routing calls across queries
- No data is persisted between sessions unless explicitly exported by the user

## Review & Acceptance Checklist

- [ ] No implementation details (languages, frameworks, APIs) are prescribed in this spec beyond the data source requirements
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable and technology-agnostic
- [ ] All acceptance scenarios are defined
- [ ] Edge cases are identified (80%-120% boundary zone, polygon fallback to points, cache reuse across queries)
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified
- [ ] Mobile responsiveness is specified as a non-functional requirement
- [ ] All previous [NEEDS CLARIFICATION] items have been resolved
