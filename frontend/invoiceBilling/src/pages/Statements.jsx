import { useEffect, useState } from "react";

function Statements() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD CUSTOMERS
  // ==========================================

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setError("");

        const response = await fetch("/api/customers");

        if (!response.ok) {
          throw new Error("Failed to fetch customers");
        }

        const data = await response.json();

        setCustomers(data);
      } catch (err) {
        console.error("Error loading customers:", err);
        setError("Failed to load customers.");
      }
    };

    fetchCustomers();
  }, []);

  // ==========================================
  // LOAD CUSTOMER STATEMENT
  // ==========================================

  const fetchStatement = async (customerId) => {
    if (!customerId) {
      setStatement(null);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/customers/${customerId}/statement`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch statement"
        );
      }

      console.log("Customer statement:", data);

      setStatement(data);
    } catch (err) {
      console.error("Error loading statement:", err);
      setError(err.message);
      setStatement(null);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CUSTOMER CHANGE
  // ==========================================

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;

    setSelectedCustomer(customerId);

    fetchStatement(customerId);
  };

  // ==========================================
  // FORMAT MONEY
  // ==========================================

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div>
      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Customer Statements
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View invoices, payments and outstanding amounts
          for each customer.
        </p>
      </div>

      {/* ==========================================
          CUSTOMER SELECT
      ========================================== */}

      <div className="mb-6 max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Select Customer
        </label>

        <select
          value={selectedCustomer}
          onChange={handleCustomerChange}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">
            Select a customer
          </option>

          {customers.map((customer) => (
            <option
              key={customer.customer_id}
              value={customer.customer_id}
            >
              {customer.name}
            </option>
          ))}
        </select>
      </div>

      {/* ==========================================
          ERROR
      ========================================== */}

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ==========================================
          LOADING
      ========================================== */}

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Loading statement...
          </p>
        </div>
      )}

      {/* ==========================================
          STATEMENT
      ========================================== */}

      {!loading && statement && (
        <div className="space-y-6">

          {/* ==========================================
              CUSTOMER INFO
          ========================================== */}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              {statement.customer.name}
            </h2>

            <div className="mt-2 space-y-1 text-sm text-gray-500">
              <p>
                Email:{" "}
                {statement.customer.email ||
                  "Not provided"}
              </p>

              <p>
                Phone:{" "}
                {statement.customer.phone ||
                  "Not provided"}
              </p>

              <p>
                Address:{" "}
                {statement.customer.address ||
                  "Not provided"}
              </p>
            </div>
          </div>

          {/* ==========================================
              SUMMARY
          ========================================== */}

          <div className="grid gap-4 md:grid-cols-3">

            {/* TOTAL INVOICED */}

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Total Invoiced
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                ₹{formatMoney(
                  statement.summary.totalInvoiced
                )}
              </p>
            </div>

            {/* TOTAL PAID */}

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Total Paid
              </p>

              <p className="mt-2 text-2xl font-bold text-green-600">
                ₹{formatMoney(
                  statement.summary.totalPaid
                )}
              </p>
            </div>

            {/* OUTSTANDING */}

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Outstanding
              </p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                ₹{formatMoney(
                  statement.summary.outstanding
                )}
              </p>
            </div>

          </div>

          {/* ==========================================
              INVOICE HISTORY
          ========================================== */}

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Invoice History
              </h2>
            </div>

            {!statement.invoices ||
            statement.invoices.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">
                  No invoices found for this customer.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full text-left text-sm">

                  <thead className="bg-gray-50">
                    <tr>

                      <th className="px-5 py-3 font-medium text-gray-600">
                        Invoice
                      </th>

                      <th className="px-5 py-3 font-medium text-gray-600">
                        Date
                      </th>

                      <th className="px-5 py-3 font-medium text-gray-600">
                        Due Date
                      </th>

                      <th className="px-5 py-3 font-medium text-gray-600">
                        Amount
                      </th>

                      <th className="px-5 py-3 font-medium text-gray-600">
                        Paid
                      </th>

                      <th className="px-5 py-3 font-medium text-gray-600">
                        Outstanding
                      </th>

                      <th className="px-5 py-3 font-medium text-gray-600">
                        Status
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {statement.invoices.map(
                      (invoice) => (
                        <tr
                          key={invoice.invoice_id}
                          className="border-t border-gray-100"
                        >

                          {/* INVOICE */}

                          <td className="px-5 py-4 font-medium text-gray-900">
                            {invoice.invoiceNumber}
                          </td>

                          {/* DATE */}

                          <td className="px-5 py-4 text-gray-600">
                            {invoice.date}
                          </td>

                          {/* DUE DATE */}

                          <td className="px-5 py-4 text-gray-600">
                            {invoice.dueDate}
                          </td>

                          {/* AMOUNT */}

                          <td className="px-5 py-4 font-medium text-gray-900">
                            ₹{formatMoney(
                              invoice.amount
                            )}
                          </td>

                          {/* PAID */}

                          <td className="px-5 py-4 font-medium text-green-600">
                            ₹{formatMoney(
                              invoice.paid
                            )}
                          </td>

                          {/* OUTSTANDING */}

                          <td className="px-5 py-4 font-medium text-red-600">
                            ₹{formatMoney(
                              invoice.outstanding
                            )}
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                invoice.status ===
                                "Paid"
                                  ? "bg-green-100 text-green-700"
                                  : invoice.status ===
                                    "Partially Paid"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {invoice.status}
                            </span>
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>

        </div>
      )}

      {/* ==========================================
          NOTHING SELECTED
      ========================================== */}

      {!loading &&
        !statement &&
        !error && (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <p className="text-gray-500">
              Select a customer to view their statement.
            </p>
          </div>
        )}
    </div>
  );
}

export default Statements;