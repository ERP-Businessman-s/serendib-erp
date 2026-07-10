// Billing module: Invoices and Payments.
// An invoice is created when an order is confirmed (see orders.js). Here we list
// invoices, record payments against them, and give a simple revenue report.
const express = require('express');
const { sql, getPool } = require('../db');
const { authRequired } = require('../auth');

const router = express.Router();
router.use(authRequired);

// GET /api/invoices -> list with customer name and how much has been paid
router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT i.*, o.order_id, c.name AS customer_name,
        (SELECT ISNULL(SUM(amount),0) FROM dbo.Payments p WHERE p.invoice_id = i.invoice_id) AS paid
      FROM dbo.Invoices i
      JOIN dbo.Orders o ON o.order_id = i.order_id
      JOIN dbo.Customers c ON c.customer_id = o.customer_id
      ORDER BY i.invoice_id DESC`);
    res.json(result.recordset);
  } catch (err) { next(err); }
});

// GET /api/invoices/report/summary -> total sales, received, and outstanding
router.get('/report/summary', async (req, res, next) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      SELECT
        (SELECT ISNULL(SUM(amount),0) FROM dbo.Invoices) AS total_sales,
        (SELECT ISNULL(SUM(amount),0) FROM dbo.Payments) AS total_received`);
    const total_sales = Number(r.recordset[0].total_sales);
    const total_received = Number(r.recordset[0].total_received);
    res.json({ total_sales, total_received, outstanding: total_sales - total_received });
  } catch (err) { next(err); }
});

// GET /api/invoices/report/monthly -> sales and money received per month (last 6).
router.get('/report/monthly', async (req, res, next) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      SELECT ym,
             ISNULL(SUM(sales), 0)    AS sales,
             ISNULL(SUM(received), 0) AS received
      FROM (
        SELECT FORMAT(invoice_date, 'yyyy-MM') AS ym, amount AS sales, 0 AS received
        FROM dbo.Invoices
        WHERE invoice_date >= DATEADD(MONTH, -5, CAST(GETDATE() AS DATE))
        UNION ALL
        SELECT FORMAT(payment_date, 'yyyy-MM') AS ym, 0 AS sales, amount AS received
        FROM dbo.Payments
        WHERE payment_date >= DATEADD(MONTH, -5, CAST(GETDATE() AS DATE))
      ) x
      GROUP BY ym ORDER BY ym`);
    res.json(r.recordset);
  } catch (err) { next(err); }
});

// GET /api/invoices/:id -> one invoice with its customer and the lots on it,
// used for the printable invoice view.
router.get('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const head = await pool.request().input('id', sql.Int, req.params.id).query(`
      SELECT i.*, o.order_id, o.order_date, o.channel,
             c.name AS customer_name, c.email AS customer_email,
             c.phone AS customer_phone, c.address AS customer_address,
             (SELECT ISNULL(SUM(amount),0) FROM dbo.Payments p WHERE p.invoice_id = i.invoice_id) AS paid
      FROM dbo.Invoices i
      JOIN dbo.Orders o ON o.order_id = i.order_id
      JOIN dbo.Customers c ON c.customer_id = o.customer_id
      WHERE i.invoice_id = @id`);
    if (!head.recordset[0]) return res.status(404).json({ error: 'Invoice not found' });
    const items = await pool.request().input('id', sql.Int, req.params.id).query(`
      SELECT oi.price, l.lot_code, l.name AS lot_name, l.gem_type, l.carat, l.origin
      FROM dbo.Invoices i
      JOIN dbo.OrderItems oi ON oi.order_id = i.order_id
      JOIN dbo.Lots l ON l.lot_id = oi.lot_id
      WHERE i.invoice_id = @id`);
    res.json({ ...head.recordset[0], items: items.recordset });
  } catch (err) { next(err); }
});

// POST /api/invoices/:id/payments  { amount, method }
// Records a payment and updates the invoice status (Paid / Partly Paid).
router.post('/:id/payments', async (req, res, next) => {
  const { amount, method } = req.body || {};
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'A payment amount is required' });

  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();

    const iReq = new sql.Request(tx);
    iReq.input('id', sql.Int, req.params.id);
    const inv = await iReq.query('SELECT amount FROM dbo.Invoices WHERE invoice_id = @id');
    if (!inv.recordset[0]) { await tx.rollback(); return res.status(404).json({ error: 'Invoice not found' }); }

    await new sql.Request(tx)
      .input('id', sql.Int, req.params.id)
      .input('amount', sql.Decimal(12, 2), Number(amount))
      .input('method', sql.NVarChar(30), method || 'Cash')
      .query(`INSERT INTO dbo.Payments (invoice_id, payment_date, amount, method)
              VALUES (@id, CAST(GETDATE() AS DATE), @amount, @method)`);

    const paidRes = await new sql.Request(tx).input('id', sql.Int, req.params.id)
      .query('SELECT ISNULL(SUM(amount),0) AS paid FROM dbo.Payments WHERE invoice_id = @id');
    const paid = Number(paidRes.recordset[0].paid);
    const newStatus = paid >= Number(inv.recordset[0].amount) ? 'Paid' : 'Partly Paid';

    await new sql.Request(tx).input('id', sql.Int, req.params.id).input('st', sql.NVarChar(20), newStatus)
      .query('UPDATE dbo.Invoices SET status = @st WHERE invoice_id = @id');

    await tx.commit();
    res.status(201).json({ ok: true, paid, status: newStatus });
  } catch (err) {
    try { await tx.rollback(); } catch (_) {}
    next(err);
  }
});

module.exports = router;
