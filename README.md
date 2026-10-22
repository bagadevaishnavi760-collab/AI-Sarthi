# AI Sarthi — Frontend

AI-powered healthcare budget allocation & management system prototype for MoHFW (V1).
Built with React + Vite, Tailwind CSS, React Router, Axios, Plotly.js, Lucide icons,
React Hook Form + Zod, and the Context API.

## Setup

```bash
npm install
cp .env.example .env   # configure VITE_API_BASE_URL
npm run dev
```

## Architecture

- `src/pages/` — all 8 pages (Dashboard, State Analysis, Budget Analytics, ML Predictions,
  AI Recommendations, Document Intelligence, Reports, Settings).
- `src/components/` — reusable components (Sidebar, Navbar, StatCard, ChartCard, DataTable,
  StateSelector, LoadingSpinner, PlotlyChart).
- `src/services/` — API layer. Prototype services may use labelled demonstration data;
  Document Intelligence uses only live backend responses and never falls back to mock
  answers or citations when the RAG API is unavailable.
- `src/data/mockData.js` — consistent demonstration dataset. NOT verified government statistics.
- `src/context/AppContext.jsx` — global UI state (sidebar, demo-mode flag).
- `src/hooks/useAsync.js` — shared loading/error/data hook.

## Provisional API endpoints (easy to change)

- GET `/api/dashboard`, GET `/api/states`, GET `/api/budget/{state}`
- POST `/predict`, POST `/api/recommend`, POST `/api/chat`

## Notes

- ML predictions and AI recommendations are **never faked** inside components; demo mode is
  explicit and clearly labelled.
- Figures shown are demonstration data and must be replaced by verified backend responses.
- See [RAG_SETUP.md](./RAG_SETUP.md) for local document ingestion, Ollama, and API setup.
