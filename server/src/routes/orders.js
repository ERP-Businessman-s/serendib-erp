// Sales module (part 2): Customer Orders.
// Adding finished lots to an order Reserves them. Confirming the order marks them
// Sold and creates an Invoice. This is the third step of the integration chain,
// and the point where Sales hands over to Billing.
const express = require('express');
const { sql, getPool } = require('../db');
const { authRequired } = require('../auth');

const router = express.Router();
router.use(authRequired);

// GET /api/orders -> list with customer name and item count
router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT o.*, c.name AS customer_name,
        (SELECT COUNT(*) FROM dbo.OrderItems oi WHERE oi.order_id = o.order_id) AS item_count
      FROM dbo.Orders o
      JOIN dbo.Customers c ON c.customer_id = o.customer_id
      ORDER BY o.order_id DESC`);
    res.json(result.recordset);
  } catch (err) { next(err); }
});

// GET /api/orders/:id -> order with its lots
router.get('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const head = await pool.request().input('id', sql.Int, req.params.id)
      .query(`SELECT o.*, c.name AS customer_name FROM dbo.Orders o
              JOIN dbo.Customers c ON c.customer_id = o.customer_id WHERE o.order_id = @id`);
    if (!head.recordset[0]) return res.status(404).json({ error: 'Order not found' });
    const items = await pool.request().input('id', sql.Int, req.params.id)
      .query(`SELECT oi.*, l.lot_code, l.name AS lot_name, l.status AS lot_status
              FROM dbo.OrderItems oi JOIN dbo.Lots l ON l.lot_id = oi.lot_id WHERE oi.order_id = @id`);
    res.json({ ...head.recordset[0], items: items.recordset });
  } catch (err) { next(err); }
});

// POST /api/orders  { customer_id, channel, lot_ids: [] }
// Creates a Draft order and Reserves each finished lot.
router.post('/', async (req, res, next) => {
  const { customer_id, channel, lot_ids } = req.body || {};
  if (!customer_id || !Array.isArray(lot_ids) || lot_ids.length === 0) {
    return res.status(400).json({ error: 'A customer and at least one lot are required' });
  }
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();

    // check every lot is a finished, in-stock lot, and add up the price
    let total = 0;
    const lotRows = [];
    for (const lotId of lot_ids) {
      const r = new sql.Request(tx);
      r.input('id', sql.Int, lotId);
      const lot = await r.query('SELECT lot_id, sale_price, status FROM dbo.Lots WHERE lot_id = @id');
      const row = lot.recordset[0];
      if (!row) { await tx.rollback(); return res.status(404).json({ error: `Lot ${lotId} not found` }); }
      if (row.status !== 'In Stock (finished)') {
        await tx.rollback();
        return res.status(409).json({ error: 'A selected lot is not available (must be a finished lot in stock)' });
      }
      total += Number(row.sale_price || 0);
      lotRows.push(row);
    }

    const oReq = new sql.Request(tx);
    oReq.input('customer_id', sql.Int, customer_id);
    oReq.input('channel', sql.NVarChar(20), channel || 'WalkIn');
    oReq.input('total', sql.Decimal(12, 2), total);
    const oRes = await oReq.query(
      `INSERT INTO dbo.Orders (customer_id, order_date, status, channel, total_amount)
       OUTPUT INSERTED.order_id
       VALUES (@customer_id, CAST(GETDATE() AS DATE), 'Draft', @channel, @total)`);
    const orderId = oRes.recordset[0].order_id;

    for (const row of lotRows) {
      const iReq = new sql.Request(tx);
      iReq.input('order_id', sql.Int, orderId);
      iReq.input('lot_id', sql.Int, row.lot_id);
      iReq.input('price', sql.Decimal(12, 2), Number(row.sale_price || 0));
      await iReq.query('INSERT INTO dbo.OrderItems (order_id, lot_id, price) VALUES (@order_id, @lot_id, @price)');

      const uReq = new sql.Request(tx);
      uReq.input('lot_id', sql.Int, row.lot_id);
      await uReq.query(`UPDATE dbo.Lots SET status = 'Reserved' WHERE lot_id = @lot_id`);
    }

    await tx.commit();
    res.status(201).json({ order_id: orderId, total });
  } catch (err) {
    try { await tx.rollback(); } catch (_) {}
    next(err);
  }
});

// PUT /api/orders/:id/confirm -> lots become Sold, and an Invoice is created.
router.put('/:id/confirm', async (req, res, next) => {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();
    const oReq = new sql.Request(tx);
    oReq.input('id', sql.Int, req.params.id);
    const order = await oReq.query('SELECT order_id, status, total_amount FROM dbo.Orders WHERE order_id = @id');
    const row = order.recordset[0];
    if (!row) { await tx.rollback(); return res.status(404).json({ error: 'Order not found' }); }
    if (row.status !== 'Draft') { await tx.rollback(); return res.status(409).json({ error: 'Only a draft order can be confirmed' }); }

    await new sql.Request(tx).input('id', sql.Int, req.params.id)
      .query(`UPDATE dbo.Orders SET status = 'Confirmed' WHERE order_id = @id`);
    await new sql.Request(tx).input('id', sql.Int, req.params.id)
      .query(`UPDATE dbo.Lots SET status = 'Sold'
              WHERE lot_id IN (SELECT lot_id FROM dbo.OrderItems WHERE order_id = @id)`);
    await new sql.Request(tx).input('id', sql.Int, req.params.id).input('amount', sql.Decimal(12, 2), row.total_amount)
      .query(`INSERT INTO dbo.Invoices (order_id, invoice_date, amount, status)
              VALUES (@id, CAST(GETDATE() AS DATE), @amount, 'Unpaid')`);

    await tx.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await tx.rollback(); } catch (_) {}
    next(err);
  }
});

// PUT /api/orders/:id/cancel -> a draft order is cancelled, its lots go back to stock.
router.put('/:id/cancel', async (req, res, next) => {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();
    const oReq = new sql.Request(tx);
    oReq.input('id', sql.Int, req.params.id);
    const order = await oReq.query('SELECT status FROM dbo.Orders WHERE order_id = @id');
    if (!order.recordset[0]) { await tx.rollback(); return res.status(404).json({ error: 'Order not found' }); }
    if (order.recordset[0].status !== 'Draft') { await tx.rollback(); return res.status(409).json({ error: 'Only a draft order can be cancelled' }); }

    await new sql.Request(tx).input('id', sql.Int, req.params.id)
      .query(`UPDATE dbo.Lots SET status = 'In Stock (finished)'
              WHERE lot_id IN (SELECT lot_id FROM dbo.OrderItems WHERE order_id = @id)`);
    await new sql.Request(tx).input('id', sql.Int, req.params.id)
      .query(`UPDATE dbo.Orders SET status = 'Cancelled' WHERE order_id = @id`);

    await tx.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await tx.rollback(); } catch (_) {}
    next(err);
  }
});

module.exports = router;
