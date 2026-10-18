import { useState, useContext } from "react";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";
import { NavLink } from "react-router-dom";
import "./Navbar.css";
// import { Input } from "antd";
import { actions, GlobalContext } from "../../App";
import Logo from "../Logo/Logo";
import { preloadRoute } from "../../lib/routePreload";

const Navbar = ({ user, setUser }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { dispatch } = useContext(GlobalContext);


  const handleToggle = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const currentUser = user;
  const preloadLink = event => {
    const link = event.target.closest('a[href]');
    if (link) preloadRoute(link.getAttribute('href'));
  };

  return (
    <header>
      <Logo className="app-logo" />
      <nav className="navbar" onPointerOver={preloadLink} onFocus={preloadLink}>
        <button onClick={handleToggle}>
          {menuOpen ? (
            <CloseOutlined className="navbar-icon" />
          ) : (
            <MenuOutlined className="navbar-icon" />
          )}
        </button>
        <div className={`menuNav ${menuOpen ? "showMenu" : ""}`}>
          <NavLink
            exact
            to="/"
            className="navbar-item"
            activeClassName="navbar-selected"
            onClick={closeMenu}
          >
            Home
          </NavLink>
          {currentUser && (
            <>
              <NavLink
                to="/quiz"
                className="navbar-item"
                activeClassName="navbar-selected"
                onClick={closeMenu}
              >
                Game
              </NavLink>
              <NavLink
                to="/tutorial"
                className="navbar-item"
                activeClassName="navbar-selected"
                onClick={closeMenu}
              >
                Tutorial
              </NavLink>
            </>
          )}
          <NavLink
            to="/leaderboard"
            className="navbar-item"
            activeClassName="navbar-selected"
            onClick={closeMenu}
          >
            Score board
          </NavLink>
          {/* {currentUser && (
            <NavLink
              to="/hskOcR"
              className="navbar-item"
              activeClassName="navbar-selected"
              onClick={closeMenu}
            >
              HSK OCR
            </NavLink>
          )} */}
          {/* <NavLink
            to="/hskGen"
            className="navbar-item"
            activeClassName="navbar-selected"
            onClick={closeMenu}
          >
            HSK GEN
          </NavLink> */}
          {/* <NavLink
            to="/howtoplay"
            className="navbar-item"
            activeClassName="navbar-selected"
            onClick={closeMenu}
          >
            HELP
          </NavLink> */}
          
          {currentUser && (
            <NavLink
              to="/Profile"
              className="navbar-item"
              activeClassName="navbar-selected"
              onClick={closeMenu}
            >
              PROFILE
            </NavLink>
          )}

          {!currentUser ? (
            <NavLink
              to="/login"
              className="navbar-item"
              activeClassName="navbar-selected"
              onClick={closeMenu}
            >
              Log In
            </NavLink>
          ) : (
            <NavLink
              to="/"
              className="navbar-item"
              activeClassName="navbar-selected"
              onClick={() => {
                closeMenu();
                setUser(null);
                sessionStorage.clear();
                dispatch({
                  type: actions.SET_USER,
                  payload: { user: null },
                });
              }}
            >
              Log Out
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
