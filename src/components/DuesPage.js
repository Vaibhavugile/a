import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './payreport.css';
import UserSidebar from './UserSidebar';
import UserHeader from './UserHeader';
import { useUser } from './Auth/UserContext';

const DuesPage = () => {
  const [duesData, setDuesData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branchCode, setBranchCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmPopup, setConfirmPopup] = useState({ show: false, entry: null, newMethod: 'Cash' });
  const { userData } = useUser();

  useEffect(() => {
    if (userData && userData.branchCode) {
      setBranchCode(userData.branchCode);
    }
  }, [userData]);

  useEffect(() => {
    const fetchDuesData = async () => {
      try {
        const tablesQuery = query(
          collection(db, 'tables'),
          where('branchCode', '==', branchCode)
        );
        const tablesSnapshot = await getDocs(tablesQuery);
        const duesList = [];

        for (const tableDoc of tablesSnapshot.docs) {
          const table = tableDoc.data();
          const ordersRef = collection(doc(db, 'tables', tableDoc.id), 'orders');
          const ordersSnapshot = await getDocs(ordersRef);

          ordersSnapshot.forEach(orderDoc => {
            const orderData = orderDoc.data();
            if (orderData.payment.status === 'Due') {
              duesList.push({
                tableNumber: table.tableNumber,
                ...orderData.payment,
                discountedTotal: orderData.payment.discountedTotal || orderData.payment.total,
                timestamp: orderData.timestamp,
                docId: orderDoc.id,
                tableId: tableDoc.id,
              });
            }
          });
        }

        setDuesData(duesList);
      } catch (error) {
        console.error('Error fetching dues data: ', error);
      }
    };

    fetchDuesData();
  }, [branchCode]);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleStatusChange = entry => {
    setConfirmPopup({ show: true, entry, newMethod: entry.method || 'Cash' });
  };

  const confirmStatusChange = async () => {
    try {
      const updatedStatus = 'Settled';
      const { newMethod, entry } = confirmPopup;

      const orderDocRef = doc(
        db,
        'tables',
        entry.tableId,
        'orders',
        entry.docId
      );

      await updateDoc(orderDocRef, {
        'payment.status': updatedStatus,
        'payment.method': newMethod,
      });

      setDuesData(prevDues =>
        prevDues.map(item =>
          item.docId === entry.docId
            ? { ...item, status: updatedStatus, method: newMethod }
            : item
        )
      );

      setConfirmPopup({ show: false, entry: null, newMethod: 'Cash' });
    } catch (error) {
      console.error('Error updating status and method: ', error);
    }
  };

  const filteredDues = duesData.filter(entry =>
    entry.tableNumber.toString().includes(searchTerm) ||
    (entry.method && entry.method.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (entry.responsible && entry.responsible.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={`dues-container${sidebarOpen ? ' sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="dues-content">
        <UserHeader onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />

        <h2 style={{ marginLeft: '10px', marginTop: '100px' }}>Dues</h2>

        <div className="filter-section">
          <label htmlFor="searchBar">Search:</label>
          <input
            type="text"
            id="searchBar"
            placeholder="Search Here..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredDues.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Table Number</th>
                <th>Total Amount</th>
                <th>Discounted Total</th>
                <th>Payment Method</th>
                <th>Payment Status</th>
                <th>Responsible</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredDues.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.tableNumber}</td>
                  <td>₹{entry.total.toFixed(2)}</td>
                  <td>₹{entry.discountedTotal.toFixed(2)}</td>
                  <td>{entry.method || 'N/A'}</td>
                  <td
                    className="clickable-status"
                    onClick={() => handleStatusChange(entry)}
                  >
                    {entry.status}
                  </td>
                  <td>{entry.responsible || 'N/A'}</td>
                  <td>{new Date(entry.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No dues available.</p>
        )}

        {confirmPopup.show && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h3>Update Payment</h3>
              <p>
                Are you sure you want to mark this payment as <strong>Settled</strong>?
              </p>
              <label htmlFor="payment-method">Payment Method:</label>
              <select
                id="payment-method"
                value={confirmPopup.newMethod}
                onChange={e =>
                  setConfirmPopup({ ...confirmPopup, newMethod: e.target.value })
                }
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Other">Other</option>
              </select>
              <div className="popup-buttons">
                <button className="confirm-button" onClick={confirmStatusChange}>
                  Confirm
                </button>
                <button
                  className="cancel-button"
                  onClick={() => setConfirmPopup({ show: false, entry: null, newMethod: 'Cash' })}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DuesPage;
