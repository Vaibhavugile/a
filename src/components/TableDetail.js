import React, { useState, useEffect } from 'react';
import { useParams ,useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import './TableDetail.css';
import { useUser } from './Auth/UserContext';

const TableDetail = () => {
  const { tableId } = useParams();
  const [table, setTable] = useState(null);
  const [products, setProducts] = useState([]);
  const [groupedProducts, setGroupedProducts] = useState({});
  const [productQuantities, setProductQuantities] = useState({});
  const [orderChanges, setOrderChanges] = useState([]);
  const { userData } = useUser();
  const [branchCode, setBranchCode] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchTable = async () => {
      const tableRef = doc(db, 'tables', tableId);
      const tableDoc = await getDoc(tableRef);
      if (tableDoc.exists()) {
        setTable({ id: tableDoc.id, ...tableDoc.data() });
        setOrderChanges(tableDoc.data().orders || []);
      }
    };
    fetchTable();
  }, [tableId]);

  useEffect(() => {
    if (userData && userData.branchCode) {
      setBranchCode(userData.branchCode);
    }
  }, [userData]);

  useEffect(() => {
    const fetchProducts = async () => {
      const productsCollection = query(
        collection(db, 'products'),
        where('branchCode', '==', userData.branchCode)
      );

      const productsSnapshot = await getDocs(productsCollection);
      const productList = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productList);

      const grouped = productList.reduce((acc, product) => {
        if (!acc[product.subcategory]) {
          acc[product.subcategory] = [];
        }
        acc[product.subcategory].push(product);
        return acc;
      }, {});
      setGroupedProducts(grouped);

      const initialQuantities = productList.reduce((acc, product) => {
        acc[product.id] = 0;
        return acc;
      }, {});
      setProductQuantities(initialQuantities);
    };
    fetchProducts();
  }, [userData]);

  const addProductToOrder = (productId) => {
    const product = products.find(p => p.id === productId);

    const updatedOrders = [...orderChanges];
    const existingOrderIndex = updatedOrders.findIndex(order => order.name === product.name);

    if (existingOrderIndex !== -1) {
      updatedOrders[existingOrderIndex].quantity += 1;
    } else {
      updatedOrders.push({
        name: product.name,
        price: product.price,
        quantity: 1,
        ingredients: product.ingredients
      });
    }

    setOrderChanges(updatedOrders);

    const tableRef = doc(db, 'tables', tableId);
    updateDoc(tableRef, { orders: updatedOrders }).catch(error =>
      console.error('Error updating orders: ', error)
    );
  };

  const handleOrderChange = (index, quantityChange) => {
    const updatedOrders = [...orderChanges];
    updatedOrders[index].quantity += quantityChange;

    if (updatedOrders[index].quantity <= 0) {
      updatedOrders.splice(index, 1);
    }

    setOrderChanges(updatedOrders);

    const tableRef = doc(db, 'tables', tableId);
    updateDoc(tableRef, { orders: updatedOrders }).catch(error =>
      console.error('Error updating orders: ', error)
    );
  };

  const handleSubcategoryClick = (subcategory) => {
    setSelectedSubcategory(subcategory);
  };
  const handeCancle = () => {
    navigate('/usersidebar/billing');
  };
  return (
    <div className="table-detail-container">
      <div className="sidebar-menu">
        <div className="sidebar-subcategories">
          {Object.keys(groupedProducts).map((subcategory) => (
            <div key={subcategory} className="subcategory" onClick={() => handleSubcategoryClick(subcategory)}>
              <div className="subcategory-title">{subcategory}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="table-content">
        {table ? (
          <div>
            <h2>Table: {table.tableNumber}</h2>
            <button onClick={handeCancle}>Back To Tables</button>
            <div className="products-container">
              {selectedSubcategory && groupedProducts[selectedSubcategory]?.map(product => (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => addProductToOrder(product.id)}
                >
                  <h4>{product.name}</h4>
                  <p>Price: ₹{product.price}</p>
                </div>
              ))}
            </div>
            <div className="orders-container">
              <h3>Orders</h3>
              <ul>
                {orderChanges.map((order, index) => (
                  <li key={index}>
                    {order.quantity} x {order.name} - ₹{order.price * order.quantity}
                    <div className="edit-controls">
                      <button onClick={() => handleOrderChange(index, -1)}>-</button>
                      <button onClick={() => handleOrderChange(index, +1)}>+</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            
          </div>
        ) : (
          <p>Loading table...</p>
        )}
      </div>
    </div>
  );
};

export default TableDetail;
