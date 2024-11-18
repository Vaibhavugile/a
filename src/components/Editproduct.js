import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import UserSidebar from './UserSidebar';
import UserHeader from './UserHeader';
import { useUser } from './Auth/UserContext';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductForm.css';

const EditProduct = () => {
  const { id } = useParams(); // Get product ID from URL
  const navigate = useNavigate();
  const { userData } = useUser();
  
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [ingredients, setIngredients] = useState([{ category: '', ingredientName: '', quantityUsed: '' }]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      const productRef = doc(db, 'products', id);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const data = productSnap.data();
        setProductName(data.name);
        setPrice(data.price);
        setSubcategory(data.subcategory);
        setIngredients(data.ingredients || []);
      }
    };

    const fetchIngredients = async () => {
      const q = query(collection(db, 'Inventory'), where('branchCode', '==', userData.branchCode));
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

    fetchProductDetails();
    fetchIngredients();
    fetchSubcategories();
  }, [id, userData.branchCode]);

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

  const handleInputChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const handleAddIngredientField = () => {
    setIngredients([...ingredients, { category: '', ingredientName: '', quantityUsed: '' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, {
        name: productName,
        price: parseFloat(price),
        subcategory,
        ingredients: ingredients.filter(ing => ing.ingredientName && ing.quantityUsed)
      });
      alert('Product updated successfully!');
      navigate('/products'); // Redirect to product list or desired page
    } catch (error) {
      console.error("Error updating product: ", error);
    }
  };

  return (
    <div className={`product-form-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="product-form-content">
        <UserHeader onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />

        <h2 className="product-form-title" style={{ marginLeft: '10px', marginTop: '100px' }}>Edit Product</h2>
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
          <button type="submit" className="submit-product-button">Update Product</button>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
