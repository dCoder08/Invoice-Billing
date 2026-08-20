const express = require("express");

const {
  getInvoices,
  getInvoiceById,
  createInvoice,
} = require("../controllers/invoiceController");

const router = express.Router();

// GET /api/invoices
router.get("/", getInvoices);

// GET /api/invoices/:id
router.get("/:id", getInvoiceById);

// POST /api/invoices
router.post("/", createInvoice);

module.exports = router;