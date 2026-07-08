# Software Requirements Specification (SRS)
## Serendib Gems ERP

Version 1.0
Module: Business Process and ERP Systems
Project: Serendib Gems ERP (a prototype ERP for a Sri Lankan gem house)

This document explains, in simple words, what the system must do and what rules it must follow. Every team member should read it before writing any code, so we all build the same thing.

---

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to describe the requirements for the Serendib Gems ERP system. It lists what the system does, who uses it, the modules it contains, and the rules the system must follow. It is written so that the developers, the report writers, and the presenters all share the same understanding.

### 1.2 Scope
Serendib Gems is a gem business in Sri Lanka. Today many gem businesses still work on paper and in separate spreadsheets. Stock is written in a book, sales are on paper bills, and supplier records are in another file. Because these are not connected, it is hard to know the real stock, the real profit, or which stones are where.

This ERP puts all of that into one connected system. It has six modules that share the same data:

1. Inventory
2. Procurement
3. Cutting and Workshop
4. Sales
5. Billing
6. HR and Staff

It also has a login with roles and a dashboard. The system is a prototype. It does not need every feature of a commercial ERP. It must clearly show how business processes are joined together and how data flows between modules.

The system will be deployed to Microsoft Azure and will be reachable by a public URL during the presentation.

### 1.3 Definitions
The full list of terms is in `CONTEXT.md` at the top of the repository. The most important ones are:

- Lot: one physical gemstone, the single unit of stock.
- Rough: a Lot that is bought but not cut yet.
- Finished: a Lot that has been cut and is ready to sell.
- Lot Status: the field that shows where a stone is in its life (In Stock, In Cutting, Reserved, Sold). This one field is changed by three different modules, which is how we prove the modules are integrated.
- Supplier: a party we buy rough stones from.
- Customer: a person or company that buys finished stones.
- Invoice: a request for payment sent to a customer.

### 1.4 References
- Assignment brief: Business Process and ERP Systems Group Assignment.
- Course textbook: Enterprise Systems for Management (2011).
- Lesson 11: ERP Modules. Lesson 12: ERP System Architecture.
- Project glossary: `CONTEXT.md`.
- Architecture decision: `docs/adr/0001-react-express-azure-sql-single-app.md`.

### 1.5 Overview of this document
Section 2 gives the big picture: the users, the environment, and the main constraints. Section 3 lists the detailed requirements, both functional (what the system does) and non functional (how well it must do it). Section 4 explains how the modules connect. Section 5 lists assumptions.

---

## 2. Overall Description

### 2.1 Product perspective
This is a new system. It is a web application. Staff open it in a browser and log in. The frontend is a React application. The backend is a Node.js and Express server that provides a REST API. The data is stored in an Azure SQL database. The whole system runs as one Azure App Service.

There is also a separate public storefront (the earlier "Gemz" shop). It is the customer facing website. When a customer places an order on the storefront, that order is sent into the ERP Sales module. So the storefront is an input channel, not part of the internal ERP screens.

### 2.2 Product functions (summary)
At a high level the system can:

- Let staff log in and control what they can do based on their role.
- Record gem lots with full details and photos, and track each lot's status.
- Record suppliers and purchases, and add bought stones to inventory.
- Create cutting jobs that change a rough lot into a finished lot.
- Record customers and their orders, and reduce stock when a stone is sold.
- Create invoices and record payments, and show a simple revenue report.
- Record employees, including the cutters.
- Show a dashboard with live numbers from all modules.

### 2.3 User classes and roles
The system has these user roles:

- Administrator. Can see and do everything. Used for the demo and for setup.
- Inventory and Procurement staff. Manage lots, suppliers, and purchases.
- Workshop staff. Manage cutting jobs.
- Sales staff. Manage customers, orders, invoices, and payments.
- HR staff. Manage employees.

For a prototype, roles mainly control which menu items and pages a user can open. The Administrator role is the main one used in the demo. The other roles show that role based access exists.

### 2.4 Operating environment
- Client: any modern web browser (Chrome, Edge, Firefox) on a laptop or phone.
- Server: Node.js on Azure App Service.
- Database: Azure SQL Database.
- The system needs an internet connection because the database is in the cloud.

### 2.5 Design and implementation constraints
- The system must be deployed to Microsoft Azure and reachable by a public URL.
- The database must be Azure SQL (a relational SQL database), as named in the brief.
- The code must be kept in one GitHub repository with regular commits from all members.
- The team writes JavaScript, so the stack is React and Node, not C# or PHP.
- The build must be finished and deployed before the presentation on the due date.

### 2.6 Assumptions and dependencies
- Each team member has a GitHub account and access to the shared repository.
- The team has access to an Azure account (a free student account is enough).
- Sample data (gems, suppliers, customers) is enough for the demo. Real business data is not needed.
- Money is shown in a single currency for simplicity.

---

## 3. Specific Requirements

Requirements are given an ID so the report and the test list can point to them. FR means Functional Requirement. NFR means Non Functional Requirement.

### 3.1 External interface requirements

#### 3.1.1 User interfaces
- All pages use the Serendib gem design: serif headings, a navy accent colour, and clean white space.
- There is a left side menu to move between modules.
- Every list page has a search or filter box, an "add new" button, and a table of records.
- Every record can be opened, edited, and (where it makes sense) deleted.

#### 3.1.2 Software interfaces
- The frontend talks to the backend using REST calls over HTTPS in JSON format.
- The backend talks to Azure SQL using a SQL driver.
- The storefront sends new orders to the backend using the same REST API.

### 3.2 Functional Requirements

#### 3.2.1 Authentication and Access (Login)
- FR-1: The system shall let a user log in with an email and a password.
- FR-2: The system shall reject a wrong email or password with a clear message.
- FR-3: The system shall keep the user logged in using a token, until they log out.
- FR-4: The system shall show menu items based on the user's role.
- FR-5: The system shall let a user log out.

#### 3.2.2 Inventory module
- FR-6: The system shall let staff add a new Lot with these details: name, gem type, colour, carat, cut, clarity, origin, treatment, certificate lab, certificate number, cost price, sale price, and a photo.
- FR-7: The system shall give each Lot a status. New rough lots start as "In Stock (rough)".
- FR-8: The system shall let staff view a list of all Lots, with a filter by gem type, status, and origin.
- FR-9: The system shall let staff open one Lot and see all its details and its current status.
- FR-10: The system shall let staff edit a Lot's details.
- FR-11: The system shall show a warning when the number of finished lots in stock falls below a set level (low stock).
- FR-12: The system shall not let a Lot be deleted if it is linked to a confirmed order.

#### 3.2.3 Procurement module
- FR-13: The system shall let staff add and edit Suppliers, with name, contact, and country.
- FR-14: The system shall let staff record a Purchase from a Supplier, listing the rough stones bought and their cost.
- FR-15: When a Purchase is received, the system shall create the matching Rough Lots in Inventory with status "In Stock (rough)".
- FR-16: The system shall show, for each Supplier, the total amount purchased from them.
- FR-17: The system shall let staff view a list of all Purchases.

#### 3.2.4 Cutting and Workshop module
- FR-18: The system shall let staff create a Cutting Job that selects one Rough Lot and assigns one Cutter (an employee).
- FR-19: When a Cutting Job is started, the system shall set that Lot's status to "In Cutting".
- FR-20: When a Cutting Job is completed, the system shall set that Lot's status to "In Stock (finished)" and mark it as Finished.
- FR-21: The system shall let staff view all Cutting Jobs and their status (Pending, In Progress, Done).
- FR-22: The system shall not allow a Cutting Job on a Lot that is already Finished, Reserved, or Sold.

#### 3.2.5 Sales module
- FR-23: The system shall let staff add and edit Customers, with name, email, phone, and address.
- FR-24: The system shall let staff create a Customer Order and add one or more Finished Lots to it.
- FR-25: When a Lot is added to an order, the system shall set that Lot's status to "Reserved" so it cannot be sold twice.
- FR-26: When an order is confirmed, the system shall set the Lots to "Sold" and reduce stock.
- FR-27: The system shall let staff cancel an order that is not yet confirmed, and return the Lots to "In Stock (finished)".
- FR-28: The system shall accept orders that arrive from the public storefront and create them in the Sales module.
- FR-29: The system shall show a list of all orders with their status (Draft, Confirmed, Cancelled).

#### 3.2.6 Billing module
- FR-30: When an order is confirmed, the system shall create an Invoice for that order with the total amount.
- FR-31: The system shall let staff record a Payment against an Invoice.
- FR-32: The system shall mark an Invoice as Paid when payments cover the full amount, or Partly Paid otherwise.
- FR-33: The system shall show a simple revenue report: total sales, total received, and total still owed.
- FR-34: The system shall let staff view and print (or save) a single invoice.

#### 3.2.7 HR and Staff module
- FR-35: The system shall let staff add and edit Employees, with name, role, department, and join date.
- FR-36: The system shall mark which Employees are Cutters, so the Cutting module can assign them.
- FR-37: The system shall show a list of all Employees.

#### 3.2.8 Dashboard
- FR-38: The system shall show a dashboard after login with these numbers: total lots in stock, total stock value, lots by status, orders this period, revenue this period, and low stock warnings.
- FR-39: The dashboard numbers shall come live from the database, not be typed in by hand.

### 3.3 Non Functional Requirements

- NFR-1 (Performance): A normal page should load in about 3 seconds or less on a normal internet connection.
- NFR-2 (Usability): The menu and buttons should be clear enough that a new user can find a module without training.
- NFR-3 (Security): Passwords must be stored in a hashed form, never in plain text. Only logged in users can reach the API.
- NFR-4 (Reliability): The deployed system must stay reachable at its public URL during the presentation.
- NFR-5 (Portability): The system runs in any modern browser on desktop and mobile.
- NFR-6 (Maintainability): Each module keeps its code in its own area so seven people can work at the same time without clashing.
- NFR-7 (Data integrity): The database must use keys and relationships so that, for example, an order cannot point to a Lot that does not exist.

---

## 4. System Integration (how the modules connect)

This is the most important part for marks, so it is explained clearly here.

Every gemstone in the system is one Lot. A Lot has a single field called `status`. Three different modules change this same field during the normal business flow. Because they all act on the same shared record, the modules are truly integrated, not just placed side by side.

The normal flow of one gemstone:

1. Procurement buys a rough stone from a supplier. The system creates a Lot with status "In Stock (rough)".
2. The Cutting module runs a cutting job on that Lot. The status becomes "In Cutting", then "In Stock (finished)".
3. The Sales module adds the finished Lot to a customer order. The status becomes "Reserved", then "Sold".
4. The Billing module creates an invoice for that order and records payment.
5. The Dashboard reads all of this and shows live totals.

So one purchase in Procurement changes what Inventory shows, what Cutting can work on, what Sales can sell, what Billing charges, and what the Dashboard reports. This single chain is what we demonstrate live and draw on the "Interaction Between ERP Modules" slide.

---

## 5. Appendix: out of scope for the prototype

To keep the 4 day build realistic, these are on purpose left out:

- Multi currency and tax rules.
- Online card payment. Payments are recorded by hand.
- Detailed HR payroll and salary payments.
- Returns and refunds after a sale is confirmed.
- Fine grained per field permissions. Roles only control page access.

These can be listed in the report as "future work".
