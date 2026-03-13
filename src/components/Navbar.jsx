// Navbar.jsx – Responsive top navigation bar with auth state
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaLeaf, FaBars, FaTimes, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const ROLE_BADGE = {
  donor:     "bg-green-200 text-green-800",
  ngo:       "bg-blue-200 text-blue-800",
  volunteer: "bg-purple-200 text-purple-800",
  admin:     "bg-red-200 text-red-800",
};

const links = [
  { to: "/",          label: "Home",      roles: null },
  { to: "/donate",    label: "Donate",    roles: ["donor"] },
  { to: "/donations", label: "Donations", roles: ["donor", "ngo", "admin"] },
  { to: "/volunteer", label: "Volunteer", roles: ["volunteer"] },
  { to: "/admin",     label: "Admin",     roles: ["admin"] },
];

const Navbar = () => {
  const [open, setOpen]   = useState(false);
  const { user, logout }  = useAuth();
  const navigate          = useNavigate();

  const visibleLinks = links.filter(
    (l) => !l.roles || (user && l.roles.includes(user.role))
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-green-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-wide">
          <FaLeaf className="text-green-300 text-2xl" />
          <span>FoodShare</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex gap-6 text-sm font-medium">
          {visibleLinks.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `hover:text-green-300 transition-colors pb-1 ${
                    isActive ? "text-green-300 border-b-2 border-green-300" : ""
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Auth section — desktop */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <FaUserCircle className="text-green-300 text-lg" />
                <span className="text-green-100 font-medium">{user.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ROLE_BADGE[user.role]}`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm text-green-200 hover:text-white transition-colors"
                title="Log out"
              >
                <FaSignOutAlt /> Logout
              </button>
            </>
          ) : (
            <Link to="/login"
              className="bg-white text-green-700 font-semibold text-sm px-4 py-1.5 rounded-lg hover:bg-green-50 transition-all">
              Log In
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-xl"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-green-800 px-4 pb-4 space-y-3 text-sm font-medium">
          <ul className="space-y-3 pt-2">
            {visibleLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block py-1 hover:text-green-300 transition-colors ${
                      isActive ? "text-green-300" : ""
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="border-t border-green-700 pt-3">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaUserCircle className="text-green-300" />
                  <span className="text-green-100 text-sm">{user.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ROLE_BADGE[user.role]}`}>
                    {user.role}
                  </span>
                </div>
                <button onClick={() => { handleLogout(); setOpen(false); }}
                  className="text-green-300 hover:text-white text-sm flex items-center gap-1">
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)}
                className="block text-center bg-white text-green-700 font-semibold px-4 py-2 rounded-lg hover:bg-green-50 transition-all">
                Log In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
