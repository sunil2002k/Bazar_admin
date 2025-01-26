import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const AdminPanel = () => {
  const [products, setProducts] = useState([]);

  // Fetch all products
  const fetchProducts = useCallback(() => {
    const url = "http://localhost:8000/sell";
    axios
      .get(url)
      .then((res) => {
        if (res.data.products) {
          const productsWithEmails = res.data.products.map((product) => {
            // Fetch the user's email using the addedBy (user ID)
            axios
              .get(`http://localhost:8000/get-user/${product.addedBy}`)
              .then((userRes) => {
                product.ownerEmail = userRes.data.user.email;
                setProducts((prevProducts) => [...prevProducts]);
              })
              .catch(() => alert("Server error occurred while fetching user email"));
            return product;
          });
          // Initially set the products without the email for the first render
          setProducts(productsWithEmails);
        }
      })
      .catch(() => alert("Server error occurred while fetching products"));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Delete product
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/admin/product/${id}`);
      setProducts(products.filter((product) => product._id !== id));
      alert("Product deleted successfully");
    } catch (error) {
      alert("Error deleting product");
    }
  };

  // Send report email
  const handleSendReport = async (addedBy, title) => {
    const reportReason = prompt("Enter the reason for reporting this product:");
    if (!reportReason) return;

    try {
      // Fetch the user details using the `addedBy` ID
      const { data } = await axios.get(`http://localhost:8000/get-user/${addedBy}`);
      const userEmail = data.user.email; // Assuming the response contains the user's email in `data.user.email`

      // Send the report email
      await axios.post("http://localhost:8000/admin/report-email", {
        email: userEmail,
        title,
        reportReason,
      });

      alert("Report email sent successfully");
    } catch (error) {
      alert("Error sending email");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">Product Name</th>
            <th className="border border-gray-300 p-2">Owner Email</th>
            <th className="border border-gray-300 p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td className="border border-gray-300 p-2">{product.title}</td>
              <td className="border border-gray-300 p-2">{product.ownerEmail || "Loading..."}</td>
              <td className="border border-gray-300 p-2">
                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(product._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded mr-2"
                >
                  Delete
                </button>

                {/* Send Report Email Button */}
                <button
                  onClick={() => handleSendReport(product.addedBy, product.title)}
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                  Send Report
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPanel;
