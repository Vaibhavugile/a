import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import './OrederReport.css';
import UserSidebar from './UserSidebar';
import UserHeader from './UserHeader';
import { useUser } from './Auth/UserContext';
import Papa from 'papaparse'; // Import PapaParse

const OrdersReport = () => {
  const [tables, setTables] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branchCode, setBranchCode] = useState('');
  const [totalReport, setTotalReport] = useState({ totalOrders: 0, grandTotal: 0 });
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [topItems, setTopItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { userData } = useUser();

  useEffect(() => {
    if (userData && userData.branchCode) {
      setBranchCode(userData.branchCode);
    }
  }, [userData]);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const q = query(collection(db, 'tables'), where('branchCode', '==', branchCode));
        const querySnapshot = await getDocs(q);
        const tableData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        calculateReportData(tableData);
        setTables(tableData);
      } catch (error) {
        console.error("Error fetching tables: ", error);
      }
    };

    fetchTables();
  }, [branchCode]);

  const calculateReportData = (tableData) => {
    let totalOrders = 0;
    let grandTotal = 0;
    const itemCounts = {};

    tableData.forEach(table => {
      if (Array.isArray(table.orders)) {
        table.orders.forEach(order => {
          totalOrders += 1;
          const price = parseFloat(order.price) || 0;
          grandTotal += order.quantity * price;

          if (order.name in itemCounts) {
            itemCounts[order.name] += order.quantity;
          } else {
            itemCounts[order.name] = order.quantity;
          }
        });
      }
      if (Array.isArray(table.orderHistory)) {
        table.orderHistory.forEach(historyEntry => {
          historyEntry.orders.forEach(order => {
            totalOrders += 1;
            const price = parseFloat(order.price) || 0;
            grandTotal += order.quantity * price;

            if (order.name in itemCounts) {
              itemCounts[order.name] += order.quantity;
            } else {
              itemCounts[order.name] = order.quantity;
            }
          });
        });
      }
    });

    const topItemsArray = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    setTopItems(topItemsArray);
    setTotalReport({ totalOrders, grandTotal });
  };

  const handleSidebarToggle = () => setSidebarOpen(!sidebarOpen);
  const handleFromDateChange = (e) => setFromDate(e.target.value);
  const handleToDateChange = (e) => setToDate(e.target.value);
  const handleSearchChange = (e) => setSearchQuery(e.target.value.toLowerCase());

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A'; // Handle case where timestamp is missing
  
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', { 
      weekday: 'short', // e.g., 'Mon'
      year: 'numeric', 
      month: 'short', // e.g., 'Nov'
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  const handleExport = () => {
    try {
      // Create a CSV data structure
      const csvData = [];
      
      // Adding headers to CSV
      csvData.push(['Table Number', 'Order Date', 'Quantity', 'Item Name', 'Price', 'Total']);
  
      // Adding table rows
      tables.forEach(table => {
        // Current Orders
        if (table.orders) {
          table.orders.forEach(order => {
            csvData.push([
              table.tableNumber,
              '-', // No order date for current orders
              order.quantity,
              order.name,
              order.price,
              (order.quantity * parseFloat(order.price)).toFixed(2)
            ]);
          });
        }
  
        // Order History
        if (table.orderHistory) {
          table.orderHistory.forEach(historyEntry => {
            historyEntry.orders.forEach(order => {
              csvData.push([
                table.tableNumber,
                formatTimestamp(historyEntry.payment?.timestamp),
                order.quantity,
                order.name,
                order.price,
                (order.quantity * parseFloat(order.price)).toFixed(2)
              ]);
            });
          });
        }
      });
  
      // Check if there is any data to export
      if (csvData.length === 1) {
        alert("No data to export!");
        return;
      }
  
      // Use PapaParse to generate the CSV
      const csv = Papa.unparse(csvData);
  
      // Create a Blob object and trigger the download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'orders_report.csv';
      document.body.appendChild(link); // Append the link to the DOM
      link.click(); // Simulate a click on the link to start download
      document.body.removeChild(link); // Clean up the DOM
    } catch (error) {
      console.error("Error exporting data to CSV:", error);
    }
  };
  

  return (
    <div className={`report-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="report-content">
        <UserHeader onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />

        <h2 style={{ marginLeft: '10px', marginTop: '100px' }}>Detailed Orders Report </h2>

        <div className="report-summary">
          <h3>Summary Statistics</h3>
          <p><strong>Total Orders:</strong> {totalReport.totalOrders}</p>
          <p><strong>Grand Total Revenue:</strong> ₹{totalReport.grandTotal.toFixed(2)}</p>
        </div>

        <div className="date-filter">
          <label htmlFor="from-date">From Date:</label>
          <input 
            type="date" 
            id="from-date" 
            value={fromDate} 
            onChange={handleFromDateChange} 
          />
        </div>

        <div className="date-filter">
          <label htmlFor="to-date">To Date:</label>
          <input 
            type="date" 
            id="to-date" 
            value={toDate} 
            onChange={handleToDateChange} 
          />
        </div>

        <div className="search-filter">
          <label htmlFor="product-search">Search by Product Name:</label>
          <input 
            type="text" 
            id="product-search" 
            value={searchQuery} 
            onChange={handleSearchChange} 
            placeholder="Enter product name..." 
          />
        </div>

        <div className="top-items">
          <h3>Top 5 Most Ordered Items</h3>
          <ul>
            {topItems.map(([item, count], index) => (
              <li key={index}>
                {item}: {count} orders
              </li>
            ))}
          </ul>
        </div>
        <button className="export-btn" onClick={handleExport}>Export</button>

        {/* Consolidated Table Data */}
        {tables.length > 0 ? (
          <table className="consolidated-table">
            <thead>
              <tr>
                <th>Table Number</th>
                <th>Order Date</th>
                <th>Quantity</th>
                <th>Item Name</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
  {tables.map(table => (
    <>
      {/* Current Orders */}
      {table.orders &&
        table.orders
          .filter(order => order.name.toLowerCase().includes(searchQuery))
          .map((order, index) => (
            <tr key={`${table.id}-order-${index}`}>
              <td>{table.tableNumber}</td>
              <td>-</td>
              <td>{order.quantity}</td>
              <td>{order.name}</td>
              <td>₹{parseFloat(order.price).toFixed(2)}</td>
              <td>₹{(order.quantity * parseFloat(order.price)).toFixed(2)}</td>
            </tr>
          ))}

      {/* Order History */}
      {table.orderHistory &&
        table.orderHistory
          .filter(historyEntry => {
            const timestamp = historyEntry.payment?.timestamp || '';
            return (
              (!fromDate || timestamp >= fromDate) &&
              (!toDate || timestamp <= toDate)
            );
          })
          .map((historyEntry, index) => (
            historyEntry.orders &&
            historyEntry.orders
              .filter(order => order.name.toLowerCase().includes(searchQuery))
              .map((order, i) => (
                <tr key={`${table.id}-history-${index}-${i}`}>
                  <td>{table.tableNumber}</td>
                  <td>{formatTimestamp(historyEntry.payment?.timestamp)}</td>
                  <td>{order.quantity}</td>
                  <td>{order.name}</td>
                  <td>₹{parseFloat(order.price).toFixed(2)}</td>
                  <td>₹{(order.quantity * parseFloat(order.price)).toFixed(2)}</td>
                </tr>
              ))
          ))}
    </>
  ))}
</tbody>
          </table>
        ) : (
          <p>Loading tables...</p>
        )}
      </div>
    </div>
  );
};

export default OrdersReport;
