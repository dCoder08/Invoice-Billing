import { useEffect, useState } from "react";
import Card from "../components/common/Card";

function Dashboard() {
  // =====================================================
  // STATE
  // =====================================================

  const [summary, setSummary] = useState({
    totalInvoices: 0,
    totalCustomers: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    overdueInvoices: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH DASHBOARD DATA
  // =====================================================

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/dashboard"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();

      console.log("Dashboard data from backend:", data);

      setSummary({
        totalInvoices: Number(data.totalInvoices || 0),
        totalCustomers: Number(data.totalCustomers || 0),
        totalAmount: Number(data.totalAmount || 0),
        totalPaid: Number(data.totalPaid || 0),
        totalOutstanding: Number(
          data.totalOutstanding || 0
        ),
        overdueInvoices: Number(
          data.overdueInvoices || 0
        ),
      });
    } catch (err) {
      console.error("Error loading dashboard:", err);

      setError(
        err.message || "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchDashboard();
  }, []);

  // =====================================================
  // PAYMENT PERCENTAGE
  // =====================================================

  const paymentPercentage =
    summary.totalAmount > 0
      ? Math.min(
          (summary.totalPaid / summary.totalAmount) * 100,
          100
        )
      : 0;

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
  // DASHBOARD CARDS
  // =====================================================

  const cards = [
    {
      title: "Total Invoices",
      value: summary.totalInvoices,
      description: "Invoices created",
    },

    {
      title: "Total Customers",
      value: summary.totalCustomers,
      description: "Registered customers",
    },

    {
      title: "Total Amount",
      value: `₹${formatMoney(summary.totalAmount)}`,
      description: "Total invoice value",
    },

    {
      title: "Total Paid",
      value: `₹${formatMoney(summary.totalPaid)}`,
      description: "Amount received",
    },

    {
      title: "Outstanding",
      value: `₹${formatMoney(summary.totalOutstanding)}`,
      description: "Amount remaining",
    },

    {
      title: "Overdue Invoices",
      value: summary.overdueInvoices,
      description: "Require attention",
    },
  ];

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Overview of your invoice billing activity.
          </p>
        </div>

        <Card>
          <div className="p-10 text-center">
            <p className="text-sm text-gray-500">
              Loading dashboard...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Overview of your invoice billing activity.
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-800">
            Failed to load dashboard
          </p>

          <p className="mt-1 text-sm text-red-700">
            {error}
          </p>

          <button
            onClick={fetchDashboard}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div>
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Overview of your invoice billing activity.
          </p>
        </div>

        {/* REFRESH BUTTON */}

        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ↻ Refresh
        </button>
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <div className="p-5">
              <p className="text-sm font-medium text-gray-500">
                {card.title}
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {card.value}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {card.description}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* =====================================================
          PAYMENT OVERVIEW
      ===================================================== */}

      <div className="mt-6">
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Payment Overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Current payment collection summary.
            </p>

            {/* AMOUNT */}

            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-500">
                  Amount Collected
                </span>

                <span className="font-medium text-gray-900">
                  ₹{formatMoney(summary.totalPaid)}
                  {" / "}
                  ₹{formatMoney(summary.totalAmount)}
                </span>
              </div>

              {/* PROGRESS BAR */}

              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{
                    width: `${paymentPercentage}%`,
                  }}
                />
              </div>

              {/* PERCENTAGE + OUTSTANDING */}

              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>
                  {paymentPercentage.toFixed(1)}% collected
                </span>

                <span>
                  ₹{formatMoney(summary.totalOutstanding)}{" "}
                  remaining
                </span>
              </div>
            </div>

            {/* PAYMENT BREAKDOWN */}

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {/* TOTAL */}

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase text-gray-500">
                  Total
                </p>

                <p className="mt-1 text-lg font-semibold text-gray-900">
                  ₹{formatMoney(summary.totalAmount)}
                </p>
              </div>

              {/* PAID */}

              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-xs font-medium uppercase text-green-600">
                  Paid
                </p>

                <p className="mt-1 text-lg font-semibold text-green-700">
                  ₹{formatMoney(summary.totalPaid)}
                </p>
              </div>

              {/* OUTSTANDING */}

              <div className="rounded-lg bg-yellow-50 p-4">
                <p className="text-xs font-medium uppercase text-yellow-600">
                  Outstanding
                </p>

                <p className="mt-1 text-lg font-semibold text-yellow-700">
                  ₹
                  {formatMoney(
                    summary.totalOutstanding
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* =====================================================
          OVERDUE ALERT
      ===================================================== */}

      {summary.overdueInvoices > 0 && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <div className="text-xl">
              ⚠️
            </div>

            <div>
              <h3 className="font-semibold text-red-800">
                Overdue Invoices
              </h3>

              <p className="mt-1 text-sm text-red-700">
                You have{" "}
                <strong>
                  {summary.overdueInvoices}
                </strong>{" "}
                overdue invoice
                {summary.overdueInvoices !== 1
                  ? "s"
                  : ""}{" "}
                that require attention.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          NO OVERDUE INVOICES
      ===================================================== */}

      {summary.overdueInvoices === 0 && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-start gap-3">
            <div className="text-xl">
              ✅
            </div>

            <div>
              <h3 className="font-semibold text-green-800">
                Everything looks good
              </h3>

              <p className="mt-1 text-sm text-green-700">
                There are currently no overdue
                invoices.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;