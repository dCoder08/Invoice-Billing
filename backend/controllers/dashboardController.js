const db = require("../config/db");

// =====================================================
// GET DASHBOARD SUMMARY
// =====================================================

const getDashboardSummary = (req, res) => {
  const sql = `
    SELECT
      COUNT(DISTINCT i.invoice_id) AS totalInvoices,

      (
        SELECT COUNT(*)
        FROM customers
      ) AS totalCustomers,

      COALESCE(
        SUM(i.total_amount),
        0
      ) AS totalAmount,

      COALESCE(
        SUM(
          CASE
            WHEN p.paid_amount IS NULL THEN 0
            ELSE p.paid_amount
          END
        ),
        0
      ) AS totalPaid,

      COALESCE(
        SUM(
          GREATEST(
            i.total_amount -
            COALESCE(p.paid_amount, 0),
            0
          )
        ),
        0
      ) AS totalOutstanding,

      COUNT(
        CASE
          WHEN
            i.due_date < CURDATE()
            AND
            (
              i.total_amount -
              COALESCE(p.paid_amount, 0)
            ) > 0
          THEN 1
        END
      ) AS overdueInvoices

    FROM invoices i

    LEFT JOIN (
      SELECT
        invoice_id,
        SUM(amount) AS paid_amount
      FROM payments
      WHERE payment_status = 'Completed'
      GROUP BY invoice_id
    ) p
      ON i.invoice_id = p.invoice_id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(
        "Error fetching dashboard summary:",
        err
      );

      return res.status(500).json({
        message: "Failed to fetch dashboard summary",
      });
    }

    const data = results[0];

    const totalAmount = Number(
      data.totalAmount || 0
    );

    const totalPaid = Number(
      data.totalPaid || 0
    );

    const totalOutstanding = Number(
      data.totalOutstanding || 0
    );

    const overdueInvoices = Number(
      data.overdueInvoices || 0
    );

    res.json({
      totalInvoices: Number(
        data.totalInvoices || 0
      ),

      totalCustomers: Number(
        data.totalCustomers || 0
      ),

      totalAmount: totalAmount,

      totalPaid: totalPaid,

      totalOutstanding: totalOutstanding,

      overdueInvoices: overdueInvoices,
    });
  });
};

module.exports = {
  getDashboardSummary,
};