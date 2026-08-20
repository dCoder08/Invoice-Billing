import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./layout/layout";
import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customer";
import Invoices from "./pages/Invoices";
import Payments from "./pages/Payments";
import Statements from "./pages/Statements";
import Products from "./pages/Products";

import ProtectedRoute from "./components/common/ProtectedRoute";

function App() {
  return (
    <Routes>

      {/* LOGIN - NOT PROTECTED */}

      <Route
        path="/login"
        element={<Login />}
      />

      {/* ALL APPLICATION PAGES - PROTECTED */}

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >

        {/* Root → Dashboard */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        {/* Dashboard */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* Customers */}

        <Route
          path="/customers"
          element={<Customers />}
        />

        {/* Products */}

        <Route
          path="/products"
          element={<Products />}
        />

        {/* Invoices */}

        <Route
          path="/invoices"
          element={<Invoices />}
        />

        {/* Payments */}

        <Route
          path="/payments"
          element={<Payments />}
        />

        {/* Statements */}

        <Route
          path="/statements"
          element={<Statements />}
        />

      </Route>

    </Routes>
  );
}

export default App;