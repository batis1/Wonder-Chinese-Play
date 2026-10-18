import { Image, Input } from "antd";
import TextArea from "antd/lib/input/TextArea";
import React from "react";

export const WritingSecondQ = () => {
  const { TextArea } = Input;
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          width={200}
          // style={{ marginRight: "50px" }}
          src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png"
        />
        <TextArea
          showCount
          maxLength={100}
          style={{
            height: 120,
            width: "300px",
            marginLeft: "20px",
          }}
          onChange={(e) => {
            // console.log("Change:", e.target.value);
          }}
        />
      </div>
    </div>
  );
};
