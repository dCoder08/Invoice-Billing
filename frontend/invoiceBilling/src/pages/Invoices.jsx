import { useEffect, useState } from "react";

import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import Card from "../components/common/Card";
import Table from "../components/common/Table";

function Invoices() {
  // =====================================================
  // MODALS
  // =====================================================

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // =====================================================
  // SELECTED DATA
  // =====================================================

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // =====================================================
  // DATABASE DATA
  // =====================================================

  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // =====================================================
  // INVOICE FORM
  // =====================================================

  const [formData, setFormData] = useState({
    customer: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
  });

  // =====================================================
  // INVOICE ITEMS
  // =====================================================

  const [invoiceItems, setInvoiceItems] = useState([
    {
      product_id: "",
      quantity: 1,
      unit_price: "",
    },
  ]);

  // =====================================================
  // PAYMENT FORM
  // =====================================================

  const [paymentData, setPaymentData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    method: "",
    transactionDetails: "",
    status: "Completed",
  });

  // =====================================================
  // ERRORS
  // =====================================================

  const [errors, setErrors] = useState({});
  const [paymentError, setPaymentError] = useState("");

  // =====================================================
  // LOAD CUSTOMERS
  // =====================================================

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/customers"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch customers");
        }

        const data = await response.json();

        setCustomers(data);
      } catch (error) {
        console.error("Error loading customers:", error);
      }
    };

    loadCustomers();
  }, []);

  // =====================================================
  // LOAD PRODUCTS
  // =====================================================

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/products"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        setProducts(data);
      } catch (error) {
        console.error("Error loading products:", error);
      }
    };

    loadProducts();
  }, []);

  // =====================================================
  // LOAD INVOICES
  // =====================================================

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/invoices"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }

      const data = await response.json();

      const formattedInvoices = await Promise.all(
        data.map(async (invoice) => {
          let payments = [];

          try {
            const paymentResponse = await fetch(
              `http://localhost:5000/api/payments/invoice/${invoice.invoice_id}`
            );

            if (paymentResponse.ok) {
              const paymentData = await paymentResponse.json();

              payments = paymentData.map((payment) => ({
                id: payment.payment_id,
                invoice_id: payment.invoice_id,
                amount: Number(payment.amount),
                date: payment.payment_date,
                method: payment.payment_method,
                transactionDetails:
                  payment.transaction_details,
                status: payment.payment_status,
              }));
            }
          } catch (paymentError) {
            console.error(
              `Error loading payments for invoice ${invoice.invoice_id}:`,
              paymentError
            );
          }

          return {
            id: invoice.invoice_id,

            invoiceNumber: `INV-${String(
              invoice.invoice_id
            ).padStart(4, "0")}`,

            customerId: invoice.customer_id,

            customer: invoice.customer_name,

            date: invoice.invoice_date,

            dueDate: invoice.due_date,

            amount: Number(invoice.total_amount),

            status: invoice.status || "Pending",

            description: invoice.description || "",

            payments,
          };
        })
      );

      setInvoices(formattedInvoices);

      return formattedInvoices;
    } catch (error) {
      console.error("Error loading invoices:", error);

      return [];
    }
  };

  // =====================================================
  // REFRESH ONE INVOICE
  // =====================================================

  const refreshInvoice = async (invoiceId) => {
    try {
      const invoiceResponse = await fetch(
        `http://localhost:5000/api/invoices/${invoiceId}`
      );

      if (!invoiceResponse.ok) {
        throw new Error("Failed to fetch invoice");
      }

      const invoiceData = await invoiceResponse.json();

      const paymentResponse = await fetch(
        `http://localhost:5000/api/payments/invoice/${invoiceId}`
      );

      let payments = [];

      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();

        payments = paymentData.map((payment) => ({
          id: payment.payment_id,
          invoice_id: payment.invoice_id,
          amount: Number(payment.amount),
          date: payment.payment_date,
          method: payment.payment_method,
          transactionDetails: payment.transaction_details,
          status: payment.payment_status,
        }));
      }

      const existingInvoice = invoices.find(
        (invoice) =>
          Number(invoice.id) === Number(invoiceId)
      );

      const refreshedInvoice = {
        ...(existingInvoice || {}),

        id: invoiceData.invoice_id || invoiceId,

        invoiceNumber: `INV-${String(
          invoiceData.invoice_id || invoiceId
        ).padStart(4, "0")}`,

        customerId:
          invoiceData.customer_id ||
          existingInvoice?.customerId,

        customer:
          invoiceData.customer_name ||
          existingInvoice?.customer,

        date:
          invoiceData.invoice_date ||
          existingInvoice?.date,

        dueDate:
          invoiceData.due_date ||
          existingInvoice?.dueDate,

        amount: Number(
          invoiceData.total_amount ??
            existingInvoice?.amount ??
            0
        ),

        status:
          invoiceData.status ||
          existingInvoice?.status ||
          "Pending",

        description:
          invoiceData.description ||
          existingInvoice?.description ||
          "",

        items:
          invoiceData.items ||
          existingInvoice?.items ||
          [],

        payments,
      };

      setInvoices((previous) =>
        previous.map((invoice) =>
          Number(invoice.id) === Number(invoiceId)
            ? refreshedInvoice
            : invoice
        )
      );

      setSelectedInvoice((previous) => {
        if (
          previous &&
          Number(previous.id) === Number(invoiceId)
        ) {
          return refreshedInvoice;
        }

        return previous;
      });

      return refreshedInvoice;
    } catch (error) {
      console.error("Error refreshing invoice:", error);

      return null;
    }
  };

  // =====================================================
  // INVOICE NUMBER
  // =====================================================

  const generateInvoiceNumber = () => {
    if (invoices.length === 0) {
      return "INV-0001";
    }

    const highestId = Math.max(
      ...invoices.map((invoice) => Number(invoice.id))
    );

    return `INV-${String(highestId + 1).padStart(4, "0")}`;
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  // =====================================================
  // PRODUCT CHANGE
  // =====================================================

  const handleProductChange = (index, productId) => {
    const selectedProduct = products.find(
      (product) =>
        Number(product.product_id) === Number(productId)
    );

    setInvoiceItems((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              product_id: productId,
              unit_price: selectedProduct
                ? Number(selectedProduct.price)
                : "",
            }
          : item
      )
    );

    setErrors((previous) => ({
      ...previous,
      items: "",
    }));
  };

  // =====================================================
  // QUANTITY CHANGE
  // =====================================================

  const handleQuantityChange = (index, quantity) => {
    setInvoiceItems((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );

    setErrors((previous) => ({
      ...previous,
      items: "",
    }));
  };

  // =====================================================
  // ADD PRODUCT
  // =====================================================

  const addInvoiceItem = () => {
    setInvoiceItems((previous) => [
      ...previous,
      {
        product_id: "",
        quantity: 1,
        unit_price: "",
      },
    ]);
  };

  // =====================================================
  // REMOVE PRODUCT
  // =====================================================

  const removeInvoiceItem = (index) => {
    if (invoiceItems.length === 1) {
      return;
    }

    setInvoiceItems((previous) =>
      previous.filter(
        (_, itemIndex) => itemIndex !== index
      )
    );
  };

  // =====================================================
  // ITEM SUBTOTAL
  // =====================================================

  const getItemSubtotal = (item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;

    return quantity * unitPrice;
  };

  // =====================================================
  // INVOICE TOTAL
  // =====================================================

  const getInvoiceTotal = () => {
    return invoiceItems.reduce(
      (total, item) =>
        total + getItemSubtotal(item),
      0
    );
  };

  // =====================================================
  // VALIDATE INVOICE
  // =====================================================

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer) {
      newErrors.customer = "Customer is required.";
    }

    if (!formData.date) {
      newErrors.date = "Invoice date is required.";
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required.";
    }

    if (
      formData.date &&
      formData.dueDate &&
      formData.dueDate < formData.date
    ) {
      newErrors.dueDate =
        "Due date cannot be before invoice date.";
    }

    if (!invoiceItems || invoiceItems.length === 0) {
      newErrors.items =
        "At least one product is required.";
    } else {
      const hasInvalidItem = invoiceItems.some(
        (item) =>
          !item.product_id ||
          Number(item.quantity) <= 0 ||
          item.unit_price === ""
      );

      if (hasInvalidItem) {
        newErrors.items =
          "Please select a product and enter a valid quantity for every item.";
      }
    }

    if (getInvoiceTotal() <= 0) {
      newErrors.items =
        "Invoice total must be greater than zero.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =====================================================
  // CREATE INVOICE
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/invoices",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_id: Number(formData.customer),

            invoice_date: formData.date,

            due_date: formData.dueDate,

            items: invoiceItems.map((item) => ({
              product_id: Number(item.product_id),
              quantity: Number(item.quantity),
              unit_price: Number(item.unit_price),
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create invoice"
        );
      }

      alert("Invoice saved successfully!");

      await loadInvoices();

      handleClose();
    } catch (error) {
      console.error("Error creating invoice:", error);

      alert(
        error.message || "Failed to create invoice"
      );
    }
  };

  // =====================================================
  // CLOSE CREATE INVOICE
  // =====================================================

  const handleClose = () => {
    setIsModalOpen(false);

    setFormData({
      customer: "",
      date: new Date().toISOString().split("T")[0],
      dueDate: "",
    });

    setInvoiceItems([
      {
        product_id: "",
        quantity: 1,
        unit_price: "",
      },
    ]);

    setErrors({});
  };

  // =====================================================
  // PAYMENT CALCULATIONS
  // =====================================================

  const getTotalPaid = (invoice) => {
    if (!invoice || !invoice.payments) {
      return 0;
    }

    return invoice.payments.reduce(
      (total, payment) => {
        if (payment.status === "Completed") {
          return (
            total + Number(payment.amount || 0)
          );
        }

        return total;
      },
      0
    );
  };

  const getOutstandingAmount = (invoice) => {
    if (!invoice) {
      return 0;
    }

    return Math.max(
      Number(invoice.amount || 0) -
        getTotalPaid(invoice),
      0
    );
  };

  const getPaymentStatus = (invoice) => {
    if (!invoice) {
      return "Unpaid";
    }

    const totalPaid = getTotalPaid(invoice);
    const invoiceAmount = Number(
      invoice.amount || 0
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
  // CHECK OVERDUE
  // =====================================================

  const isInvoiceOverdue = (invoice) => {
    if (!invoice) {
      return false;
    }

    const outstandingAmount =
      getOutstandingAmount(invoice);

    // Fully paid invoices are never overdue
    if (outstandingAmount <= 0) {
      return false;
    }

    if (!invoice.dueDate) {
      return false;
    }

    // Convert backend date:
    // 2026-08-16T18:30:00.000Z
    // into:
    // 2026-08-16
    const dueDateOnly = String(invoice.dueDate).slice(
      0,
      10
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(
      `${dueDateOnly}T00:00:00`
    );

    return dueDate < today;
  };

  // =====================================================
  // VIEW INVOICE
  // =====================================================

  const handleViewInvoice = async (invoice) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/invoices/${invoice.id}`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch invoice details"
        );
      }

      const data = await response.json();

      const paymentResponse = await fetch(
        `http://localhost:5000/api/payments/invoice/${invoice.id}`
      );

      let payments = [];

      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();

        payments = paymentData.map((payment) => ({
          id: payment.payment_id,
          invoice_id: payment.invoice_id,
          amount: Number(payment.amount),
          date: payment.payment_date,
          method: payment.payment_method,
          transactionDetails:
            payment.transaction_details,
          status: payment.payment_status,
        }));
      }

      const detailedInvoice = {
        ...invoice,

        items: data.items || [],

        description: data.description || "",

        payments,
      };

      setSelectedInvoice(detailedInvoice);

      setIsDetailsOpen(true);
    } catch (error) {
      console.error(
        "Error loading invoice details:",
        error
      );

      setSelectedInvoice(invoice);
      setIsDetailsOpen(true);
    }
  };

  // =====================================================
  // CLOSE DETAILS
  // =====================================================

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedInvoice(null);
  };

  // =====================================================
  // OPEN PAYMENT
  // =====================================================

  const handleOpenPayment = (invoice) => {
    setSelectedInvoice(invoice);

    setPaymentData({
      amount: "",
      date: new Date().toISOString().split("T")[0],
      method: "",
      transactionDetails: "",
      status: "Completed",
    });

    setPaymentError("");

    setIsPaymentOpen(true);
  };

  // =====================================================
  // CLOSE PAYMENT
  // =====================================================

  const handleClosePayment = () => {
    setIsPaymentOpen(false);

    setPaymentData({
      amount: "",
      date: new Date().toISOString().split("T")[0],
      method: "",
      transactionDetails: "",
      status: "Completed",
    });

    setPaymentError("");
  };

  // =====================================================
  // PAYMENT FORM CHANGE
  // =====================================================

  const handlePaymentChange = (event) => {
    const { name, value } = event.target;

    setPaymentData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setPaymentError("");
  };

  // =====================================================
  // RECORD PAYMENT
  // =====================================================

  const handleRecordPayment = async (event) => {
    event.preventDefault();

    if (!selectedInvoice) {
      return;
    }

    const paymentAmount = Number(
      paymentData.amount
    );

    const outstanding =
      getOutstandingAmount(selectedInvoice);

    if (!paymentData.amount) {
      setPaymentError(
        "Payment amount is required."
      );
      return;
    }

    if (paymentAmount <= 0) {
      setPaymentError(
        "Payment amount must be greater than zero."
      );
      return;
    }

    if (!paymentData.method) {
      setPaymentError(
        "Please select a payment method."
      );
      return;
    }

    if (!paymentData.transactionDetails.trim()) {
      setPaymentError(
        "Transaction details are required."
      );
      return;
    }

    if (
      paymentData.status === "Completed" &&
      paymentAmount > outstanding
    ) {
      setPaymentError(
        `Payment cannot exceed the outstanding amount of ₹${outstanding.toLocaleString(
          "en-IN"
        )}.`
      );

      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/payments",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            invoice_id: Number(
              selectedInvoice.id
            ),

            payment_date: paymentData.date,

            amount: paymentAmount,

            payment_method: paymentData.method,

            transaction_details:
              paymentData.transactionDetails,

            payment_status: paymentData.status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to record payment"
        );
      }

      const invoiceId = selectedInvoice.id;

      handleClosePayment();

      const refreshedInvoices =
        await loadInvoices();

      const refreshedInvoice =
        refreshedInvoices.find(
          (invoice) =>
            Number(invoice.id) ===
            Number(invoiceId)
        );

      if (refreshedInvoice) {
        const detailResponse = await fetch(
          `http://localhost:5000/api/invoices/${invoiceId}`
        );

        let invoiceDetails = {};

        if (detailResponse.ok) {
          invoiceDetails =
            await detailResponse.json();
        }

        const updatedSelectedInvoice = {
          ...refreshedInvoice,

          items:
            invoiceDetails.items ||
            refreshedInvoice.items ||
            [],

          description:
            invoiceDetails.description ||
            refreshedInvoice.description ||
            "",
        };

        setSelectedInvoice(
          updatedSelectedInvoice
        );

        setIsDetailsOpen(true);
      }

      alert("Payment recorded successfully!");
    } catch (error) {
      console.error(
        "Error recording payment:",
        error
      );

      setPaymentError(
        error.message ||
          "Failed to record payment."
      );
    }
  };

  // =====================================================
  // COMPLETE PAYMENT
  // =====================================================

  const handleCompletePayment = async (
    invoice,
    paymentId
  ) => {
    if (!invoice || !paymentId) {
      return;
    }

    const payment = invoice.payments?.find(
      (item) =>
        Number(item.id) === Number(paymentId)
    );

    if (!payment) {
      alert("Payment not found.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/payments/${paymentId}/complete`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to complete payment"
        );
      }

      const refreshedInvoices =
        await loadInvoices();

      const refreshedInvoice =
        refreshedInvoices.find(
          (item) =>
            Number(item.id) ===
            Number(invoice.id)
        );

      if (!refreshedInvoice) {
        throw new Error(
          "Invoice could not be refreshed."
        );
      }

      const detailResponse = await fetch(
        `http://localhost:5000/api/invoices/${invoice.id}`
      );

      let invoiceDetails = {};

      if (detailResponse.ok) {
        invoiceDetails =
          await detailResponse.json();
      }

      const updatedInvoice = {
        ...refreshedInvoice,

        items:
          invoiceDetails.items ||
          invoice.items ||
          [],

        description:
          invoiceDetails.description ||
          invoice.description ||
          "",
      };

      setSelectedInvoice(updatedInvoice);

      setIsDetailsOpen(true);

      alert(
        "Payment marked as completed successfully!"
      );
    } catch (error) {
      console.error(
        "Error completing payment:",
        error
      );

      alert(
        error.message ||
          "Failed to complete payment."
      );
    }
  };

  // =====================================================
  // RECEIPT
  // =====================================================

  const handleGenerateReceipt = (
    invoice,
    payment
  ) => {
    if (payment.status !== "Completed") {
      return;
    }

    setSelectedInvoice(invoice);
    setSelectedPayment(payment);

    setIsReceiptOpen(true);
  };

  // =====================================================
  // CLOSE RECEIPT
  // =====================================================

  const handleCloseReceipt = () => {
    setIsReceiptOpen(false);
    setSelectedPayment(null);
  };

  // =====================================================
  // PRINT RECEIPT
  // =====================================================

  const handlePrintReceipt = () => {
    window.print();
  };

  // =====================================================
  // TABLE COLUMNS
  // =====================================================

  const columns = [
    {
      key: "invoiceNumber",
      label: "Invoice No.",
    },
    {
      key: "customer",
      label: "Customer",
    },
    {
      key: "dueDate",
      label: "Due Date",
    },
    {
      key: "amount",
      label: "Amount",
    },
    {
      key: "outstanding",
      label: "Outstanding",
    },
    {
      key: "paymentStatus",
      label: "Status",
    },
    {
      key: "actions",
      label: "Actions",
    },
  ];

  // =====================================================
  // UI
  // =====================================================

  return (
    <div>
      {/* PAGE HEADER */}

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Invoices
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create and manage customer invoices.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
        >
          + Create Invoice
        </Button>
      </div>

      {/* INVOICE TABLE */}

      <Card>
        {invoices.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
              🧾
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-800">
              No invoices yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Create your first invoice for a customer.
            </p>

            <div className="mt-5">
              <Button
                onClick={() =>
                  setIsModalOpen(true)
                }
              >
                + Create Invoice
              </Button>
            </div>
          </div>
        ) : (
          <Table
            columns={columns}
            data={invoices}
            renderRow={(invoice) => {
              const outstanding =
                getOutstandingAmount(invoice);

              const paymentStatus =
                getPaymentStatus(invoice);

              const overdue =
                isInvoiceOverdue(invoice);

              const status = overdue
                ? "Overdue"
                : paymentStatus;

              return (
                <tr key={invoice.id}>
                  {/* INVOICE NUMBER */}

                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </span>
                  </td>

                  {/* CUSTOMER */}

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {invoice.customer}
                  </td>

                  {/* DUE DATE */}

                  <td
                    className={`px-6 py-4 text-sm font-medium ${
                      overdue
                        ? "bg-red-50 text-red-700"
                        : "text-gray-600"
                    }`}
                  >
                    {invoice.dueDate
                      ? String(invoice.dueDate).slice(
                          0,
                          10
                        )
                      : "-"}
                  </td>

                  {/* AMOUNT */}

                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ₹
                    {Number(
                      invoice.amount
                    ).toLocaleString("en-IN")}
                  </td>

                  {/* OUTSTANDING */}

                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ₹
                    {outstanding.toLocaleString(
                      "en-IN"
                    )}
                  </td>

                  {/* STATUS */}

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : status === "Overdue"
                          ? "bg-red-100 text-red-700"
                          : status ===
                            "Partially Paid"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {status}
                    </span>
                  </td>

                  {/* ACTIONS */}

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleViewInvoice(invoice)
                        }
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        View
                      </button>

                      {outstanding > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenPayment(invoice)
                          }
                          className="text-sm font-medium text-green-600 hover:text-green-800"
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }}
          />
        )}
      </Card>

      {/* =====================================================
          CREATE INVOICE MODAL
      ===================================================== */}

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Create Invoice"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Invoice Number
            </label>

            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700">
              {generateInvoiceNumber()}
            </div>
          </div>

          <div>
            <label
              htmlFor="customer"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Customer
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              id="customer"
              name="customer"
              value={formData.customer}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 ${
                errors.customer
                  ? "border-red-400 focus:ring-red-100"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
              }`}
            >
              <option value="">
                Select customer
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

            {errors.customer && (
              <p className="mt-1 text-xs text-red-500">
                {errors.customer}
              </p>
            )}
          </div>

          <Input
            label="Invoice Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
            error={errors.date}
          />

          <Input
            label="Due Date"
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleChange}
            required
            error={errors.dueDate}
          />

          {/* PRODUCTS */}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Products
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <button
                type="button"
                onClick={addInvoiceItem}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                + Add Product
              </button>
            </div>

            {errors.items && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                {errors.items}
              </div>
            )}

            <div className="space-y-3">
              {invoiceItems.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-3">
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">
                      Product
                    </label>

                    <select
                      value={item.product_id}
                      onChange={(event) =>
                        handleProductChange(
                          index,
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">
                        Select product
                      </option>

                      {products.map((product) => (
                        <option
                          key={product.product_id}
                          value={product.product_id}
                        >
                          {product.name} - ₹
                          {Number(
                            product.price
                          ).toLocaleString("en-IN")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Quantity
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) =>
                          handleQuantityChange(
                            index,
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Unit Price
                      </label>

                      <input
                        type="number"
                        value={item.unit_price}
                        readOnly
                        className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-700"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Subtotal
                      </label>

                      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900">
                        ₹
                        {getItemSubtotal(
                          item
                        ).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  {invoiceItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        removeInvoiceItem(index)
                      }
                      className="mt-3 text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      Remove Product
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* TOTAL */}

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">
                Invoice Total
              </span>

              <span className="text-xl font-bold text-blue-700">
                ₹
                {getInvoiceTotal().toLocaleString(
                  "en-IN"
                )}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
            >
              Cancel
            </Button>

            <Button type="submit">
              Create Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* =====================================================
          INVOICE DETAILS MODAL
      ===================================================== */}

      <Modal
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        title="Invoice Details"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            {/* HEADER */}

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Invoice Number
                </p>

                <p className="text-lg font-bold text-gray-900">
                  {selectedInvoice.invoiceNumber}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  isInvoiceOverdue(
                    selectedInvoice
                  )
                    ? "bg-red-100 text-red-700"
                    : getPaymentStatus(
                        selectedInvoice
                      ) === "Paid"
                    ? "bg-green-100 text-green-700"
                    : getPaymentStatus(
                        selectedInvoice
                      ) === "Partially Paid"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {isInvoiceOverdue(
                  selectedInvoice
                )
                  ? "Overdue"
                  : getPaymentStatus(
                      selectedInvoice
                    )}
              </span>
            </div>

            {/* CUSTOMER */}

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase text-gray-500">
                Customer
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {selectedInvoice.customer}
              </p>
            </div>

            {/* DATES */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Invoice Date
                </p>

                <p className="mt-1 text-sm text-gray-900">
                  {selectedInvoice.date}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500">
                  Due Date
                </p>

                <p className="mt-1 text-sm text-gray-900">
                  {selectedInvoice.dueDate}
                </p>
              </div>
            </div>

            {/* PRODUCTS */}

            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-800">
                Products
              </h3>

              {!selectedInvoice.items ||
              selectedInvoice.items.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-5 text-center">
                  <p className="text-sm text-gray-500">
                    No product items found.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 font-medium text-gray-600">
                          Product
                        </th>

                        <th className="px-4 py-3 font-medium text-gray-600">
                          Qty
                        </th>

                        <th className="px-4 py-3 font-medium text-gray-600">
                          Unit Price
                        </th>

                        <th className="px-4 py-3 font-medium text-gray-600">
                          Subtotal
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedInvoice.items.map(
                        (item) => (
                          <tr
                            key={
                              item.invoice_item_id ||
                              item.product_id ||
                              item.id
                            }
                            className={`border-t ${
                              isInvoiceOverdue(
                                selectedInvoice
                              )
                                ? "border-red-200 bg-red-50"
                                : "border-gray-100"
                            }`}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {item.product_name}
                            </td>

                            <td className="px-4 py-3 text-gray-600">
                              {item.quantity}
                            </td>

                            <td className="px-4 py-3 text-gray-600">
                              ₹
                              {Number(
                                item.unit_price
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </td>

                            <td className="px-4 py-3 font-medium text-gray-900">
                              ₹
                              {Number(
                                item.subtotal
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* TOTAL */}

            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">
                  Invoice Amount
                </span>

                <span className="text-lg font-bold text-gray-900">
                  ₹
                  {Number(
                    selectedInvoice.amount
                  ).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-500">
                  Completed Payments
                </span>

                <span className="font-medium text-green-600">
                  ₹
                  {getTotalPaid(
                    selectedInvoice
                  ).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-500">
                  Outstanding
                </span>

                <span className="font-bold text-gray-900">
                  ₹
                  {getOutstandingAmount(
                    selectedInvoice
                  ).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* PAYMENT HISTORY */}

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">
                  Payment History
                </h3>

                {getOutstandingAmount(
                  selectedInvoice
                ) > 0 && (
                  <Button
                    onClick={() =>
                      handleOpenPayment(
                        selectedInvoice
                      )
                    }
                  >
                    + Record Payment
                  </Button>
                )}
              </div>

              {!selectedInvoice.payments ||
              selectedInvoice.payments.length ===
                0 ? (
                <div className="rounded-lg bg-gray-50 p-5 text-center">
                  <p className="text-sm text-gray-500">
                    No payments recorded yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 font-medium text-gray-600">
                          Date
                        </th>

                        <th className="px-4 py-3 font-medium text-gray-600">
                          Amount
                        </th>

                        <th className="px-4 py-3 font-medium text-gray-600">
                          Method
                        </th>

                        <th className="px-4 py-3 font-medium text-gray-600">
                          Status
                        </th>

                        <th className="px-4 py-3 font-medium text-gray-600">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedInvoice.payments.map(
                        (payment) => (
                          <tr
                            key={payment.id}
                            className="border-t border-gray-100"
                          >
                            <td className="px-4 py-3 text-gray-600">
                              {payment.date}
                            </td>

                            <td className="px-4 py-3 font-medium text-gray-900">
                              ₹
                              {Number(
                                payment.amount
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </td>

                            <td className="px-4 py-3 text-gray-600">
                              {payment.method || "-"}
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  payment.status ===
                                  "Completed"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {payment.status ||
                                  "Processing"}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                {payment.status ===
                                  "Processing" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCompletePayment(
                                        selectedInvoice,
                                        payment.id
                                      )
                                    }
                                    className="text-xs font-medium text-green-600 hover:text-green-800"
                                  >
                                    Mark Completed
                                  </button>
                                )}

                                {payment.status ===
                                  "Completed" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleGenerateReceipt(
                                        selectedInvoice,
                                        payment
                                      )
                                    }
                                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                  >
                                    Receipt
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* CLOSE */}

            <div className="flex justify-end border-t border-gray-100 pt-5">
              <Button
                variant="secondary"
                onClick={handleCloseDetails}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* =====================================================
          RECORD PAYMENT MODAL
      ===================================================== */}

      <Modal
        isOpen={isPaymentOpen}
        onClose={handleClosePayment}
        title="Record Payment"
      >
        {selectedInvoice && (
          <form
            onSubmit={handleRecordPayment}
            className="space-y-5"
          >
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase text-gray-500">
                Invoice
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {selectedInvoice.invoiceNumber}
              </p>

              <p className="text-sm text-gray-500">
                {selectedInvoice.customer}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">
                Current Outstanding
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                ₹
                {getOutstandingAmount(
                  selectedInvoice
                ).toLocaleString("en-IN")}
              </p>
            </div>

            <Input
              label="Payment Amount"
              name="amount"
              type="number"
              value={paymentData.amount}
              onChange={handlePaymentChange}
              placeholder="Enter amount paid"
              required
            />

            <Input
              label="Payment Date"
              name="date"
              type="date"
              value={paymentData.date}
              onChange={handlePaymentChange}
              required
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Payment Method
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                name="method"
                value={paymentData.method}
                onChange={handlePaymentChange}
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

                <option value="Bank Transfer">
                  Bank Transfer
                </option>

                <option value="Card">
                  Card
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Transaction Details
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <textarea
                name="transactionDetails"
                value={
                  paymentData.transactionDetails
                }
                onChange={handlePaymentChange}
                rows="3"
                placeholder="Enter transaction ID, reference number, or payment details"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Payment Status
              </label>

              <select
                name="status"
                value={paymentData.status}
                onChange={handlePaymentChange}
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

            {paymentError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {paymentError}
              </div>
            )}

            <div className="rounded-lg bg-blue-50 px-4 py-3 text-xs text-blue-700">
              Processing payments will not reduce
              the outstanding amount until they are
              marked as Completed.
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClosePayment}
              >
                Cancel
              </Button>

              <Button type="submit">
                Record Payment
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* =====================================================
          PAYMENT RECEIPT
      ===================================================== */}

      <Modal
        isOpen={isReceiptOpen}
        onClose={handleCloseReceipt}
        title="Payment Receipt"
      >
        {selectedInvoice && selectedPayment && (
          <div
            id="payment-receipt"
            className="space-y-6"
          >
            <div className="border-b border-gray-200 pb-5 text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                PAYMENT RECEIPT
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Invoice Billing System
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">
                  Receipt Date
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {selectedPayment.date}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-500">
                  Invoice Number
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {selectedInvoice.invoiceNumber}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase text-gray-500">
                Customer
              </p>

              <p className="mt-1 text-lg font-semibold text-gray-900">
                {selectedInvoice.customer}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                Payment Details
              </h3>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Amount Paid
                </span>

                <span className="font-bold text-gray-900">
                  ₹
                  {Number(
                    selectedPayment.amount
                  ).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Payment Method
                </span>

                <span className="font-medium text-gray-900">
                  {selectedPayment.method}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-500">
                  Transaction Details
                </span>

                <span className="text-right font-medium text-gray-900">
                  {
                    selectedPayment.transactionDetails
                  }
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Payment Status
                </span>

                <span className="font-medium text-green-600">
                  {selectedPayment.status}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">
                  Remaining Outstanding
                </span>

                <span className="font-bold text-gray-900">
                  ₹
                  {getOutstandingAmount(
                    selectedInvoice
                  ).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-5 text-center">
              <p className="text-xs text-gray-500">
                Payment successfully recorded.
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Thank you for your payment.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
              <Button
                variant="secondary"
                onClick={handleCloseReceipt}
              >
                Close
              </Button>

              <Button onClick={handlePrintReceipt}>
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Invoices;