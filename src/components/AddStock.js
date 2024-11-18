import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from './Auth/UserContext';
import "./AddStock.css"
import { useNavigate, useParams } from 'react-router-dom';

const StockManagementForm = () => {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState('');
  const [price, setPrice] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState(0);
  const [stockEntries, setStockEntries] = useState([]); // New state to store multiple stock entries
  const { userData } = useUser();
  const navigate = useNavigate();

  // Fetch vendors for the dropdown
  useEffect(() => {
    const fetchVendors = async () => {
      if (userData && userData.branchCode) {
        const q = query(
          collection(db, 'Vendors'),
          where('branchCode', '==', userData.branchCode)
        );
        const snapshot = await getDocs(q);
        setVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    };

    fetchVendors();
  }, [userData]);

  // Fetch categories based on selected vendor
  useEffect(() => {
    if (selectedVendor) {
      const vendor = vendors.find(vendor => vendor.id === selectedVendor);
      if (vendor) {
        setCategories(vendor.categories || []);
      }
    }
  }, [selectedVendor, vendors]);

  // Fetch items based on selected category and current quantity
  useEffect(() => {
    const fetchItems = async () => {
      if (selectedCategory && userData.branchCode) {
        const q = query(
          collection(db, 'Inventory'),
          where('branchCode', '==', userData.branchCode),
          where('category', '==', selectedCategory)
        );
        const snapshot = await getDocs(q);
        const itemsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItems(itemsList);
      }
    };

    fetchItems();
  }, [selectedCategory, userData.branchCode]);

  // Set current quantity when an item is selected
  useEffect(() => {
    if (selectedItem) {
      const item = items.find(item => item.id === selectedItem);
      if (item) {
        setCurrentQuantity(item.quantity);
      }
    }
  }, [selectedItem, items]);

  // Add a stock entry to the list
  const handleAddStockEntry = () => {
    const newQuantity = parseInt(currentQuantity) + parseInt(quantityToAdd);
    const newStockEntry = {
      selectedVendor,
      invoiceDate,
      selectedCategory,
      selectedItem,
      quantityToAdd,
      price,
      currentQuantity:newQuantity,
    };
    setStockEntries([...stockEntries, newStockEntry]);
    
    // Reset input fields after adding an entry
    setSelectedCategory('');
    setSelectedItem('');
    setQuantityToAdd('');
    setPrice('');
    setCurrentQuantity(newQuantity);
  };

  // Handle form submission to save multiple stock entries
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // Loop through each stock entry and update the inventory and vendor's stock subcollection
      for (let entry of stockEntries) {
        const itemRef = doc(db, 'Inventory', entry.selectedItem);
        const vendorRef = doc(db, 'Vendors', entry.selectedVendor);
        
        const newQuantity = entry.currentQuantity; // Use the updated current quantity from stock entries
        const historyRef = collection(itemRef, 'History'); // Reference to the History subcollection
  
        // Save the transaction in the vendor's Stock subcollection
        await addDoc(collection(vendorRef, 'Stock'), {
          invoiceDate: entry.invoiceDate,
          category: entry.selectedCategory,
          ingredientName: items.find(item => item.id === entry.selectedItem).ingredientName,
          quantityAdded: parseInt(entry.quantityToAdd),
          price: parseFloat(entry.price),
          branchCode: userData.branchCode,
          updatedQuantity: newQuantity,
        });
  
        // Update inventory with the new quantity and last updated date
        await updateDoc(itemRef, {
          quantity: newQuantity,
          lastUpdated: entry.invoiceDate,
        });
  
        // Add an entry to the inventory history
        await addDoc(historyRef, {
          invoiceDate: entry.invoiceDate,
          quantityAdded: entry.quantityToAdd,
          
          price: entry.price,
          updatedQuantity: newQuantity,
          updatedAt: new Date(),
        });
      }
  
      alert('Stocks updated successfully!');
      navigate('/inventorydashboard'); // Redirect to the inventory dashboard

      setStockEntries([]); // Clear the list of entries after submission
    } catch (error) {
      console.error('Error updating stock: ', error);
    }
  };
  

  return (
    <div className="stock-management-container">
    <h2>Stock Management</h2>
    <form onSubmit={handleSubmit}>
      {/* Vendor selection */}
      <label>Vendor:</label>
      <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)} required>
        <option value="">Select Vendor</option>
        {vendors.map((vendor) => (
          <option key={vendor.id} value={vendor.id}>
            {vendor.name}
          </option>
        ))}
      </select>

      {/* Invoice date */}
      <label>Invoice Date:</label>
      <input
        type="date"
        value={invoiceDate}
        onChange={(e) => setInvoiceDate(e.target.value)}
        required
      />

      {/* Category selection */}
      <label>Category:</label>
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        disabled={!selectedVendor}
      >
        <option value="">Select Category</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      {/* Item selection */}
      <label>Item:</label>
      <select
        value={selectedItem}
        onChange={(e) => setSelectedItem(e.target.value)}
        disabled={!selectedCategory}
      >
        <option value="">Select Item</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.ingredientName}
          </option>
        ))}
      </select>

      {/* Current quantity display */}
      <label>Current Quantity:</label>
      <input
        type="number"
        value={currentQuantity}
        onChange={(e) => setCurrentQuantity(e.target.value)} // Allow editing of current quantity
      />

      {/* Quantity to add */}
      <label>Quantity to Add:</label>
      <input
        type="number"
        value={quantityToAdd}
        onChange={(e) => setQuantityToAdd(e.target.value)}
      />

      {/* Price */}
      <label>Price:</label>
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <button type="button" onClick={handleAddStockEntry}>Add Stock Entry</button>

      {/* Display added stock entries */}
      <h3>Stock Entries to Submit:</h3>
      <ul>
        {stockEntries.map((entry, index) => (
          <li key={index}>
            <span>Vendor: {vendors.find(v => v.id === entry.selectedVendor)?.name}</span>
            <span>Category: {entry.selectedCategory}</span>
            <span>Item: {items.find(i => i.id === entry.selectedItem)?.ingredientName}</span>
            <span>Quantity to Add: {entry.quantityToAdd}</span>
            <span>Price: {entry.price}</span>
          </li>
        ))}
      </ul>

      <button type="submit">Submit All Stock Entries</button>
    </form>
  </div>
);
        
};

export default StockManagementForm;
