import React, { useState, useEffect, useContext } from "react";
import "antd/dist/reset.css";
import { MainWrapper } from "./ProfileSC";
import { Form, Input, Button, Select } from "antd";
import { useHistory } from "react-router-dom";
import { GlobalContext, actions } from "../../App";
import {
  PlusCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import "../Signup/Signup.css";
import axios from "axios";
import apiList from "../../lib/apiList";
import { ACTIVE_HSK_LEVEL, AVAILABLE_HSK_LEVELS } from "../../lib/course";
// import AppUpload from "../Avatar/AppUpload";

const Profile = () => {
  const [formStatus, setFormStatus] = useState("idle");
  const [error, setError] = useState(null);
  const history = useHistory();
  const [userInfo, setUserInfo] = useState({
    username: '',
    email: '',
    hskLevel: ACTIVE_HSK_LEVEL,
    _id: '',
  });
  
  const {
    state: { user },
    dispatch
  } = useContext(GlobalContext);

  // console.log('User context:', user);
  // console.log('User email from context:', user?.email || user?._doc?.email);

  // Add a form reference
  const [form] = Form.useForm();

  // Check if user is logged in and set user info
  useEffect(() => {
    // Check for user in both context and sessionStorage
    const sessionUser = JSON.parse(window.sessionStorage.getItem("currentUser"));
    
    if (!user && !sessionUser) {
      setError('Please ensure you are logged in.');
      setTimeout(() => {
        history.push('/login');
      }, 2000);
      return;
    }

    // Use sessionUser if user context is not available
    const currentUser = user || sessionUser;
    
    // If we have a sessionUser but no context user, update the context
    if (!user && sessionUser) {
      dispatch({ type: actions.SET_USER, payload: { user: sessionUser } });
    }

    // Update userInfo state
    setUserInfo(prevState => ({
      ...prevState,
      username: currentUser.username || '',
      email: currentUser._doc?.email || currentUser.email || '',
      hskLevel: ACTIVE_HSK_LEVEL,
      _id: currentUser._id || currentUser._doc?._id || currentUser.id,
    }));

    // Set form values programmatically
    form.setFieldsValue({
      username: currentUser.username || '',
      email: currentUser._doc?.email || currentUser.email || '',
      hskLevel: ACTIVE_HSK_LEVEL,
    });
  }, [user, history, form, dispatch]);

  const buttonValues = {
    idle: {
      text: "Update Account",
      loading: false,
      icon: <PlusCircleOutlined />,
    },
    loading: { text: "Updating Account", loading: true, icon: null },
    success: {
      text: "Account Updated",
      loading: false,
      icon: <CheckCircleOutlined />,
    },
    failed: {
      text: "Account Updated Failed",
      loading: false,
      icon: <CloseCircleOutlined />,
    },
  };

  const handleUpdate = async () => {
    try {
      setFormStatus("loading");
      
      const sessionUser = JSON.parse(window.sessionStorage.getItem("currentUser"));
      const currentUser = user || sessionUser;
      const userId = currentUser?._id || currentUser?._doc?._id || currentUser?.id;

      if (!userId) {
        setError('Please ensure you are logged in.');
        setTimeout(() => {
          history.push('/login');
        }, 2000);
        return;
      }

      // Get form values
      const values = await form.validateFields();
      
      const updateData = {
        username: values.username,
        hskLevel: values.hskLevel,
        email: values.email,
      };

      const response = await axios.put(`${apiList.user}/${userId}`, updateData);

      // Don't check response.data.success, just update if we have user data
      if (response.data.user) {
        const updatedUser = response.data.user;
        
        // Update context
        dispatch({ 
          type: actions.SET_USER, 
          payload: { user: updatedUser } 
        });

        // Update session storage
        window.sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));

        // Update form with new values
        form.setFieldsValue({
          username: updatedUser.username,
          email: updatedUser.email,
          hskLevel: ACTIVE_HSK_LEVEL
        });
      }

      // Set success regardless of user data
      setFormStatus("success");
      setError(null);

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.error('Update error:', err);
      setFormStatus("failed");
      setError('Failed to update profile');
      
      setTimeout(() => {
        setFormStatus("idle");
      }, 2000);
    }
  };

  // Add this useEffect to handle initial user data
  useEffect(() => {
    try {
      const storedUser = window.sessionStorage.getItem("currentUser");
      const sessionUser = storedUser ? JSON.parse(storedUser) : null;
      
      if (sessionUser && !user) {
        dispatch({ 
          type: actions.SET_USER, 
          payload: { user: sessionUser } 
        });
      }

      if (sessionUser || user) {
        const currentUser = user || sessionUser;
        form.setFieldsValue({
          username: currentUser.username || '',
          email: currentUser.email || currentUser._doc?.email || '',
          hskLevel: ACTIVE_HSK_LEVEL
        });
      }
    } catch (e) {
      console.error('Error initializing user data:', e);
    }
  }, [user, form, dispatch]);

  // Add a check for Google-authenticated users
  const isGoogleUser = user?.googleId || user?._doc?.googleId;

  return (
    <MainWrapper>
      <div className="signup-container">
        {error ? (
          <div className="error-message" style={{
            color: 'white',
            textAlign: 'center',
            padding: '1rem',
            background: 'rgba(255, 77, 79, 0.2)',
            borderRadius: '10px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        ) : (
          <>
            <h1>Update your profile</h1>
            <Form 
              form={form}
              name="signup" 
              layout="vertical" 
              size="large"
            >
              <Form.Item
                label="Username"
                name="username"
                rules={[{ required: true, message: "Please input a username." }]}
              >
                <Input
                  placeholder="Enter a username"
                  onChange={(e) =>
                    setUserInfo((oldUserInfo) => ({
                      ...oldUserInfo,
                      username: e.target.value,
                    }))
                  }
                />
              </Form.Item>

              <Form.Item
                label="Email Address"
                name="email"
                initialValue={userInfo.email}
              >
                <Input
                  placeholder="Enter an email address"
                  disabled={isGoogleUser}
                  style={{ color: 'rgba(0, 0, 0, 0.88)' }}
                  defaultValue={userInfo.email}
                  onChange={(e) =>
                    setUserInfo((oldUserInfo) => ({
                      ...oldUserInfo,
                      email: e.target.value,
                    }))
                  }
                />
              </Form.Item>

              {/* Only show password fields for non-Google users */}
              {!isGoogleUser && (
                <>
                  <Form.Item 
                    label="Password" 
                    name="password" 
                    rules={[{
                      required: true,
                      message: "Password must be at least 6 characters long",
                      min: 6
                    }]}
                  >
                    <Input.Password
                      placeholder="Enter a password"
                    />
                  </Form.Item>

                  <Form.Item 
                    label="Confirm Password" 
                    name="confirmPassword" 
                    rules={[{
                      required: true,
                      message: "Please confirm your password"
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('The two passwords do not match'));
                      },
                    })
                    ]}
                  >
                    <Input.Password
                      placeholder="Re-enter your password"
                    />
                  </Form.Item>
                </>
              )}

              <Form.Item
                label="HSK Level"
                name="hskLevel"
                rules={[{ required: true, message: "Please select your HSK level" }]}
              >
                <Select
                  onChange={(value) =>
                    setUserInfo((oldUserInfo) => ({
                      ...oldUserInfo,
                      hskLevel: value,
                    }))
                  }
                  style={{ width: '100%' }}
                  value={ACTIVE_HSK_LEVEL}
                  disabled
                >
                  {AVAILABLE_HSK_LEVELS.map(({ value, label }) => <Select.Option key={value} value={value}>{label}</Select.Option>)}
                </Select>
              </Form.Item>

              <Button
                htmlType="submit"
                type="primary"
                loading={buttonValues[formStatus].loading}
                icon={buttonValues[formStatus].icon}
                className="btn btn-primary"
                onClick={handleUpdate}
              >
                {buttonValues[formStatus].text}
              </Button>
            </Form>
          </>
        )}
      </div>
    </MainWrapper>
  );
};

export default Profile;
