const db = require("../config/db");

// =====================================================
// GET ALL PRODUCTS
// =====================================================

const getProducts = (req, res) => {
  const sql = `
    SELECT
      product_id,
      name,
      description,
      price
    FROM products
    ORDER BY product_id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);

      return res.status(500).json({
        message: "Failed to fetch products",
      });
    }

    res.status(200).json(results);
  });
};

// =====================================================
// GET ONE PRODUCT
// =====================================================

const getProductById = (req, res) => {
  const productId = req.params.id;

  const sql = `
    SELECT
      product_id,
      name,
      description,
      price
    FROM products
    WHERE product_id = ?
  `;

  db.query(sql, [productId], (err, results) => {
    if (err) {
      console.error("Error fetching product:", err);

      return res.status(500).json({
        message: "Failed to fetch product",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json(results[0]);
  });
};

// =====================================================
// CREATE PRODUCT
// =====================================================

const createProduct = (req, res) => {
  const {
    name,
    description,
    price,
  } = req.body;

  // Validation
  if (!name || !name.trim()) {
    return res.status(400).json({
      message: "Product name is required",
    });
  }

  if (
    price === undefined ||
    price === null ||
    price === "" ||
    Number(price) <= 0
  ) {
    return res.status(400).json({
      message: "Price must be greater than zero",
    });
  }

  const sql = `
    INSERT INTO products
    (name, description, price)
    VALUES (?, ?, ?)
  `;

  db.query(
    sql,
    [
      name.trim(),
      description ? description.trim() : null,
      Number(price),
    ],
    (err, result) => {
      if (err) {
        console.error("Error creating product:", err);

        return res.status(500).json({
          message: "Failed to create product",
        });
      }

      res.status(201).json({
        message: "Product created successfully",
        product_id: result.insertId,
      });
    }
  );
};

// =====================================================
// UPDATE PRODUCT
// =====================================================

const updateProduct = (req, res) => {
  const productId = req.params.id;

  const {
    name,
    description,
    price,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      message: "Product name is required",
    });
  }

  if (
    price === undefined ||
    price === null ||
    price === "" ||
    Number(price) <= 0
  ) {
    return res.status(400).json({
      message: "Price must be greater than zero",
    });
  }

  const sql = `
    UPDATE products
    SET
      name = ?,
      description = ?,
      price = ?
    WHERE product_id = ?
  `;

  db.query(
    sql,
    [
      name.trim(),
      description ? description.trim() : null,
      Number(price),
      productId,
    ],
    (err, result) => {
      if (err) {
        console.error("Error updating product:", err);

        return res.status(500).json({
          message: "Failed to update product",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      res.status(200).json({
        message: "Product updated successfully",
      });
    }
  );
};

// =====================================================
// DELETE PRODUCT
// =====================================================

const deleteProduct = (req, res) => {
  const productId = req.params.id;

  const sql = `
    DELETE FROM products
    WHERE product_id = ?
  `;

  db.query(sql, [productId], (err, result) => {
    if (err) {
      console.error("Error deleting product:", err);

      return res.status(500).json({
        message: "Failed to delete product",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      message: "Product deleted successfully",
    });
  });
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};