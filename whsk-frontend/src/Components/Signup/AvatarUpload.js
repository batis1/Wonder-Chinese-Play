import { Upload, message } from "antd";
import { useState } from "react";
import {
  // CheckCircleOutlined,
  CheckOutlined,
  // LoadingOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import axios from "axios";
import apiList from "../../lib/apiList";

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result));
  reader.readAsDataURL(img);
}

async function beforeUpload(
  file,
  setImageSelected,
  setAvatarImg,
  // setImagePath
) {
  const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
  if (!isJpgOrPng) {
    message.error("You can only upload JPG/PNG file!");
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error("Image must smaller than 2MB!");
  }
  console.log("this is the file", file);
  getBase64(file, (result) => {
    console.log("base64");
    console.log(result);
    if (isJpgOrPng && isLt2M) {
      setImageSelected(true);
      setAvatarImg(result);
    }
  });

  return false;
}

const AvatarUpload = ({ avatarImg, setAvatarImg, setImagePath }) => {
  // const [isLoading, setIsLoading] = useState(false);
  const [imageSelected, setImageSelected] = useState(false);

  const uploadButton = (
    <div>
      {imageSelected ? <CheckOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>{imageSelected ? "done" : "upload"}</div>
    </div>
  );

  const submit = async (e) => {
    console.log(e);
    const formData = new FormData();
    try {
      formData.append("files", e.fileList[0]);
      const res = await axios.post(apiList.upload, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      debugger;

      const {filePath } = res.data;
      setImagePath(filePath);
    } catch (error) {
      console.log(error);
    }
  };
  console.log(imageSelected);
  return (
    <Upload
      name="avatar"
      listType="picture-card"
      className="avatarImg-uploader"
      beforeUpload={(file) =>
        beforeUpload(file, setImageSelected, setAvatarImg, setImagePath)
      }
      // onChange={(e) => submit(e)}
      customRequest={(e) => submit(e)}
    >
      {uploadButton}
    </Upload>
  );
};

export default AvatarUpload;
