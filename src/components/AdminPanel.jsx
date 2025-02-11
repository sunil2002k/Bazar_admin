import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./AdminPanel.css";
import { FaTrash, FaFlag, FaSignOutAlt, FaFileExport } from "react-icons/fa";

const AdminPanel = ({ setIsAuthenticated }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);

  // Function to handle row click
  const handleRowClick = (product) => {
    setSelectedProductDetails(product);
  };

  // Function to close the details modal
  const closeDetailsModal = () => {
    setSelectedProductDetails(null);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = "http://localhost:8000/sell";
      const res = await axios.get(url);

      if (res.data.products) {
        const productsWithEmails = await Promise.all(
          res.data.products.map(async (product) => {
            try {
              const userRes = await axios.get(
                `http://localhost:8000/get-user/${product.addedBy}`
              );
              product.ownerEmail = userRes.data.user.email;
            } catch (error) {
              console.error("Error fetching user email:", error);
              product.ownerEmail = "Error fetching email";
            }
            return product;
          })
        );
        setProducts(productsWithEmails);
      }
    } catch (error) {
      setError("Server error occurred while fetching products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const generateReportEmailTemplate = (productTitle, reportReason) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #333;">Product Report</h2>
      <p>A product has been reported for the following reason:</p>
      <ul>
        <li><strong>Product Title:</strong> ${productTitle}</li>
        <li><strong>Reason:</strong> ${reportReason}</li>
      </ul>
      <p>Please review this report promptly.</p>
    </div>
  `;

  const showDeleteConfirmation = async (productTitle) => {
    return window.confirm(
      `Are you sure you want to delete "${productTitle}"? This action cannot be undone.`
    );
  };

  const handleDelete = async (id, title) => {
    const confirmed = await showDeleteConfirmation(title);
    if (!confirmed) return;

    try {
      await axios.delete(`http://localhost:8000/admin/product/${id}`);
      setProducts(products.filter((product) => product._id !== id));
      alert("Product deleted successfully");
    } catch (error) {
      alert("Error deleting product");
    }
  };

  const handleSendReport = async () => {
    if (!reportReason || !selectedProduct) return;

    try {
      const { data } = await axios.get(
        `http://localhost:8000/get-user/${selectedProduct.addedBy}`
      );
      const userEmail = data.user.email;

      const emailTemplate = generateReportEmailTemplate(
        selectedProduct.title,
        reportReason
      );

      await axios.post("http://localhost:8000/admin/report-email", {
        email: userEmail,
        title: selectedProduct.title,
        reportReason,
        emailTemplate,
      });

      alert("Report email sent successfully");
      setShowReportModal(false);
      setReportReason("");
    } catch (error) {
      alert("Error sending email");
    }
  };

  const handleGenerateReport = () => {
    // Create CSV content
    const headers = [
      "Product Title",
      "Description",
      "Owner Email",
      "Status",
      "Category",
      "Price",
    ];

    const rows = products.map((product) => [
      product.title,
      product.description,
      product.ownerEmail,
      product.prod_status,
      product.category,
      `रु. ${Number(product.price).toLocaleString("en-IN")}`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((row) => row.join(",")).join("\n");

    // Create a downloadable link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "products_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert("Report generated and downloaded successfully!");
  };
  const logOut = () => {
    setIsAuthenticated(false);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="header-controls">
          <button className="btn report-btn" onClick={handleGenerateReport}>
            <FaFileExport />
            Generate Report
          </button>
          <button onClick={logOut} className="btn logout-btn">
            <FaSignOutAlt /> Log Out
          </button>
        </div>
      </header>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Products...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      ) : (
        <div className="table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Description</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product._id}
                  onClick={() => handleRowClick(product)}
                  style={{ cursor: "pointer" }}
                >
                  <td className="product-info">
                    {product.images && product.images.length > 0 && (
                      <img
                        src={`http://localhost:8000/${product.images[0]}`}
                        alt="Product"
                        className="product-image"
                        onError={(e) => {
                          e.target.src = "/placeholder-product.png";
                        }}
                      />
                    )}
                    <div className="product-meta">
                      <h3 className="product-title">{product.title}</h3>
                      <span className="product-category">
                        {product.category}
                      </span>
                    </div>
                  </td>
                  <td className="product-description">
                    {product.description || "No description"}
                  </td>
                  <td className="owner-email">
                    {product.ownerEmail || "Loading..."}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${product.prod_status.toLowerCase()}`}
                    >
                      {product.prod_status}
                    </span>
                  </td>
                  <td className="product-price">
                    रु. {Number(product.price).toLocaleString("en-IN")}
                  </td>
                  <td className="actions">
                    <button
                      className="btn report-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(product);
                        setShowReportModal(true);
                      }}
                    >
                      <FaFlag /> Report
                    </button>
                    <button
                      className="btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row click event
                        handleDelete(product._id, product.title);
                      }}
                    >
                      <FaTrash /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Product Details Modal */}
      {selectedProductDetails && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{selectedProductDetails.title}</h3>
            <div className="product-details-content">
              {selectedProductDetails.images && (
                <img
                  src={`http://localhost:8000/${selectedProductDetails.images[0]}`}
                  alt="Product"
                  className="product-image-modal"
                />
              )}
              <p>
                <strong>Description:</strong>{" "}
                {selectedProductDetails.description}
              </p>
              <p>
                <strong>Owner Email:</strong>{" "}
                {selectedProductDetails.ownerEmail}
              </p>
              <p>
                <strong>Status:</strong> {selectedProductDetails.prod_status}
              </p>
              <p>
                <strong>Category:</strong> {selectedProductDetails.category}
              </p>
              <p>
                <strong>Price:</strong> रु.{" "}
                {Number(selectedProductDetails.price).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn cancel-btn" onClick={closeDetailsModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Report Product: {selectedProduct?.title}</h3>
            <textarea
            className="modal-textarea"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Enter reason for reporting..."
              rows="4"
            />
            <div className="modal-actions">
              <button
                className="btn cancel-btn"
                onClick={() => setShowReportModal(false)}
              >
                Cancel
              </button>
              <button className="btn submit-btn" onClick={handleSendReport}>
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
