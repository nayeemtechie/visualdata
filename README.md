# Report Visualizer

Interactive Report Builder for eCommerce Personalization data. A lightweight Tableau-style visualization tool that allows non-technical users to upload Excel/CSV files and instantly see executive-ready visualizations.

## Features

### Data Ingestion
- **Drag & Drop Upload**: Supports `.xlsx`, `.xls`, and `.csv` files
- **Auto-Detection**: Automatically detects column types (date, number, percentage, currency)
- **Column Mapper**: Map your Excel columns to application fields with:
  - Custom display labels
  - Percentage toggle (appends `%` without computation)
  - Color picker for chart lines
  - Dynamic custom field addition

### Formula Support
Create calculated fields using formulas. Reference columns with `{curly braces}`:
```
{clicks} / {impressions} * 100    # Calculate CTR
{revenue} / {orders}              # Calculate AOV
{Total attributable_sales} - {spend}  # Calculate profit
```

### Charts
1. **Attributable Sales Velocity** (Area Chart)
   - Shows sales performance over time
   - Values displayed in K/M format (e.g., 1.5M, 250K)
   
2. **Engagement** (Line Chart)
   - Shows CTR and other engagement metrics
   - Percentage formatting for rate metrics

### Time Aggregation
Toggle between:
- **Daily**: Day-by-day breakdown
- **Monthly**: Aggregated by month
- **Quarterly**: Aggregated by quarter

### Multi-Metric Overlay
- Add multiple metrics to a single chart
- Click legend items to toggle visibility
- Each metric has customizable colors

### In-App Help & Documentation
Click the **?** icon in the header to access:
- Getting Started guide
- Features overview
- Column Mapping instructions
- Formula syntax help
- Charts guide
- Tips & Tricks

### Configuration Persistence
Save and load your chart configurations for reuse:
- **Save**: Click "Save" in the header → enter a name (e.g., "Sales Report Q4")
- **Load**: Click "Load" → select from saved configurations
- **Delete**: Hover over a saved config → click the trash icon
- Configurations are stored in browser localStorage
- Re-upload your data file to apply loaded configurations

### Date Range Filter
Narrow your data to specific time periods:
- **Quick Presets**: Last 7/30/90 days, Last Quarter, Year to Date
- **Custom Range**: Select specific start and end dates
- Applied globally to all charts
- Data count shows filtered vs total (e.g., "92 / 365")

### Export Features
Export your charts for reports and presentations:
- **📄 Export PDF**: Download all charts as a single PDF file
- **📋 Copy to Clipboard**: Copy all charts as an image (paste into docs, emails, etc.)
- Buttons located in header next to "Add Chart"
- Toast notifications confirm success/failure

### Custom Charts
Create unlimited custom charts with:
- Choose X-axis and Y-axis metrics
- Select chart type (Line, Area, Bar)
- Custom titles and captions
- Delete individual charts

## Tech Stack
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Data Parsing**: SheetJS (xlsx)
- **Date Handling**: date-fns
- **Export**: html2canvas, jsPDF

## Getting Started

### Development
```bash
npm install
npm run dev
```
Open http://localhost:5173

### Production Build
```bash
npm run build
```
Generates static files in `dist/` folder ready for CDN deployment.

## Project Structure
```
src/
├── App.jsx                     # Main application component
├── components/
│   ├── DropZone.jsx            # File upload component
│   ├── ColumnMapper.jsx        # Column mapping modal + formula support
│   ├── ChartCard.jsx           # Reusable chart wrapper
│   ├── ConfigManager.jsx       # Save/Load configuration UI
│   ├── DateRangeFilter.jsx     # Global date range filter
│   ├── CustomChart.jsx         # User-created custom charts
│   ├── SalesVelocityChart.jsx  # Attributable Sales chart
│   └── EngagementChart.jsx     # CTR/Engagement chart
└── hooks/
    ├── useConfigStorage.js     # Named config persistence
    ├── useChartExport.js       # PDF export & clipboard copy
    ├── useDataAggregator.js    # Time-based data aggregation
    └── useFileParser.js        # Excel/CSV parsing
```

