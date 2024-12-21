import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Firebase initialization
import { collection, addDoc, where, getDocs, query } from 'firebase/firestore';
import { useUser } from '../components/Auth/UserContext';
import { useNavigate } from 'react-router-dom';
import "./AddInventory.css";

function AddIngredient() {
  const [ingredientName, setIngredientName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('grams');
  const [branchCode, setBranchCode] = useState('');
  const { userData } = useUser();
  const [suggestedCategories, setSuggestedCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (userData && userData.branchCode) {
      setBranchCode(userData.branchCode);
    }
  }, [userData]);

  const fetchCategories = async (input) => {
    if (!input) {
      setSuggestedCategories([]);
      return;
    }

    const q = query(
      collection(db, 'Inventory'),
      where('branchCode', '==', branchCode),
      where('category', '>=', input),
      where('category', '<=', input + '\uf8ff')
    );

    const querySnapshot = await getDocs(q);
    const categories = querySnapshot.docs.map((doc) => doc.data().category);
    setSuggestedCategories([...new Set(categories)]);
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setCategory(value);
    fetchCategories(value);
  };

  const handleSelectCategory = (selectedCategory) => {
    setCategory(selectedCategory);
    setSuggestedCategories([]);
  };

  const convertQuantity = () => {
    const quantityValue = parseFloat(quantity);
    if (isNaN(quantityValue)) return 0;

    switch (unit) {
      case 'grams':
        return quantityValue;
      case 'kilograms':
        return quantityValue * 1000;
      case 'liters':
        return quantityValue * 1000;
      case 'milliliters':
        return quantityValue;
      case 'pieces':
      case 'boxes':
        return quantityValue;
      default:
        return quantityValue;
    }
  };

  const handleAddIngredient = async () => {
    const standardizedQuantity = convertQuantity();
    const storedUnit =
      unit === 'kilograms' ? 'grams' : unit === 'liters' ? 'milliliters' : unit;

    try {
      const docRef = await addDoc(collection(db, 'Inventory'), {
        ingredientName,
        category,
        quantity: standardizedQuantity,
        unit: storedUnit,
        branchCode,
      });

      const historyRef = collection(docRef, 'History');
      await addDoc(historyRef, {
        quantityAdded: standardizedQuantity,
        updatedQuantity: standardizedQuantity,
        action: 'Add Inventory',
        branchCode,
        updatedAt: new Date(),
      });

      alert('Ingredient added successfully!');
      navigate('/inventorydashboard');
      setIngredientName('');
      setCategory('');
      setQuantity('');
      setUnit('grams');
    } catch (error) {
      console.error("Error adding ingredient: ", error);
    }
  };

  return (
    <div className="add-ingredient-container">
      <h1 className="add-ingredient-title">Add New Ingredient</h1>
      <input
        type="text"
        className="add-ingredient-input"
        placeholder="Ingredient Category"
        value={category}
        onChange={handleCategoryChange}
      />
      {suggestedCategories.length > 0 && (
        <ul className="suggestions-list">
          {suggestedCategories.map((cat, index) => (
            <li
              key={index}
              className="suggestion-item"
              onClick={() => handleSelectCategory(cat)}
            >
              {cat}
            </li>
          ))}
        </ul>
      )}
      <input
        type="text"
        className="add-ingredient-input"
        placeholder="Ingredient Name"
        value={ingredientName}
        onChange={(e) => setIngredientName(e.target.value)}
      />
      <input
        type="number"
        className="add-ingredient-input"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />
      <select
        value={unit}
        className="add-ingredient-select"
        onChange={(e) => setUnit(e.target.value)}
      >
        <option value="grams">Grams</option>
        <option value="kilograms">Kilograms</option>
        <option value="liters">Liters</option>
        <option value="milliliters">Milliliters</option>
        <option value="pieces">Pieces</option>
        <option value="boxes">Boxes</option>
      </select>
      <button className="add-ingredient-button" onClick={handleAddIngredient}>
        Add Ingredient
      </button>
    </div>
  );
}

export default AddIngredient;
