// Serendib Gems ERP - server entry point.
// This one Express app does two jobs:
//   1. Serves the built React admin app (from ../../client/dist).
//   2. Serves the REST API under /api.
// Because both come from here, the whole thing deploys as one Azure App Service.
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { ensureAdmin } = require('./db');

const app = express();
app.use(cors());            // handy during local dev; harmless in production (same origin)
app.use(express.json());

// ---- API routes ----
app.use('/api/auth', require('./routes/auth'));
app.use('/api/lots', require('./routes/lots'));           // Inventory
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/suppliers', require('./routes/suppliers')); // Procurement (suppliers)
app.use('/api/purchases', require('./routes/purchases')); // Procurement (purchases -> rough lots)
app.use('/api/cutting', require('./routes/cutting'));     // Cutting & Workshop
app.use('/api/customers', require('./routes/customers')); // Sales (customers)
app.use('/api/orders', require('./routes/orders'));       // Sales (orders -> reserve/sell)
app.use('/api/invoices', require('./routes/invoices'));   // Billing
app.use('/api/employees', require('./routes/employees')); // HR

// Simple health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ---- Serve the built React app ----
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
// Anything that is not /api goes to the React app so client side routing works.
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// ---- Error handler (last) ----
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 4000;

// Try to create the Admin user, then start listening either way.
ensureAdmin()
  .catch((e) => console.error('Could not ensure admin user (is the DB reachable?):', e.message))
  .finally(() => {
    app.listen(PORT, () => console.log(`Serendib ERP server listening on port ${PORT}`));
  });
