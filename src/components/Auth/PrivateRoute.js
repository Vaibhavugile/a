import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../../firebaseConfig'; // Adjust the path to your Firebase config

const PrivateRoute = ({ children }) => {
  return auth.currentUser ? children : <Navigate to="/" />;
};

export default PrivateRoute;
