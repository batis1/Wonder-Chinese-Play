import { useState, useEffect } from "react";
import { Form, Input, Button,Select  } from "antd";
import { useHistory } from "react-router-dom";
import {
  PlusCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import "./Signup.css";
// import { FormProvider } from "antd/lib/form/context";
// import AvatarUpload from "./AvatarUpload";
import axios from "axios";
import apiList from "../../lib/apiList";
import { ACTIVE_HSK_LEVEL, AVAILABLE_HSK_LEVELS } from "../../lib/course";
// import AppUpload from "../Avatar/AppUpload";
const { Option } = Select;
const Signup = (props) => {
  const [formStatus, setFormStatus] = useState("idle");
  const buttonValues = {
    idle: {
      text: "Create Account",
      loading: false,
      icon: <PlusCircleOutlined />,
    },
    loading: { text: "Creating Account", loading: true, icon: null },
    success: {
      text: "Account Created",
      loading: false,
      icon: <CheckCircleOutlined />,
    },
    failed: {
      text: "Account Creation Failed",
      loading: false,
      icon: <CloseCircleOutlined />,
    },
  };
  const history = useHistory();
  useEffect(() => {
    if (props.user) {
      history.push("/");
    }
  }, [props.user, history]);

  const onFinish = async (values) => {
    setFormStatus("loading");
  
    try {
      const { data } = await axios.post(apiList.signup, {
        ...values,
      });
  
      if (data.success) {
        setFormStatus("success");
        const userData = {
          ...data.user,
          _id: data.user.id || data.user._id,
        };
        props.setUser(userData);
        window.sessionStorage.setItem("currentUser", JSON.stringify(userData));
        history.push("/");
      } else {
        setFormStatus("failed");
      }
    } catch (error) {
      setFormStatus("failed");
    }
  };
  

  return (
    <div className="signup-container">
      <h1>Create an Account</h1>
      {/* <AvatarUpload
          avatarImg={avatarImg}
          setImagePath={setImagePath}
          setAvatarImg={setAvatarImg}
        /> */}
      {/* <AppUpload setInput={setImagePath} input={imagePath} /> */}
      <Form name="signup" onFinish={onFinish} layout="vertical" size="large" initialValues={{ hskLevel: ACTIVE_HSK_LEVEL }}>
        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: "Please input a username." }]}
        >
          <Input placeholder="Enter a username" />
        </Form.Item>
        <Form.Item
          label="Email Address"
          name="email"
          rules={[
            {
              required: true,
              message: "A valid email address is required to signup.",
            },
          ]}
        >
          <Input placeholder="Enter an email address" />
        </Form.Item>
        <Form.Item label="Password" name="password" rules={[{
          required: true,
          message: "Please input your password",
        }, {
          min: 6,
          message: "Password must be at least 6 characters long"
        }]}>
          <Input.Password
            placeholder="Enter a password"
          />
        </Form.Item>
        <Form.Item label="Confirm Password" name="confirmPassword" rules={[{
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
        ]}>
          <Input.Password
            placeholder="Re-enter your password"
          />
        </Form.Item>
        <Form.Item
          label="Course"
          name="hskLevel"
          rules={[{ required: true, message: "Please select your HSK level." }]}
        >
          <Select disabled>
            {AVAILABLE_HSK_LEVELS.map(({ value, label }) => <Option key={value} value={value}>{label}</Option>)}
          </Select>
        </Form.Item>
        <Button
          htmlType="submit"
          type="primary"
          loading={buttonValues[formStatus].loading}
          icon={buttonValues[formStatus].icon}
          className="btn btn-primary"
        >
          {buttonValues[formStatus].text}
        </Button>
        <p className="form-text">
          Already have an account?{" "}
          <span 
            onClick={() => history.push("/login")} 
            className="form-link"
            style={{ cursor: 'pointer' }}
          >
            Log in
          </span>
        </p>
      </Form>
    </div>
  );
};

export default Signup;
