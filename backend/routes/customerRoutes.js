const express = require("express");

const {
  getCustomers,
  getCustomerById,
  createCustomer,
  getCustomerStatement,
} = require("../controllers/customerController");

const router = express.Router();

// GET /api/customers
router.get("/", getCustomers);

// GET /api/customers/:id/statement
router.get("/:id/statement", getCustomerStatement);

// GET /api/customers/:id
router.get("/:id", getCustomerById);

// POST /api/customers
router.post("/", createCustomer);

module.exports = router;