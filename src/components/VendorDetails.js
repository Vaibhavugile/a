import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import UserHeader from './UserHeader';
import UserSidebar from './UserSidebar';

const VendorDetails = () => {
  const { vendorId } = useParams(); // Get vendor ID from the route
  const [vendor, setVendor] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVendorDetails = async () => {
      try {
        const vendorDocRef = doc(db, 'Vendors', vendorId);
        const vendorDoc = await getDoc(vendorDocRef);

        if (vendorDoc.exists()) {
          const vendorData = vendorDoc.data();

          // Fetch stock details
          const stockRef = collection(vendorDocRef, 'Stock');
          const stockSnapshot = await getDocs(stockRef);
          const stockData = stockSnapshot.docs.map((stockDoc) => ({
            id: stockDoc.id,
            ...stockDoc.data(),
          }));

          setVendor({ id: vendorId, ...vendorData });
          setStocks(stockData);
        } else {
          alert('Vendor not found');
          navigate('/vendor-payment-dashboard');
        }
      } catch (error) {
        console.error('Error fetching vendor details:', error);
      }
    };

    fetchVendorDetails();
  }, [vendorId, navigate]);

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="dashboard-content">
        <UserHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <h2 style={{ marginLeft: '10px', marginTop: '100px' }}>Vendor Details</h2>

        {vendor ? (
          <div className="vendor-details">
            <h3>Vendor Information</h3>
            <p><strong>Name:</strong> {vendor.name}</p>
            <p><strong>Total Payment:</strong> ₹{vendor.totalPayment || 0}</p>
            <p><strong>Amount Paid:</strong> ₹{vendor.amountPaid || 0}</p>
            <p><strong>Remaining Amount:</strong> ₹{vendor.remainingAmount || 0}</p>

            <h3>Stock Details</h3>
            {stocks.length > 0 ? (
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Stock Name</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Invoice Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock) => (
                    <tr key={stock.id}>
                      <td>{stock.ingredientName || 'N/A'}</td>
                      <td>{stock.quantityAdded || 'N/A'}</td>
                      <td>₹{stock.price?.toFixed(2) || '0.00'}</td>
                      <td>{stock.invoiceDate || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No stock details available.</p>
            )}

            <button className="back-btn" onClick={() => navigate('/vendor-payment-dashboard')}>
              Back to Dashboard
            </button>
          </div>
        ) : (
          <p>Loading vendor details...</p>
        )}
      </div>
    </div>
  );
};

export default VendorDetails;
