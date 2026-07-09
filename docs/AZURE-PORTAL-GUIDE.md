# Azure Portal Deploy Guide (step by step)
## Serendib Gems ERP

This gets the app live on Azure using the portal (clicking, not commands). Follow it in order. It should take about 20 to 30 minutes. Everything here fits in the free tiers, so it should cost nothing.

You will create two things:
1. An **Azure SQL Database** (the data).
2. An **App Service** web app (runs the code, from GitHub).

---

## Before you start
- Sign in at https://portal.azure.com with your Azure for Students account (use your NSBM email if that is the one with credit).
- Have the repo open in another tab: https://github.com/ERP-Businessman-s/serendib-erp
- Pick and write down two things now, you will reuse them:
  - A SQL admin username, for example `erpadmin`
  - A strong SQL password, for example `Serendib#2026Gems` (use your own)

---

## Part 1: Create the Azure SQL Database

1. In the portal search bar, type **SQL databases**, open it, click **Create**.
2. **Basics tab:**
   - Subscription: your student subscription.
   - Resource group: click **Create new**, name it `serendib-erp-rg`.
   - Database name: `serendib_erp`
   - Server: click **Create new**.
     - Server name: something unique, for example `serendib-sql-<yourname>` (lowercase, no spaces).
     - Location: pick one near you, for example `Southeast Asia`.
     - Authentication method: choose **Use SQL authentication**.
     - Server admin login: the username you picked (for example `erpadmin`).
     - Password: the password you picked. Click **OK**.
   - Want to use SQL elastic pool: **No**.
   - Workload environment: **Development**.
3. Look for **Compute + storage**, click **Configure database**. Choose the option that says **free** if it is offered (Azure gives a free database amount each month). If you do not see a free option, pick **Basic** or the cheapest serverless. Click **Apply**.
4. **Networking tab:**
   - Connectivity method: **Public endpoint**.
   - Allow Azure services and resources to access this server: **Yes**.
   - Add current client IP address: **Yes** (so you can run the scripts).
5. Click **Review + create**, then **Create**. Wait for it to finish (a few minutes).

When it is done, click **Go to resource**. You are on the database page.

Write down your server name now. It looks like `serendib-sql-<yourname>.database.windows.net`.

---

## Part 2: Create the tables and sample data

1. On the database page, in the left menu, open **Query editor (preview)**.
2. Sign in with **SQL server authentication**, using the admin username and password from Part 1.
   - If it says your IP is not allowed, go to the SQL server > Networking, add your client IP, save, and try again.
3. Open `db/schema.sql` from the GitHub repo, copy the whole file, paste it into the query editor, and click **Run**. It should say it ran with no errors.
4. Clear the editor. Open `db/seed.sql`, copy the whole file, paste it, click **Run**. This adds the gems, suppliers, customers, and employees.
5. Check it worked: run `SELECT COUNT(*) FROM dbo.Lots;` You should see 14.

---

## Part 3: Create the App Service (web app)

1. In the portal search bar, type **App Services**, open it, click **Create** > **Web App**.
2. **Basics tab:**
   - Subscription: your student subscription.
   - Resource group: pick the same `serendib-erp-rg`.
   - Name: something unique, for example `serendib-erp-<yourname>`. This becomes your public URL: `https://serendib-erp-<yourname>.azurewebsites.net`.
   - Publish: **Code**.
   - Runtime stack: **Node 20 LTS**.
   - Operating System: **Linux**.
   - Region: same region as the database.
   - Pricing plan: click it and choose the **Free F1** plan.
3. Click **Review + create**, then **Create**. Wait for it to finish, then **Go to resource**.

---

## Part 4: Add the settings (environment variables)

1. On the App Service page, left menu, open **Settings > Environment variables** (older portals call it **Configuration > Application settings**).
2. Add these one by one (click **Add** for each), using YOUR database values:

   | Name | Value |
   |------|-------|
   | `DB_SERVER` | your server, for example `serendib-sql-<yourname>.database.windows.net` |
   | `DB_NAME` | `serendib_erp` |
   | `DB_USER` | your SQL admin login, for example `erpadmin` |
   | `DB_PASSWORD` | your SQL password |
   | `JWT_SECRET` | any long random text, for example `k8Q2p7Lm9xVrT3wZ6nB1cA4` |
   | `ADMIN_EMAIL` | `admin@serendib.lk` |
   | `ADMIN_PASSWORD` | pick an admin password, for example `Admin#2026` |
   | `ADMIN_NAME` | `Serendib Admin` |

   Do NOT add `PORT`. Azure sets it for you.
3. Click **Apply** (or **Save**) at the bottom.

---

## Part 5: Connect it to GitHub (deploy)

1. On the App Service page, left menu, open **Deployment > Deployment Center**.
2. Source: **GitHub**. Click **Authorize** if it asks, and allow it.
3. Organization: **ERP-Businessman-s**. Repository: **serendib-erp**. Branch: **main**.
4. Build provider: leave the default (**GitHub Actions**).
5. Click **Save**. Azure adds a workflow file to the repo and starts building. This first build takes a few minutes (it installs packages, builds the React app, and deploys).
6. Watch progress on the **Logs** tab here, or on the repo's **Actions** tab on GitHub. Wait until it shows success (a green tick).

---

## Part 6: Open the live site

1. On the App Service page, click the **Default domain** URL at the top, for example `https://serendib-erp-<yourname>.azurewebsites.net`.
2. You should see the Serendib login page.
3. Log in with `admin@serendib.lk` and the `ADMIN_PASSWORD` you set in Part 4.
4. You should see the dashboard with real numbers, and the Inventory list with the seeded gems.

That URL is your **Azure Deployment URL** for the submission.

---

## If something goes wrong

- **The site shows an error or "Application Error":** open the App Service > **Log stream** (under Monitoring) and read the last lines. The most common cause is a wrong database setting in Part 4, or the SQL firewall not allowing Azure services (Part 1 step 4).
- **Login says the server is not reachable:** check that "Allow Azure services and resources to access this server" is **Yes** on the SQL server Networking page.
- **The build failed on GitHub Actions:** open the Actions tab, click the failed run, read the red step. Send me the message and I will fix it.
- **First page load is slow:** the Free F1 plan sleeps when idle, so the first hit after a while takes 20 to 30 seconds. This is normal. For the presentation, open it once a minute before you demo so it stays awake.

---

## What to give me after
Once it is live, paste me the site URL. I will confirm it works and then continue building the Purchases, Cutting, Orders and Billing modules (the automatic status flow).
