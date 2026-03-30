# xfigura Dashboard

AI generation analytics dashboard for tracking credit usage, top spenders, image generation volume, and monthly projections.

## Features

- **Dashboard** - KPI cards, credit trends, top spenders, model/type breakdowns
- **Top Spenders** - Ranked user table with sparklines and drill-down
- **Generations** - Daily image count, model breakdown, peak hours heatmap
- **Projections** - Linear regression + moving average, cumulative spend vs target
- **Anomalies** - Duplicate, outlier, spike, and missing data detection
- **Data** - CSV upload (drag & drop), search, export
- **Settings** - Credit targets, dark mode

## Usage

Upload your xfigura all-time CSV export. The dashboard expects these columns:
`id`, `Time`, `credits`, `email`, `modelName`, `referenceId`, `type`, `Number of Generations`

All data is stored locally in your browser (IndexedDB). Nothing is sent to any server.

## Development

```bash
npm install
npm run dev
```
