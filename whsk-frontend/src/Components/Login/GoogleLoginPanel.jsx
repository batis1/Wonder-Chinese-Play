import React, { useContext } from "react";
import { Modal } from "antd";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useHistory } from "react-router-dom";
import { GlobalContext } from "../../App";
import SelectHSKLevel from "../SelectHSKLevel/SelectHSKLevel";

export default function GoogleLoginPanel({ setUser, setFormStatus }) {
  const { dispatch } = useContext(GlobalContext);
  const history = useHistory();
  const handleSuccess = credentialResponse => {
    try {
      setFormStatus("loading");
      Modal.info({
        title: <div style={{ fontWeight: "800", fontSize: "2.0rem", lineHeight: "1.2", background: "linear-gradient(45deg, #e67329, #ff944d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textShadow: "none", textAlign: "center" }}>Select HSK Level</div>,
        content: <SelectHSKLevel googleCredential={credentialResponse.credential} dispatch={dispatch} history={history} setUser={setUser} />,
        footer: null, closable: false, maskClosable: false, width: 500,
        className: "hsk-level-modal", icon: null, centered: true
      });
    } catch { setFormStatus("failed"); }
  };
  return <div className="google-login-container"><GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
    <GoogleLogin onSuccess={handleSuccess} onError={() => setFormStatus("failed")} theme="filled_black" size="large" text="continue_with" useOneTap={false} />
  </GoogleOAuthProvider></div>;
}
