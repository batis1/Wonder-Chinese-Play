import React, { useState, useEffect, useContext } from "react";
// import "antd/dist/antd.css";
import "antd/dist/reset.css";
// import { Upload } from "antd";
// import ImgCrop from "antd-img-crop";
import { Form, Input,Button } from "antd";
import { useHistory } from "react-router-dom";
import {GlobalContext } from "../../App";
// import {
//   PlusCircleOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
// } from "@ant-design/icons";
import "../Signup/Signup.css";
// import { FormProvider } from "antd/lib/form/context";
import axios from "axios";
// import useLocalStorage from "use-local-storage";
import apiList from "../../lib/apiList";
// import AppUpload from "../Avatar/AppUpload";

const TutorDashboard = () => {
  const [userInfo, setUserInfo] = useState({});

  const {
    state: { user }
  } = useContext(GlobalContext);

  const history = useHistory();

  console.log({ user });

  useEffect(() => {
    if (!user) {
      history.push("/login");
    } else {
      (async () => {
        try {
          const { data } = await axios.get(
            `${apiList.tutor}?userId=${user._id}`
          );

          if (data.docs.length === 0) history.push("/tutor");
          setUserInfo(data.docs[0]);
        } catch (error) {
          console.log(error);
        }
      })();
    }
  }, [user, history, user?._id]);

  return (
    <div>
      <h1 className="text-center"> Tutor Dashboard</h1>

      <div className="signup-container">
        <Form name="signup" layout="vertical" size="large">
          <Form.Item
            label="HSK Level"
            rules={[{ required: true, message: "Please input HSk Level." }]}
          >
            <Input
              // defaultValue={userInfo.username}
              className="form-input"
              placeholder="Enter a HSk Level"
              onChange={(e) =>
                setUserInfo((oldUserInfo) => ({
                  ...oldUserInfo,
                  hskLevel: e.target.value,
                }))
              }
              value={userInfo.hskLevel}
            />
          </Form.Item>
          <Form.Item
            label="Educational background"
            // name="Educational"
            rules={[
              {
                required: true,
                message: "A valid Info is required to become a tutor.",
              },
            ]}
          >
            <Input
              // defaultValue={user.email}
              value={userInfo.educationalBackground}
              className="form-input"
              placeholder="Enter your Educational background"
              onChange={(e) =>
                setUserInfo((oldUserInfo) => ({
                  ...oldUserInfo,
                  educationalBackground: e.target.value,
                }))
              }
              //   value={user.email}
            />
          </Form.Item>
          <Form.Item
            label="Teaching period"
            // name="duration"
            rules={[
              {
                required: true,
                message: "A valid Info is required to become a tutor.",
              },
            ]}
          >
            <Input
              className="form-input"
              placeholder="Enter your teaching duration "
              onChange={(e) =>
                setUserInfo((oldUserInfo) => ({
                  ...oldUserInfo,
                  teachingPeriod: e.target.value,
                }))
              }
              value={userInfo.teachingPeriod}

              //   value={user.email}
            />
          </Form.Item>
          <Form.Item
            label="Teaching time"
            // name="duration"
            rules={[
              {
                required: true,
                message: "A valid Info is required to become a tutor.",
              },
            ]}
          >
            <Input
              // defaultValue={user.email}
              className="form-input"
              placeholder="Enter your teaching time"
              onChange={(e) =>
                setUserInfo((oldUserInfo) => ({
                  ...oldUserInfo,
                  teachingTime: e.target.value,
                }))
              }
              value={userInfo.teachingTime}
            />
          </Form.Item>
          <span style={{ color: "white" }}>Admin Response status</span>
          <Form.Item
            label="More Info"
            // name="more"
            rules={[
              {
                required: true,
                message: "A valid Info is required to become a tutor.",
              },
            ]}
          >
            <Input
              // defaultValue={user.email}
              className="form-input"
              placeholder="Enter more Info .."
              onChange={(e) =>
                setUserInfo((oldUserInfo) => ({
                  ...oldUserInfo,
                  moreInfo: e.target.value,
                }))
              }
              value={userInfo.moreInfo}

              //   value={user.email}
            />
          </Form.Item>
          <Form.Item
            label="Zoom's room ID"
            // name="zoom"/
            rules={[
              {
                required: true,
                message: "A valid Info is required to become a tutor.",
              },
            ]}
          >
            <Input
              // defaultValue={user.email}
              className="form-input"
              placeholder="Enter your zoom's meeting room ID"
              onChange={(e) =>
                setUserInfo((oldUserInfo) => ({
                  ...oldUserInfo,
                  zoomRoomID: e.target.value,
                }))
              }
              value={userInfo.zoomRoomID}
            />
          </Form.Item>

          {/* <Form.Item label="Password" name="password" rules={[{}]}>
            <Input.Password
              className="form-input"
              placeholder="Enter a password"
            />
          </Form.Item>
          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            rules={[{}]}
          >
            <Input.Password
              className="form-input"
              placeholder="Re-enter your password"
            />
          </Form.Item> */}
          <div className="tutor-dashboard-operation">
            <Button
              htmlType="submit"
              type="primary"
              // loading={buttonValues[formStatus].loading}
              // icon={buttonValues[formStatus].icon}
              className="btn btn-primary"
              // onClick={handleUpdate}
            >
              {/* {buttonValues[formStatus].text} */}
            </Button>
            <Button
              htmlType="submit"
              type="primary"
              // loading={buttonValues[formStatus].loading}
              // icon={buttonValues[formStatus].icon}
              className="btn btn-primary"
              // onClick={handleDelete}
              style={{ backgroundColor: "red" }}
            >
              Delete
              {/* {buttonValues[formStatus].text} */}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default TutorDashboard;
