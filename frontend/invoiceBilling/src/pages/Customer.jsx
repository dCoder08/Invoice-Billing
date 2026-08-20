import { useEffect, useState } from "react";

import Card from "../components/common/Card";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

function Customers() {
  const [customers, setCustomers] = useState([]);

  const [statementOpen, setStatementOpen] = useState(false);
  const [statement, setStatement] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // =====================================================
  // GET CUSTOMERS FROM BACKEND
  // =====================================================

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/customers"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await response.json();

      console.log("Customers from database:", data);

      setCustomers(data);
    } catch (error) {
      console.error(
        "Error loading customers:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD CUSTOMERS WHEN PAGE OPENS
  // =====================================================

  useEffect(() => {
    fetchCustomers();
  }, []);

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
  // VALIDATION
  // =====================================================

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Customer name is required.";
    }

    if (
      formData.email &&
      !formData.email.includes("@")
    ) {
      newErrors.email = "Enter a valid email address.";
    }

    if (
      formData.phone &&
      !/^[0-9]{10}$/.test(formData.phone)
    ) {
      newErrors.phone =
        "Phone number must contain 10 digits.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =====================================================
  // ADD CUSTOMER
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/customers",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
          }),
        }
      );

      const data = await response.json();

      console.log("Create customer response:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create customer"
        );
      }

      // Reload customers from MySQL
      await fetchCustomers();

      // Close modal
      handleClose();
    } catch (error) {
      console.error(
        "Error creating customer:",
        error
      );

      alert(
        error.message ||
          "Failed to create customer"
      );
    }
  };

  // =====================================================
  // CLOSE ADD CUSTOMER MODAL
  // =====================================================

  const handleClose = () => {
    setIsModalOpen(false);

    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
    });

    setErrors({});
  };

  // =====================================================
  // CUSTOMER TOTALS
  // =====================================================

  const calculateTotals = (customer) => {
    const invoices = customer.invoices || [];

    const totalInvoice = invoices.reduce(
      (total, invoice) =>
        total + Number(invoice.amount || 0),
      0
    );

    const totalPaid = invoices.reduce(
      (total, invoice) =>
        total + Number(invoice.paid || 0),
      0
    );

    const totalOutstanding = invoices.reduce(
      (total, invoice) =>
        total + Number(invoice.outstanding || 0),
      0
    );

    return {
      totalInvoice,
      totalPaid,
      totalOutstanding,
    };
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div>
      {/* ================================================= */}
      {/* PAGE HEADER */}
      {/* ================================================= */}

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customers
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your customers and their information.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
        >
          + Add Customer
        </Button>
      </div>

      {/* ================================================= */}
      {/* CUSTOMER LIST */}
      {/* ================================================= */}

      {loading ? (
        <Card>
          <div className="p-10 text-center">
            <p className="text-sm text-gray-500">
              Loading customers...
            </p>
          </div>
        </Card>
      ) : customers.length === 0 ? (
        <Card>
          <div className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
              👤
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-800">
              No customers yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Add your first customer to start creating
              invoices.
            </p>

            <div className="mt-5">
              <Button
                onClick={() =>
                  setIsModalOpen(true)
                }
              >
                + Add Customer
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => {
            const totals =
              calculateTotals(customer);

            return (
              <Card
                key={customer.customer_id}
              >
                <div className="p-5">
                  {/* Customer Information */}

                  <div className="mb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                        {customer.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <h2 className="font-semibold text-gray-900">
                          {customer.name}
                        </h2>

                        <p className="text-sm text-gray-500">
                          {customer.email ||
                            "No email"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact */}

                  <div className="space-y-1 text-sm text-gray-500">
                    <p>
                      <span className="font-medium text-gray-700">
                        Phone:
                      </span>{" "}
                      {customer.phone ||
                        "Not provided"}
                    </p>

                    <p>
                      <span className="font-medium text-gray-700">
                        Address:
                      </span>{" "}
                      {customer.address ||
                        "Not provided"}
                    </p>
                  </div>

                  {/* Summary */}

                  <div className="mt-5 space-y-2 border-t border-gray-100 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        Total Invoices
                      </span>

                      <span className="font-medium text-gray-900">
                        {(customer.invoices || [])
                          .length}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        Total Paid
                      </span>

                      <span className="font-medium text-green-600">
                        ₹
                        {totals.totalPaid.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        Outstanding
                      </span>

                      <span className="font-medium text-gray-900">
                        ₹
                        {totals.totalOutstanding.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </div>
                  </div>

                  {/* View Statement */}

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCustomer(
                        customer
                      )
                    }
                    className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    View Statement
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ================================================= */}
      {/* ADD CUSTOMER MODAL */}
      {/* ================================================= */}

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Add Customer"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <Input
            label="Customer Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter customer name"
            required
            error={errors.name}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
            error={errors.email}
          />

          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter 10-digit phone number"
            error={errors.phone}
          />

          <Input
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter customer address"
          />

          {/* Buttons */}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
            >
              Cancel
            </Button>

            <Button type="submit">
              Add Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================================================= */}
      {/* CUSTOMER STATEMENT MODAL */}
      {/* ================================================= */}

      <Modal
        isOpen={!!selectedCustomer}
        onClose={() =>
          setSelectedCustomer(null)
        }
        title="Customer Statement"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Customer Information */}

            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">
                {selectedCustomer.name}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {selectedCustomer.email ||
                  "No email"}
              </p>

              <p className="text-sm text-gray-500">
                {selectedCustomer.phone ||
                  "No phone"}
              </p>

              <p className="text-sm text-gray-500">
                {selectedCustomer.address ||
                  "No address"}
              </p>
            </div>

            {/* Statement Summary */}

            {(() => {
              const totals =
                calculateTotals(
                  selectedCustomer
                );

              return (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs text-gray-500">
                      Total Invoiced
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-900">
                      ₹
                      {totals.totalInvoice.toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs text-gray-500">
                      Total Paid
                    </p>

                    <p className="mt-1 text-lg font-bold text-green-600">
                      ₹
                      {totals.totalPaid.toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs text-gray-500">
                      Outstanding
                    </p>

                    <p className="mt-1 text-lg font-bold text-red-600">
                      ₹
                      {totals.totalOutstanding.toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Invoice History */}

            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-800">
                Invoice History
              </h3>

              {(
                selectedCustomer.invoices ||
                []
              ).length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-500">
                    No invoices found for this
                    customer.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 font-medium text-gray-600">
                          Invoice
                        </th>

                        <th className="px-4 py-3 font-medium text-gray-600">
                          Date
                        </th>

                        <th className="px-4 py-3 font-medium text-gray-600">
                          Amount
                        </th>

                        <th className="px-4 py-3 font-medium text-gray-600">
                          Paid
                        </th>

                        <th className="px-4 py-3 font-medium text-gray-600">
                          Outstanding
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedCustomer.invoices.map(
                        (invoice) => (
                          <tr
                            key={
                              invoice.invoiceNumber
                            }
                            className="border-t border-gray-100"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {
                                invoice.invoiceNumber
                              }
                            </td>

                            <td className="px-4 py-3 text-gray-600">
                              {invoice.date}
                            </td>

                            <td className="px-4 py-3">
                              ₹
                              {Number(
                                invoice.amount
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </td>

                            <td className="px-4 py-3 text-green-600">
                              ₹
                              {Number(
                                invoice.paid
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </td>

                            <td className="px-4 py-3 font-medium">
                              ₹
                              {Number(
                                invoice.outstanding
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
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Customers;