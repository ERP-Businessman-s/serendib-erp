// Dashboard numbers, read live from the database.
const express = require('express');
const { getPool } = require('../db');
const { authRequired } = require('../auth');

const router = express.Router();
router.use(authRequired);

const LOW_STOCK_LEVEL = 5; // warn when finished lots in stock fall below this

// GET /api/dashboard
router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();

    const totals = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM dbo.Lots WHERE status LIKE 'In Stock%')                                   AS lots_in_stock,
        (SELECT ISNULL(SUM(sale_price),0) FROM dbo.Lots WHERE status <> 'Sold')                          AS stock_value,
        (SELECT COUNT(*) FROM dbo.Lots WHERE status = 'In Stock (finished)')                             AS finished_in_stock,
        (SELECT COUNT(*) FROM dbo.Orders WHERE status = 'Confirmed'
           AND MONTH(order_date) = MONTH(GETDATE()) AND YEAR(order_date) = YEAR(GETDATE()))              AS orders_this_month,
        (SELECT ISNULL(SUM(amount),0) FROM dbo.Payments
           WHERE MONTH(payment_date) = MONTH(GETDATE()) AND YEAR(payment_date) = YEAR(GETDATE()))        AS revenue_this_month
    `);

    const byStatus = await pool.request().query(`
      SELECT status, COUNT(*) AS count FROM dbo.Lots GROUP BY status ORDER BY status
    `);

    const t = totals.recordset[0];
    res.json({
      lotsInStock: t.lots_in_stock,
      stockValue: t.stock_value,
      finishedInStock: t.finished_in_stock,
      ordersThisMonth: t.orders_this_month,
      revenueThisMonth: t.revenue_this_month,
      lowStock: t.finished_in_stock < LOW_STOCK_LEVEL,
      lowStockLevel: LOW_STOCK_LEVEL,
      lotsByStatus: byStatus.recordset,
    });
  } catch (err) { next(err); }
});

module.exports = router;
