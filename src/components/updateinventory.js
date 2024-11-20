import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './EditInventory.css'; // You can add styles here

const EditInventory = () => {
  const [inventoryItem, setInventoryItem] = useState(null);
  const [ingredientName, setIngredientName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [loading, setLoading] = useState(true);
  const { id } = useParams(); // Get the inventory item ID from the URL
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInventoryItem = async () => {
      try {
        const docRef = doc(db, 'Inventory', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setInventoryItem(docSnap.data());
          setIngredientName(docSnap.data().ingredientName);
          setCategory(docSnap.data().category);
          setQuantity(docSnap.data().quantity);
          setUnit(docSnap.data().unit);
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching inventory item:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryItem();
  }, [id]);

  const handleSave = async () => {
    try {
      const docRef = doc(db, 'Inventory', id);
      
      // First, get the current inventory details to store in history
      const currentInventoryData = { 
        ingredientName, 
        category, 
        quantity: parseInt(quantity), 
        unit 
      };

      // Add the current inventory data to history subcollection
      const historyRef = collection(docRef, 'History');
      await addDoc(historyRef, {
        ...currentInventoryData,
        
        updatedAt: new Date(),
        action: 'Update' // You can add more fields like action type (e.g., Update, Add, Delete)
      });

      // Now, update the inventory with the new values
      await updateDoc(docRef, {
        ingredientName,
        category,
        quantity: parseInt(quantity),
        unit,
        lastUpdated: new Date(), // Optionally, include the date when the item was last updated
      });

      navigate('/inventorydashboard'); // Redirect to the inventory dashboard after save
    } catch (error) {
      console.error('Error updating inventory item:', error);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="edit-inventory-container">
      <h2>Edit Inventory Item</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-group">
          <label>Ingredient Name</label>
          <input
            type="text"
            value={ingredientName}
            onChange={(e) => setIngredientName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Unit</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            required
          />
        </div>
        <button onClick={handleSave} className="save-btn">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditInventory;
