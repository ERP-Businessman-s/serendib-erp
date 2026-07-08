# Serendib Gems ERP

This is the internal back office system that a Sri Lankan gem house runs on. It manages the life of a gemstone from the moment it is bought as rough, through cutting, into stock, out as a customer sale, and finally into the accounts. The public storefront (built earlier as "Gemz") is one sales channel that feeds this ERP. The storefront is not the ERP itself.

This file is a glossary only. It holds the words we agree to use so all seven team members mean the same thing. It does not hold design or code decisions.

## Language

**Lot**
The single unit of inventory, which is one physical gemstone. It is tracked from purchase to sale. Every Lot has a status that other modules change (see Lot Status).
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
Avoid: staff member (in code), user (a User is a login account, not the same thing)

**User**
A login account for the ERP, with a role that controls what that person can see and do. A User is not the same as an Employee.
Avoid: account, member, login

## Modules

The six functional modules. Each one is a standard ERP module type, themed to gems.

- Inventory. The Lot master data. Every other module reads or writes Lots.
- Procurement. Suppliers and Purchases. This is the source of Rough Lots.
- Cutting and Workshop. Cutting Jobs. This turns Rough into Finished.
- Sales. Customers and Customer Orders. This is the demand side.
- Billing. Invoices and Payments. This is the money side.
- HR and Staff. Employees, including Cutters and sales staff.

Login and the Dashboard are system level features, not modules.
