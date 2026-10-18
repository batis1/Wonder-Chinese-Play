import React, { useState, useEffect } from 'react';
import { Select, Button, message, Modal } from 'antd';
import axios from 'axios';
import apiList from '../../lib/apiList';
import { ACTIVE_HSK_LEVEL, AVAILABLE_HSK_LEVELS } from '../../lib/course';
import { actions } from '../../App';
import './SelectHSKLevel.css';

const SelectHSKLevel = ({ googleCredential, dispatch, history, setUser }) => {
  const [selectedLevel, setSelectedLevel] = useState(ACTIVE_HSK_LEVEL);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user exists immediately when component mounts
    checkExistingUser();
  }, []);

  const checkExistingUser = async () => {
    try {
      setLoading(true);
      
      // Check if user exists and has HSK level
      const { data } = await axios.post(apiList.googleLogin, {
        credential: googleCredential,
        checkOnly: true  // Add this flag to indicate we're just checking user existence
      });

      if (data.user && data.user.hskLevel) {
        // User exists and has HSK level, proceed with login directly
        handleExistingUserLogin(data.user);
        return;
      }
      
    } catch (error) {
      if (error.response?.status === 400) {
        // User doesn't exist or needs HSK level - keep modal open
        return;
      }
      
      // Handle other errors
      console.error('Login check failed:', error);
      message.error(`Login failed: ${error.message}`);
      Modal.destroyAll();
    } finally {
      setLoading(false);
    }
  };

  const handleExistingUserLogin = (user) => {
    const userData = {
      ...user,
      _id: user._id || user.id
    };

    dispatch({ 
      type: actions.SET_USER, 
      payload: { user: userData } 
    });
    
    window.sessionStorage.setItem("currentUser", JSON.stringify(userData));
    
    setUser?.(userData);
    
    message.success('Successfully logged in!');
    Modal.destroyAll();
    
    setTimeout(() => {
      history.push('/');
    }, 100);
  };

  const handleStartLearning = async () => {
    try {
      setLoading(true);
      
      const { data } = await axios.post(apiList.googleLogin, {
        credential: googleCredential,
        hskLevel: selectedLevel
      });

      if (data.user) {
        handleExistingUserLogin(data.user);
      } else {
        throw new Error('Invalid response format from server');
      }
      
    } catch (error) {
      console.error('Failed to update HSK level:', error);
      message.error(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="select-hsk-container">
      <Select
        defaultValue={ACTIVE_HSK_LEVEL}
        disabled
        style={{ width: '100%', marginBottom: 20 }}
        onChange={value => setSelectedLevel(value)}
      >
        {AVAILABLE_HSK_LEVELS.map(({ value, label }) => <Select.Option key={value} value={value}>{label}</Select.Option>)}
      </Select>

      <Button 
        type="primary" 
        onClick={handleStartLearning}
        loading={loading}
        style={{ width: '100%' }}
      >
        Start Learning
      </Button>
    </div>
  );
};

export default SelectHSKLevel;
