# Serendib Gems ERP

An Enterprise Resource Planning (ERP) system for a Sri Lankan gem house, built as a group project for the Business Process and ERP Systems module. It manages the full life of a gemstone: buying it as rough, cutting it, holding it in stock, selling it to a customer, and recording the money. It also has a public storefront where customers can browse finished gems and place an order that flows straight into the ERP.

## Live demo

- **ERP system:** https://serendib-erp-g5-ccf4ghfbebh6hhbs.southeastasia-01.azurewebsites.net
- **Public storefront:** https://serendib-erp-g5-ccf4ghfbebh6hhbs.southeastasia-01.azurewebsites.net/shop

**Demo login** (staff back-office):

| Email | Password |
|-------|----------|
| `admin@serendib.lk` | `Admin@2026` |

The public storefront needs no login.

> The app runs on Azure. The first request after it has been idle can take around 30 seconds to wake up (free App Service tier), then it is fast.

## What this system is

Serendib Gems is a gem business. This ERP is the internal system its staff use to run daily operations. It has six modules that share the same data, a login, and a dashboard. A separate public storefront is the customer facing shop that sends orders into the ERP.

## Modules

| Module | ERP area | What it does |
|--------|----------|--------------|
| Inventory | Supply Chain | Gem lots and their details (carat, cut, certificate, status, cost, price), with a lot history timeline. |
| Procurement | Supply Chain | Suppliers and purchases. Buying rough stones adds them to inventory. |
| Cutting & Workshop | Supply Chain | Cutting jobs that turn a rough stone into a finished stone, with cutter workload. |
| Sales | Customer (CRM) | Customers and orders. Selling a stone reserves it, then marks it sold. Accepts orders from the storefront. |
| Billing | Finance | Invoices, payments, printable invoice, and a revenue report. |
| HR & Staff | Human Capital | Employees, including cutters and sales staff. |

On top of the modules there is a **Dashboard** with live numbers and charts, a **Process Flow** page that shows the two main business processes end to end, and a **Reports** page that generates printable business reports.

## How the modules connect

Every gemstone is one "Lot", and a Lot has a `status` field. Different modules change this same field, and that is how the modules stay integrated:

```
Procurement buys rough   ->  Lot status: In Stock (rough)
Cutting job runs         ->  Lot status: In Cutting, then In Stock (finished)
Sales order placed       ->  Lot status: Reserved, then Sold
Billing raises invoice   ->  revenue is recorded
Dashboard and Reports    ->  read the totals from all of the above
```

This one shared field is what makes the system a real ERP and not six separate apps. The two business processes it supports are **Procure to Pay** (supplier to stock to payment) and **Order to Cash** (customer order to delivery to invoice).

## Tech stack and architecture

- **Frontend:** React (built with Vite), with a custom gem themed design.
- **Backend:** Node.js with Express, a REST API under `/api`.
- **Database:** Azure SQL Database.
- **Hosting:** one Azure App Service. The Express server serves both the React build and the API, so it is a single deployment.

It follows a three tier design (presentation, application, data) running as a cloud ERP on Azure. See `docs/adr/0001-react-express-azure-sql-single-app.md` for why we chose a single app.

```
Browser (React admin + public storefront)
        |  HTTPS
Azure App Service (Express: serves the UI and the /api REST API)
        |  SQL
Azure SQL Database
```

## Folder structure

```
serendib-erp/
  client/        React admin app (the ERP screens)
  server/        Express API and the server that serves the client build
  storefront/    The public gem shop (customer sales channel)
  db/            SQL scripts: schema.sql and seed.sql
  docs/          SRS, database design, business process analysis, deployment, ADRs
  CONTEXT.md     The shared glossary of terms
  README.md      This file
```

## Running it locally

You need Node.js installed and access to an Azure SQL database. The connection details go in `server/.env`, which is never committed.

```
# 1. Backend
cd server
npm install
# create a .env file, see server/.env.example for the keys it needs
npm run dev

# 2. Frontend (in a second terminal)
cd client
npm install
npm run dev
```

Run `db/schema.sql` first and then `db/seed.sql` against the database to create the tables and load sample data.

To build and run the whole thing as one app the way it runs on Azure:

```
npm run build      # builds the client
npm start          # Express serves the built client and the API
```

## Documents

- `docs/SRS.md` - the software requirements specification.
- `docs/BUSINESS-PROCESS-ANALYSIS.md` - the As-Is and To-Be business process analysis.
- `docs/DATABASE-DESIGN.md` - the tables and how they relate.
- `docs/DEPLOYMENT.md` and `docs/AZURE-PORTAL-GUIDE.md` - how to deploy to Azure.
- `docs/adr/0001-react-express-azure-sql-single-app.md` - the main architecture decision.
- `CONTEXT.md` - the glossary of terms.

## Team

A group of seven. Each member built and committed their own part.

| Member | Area | GitHub |
|--------|------|--------|
| Hasitha Bandara | App shell, dashboard, process flow, reports, deployment | agentdynarq |
| Vishwa Chandeepa | Dashboard charts and analytics | VishwaChandeepa |
| Tharindu | Inventory and lot history | Tharindulx |
| Vinuka | Cutting and sales orders | WDVinuka |
| Thilina | Billing and invoicing | ThiliX |
| Ashan Iduranga | Storefront order API and integration | Ashan-Iduranga |
| Keshan | Public storefront | keshan-dev |
