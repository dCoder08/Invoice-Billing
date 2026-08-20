const express = require("express");

const {
  getPayments,
  getPaymentsByInvoice,
  getPaymentById,
  createPayment,
  completePayment,
} = require("../controllers/paymentController");

const router = express.Router();

// GET /api/payments
router.get("/", getPayments);

// GET /api/payments/invoice/:invoiceId
router.get(
  "/invoice/:invoiceId",
  getPaymentsByInvoice
);

// GET /api/payments/:id
router.get("/:id", getPaymentById);

// POST /api/payments
router.post("/", createPayment);

// PUT /api/payments/:id/complete
router.put(
  "/:id/complete",
  completePayment
);

module.exports = router;