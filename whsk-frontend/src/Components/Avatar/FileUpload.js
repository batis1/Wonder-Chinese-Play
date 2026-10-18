import React, { Fragment, useState } from "react";
import axios from "axios";
import apiList, { server } from "../../lib/apiList";

const FileUpload = ({ setInput, /* input */ }) => {
  const [file, setFile] = useState("");
  const [filename, setFilename] = useState("Choose File");
  const [uploadedFile, setUploadedFile] = useState({});
  // const [message, setMessage] = useState("");
  // const [uploadPercentage, setUploadPercentage] = useState(0);

  const onChange = (e) => {
    e.preventDefault();

    setFile(e.target.files[0]);
    setFilename(e.target.files[0].name);
  };

  const onSubmit = async (e) => {
    // e.stopPropagation();
    // e.nativeEvent.stopImmediatePropagation();
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(apiList.upload, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // Clear percentage
      // setTimeout(() => setUploadPercentage(0), 10000);
      const { fileName, filePath } = res.data;
      setInput(filePath);
      setUploadedFile({ fileName, filePath });
      // setMessage("File Uploaded");
    } catch (err) {
      //console.log("here");
      if (err.response.status === 500) {
        //console.log("There was a problem with the server");
      } else {
        //console.log(err.response.data.msg);
      }
      // setUploadPercentage(0);
    }
  };

  return (
    <>
      {/* {message ? <Message msg={message} /> : null} */}
      <div>
        <div className="custom-file mb-4">
          <input
            type="file"
            className="custom-file-input"
            id="customFile"
            onChange={onChange}
          />
          <label className="custom-file-label" htmlFor="customFile">
            {filename}
          </label>
        </div>

        {/* <Progress percentage={uploadPercentage} /> */}

        <button
          type="button"
          onClick={onSubmit}
          // value=
          className="btn btn-primary btn-block mt-4"
          style={{ width: "12rem", marginLeft: "21rem" }}
        >
          Upload
        </button>
      </div>
      {uploadedFile ? (
        <div className="row mt-5">
          <div className="col-md-6 m-auto">
            {/* <h3 className="text-center">{uploadedFile.fileName}</h3> */}
            <img
              style={{ width: "100%" }}
              src={`${server}/${uploadedFile.filePath}`}
              alt=""
            />
          </div>
        </div>
      ) : null}
    </>
  );
};

export default FileUpload;
