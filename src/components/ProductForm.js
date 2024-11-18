import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import UserSidebar from './UserSidebar';
import UserHeader from './UserHeader';
import { useUser } from './Auth/UserContext';
import './ProductForm.css';

const ProductForm = () => {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [ingredients, setIngredients] = useState([{ category: '', ingredientName: '', quantityUsed: '' }]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branchCode, setBranchCode] = useState('');
  const { userData } = useUser();
  
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    if (userData && userData.branchCode) {
      setBranchCode(userData.branchCode);
    }
  }, [userData]);

  useEffect(() => {
    const fetchIngredients = async () => {
      const q = query(
        collection(db, 'Inventory'),
        where('branchCode', '==', userData.branchCode)
      );
      const snapshot = await getDocs(q);
      const ingredientsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllIngredients(ingredientsList);
    };
    const fetchSubcategories = async () => {
      const q = query(collection(db, 'products'), where('branchCode', '==', userData.branchCode));
      const snapshot = await getDocs(q);
      const subcategoriesList = [...new Set(snapshot.docs.map(doc => doc.data().subcategory))];
      setAllSubcategories(subcategoriesList);
    };
    fetchSubcategories();

    fetchIngredients();
  }, [userData.branchCode]);

  const handleAddIngredientField = () => {
    setIngredients([...ingredients, { category: '', ingredientName: '', quantityUsed: '' }]);
  };

  const handleInputChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const handleSubcategoryChange = (e) => {
    const value = e.target.value;
    setSubcategory(value);
    
    const filtered = allSubcategories.filter((sub) =>
      sub.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSubcategories(filtered);
  };

  const handleSubcategorySelect = (subcategory) => {
    setSubcategory(subcategory);
    setFilteredSubcategories([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "products"), {
        name: productName,
        branchCode,
        price: parseFloat(price),
        subcategory,
        ingredients: ingredients.filter(ing => ing.ingredientName && ing.quantityUsed)
      });
      alert('Product added successfully!');
      setProductName('');
      setPrice('');
      setSubcategory('');
      setIngredients([{ category: '', ingredientName: '', quantityUsed: '' }]);
    } catch (error) {
      console.error("Error adding product: ", error);
    }
  };

  return (
    <div className={`product-form-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="product-form-content">
        <UserHeader onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />

        <h2 className="product-form-title" style={{ marginLeft: '10px', marginTop: '100px' }}>Add New Product</h2>
        <form onSubmit={handleSubmit} className="product-form">
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Product Name"
            required
            className="product-form-input"
          />
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            required
            className="product-form-input"
          />
           <div className="subcategory-autocomplete">
            <input
              type="text"
              value={subcategory}
              onChange={handleSubcategoryChange}
              placeholder="Subcategory"
              required
              className="product-form-input"
            />
            {filteredSubcategories.length > 0 && (
              <ul className="subcategory-suggestions">
                {filteredSubcategories.map((sub, index) => (
                  <li key={index} onClick={() => handleSubcategorySelect(sub)}>
                    {sub}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <h3 className="ingredients-title">Ingredients</h3>
          {ingredients.map((ingredient, index) => (
            <div key={index} className="ingredient-field">
              <select
                value={ingredient.category}
                onChange={(e) => handleInputChange(index, 'category', e.target.value)}
                className="ingredient-select"
              >
                <option value="">Select Category</option>
                {[...new Set(allIngredients.map(ing => ing.category))].map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={ingredient.ingredientName}
                onChange={(e) => handleInputChange(index, 'ingredientName', e.target.value)}
                className="ingredient-select"
              >
                <option value="">Select Ingredient</option>
                {allIngredients
                  .filter(ing => ing.category === ingredient.category)
                  .map(ing => (
                    <option key={ing.id} value={ing.ingredientName}>
                      {ing.ingredientName} ({ing.quantity} {ing.unit})
                    </option>
                  ))}
              </select>
              <input
                type="number"
                placeholder="Quantity Used"
                value={ingredient.quantityUsed}
                onChange={(e) => handleInputChange(index, 'quantityUsed', e.target.value)}
                className="ingredient-quantity-input"
              />
            </div>
          ))}
          <button type="button" onClick={handleAddIngredientField} className="add-ingredient-button">Add More Ingredients</button>
          <button type="submit" className="submit-product-button">Add Product</button>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
