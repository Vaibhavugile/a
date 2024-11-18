import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo1 from '../assets/lll.png';
import profileIcon from '../assets/Profile.png';
import menuImage from '../assets/Menu.png';
import './UserHeader.css';

const UserHeader = ({ onMenuClick, isSidebarOpen }) => {
  const navigate = useNavigate(); // Use useNavigate for navigation
  const location = useLocation();

  // List of routes where the header should be hidden
  const hiddenRoutes = ['/login', '/signup'];
  const shouldHideHeader = hiddenRoutes.includes(location.pathname);

  return (
    <header className={`header2 ${isSidebarOpen ? 'sidebar-open' : ''} ${shouldHideHeader ? 'hidden' : ''}`}>
      <button className="menu-button" onClick={onMenuClick}>
        <img className='menu-image' src={menuImage} alt="Menu" />
      </button>
      <div className="header2-logo">
        <img src={logo1} alt="Logo" />
      </div>
      
    </header>
  );
};

export default UserHeader;
