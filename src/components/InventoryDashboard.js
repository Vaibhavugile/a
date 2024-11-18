import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './InventoryDashboard.css'; // Importing CSS from Product Dashboard
import UserHeader from './UserHeader';
import UserSidebar from './UserSidebar';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { useUser } from '../components/Auth/UserContext';

const InventoryDashboard = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // State to track selected item
  const navigate = useNavigate();
  const { userData } = useUser();
  const [inventoryHistory, setInventoryHistory] = useState({});

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        const q = query(
          collection(db, 'Inventory'),
          where('branchCode', '==', userData.branchCode)
        );
        const querySnapshot = await getDocs(q);
        const fetchedItems = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setInventoryItems(fetchedItems);

        // Fetch inventory history for each item
        for (let item of fetchedItems) {
          const historyRef = collection(doc(db, 'Inventory', item.id), 'History');
          const historySnapshot = await getDocs(historyRef);
          const historyData = historySnapshot.docs.map(doc => doc.data());
          setInventoryHistory(prevHistory => ({
            ...prevHistory,
            [item.id]: historyData,
          }));
        }
      } catch (error) {
        console.error('Error fetching inventory data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, [userData]);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'Inventory', id));
      setInventoryItems(inventoryItems.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting inventory item:', error);
    }
  };

  const handleEdit = (id) => {
    navigate(`/editinventory/${id}`);
  };

  const handleAddInventory = () => {
    navigate('/add-ingredient');
  };

  const handleAddStock = () => {
    navigate('/add-stock');
  };

  const formatLastUpdated = (lastUpdated) => {
    if (lastUpdated && lastUpdated.toDate) {
      return lastUpdated.toDate().toLocaleString();
    }
    return lastUpdated; // or handle as needed (e.g., return a default string)
  };

  const toggleHistory = (id) => {
    setSelectedItem(selectedItem === id ? null : id); // Toggle visibility for the selected item
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="dashboard-content">
        <UserHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <h2 style={{ marginLeft: '10px', marginTop: '100px' }}>Total Inventory Items</h2>
        <div className="action-buttons">
        <label className="add-product-button" onClick={handleAddInventory}>
          <FaPlus />
              Add Inventory
            </label> 
          <br></br>
          <label className="add-product-button" onClick={handleAddStock}>
          <FaPlus />
              Add Stock
            </label> 
        </div>
        <div className="table-container">
          {loading ? (
            <p>Loading inventory...</p>
          ) : inventoryItems.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Branch Code</th>
                  <th>Category</th>
                  <th>Ingredient Name</th>
                  <th>Last Updated</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.branchCode}</td>
                    <td>{item.category}</td>
                    <td
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleHistory(item.id)} // Handle click event to toggle history
                    >
                      {item.ingredientName}
                    </td>
                    <td>{formatLastUpdated(item.lastUpdated)}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit}</td>
                    <td>
                      <div className="action-buttons">
                        <label onClick={() => handleEdit(item.id)}><FaEdit /></label>
                        <label onClick={() => handleDelete(item.id)}><FaTrash /></label>
                      </div>
                    </td>
                    {/* Display History only when the item is selected */}
                    {selectedItem === item.id && (
                      <td colSpan="7">
                        {inventoryHistory[item.id] && (
                          <ul>
                            {inventoryHistory[item.id].map((history, index) => (
                              <li key={index}>
                                <strong>Updated on:</strong> {new Date(history.updatedAt.seconds * 1000).toLocaleString()}<br />
                                <strong>Quantity Added:</strong> {history.quantityAdded}<br />
                                <strong>Price:</strong> {history.price}<br />
                                <strong>Updated Quantity:</strong> {history.updatedQuantity}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No inventory items found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;
