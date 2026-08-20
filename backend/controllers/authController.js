const bcrypt = require("bcryptjs");
const db = require("../config/db");

// =====================================================
// LOGIN USER
// =====================================================

const loginUser = (req, res) => {
  const { username, password } = req.body;

  // Check if username and password were provided
  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password are required",
    });
  }

  // Find user by username
  const sql = "SELECT * FROM users WHERE username = ?";

  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.error("Login database error:", err);

      return res.status(500).json({
        message: "Server error",
      });
    }

    // User doesn't exist
    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const user = results[0];

    try {
      // Compare entered password with hashed password
      const passwordMatch = await bcrypt.compare(
        password,
        user.password
      );

      if (!passwordMatch) {
        return res.status(401).json({
          message: "Invalid username or password",
        });
      }

      // Login successful
      return res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
        },
      });
    } catch (error) {
      console.error("Password comparison error:", error);

      return res.status(500).json({
        message: "Server error",
      });
    }
  });
};

module.exports = {
  loginUser,
};