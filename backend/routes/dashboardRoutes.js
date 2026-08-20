const express = require("express");

const {
  getDashboardSummary,
} = require("../controllers/dashboardController");

const router = express.Router();

// GET /api/dashboard
router.get("/", getDashboardSummary);

module.exports = router;