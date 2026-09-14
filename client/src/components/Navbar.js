import React, { useContext, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FaSignOutAlt, FaUser } from "react-icons/fa";
import { GiThink } from "react-icons/gi";

const navLinkClass = ({ isActive }) => (isActive ? "active" : "");

export const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => setShowLogoutModal(true);
  const closeLogoutModal = () => setShowLogoutModal(false);

  const handleLogoutSubmit = () => {
    closeLogoutModal();
    logout();
    navigate("/login");
  };

  const isInterviewer = user?.roles?.includes("interviewer");

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <GiThink size={28} />
          <span>Interview Scheduling</span>
        </Link>

        <ul className="navbar-menu">
          {user ? (
            <>
              <li>
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/find-slots" className={navLinkClass}>
                  Find Slots
                </NavLink>
              </li>
              {isInterviewer && (
                <li>
                  <NavLink to="/manage-slots" className={navLinkClass}>
                    Manage Slots
                  </NavLink>
                </li>
              )}
              <li>
                <NavLink
                  to={`/profile/${user.id}`}
                  title="My Profile"
                  className={navLinkClass}
                >
                  <FaUser /> {user.name}
                </NavLink>
              </li>
              <li>
                <button onClick={handleLogout} className="logout-btn">
                  <FaSignOutAlt /> Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/login" className={navLinkClass}>
                  Login
                </NavLink>
              </li>
              <li>
                <NavLink to="/register" className={navLinkClass}>
                  Register
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </div>

      {showLogoutModal && (
        <div className="logout-modal-backdrop" onClick={closeLogoutModal}>
          <div
            className="logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="logout-modal-title">Confirm sign out</h2>
            <p>Are you sure you want to logout?</p>

            <div className="logout-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={handleLogoutSubmit}>
                <FaSignOutAlt /> Logout
              </button>
              <button type="button" className="btn btn-outline" onClick={closeLogoutModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
