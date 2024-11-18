import React, { useState,useEffect  } from 'react';
import { addDoc, collection,getDocs,query, where,  } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from './Auth/UserContext'; // Assuming you're using a UserContext for branchCode
import { useNavigate, useParams } from 'react-router-dom';


const TableForm = () => {
  const [tableNumber, setTableNumber] = useState('');
  const [branchCode, setBranchCode] = useState(''); // Store branch code
  const { userData } = useUser(); 
  const navigate = useNavigate();

  useEffect(() => {
    if (userData && userData.branchCode) {
      setBranchCode(userData.branchCode);
    }
  }, [userData]);// Get user data from context

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'tables'), {
        tableNumber,
        branchCode,
        orders: []  // Initialize with an empty orders array
      });
      setTableNumber('');
      alert("Table added successfully");
      navigate('/usersidebar/billing'); // Redirect to the inventory dashboard

    } catch (error) {
      console.error("Error adding table: ", error);
    }
  };

  return (
    <div>
      <h2>Add New Table</h2>
      <form onSubmit={handleSubmit}>
        <label>Table Number / Counter Number</label>
        <input
          type="text"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          required
        />
        <button type="submit">Add Table</button>
      </form>
    </div>
  );
};

export default TableForm;
