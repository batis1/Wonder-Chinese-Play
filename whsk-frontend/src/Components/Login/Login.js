import { useState, useEffect, useContext, lazy, Suspense } from "react";
// import "antd/dist/reset.css";
import { Form, Input, Button, Tabs } from "antd";
import { useHistory } from "react-router-dom";
import {
  PlusCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GoogleOutlined,
  LockOutlined,
} from "@ant-design/icons";
import "./Login.css";
import axios from "axios";
import { actions, GlobalContext } from "../../App";
import apiList from "../../lib/apiList";
const GoogleLoginPanel = lazy(() => import("./GoogleLoginPanel"));
const Login = (props) => {
  const [formStatus, setFormStatus] = useState("idle");
  const [formError, setFormError] = useState("");
  const { dispatch } = useContext(GlobalContext);
  const history = useHistory();
  useEffect(() => {
    if (props.user && formStatus === "idle") {
      history.push("/leaderboard");
    }
  }, [props.user, history, formStatus]);
  const onFinish = async (values) => {
    try {
      //console.log({ values });
      setFormStatus("loading");
      setFormError("");

      const { data } = await axios.post(apiList.login, values, { timeout: 15000 });
      if (data.auth !== true || !data.user?._doc?._id) {
        setFormStatus("failed");
        setFormError(data.message || "Username or password is incorrect.");
        return;
      }

      window.sessionStorage.setItem("currentUser", JSON.stringify(data.user));
      setFormStatus("success");
      props.setUser(data.user);

      dispatch({ type: actions.SET_USER, payload: { user: data.user._doc } });

      history.push("/");
    } catch (error) {
      setFormStatus("failed");
      setFormError(error.response?.data?.message || (error.request ? "Cannot reach the server. Please try again." : "Sign-in failed. Please try again."));
    }

    // axios.get("http://localhost:5000").then((data) => {});

    // post data
    // fetch("https://localhost:5000/user/login", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(values),
    // })
    //   .then((res) => res.json())
    //   .then((data) => {
    //     if (data.auth) {
    //       setFormcStatus("success");
    //       props.setUser(data.user);
    //       try {
    //         window.sessionStorage.setItem(
    //           "currentUser",
    //           JSON.stringify(data.user)
    //         );
    //       } catch {
    //         // console.log("session storage error");
    //       }
    //       history.push("/");
    //     } else {
    //       setFormStatus("failed");
    //     }
    //   })
    //   .catch((err) => {
    //     setFormStatus("failed");
    //     // console.log(err);
    //   });
  };
  const buttonValues = {
    idle: {
      text: "Log In",
      loading: false,
      icon: <PlusCircleOutlined />,
    },
    loading: { text: "Logging In", loading: true, icon: null },
    success: {
      text: "You are now logged in",
      loading: false,
      icon: <CheckCircleOutlined />,
    },
    failed: {
      text: "Login Failed",
      loading: false,
      icon: <CloseCircleOutlined />,
    },
  };


  const PasswordLogin = () => {
    return (
      <Form name="login" onFinish={onFinish} layout="vertical" size="large">
        <h1>Log In</h1>
        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: "Please input a username." }]}
        >
          <Input className="auth-input" placeholder="Enter your username" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please input a password." }]}
        >
          <Input.Password
            className="auth-input"
            placeholder="Enter your password"
          />
        </Form.Item>

        {formError && <p role="alert">{formError}</p>}
        <Button
          htmlType="submit"
          type="primary"
          loading={buttonValues[formStatus].loading}
          icon={buttonValues[formStatus].icon}
          className="btn btn-primary"
        >
          {buttonValues[formStatus].text}
        </Button>
      </Form>
    );
  };

  const WeChatLogin = () => {
    return (
      <div className="wechat-login-container">
        <div className="qrcode-container">
          {/* <WechatOutlined className="wechat-icon" /> */}
          <div className="qrcode-wrapper">
            <div className="qrcode-placeholder">
              {/* Add your QR code component here */}
              <span>WeChat QR Code</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="login-container">
      <Tabs
        defaultActiveKey="password"
        centered
        items={[
          {
            key: 'password',
            label: (
              <span>
                <LockOutlined /> Password Login
              </span>
            ),
            children: (
              <>
                {PasswordLogin()}
                <p className="form-text">
                  Don't have an account yet?{" "}
                  <span 
                    onClick={() => history.push("/signup")} 
                    className="form-link"
                    style={{ cursor: 'pointer' }}
                  >
                    Sign up now
                  </span>
                </p>
              </>
            ),
          },
          {
            key: 'google',
            label: (
              <span>
                <GoogleOutlined /> Google Login
              </span>
            ),
            children: <Suspense fallback={<p>Loading Google sign-in...</p>}><GoogleLoginPanel setUser={props.setUser} setFormStatus={setFormStatus} /></Suspense>,
          },
        ]}
      />
    </div>
  );
};

export default Login;
