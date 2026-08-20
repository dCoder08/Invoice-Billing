const db = require("../config/db");

// =====================================================
// GET ALL PAYMENTS
// =====================================================

const getPayments = (req, res) => {
  const sql = `
    SELECT
      p.payment_id,
      p.invoice_id,
      p.payment_date,
      p.amount,
      p.payment_method,
      p.transaction_details,
      p.payment_status,
      CONCAT('INV-', LPAD(p.invoice_id, 4, '0')) AS invoice_number,
      c.name AS customer_name
    FROM payments p
    JOIN invoices i
      ON p.invoice_id = i.invoice_id
    JOIN customers c
      ON i.customer_id = c.customer_id
    ORDER BY p.payment_id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching payments:", err);

      return res.status(500).json({
        message: "Failed to fetch payments",
      });
    }

    res.json(results);
  });
};


// =====================================================
// GET PAYMENTS FOR ONE INVOICE
// =====================================================

const getPaymentsByInvoice = (req, res) => {
  const { invoiceId } = req.params;

  const sql = `
    SELECT
      payment_id,
      invoice_id,
      payment_date,
      amount,
      payment_method,
      transaction_details,
      payment_status
    FROM payments
    WHERE invoice_id = ?
    ORDER BY payment_id DESC
  `;

  db.query(sql, [invoiceId], (err, results) => {
    if (err) {
      console.error(
        "Error fetching invoice payments:",
        err
      );

      return res.status(500).json({
        message: "Failed to fetch invoice payments",
      });
    }

    res.json(results);
  });
};


// =====================================================
// GET ONE PAYMENT
// =====================================================

const getPaymentById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT
      p.payment_id,
      p.invoice_id,
      p.payment_date,
      p.amount,
      p.payment_method,
      p.transaction_details,
      p.payment_status,
      CONCAT('INV-', LPAD(p.invoice_id, 4, '0')) AS invoice_number,
      c.name AS customer_name
    FROM payments p
    JOIN invoices i
      ON p.invoice_id = i.invoice_id
    JOIN customers c
      ON i.customer_id = c.customer_id
    WHERE p.payment_id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error fetching payment:", err);

      return res.status(500).json({
        message: "Failed to fetch payment",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    res.json(results[0]);
  });
};


// =====================================================
// CREATE PAYMENT
// =====================================================

const createPayment = (req, res) => {
  const {
    invoice_id,
    payment_date,
    amount,
    payment_method,
    transaction_details,
    payment_status,
  } = req.body;

  // -----------------------------
  // Validation
  // -----------------------------

  if (!invoice_id) {
    return res.status(400).json({
      message: "Invoice is required",
    });
  }

  if (!payment_date) {
    return res.status(400).json({
      message: "Payment date is required",
    });
  }

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({
      message: "Payment amount must be greater than zero",
    });
  }

  // -----------------------------
  // Check invoice exists
  // -----------------------------

  const invoiceSql = `
    SELECT invoice_id, total_amount
    FROM invoices
    WHERE invoice_id = ?
  `;

  db.query(
    invoiceSql,
    [invoice_id],
    (err, invoiceResults) => {
      if (err) {
        console.error(
          "Error checking invoice:",
          err
        );

        return res.status(500).json({
          message: "Failed to check invoice",
        });
      }

      if (invoiceResults.length === 0) {
        return res.status(404).json({
          message: "Invoice not found",
        });
      }

      const invoice = invoiceResults[0];

      // -----------------------------
      // Get completed payments
      // -----------------------------

      const paymentSql = `
        SELECT COALESCE(SUM(amount), 0) AS total_paid
        FROM payments
        WHERE invoice_id = ?
        AND payment_status = 'Completed'
      `;

      db.query(
        paymentSql,
        [invoice_id],
        (err, paymentResults) => {
          if (err) {
            console.error(
              "Error checking payments:",
              err
            );

            return res.status(500).json({
              message:
                "Failed to check existing payments",
            });
          }

          const totalPaid = Number(
            paymentResults[0].total_paid
          );

          const outstanding =
            Number(invoice.total_amount) -
            totalPaid;

          const paymentAmount = Number(amount);

          // Completed payment cannot exceed outstanding
          if (
            payment_status === "Completed" &&
            paymentAmount > outstanding
          ) {
            return res.status(400).json({
              message: `Payment cannot exceed outstanding amount of ₹${outstanding.toLocaleString(
                "en-IN"
              )}`,
            });
          }

          // -----------------------------
          // Insert payment
          // -----------------------------

          const insertSql = `
            INSERT INTO payments
            (
              invoice_id,
              payment_date,
              amount,
              payment_method,
              transaction_details,
              payment_status
            )
            VALUES (?, ?, ?, ?, ?, ?)
          `;

          const status =
            payment_status || "Processing";

          db.query(
            insertSql,
            [
              invoice_id,
              payment_date,
              paymentAmount,
              payment_method || null,
              transaction_details || null,
              status,
            ],
            (err, result) => {
              if (err) {
                console.error(
                  "Error creating payment:",
                  err
                );

                return res.status(500).json({
                  message:
                    "Failed to create payment",
                });
              }

              // -----------------------------
              // Update invoice status
              // -----------------------------

              if (status === "Completed") {
                const newTotalPaid =
                  totalPaid + paymentAmount;

                let invoiceStatus = "Pending";

                if (
                  newTotalPaid >=
                  Number(invoice.total_amount)
                ) {
                  invoiceStatus = "Paid";
                } else if (
                  newTotalPaid > 0
                ) {
                  invoiceStatus =
                    "Partially Paid";
                }

                const updateInvoiceSql = `
                  UPDATE invoices
                  SET status = ?
                  WHERE invoice_id = ?
                `;

                db.query(
                  updateInvoiceSql,
                  [
                    invoiceStatus,
                    invoice_id,
                  ],
                  (err) => {
                    if (err) {
                      console.error(
                        "Error updating invoice status:",
                        err
                      );
                    }
                  }
                );
              }

              res.status(201).json({
                message:
                  "Payment recorded successfully",
                payment_id:
                  result.insertId,
              });
            }
          );
        }
      );
    }
  );
};


// =====================================================
// MARK PAYMENT AS COMPLETED
// =====================================================

const completePayment = (req, res) => {
  const { id } = req.params;

  const paymentSql = `
    SELECT
      p.payment_id,
      p.invoice_id,
      p.amount,
      p.payment_status,
      i.total_amount
    FROM payments p
    JOIN invoices i
      ON p.invoice_id = i.invoice_id
    WHERE p.payment_id = ?
  `;

  db.query(
    paymentSql,
    [id],
    (err, results) => {
      if (err) {
        console.error(
          "Error checking payment:",
          err
        );

        return res.status(500).json({
          message: "Failed to check payment",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "Payment not found",
        });
      }

      const payment = results[0];

      if (
        payment.payment_status ===
        "Completed"
      ) {
        return res.status(400).json({
          message:
            "Payment is already completed",
        });
      }

      // -----------------------------
      // Calculate existing completed
      // payments
      // -----------------------------

      const totalSql = `
        SELECT COALESCE(SUM(amount), 0) AS total_paid
        FROM payments
        WHERE invoice_id = ?
        AND payment_status = 'Completed'
      `;

      db.query(
        totalSql,
        [payment.invoice_id],
        (err, totalResults) => {
          if (err) {
            console.error(
              "Error calculating payments:",
              err
            );

            return res.status(500).json({
              message:
                "Failed to calculate payments",
            });
          }

          const totalPaid = Number(
            totalResults[0].total_paid
          );

          const outstanding =
            Number(payment.total_amount) -
            totalPaid;

          if (
            Number(payment.amount) >
            outstanding
          ) {
            return res.status(400).json({
              message:
                "Payment cannot be completed because it exceeds the outstanding amount",
            });
          }

          // -----------------------------
          // Complete payment
          // -----------------------------

          const updatePaymentSql = `
            UPDATE payments
            SET payment_status = 'Completed'
            WHERE payment_id = ?
          `;

          db.query(
            updatePaymentSql,
            [id],
            (err) => {
              if (err) {
                console.error(
                  "Error completing payment:",
                  err
                );

                return res.status(500).json({
                  message:
                    "Failed to complete payment",
                });
              }

              const newTotalPaid =
                totalPaid +
                Number(payment.amount);

              let invoiceStatus =
                "Partially Paid";

              if (
                newTotalPaid >=
                Number(payment.total_amount)
              ) {
                invoiceStatus = "Paid";
              }

              const updateInvoiceSql = `
                UPDATE invoices
                SET status = ?
                WHERE invoice_id = ?
              `;

              db.query(
                updateInvoiceSql,
                [
                  invoiceStatus,
                  payment.invoice_id,
                ],
                (err) => {
                  if (err) {
                    console.error(
                      "Error updating invoice:",
                      err
                    );
                  }

                  res.json({
                    message:
                      "Payment marked as completed",
                  });
                }
              );
            }
          );
        }
      );
    }
  );
};


module.exports = {
  getPayments,
  getPaymentsByInvoice,
  getPaymentById,
  createPayment,
  completePayment,
};