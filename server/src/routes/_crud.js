// A small factory that builds a standard list/read/create/update/delete router
// for a simple table. Used by Suppliers, Customers and Employees so we do not
// repeat the same code. The column list is a whitelist set by us in code, never
// by the user, so building the SQL from it is safe.
const express = require('express');
const { getPool } = require('../db');
const { authRequired } = require('../auth');

function crudRouter({ table, idColumn, columns }) {
  const router = express.Router();
  router.use(authRequired);

  // list
  router.get('/', async (req, res, next) => {
    try {
      const pool = await getPool();
      const result = await pool.request().query(`SELECT * FROM dbo.${table} ORDER BY ${idColumn} DESC`);
      res.json(result.recordset);
    } catch (err) { next(err); }
  });

  // read one
  router.get('/:id', async (req, res, next) => {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('id', req.params.id)
        .query(`SELECT * FROM dbo.${table} WHERE ${idColumn} = @id`);
      if (!result.recordset[0]) return res.status(404).json({ error: 'Not found' });
      res.json(result.recordset[0]);
    } catch (err) { next(err); }
  });

  // create
  router.post('/', async (req, res, next) => {
    try {
      const body = req.body || {};
      const pool = await getPool();
      const request = pool.request();
      const cols = [];
      const vals = [];
      for (const c of columns) {
        if (body[c] !== undefined && body[c] !== null && body[c] !== '') {
          request.input(c, body[c]); cols.push(c); vals.push('@' + c);
        }
      }
      if (!cols.length) return res.status(400).json({ error: 'No fields given' });
      const result = await request.query(
        `INSERT INTO dbo.${table} (${cols.join(', ')}) OUTPUT INSERTED.* VALUES (${vals.join(', ')})`
      );
      res.status(201).json(result.recordset[0]);
    } catch (err) { next(err); }
  });

  // update
  router.put('/:id', async (req, res, next) => {
    try {
      const body = req.body || {};
      const pool = await getPool();
      const request = pool.request().input('id', req.params.id);
      const sets = [];
      for (const c of columns) {
        if (body[c] !== undefined) { request.input(c, body[c]); sets.push(`${c} = @${c}`); }
      }
      if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
      const result = await request.query(
        `UPDATE dbo.${table} SET ${sets.join(', ')} OUTPUT INSERTED.* WHERE ${idColumn} = @id`
      );
      if (!result.recordset[0]) return res.status(404).json({ error: 'Not found' });
      res.json(result.recordset[0]);
    } catch (err) { next(err); }
  });

  // delete
  router.delete('/:id', async (req, res, next) => {
    try {
      const pool = await getPool();
      await pool.request().input('id', req.params.id)
        .query(`DELETE FROM dbo.${table} WHERE ${idColumn} = @id`);
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  return router;
}

module.exports = crudRouter;
