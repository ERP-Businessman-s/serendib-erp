# Server — Express API

This folder holds the Node.js and Express backend. It does two jobs:

1. Serves the built React app from `../client`.
2. Exposes the REST API under `/api` (login, and one set of endpoints per module).

It connects to the Azure SQL database. Database settings are read from a `.env` file, which is never committed. See `../docs/DEPLOYMENT.md` (added later) for the keys it needs.

Code is added here next.
