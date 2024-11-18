import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './payreport.css';
import UserSidebar from './UserSidebar';
import UserHeader from './UserHeader';
import { useUser } from './Auth/UserContext';
import Papa from 'papaparse';
const PaymentHistoryReport = () => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [branchCode, setBranchCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmPopup, setConfirmPopup] = useState({ show: false, entry: null });
  const { userData } = useUser();

  useEffect(() => {
    if (userData && userData.branchCode) {
      setBranchCode(userData.branchCode);
    }
  }, [userData]);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const tablesQuery = query(
          collection(db, 'tables'),
          where('branchCode', '==', branchCode)
        );
        const tablesSnapshot = await getDocs(tablesQuery);
        const historyData = [];

        for (const tableDoc of tablesSnapshot.docs) {
          const table = tableDoc.data();
          const ordersRef = collection(doc(db, 'tables', tableDoc.id), 'orders');
          const ordersSnapshot = await getDocs(ordersRef);

          ordersSnapshot.forEach(orderDoc => {
            const orderData = orderDoc.data();
            historyData.push({
              tableNumber: table.tableNumber,
              ...orderData.payment,
              orders: orderData.orders,
              discountedTotal: orderData.payment.discountedTotal || orderData.payment.total,
              timestamp: orderData.timestamp,
              docId: orderDoc.id,
              tableId: tableDoc.id,
            });
          });
        }

        setPaymentHistory(historyData);
      } catch (error) {
        console.error("Error fetching payment history: ", error);
      }
    };

    fetchPaymentHistory();
  }, [branchCode]);

  useEffect(() => {
    let filtered = paymentHistory;

    if (fromDate && toDate) {
      filtered = filtered.filter(entry => {
        const paymentDate = new Date(entry.timestamp).toISOString().split('T')[0];
        return paymentDate >= fromDate && paymentDate <= toDate;
      });
    }

    setFilteredData(filtered);
  }, [fromDate, toDate, paymentHistory]);

  const filteredBySearch = filteredData.filter(entry => 
    entry.tableNumber.toString().includes(searchTerm) ||
    (entry.method && entry.method.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (entry.status && entry.status.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (entry.responsible && entry.responsible.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedFilteredData = filteredBySearch.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleStatusChange = entry => {
    setConfirmPopup({ show: true, entry });
  };
  const downloadCSV = () => {
    const csvData = sortedFilteredData.map(entry => ({
      'Table Number': entry.tableNumber,
      'Total Amount': entry.total ? `₹${entry.total.toFixed(2)}` : '₹0.00',
      'Discounted Total': `₹${entry.discountedTotal.toFixed(2)}`,
      'Payment Method': entry.method || 'N/A',
      'Payment Status': entry.status || 'N/A',
      'Responsible': entry.responsible || 'N/A',
      'Time': new Date(entry.timestamp).toLocaleString(),
    }));

    const csv = Papa.unparse(csvData);

    // Create a link and trigger the download
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = `payment_history_report_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const confirmStatusChange = async () => {
    const updatedStatus = confirmPopup.entry.status === 'Due' ? 'Settled' : confirmPopup.entry.status;

    try {
      const orderDocRef = doc(
        db,
        'tables',
        confirmPopup.entry.tableId,
        'orders',
        confirmPopup.entry.docId
      );

      await updateDoc(orderDocRef, {
        'payment.status': updatedStatus,
      });

      setPaymentHistory(prevHistory =>
        prevHistory.map(item =>
          item.docId === confirmPopup.entry.docId
            ? { ...item, status: updatedStatus }
            : item
        )
      );
      setConfirmPopup({ show: false, entry: null });
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  const calculateTotals = data => {
    const totals = { Cash: 0, Card: 0, UPI: 0, Due: 0 };

    data.forEach(entry => {
      const total = entry.discountedTotal || entry.total;
      if (entry.method === 'Cash') {
        totals.Cash += total;
      } else if (entry.method === 'Card') {
        totals.Card += total;
      } else if (entry.method === 'UPI') {
        totals.UPI += total;
      } else if (entry.method === 'Due') {
        totals.Due += total;
      }
    });

    return totals;
  };

  const totals = calculateTotals(sortedFilteredData);
  const handleTotalClick = orders => {
    setSelectedOrders(orders);
  };
  return (
    <div className={`report-container${sidebarOpen ? ' sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="report-content">
        <UserHeader onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />

        <h2 style={{ marginLeft: '10px', marginTop: '100px' }}>Payment History Report</h2>
       
        <div className="filter-section">
          <label htmlFor="fromDate">From Date:</label>
          <input
            type="date"
            id="fromDate"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
          <label htmlFor="toDate">To Date:</label>
          <input
            type="date"
            id="toDate"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
          <label htmlFor="searchBar">Search:</label>
          <input
            type="text"
            id="searchBar"
            placeholder="Search Here..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
           
        </div>

        <div className="totals-summary">
          <h3>Daily Totals for {fromDate && toDate ? `${fromDate} to ${toDate}` : 'All Dates'}:</h3>
          <p>Cash Total: ₹{totals.Cash.toFixed(2)}</p>
          <p>Card Total: ₹{totals.Card.toFixed(2)}</p>
          <p>UPI Total: ₹{totals.UPI.toFixed(2)}</p>
          <p>Due Total: ₹{totals.Due.toFixed(2)}</p>
        </div>
        <button className="export-button" onClick={downloadCSV}>
          Export 
        </button>
        {sortedFilteredData.length > 0 ? (
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
              {sortedFilteredData.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.tableNumber}</td>
                  <td
                      className="clickable-amount"
                      onClick={() => handleTotalClick(entry.orders)}
                    >
                      ₹{typeof entry.total === 'number' ? entry.total.toFixed(2) : parseFloat(entry.total).toFixed(2)}
                    </td>
                  <td>₹{entry.discountedTotal.toFixed(2)}</td>
                  <td>{entry.method || 'N/A'}</td>
                  <td
                    className="clickable-status"
                    onClick={() => handleStatusChange(entry)}
                  >
                    {entry.status || 'N/A'}
                  </td>
                  <td>{entry.responsible || 'N/A'}</td>
                  <td>{new Date(entry.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

        ) : (
          <p>No payment history available for the selected date range or search term.</p>
        )}

        {confirmPopup.show && (
          <div className="confirm-popup">
            <p>Are you sure you want to change the status?</p>
            <button onClick={confirmStatusChange}>Yes</button>
            <button onClick={() => setConfirmPopup({ show: false, entry: null })}>
              No
            </button>
          </div>
        )}
          {selectedOrders && (
              <div className="orders-summary">
                <h3>Associated Orders:</h3>
                <ul>
                  {selectedOrders.map((order, index) => (
                    <li key={index}>
                      {order.quantity} x {order.name} - ₹{order.price * order.quantity}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setSelectedOrders(null)}>Close</button>
              </div>
            )}
      </div>
    </div>
  );
};

export default PaymentHistoryReport;
