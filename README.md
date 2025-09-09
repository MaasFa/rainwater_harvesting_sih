
# RTRWH Enhanced MVP (Static Web)

This enhanced static web app adds:
- Step-by-step wizard form
- GPS rainfall lookup (Open-Meteo climate API)
- Charts (Chart.js) for supply vs demand and monthly estimate
- PDF export (html2pdf.js)
- Recommendations: tank, recharge structures, cost-benefit, environmental impact
- All client-side; no server required

## How to use
1. Open `index.html` in your browser.
2. Fill user & site info (or use GPS to auto-fill rainfall).
3. Click Compute to see results, charts, and recommendations.
4. Click Download PDF to export the results.

## Notes
- Open-Meteo API is used for best-effort rainfall climatology; network required.
- Calculations are approximations for MVP/demo only.
