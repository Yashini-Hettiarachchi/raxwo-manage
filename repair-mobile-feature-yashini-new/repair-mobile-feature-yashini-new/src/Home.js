import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';


const Home = ({darkMode}) => {
  return (
    <div className={`home-container ${darkMode ? "dark" : ""}`}>
      <div className={`home-content ${darkMode ? "dark" : ""}`}>
        <h1 className={`home-title ${darkMode ? "dark" : ""}`}>Welcome to shopmanager</h1>
        <p className={`home-description ${darkMode ? "dark" : ""}`}>
          Manage all your products easily and efficiently. From adding products to viewing the list, everything is just a click away.
        </p>
       
        
      </div>
    </div>
  );
};

export default Home;
