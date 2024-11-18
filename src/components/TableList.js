import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, getDoc,addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link,useNavigate } from 'react-router-dom';
import UserSidebar from './UserSidebar'; 
import UserHeader from './UserHeader';    
import './TableList.css';
import { useUser } from './Auth/UserContext'; // Assuming you're using a UserContext for branchCode
import { FaSearch, FaFilter, FaDownload, FaUpload, FaPlus, FaEdit, FaTrash, FaCopy } from 'react-icons/fa';


const TableList = () => {
  const [tables, setTables] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(0); 
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  const [branchCode, setBranchCode] = useState(''); // Store branch code
  const { userData } = useUser(); // Get user data from context
  const [showBill, setShowBill] = useState(false);
  const navigate = useNavigate();

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen); 
  };
  useEffect(() => {
    if (userData && userData.branchCode) {
      setBranchCode(userData.branchCode);
    }
  }, [userData]);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const q= query(
          collection(db,'tables'),
          where('branchCode','==',userData.branchCode)
        )
        const querySnapshot = await getDocs(q);
        const tableData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          orderStatus: 'Running Order' 
        }));
        setTables(tableData);
      } catch (error) {
        console.error("Error fetching tables: ", error);
      }
    };

    fetchTables();
  }, []);

  const calculateTotalPrice = (orders) => {
    return orders.reduce((total, order) => total + (order.price * order.quantity), 0);
  };

  const calculateDiscountedPrice = (totalPrice, discountPercentage) => {
    const discountAmount = (totalPrice * discountPercentage) / 100;
    return totalPrice - discountAmount;
  };

  const handleOpenPaymentModal = (table) => {
    setSelectedTable(table);
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedTable(null);
    setPaymentMethod('');
    setPaymentStatus('');
    setResponsibleName('');
    setDiscountPercentage(0); 
  };

  const updateIngredientQuantities = async (orders) => {
    try {
      const inventoryUpdates = {};
  
      for (const order of orders) {
        console.log("Processing order:", order); // Log the current order being processed
        
        if (order.ingredients) {
          for (const ingredient of order.ingredients) {
            const ingredientName = ingredient.ingredientName; // Correctly access ingredient name
            const quantityUsed = parseFloat(ingredient.quantityUsed) * order.quantity; // Calculate total quantity used
  
            // Log ingredient details and calculated quantities
            console.log(`Ingredient: ${ingredientName}, Amount per order: ${ingredient.quantityUsed}, Quantity ordered: ${order.quantity}, Total used: ${quantityUsed}`);
  
            if (inventoryUpdates[ingredientName]) {
              inventoryUpdates[ingredientName] += quantityUsed;
            } else {
              inventoryUpdates[ingredientName] = quantityUsed;
            }
          }
        }
      }
  
      console.log("Inventory Updates Object:", inventoryUpdates); // Log the inventory updates object
  
      for (const [ingredientName, quantityUsed] of Object.entries(inventoryUpdates)) {
        const q = query(collection(db, 'Inventory'),where('branchCode', '==', branchCode), where('ingredientName', '==', ingredientName) );
        const querySnapshot = await getDocs(q);
  
        querySnapshot.forEach(async (doc) => {
          const ingredientRef = doc.ref; // Get the document reference
          const currentQuantity = doc.data().quantity;
          const updatedQuantity = currentQuantity - quantityUsed; // Reduce the quantity
  
          console.log(`Updating ingredient: ${ingredientName}, Current quantity: ${currentQuantity}, Quantity used: ${quantityUsed}, Updated quantity: ${updatedQuantity},Branch Code :${userData.branchCode}`); // Log the update details
          
          await updateDoc(ingredientRef, { quantity: updatedQuantity });
        });
      }
    } catch (error) {
      console.error("Error updating ingredient quantities: ", error);
    }
  };
  

  const handleSavePayment = async () => {
    if (selectedTable && paymentMethod && paymentStatus) {
      const tableRef = doc(db, 'tables', selectedTable.id);
      let updatedOrderStatus = '';
      let updatedOrders = selectedTable.orders;
      let previousOrders = selectedTable.orderHistory || [];
  
      const totalPrice = calculateTotalPrice(selectedTable.orders);
      const discountedPrice = calculateDiscountedPrice(totalPrice, discountPercentage);
  
      const newHistoryEntry = {
        orders: selectedTable.orders,
        payment: {
          total: totalPrice,
          discountedTotal: discountedPrice, 
          discountPercentage, 
          status: paymentStatus,
          method: paymentMethod,
          responsible: paymentStatus === 'Due' ? responsibleName : null,
          timestamp: new Date().toISOString()
        }
      };
  
      if (paymentStatus === 'Settled') {
        updatedOrderStatus = 'Payment Successfully Settled';
        previousOrders = [...previousOrders, newHistoryEntry];
        updatedOrders = [];
      } else if (paymentStatus === 'Due' && responsibleName.trim() !== '') {
        updatedOrderStatus = `Payment Due Successfully by ${responsibleName}`;
        previousOrders = [...previousOrders, newHistoryEntry];
        updatedOrders = [];
      } else {
        alert('Please enter the responsible person\'s name for due payments.');
        return;
      }
  
      try {
        // Add the payment and order details as a new document in the 'orders' subcollection
        const orderRef = await addDoc(collection(tableRef, 'orders'), {
          payment: {
            total: totalPrice,
            discountedTotal: discountedPrice,
            discountPercentage,
            status: paymentStatus,
            method: paymentMethod,
            responsible: paymentStatus === 'Due' ? responsibleName : null
          },
          orders: selectedTable.orders,
          orderStatus:  updatedOrderStatus,
          timestamp: new Date().toISOString() // Add timestamp for the order
        });

        await updateDoc(tableRef, {
          orders: [], // Clear the orders in the table document
          orderHistory: previousOrders,
          orderStatus: updatedOrderStatus,
        });
  
        // Update ingredient quantities
        await updateIngredientQuantities(selectedTable.orders);
  
        // Optionally, you could add this order ID to the order history if needed
      
        alert('Payment details saved successfully');
        handleClosePaymentModal();
      } catch (error) {
        console.error("Error saving payment details: ", error);
      }
    } else {
      alert('Please select a payment method and status');
    }
  };
  
    const handlePrint = () => {
    window.print(); // This will trigger the print dialog
    setShowBill(false); // Hide the bill after printing
  };

  const handleAddProduct = () => {
    navigate('/add-table');
  };


  return (
    <div className={`table-list-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="table-list-content">
        <UserHeader onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />

        <h2 style={{ marginLeft: '10px', marginTop: '100px' }}>Tables</h2>
        <div className="action-buttons">
        <label className="add-product-button" onClick={handleAddProduct} >
          <FaPlus />
              Add Table
        </label> 
        </div>

        <div className="table-list">
          {tables.map(table => {
            const totalPrice = calculateTotalPrice(table.orders);
            const cardClass = totalPrice > 0 ? 'table-card payment-due' : 'table-card';


            return (
              <Link to={`/table/${table.id}`} key={table.id} className={cardClass}>
                <div>
                  <button className="table-button1">{table.tableNumber}</button>
                  <button className="payment-button" onClick={(e) => {
                    e.preventDefault(); // Prevents the Link from navigating when clicking the payment button
                    handleOpenPaymentModal(table);
                  }}>
                    Pay {totalPrice.toFixed(2)}
                  </button>
                </div>
              </Link>
            );
          })}
        </div>

        {showPaymentModal && selectedTable && (
  <div className="modal">
    <div className="modal-content">
      <h3>Payment for Table {selectedTable.tableNumber}</h3>

      {selectedTable.orders.length > 0 ? (
        <>
          <p>Total Price: ₹{calculateTotalPrice(selectedTable.orders)}</p>
          <p>
            Discounted Price: ₹
            {calculateDiscountedPrice(
              calculateTotalPrice(selectedTable.orders),
              discountPercentage
            )}
          </p>


          <h4>Order Summary:</h4>
          <ul>
            {selectedTable.orders.map((order, index) => (
              <li key={index}>
                {order.quantity} x {order.name} - ₹{order.price * order.quantity}
              </li>
            ))}
          </ul>
          <label>
            Discount Percentage:
            <input
              type="number"
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(e.target.value)}
            />
          </label>


          <div>
            <label>Payment Method:</label>
            <div>
              <label>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash"
                  checked={paymentMethod === "Cash"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Cash
              </label>
              <label>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Card"
                  checked={paymentMethod === "Card"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Card
              </label>
              <label>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="UPI"
                  checked={paymentMethod === "UPI"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                UPI
              </label>
              <label>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Due"
                  checked={paymentMethod === "Due"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Due
              </label>
            </div>
          </div>

          <div>
            <label>Payment Status:</label>
            <div>
              <label>
                <input
                  type="radio"
                  name="paymentStatus"
                  value="Settled"
                  checked={paymentStatus === "Settled"}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                />
                Settled
              </label>
              <label>
                <input
                  type="radio"
                  name="paymentStatus"
                  value="Due"
                  checked={paymentStatus === "Due"}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                />
                Due
              </label>
            </div>
          </div>

          {paymentStatus === 'Due' && (
            <div>
              <label>Responsible Person:</label>
              <input
                type="text"
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
              />
            </div>
          )}

          <button onClick={handleSavePayment}>Save Payment</button>
          <button onClick={handleClosePaymentModal}>Cancel</button>
        </>
      ) : (
        <p>No orders to display.
          <button onClick={handleClosePaymentModal}>Cancel</button>
        </p>
      )}
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default TableList;
