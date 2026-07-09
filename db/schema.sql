-- Serendib Gems ERP - database schema (Azure SQL / T-SQL)
-- Run this first, then seed.sql.
-- Safe to re-run: it drops the tables in the right order, then creates them again.

-- ---------- drop (children first, so foreign keys do not block) ----------
IF OBJECT_ID('dbo.Payments','U')     IS NOT NULL DROP TABLE dbo.Payments;
IF OBJECT_ID('dbo.Invoices','U')     IS NOT NULL DROP TABLE dbo.Invoices;
IF OBJECT_ID('dbo.OrderItems','U')   IS NOT NULL DROP TABLE dbo.OrderItems;
IF OBJECT_ID('dbo.Orders','U')       IS NOT NULL DROP TABLE dbo.Orders;
IF OBJECT_ID('dbo.CuttingJobs','U')  IS NOT NULL DROP TABLE dbo.CuttingJobs;
IF OBJECT_ID('dbo.Lots','U')         IS NOT NULL DROP TABLE dbo.Lots;
IF OBJECT_ID('dbo.Purchases','U')    IS NOT NULL DROP TABLE dbo.Purchases;
IF OBJECT_ID('dbo.Customers','U')    IS NOT NULL DROP TABLE dbo.Customers;
IF OBJECT_ID('dbo.Employees','U')    IS NOT NULL DROP TABLE dbo.Employees;
IF OBJECT_ID('dbo.Suppliers','U')    IS NOT NULL DROP TABLE dbo.Suppliers;
IF OBJECT_ID('dbo.Users','U')        IS NOT NULL DROP TABLE dbo.Users;
GO

-- ---------- Users (login accounts) ----------
CREATE TABLE dbo.Users (
  user_id        INT IDENTITY(1,1) PRIMARY KEY,
  name           NVARCHAR(100) NOT NULL,
  email          NVARCHAR(150) NOT NULL UNIQUE,
  password_hash  NVARCHAR(255) NOT NULL,
  role           NVARCHAR(30)  NOT NULL DEFAULT 'Admin',
  created_at     DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- ---------- Suppliers ----------
CREATE TABLE dbo.Suppliers (
  supplier_id  INT IDENTITY(1,1) PRIMARY KEY,
  name         NVARCHAR(150) NOT NULL,
  contact      NVARCHAR(100) NULL,
  country      NVARCHAR(80)  NULL,
  created_at   DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- ---------- Employees (staff, including cutters) ----------
CREATE TABLE dbo.Employees (
  employee_id  INT IDENTITY(1,1) PRIMARY KEY,
  name         NVARCHAR(120) NOT NULL,
  role         NVARCHAR(50)  NULL,
  department   NVARCHAR(50)  NULL,
  is_cutter    BIT           NOT NULL DEFAULT 0,
  join_date    DATE          NULL
);
GO

-- ---------- Customers ----------
CREATE TABLE dbo.Customers (
  customer_id  INT IDENTITY(1,1) PRIMARY KEY,
  name         NVARCHAR(150) NOT NULL,
  email        NVARCHAR(150) NULL,
  phone        NVARCHAR(40)  NULL,
  address      NVARCHAR(255) NULL,
  created_at   DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- ---------- Purchases (a buy from a supplier) ----------
CREATE TABLE dbo.Purchases (
  purchase_id    INT IDENTITY(1,1) PRIMARY KEY,
  supplier_id    INT NOT NULL,
  purchase_date  DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
  total_cost     DECIMAL(12,2) NOT NULL DEFAULT 0,
  status         NVARCHAR(20)  NOT NULL DEFAULT 'Received',
  created_at     DATETIME      NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_Purchases_Supplier FOREIGN KEY (supplier_id) REFERENCES dbo.Suppliers(supplier_id)
);
GO

-- ---------- Lots (the central table: one row is one gemstone) ----------
CREATE TABLE dbo.Lots (
  lot_id       INT IDENTITY(1,1) PRIMARY KEY,
  lot_code     NVARCHAR(30)  NOT NULL,
  name         NVARCHAR(120) NOT NULL,
  gem_type     NVARCHAR(50)  NULL,
  color        NVARCHAR(40)  NULL,
  carat        DECIMAL(6,2)  NULL,
  cut          NVARCHAR(40)  NULL,
  clarity      NVARCHAR(20)  NULL,
  origin       NVARCHAR(80)  NULL,
  treatment    NVARCHAR(60)  NULL,
  cert_lab     NVARCHAR(30)  NULL,
  cert_no      NVARCHAR(50)  NULL,
  cost_price   DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_price   DECIMAL(12,2) NOT NULL DEFAULT 0,
  status       NVARCHAR(30)  NOT NULL DEFAULT 'In Stock (rough)',
  is_finished  BIT           NOT NULL DEFAULT 0,
  image_url    NVARCHAR(255) NULL,
  supplier_id  INT NULL,
  purchase_id  INT NULL,
  created_at   DATETIME      NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_Lots_Supplier FOREIGN KEY (supplier_id) REFERENCES dbo.Suppliers(supplier_id),
  CONSTRAINT FK_Lots_Purchase FOREIGN KEY (purchase_id) REFERENCES dbo.Purchases(purchase_id)
);
GO

-- ---------- CuttingJobs (rough lot -> finished lot) ----------
CREATE TABLE dbo.CuttingJobs (
  job_id      INT IDENTITY(1,1) PRIMARY KEY,
  lot_id      INT NOT NULL,
  cutter_id   INT NULL,
  start_date  DATE NULL,
  end_date    DATE NULL,
  status      NVARCHAR(20) NOT NULL DEFAULT 'Pending',
  notes       NVARCHAR(255) NULL,
  CONSTRAINT FK_Cutting_Lot    FOREIGN KEY (lot_id)    REFERENCES dbo.Lots(lot_id),
  CONSTRAINT FK_Cutting_Cutter FOREIGN KEY (cutter_id) REFERENCES dbo.Employees(employee_id)
);
GO

-- ---------- Orders ----------
CREATE TABLE dbo.Orders (
  order_id      INT IDENTITY(1,1) PRIMARY KEY,
  customer_id   INT NOT NULL,
  order_date    DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
  status        NVARCHAR(20) NOT NULL DEFAULT 'Draft',
  channel       NVARCHAR(20) NOT NULL DEFAULT 'WalkIn',
  total_amount  DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_Orders_Customer FOREIGN KEY (customer_id) REFERENCES dbo.Customers(customer_id)
);
GO

-- ---------- OrderItems (the lots inside an order) ----------
CREATE TABLE dbo.OrderItems (
  order_item_id INT IDENTITY(1,1) PRIMARY KEY,
  order_id      INT NOT NULL,
  lot_id        INT NOT NULL,
  price         DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT FK_OrderItems_Order FOREIGN KEY (order_id) REFERENCES dbo.Orders(order_id),
  CONSTRAINT FK_OrderItems_Lot   FOREIGN KEY (lot_id)   REFERENCES dbo.Lots(lot_id)
);
GO

-- ---------- Invoices ----------
CREATE TABLE dbo.Invoices (
  invoice_id    INT IDENTITY(1,1) PRIMARY KEY,
  order_id      INT NOT NULL,
  invoice_date  DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
  amount        DECIMAL(12,2) NOT NULL DEFAULT 0,
  status        NVARCHAR(20) NOT NULL DEFAULT 'Unpaid',
  CONSTRAINT FK_Invoices_Order FOREIGN KEY (order_id) REFERENCES dbo.Orders(order_id)
);
GO

-- ---------- Payments ----------
CREATE TABLE dbo.Payments (
  payment_id    INT IDENTITY(1,1) PRIMARY KEY,
  invoice_id    INT NOT NULL,
  payment_date  DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
  amount        DECIMAL(12,2) NOT NULL DEFAULT 0,
  method        NVARCHAR(30) NOT NULL DEFAULT 'Cash',
  CONSTRAINT FK_Payments_Invoice FOREIGN KEY (invoice_id) REFERENCES dbo.Invoices(invoice_id)
);
GO
