# Trial SOP Checklist (RailwayMitra - POC2)

A guided, sectioned checklist web app with autosave and exports (JSON + CSV) for post‑trial reporting.

## Demo

<p align="center">
  <img src="public/demo1.png" alt="Checklist demo - landing" width="900" />
</p>
<p align="center">
  <img src="public/demo2.png" alt="Checklist demo - form" width="900" />
</p>

## Features

- Sectioned checklist UI with progress + required indicators
- Autosave to local storage (resume where you left off)
- Export answers to `JSON` and `CSV` (Excel-friendly)
- Mobile/desktop responsive layout

## Tech Stack

- Next.js (App Router)
- React

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)

### Install

```bash
npm ci
```

### Run (dev)

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm start` — run production server
- `npm run lint` — run ESLint

## App Structure

- `app/page.js` — landing page (links to `/form`)
- `app/form/page.js` — form route
- `app/components/ChecklistApp.jsx` — checklist UI + autosave + export logic
- `lib/` — checklist data + storage helpers

## Configuration

This project doesn’t require environment variables by default.

If you add any secrets/config locally, keep them in `.env*` files (ignored by git). If you need to document required variables, add a committed `.env.example`.

## Deployment

### Vercel

Works out of the box as a Next.js app:

```bash
npm ci
npm run build
```

### Node Server

```bash
npm ci
npm run build
npm start
```

## License

Private / internal project (update if you intend to open source).
