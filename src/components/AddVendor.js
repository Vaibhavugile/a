import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from './Auth/UserContext';
import Select from 'react-select'; // Import React Select for dropdowns
import './AddVendor.css';

const VendorForm = () => {
  const [name, setName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [address, setAddress] = useState('');
  const [categories, setCategories] = useState([]); // All categories from inventory
  const [selectedCategories, setSelectedCategories] = useState([]); // User-selected categories
  const [itemsByCategory, setItemsByCategory] = useState({}); // Items grouped by category
  const [selectedItems, setSelectedItems] = useState({}); // User-selected items by category
  const { userData } = useUser();

  // Fetch categories and items based on branchCode from Inventory
  useEffect(() => {
    const fetchCategoriesAndItems = async () => {
      if (userData && userData.branchCode) {
        const q = query(
          collection(db, 'Inventory'),
          where('branchCode', '==', userData.branchCode)
        );
        const snapshot = await getDocs(q);
        const allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Extract unique categories and group items by category
        const categoriesSet = new Set();
        const itemsByCat = {};
        allItems.forEach(item => {
          categoriesSet.add(item.category);
          if (!itemsByCat[item.category]) itemsByCat[item.category] = [];
          itemsByCat[item.category].push({ id: item.id, ...item });
        });

        setCategories([...categoriesSet]);
        setItemsByCategory(itemsByCat);
      }
    };

    fetchCategoriesAndItems();
  }, [userData]);

  // Handle category selection
  const handleCategoryChange = (selectedOptions) => {
    const selectedCategoryNames = selectedOptions.map(option => option.value);
    setSelectedCategories(selectedCategoryNames);
  };

  // Handle item selection for a specific category
  const handleItemChange = (category, selectedOptions) => {
    setSelectedItems(prev => ({
      ...prev,
      [category]: selectedOptions.map(option => option.value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Collect selected items by category
    const suppliedItems = Object.keys(selectedItems).reduce((acc, category) => {
      const items = itemsByCategory[category].filter(item =>
        selectedItems[category].includes(item.id)
      );
      return acc.concat(items.map(item => item.ingredientName));
    }, []);

    try {
      await addDoc(collection(db, "Vendors"), {
        branchCode: userData.branchCode,
        name,
        contactNo,
        address,
        categories: selectedCategories,
        suppliedItems,
      });
      alert('Vendor added successfully!');
      setName('');
      setContactNo('');
      setAddress('');
      setSelectedCategories([]);
      setSelectedItems({});
    } catch (error) {
      console.error("Error adding vendor: ", error);
    }
  };

  return (
    <div className="vendor-form">
      <h2 className="vendor-form__title">Add New Vendor</h2>
      <form className="vendor-form__form" onSubmit={handleSubmit}>
        <input
          className="vendor-form__input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Vendor Name"
          required
        />
        <input
          className="vendor-form__input"
          type="text"
          value={contactNo}
          onChange={(e) => setContactNo(e.target.value)}
          placeholder="Contact Number"
          required
        />
        <input
          className="vendor-form__input"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address"
          required
        />

        <h3 className="vendor-form__category-title">Categories Supplied</h3>
        <Select
          isMulti
          options={categories.map(category => ({ value: category, label: category }))}
          onChange={handleCategoryChange}
          className="vendor-form__dropdown"
          placeholder="Select Categories"
        />

        {/* Show items selection dropdown for each selected category */}
        {selectedCategories.map((category) => (
          <div key={category} className="vendor-form__category-items">
            <h4 className="vendor-form__item-title">Items in {category}</h4>
            <Select
              isMulti
              options={itemsByCategory[category].map(item => ({
                value: item.id,
                label: `${item.ingredientName} (${item.quantity} ${item.unit})`,
              }))}
              onChange={(selectedOptions) => handleItemChange(category, selectedOptions)}
              className="vendor-form__dropdown"
              placeholder={`Select Items from ${category}`}
            />
          </div>
        ))}

        <button className="vendor-form__button" type="submit">
          Add Vendor
        </button>
      </form>
    </div>
  );
};

export default VendorForm;
