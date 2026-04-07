# xfigura AI Generation Dashboard — Technical Specification

> Internal reference for developers to implement dashboard features directly into the xfigura platform.

---

## Overview

A web-based analytics dashboard for tracking AI image/video generation platform usage. Ingests CSV exports of generation data, visualizes spending patterns, tracks user activity tiers, projects monthly credit usage, and flags anomalies. Fully client-side (no backend).

**Live URL:** https://achristo714.github.io/AIDashboard/

**Tech Stack:** Vite + React 19 + TypeScript, Tailwind CSS 4, Recharts, PapaParse, Zustand (IndexedDB persistence), simple-statistics, date-fns

---

## Data Model

### CSV Input Format (columns expected)

| Column | Field | Type | Required |
|--------|-------|------|----------|
| A | `id` | UUID string | Yes |
| B | `Time` | `"MM/DD/YYYY, HH:MM:SS UTC"` | Yes |
| C | `credits` | number | Yes |
| D | `email` | string | Yes |
| E | `modelName` | string (e.g. "Nano Banana", "Clarity Upscaler") | Yes |
| F | `referenceId` | UUID string | No |
| G | `type` | string (e.g. "image_to_image", "image_upscale", "image_to_video") | Yes |
| H | `Number of Generations` | integer | No (defaults to 0) |

### Internal Record Type

```typescript
interface GenerationRecord {
  id: string;
  time: string;              // ISO 8601 (parsed from CSV)
  credits: number;
  email: string;
  modelName: string;
  referenceId: string;
  type: string;
  numberOfGenerations: number;
}
```

### Supporting Types

```typescript
interface SpendTarget {
  id: string;
  period: 'monthly' | 'quarterly';
  amount: number;
  email?: string;   // if set, per-user target
}

interface AnomalyFlag {
  recordId: string;
  type: 'duplicate' | 'outlier' | 'missing_data' | 'date_anomaly' | 'spike' | 'suspicious_frequency';
  severity: 'high' | 'medium' | 'low';
  message: string;
  dismissed: boolean;
}

type DatePreset = 'all' | 'today' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'custom';
type TimeGranularity = 'daily' | 'weekly' | 'monthly';
type ProjectionStatus = 'on_track' | 'at_risk' | 'below_target' | 'exceeding' | 'no_target';
```

---

## Pages & Features

### 1. Dashboard (`/`)

The main overview page. Everything here responds to the global date range filter.

**KPI Cards (2 rows of 4):**

| Card | Value | Definition |
|------|-------|------------|
| Total Credits | Sum of `credits` field | All credits consumed in date range |
| Images Generated | Sum of `numberOfGenerations` | Total outputs produced |
| Total Requests | Row count | Number of API calls |
| All Users | Unique `email` count | Everyone who made at least 1 request |
| Active Users | Count of users with ≥15 images/week | `(user's total generations) / (date range in weeks) ≥ 15` |
| Casual Users | Count of users with ≥4 images/month but <15/week | Engaged but not power users |
| Anomalies | Count of undismissed anomalies | Flagged data issues |
| Top Spender | Highest credit consumer | User email + credit total |

**Charts:**

1. **Cumulative Spend** (2/3 width) + **Monthly Projection Gauge** (1/3 width)
   - Month mode (This Month / Last Month): day-by-day cumulative area chart with target line + projection dashed line
   - Range mode (All Time / Last 30 Days / etc.): date-keyed cumulative area chart showing full range
   - Gauge: semi-circle showing projected % of monthly target with status badge

2. **Projection Alert Banner**
   - With target: "At current burn rate (X/day), budget will be exhausted in ~N days" — color-coded green/amber/red
   - Without target: "Daily burn rate: X credits/day · Projected next 30 days: Y"

3. **Credit Spend** (full width)
   - Amber bars: daily credit spend (non-cumulative)
   - Indigo line: 7-day rolling moving average
   - Green line: daily request count (right Y-axis)
   - Teal line: 7-day rolling average of requests
   - **Clickable legend** — click any series name to toggle it on/off

4. **Top Spenders** (full width, top 10)
   - Each row: rank badge (gold/silver/bronze) → email → inline proportional color bar → sparkline trend → request count → credit total

5. **Images Generated Per Day** (full width)
   - Amber bar chart of `numberOfGenerations` per day

6. **Usage by Model** + **Usage by Type** (side by side)
   - Donut chart + right-side legend with name, %, credit total
   - Items under 2% grouped into "Other"

7. **Model Trends Over Time** (full width)
   - Multi-line chart: weekly request count per model (top 10 models)
   - Clickable legend to show/hide individual models
   - Use case: compare Nano Banana vs Nano Banana 2 vs Nano Banana Pro adoption over time

---

### 2. Top Spenders (`/spenders`)

Ranked table of top 100 users with click-to-expand detail panel.

**Table columns per row:**
- Rank (#1, #2, ...)
- Email
- Credits (inline color bar proportional to #1 + formatted value)
- Requests
- Generations
- Avg Credits/Request
- Sparkline trend (daily credits mini line chart)

**Detail panel (on click):**
- Total credits, requests, generations, avg credits/request
- Models used (ranked by credits)
- Generation types used (ranked by credits)
- Daily usage line chart

---

### 3. Generations (`/generations`)

Analytics focused on generation volume and patterns.

**KPI cards:** Total Generations, Avg Generations/Day, Avg Generations/Request

**Charts:**
1. Generations Over Time (bar chart, granularity toggle: daily/weekly/monthly)
2. Requests Over Time (line chart)
3. **Model Trends Over Time** (multi-line, weekly, clickable legend)
4. Generations by Model (horizontal bar)
5. Requests by Type (vertical bar)
6. **Peak Activity Hours Heatmap** (24 hours × 7 days, UTC, intensity-colored grid)

---

### 4. Projections (`/projections`)

Budget forecasting using linear regression and moving average.

**Adapts to date filter:**
- **Month mode** (This Month / Last Month): projects to end of that specific month
- **Range mode** (All Time / Last 30 Days / etc.): projects next 30 days from current burn rate

**KPI cards:** Current/Total Spend, Projected Total, Daily Burn Rate, Month-over-Month change or Date Range span

**Projection model:**
```
Linear Regression: fit line to cumulative daily credits → extrapolate to target date
Moving Average: daily average × remaining days
Blended: 60% regression + 40% moving average
```

**Status thresholds (projected vs target):**
- `exceeding`: ≥110%
- `on_track`: 90-110%
- `at_risk`: 75-90%
- `below_target`: <75%

**Budget exhaustion:** `remaining credits ÷ daily burn rate = days until exhausted`

**Charts:**
1. Target Status gauge (month mode only)
2. Cumulative spend chart (month or range mode)
3. Daily Credit Spend (bars + 7-day average + requests)
4. Monthly Credit Usage (bar chart comparing months)
5. Projection Details (regression, moving average, blended values)

---

### 5. Anomalies (`/anomalies`)

Data quality issue detection and review.

**Detection Algorithms:**

| Type | Method | Severity |
|------|--------|----------|
| Duplicate | Same `id` appears multiple times | High |
| Missing Data | Empty `time`, `email`, or `credits` | High |
| Credit Outlier | Z-score > 3.0 relative to global mean (needs ≥10 records) | Medium |
| Usage Spike | User's daily credits > 2.5 SD above their rolling average (needs ≥7 days) | Medium |
| Future Date | Timestamp after current date | Medium |

**UI:**
- Summary cards (active, high, medium, low counts)
- Anomaly scatter plot (date vs credits, outliers in red)
- Filterable table (by severity + status: active/dismissed/all)
- Dismiss button per anomaly
- "Re-run Detection" button

---

### 6. Insights (`/insights`)

26 auto-generated data highlights organized into 4 sections. All respond to date range filter.

#### Spending & Models
| Insight | What it computes |
|---------|-----------------|
| Top Spender Dominance | `(#1 user credits / total credits) × 100` |
| Busiest Day | Day with highest total credits |
| Most Popular Model | Model with most requests |
| Most Expensive Model | Model with highest `avg credits per request` (min 10 requests) |
| Dominant Generation Type | Type with most requests as % of total |
| Biggest Single Request | Single record with highest credits value |

#### Calendar & Patterns
| Insight | What it computes |
|---------|-----------------|
| Busiest Day of Week | Day-of-week with highest average daily credits |
| Quietest Day of Week | Day-of-week with lowest average daily credits |
| Weekend vs Weekday | `(weekend avg daily credits) / (weekday avg daily credits)` |
| Peak Hour (UTC) | Hour bucket (0-23) with most requests |
| Quietest Hour (UTC) | Hour bucket with fewest requests |

#### User Behavior
| Insight | What it computes |
|---------|-----------------|
| Fastest Growing User | User whose 2nd-half spend increased most vs 1st-half (>20% increase, min 100 credits in 1st half) |
| Biggest Decline | User whose 2nd-half spend dropped most vs 1st-half (<50% ratio) |
| Longest User Streak | Max consecutive active days for any top-5 user (threshold: ≥5 days) |
| Most Diverse User | User who used the most different models (min 3) |
| Most Loyal to One Model | User with only 1 model used and ≥20 requests |
| New Users (Last 7 Days) | Users whose first-ever request falls in last 7 days of data |
| Potentially Churned Users | Users active earlier but zero activity in last 14 days (min 100 credits historically, needs ≥21 day span) |
| Power User Concentration | Users consuming >5% of total credits each |
| Top 3 Concentration | Sum of top 3 users as % of total credits |
| Avg Requests Per User | `total requests / unique users` |

#### Platform Stats
| Insight | What it computes |
|---------|-----------------|
| Platform Activity Streak | Longest consecutive days with any request |
| Active Days | Days with ≥1 request / total days in range |
| Avg Credits Per Request | `total credits / total requests` |
| Cost Per Generation | `total credits / total generations` |
| Credits Per Active Day | `total credits / days with activity` |

---

### 7. Data (`/data`)

CSV upload and raw data management.

- **Drag-and-drop CSV upload** (PapaParse streaming for large files)
- Upload preview with validation summary (records imported, rows skipped)
- **Searchable data table** (search by email, model, type, or ID)
- Sortable by time, credits, or email (asc/desc)
- Paginated (100 rows per page)
- **Export CSV** button (downloads all records)
- **Clear All** button (with confirmation)

**CSV Parsing:**
- Time format: `"MM/DD/YYYY, HH:MM:SS UTC"` → ISO 8601
- Deduplication by `id` field on import
- Skips rows missing required fields (id, time, email, credits)
- Reports first 10 errors + count of additional

---

### 8. Settings (`/settings`)

- **Dark Mode** toggle (persisted to localStorage)
- **Credit Targets** (monthly or quarterly, global or per-user email)
  - Add/remove targets
  - Targets drive projection gauge, status indicators, and budget exhaustion alerts
- **Bake Data for Sharing** — exports `data.json` file that can be embedded in `public/` for pre-loaded dashboards
- **Data Info** — record count, unique users, unique models, storage type

---

## Global Features

### Date Range Filter (Header)

Available on every page. Presets:
- All Time, Today, Last 7 Days, Last 30 Days, This Month, Last Month, This Quarter, Custom Range

All KPIs, charts, insights, and projections recalculate based on filtered records.

Header shows: `"X of Y records"` when filter is active.

### User Activity Tiers

Calculated dynamically from the filtered date range:
- **Active**: `(user's generations) / (weeks in range) ≥ 15`
- **Casual**: `(user's generations) / (months in range) ≥ 4` AND not Active

### Dark Mode

Full dark mode support across all UI and charts. Charts use a theme hook providing dark-aware grid colors, tick colors, tooltip styles, gauge/heatmap colors.

### Baked-in Data

On app startup, if IndexedDB is empty, the app tries to fetch `public/data.json`. If present, it auto-loads the records so visitors see data without uploading. Data is then persisted locally.

---

## Data Flow

```
CSV File (50K+ rows)
  → Drag-and-drop upload
  → PapaParse (streaming chunked parse)
  → Validation (required fields, date parsing, type coercion)
  → Deduplication (by id)
  → Zustand store → IndexedDB persistence
  → useFilteredRecords hook (applies date range filter)
  → Aggregation utilities (by time, user, model, type, hour)
  → Chart components (Recharts)
```

---

## Projection Model

### Month Mode (`projectMonth`)
1. Filter records for target month
2. Group credits by day-of-month
3. Calculate daily average = `total credits / days elapsed`
4. Moving average projection = `daily avg × days in month`
5. Linear regression on cumulative daily spend → extrapolate to last day of month
6. Blend: `60% regression + 40% moving average`
7. Compare to target → status (on_track / at_risk / below_target / exceeding)
8. Budget exhaustion = `(target - current total) / daily burn rate`

### Range Mode (`projectRange`)
1. Calculate daily average across full filtered range
2. Project next 30 days using same blend method
3. Budget exhaustion = `monthly target / daily burn rate`

---

## Anomaly Detection

Runs on upload and on-demand via "Re-run Detection" button.

| Detection | Algorithm | Threshold | Severity |
|-----------|-----------|-----------|----------|
| Duplicate ID | Count occurrences of each `id` | >1 | High |
| Missing Fields | Check `time`, `email`, `credits` for null/empty | Any missing | High |
| Credit Outlier | Z-score of `credits` vs global mean/SD | z > 3.0 | Medium |
| Daily Spike | Z-score of user's daily credits vs their rolling mean/SD | z > 2.5 | Medium |
| Future Date | Compare `time` to `Date.now()` | time > now | Medium |

Dependencies: `simple-statistics` (mean, standardDeviation, zScore)

---

## File Structure

```
src/
├── types/generation.ts          — All TypeScript interfaces
├── store/generationStore.ts     — Zustand store (state + actions + persistence)
├── hooks/
│   ├── useFilteredRecords.ts    — Date-range-filtered records
│   └── useChartTheme.ts         — Dark-mode-aware chart colors
├── utils/
│   ├── csvParser.ts             — PapaParse CSV → GenerationRecord[]
│   ├── csvExporter.ts           — GenerationRecord[] → CSV download
│   ├── aggregations.ts          — Group by time/user/model/type/hour
│   ├── projections.ts           — projectMonth() + projectRange()
│   ├── anomalyDetection.ts      — detectAnomalies()
│   └── formatters.ts            — formatCredits/Number/Percent/truncateEmail
├── constants/chartColors.ts     — 10-color palette + status colors
├── components/
│   ├── layout/                  — Sidebar, Header, DashboardLayout
│   ├── charts/                  — 11 chart components (see below)
│   ├── cards/                   — KpiCard, ChartHeader (with tooltips)
│   ├── filters/                 — DateRangeSelector, DateRangePicker, GranularityToggle
│   ├── upload/                  — CsvUploader (drag-and-drop)
│   └── settings/                — (inline in SettingsPage)
├── pages/                       — 8 page components
├── App.tsx                      — HashRouter + routes
└── main.tsx                     — Entry point
```

### Chart Components

| Component | Chart Type | Key Feature |
|-----------|-----------|-------------|
| CreditDualChart | ComposedChart (bars + lines) | 4 toggleable series, dual Y-axes, 7-day moving average |
| CumulativeArea | AreaChart | Month-mode cumulative with projection + target lines |
| CumulativeRangeChart | AreaChart | Date-range cumulative (no target) |
| ProjectionGauge | PieChart (semi-circle) | Status badge, projected/current/target values |
| TopSpendersBar | BarChart (horizontal) | Dynamic height, color per user, truncated emails |
| ModelBreakdown | PieChart (donut) | Filters <2% into "Other", right-side legend |
| TypeBreakdown | PieChart (donut) | Same as ModelBreakdown for generation types |
| ModelTrends | LineChart (multi-line) | Weekly per-model, clickable legend toggle |
| GenerationsPerDay | BarChart | Amber bars, daily generation count |
| CreditTrendLine | LineChart | Generic single-line with configurable dataKey |
| AnomalyScatter | ScatterChart | Normal (gray) vs anomaly (red) points, sampled to 2000 max |

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | 19 | UI framework |
| recharts | latest | All charts and visualizations |
| zustand | latest | Global state management |
| idb-keyval | latest | IndexedDB persistence (large datasets) |
| papaparse | latest | CSV parsing (streaming for 50K+ rows) |
| simple-statistics | latest | Linear regression, z-scores, mean, SD |
| date-fns | latest | Date manipulation, formatting, grouping |
| lucide-react | latest | Icons |
| tailwindcss | 4 | Styling |
| react-router-dom | latest | Client-side routing (HashRouter) |
| react-dropzone | latest | Drag-and-drop file upload |

---

## Deployment

- **GitHub Pages** via GitHub Actions (`.github/workflows/deploy.yml`)
- Triggers on push to `main`
- Build: `npm ci && npm run build`
- Serves from `dist/` directory
- Base path: `/AIDashboard/`
- Uses `HashRouter` for static hosting compatibility

### Baking Data for Shared Links

1. Go to Settings → "Bake Data for Sharing" → click "Export data.json"
2. Place the downloaded `data.json` in `public/`
3. Push to `main` — visitors will see pre-loaded data without uploading
