// Procurement module (part 2): Purchases.
// Recording a purchase creates Rough Lots in Inventory. This is the first step
// of the integration chain: a buy in Procurement makes new lots appear in stock.
const express = require('express');
const { sql, getPool } = require('../db');
const { authRequired } = require('../auth');

const router = express.Router();
router.use(authRequired);

// GET /api/purchases  -> list with supplier name and how many lots it brought in
router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT p.*, s.name AS supplier_name,
        (SELECT COUNT(*) FROM dbo.Lots l WHERE l.purchase_id = p.purchase_id) AS lot_count
      FROM dbo.Purchases p
      JOIN dbo.Suppliers s ON s.supplier_id = p.supplier_id
      ORDER BY p.purchase_id DESC`);
    res.json(result.recordset);
  } catch (err) { next(err); }
});

// POST /api/purchases
// body: { supplier_id, purchase_date, items: [{ name, gem_type, carat, cost_price }] }
// Creates the purchase, then one Rough Lot per item, all in one transaction.
router.post('/', async (req, res, next) => {
  const { supplier_id, purchase_date, items } = req.body || {};
  if (!supplier_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'A supplier and at least one item are required' });
  }
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();
    const total = items.reduce((s, i) => s + Number(i.cost_price || 0), 0);

    const pReq = new sql.Request(tx);
    pReq.input('supplier_id', sql.Int, supplier_id);
    pReq.input('pdate', sql.Date, purchase_date || new Date());
    pReq.input('total', sql.Decimal(12, 2), total);
    const pRes = await pReq.query(
      `INSERT INTO dbo.Purchases (supplier_id, purchase_date, total_cost, status)
       OUTPUT INSERTED.purchase_id
       VALUES (@supplier_id, @pdate, @total, 'Received')`);
    const purchaseId = pRes.recordset[0].purchase_id;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const lReq = new sql.Request(tx);
      lReq.input('code', sql.NVarChar(30), `P${purchaseId}-${i + 1}`);
      lReq.input('name', sql.NVarChar(120), it.name || 'Rough stone');
      lReq.input('gem_type', sql.NVarChar(50), it.gem_type || null);
      lReq.input('carat', sql.Decimal(6, 2), it.carat ? Number(it.carat) : null);
      lReq.input('cost', sql.Decimal(12, 2), Number(it.cost_price || 0));
      lReq.input('sup', sql.Int, supplier_id);
      lReq.input('pid', sql.Int, purchaseId);
      await lReq.query(
        `INSERT INTO dbo.Lots (lot_code, name, gem_type, carat, cost_price, sale_price, status, is_finished, supplier_id, purchase_id)
         VALUES (@code, @name, @gem_type, @carat, @cost, 0, 'In Stock (rough)', 0, @sup, @pid)`);
    }

    await tx.commit();
    res.status(201).json({ purchase_id: purchaseId, lots_created: items.length });
  } catch (err) {
    try { await tx.rollback(); } catch (_) {}
    next(err);
  }
});

module.exports = router;
