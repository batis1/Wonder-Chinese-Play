import { Link } from "react-router-dom";
import "./LogoStyle.css";

const Logo = () => {
  return (
    <div className="logoStyle">
      <Link to="/">
        <span className="mainLogo">W</span><span className="subLogoHSK">HSK</span>
      </Link>
    </div>
  );
};

export default Logo;
