import { useEffect, useState } from "react";
import API_URL from "../api";
import Card from "../components/common/Card";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

function Products() {
  const [products, setProducts] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
  });

  const [error, setError] = useState("");

  // =====================================================
  // LOAD PRODUCTS FROM DATABASE
  // =====================================================

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/products`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load products (${response.status})`
        );
      }

      const data = await response.json();

      console.log("Products from database:", data);

      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchProducts();
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

    setError("");
  };

  // =====================================================
  // CREATE PRODUCT
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      setError("Price must be greater than zero.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/products`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            price: Number(formData.price),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create product"
        );
      }

      console.log("Product created:", data);

      // Reload products from database
      await fetchProducts();

      handleClose();
    } catch (error) {
      console.error("Error creating product:", error);

      setError(
        error.message || "Failed to create product"
      );
    }
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const handleClose = () => {
    setIsModalOpen(false);

    setFormData({
      name: "",
      description: "",
      price: "",
    });

    setError("");
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div>
      {/* PAGE HEADER */}

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Products
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage products and their prices.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
        >
          + Add Product
        </Button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* PRODUCTS */}

      <Card>
        {products.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
              📦
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-800">
              No products yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Add your first product.
            </p>

            <div className="mt-5">
              <Button
                onClick={() => setIsModalOpen(true)}
              >
                + Add Product
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    ID
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Product
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Description
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Price
                  </th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.product_id}
                    className="border-t border-gray-100"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.product_id}
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {product.name}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.description || "-"}
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₹
                      {Number(
                        product.price
                      ).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ADD PRODUCT MODAL */}

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Add Product"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <Input
            label="Product Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter product name"
            required
          />

          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter product description"
          />

          <Input
            label="Price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            placeholder="Enter product price"
            required
          />

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
            >
              Cancel
            </Button>

            <Button type="submit">
              Add Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Products;