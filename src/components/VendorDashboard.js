import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './InventoryDashboard.css';
import UserHeader from './UserHeader';
import UserSidebar from './UserSidebar';
import { useUser } from './Auth/UserContext';
import { FaPlus, FaEdit } from 'react-icons/fa';

const VendorPaymentDashboard = () => {
  const [vendorPayments, setVendorPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedVendorId, setExpandedVendorId] = useState(null);
  const [expandedInvoiceDate, setExpandedInvoiceDate] = useState({});
  const { userData } = useUser();
  const navigate = useNavigate();

  // Fetch vendor payment data
  useEffect(() => {
    const fetchVendorPayments = async () => {
      if (userData && userData.branchCode) {
        const q = query(collection(db, 'Vendors'), where('branchCode', '==', userData.branchCode));
        const vendorSnapshot = await getDocs(q);

        const paymentsData = await Promise.all(
          vendorSnapshot.docs.map(async (vendorDoc) => {
            const vendorData = vendorDoc.data();
            const stockRef = collection(vendorDoc.ref, 'Stock');
            const stockSnapshot = await getDocs(stockRef);

            const stockGroupedByDate = {};
            const totalPaymentPerDate = {};

            stockSnapshot.docs.forEach((stockDoc) => {
              const stockData = stockDoc.data();
              const invoiceDate = stockData.invoiceDate || 'N/A';
              const price = stockData.price || 0;

              // Group stock by invoice date
              if (!stockGroupedByDate[invoiceDate]) {
                stockGroupedByDate[invoiceDate] = [];
                totalPaymentPerDate[invoiceDate] = 0; // Initialize total for this date
              }
              stockGroupedByDate[invoiceDate].push({
                stockName: stockData.ingredientName || 'N/A',
                price,
                stockQuantity: stockData.quantityAdded || 'N/A',
              });

              // Sum the prices for the total amount per date
              totalPaymentPerDate[invoiceDate] += price; 
            });

            return {
              vendorId: vendorDoc.id,
              vendorName: vendorData.name,
              totalPayment: Object.values(totalPaymentPerDate).reduce((a, b) => a + b, 0), // Sum of total payments
              stockGroupedByDate,
              totalPaymentPerDate,
              amountPaid: vendorData.amountPaid || 0, // Amount paid from vendor data
              remainingAmount: vendorData.remainingAmount || 0, // Remaining amount from vendor data
            };
          })
        );

        setVendorPayments(paymentsData);
      }
      setLoading(false);
    };

    fetchVendorPayments();
  }, [userData]);

  const handleEdit = (id) => {
    navigate(`/editvendor/${id}`);
  };

  const handleAddVendor = () => {
    navigate('/add-vendor');
  };

  const toggleVendorDetails = (vendorId) => {
    setExpandedVendorId(expandedVendorId === vendorId ? null : vendorId);
  };

  const toggleInvoiceDetails = (vendorId, date) => {
    setExpandedInvoiceDate((prevState) => ({
      ...prevState,
      [vendorId]: prevState[vendorId] === date ? null : date,
    }));
  };

  const handleSaveAmounts = async (vendorId) => {
    const vendorDocRef = doc(db, 'Vendors', vendorId);
    const vendor = vendorPayments.find(v => v.vendorId === vendorId);
    
    await updateDoc(vendorDocRef, {
      amountPaid: vendor.amountPaid,
      remainingAmount: vendor.remainingAmount,
    });

    alert('Amounts saved successfully!');
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="dashboard-content">
        <UserHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <h2 style={{ marginLeft: '10px', marginTop: '100px' }}>Vendor Payment Dashboard</h2>

        <div className="action-buttons">
          <label className="add-product-button" onClick={handleAddVendor}>
            <FaPlus /> Add Vendor
          </label>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="loading">Loading vendor payments...</div>
          ) : vendorPayments.length > 0 ? (
            <table className="vendor-table">
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Total Payment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {vendorPayments.map((vendor) => (
                  <React.Fragment key={vendor.vendorId}>
                    <tr onClick={() => toggleVendorDetails(vendor.vendorId)}>
                      <td>{vendor.vendorName}</td>
                      <td>₹{vendor.totalPayment.toFixed(2)}</td>
                      <td>
                        <button
                          className="edit-btn"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleEdit(vendor.vendorId); 
                          }}
                          title="Edit Vendor"
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                    {expandedVendorId === vendor.vendorId && (
                      <tr className="expanded-row">
                        <td colSpan="5">
                          <table className="details-table">
                            <thead>
                              <tr>
                                <th>Invoice Date</th>
                                <th>Total Amount</th>
                                <th>Stock Details</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(vendor.stockGroupedByDate).map(([invoiceDate, stockItems]) => (
                                <React.Fragment key={invoiceDate}>
                                  <tr onClick={() => toggleInvoiceDetails(vendor.vendorId, invoiceDate)}>
                                    <td>{invoiceDate}</td>
                                    <td>₹{vendor.totalPaymentPerDate[invoiceDate]?.toFixed(2) || '0.00'}</td>
                                    <td>{expandedInvoiceDate[vendor.vendorId] === invoiceDate ? 'Hide Details' : 'Show Details'}</td>
                                  </tr>
                                  {expandedInvoiceDate[vendor.vendorId] === invoiceDate && (
                                    <tr className="expanded-stock-row">
                                      <td colSpan="3">
                                        <table className="stock-details-table">
                                          <thead>
                                            <tr>
                                              <th>Stock Name</th>
                                              <th>Stock Quantity</th>
                                              <th>Price</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {stockItems.map((item, index) => (
                                              <tr key={index}>
                                                <td>{item.stockName}</td>
                                                <td>{item.stockQuantity}</td>
                                                <td>₹{item.price.toFixed(2)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                          <div className="amount-details">
                            <label>
                              Amount Paid:
                              <input
                                type="number"
                                value={vendor.amountPaid}
                                onChange={(e) => {
                                  const updatedPayments = vendorPayments.map((v) =>
                                    v.vendorId === vendor.vendorId ? { ...v, amountPaid: Number(e.target.value) } : v
                                  );
                                  setVendorPayments(updatedPayments);
                                }}
                              />
                            </label>
                            <label>
                              Remaining Amount:
                              <input
                                type="number"
                                value={vendor.remainingAmount}
                                onChange={(e) => {
                                  const updatedPayments = vendorPayments.map((v) =>
                                    v.vendorId === vendor.vendorId ? { ...v, remainingAmount: Number(e.target.value) } : v
                                  );
                                  setVendorPayments(updatedPayments);
                                }}
                              />
                            </label>
                            <button
                              className="save-btn"
                              onClick={() => handleSaveAmounts(vendor.vendorId)}
                            >
                              Save
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-data">No vendor payments available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorPaymentDashboard;
