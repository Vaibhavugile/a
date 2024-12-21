import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useUser } from './Auth/UserContext';
import './VendorDashboard.css';
import { FaEdit, FaSave, FaCaretDown, FaCaretUp, FaPlus, FaFileExport } from 'react-icons/fa';
import UserSidebar from './UserSidebar';
import UserHeader from './UserHeader';

const VendorDashboard = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [expandedVendorId, setExpandedVendorId] = useState(null);
  const { userData } = useUser();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [commentData, setCommentData] = useState({
    amountPaid: '',
    paidBy: '',
    date: ''
  });

  useEffect(() => {
    const fetchVendors = async () => {
      if (userData && userData.branchCode) {
        const q = query(collection(db, 'Vendors'), where('branchCode', '==', userData.branchCode));
        const snapshot = await getDocs(q);

        const vendorData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const stockRef = collection(doc.ref, 'Stock');
            const stockSnapshot = await getDocs(stockRef);

            const stockDetails = stockSnapshot.docs.map((stockDoc) => stockDoc.data());
            return { id: doc.id, ...data, stockDetails };
          })
        );

        setVendors(vendorData);
        setLoading(false);
      }
    };

    fetchVendors();
  }, [userData]);

  const handleEdit = (vendorId) => {
    setEditingVendorId(vendorId);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleAddVendor = () => {
    navigate('/add-vendor');
  };

  const handleSave = async (vendorId) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    const vendorRef = doc(db, 'Vendors', vendorId);

    // Save the comment to the vendor's document
    await updateDoc(vendorRef, {
      comments: arrayUnion(commentData), // Add the comment to the "comments" field
    });

    alert('Vendor details updated!');
    setEditingVendorId(null);
    setCommentData({ amountPaid: '', paidBy: '', date: '' }); // Clear the comment form after saving
  };

  const handleInputChange = (vendorId, field, value) => {
    setVendors((prev) =>
      prev.map((vendor) =>
        vendor.id === vendorId ? { ...vendor, [field]: Number(value) } : vendor
      )
    );
  };

  const handleCommentChange = (e) => {
    const { name, value } = e.target;
    setCommentData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const toggleExpanded = (vendorId) => {
    setExpandedVendorId(expandedVendorId === vendorId ? null : vendorId);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Calculate total payment by summing the prices from stockDetails
  const calculateTotalPayment = (stockDetails, searchQuery) => {
    // If there's a search query (date), filter stock by that date
    if (searchQuery) {
      stockDetails = stockDetails.filter((stock) =>
        stock.invoiceDate && stock.invoiceDate.includes(searchQuery) // Match by date
      );
    }
    // Sum the price for the filtered stock details
    return stockDetails.reduce((total, stock) => total + (parseFloat(stock.price) || 0), 0).toFixed(2);
  };

  // Function to export stock details as CSV
  const exportToCSV = (stockDetails) => {
    const csvRows = [];
    const headers = ['Invoice Date', 'Stock Name', 'Quantity', 'Price'];
    csvRows.push(headers.join(','));

    stockDetails.forEach((stock) => {
      const row = [
        stock.invoiceDate || 'N/A',
        stock.ingredientName || 'N/A',
        stock.quantityAdded || '0',
        stock.price || '0.00',
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'stock_details.csv');
    link.click();
  };

  return (
    <div className={`dashboard-container${sidebarOpen ? ' sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="dashboard-content">
        <UserHeader onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />
          <h2 style={{ marginLeft: '10px', marginTop: '100px' }}>Vendor Dashboard</h2>
          <div className="action-buttons">
            <label className="add-product-button" onClick={handleAddVendor}>
              <FaPlus /> Add Vendor
            </label>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="vendor-grid">
              {vendors.map((vendor) => (
                <div key={vendor.id} className="vendor-card">
                  <div className="vendor-header">
                    <h2>{vendor.name}</h2>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(vendor.id)}
                      disabled={editingVendorId === vendor.id}
                    >
                      <FaEdit /> Edit
                    </button>
                  </div>
                  <div className="vendor-details">
                    <p>
                      <strong>Total Payment:</strong> ₹{calculateTotalPayment(vendor.stockDetails, searchQuery)}
                    </p>
                  
                    
                    <button
                      className="view-more-btn"
                      onClick={() => toggleExpanded(vendor.id)}
                    >
                      {expandedVendorId === vendor.id ? (
                        <FaCaretUp /> // Collapse icon
                      ) : (
                        <FaCaretDown /> // Expand icon
                      )}
                      {expandedVendorId === vendor.id ? ' Show Less' : ' Show More'}
                    </button>
                  </div>
                  {expandedVendorId === vendor.id && (
                    <div className="expanded-section">
                      <div className="stock-details">
                        <h3>Stock Details</h3>
                        {/* Search bar for stock details */}
                        <input
                          type="text"
                          placeholder="Search by stock date (yyyy-mm-dd)"
                          value={searchQuery}
                          onChange={handleSearchChange}
                          className="search-bar"
                        />
                        {/* Export button */}
                        <button onClick={() => exportToCSV(vendor.stockDetails)} className="export-btn">
                          <FaFileExport /> Export
                        </button>
                        <table>
                          <thead>
                            <tr>
                              <th>Invoice Date</th>
                              <th>Stock Name</th>
                              <th>Quantity</th>
                              <th>Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vendor.stockDetails.filter((stock) =>
                              stock.invoiceDate.includes(searchQuery) // Filter by search query
                            ).map((stock, index) => (
                              <tr key={index}>
                                <td>{stock.invoiceDate}</td>
                                <td>{stock.ingredientName}</td>
                                <td>{stock.quantityAdded}</td>
                                <td>{stock.price}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Comment section inside expanded (only during edit mode) */}
                      {editingVendorId === vendor.id && (
                        <div className="comment-section">
                          <h3>Add Comment</h3>
                          <div className="comment-inputs">
                            <label>Amount Paid:</label>
                            <input
                              type="number"
                              name="amountPaid"
                              value={commentData.amountPaid}
                              onChange={handleCommentChange}
                            />
                            <label>Paid By:</label>
                            <input
                              type="text"
                              name="paidBy"
                              value={commentData.paidBy}
                              onChange={handleCommentChange}
                            />
                            <label>Date:</label>
                            <input
                              type="date"
                              name="date"
                              value={commentData.date}
                              onChange={handleCommentChange}
                            />
                          </div>
                          <button className="save-btn" onClick={() => handleSave(vendor.id)}>
                            <FaSave /> Save
                          </button>
                        </div>
                      )}
                      {/* Display Comments inside expanded */}
                      <div className="comments">
                        <h3>Comments</h3>
                        {vendor.comments && vendor.comments.length > 0 ? (
                          vendor.comments.map((comment, index) => (
                            <div key={index} className="comment">
                              <p><strong>Amount Paid:</strong> ₹{comment.amountPaid}</p>
                              <p><strong>Paid By:</strong> {comment.paidBy}</p>
                              <p><strong>Date:</strong> {comment.date}</p>
                            </div>
                          ))
                        ) : (
                          <p>No comments yet</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};

export default VendorDashboard;
