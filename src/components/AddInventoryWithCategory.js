import React, { useState , useEffect, } from 'react';
import { db } from '../firebase'; // Firebase initialization
import { collection, addDoc ,where,getDocs,query} from 'firebase/firestore'; // Import addDoc instead of using db.collection directly
import { useUser } from '../components/Auth/UserContext'; // Assuming you're using a UserContext for branchCode
import "./AddInventory.css"
import { useNavigate, useParams } from 'react-router-dom';

function AddIngredient() {
  const [ingredientName, setIngredientName] = useState('');
  const[category,setCategory]=useState('')
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('grams');
  const [branchCode, setBranchCode] = useState(''); // Store branch code
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
    const categories = querySnapshot.docs.map(doc => doc.data().category);
    setSuggestedCategories([...new Set(categories)]);
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setCategory(value);
    fetchCategories(value); // Fetch matching categories as user types
  };

  const handleSelectCategory = (selectedCategory) => {
    setCategory(selectedCategory);
    setSuggestedCategories([]); // Clear suggestions after selection
  };
  const convertQuantity = () => {
    const quantityValue = parseFloat(quantity);
    if (isNaN(quantityValue)) return 0; // Return 0 if quantity is not a number

    switch (unit) {
      case 'grams':
        return quantityValue; // already in grams
      case 'kilograms':
        return quantityValue * 1000; // convert kilograms to grams
      case 'liters':
        return quantityValue * 1000; // convert liters to milliliters
      case 'milliliters':
        return quantityValue; // already in milliliters
      case 'pieces':
      case 'boxes':
        return quantityValue; // keep as is for pieces and boxes
      default:
        return quantityValue; // fallback to input value
    }
  };
  const handleAddIngredient = async () => {
    // Add new ingredient to Firestore
    const standardizedQuantity = convertQuantity(); 
    const storedUnit = unit === 'kilograms' ? 'grams' : unit === 'liters' ? 'milliliters' : unit;
    
    try {
      const docRef = await addDoc(collection(db, 'Inventory'), {
        ingredientName,
        category,
        quantity:  standardizedQuantity,
        unit:storedUnit,
        branchCode,
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
    <div>
      <h1>Add New Ingredient</h1>
      <input
        type="text"
        placeholder="Ingredient Category"
        value={category}
        onChange={handleCategoryChange}
      />
      {suggestedCategories.length > 0 && (
        <ul className="suggestions-list">
          {suggestedCategories.map((cat, index) => (
            <li key={index} onClick={() => handleSelectCategory(cat)}>
              {cat}
            </li>
          ))}
        </ul>
      )}
      <input
        type="text"
        placeholder="Ingredient Name"
        value={ingredientName}
        onChange={(e) => setIngredientName(e.target.value)}
      />
       <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />
      <select value={unit} onChange={(e) => setUnit(e.target.value)}>
        <option value="grams">Grams</option>
        <option value="kilograms">Kilograms</option>
        <option value="liters">Liters</option>
        <option value="milliliters">Milliliters</option>
        <option value="pieces">Pieces</option>
        <option value="boxes">Boxes</option>
      </select>
      <button onClick={handleAddIngredient}>Add Ingredient</button>
    </div>
  );
}

export default AddIngredient;

