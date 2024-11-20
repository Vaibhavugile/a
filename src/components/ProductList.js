import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where,addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import UserSidebar from './UserSidebar';
import UserHeader from './UserHeader';
import { useUser } from './Auth/UserContext';
import { FaDownload, FaUpload, FaPlus , FaEdit, FaTrash} from 'react-icons/fa';
import './InventoryDashboard.css'; // Import the same CSS file
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userData } = useUser();
  const navigate = useNavigate();

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const q = query(
        collection(db, 'products'),
        where('branchCode', '==', userData.branchCode)
      );
      const productSnapshot = await getDocs(q);
      const productList = productSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productList);
    };
    fetchProducts();
  }, [userData]);

  const handleExport = () => {
    // Logic to export products
  };


  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    Papa.parse(file, {
      header: true, // Parse the CSV as JSON objects
      skipEmptyLines: true,
      complete: async (result) => {
        try {
          const importedProducts = result.data.map((product) => ({
            ...product,
            price: Number(product.price), // Convert price to a number
          }));
  
          // Add each product to Firestore
          const batchPromises = importedProducts.map(async (product) => {
            await addDoc(collection(db, 'products'), {
              ...product,
              branchCode: userData.branchCode, // Ensure branchCode is set
            });
          });
  
          await Promise.all(batchPromises);
          alert('Products imported successfully!');
          window.location.reload(); // Refresh to display new products
        } catch (error) {
          console.error('Error importing products:', error);
          alert('Failed to import products. Please check the file format.');
        }
      },
      error: (error) => {
        console.error('Error reading CSV file:', error);
        alert('Error reading the file. Please try again.');
      },
    });
  };
  
  const handleDelete  = () => {
    // Logic to navigate to Add Product page
  };
  const handleEdit = (id) => {
    navigate(`/editproduct/${id}`);
  };
  const handleAddProduct= () => {
    navigate('/add-product');
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="dashboard-content">
        <UserHeader onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />

        <h2 style={{ marginLeft: '10px', marginTop: '100px' }}>Product List</h2>

        <div className="action-buttons">
        <label className="add-product-button" onClick={handleAddProduct}>
          <FaPlus />
              Add Product
         </label> 
         <label className="import-product-button">
            <FaUpload /> Import Products
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              style={{ display: 'none' }}
            />
          </label>
          
          
        </div>

        <table className="table">
          <thead>
            <tr>
              
              <th>Name</th>
              <th>Price</th>
              <th>Subcategory</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map(product => (
                <tr key={product.id}>
                 
                  <td>{product.name}</td>
                  <td>₹{product.price}</td>
                  <td>{product.subcategory}</td>
                  <td>
                    
                      <div className="action-buttons">
                        <label onClick={() => handleEdit(product.id)}><FaEdit /></label>
                        <label onClick={() => handleDelete(product.id)}><FaTrash /></label>
                      </div>
                    </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No products available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;
