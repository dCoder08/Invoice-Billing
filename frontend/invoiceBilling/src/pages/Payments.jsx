import { useEffect, useState } from "react";

function Payments() {
  // =====================================================
  // DATA
  // =====================================================

  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // =====================================================
  // FORM
  // =====================================================

  const [formData, setFormData] = useState({
    invoice_id: "",
    payment_date: new Date().toISOString().split("T")[0],
    amount: "",
    payment_method: "",
    transaction_details: "",
    payment_status: "Completed",
  });

  // =====================================================
  // MESSAGES
  // =====================================================

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // =====================================================
  // LOAD INVOICES
  // =====================================================

  const loadInvoices = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/invoices"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }

      const data = await response.json();

      setInvoices(data);
    } catch (err) {
      console.error("Error loading invoices:", err);
      setError("Failed to load invoices.");
    }
  };

  // =====================================================
  // LOAD PAYMENTS
  // =====================================================

  const loadPayments = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/payments"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }

      const data = await response.json();

      setPayments(data);
    } catch (err) {
      console.error("Error loading payments:", err);
      setError("Failed to load payments.");
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadInvoices();
    loadPayments();
  }, []);

  // =====================================================
  // FORMAT MONEY
  // =====================================================

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // =====================================================
  // GET COMPLETED PAYMENTS FOR INVOICE
  // =====================================================

  const getCompletedPaymentsForInvoice = (invoiceId) => {
    return payments.filter(
      (payment) =>
        Number(payment.invoice_id) === Number(invoiceId) &&
        payment.payment_status === "Completed"
    );
  };

  // =====================================================
  // GET TOTAL PAID FOR INVOICE
  // =====================================================

  const getTotalPaid = (invoiceId) => {
    const completedPayments =
      getCompletedPaymentsForInvoice(invoiceId);

    return completedPayments.reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    );
  };

  // =====================================================
  // GET OUTSTANDING AMOUNT
  // =====================================================

  const getOutstandingAmount = (invoice) => {
    if (!invoice) {
      return 0;
    }

    const invoiceAmount = Number(
      invoice.total_amount || 0
    );

    const totalPaid = getTotalPaid(
      invoice.invoice_id
    );

    return Math.max(
      invoiceAmount - totalPaid,
      0
    );
  };

  // =====================================================
  // GET PAYMENT STATUS
  // =====================================================

  const getInvoicePaymentStatus = (invoice) => {
    if (!invoice) {
      return "Unpaid";
    }

    const invoiceAmount = Number(
      invoice.total_amount || 0
    );

    const totalPaid = getTotalPaid(
      invoice.invoice_id
    );

    if (totalPaid === 0) {
      return "Unpaid";
    }

    if (totalPaid < invoiceAmount) {
      return "Partially Paid";
    }

    return "Paid";
  };

  // =====================================================
  // GET INVOICE FOR PAYMENT
  // =====================================================

  const getInvoiceForPayment = (payment) => {
    return invoices.find(
      (invoice) =>
        Number(invoice.invoice_id) ===
        Number(payment.invoice_id)
    );
  };

  // =====================================================
  // GET PAYMENT OUTSTANDING
  // =====================================================

  const getPaymentOutstanding = (payment) => {
    const invoice =
      getInvoiceForPayment(payment);

    if (!invoice) {
      return 0;
    }

    return getOutstandingAmount(invoice);
  };

  // =====================================================
  // GET STATUS FOR PAYMENT ROW
  // =====================================================

  const getPaymentRowStatus = (payment) => {
    const invoice =
      getInvoiceForPayment(payment);

    if (!invoice) {
      return payment.payment_status || "Processing";
    }

    /*
     * Payment itself is Processing/Completed.
     *
     * Invoice status is calculated separately:
     * Unpaid / Partially Paid / Paid
     */

    return getInvoicePaymentStatus(invoice);
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  // =====================================================
  // SELECT INVOICE
  // =====================================================

  const handleInvoiceChange = (e) => {
    const invoiceId = e.target.value;

    setFormData((previous) => ({
      ...previous,
      invoice_id: invoiceId,
      amount: "",
    }));

    setMessage("");
    setError("");
  };

  // =====================================================
  // GET SELECTED INVOICE
  // =====================================================

  const selectedInvoice = invoices.find(
    (invoice) =>
      Number(invoice.invoice_id) ===
      Number(formData.invoice_id)
  );

  // =====================================================
  // CREATE PAYMENT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      if (!formData.invoice_id) {
        throw new Error("Please select an invoice.");
      }

      if (!formData.payment_date) {
        throw new Error("Payment date is required.");
      }

      if (
        !formData.amount ||
        Number(formData.amount) <= 0
      ) {
        throw new Error(
          "Payment amount must be greater than zero."
        );
      }

      if (!formData.payment_method) {
        throw new Error(
          "Please select a payment method."
        );
      }

      // ---------------------------------------------
      // CHECK OUTSTANDING BEFORE SUBMIT
      // ---------------------------------------------

      if (selectedInvoice) {
        const outstanding =
          getOutstandingAmount(selectedInvoice);

        if (
          formData.payment_status === "Completed" &&
          Number(formData.amount) > outstanding
        ) {
          throw new Error(
            `Payment cannot exceed the outstanding amount of ₹${formatMoney(
              outstanding
            )}`
          );
        }
      }

      const response = await fetch(
        "http://localhost:5000/api/payments",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            invoice_id: Number(
              formData.invoice_id
            ),

            payment_date:
              formData.payment_date,

            amount: Number(
              formData.amount
            ),

            payment_method:
              formData.payment_method,

            transaction_details:
              formData.transaction_details,

            payment_status:
              formData.payment_status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Payment failed"
        );
      }

      setMessage(
        `Payment recorded successfully! Payment ID: ${data.payment_id}`
      );

      // ---------------------------------------------
      // RESET FORM
      // ---------------------------------------------

      setFormData({
        invoice_id: "",
        payment_date: new Date()
          .toISOString()
          .split("T")[0],
        amount: "",
        payment_method: "",
        transaction_details: "",
        payment_status: "Completed",
      });

      // ---------------------------------------------
      // REFRESH DATA
      // ---------------------------------------------

      await loadPayments();
      await loadInvoices();
    } catch (err) {
      console.error(
        "Error creating payment:",
        err
      );

      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // MARK PAYMENT COMPLETED
  // =====================================================

  const handleCompletePayment = async (
    paymentId
  ) => {
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/payments/${paymentId}/complete`,
        {
          method: "PUT",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to complete payment"
        );
      }

      setMessage(
        "Payment marked as completed successfully."
      );

      await loadPayments();
      await loadInvoices();
    } catch (err) {
      console.error(
        "Error completing payment:",
        err
      );

      setError(err.message);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div>
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Payments
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Record and manage customer payments.
        </p>
      </div>

      {/* =====================================================
          MESSAGES
      ===================================================== */}

      {message && (
        <div className="mb-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =====================================================
          RECORD PAYMENT
      ===================================================== */}

      <div className="mb-8 max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-gray-800">
          Record Payment
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* INVOICE */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Invoice
            </label>

            <select
              name="invoice_id"
              value={formData.invoice_id}
              onChange={handleInvoiceChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">
                Select invoice
              </option>

              {invoices.map((invoice) => {
                const outstanding =
                  getOutstandingAmount(invoice);

                const status =
                  getInvoicePaymentStatus(
                    invoice
                  );

                return (
                  <option
                    key={invoice.invoice_id}
                    value={invoice.invoice_id}
                  >
                    INV-
                    {String(
                      invoice.invoice_id
                    ).padStart(4, "0")}{" "}
                    - {invoice.customer_name} - ₹
                    {formatMoney(
                      invoice.total_amount
                    )}{" "}
                    - Outstanding ₹
                    {formatMoney(outstanding)}
                  </option>
                );
              })}
            </select>
          </div>

          {/* SELECTED INVOICE INFO */}

          {selectedInvoice && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-medium uppercase text-blue-500">
                Selected Invoice
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                INV-
                {String(
                  selectedInvoice.invoice_id
                ).padStart(4, "0")}
              </p>

              <p className="text-sm text-gray-600">
                Customer:{" "}
                {selectedInvoice.customer_name}
              </p>

              {/* INVOICE AMOUNT */}

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-white p-3">
                  <p className="text-xs text-gray-500">
                    Invoice Amount
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    ₹
                    {formatMoney(
                      selectedInvoice.total_amount
                    )}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3">
                  <p className="text-xs text-gray-500">
                    Completed Paid
                  </p>

                  <p className="mt-1 font-bold text-green-600">
                    ₹
                    {formatMoney(
                      getTotalPaid(
                        selectedInvoice.invoice_id
                      )
                    )}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3">
                  <p className="text-xs text-gray-500">
                    Outstanding
                  </p>

                  <p className="mt-1 font-bold text-red-600">
                    ₹
                    {formatMoney(
                      getOutstandingAmount(
                        selectedInvoice
                      )
                    )}
                  </p>
                </div>
              </div>

              {/* STATUS */}

              <div className="mt-3">
                <p className="text-sm text-gray-600">
                  Status:{" "}
                  <span
                    className={`font-semibold ${
                      getInvoicePaymentStatus(
                        selectedInvoice
                      ) === "Paid"
                        ? "text-green-600"
                        : getInvoicePaymentStatus(
                            selectedInvoice
                          ) === "Partially Paid"
                        ? "text-blue-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {getInvoicePaymentStatus(
                      selectedInvoice
                    )}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* PAYMENT DATE */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Payment Date
            </label>

            <input
              type="date"
              name="payment_date"
              value={formData.payment_date}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* AMOUNT */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Amount
            </label>

            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter payment amount"
              min="0.01"
              step="0.01"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {selectedInvoice && (
              <p className="mt-1 text-xs text-gray-500">
                Maximum for a Completed payment:
                ₹
                {formatMoney(
                  getOutstandingAmount(
                    selectedInvoice
                  )
                )}
              </p>
            )}
          </div>

          {/* PAYMENT METHOD */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Payment Method
            </label>

            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">
                Select payment method
              </option>

              <option value="Cash">
                Cash
              </option>

              <option value="UPI">
                UPI
              </option>

              <option value="Card">
                Card
              </option>

              <option value="Bank Transfer">
                Bank Transfer
              </option>
            </select>
          </div>

          {/* TRANSACTION DETAILS */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Transaction Details
            </label>

            <textarea
              name="transaction_details"
              value={
                formData.transaction_details
              }
              onChange={handleChange}
              rows="3"
              placeholder="Enter transaction ID or reference details"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* STATUS */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Payment Status
            </label>

            <select
              name="payment_status"
              value={formData.payment_status}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Processing">
                Processing
              </option>

              <option value="Completed">
                Completed
              </option>
            </select>
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Recording Payment..."
              : "Record Payment"}
          </button>
        </form>
      </div>

      {/* =====================================================
          PAYMENT HISTORY
      ===================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Payment History
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            All payments recorded in the system.
          </p>
        </div>

        {payments.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-3xl">
              💳
            </div>

            <h3 className="mt-3 font-semibold text-gray-800">
              No payments yet
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Payments you record will appear
              here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-600">
                    Payment ID
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Invoice
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Customer
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Invoice Amount
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Paid
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Outstanding
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Payment Amount
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Date
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Method
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Transaction
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Status
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => {
                  const invoice =
                    getInvoiceForPayment(
                      payment
                    );

                  const totalPaid = invoice
                    ? getTotalPaid(
                        invoice.invoice_id
                      )
                    : 0;

                  const outstanding = invoice
                    ? getOutstandingAmount(
                        invoice
                      )
                    : 0;

                  const invoiceStatus =
                    getPaymentRowStatus(
                      payment
                    );

                  return (
                    <tr
                      key={payment.payment_id}
                      className="border-t border-gray-100"
                    >
                      {/* PAYMENT ID */}

                      <td className="px-6 py-4 font-medium text-gray-900">
                        {payment.payment_id}
                      </td>

                      {/* INVOICE */}

                      <td className="px-6 py-4 font-medium text-blue-600">
                        {payment.invoice_number}
                      </td>

                      {/* CUSTOMER */}

                      <td className="px-6 py-4 text-gray-600">
                        {payment.customer_name}
                      </td>

                      {/* INVOICE AMOUNT */}

                      <td className="px-6 py-4 font-medium text-gray-900">
                        ₹
                        {formatMoney(
                          invoice
                            ? invoice.total_amount
                            : 0
                        )}
                      </td>

                      {/* TOTAL PAID */}

                      <td className="px-6 py-4 font-medium text-green-600">
                        ₹
                        {formatMoney(
                          totalPaid
                        )}
                      </td>

                      {/* OUTSTANDING */}

                      <td className="px-6 py-4 font-bold text-red-600">
                        ₹
                        {formatMoney(
                          outstanding
                        )}
                      </td>

                      {/* THIS PAYMENT */}

                      <td className="px-6 py-4 font-medium text-gray-900">
                        ₹
                        {formatMoney(
                          payment.amount
                        )}
                      </td>

                      {/* DATE */}

                      <td className="px-6 py-4 text-gray-600">
                        {payment.payment_date}
                      </td>

                      {/* METHOD */}

                      <td className="px-6 py-4 text-gray-600">
                        {payment.payment_method ||
                          "-"}
                      </td>

                      {/* TRANSACTION */}

                      <td className="max-w-xs px-6 py-4 text-gray-600">
                        {payment.transaction_details ||
                          "-"}
                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {/* PAYMENT STATUS */}

                          <span
                            className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                              payment.payment_status ===
                              "Completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {payment.payment_status ||
                              "Processing"}
                          </span>

                          {/* INVOICE STATUS */}

                          <span
                            className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                              invoiceStatus ===
                              "Paid"
                                ? "bg-green-100 text-green-700"
                                : invoiceStatus ===
                                  "Partially Paid"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {invoiceStatus}
                          </span>
                        </div>
                      </td>

                      {/* ACTION */}

                      <td className="px-6 py-4">
                        {payment.payment_status ===
                          "Processing" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCompletePayment(
                                payment.payment_id
                              )
                            }
                            className="text-sm font-medium text-green-600 hover:text-green-800"
                          >
                            Mark Completed
                          </button>
                        )}

                        {payment.payment_status ===
                          "Completed" && (
                          <span className="text-xs text-gray-400">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Payments;