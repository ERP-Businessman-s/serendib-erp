# Deployment Guide
## Serendib Gems ERP

This explains how to run the system on your own machine, and how to deploy it to Microsoft Azure. It is written in simple steps.

---

## Part 1: Run it on your machine (local)

You need Node.js installed, and access to an Azure SQL database.

### 1. Create the database tables
In Azure (see Part 2 step 1) or any SQL Server, run the two scripts in order:
1. `db/schema.sql` (creates the tables)
2. `db/seed.sql` (adds the sample gems, suppliers, customers, employees)

### 2. Start the backend
```
cd server
npm install
copy .env.example .env      (on Mac or Linux: cp .env.example .env)
```
Open `.env` and fill in your Azure SQL details (server, database, user, password) and a JWT_SECRET. Then:
```
npm run dev
```
The server starts on port 4000. On first start, if there are no users, it creates the Admin login from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env` (default `admin@serendib.lk` / `admin123`).

### 3. Start the frontend
In a second terminal:
```
cd client
npm install
npm run dev
```
Open the address it prints (usually http://localhost:5173). Log in with the admin email and password. Calls to `/api` are sent to the backend automatically.

---

## Part 2: Deploy to Azure

The whole system runs as ONE Azure App Service. The Express server serves both the React app and the API.

### 1. Create an Azure SQL Database
- In the Azure portal, create an "Azure SQL Database".
- Note the server name (like `yourserver.database.windows.net`), the database name, and the admin login and password.
- In the SQL database, open the query editor and run `db/schema.sql`, then `db/seed.sql`.
- In the SQL server firewall settings, allow Azure services to connect (and add your own IP for testing).

### 2. Build the frontend
```
cd client
npm install
npm run build
```
This creates `client/dist`, which the server serves.

### 3. Create an Azure App Service
- Create an "App Service" with the Node runtime (Node 18 or later).
- Set the startup command to `node src/index.js` with the working folder as `server`, or deploy the `server` folder as the app root. (Simplest: deploy the `server` folder, and copy the built `client/dist` next to it so the path `../../client/dist` still works. If you deploy the whole repo, this already lines up.)

### 4. Set the environment variables in Azure
In the App Service, under Configuration, add the same keys as in `.env`:
- `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`

Do not set `PORT`. Azure sets it for you, and the server reads it with `process.env.PORT`.

### 5. Deploy
- Deploy from GitHub (recommended) using the App Service "Deployment Center", pointed at `ERP-Businessman-s/serendib-erp`.
- Or use the Azure CLI or VS Code Azure extension to push the code.
- After deploy, open the App Service URL. You should see the login page. This URL is the "Azure Deployment URL" for the submission.

---

## Notes
- The `.env` file is never committed. Only `.env.example` is in the repo.
- If the site loads but login fails, check the App Service log. The most common cause is wrong database settings or the firewall blocking the connection.
- Azure SQL requires an encrypted connection. The server already sets `encrypt: true`.
