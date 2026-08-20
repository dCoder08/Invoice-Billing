const db = require("../config/db");

// =====================================================
// GET ALL INVOICES
// =====================================================

const getInvoices = (req, res) => {
  const sql = `
    SELECT
      i.invoice_id,
      i.customer_id,
      c.name AS customer_name,
      i.invoice_date,
      i.due_date,
      i.total_amount,
      i.status
    FROM invoices i
    JOIN customers c
      ON i.customer_id = c.customer_id
    ORDER BY i.invoice_id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching invoices:", err);

      return res.status(500).json({
        message: "Failed to fetch invoices",
      });
    }

    res.json(results);
  });
};


// =====================================================
// GET ONE INVOICE
// =====================================================

const getInvoiceById = (req, res) => {
  const { id } = req.params;

  const invoiceSql = `
    SELECT
      i.invoice_id,
      i.customer_id,
      c.name AS customer_name,
      i.invoice_date,
      i.due_date,
      i.total_amount,
      i.status
    FROM invoices i
    JOIN customers c
      ON i.customer_id = c.customer_id
    WHERE i.invoice_id = ?
  `;

  db.query(invoiceSql, [id], (err, invoiceResults) => {
    if (err) {
      console.error("Error fetching invoice:", err);

      return res.status(500).json({
        message: "Failed to fetch invoice",
      });
    }

    if (invoiceResults.length === 0) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    const itemsSql = `
      SELECT
        ii.item_id,
        ii.product_id,
        p.name AS product_name,
        ii.quantity,
        ii.unit_price,
        ii.subtotal
      FROM invoice_items ii
      JOIN products p
        ON ii.product_id = p.product_id
      WHERE ii.invoice_id = ?
    `;

    db.query(itemsSql, [id], (err, itemResults) => {
      if (err) {
        console.error(
          "Error fetching invoice items:",
          err
        );

        return res.status(500).json({
          message: "Failed to fetch invoice items",
        });
      }

      res.json({
        ...invoiceResults[0],
        items: itemResults,
      });
    });
  });
};


// =====================================================
// CREATE INVOICE
// =====================================================

const createInvoice = (req, res) => {
  const {
    customer_id,
    invoice_date,
    due_date,
    items,
  } = req.body;

  // -----------------------------
  // Validation
  // -----------------------------

  if (!customer_id) {
    return res.status(400).json({
      message: "Customer is required",
    });
  }

  if (!invoice_date) {
    return res.status(400).json({
      message: "Invoice date is required",
    });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "At least one invoice item is required",
    });
  }

  // -----------------------------
  // Validate due date
  // -----------------------------

  if (
    due_date &&
    new Date(due_date) < new Date(invoice_date)
  ) {
    return res.status(400).json({
      message: "Due date cannot be before invoice date",
    });
  }

  // -----------------------------
  // Calculate totals
  // -----------------------------

  const processedItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unit_price);

    if (!item.product_id) {
      return res.status(400).json({
        message: "Product is required",
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0",
      });
    }

    if (
      Number.isNaN(unitPrice) ||
      unitPrice < 0
    ) {
      return res.status(400).json({
        message: "Invalid unit price",
      });
    }

    const subtotal = quantity * unitPrice;

    totalAmount += subtotal;

    processedItems.push([
      item.product_id,
      quantity,
      unitPrice,
      subtotal,
    ]);
  }

  // -----------------------------
  // Start transaction
  // -----------------------------

  db.beginTransaction((err) => {
    if (err) {
      console.error(
        "Transaction error:",
        err
      );

      return res.status(500).json({
        message: "Could not start transaction",
      });
    }

    // -----------------------------
    // Insert invoice
    // -----------------------------

    const invoiceSql = `
      INSERT INTO invoices
      (
        customer_id,
        invoice_date,
        due_date,
        total_amount,
        status
      )
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      invoiceSql,
      [
        customer_id,
        invoice_date,
        due_date || null,
        totalAmount,
        "Pending",
      ],
      (err, invoiceResult) => {
        if (err) {
          return db.rollback(() => {
            console.error(
              "Error creating invoice:",
              err
            );

            res.status(500).json({
              message: "Failed to create invoice",
            });
          });
        }

        const invoiceId =
          invoiceResult.insertId;

        // -----------------------------
        // Add invoice items
        // -----------------------------

        const itemSql = `
          INSERT INTO invoice_items
          (
            invoice_id,
            product_id,
            quantity,
            unit_price,
            subtotal
          )
          VALUES ?
        `;

        const itemValues =
          processedItems.map((item) => [
            invoiceId,
            item[0],
            item[1],
            item[2],
            item[3],
          ]);

        db.query(
          itemSql,
          [itemValues],
          (err) => {
            if (err) {
              return db.rollback(() => {
                console.error(
                  "Error creating invoice items:",
                  err
                );

                res.status(500).json({
                  message:
                    "Failed to create invoice items",
                });
              });
            }

            // -----------------------------
            // Commit transaction
            // -----------------------------

            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  console.error(
                    "Commit error:",
                    err
                  );

                  res.status(500).json({
                    message:
                      "Failed to save invoice",
                  });
                });
              }

              res.status(201).json({
                message:
                  "Invoice created successfully",
                invoice_id: invoiceId,
                total_amount: totalAmount,
              });
            });
          }
        );
      }
    );
  });
};


module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
};