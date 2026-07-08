# Project Implementation Plan
## Serendib Gems ERP

Version 1.0
This plan explains who does what, in what order, and how we all work together without stepping on each other. The goal is a working system, deployed to Azure, with all seven members contributing, ready for the presentation.

---

## 1. The goal in one line
Build a working prototype ERP for a gem house, with six connected modules, a login, and a dashboard. Deploy it to Azure. Keep it in one GitHub repo with commits from all seven members.

## 2. Where the marks are (so we spend time in the right place)
The assignment is out of 20. This is how the marks are split, so we know what matters most:

- Module selection and process integration: 4
- Functional implementation of modules: 4
- Frontend design, UI and navigation: 3
- Azure cloud deployment: 3
- Backend and database: 2
- Presentation and demo: 2
- Business process analysis: 1
- GitHub repo, commit history, team contributions: 1

The two biggest blocks (8 marks) are the modules working and the modules being connected. The next block (6 marks) is a nice UI plus a real Azure deployment. Our plan is built to protect these first.

## 3. The team: seven lanes
Each person owns one lane. Owning a lane means you write the code for it, you commit under your own name, and you can explain it in the viva. The academic rule says every member must be able to explain their part.

| Lane | Owner | What they build |
|------|-------|-----------------|
| 1. Inventory | (name) | Lot list, add or edit a lot, filters, photos, status badges. This is the template all other modules copy. |
| 2. Procurement | (name) | Suppliers, purchases, and the action that adds bought stones into Inventory as rough lots. |
| 3. Cutting and Workshop | (name) | Cutting jobs, assign a cutter, and the status change from rough to finished. |
| 4. Sales | (name) | Customers, customer orders, reserve and sell lots, and accept orders from the storefront. |
| 5. Billing | (name) | Invoices, payments, invoice view, and the revenue report. |
| 6. Auth and Dashboard | (name) | Login page, roles, the menu, and the dashboard with live numbers. |
| 7. Platform | (name) | Azure setup and deployment, the database scripts, wiring the storefront in, the README and the report. |

Note: I (the AI developer) write the code with each owner. The owner reviews it, tests it, commits it, and learns it well enough to explain it. This is allowed by the rule that AI tools may help as long as students understand and can explain the work.

## 4. Tech stack (already decided)
- Frontend: React, built with Vite.
- Backend: Node.js with Express, a REST API.
- Database: Azure SQL Database.
- Hosting: one Azure App Service. The Express server serves both the React build and the API.

See `docs/adr/0001-react-express-azure-sql-single-app.md` for the reason.

## 5. Repository layout
```
serendib-erp/
  client/        React admin app (all six modules as pages)
  server/        Express API, database access, and it serves the client build
  storefront/    The public gem shop (rebranded to Serendib), sends orders to the API
  db/            schema.sql and seed.sql
  docs/          this plan, the SRS, the database design, the git workflow, ADRs
  CONTEXT.md     the glossary
  README.md
```
Inside `client/src` there is one folder per module, so seven people can work at the same time without their files clashing.

## 6. How we work together (short version)
The full rules are in `docs/GIT-WORKFLOW.md`. The short version:
- The `main` branch must always work. Nobody pushes broken code to `main`.
- Each person works on their own branch, named like `inventory-lot-list`.
- When a piece is done, open a Pull Request, one teammate looks at it, then it is merged.
- Commit small and often, with a clear message. This also builds the commit history that is worth marks.

## 7. The plan, day by day
The presentation is on the due date. We have four working days. The order is chosen so that the risky parts (the shared foundation and the Azure deployment) are done early, not left to the last night.

### Day 1: Foundation and the first module
- Platform lane: create the Azure SQL database, run `schema.sql` and `seed.sql`, and set up the empty Express and React apps. Get "hello world" deployed to Azure once, early, so we know deployment works.
- Auth lane: build login, the token check, and the empty dashboard shell with the menu.
- Inventory lane: build the Inventory module end to end (list, add, edit, filters, status). This becomes the pattern.
- End of day target: you can log in, see the menu, open Inventory, and add a lot. It runs on Azure.

### Day 2: The next three modules
- Procurement, Cutting, and Sales lanes each copy the Inventory pattern for their own module.
- Focus on the status changes: Procurement creates rough lots, Cutting turns rough into finished, Sales reserves and sells.
- End of day target: a stone can flow from purchase, to cut, to sold, and you can see its status change on the Inventory page.

### Day 3: Money, staff, dashboard, and the storefront link
- Billing lane: invoices and payments and the revenue report.
- HR lane: employees and cutters (this is a light module).
- Auth and Dashboard lane: fill the dashboard with live numbers from all modules.
- Platform lane: connect the storefront so a customer order on the shop appears in Sales.
- End of day target: the full chain works, and the dashboard shows real totals.

### Day 4: Deploy, polish, and prepare
- Deploy the final version to Azure and test it from a phone and a laptop.
- Fix UI rough edges and make navigation smooth (this protects the 3 UI marks).
- Write the 3 page report and the 10 slides.
- Make sure every member has commits under their own name.
- Rehearse the demo and the story of the module integration.

## 8. Milestones (checkpoints)
- M1 (end of Day 1): login works, Inventory works, app is live on Azure.
- M2 (end of Day 2): four modules work and a stone can flow rough to sold.
- M3 (end of Day 3): all six modules plus dashboard plus storefront link work.
- M4 (end of Day 4): final deploy done, report and slides done, everyone has committed, demo rehearsed.

## 9. Deliverables checklist (from the brief)
- GitHub repository URL, with regular commits from all members.
- Azure deployment URL, reachable during the presentation.
- Report, maximum 3 pages: business process analysis, ERP solution design, technology and deployment.
- Presentation, 10 slides: user login, ERP dashboard, business process workflow, interaction between modules, database, Azure deployment, GitHub repo.

## 10. Testing (keep it simple)
We do not need automated tests for a prototype. Each lane owner does this before merging:
- Add a record, edit it, and view it. Check it saved correctly in the database.
- Walk the integration chain and check the Lot status changes at each step.
- Check the dashboard number changes after you add data.

## 11. Risks and how we handle them
- Risk: Azure deployment fails on the last day. Handling: deploy on Day 1 and keep deploying, so it is never a surprise.
- Risk: two people edit the same file and clash. Handling: one folder per module, and small frequent commits.
- Risk: a member goes quiet. Handling: the Platform and Auth lanes are shared safety nets, and modules follow the same pattern so anyone can pick one up.
- Risk: we run out of time. Handling: HR is the lightest module and can be trimmed. The four minimum modules (Inventory, Procurement, Sales, Billing) come first.

## 12. Definition of done (for any module)
A module is done when:
- You can add, view, and edit its records.
- Its data is saved in Azure SQL, not just in the browser.
- Its part of the integration chain works (the correct Lot status change happens).
- Its pages use the shared gem design and appear in the menu.
- The owner has committed it and can explain it.
