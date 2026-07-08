# Database Design
## Serendib Gems ERP

Version 1.0
This document lists the database tables, their columns, and how they connect. The database is Azure SQL, which is a relational SQL database. Getting this right before coding means all six modules read and write the same shared data, which is what makes the ERP integrated.

---

## 1. The idea in short
There is one central table called `Lots`. One row in `Lots` is one gemstone. Almost every other table points to `Lots` or points to a customer, a supplier, or an order. The `Lots.status` column is the shared field that Procurement, Cutting, and Sales all change. That single shared column is the heart of the integration story.

## 2. Tables

### Users
Login accounts for staff. Not the same as Employees.
| Column | Type | Notes |
|--------|------|-------|
| user_id | INT, primary key, identity | |
| name | NVARCHAR(100) | |
| email | NVARCHAR(150) | unique |
| password_hash | NVARCHAR(255) | hashed, never plain text |
| role | NVARCHAR(30) | Admin, Inventory, Workshop, Sales, HR |
| created_at | DATETIME | default now |

### Suppliers
Parties we buy rough stones from.
| Column | Type | Notes |
|--------|------|-------|
| supplier_id | INT, primary key, identity | |
| name | NVARCHAR(150) | |
| contact | NVARCHAR(100) | phone or email |
| country | NVARCHAR(80) | |
| created_at | DATETIME | default now |

### Purchases
One buying event from a supplier.
| Column | Type | Notes |
|--------|------|-------|
| purchase_id | INT, primary key, identity | |
| supplier_id | INT, foreign key to Suppliers | |
| purchase_date | DATE | |
| total_cost | DECIMAL(12,2) | |
| status | NVARCHAR(20) | Ordered, Received |
| created_at | DATETIME | default now |

### Lots (the central table)
One row is one gemstone.
| Column | Type | Notes |
|--------|------|-------|
| lot_id | INT, primary key, identity | |
| lot_code | NVARCHAR(30) | shown to users, e.g. LOT-001 |
| name | NVARCHAR(120) | e.g. Ceylon Sapphire |
| gem_type | NVARCHAR(50) | Sapphire, Ruby, Emerald, etc. |
| color | NVARCHAR(40) | |
| carat | DECIMAL(6,2) | |
| cut | NVARCHAR(40) | Cushion, Oval, etc. |
| clarity | NVARCHAR(20) | |
| origin | NVARCHAR(80) | e.g. Ratnapura, Sri Lanka |
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

Lot status values: `In Stock (rough)`, `In Cutting`, `In Stock (finished)`, `Reserved`, `Sold`.

### CuttingJobs
Turns a rough Lot into a finished Lot.
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
People or companies who buy.
| Column | Type | Notes |
|--------|------|-------|
| customer_id | INT, primary key, identity | |
| name | NVARCHAR(150) | |
| email | NVARCHAR(150) | |
| phone | NVARCHAR(40) | |
| address | NVARCHAR(255) | |
| created_at | DATETIME | default now |

### Orders
A customer order header.
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
The lots inside an order. One row per lot on the order.
| Column | Type | Notes |
|--------|------|-------|
| order_item_id | INT, primary key, identity | |
| order_id | INT, foreign key to Orders | |
| lot_id | INT, foreign key to Lots | |
| price | DECIMAL(12,2) | price at time of sale |

### Invoices
Raised when an order is confirmed.
| Column | Type | Notes |
|--------|------|-------|
| invoice_id | INT, primary key, identity | |
| order_id | INT, foreign key to Orders | |
| invoice_date | DATE | |
| amount | DECIMAL(12,2) | |
| status | NVARCHAR(20) | Unpaid, Partly Paid, Paid |

### Payments
Money received against an invoice.
| Column | Type | Notes |
|--------|------|-------|
| payment_id | INT, primary key, identity | |
| invoice_id | INT, foreign key to Invoices | |
| payment_date | DATE | |
| amount | DECIMAL(12,2) | |
| method | NVARCHAR(30) | Cash, Bank, Card |

### Employees
Staff records, including cutters.
| Column | Type | Notes |
|--------|------|-------|
| employee_id | INT, primary key, identity | |
| name | NVARCHAR(120) | |
| role | NVARCHAR(50) | Cutter, Sales, Manager |
| department | NVARCHAR(50) | |
| is_cutter | BIT | 1 if they can be assigned cutting jobs |
| join_date | DATE | |

## 3. How the tables relate (ERD in words)
- A Supplier has many Purchases. A Purchase belongs to one Supplier.
- A Purchase brings in many Lots. A Lot came from one Purchase and one Supplier.
- A Lot can have one Cutting Job. A Cutting Job is done by one Employee (a cutter).
- A Customer has many Orders. An Order belongs to one Customer.
- An Order has many Order Items. Each Order Item points to one Lot.
- An Order has one Invoice. An Invoice has many Payments.

Simple text diagram:
```
Suppliers --< Purchases --< Lots >-- (one) CuttingJobs >-- Employees
                              |
                              v
Customers --< Orders --< OrderItems >-- Lots
                 |
                 v
             Invoices --< Payments
```
The `>--` and `--<` marks show which side has many. For example `Suppliers --< Purchases` means one supplier has many purchases.

## 4. The status lifecycle of a Lot
This is the single most important flow to understand:
```
In Stock (rough)   <- created by Procurement when a purchase is received
   |
In Cutting         <- set by Cutting when a job starts
   |
In Stock (finished)<- set by Cutting when a job is done
   |
Reserved           <- set by Sales when the lot is added to an order
   |
Sold               <- set by Sales when the order is confirmed
```
Three modules write to this one column. That is the integration, shown on one screen.

## 5. Seed data (for the demo)
We reuse the twelve gems from the old storefront data as starting Finished lots, and add a few Suppliers, Customers, Employees, and one Admin user. The seed script is `db/seed.sql`. Sample data is enough for the demo, real business data is not needed.

## 6. Notes for the developers
- Use foreign keys so bad data cannot be saved (for example, an order item cannot point to a lot that does not exist). This is worth database marks.
- Money columns use DECIMAL, not FLOAT, so amounts stay exact.
- Keep the schema in `db/schema.sql` in the repo so anyone can rebuild the database.
