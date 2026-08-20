const db = require("../config/db");

// GET all customers
const getCustomers = (req, res) => {
  const sql = "SELECT * FROM customers ORDER BY customer_id DESC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching customers:", err);
      return res.status(500).json({
        message: "Failed to fetch customers",
      });
    }

    res.json(results);
  });
};

// GET one customer
const getCustomerById = (req, res) => {
  const { id } = req.params;

  const sql =
    "SELECT * FROM customers WHERE customer_id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error fetching customer:", err);
      return res.status(500).json({
        message: "Failed to fetch customer",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.json(results[0]);
  });
};

// CREATE customer
const createCustomer = (req, res) => {
  const { name, email, phone, address } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({
      message: "Customer name is required",
    });
  }

  const sql = `
    INSERT INTO customers
    (name, email, phone, address)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [name, email || null, phone || null, address || null],
    (err, result) => {
      if (err) {
        console.error("Error creating customer:", err);

        return res.status(500).json({
          message: "Failed to create customer",
        });
      }

      res.status(201).json({
        message: "Customer created successfully",
        customer_id: result.insertId,
      });
    }
  );
};

// GET customer statement
const getCustomerStatement = (req, res) => {
  const { id } = req.params;

  // Get customer information
  const customerSql = `
    SELECT
      customer_id,
      name,
      email,
      phone,
      address
    FROM customers
    WHERE customer_id = ?
  `;

  db.query(customerSql, [id], (err, customerResults) => {
    if (err) {
      console.error("Error fetching customer:", err);

      return res.status(500).json({
        message: "Failed to fetch customer statement",
      });
    }

    if (customerResults.length === 0) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const customer = customerResults[0];

    // Get customer's invoices and payments
    const invoiceSql = `
      SELECT
        i.invoice_id,
        i.invoice_date,
        i.due_date,
        i.total_amount,
        i.status,
        COALESCE(SUM(p.amount), 0) AS paid_amount
      FROM invoices i
      LEFT JOIN payments p
        ON i.invoice_id = p.invoice_id
      WHERE i.customer_id = ?
      GROUP BY
        i.invoice_id,
        i.invoice_date,
        i.due_date,
        i.total_amount,
        i.status
      ORDER BY i.invoice_date ASC
    `;

    db.query(invoiceSql, [id], (err, invoiceResults) => {
      if (err) {
        console.error(
          "Error fetching customer invoices:",
          err
        );

        return res.status(500).json({
          message: "Failed to fetch customer statement",
        });
      }

      let totalInvoiced = 0;
      let totalPaid = 0;

      const invoices = invoiceResults.map((invoice) => {
        const amount = Number(invoice.total_amount);
        const paid = Number(invoice.paid_amount);

        const outstanding = Math.max(
          amount - paid,
          0
        );

        totalInvoiced += amount;
        totalPaid += paid;

        return {
          invoice_id: invoice.invoice_id,

          invoiceNumber: `INV-${String(
            invoice.invoice_id
          ).padStart(4, "0")}`,

          date: invoice.invoice_date,

          dueDate: invoice.due_date,

          amount: amount,

          paid: paid,

          outstanding: outstanding,

          status: invoice.status,
        };
      });

      const outstanding = Math.max(
        totalInvoiced - totalPaid,
        0
      );

      res.json({
        customer: customer,

        summary: {
          totalInvoiced: totalInvoiced,
          totalPaid: totalPaid,
          outstanding: outstanding,
        },

        invoices: invoices,
      });
    });
  });
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  getCustomerStatement,
};