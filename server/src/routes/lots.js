// Inventory module API. A "Lot" is one gemstone. This is the template the other
// modules follow: list with filters, read one, create, update, delete.
const express = require('express');
const { sql, getPool } = require('../db');
const { authRequired } = require('../auth');

const router = express.Router();
router.use(authRequired); // every inventory endpoint needs a login

// The columns a client is allowed to send when creating or editing a Lot.
const FIELDS = [
  'lot_code', 'name', 'gem_type', 'color', 'carat', 'cut', 'clarity', 'origin',
  'treatment', 'cert_lab', 'cert_no', 'cost_price', 'sale_price', 'status',
  'is_finished', 'image_url', 'supplier_id', 'purchase_id',
];

// GET /api/lots?gem_type=&status=&origin=&search=
router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    const where = [];

    if (req.query.gem_type) { request.input('gem_type', sql.NVarChar(50), req.query.gem_type); where.push('gem_type = @gem_type'); }
    if (req.query.status)   { request.input('status', sql.NVarChar(30), req.query.status);      where.push('status = @status'); }
    if (req.query.origin)   { request.input('origin', sql.NVarChar(80), req.query.origin);      where.push('origin = @origin'); }
    if (req.query.search)   { request.input('search', sql.NVarChar(120), '%' + req.query.search + '%'); where.push('(name LIKE @search OR lot_code LIKE @search)'); }

    const sqlText = 'SELECT * FROM dbo.Lots' +
      (where.length ? ' WHERE ' + where.join(' AND ') : '') +
      ' ORDER BY lot_id DESC';
    const result = await request.query(sqlText);
    res.json(result.recordset);
  } catch (err) { next(err); }
});

// GET /api/lots/:id
router.get('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM dbo.Lots WHERE lot_id = @id');
    if (!result.recordset[0]) return res.status(404).json({ error: 'Lot not found' });
    res.json(result.recordset[0]);
  } catch (err) { next(err); }
});

// GET /api/lots/:id/history -> a timeline of everything that happened to one
// stone, gathered from Procurement, Cutting and Sales. This is the clearest
// proof that the modules share one record and are truly connected.
router.get('/:id/history', async (req, res, next) => {
  try {
    const pool = await getPool();
    const id = req.params.id;
    const lotRes = await pool.request().input('id', sql.Int, id).query('SELECT * FROM dbo.Lots WHERE lot_id = @id');
    const lot = lotRes.recordset[0];
    if (!lot) return res.status(404).json({ error: 'Lot not found' });

    const events = [];

    if (lot.purchase_id) {
      const p = await pool.request().input('pid', sql.Int, lot.purchase_id)
        .query(`SELECT p.purchase_date, s.name AS supplier
                FROM dbo.Purchases p LEFT JOIN dbo.Suppliers s ON s.supplier_id = p.supplier_id
                WHERE p.purchase_id = @pid`);
      const row = p.recordset[0];
      if (row) events.push({ date: row.purchase_date, module: 'Procurement', title: 'Bought as rough', detail: row.supplier ? 'from ' + row.supplier : '' });
    }
    events.push({ date: lot.created_at, module: 'Inventory', title: 'Added to inventory', detail: 'lot ' + lot.lot_code });

    const cj = await pool.request().input('id', sql.Int, id)
      .query(`SELECT c.*, e.name AS cutter FROM dbo.CuttingJobs c
              LEFT JOIN dbo.Employees e ON e.employee_id = c.cutter_id
              WHERE c.lot_id = @id ORDER BY c.job_id`);
    for (const j of cj.recordset) {
      if (j.start_date) events.push({ date: j.start_date, module: 'Cutting', title: 'Cutting started', detail: j.cutter ? 'by ' + j.cutter : '' });
      if (j.end_date) events.push({ date: j.end_date, module: 'Cutting', title: 'Cutting completed', detail: 'now a finished stone' });
    }

    const oi = await pool.request().input('id', sql.Int, id)
      .query(`SELECT o.order_id, o.order_date, o.status, o.channel, c.name AS customer
              FROM dbo.OrderItems oi
              JOIN dbo.Orders o ON o.order_id = oi.order_id
              JOIN dbo.Customers c ON c.customer_id = o.customer_id
              WHERE oi.lot_id = @id ORDER BY o.order_id`);
    for (const o of oi.recordset) {
      const via = o.channel === 'Online' ? 'online shop' : 'walk-in';
      events.push({ date: o.order_date, module: 'Sales', title: 'Reserved on order #' + o.order_id, detail: 'for ' + o.customer + ' (' + via + ')' });
      if (o.status === 'Confirmed') events.push({ date: o.order_date, module: 'Sales', title: 'Sold', detail: 'order #' + o.order_id + ' confirmed' });
    }

    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json({ lot: { lot_id: lot.lot_id, lot_code: lot.lot_code, name: lot.name, status: lot.status }, events });
  } catch (err) { next(err); }
});

// POST /api/lots
router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {};
    const pool = await getPool();
    const request = pool.request();
    const cols = [];
    const vals = [];
    for (const f of FIELDS) {
      if (body[f] !== undefined && body[f] !== null && body[f] !== '') {
        request.input(f, body[f]);
        cols.push(f);
        vals.push('@' + f);
      }
    }
    if (!cols.includes('lot_code') || !cols.includes('name')) {
      return res.status(400).json({ error: 'lot_code and name are required' });
    }
    const result = await request.query(
      `INSERT INTO dbo.Lots (${cols.join(', ')}) OUTPUT INSERTED.* VALUES (${vals.join(', ')})`
    );
    res.status(201).json(result.recordset[0]);
  } catch (err) { next(err); }
});

// PUT /api/lots/:id
router.put('/:id', async (req, res, next) => {
  try {
    const body = req.body || {};
    const pool = await getPool();
    const request = pool.request().input('id', sql.Int, req.params.id);
    const sets = [];
    for (const f of FIELDS) {
      if (body[f] !== undefined) {
        request.input(f, body[f]);
        sets.push(`${f} = @${f}`);
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
    const result = await request.query(
      `UPDATE dbo.Lots SET ${sets.join(', ')} OUTPUT INSERTED.* WHERE lot_id = @id`
    );
    if (!result.recordset[0]) return res.status(404).json({ error: 'Lot not found' });
    res.json(result.recordset[0]);
  } catch (err) { next(err); }
});

// DELETE /api/lots/:id  (blocked if the lot is on a confirmed order)
router.delete('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const check = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT COUNT(*) AS n FROM dbo.OrderItems oi
              JOIN dbo.Orders o ON o.order_id = oi.order_id
              WHERE oi.lot_id = @id AND o.status = 'Confirmed'`);
    if (check.recordset[0].n > 0) {
      return res.status(409).json({ error: 'Cannot delete: this lot is on a confirmed order' });
    }
    await pool.request().input('id', sql.Int, req.params.id)
      .query('DELETE FROM dbo.Lots WHERE lot_id = @id');
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
