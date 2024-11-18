import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './UserSidebar.css'; // Import the CSS file for Sidebar


const UserSidebar = ({isOpen}) => {
  const location = useLocation();

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <nav>
        <ul>
          <li className="sidebar-greeting1">Welcome User,</li>
         

          <li className={`sidebar-link ${location.pathname === '/usersidebar/billing' ? 'active' : ''}`}>
            <Link to="/usersidebar/billing" >
               Billing </Link>
          </li>

          
          
          
          <li className={`sidebar-link ${location.pathname === '/products' ? 'active' : ''}`}>
            <Link to="/products"> 
            Product</Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/inventorydashboard' ? 'active' : ''}`}>
            <Link to="/inventorydashboard"> 
            Inventory</Link>
          </li>

          <li className={`sidebar-link ${location.pathname === '/vendordashboard' ? 'active' : ''}`}>
            <Link to="/vendordashboard"> 
            Vendors</Link>
          </li>
          
          <li className={`sidebar-link ${location.pathname === '/report/order' ? 'active' : ''}`}>
            <Link to="/report/order"> 
             Order Report</Link>
          </li>

          <li className={`sidebar-link ${location.pathname === '/report/payments' ? 'active' : ''}`}>
            <Link to="/report/payments"> 
             Payment Report</Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/report/dues' ? 'active' : ''}`}>
            <Link to="/report/dues"> 
             Due Payment Report</Link>
          </li>
          
          
          
          
        </ul>
      </nav>
    </div>
  );
};

export default UserSidebar;