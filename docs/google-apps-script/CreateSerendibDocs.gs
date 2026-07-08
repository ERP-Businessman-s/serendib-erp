/**
 * Serendib Gems ERP - Google Docs generator
 *
 * WHAT THIS DOES
 * It creates a Drive folder called "Serendib Gems ERP Docs" and inside it
 * makes one clean Google Doc for each project document, with real headings,
 * real tables, bullet lists, and shaded code boxes. No Markdown text is left
 * on the page, so there are no formatting issues.
 *
 * HOW TO USE
 * 1. Go to https://script.google.com and click New Project.
 * 2. Delete the sample code, then paste this whole file in.
 * 3. Click Save. Then pick the function "createAllDocs" from the top bar.
 * 4. Click Run. The first time, Google asks you to allow access. Allow it.
 * 5. When it finishes, open Google Drive. The folder with all docs is there.
 *
 * NOTE
 * The content uses ~~~ to mark code boxes and ** ** to mark bold text.
 * You do not need to change anything to run it.
 */

function createAllDocs() {
  var folder = DriveApp.createFolder('Serendib Gems ERP Docs');

  var documents = [
    { name: '00 - README',                     md: DOC_README },
    { name: '01 - CONTEXT (Glossary)',         md: DOC_CONTEXT },
    { name: '02 - SRS',                        md: DOC_SRS },
    { name: '03 - Implementation Plan',        md: DOC_IMPL },
    { name: '04 - Database Design',            md: DOC_DB },
    { name: '05 - Business Process Analysis',  md: DOC_BPA },
    { name: '06 - Git Workflow',               md: DOC_GIT },
    { name: '07 - ADR 0001 (Stack Choice)',    md: DOC_ADR }
  ];

  documents.forEach(function (item) {
    var doc = DocumentApp.create(item.name);
    var body = doc.getBody();
    body.setMarginTop(50).setMarginBottom(50).setMarginLeft(60).setMarginRight(60);
    renderMarkdown(body, item.md);
    removeLeadingBlank(body);
    doc.saveAndClose();
    DriveApp.getFileById(doc.getId()).moveTo(folder);
  });

  Logger.log('Done. Open the folder: ' + folder.getUrl());
}

/* =====================  THE MARKDOWN READER  ===================== */

function renderMarkdown(body, md) {
  var lines = md.split('\n');
  var i = 0;

  while (i < lines.length) {
    var line = lines[i];
    var trimmed = line.trim();

    // Code box between ~~~ markers
    if (trimmed === '~~~') {
      var code = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '~~~') { code.push(lines[i]); i++; }
      i++; // skip the closing ~~~
      appendCodeBox(body, code);
      continue;
    }

    // Table (lines that start with | )
    if (trimmed.charAt(0) === '|') {
      var raw = [];
      while (i < lines.length && lines[i].trim().charAt(0) === '|') { raw.push(lines[i].trim()); i++; }
      var rows = [];
      for (var k = 0; k < raw.length; k++) {
        var rl = raw[k];
        // skip the |---|---| separator line
        if (rl.indexOf('-') > -1 && /^[|\s:\-]+$/.test(rl)) { continue; }
        var cells = rl.split('|');
        if (cells.length && cells[0].trim() === '') { cells.shift(); }
        if (cells.length && cells[cells.length - 1].trim() === '') { cells.pop(); }
        rows.push(cells.map(function (x) { return stripMarks(x.trim()); }));
      }
      if (rows.length) { appendDataTable(body, rows); }
      continue;
    }

    // Blank line
    if (trimmed === '') { i++; continue; }

    // Horizontal line
    if (trimmed === '---') { body.appendHorizontalRule(); i++; continue; }

    // Heading  #  ##  ###  ####
    var hm = /^(#{1,6})\s+(.*)$/.exec(line);
    if (hm) {
      var level = hm[1].length;
      var levels = [
        DocumentApp.ParagraphHeading.HEADING1,
        DocumentApp.ParagraphHeading.HEADING2,
        DocumentApp.ParagraphHeading.HEADING3,
        DocumentApp.ParagraphHeading.HEADING4,
        DocumentApp.ParagraphHeading.HEADING4,
        DocumentApp.ParagraphHeading.HEADING4
      ];
      body.appendParagraph(stripMarks(hm[2])).setHeading(levels[level - 1]);
      i++; continue;
    }

    // Bullet list  -  or  *
    var bm = /^(\s*)[-*]\s+(.*)$/.exec(line);
    if (bm) {
      var indent = bm[1].length;
      var li = body.appendListItem('');
      li.setGlyphType(DocumentApp.GlyphType.BULLET);
      var lvl = Math.floor(indent / 2);
      if (lvl > 0) { li.setNestingLevel(Math.min(lvl, 3)); }
      setRichText(li, bm[2]);
      i++; continue;
    }

    // Numbered list  1.  2.
    var nm = /^(\s*)\d+\.\s+(.*)$/.exec(line);
    if (nm) {
      var li2 = body.appendListItem('');
      li2.setGlyphType(DocumentApp.GlyphType.NUMBER);
      setRichText(li2, nm[2]);
      i++; continue;
    }

    // Normal paragraph
    var p = body.appendParagraph('');
    setRichText(p, line);
    i++;
  }
}

/* Apply **bold** inside a paragraph or list item */
function setRichText(element, raw) {
  var plain = '';
  var bolds = [];
  var i = 0;
  while (i < raw.length) {
    if (raw.charAt(i) === '*' && raw.charAt(i + 1) === '*') {
      var end = raw.indexOf('**', i + 2);
      if (end > -1) {
        var inner = raw.substring(i + 2, end);
        var s = plain.length;
        plain += inner;
        if (plain.length > s) { bolds.push([s, plain.length - 1]); }
        i = end + 2;
        continue;
      }
    }
    plain += raw.charAt(i);
    i++;
  }
  element.setText(plain);
  var t = element.editAsText();
  bolds.forEach(function (r) { t.setBold(r[0], r[1], true); });
}

function stripMarks(s) { return s.replace(/\*\*/g, ''); }

/* A shaded, bordered box for code, folder trees, and diagrams */
function appendCodeBox(body, codeLines) {
  var table = body.appendTable([['']]);
  table.setBorderColor('#d0d7de');
  table.setBorderWidth(1);
  var cell = table.getCell(0, 0);
  cell.setBackgroundColor('#f6f8fa');
  cell.setPaddingTop(8);
  cell.setPaddingBottom(8);
  cell.setPaddingLeft(10);
  cell.setPaddingRight(10);

  var style = {};
  style[DocumentApp.Attribute.FONT_FAMILY] = 'Consolas';
  style[DocumentApp.Attribute.FONT_SIZE] = 9;
  style[DocumentApp.Attribute.FOREGROUND_COLOR] = '#24292e';
  style[DocumentApp.Attribute.SPACING_BEFORE] = 0;
  style[DocumentApp.Attribute.SPACING_AFTER] = 0;

  for (var i = 0; i < codeLines.length; i++) {
    var text = codeLines[i] === '' ? ' ' : codeLines[i];
    var p;
    if (i === 0) { p = cell.getChild(0).asParagraph(); p.setText(text); }
    else { p = cell.appendParagraph(text); }
    p.setAttributes(style);
  }
}

/* A real table with a shaded, bold header row */
function appendDataTable(body, rows) {
  var table = body.appendTable(rows);
  table.setBorderColor('#d0d7de');
  table.setBorderWidth(1);

  var header = table.getRow(0);
  for (var c = 0; c < header.getNumCells(); c++) {
    var hc = header.getCell(c);
    hc.setBackgroundColor('#eef1f4');
    hc.editAsText().setBold(true);
  }

  for (var r = 0; r < table.getNumRows(); r++) {
    var row = table.getRow(r);
    for (var c2 = 0; c2 < row.getNumCells(); c2++) {
      var cell = row.getCell(c2);
      cell.setPaddingTop(3);
      cell.setPaddingBottom(3);
      cell.setPaddingLeft(6);
      cell.setPaddingRight(6);
      cell.editAsText().setFontSize(10);
    }
  }
}

function removeLeadingBlank(body) {
  if (body.getNumChildren() > 1) {
    var first = body.getChild(0);
    if (first.getType() === DocumentApp.ElementType.PARAGRAPH &&
        first.asParagraph().getText() === '') {
      body.removeChild(first);
    }
  }
}

/* =====================  THE DOCUMENT CONTENT  ===================== */

var DOC_README = `# Serendib Gems ERP

An Enterprise Resource Planning (ERP) system for a Sri Lankan gem house. It is a group assignment for the Business Process and ERP Systems module. The system manages the full life of a gemstone: buying it as rough, cutting it, holding it in stock, selling it to a customer, and recording the money.

This repository is the single thing we submit. It has the source code, the database scripts, the documents, and the deployment steps.

## What this system is
Serendib Gems is a gem business. This ERP is the internal system its staff use to run daily operations. It has six modules that share the same data, plus a login and a dashboard. A separate public storefront is the customer facing shop that sends orders into the ERP.

## Modules
1. Inventory. The gem lots and their details (carat, cut, certificate, status, cost, price).
2. Procurement. Suppliers and purchases. Buying rough stones adds them to inventory.
3. Cutting and Workshop. Cutting jobs that turn a rough stone into a finished stone.
4. Sales. Customers and customer orders. Selling a stone reduces stock.
5. Billing. Invoices and payments, plus a simple revenue report.
6. HR and Staff. Employees, including the cutters and sales staff.

Plus: a login page with roles, and a dashboard that shows numbers pulled from all modules.

## How the modules connect
Every gemstone is one Lot. A Lot has a status field. Different modules change this same field, and that is how we show the modules are integrated:

~~~
Procurement buys rough  -> Lot status: In Stock (rough)
Cutting job runs        -> Lot status: In Cutting, then In Stock (finished)
Sales order placed      -> Lot status: Reserved, then Sold
Billing raises invoice  -> revenue recorded
Dashboard               -> reads totals from all of the above
~~~

## Tech stack
- Frontend: React (built with Vite), styled with the Serendib gem design.
- Backend: Node.js with Express, a REST API under /api.
- Database: Azure SQL Database.
- Hosting: one Azure App Service. The Express server serves both the React app and the API.

## Folder structure
~~~
serendib-erp/
  client/        React admin app (the ERP screens)
  server/        Express API and server that serves the client build
  storefront/    The public gem shop (customer sales channel)
  db/            SQL scripts: schema.sql and seed.sql
  docs/          SRS, implementation plan, database design, git workflow, ADRs
  CONTEXT.md     The shared glossary (what our words mean)
  README.md      This file
~~~

## Team
Seven members. Each member owns one lane. See the Implementation Plan for the full table.`;

var DOC_CONTEXT = `# Serendib Gems ERP - Glossary (CONTEXT)

This file is a glossary only. It holds the words we agree to use so all seven team members mean the same thing. It does not hold design or code decisions.

## Language

**Lot**
The single unit of inventory, which is one physical gemstone. It is tracked from purchase to sale. Every Lot has a status that other modules change.
Avoid: item, product, stone (in code), SKU

**Rough**
A Lot that has been bought but not cut yet. It enters inventory through a Purchase.
Avoid: raw, uncut stone

**Finished**
A Lot that has been cut and is ready to sell. It is produced by a Cutting Job from a Rough Lot.
Avoid: polished, cut stone, final product

**Lot Status**
The shared field that proves module integration. It moves through these values: In Stock (rough), In Cutting, In Stock (finished), Reserved, Sold. Procurement, Cutting, and Sales all write to it.
Avoid: state, stage, condition

**Certification**
The independent lab grading of a Lot, which is a lab name plus a certificate number, for example GIA, GRS, or SSEF. It is recorded against the Lot.
Avoid: cert (in prose), grading paper, report

**Supplier**
A party the gem house buys Rough from, such as a miner, a dealer, or an estate.
Avoid: vendor, miner (as the main word), seller

**Purchase**
A buying transaction with a Supplier. Receiving it creates or updates Rough Lots in Inventory and raises the amount the gem house owes the Supplier.
Avoid: procurement order (that is the module name), buy, PO (in prose)

**Cutting Job**
The workshop task that turns one Rough Lot into a Finished Lot. It is assigned to a Cutter.
Avoid: job (alone), work order, production run

**Cutter**
A staff member in HR who does Cutting Jobs. A Cutter is a kind of Employee.
Avoid: worker, craftsman, lapidary

**Customer Order**
A request from a Customer to buy one or more Finished Lots. Placing it Reserves the Lots. Confirming it marks them Sold. It can come from the storefront or from a walk in customer.
Avoid: order (alone), sale, transaction, cart

**Customer**
A person or an organisation that places Customer Orders.
Avoid: client, buyer, account

**Invoice**
The request for payment raised to a Customer once a Customer Order is confirmed.
Avoid: bill, receipt, statement

**Payment**
Money received against an Invoice. Fully paid Invoices count toward revenue.
Avoid: transaction, settlement

**Employee**
A person who works for the gem house, recorded in the HR module. A Cutter is one type of Employee.
Avoid: staff member (in code), user

**User**
A login account for the ERP, with a role that controls what that person can see and do. A User is not the same as an Employee.
Avoid: account, member, login

## Modules
- Inventory. The Lot master data. Every other module reads or writes Lots.
- Procurement. Suppliers and Purchases. This is the source of Rough Lots.
- Cutting and Workshop. Cutting Jobs. This turns Rough into Finished.
- Sales. Customers and Customer Orders. This is the demand side.
- Billing. Invoices and Payments. This is the money side.
- HR and Staff. Employees, including Cutters and sales staff.

Login and the Dashboard are system level features, not modules.`;

var DOC_SRS = `# Software Requirements Specification (SRS)

Version 1.0. Module: Business Process and ERP Systems. Project: Serendib Gems ERP (a prototype ERP for a Sri Lankan gem house).

This document explains, in simple words, what the system must do and what rules it must follow. Every team member should read it before writing any code, so we all build the same thing.

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to describe the requirements for the Serendib Gems ERP system. It lists what the system does, who uses it, the modules it contains, and the rules the system must follow. It is written so that the developers, the report writers, and the presenters all share the same understanding.

### 1.2 Scope
Serendib Gems is a gem business in Sri Lanka. Today many gem businesses still work on paper and in separate spreadsheets. Stock is written in a book, sales are on paper bills, and supplier records are in another file. Because these are not connected, it is hard to know the real stock, the real profit, or which stones are where.

This ERP puts all of that into one connected system. It has six modules that share the same data: Inventory, Procurement, Cutting and Workshop, Sales, Billing, and HR and Staff. It also has a login with roles and a dashboard. The system is a prototype. It does not need every feature of a commercial ERP. It must clearly show how business processes are joined together and how data flows between modules. The system will be deployed to Microsoft Azure and will be reachable by a public URL during the presentation.

### 1.3 Definitions
The full list of terms is in the CONTEXT glossary. The most important ones are:
- Lot: one physical gemstone, the single unit of stock.
- Rough: a Lot that is bought but not cut yet.
- Finished: a Lot that has been cut and is ready to sell.
- Lot Status: the field that shows where a stone is in its life. This one field is changed by three different modules, which is how we prove the modules are integrated.
- Supplier: a party we buy rough stones from.
- Customer: a person or company that buys finished stones.
- Invoice: a request for payment sent to a customer.

### 1.4 References
- Assignment brief: Business Process and ERP Systems Group Assignment.
- Course textbook: Enterprise Systems for Management (2011).
- Lesson 11: ERP Modules. Lesson 12: ERP System Architecture.

## 2. Overall Description

### 2.1 Product perspective
This is a new system. It is a web application. Staff open it in a browser and log in. The frontend is a React application. The backend is a Node.js and Express server that provides a REST API. The data is stored in an Azure SQL database. The whole system runs as one Azure App Service. There is also a separate public storefront. When a customer places an order on the storefront, that order is sent into the ERP Sales module. So the storefront is an input channel, not part of the internal ERP screens.

### 2.2 Product functions
- Let staff log in and control what they can do based on their role.
- Record gem lots with full details and photos, and track each lot status.
- Record suppliers and purchases, and add bought stones to inventory.
- Create cutting jobs that change a rough lot into a finished lot.
- Record customers and their orders, and reduce stock when a stone is sold.
- Create invoices and record payments, and show a simple revenue report.
- Record employees, including the cutters.
- Show a dashboard with live numbers from all modules.

### 2.3 User classes and roles
- Administrator. Can see and do everything. Used for the demo and for setup.
- Inventory and Procurement staff. Manage lots, suppliers, and purchases.
- Workshop staff. Manage cutting jobs.
- Sales staff. Manage customers, orders, invoices, and payments.
- HR staff. Manage employees.

For a prototype, roles mainly control which menu items and pages a user can open.

### 2.4 Operating environment
- Client: any modern web browser on a laptop or phone.
- Server: Node.js on Azure App Service.
- Database: Azure SQL Database.
- The system needs an internet connection because the database is in the cloud.

### 2.5 Constraints
- The system must be deployed to Microsoft Azure and reachable by a public URL.
- The database must be Azure SQL (a relational SQL database), as named in the brief.
- The code must be kept in one GitHub repository with regular commits from all members.
- The team writes JavaScript, so the stack is React and Node, not C# or PHP.

### 2.6 Assumptions
- Each team member has a GitHub account and access to the shared repository.
- The team has access to an Azure account (a free student account is enough).
- Sample data is enough for the demo. Real business data is not needed.
- Money is shown in a single currency for simplicity.

## 3. Specific Requirements
FR means Functional Requirement. NFR means Non Functional Requirement.

### 3.1 Authentication and Access (Login)
- FR-1: The system shall let a user log in with an email and a password.
- FR-2: The system shall reject a wrong email or password with a clear message.
- FR-3: The system shall keep the user logged in using a token, until they log out.
- FR-4: The system shall show menu items based on the user role.
- FR-5: The system shall let a user log out.

### 3.2 Inventory module
- FR-6: The system shall let staff add a new Lot with these details: name, gem type, colour, carat, cut, clarity, origin, treatment, certificate lab, certificate number, cost price, sale price, and a photo.
- FR-7: The system shall give each Lot a status. New rough lots start as In Stock (rough).
- FR-8: The system shall let staff view a list of all Lots, with a filter by gem type, status, and origin.
- FR-9: The system shall let staff open one Lot and see all its details and its current status.
- FR-10: The system shall let staff edit a Lot details.
- FR-11: The system shall show a warning when the number of finished lots in stock falls below a set level.
- FR-12: The system shall not let a Lot be deleted if it is linked to a confirmed order.

### 3.3 Procurement module
- FR-13: The system shall let staff add and edit Suppliers, with name, contact, and country.
- FR-14: The system shall let staff record a Purchase from a Supplier, listing the rough stones bought and their cost.
- FR-15: When a Purchase is received, the system shall create the matching Rough Lots in Inventory with status In Stock (rough).
- FR-16: The system shall show, for each Supplier, the total amount purchased from them.
- FR-17: The system shall let staff view a list of all Purchases.

### 3.4 Cutting and Workshop module
- FR-18: The system shall let staff create a Cutting Job that selects one Rough Lot and assigns one Cutter.
- FR-19: When a Cutting Job is started, the system shall set that Lot status to In Cutting.
- FR-20: When a Cutting Job is completed, the system shall set that Lot status to In Stock (finished) and mark it as Finished.
- FR-21: The system shall let staff view all Cutting Jobs and their status (Pending, In Progress, Done).
- FR-22: The system shall not allow a Cutting Job on a Lot that is already Finished, Reserved, or Sold.

### 3.5 Sales module
- FR-23: The system shall let staff add and edit Customers, with name, email, phone, and address.
- FR-24: The system shall let staff create a Customer Order and add one or more Finished Lots to it.
- FR-25: When a Lot is added to an order, the system shall set that Lot status to Reserved so it cannot be sold twice.
- FR-26: When an order is confirmed, the system shall set the Lots to Sold and reduce stock.
- FR-27: The system shall let staff cancel an order that is not yet confirmed, and return the Lots to In Stock (finished).
- FR-28: The system shall accept orders that arrive from the public storefront and create them in the Sales module.
- FR-29: The system shall show a list of all orders with their status (Draft, Confirmed, Cancelled).

### 3.6 Billing module
- FR-30: When an order is confirmed, the system shall create an Invoice for that order with the total amount.
- FR-31: The system shall let staff record a Payment against an Invoice.
- FR-32: The system shall mark an Invoice as Paid when payments cover the full amount, or Partly Paid otherwise.
- FR-33: The system shall show a simple revenue report: total sales, total received, and total still owed.
- FR-34: The system shall let staff view and save a single invoice.

### 3.7 HR and Staff module
- FR-35: The system shall let staff add and edit Employees, with name, role, department, and join date.
- FR-36: The system shall mark which Employees are Cutters, so the Cutting module can assign them.
- FR-37: The system shall show a list of all Employees.

### 3.8 Dashboard
- FR-38: The system shall show a dashboard after login with these numbers: total lots in stock, total stock value, lots by status, orders this period, revenue this period, and low stock warnings.
- FR-39: The dashboard numbers shall come live from the database, not be typed in by hand.

### 3.9 Non Functional Requirements
- NFR-1 Performance: a normal page should load in about 3 seconds or less.
- NFR-2 Usability: a new user can find a module without training.
- NFR-3 Security: passwords must be stored hashed, never in plain text. Only logged in users can reach the API.
- NFR-4 Reliability: the deployed system must stay reachable during the presentation.
- NFR-5 Portability: the system runs in any modern browser on desktop and mobile.
- NFR-6 Maintainability: each module keeps its code in its own area.
- NFR-7 Data integrity: the database must use keys and relationships so records cannot point to missing data.

## 4. System Integration
Every gemstone in the system is one Lot. A Lot has a single field called status. Three different modules change this same field during the normal business flow. Because they all act on the same shared record, the modules are truly integrated, not just placed side by side.

The normal flow of one gemstone:
1. Procurement buys a rough stone. The system creates a Lot with status In Stock (rough).
2. The Cutting module runs a cutting job. The status becomes In Cutting, then In Stock (finished).
3. The Sales module adds the finished Lot to a customer order. The status becomes Reserved, then Sold.
4. The Billing module creates an invoice and records payment.
5. The Dashboard reads all of this and shows live totals.

## 5. Out of scope for the prototype
- Multi currency and tax rules.
- Online card payment. Payments are recorded by hand.
- Detailed HR payroll.
- Returns and refunds after a sale is confirmed.
- Fine grained per field permissions. Roles only control page access.`;

var DOC_IMPL = `# Project Implementation Plan

Version 1.0. This plan explains who does what, in what order, and how we all work together without stepping on each other. The goal is a working system, deployed to Azure, with all seven members contributing, ready for the presentation.

## 1. The goal in one line
Build a working prototype ERP for a gem house, with six connected modules, a login, and a dashboard. Deploy it to Azure. Keep it in one GitHub repo with commits from all seven members.

## 2. Where the marks are
- Module selection and process integration: 4
- Functional implementation of modules: 4
- Frontend design, UI and navigation: 3
- Azure cloud deployment: 3
- Backend and database: 2
- Presentation and demo: 2
- Business process analysis: 1
- GitHub repo, commit history, team contributions: 1

The two biggest blocks (8 marks) are the modules working and the modules being connected. The next block (6 marks) is a nice UI plus a real Azure deployment. Our plan protects these first.

## 3. The team: seven lanes

| Lane | Owner | What they build |
|------|-------|-----------------|
| 1. Inventory | (name) | Lot list, add or edit a lot, filters, photos, status badges. This is the template all other modules copy. |
| 2. Procurement | (name) | Suppliers, purchases, and the action that adds bought stones into Inventory as rough lots. |
| 3. Cutting and Workshop | (name) | Cutting jobs, assign a cutter, and the status change from rough to finished. |
| 4. Sales | (name) | Customers, customer orders, reserve and sell lots, and accept orders from the storefront. |
| 5. Billing | (name) | Invoices, payments, invoice view, and the revenue report. |
| 6. Auth and Dashboard | (name) | Login page, roles, the menu, and the dashboard with live numbers. |
| 7. Platform | (name) | Azure setup and deployment, the database scripts, wiring the storefront in, the README and the report. |

Note: the AI developer writes the code with each owner. The owner reviews it, tests it, commits it, and learns it well enough to explain it. This is allowed by the rule that AI tools may help as long as students understand and can explain the work.

## 4. Tech stack (already decided)
- Frontend: React, built with Vite.
- Backend: Node.js with Express, a REST API.
- Database: Azure SQL Database.
- Hosting: one Azure App Service that serves both the React build and the API.

## 5. Repository layout
~~~
serendib-erp/
  client/        React admin app (all six modules as pages)
  server/        Express API, database access, and it serves the client build
  storefront/    The public gem shop, sends orders to the API
  db/            schema.sql and seed.sql
  docs/          this plan, the SRS, the database design, the git workflow, ADRs
  CONTEXT.md     the glossary
  README.md
~~~
Inside client/src there is one folder per module, so seven people can work at the same time without their files clashing.

## 6. How we work together
The full rules are in the Git Workflow document. The short version:
- The main branch must always work. Nobody pushes broken code to main.
- Each person works on their own branch, named like inventory-lot-list.
- When a piece is done, open a Pull Request, one teammate looks at it, then it is merged.
- Commit small and often, with a clear message.

## 7. The plan, day by day

### Day 1: Foundation and the first module
- Platform lane: create the Azure SQL database, run schema.sql and seed.sql, and set up the empty Express and React apps. Get hello world deployed to Azure once, early, so we know deployment works.
- Auth lane: build login, the token check, and the empty dashboard shell with the menu.
- Inventory lane: build the Inventory module end to end. This becomes the pattern.
- Target: you can log in, see the menu, open Inventory, and add a lot. It runs on Azure.

### Day 2: The next three modules
- Procurement, Cutting, and Sales lanes each copy the Inventory pattern.
- Focus on the status changes: Procurement creates rough lots, Cutting turns rough into finished, Sales reserves and sells.
- Target: a stone can flow from purchase, to cut, to sold, and you can see its status change.

### Day 3: Money, staff, dashboard, and the storefront link
- Billing lane: invoices and payments and the revenue report.
- HR lane: employees and cutters (light module).
- Auth and Dashboard lane: fill the dashboard with live numbers.
- Platform lane: connect the storefront so a customer order appears in Sales.
- Target: the full chain works, and the dashboard shows real totals.

### Day 4: Deploy, polish, and prepare
- Deploy the final version to Azure and test it from a phone and a laptop.
- Fix UI rough edges and make navigation smooth.
- Write the 3 page report and the 10 slides.
- Make sure every member has commits under their own name.
- Rehearse the demo and the story of the module integration.

## 8. Milestones
- M1 (end of Day 1): login works, Inventory works, app is live on Azure.
- M2 (end of Day 2): four modules work and a stone can flow rough to sold.
- M3 (end of Day 3): all six modules plus dashboard plus storefront link work.
- M4 (end of Day 4): final deploy done, report and slides done, everyone has committed, demo rehearsed.

## 9. Deliverables checklist
- GitHub repository URL, with regular commits from all members.
- Azure deployment URL, reachable during the presentation.
- Report, maximum 3 pages: business process analysis, ERP solution design, technology and deployment.
- Presentation, 10 slides: user login, ERP dashboard, business process workflow, interaction between modules, database, Azure deployment, GitHub repo.

## 10. Testing
- Add a record, edit it, and view it. Check it saved correctly in the database.
- Walk the integration chain and check the Lot status changes at each step.
- Check the dashboard number changes after you add data.

## 11. Risks and how we handle them
- Risk: Azure deployment fails on the last day. Handling: deploy on Day 1 and keep deploying.
- Risk: two people edit the same file and clash. Handling: one folder per module, small frequent commits.
- Risk: a member goes quiet. Handling: modules follow the same pattern so anyone can pick one up.
- Risk: we run out of time. Handling: HR is the lightest module and can be trimmed. The four minimum modules come first.

## 12. Definition of done (for any module)
- You can add, view, and edit its records.
- Its data is saved in Azure SQL, not just in the browser.
- Its part of the integration chain works.
- Its pages use the shared gem design and appear in the menu.
- The owner has committed it and can explain it.`;

var DOC_DB = `# Database Design

Version 1.0. This document lists the database tables, their columns, and how they connect. The database is Azure SQL, which is a relational SQL database.

## 1. The idea in short
There is one central table called Lots. One row in Lots is one gemstone. Almost every other table points to Lots or to a customer, a supplier, or an order. The Lots status column is the shared field that Procurement, Cutting, and Sales all change. That single shared column is the heart of the integration story.

## 2. Tables

### Users

| Column | Type | Notes |
|--------|------|-------|
| user_id | INT, primary key, identity | |
| name | NVARCHAR(100) | |
| email | NVARCHAR(150) | unique |
| password_hash | NVARCHAR(255) | hashed, never plain text |
| role | NVARCHAR(30) | Admin, Inventory, Workshop, Sales, HR |
| created_at | DATETIME | default now |

### Suppliers

| Column | Type | Notes |
|--------|------|-------|
| supplier_id | INT, primary key, identity | |
| name | NVARCHAR(150) | |
| contact | NVARCHAR(100) | phone or email |
| country | NVARCHAR(80) | |
| created_at | DATETIME | default now |

### Purchases

| Column | Type | Notes |
|--------|------|-------|
| purchase_id | INT, primary key, identity | |
| supplier_id | INT, foreign key to Suppliers | |
| purchase_date | DATE | |
| total_cost | DECIMAL(12,2) | |
| status | NVARCHAR(20) | Ordered, Received |
| created_at | DATETIME | default now |

### Lots (the central table)

| Column | Type | Notes |
|--------|------|-------|
| lot_id | INT, primary key, identity | |
| lot_code | NVARCHAR(30) | shown to users, e.g. LOT-001 |
| name | NVARCHAR(120) | e.g. Ceylon Sapphire |
| gem_type | NVARCHAR(50) | Sapphire, Ruby, Emerald |
| color | NVARCHAR(40) | |
| carat | DECIMAL(6,2) | |
| cut | NVARCHAR(40) | Cushion, Oval |
| clarity | NVARCHAR(20) | |
| origin | NVARCHAR(80) | e.g. Ratnapura |
| treatment | NVARCHAR(60) | e.g. No heat |
| cert_lab | NVARCHAR(30) | GIA, GRS, SSEF |
| cert_no | NVARCHAR(50) | |
| cost_price | DECIMAL(12,2) | what we paid |
| sale_price | DECIMAL(12,2) | what we sell for |
| status | NVARCHAR(30) | see status list below |
| is_finished | BIT | 0 rough, 1 finished |
| image_url | NVARCHAR(255) | |
| supplier_id | INT, foreign key to Suppliers | where it came from |
| purchase_id | INT, foreign key to Purchases | which purchase brought it |
| created_at | DATETIME | default now |

Lot status values: In Stock (rough), In Cutting, In Stock (finished), Reserved, Sold.

### CuttingJobs

| Column | Type | Notes |
|--------|------|-------|
| job_id | INT, primary key, identity | |
| lot_id | INT, foreign key to Lots | the stone being cut |
| cutter_id | INT, foreign key to Employees | who cuts it |
| start_date | DATE | |
| end_date | DATE | null until done |
| status | NVARCHAR(20) | Pending, In Progress, Done |
| notes | NVARCHAR(255) | |

### Customers

| Column | Type | Notes |
|--------|------|-------|
| customer_id | INT, primary key, identity | |
| name | NVARCHAR(150) | |
| email | NVARCHAR(150) | |
| phone | NVARCHAR(40) | |
| address | NVARCHAR(255) | |
| created_at | DATETIME | default now |

### Orders

| Column | Type | Notes |
|--------|------|-------|
| order_id | INT, primary key, identity | |
| customer_id | INT, foreign key to Customers | |
| order_date | DATE | |
| status | NVARCHAR(20) | Draft, Confirmed, Cancelled |
| channel | NVARCHAR(20) | Storefront, WalkIn |
| total_amount | DECIMAL(12,2) | |
| created_at | DATETIME | default now |

### OrderItems

| Column | Type | Notes |
|--------|------|-------|
| order_item_id | INT, primary key, identity | |
| order_id | INT, foreign key to Orders | |
| lot_id | INT, foreign key to Lots | |
| price | DECIMAL(12,2) | price at time of sale |

### Invoices

| Column | Type | Notes |
|--------|------|-------|
| invoice_id | INT, primary key, identity | |
| order_id | INT, foreign key to Orders | |
| invoice_date | DATE | |
| amount | DECIMAL(12,2) | |
| status | NVARCHAR(20) | Unpaid, Partly Paid, Paid |

### Payments

| Column | Type | Notes |
|--------|------|-------|
| payment_id | INT, primary key, identity | |
| invoice_id | INT, foreign key to Invoices | |
| payment_date | DATE | |
| amount | DECIMAL(12,2) | |
| method | NVARCHAR(30) | Cash, Bank, Card |

### Employees

| Column | Type | Notes |
|--------|------|-------|
| employee_id | INT, primary key, identity | |
| name | NVARCHAR(120) | |
| role | NVARCHAR(50) | Cutter, Sales, Manager |
| department | NVARCHAR(50) | |
| is_cutter | BIT | 1 if they can be assigned cutting jobs |
| join_date | DATE | |

## 3. How the tables relate
- A Supplier has many Purchases. A Purchase belongs to one Supplier.
- A Purchase brings in many Lots. A Lot came from one Purchase and one Supplier.
- A Lot can have one Cutting Job. A Cutting Job is done by one Employee.
- A Customer has many Orders. An Order belongs to one Customer.
- An Order has many Order Items. Each Order Item points to one Lot.
- An Order has one Invoice. An Invoice has many Payments.

~~~
Suppliers --< Purchases --< Lots >-- CuttingJobs >-- Employees
                              |
                              v
Customers --< Orders --< OrderItems >-- Lots
                 |
                 v
             Invoices --< Payments
~~~

## 4. The status lifecycle of a Lot
~~~
In Stock (rough)     created by Procurement when a purchase is received
   |
In Cutting           set by Cutting when a job starts
   |
In Stock (finished)  set by Cutting when a job is done
   |
Reserved             set by Sales when the lot is added to an order
   |
Sold                 set by Sales when the order is confirmed
~~~
Three modules write to this one column. That is the integration, shown on one screen.

## 5. Seed data
We reuse the twelve gems from the old storefront data as starting Finished lots, and add a few Suppliers, Customers, Employees, and one Admin user. The seed script is db/seed.sql.

## 6. Notes for the developers
- Use foreign keys so bad data cannot be saved.
- Money columns use DECIMAL, not FLOAT, so amounts stay exact.
- Keep the schema in db/schema.sql in the repo so anyone can rebuild the database.`;

var DOC_BPA = `# Business Process Analysis

Version 1.0. This document looks at how a gem house works today, the problems it faces, and how an ERP fixes them.

## 1. The industry
Serendib Gems is a gem house in Sri Lanka. Sri Lanka is famous for gemstones, especially sapphires from the Ratnapura area. A gem house buys rough (uncut) stones, gets them cut and polished, keeps them in stock, and sells finished stones to customers, both local and foreign.

## 2. The main business processes
1. Buying rough stones from suppliers, which can be miners, dealers, or estates.
2. Cutting and polishing. Skilled cutters turn a rough stone into a finished stone.
3. Holding stock. Finished stones are kept safely, each with its details and its lab certificate.
4. Selling. Customers buy finished stones, either by visiting or through the online shop.
5. Handling money and staff. The business raises invoices, takes payments, and manages its staff.

## 3. The stakeholders
- Owner or manager. Wants to know real stock, real profit, and what is selling.
- Procurement staff. Buy rough stones and deal with suppliers.
- Cutters. Do the cutting work in the workshop.
- Sales staff. Deal with customers and orders.
- Accounts staff. Handle invoices and payments.
- Suppliers. Sell rough stones to the business.
- Customers. Buy the finished stones.

## 4. The problems today
- Stock is not clear. The stock book is on paper, so nobody is sure what is really in stock.
- Data is repeated and does not match across the purchase book, the stock book, and the sales bill.
- Hard to track a stone. It is hard to know if a stone is still rough, being cut, reserved, or sold.
- Slow reporting. Finding the profit or the best selling gem type means adding up paper by hand.
- No link between parts. Buying, cutting, selling, and accounts are separate.
- Risk of selling the same stone twice, because there is no single shared record.

## 5. Opportunities for improvement
- One shared record for each stone, so stock is always correct.
- A single status field that shows exactly where each stone is in its life.
- Automatic links. A bought stone appears in stock at once. A sold stone drops stock at once.
- Fast reports. The dashboard shows stock value, sales, and low stock live.
- No double selling, because a stone is marked Reserved as soon as it is added to an order.
- Better decisions, because the owner can see real numbers any time.

## 6. How our ERP maps to these processes

| Business process | ERP module |
|------------------|-----------|
| Buying rough stones | Procurement |
| Holding stock | Inventory |
| Cutting and polishing | Cutting and Workshop |
| Selling | Sales |
| Money | Billing |
| Staff | HR and Staff |

The modules share one central record (the Lot), so a single action flows across the whole business. This is the process integration that the ERP is meant to show.

## 7. Digital transformation angle
Moving a gem house from paper books to one connected cloud system is a clear example of digital transformation. The work does not change (buy, cut, stock, sell), but the way it is recorded and connected changes completely. The result is fewer mistakes, faster answers, and one true version of the data.`;

var DOC_GIT = `# Git Workflow and Team Contribution Guide

Version 1.0. This guide explains how the seven of us share one GitHub repository without breaking each other work. It also makes sure every member has commits under their own name, because team contribution and commit history are worth marks.

## 1. One repository, one workspace
One teammate has already created the GitHub workspace. Everyone else needs to be added as a member with write access. Ask that teammate to add your GitHub username. The repository name is serendib-erp. Everyone clones the same repo.

## 2. First time setup (each person, once)
~~~
git clone <the repo url from GitHub>
cd serendib-erp
~~~
Set your name and email so your commits are counted as yours:
~~~
git config user.name "Your Name"
git config user.email "your-github-email@example.com"
~~~
This step matters. If your name and email are wrong, your commits will not be counted as your contribution.

## 3. The golden rule
The main branch must always work. Never push broken or half finished code straight to main. Always work on your own branch and merge through a Pull Request.

## 4. The daily flow
Get the latest code before you start:
~~~
git checkout main
git pull
~~~
Make a new branch for the piece you are working on:
~~~
git checkout -b inventory-lot-list
~~~
Branch name examples: procurement-suppliers, sales-order-page, billing-invoice, dashboard-kpis.

Do your work. Commit small and often, with clear messages:
~~~
git add .
git commit -m "Add lot list page with type and status filters"
~~~
Good commit messages say what you did in plain words. Bad messages like update or fix do not help.

Push your branch to GitHub:
~~~
git push -u origin inventory-lot-list
~~~
On GitHub, open a Pull Request from your branch into main. One other teammate looks at it and clicks merge. Do not merge your own Pull Request without a quick look from someone else. After it is merged, start again from the top for your next piece.

## 5. When two people change the same file (merge conflict)
- Run git pull origin main into your branch to get the latest.
- Git will mark the lines that clash. Open the file and keep the correct version.
- Ask the other person if you are not sure which change to keep.
- To avoid most conflicts, each person mainly edits files inside their own module folder.

## 6. What must never be committed
- The .env file with the database password. It is already in gitignore.
- The node_modules folder. It is large and is rebuilt with npm install.
- Any real client files or the real client name.

## 7. Making sure everyone contributes
- Every member commits their own work under their own name. Do not let one person commit for everybody.
- Aim for many small commits across all four days, not one big commit at the end.
- Even the report writers and slide makers should commit their documents into the docs folder.

## 8. Quick command reference
~~~
git pull                       get the latest main
git checkout -b my-branch      start a new branch
git add .                      stage your changes
git commit -m "message"        save a commit
git push -u origin my-branch   send your branch to GitHub
~~~`;

var DOC_ADR = `# ADR 0001: React plus Node/Express plus Azure SQL, served as a single app

For an assignment that is focused on Microsoft Azure, the obvious path is ASP.NET Core with Entity Framework, which is the most Azure native option. We chose React plus Node/Express with Azure SQL instead. The reason is that the team already built a polished React gem storefront whose components and design language we want to reuse for the ERP screens, and the team writes JavaScript, not C#. In a 4 day sprint, reusing the existing React work and staying in one language is worth more than the small extra Azure fit that .NET would give.

The Express server does two jobs. It serves the built React admin app, and it exposes the REST endpoints under /api. Because both come from the same server, the whole system deploys as one Azure App Service. There is no CORS to configure, no second host, and no server side rendering setup. This is the lowest risk way to still have a real backend and a real database, which protects the Azure Deployment marks and the Database marks.

We kept Azure SQL, and did not use Cosmos DB or MongoDB, because the assignment brief names Azure SQL Database directly, and the marks reward relational database functionality.

## Considered options
- ASP.NET Core plus EF Core plus Azure SQL. Most Azure native and best possible marks, but it needs C# skills and a full rebuild of the UI, so it throws away the React storefront.
- Next.js plus Prisma plus Azure SQL. One clean codebase and reuses React, but Next.js server side rendering on Azure App Service has setup issues that can waste time in a short sprint.`;
