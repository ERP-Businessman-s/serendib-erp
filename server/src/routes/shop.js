// Public storefront API (no login needed).
// This is the second sales channel. Customers browse finished gems on the public
// shop and place an order. That order lands in the Sales module as an Online order
// with the lots Reserved, exactly like a walk-in order. Sales staff then confirm it.
const express = require('express');
const { sql, getPool } = require('../db');

const router = express.Router();

// GET /api/shop/lots -> finished, in-stock gems the public can buy.
// Only safe fields are sent (no cost price, no supplier).
router.get('/lots', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT lot_id, lot_code, name, gem_type, color, carat, cut, clarity,
             origin, treatment, cert_lab, cert_no, sale_price, image_url
      FROM dbo.Lots
      WHERE status = 'In Stock (finished)'
      ORDER BY sale_price DESC`);
    res.json(result.recordset);
  } catch (err) { next(err); }
});

// POST /api/shop/orders  { customer: { name, email, phone, address }, lot_ids: [] }
// Finds or creates the customer, then creates a Draft Online order and reserves
// the chosen lots. Same rules as the admin Sales order, so the data stays clean.
router.post('/orders', async (req, res, next) => {
  const { customer, lot_ids } = req.body || {};
  if (!customer || !customer.name || !Array.isArray(lot_ids) || lot_ids.length === 0) {
    return res.status(400).json({ error: 'Your name and at least one gem are required' });
  }

  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();

    // Find the customer by email, or make a new customer record.
    let customerId = null;
    if (customer.email) {
      const found = await new sql.Request(tx).input('email', sql.NVarChar(150), customer.email)
        .query('SELECT customer_id FROM dbo.Customers WHERE email = @email');
      if (found.recordset[0]) customerId = found.recordset[0].customer_id;
    }
    if (!customerId) {
      const ins = await new sql.Request(tx)
        .input('name', sql.NVarChar(150), customer.name)
        .input('email', sql.NVarChar(150), customer.email || null)
        .input('phone', sql.NVarChar(40), customer.phone || null)
        .input('address', sql.NVarChar(255), customer.address || null)
        .query(`INSERT INTO dbo.Customers (name, email, phone, address)
                OUTPUT INSERTED.customer_id
                VALUES (@name, @email, @phone, @address)`);
      customerId = ins.recordset[0].customer_id;
    }

    // Check every gem is still a finished lot in stock, and add up the price.
    let total = 0;
    const rows = [];
    for (const id of lot_ids) {
      const lot = await new sql.Request(tx).input('id', sql.Int, id)
        .query('SELECT lot_id, sale_price, status FROM dbo.Lots WHERE lot_id = @id');
      const row = lot.recordset[0];
      if (!row) { await tx.rollback(); return res.status(404).json({ error: 'A selected gem was not found' }); }
      if (row.status !== 'In Stock (finished)') {
        await tx.rollback();
        return res.status(409).json({ error: 'Sorry, one of the gems was just taken. Please refresh and try again.' });
      }
      total += Number(row.sale_price || 0);
      rows.push(row);
    }

    const ord = await new sql.Request(tx)
      .input('customer_id', sql.Int, customerId)
      .input('total', sql.Decimal(12, 2), total)
      .query(`INSERT INTO dbo.Orders (customer_id, order_date, status, channel, total_amount)
              OUTPUT INSERTED.order_id
              VALUES (@customer_id, CAST(GETDATE() AS DATE), 'Draft', 'Online', @total)`);
    const orderId = ord.recordset[0].order_id;

    for (const row of rows) {
      await new sql.Request(tx)
        .input('order_id', sql.Int, orderId)
        .input('lot_id', sql.Int, row.lot_id)
        .input('price', sql.Decimal(12, 2), Number(row.sale_price || 0))
        .query('INSERT INTO dbo.OrderItems (order_id, lot_id, price) VALUES (@order_id, @lot_id, @price)');
      await new sql.Request(tx).input('lot_id', sql.Int, row.lot_id)
        .query(`UPDATE dbo.Lots SET status = 'Reserved' WHERE lot_id = @lot_id`);
    }

    await tx.commit();
    res.status(201).json({ ok: true, order_id: orderId, total });
  } catch (err) {
    try { await tx.rollback(); } catch (_) {}
    next(err);
  }
});

module.exports = router;
