import React, { memo } from "react";
import { Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import "./Avatar.css";

const UserAvatar = (props) => {
  return (
    <Avatar
      size={props.size || 64}
      icon={<UserOutlined />}
    />
  );
};
export default memo(UserAvatar);
