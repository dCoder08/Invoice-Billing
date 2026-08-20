require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./config/db");

const customerRoutes = require("./routes/customerRoutes");
const productRoutes = require("./routes/productRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());

// =====================================================
// ROUTES
// =====================================================

app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);

// =====================================================
// ROOT ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.json({
    message: "Invoice Backend is running!",
  });
});

// =====================================================
// PORT
// =====================================================

const PORT = process.env.PORT || 8080;

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

// =====================================================
// TEST MYSQL CONNECTION
// =====================================================

db.query("SELECT 1", (err) => {
  if (err) {
    console.error("MySQL connection failed:", err);
  } else {
    console.log("MySQL connected successfully!");
  }
});