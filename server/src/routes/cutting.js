// Cutting & Workshop module.
// A cutting job takes a Rough Lot and turns it into a Finished Lot. This is the
// second step of the integration chain: the Lot status moves rough -> In Cutting
// -> finished, and the Cutting module is the one that changes it.
const express = require('express');
const { sql, getPool } = require('../db');
const { authRequired } = require('../auth');

const router = express.Router();
router.use(authRequired);

// GET /api/cutting -> all jobs, with the lot and cutter names
router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT j.*, l.lot_code, l.name AS lot_name, e.name AS cutter_name
      FROM dbo.CuttingJobs j
      JOIN dbo.Lots l ON l.lot_id = j.lot_id
      LEFT JOIN dbo.Employees e ON e.employee_id = j.cutter_id
      ORDER BY j.job_id DESC`);
    res.json(result.recordset);
  } catch (err) { next(err); }
});

// POST /api/cutting  { lot_id, cutter_id, notes }
// Starts a job on a rough lot and sets that lot to "In Cutting".
router.post('/', async (req, res, next) => {
  const { lot_id, cutter_id, notes } = req.body || {};
  if (!lot_id) return res.status(400).json({ error: 'A rough lot is required' });

  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();

    const check = new sql.Request(tx);
    check.input('lot_id', sql.Int, lot_id);
    const lot = await check.query('SELECT status FROM dbo.Lots WHERE lot_id = @lot_id');
    if (!lot.recordset[0]) { await tx.rollback(); return res.status(404).json({ error: 'Lot not found' }); }
    if (lot.recordset[0].status !== 'In Stock (rough)') {
      await tx.rollback();
      return res.status(409).json({ error: 'Only a rough lot can be sent for cutting' });
    }

    const jReq = new sql.Request(tx);
    jReq.input('lot_id', sql.Int, lot_id);
    jReq.input('cutter_id', sql.Int, cutter_id || null);
    jReq.input('notes', sql.NVarChar(255), notes || null);
    const jRes = await jReq.query(
      `INSERT INTO dbo.CuttingJobs (lot_id, cutter_id, start_date, status, notes)
       OUTPUT INSERTED.job_id
       VALUES (@lot_id, @cutter_id, CAST(GETDATE() AS DATE), 'In Progress', @notes)`);

    const uReq = new sql.Request(tx);
    uReq.input('lot_id', sql.Int, lot_id);
    await uReq.query(`UPDATE dbo.Lots SET status = 'In Cutting' WHERE lot_id = @lot_id`);

    await tx.commit();
    res.status(201).json({ job_id: jRes.recordset[0].job_id });
  } catch (err) {
    try { await tx.rollback(); } catch (_) {}
    next(err);
  }
});

// PUT /api/cutting/:id/complete  { sale_price }
// Finishes the job: the lot becomes "In Stock (finished)" and is marked finished.
router.put('/:id/complete', async (req, res, next) => {
  const { sale_price } = req.body || {};
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();

    const jReq = new sql.Request(tx);
    jReq.input('id', sql.Int, req.params.id);
    const job = await jReq.query('SELECT lot_id, status FROM dbo.CuttingJobs WHERE job_id = @id');
    if (!job.recordset[0]) { await tx.rollback(); return res.status(404).json({ error: 'Job not found' }); }
    if (job.recordset[0].status === 'Done') { await tx.rollback(); return res.status(409).json({ error: 'This job is already done' }); }
    const lotId = job.recordset[0].lot_id;

    const uJob = new sql.Request(tx);
    uJob.input('id', sql.Int, req.params.id);
    await uJob.query(`UPDATE dbo.CuttingJobs SET status = 'Done', end_date = CAST(GETDATE() AS DATE) WHERE job_id = @id`);

    const uLot = new sql.Request(tx);
    uLot.input('lot_id', sql.Int, lotId);
    uLot.input('price', sql.Decimal(12, 2), sale_price ? Number(sale_price) : null);
    await uLot.query(
      `UPDATE dbo.Lots
       SET status = 'In Stock (finished)', is_finished = 1,
           sale_price = CASE WHEN @price IS NULL THEN sale_price ELSE @price END
       WHERE lot_id = @lot_id`);

    await tx.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await tx.rollback(); } catch (_) {}
    next(err);
  }
});

module.exports = router;
