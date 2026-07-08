# Serendib Gems ERP

An Enterprise Resource Planning (ERP) system for a Sri Lankan gem house. It is a group assignment for the Business Process and ERP Systems module. The system manages the full life of a gemstone: buying it as rough, cutting it, holding it in stock, selling it to a customer, and recording the money.

This repository is the single thing we submit. It has the source code, the database scripts, the documents, and the deployment steps.

## What this system is

Serendib Gems is a gem business. This ERP is the internal system its staff use to run daily operations. It has six modules that share the same data, plus a login and a dashboard. A separate public storefront (in the `storefront` folder) is the customer facing shop that sends orders into the ERP.

## Modules

1. Inventory. The gem lots and their details (carat, cut, certificate, status, cost, price).
2. Procurement. Suppliers and purchases. Buying rough stones adds them to inventory.
3. Cutting and Workshop. Cutting jobs that turn a rough stone into a finished stone.
4. Sales. Customers and customer orders. Selling a stone reduces stock.
5. Billing. Invoices and payments, plus a simple revenue report.
6. HR and Staff. Employees, including the cutters and sales staff.

Plus: a login page with roles, and a dashboard that shows numbers pulled from all modules.

## How the modules connect

Every gemstone is one "Lot". A Lot has a `status` field. Different modules change this same field, and that is how we show the modules are integrated:

```
Procurement buys rough  -> Lot status: In Stock (rough)
Cutting job runs        -> Lot status: In Cutting, then In Stock (finished)
Sales order placed      -> Lot status: Reserved, then Sold
Billing raises invoice  -> revenue recorded
Dashboard               -> reads totals from all of the above
```

## Tech stack

- Frontend: React (built with Vite), styled with the Serendib gem design.
- Backend: Node.js with Express, a REST API under `/api`.
- Database: Azure SQL Database.
- Hosting: one Azure App Service. The Express server serves both the React app and the API.

See `docs/adr/0001-react-express-azure-sql-single-app.md` for why we chose this.

## Folder structure

```
serendib-erp/
  client/        React admin app (the ERP screens)
  server/        Express API and server that serves the client build
  storefront/    The public gem shop (customer sales channel)
  db/            SQL scripts: schema.sql and seed.sql
  docs/          SRS, implementation plan, database design, git workflow, ADRs
  CONTEXT.md     The shared glossary (what our words mean)
  README.md      This file
```

## Getting started (local)

You need Node.js installed, and access to the Azure SQL database (connection details go in a `.env` file, which is never committed).

```
# 1. Backend
cd server
npm install
# create a .env file, see docs/DEPLOYMENT.md for the keys it needs
npm run dev

# 2. Frontend (in a second terminal)
cd client
npm install
npm run dev
```

The database schema and sample data are in the `db` folder. Run `db/schema.sql` first, then `db/seed.sql`, against the Azure SQL database.

## Documents

- `docs/SRS.md` - the full software requirements specification.
- `docs/IMPLEMENTATION-PLAN.md` - who does what, and the day by day plan.
- `docs/DATABASE-DESIGN.md` - the tables and how they relate.
- `docs/GIT-WORKFLOW.md` - how we branch, commit, and make sure everyone contributes.
- `docs/DEPLOYMENT.md` - how to deploy to Azure. (added during Day 4)
- `CONTEXT.md` - the glossary of terms.

## Team

Seven members. Each member owns one lane. See `docs/IMPLEMENTATION-PLAN.md` for the full table.
