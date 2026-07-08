# Database — Azure SQL scripts

This folder holds the SQL scripts for the Azure SQL database.

- `schema.sql` — creates all the tables (Users, Suppliers, Purchases, Lots, CuttingJobs, Customers, Orders, OrderItems, Invoices, Payments, Employees) with keys and relationships.
- `seed.sql` — fills the database with sample data for the demo (the twelve gems, a few suppliers, customers, employees, and one Admin user).

Run `schema.sql` first, then `seed.sql`, against the Azure SQL database. The full table design is in `../docs/DATABASE-DESIGN.md`.

Scripts are added here next.
