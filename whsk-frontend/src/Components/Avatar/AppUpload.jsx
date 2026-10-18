import React from "react";
import FileUpload from "./FileUpload";
// import FileUpload from "./components/FileUpload";
// import "./App.css";

const AppUpload = ({ setInput, input }) => (
  <div className="container mt-4">
    {/* <h4 className="display-4 text-center mb-4">
      <i className="fab fa-react" /> React File Upload
    </h4> */}

    <FileUpload setInput={setInput} input={input} />
  </div>
);

export default AppUpload;
