# Daymark

Daymark is a notes and tasks workspace built with React, Redux Toolkit, Express, and MongoDB. It supports notes, checklists, tasks, reminders, search, colors, pinning, archive, and trash.

Redux state is saved to browser local storage immediately, so edits survive refreshes even when the API or MongoDB is unavailable. When MongoDB is configured, the API also syncs the workspace to the database.

## Run locally

1. Copy `.env.example` to `.env` and set `MONGODB_URI` to your MongoDB connection string.
2. Run `npm install`.
3. Run `npm start` to start the API and Vite together.
4. Open [http://localhost:3000](http://localhost:3000).

The app remains usable without MongoDB, using local storage only. The API health check is at `/api/health`.

## Commands

- `npm start` starts the API and web app.
- `npm run server` starts only the Express API on port 4000.
- `npm test -- --run` runs the interaction tests.
- `npm run build` creates the production frontend in `dist`.
