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

    // Revenue received in each of the last 6 months.
    const revenueByMonth = await pool.request().query(`
      SELECT FORMAT(payment_date, 'yyyy-MM') AS ym, SUM(amount) AS total
      FROM dbo.Payments
      WHERE payment_date >= DATEADD(MONTH, -5, CAST(GETDATE() AS DATE))
      GROUP BY FORMAT(payment_date, 'yyyy-MM')
      ORDER BY ym
    `);

    // Confirmed sales split by channel (Online shop vs Walk-in).
    const salesByChannel = await pool.request().query(`
      SELECT channel, COUNT(*) AS orders, ISNULL(SUM(total_amount), 0) AS total
      FROM dbo.Orders WHERE status = 'Confirmed'
      GROUP BY channel
    `);

    // Value of stock we are holding, grouped by gem type (top 6).
    const stockValueByType = await pool.request().query(`
      SELECT TOP 6 gem_type, COUNT(*) AS lots, ISNULL(SUM(sale_price), 0) AS value
      FROM dbo.Lots
      WHERE status LIKE 'In Stock%' AND gem_type IS NOT NULL
      GROUP BY gem_type ORDER BY value DESC
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
      revenueByMonth: revenueByMonth.recordset,
      salesByChannel: salesByChannel.recordset,
      stockValueByType: stockValueByType.recordset,
    });
  } catch (err) { next(err); }
});

module.exports = router;
