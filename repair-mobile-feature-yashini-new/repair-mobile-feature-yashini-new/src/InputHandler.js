import React, { useState, useEffect } from 'react';
import axios from 'axios';

const InputHandler = ({ darkMode }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [message, setMessage] = useState('');

  // Save action to backend
  const saveAction = async (action) => {
    try {
      await axios.post('http://localhost:5000/api/action', {
        userId: localStorage.getItem('userId') || 'user123', // Dynamic user ID
        action,
        position,
      });
    } catch (error) {
      console.error('Failed to save action:', error);
    }
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      let action = '';
      switch (e.key) {
        case 'ArrowUp':
          setPosition((prev) => ({ ...prev, y: prev.y - 10 }));
          action = 'Moved up';
          break;
        case 'ArrowDown':
          setPosition((prev) => ({ ...prev, y: prev.y + 10 }));
          action = 'Moved down';
          break;
        case 'ArrowLeft':
          setPosition((prev) => ({ ...prev, x: prev.x - 10 }));
          action = 'Moved left';
          break;
        case 'ArrowRight':
          setPosition((prev) => ({ ...prev, x: prev.x + 10 }));
          action = 'Moved right';
          break;
        default:
          break;
      }
      if (action) {
        setMessage(action);
        saveAction(action);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [position]);

  // Handle mouse events
  const handleMouseClick = (e) => {
    setPosition({ x: e.clientX, y: e.clientY });
    const action = `Clicked at (${e.clientX}, ${e.clientY})`;
    setMessage(action);
    saveAction(action);
  };

  return (
    <div
      onClick={handleMouseClick}
      style={{
        height: '100vh',
        position: 'relative',
        cursor: 'pointer',
        backgroundColor: darkMode ? '#1a202c' : '#fff',
        color: darkMode ? '#fff' : '#000',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: '20px',
          height: '20px',
          backgroundColor: 'blue',
          borderRadius: '50%',
        }}
      />
      <p>{message}</p>
    </div>
  );
};

export default InputHandler;