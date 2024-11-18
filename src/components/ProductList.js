import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import UserSidebar from './UserSidebar';
import UserHeader from './UserHeader';
import { useUser } from './Auth/UserContext';
import { FaDownload, FaUpload, FaPlus , FaEdit, FaTrash} from 'react-icons/fa';
import './InventoryDashboard.css'; // Import the same CSS file
import { useNavigate } from 'react-router-dom';

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

  const handleImport = (event) => {
    const file = event.target.files[0];
    // Logic to handle import
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
