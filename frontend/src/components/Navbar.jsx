import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaLeaf, FaBars, FaTimes, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/',           label: 'Home',       public: true  },
  { to: '/donate',     label: 'Donate',     roles: ['donor'] },
  { to: '/donations',  label: 'Donations',  public: true  },
  { to: '/volunteer',  label: 'Volunteer',  roles: ['volunteer'] },
  { to: '/admin',      label: 'Admin',      roles: ['admin'] },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const visibleLinks = NAV_LINKS.filter(
    (l) => l.public || (user && (!l.roles || l.roles.includes(user.role)))
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
    setOpen(false);
  };

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
    }`;

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <FaLeaf className="text-green-600 text-xl" />
          <span className="font-extrabold text-gray-800 text-lg">FoodShare</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7">
          {visibleLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <FaUser className="text-xs" />
                {user.name ?? user.email}
              </span>
              <button onClick={handleLogout} className="btn-secondary text-sm flex items-center gap-1.5">
                <FaSignOutAlt /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn-secondary text-sm">Login</Link>
              <Link to="/register" className="btn-primary  text-sm">Register</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 flex flex-col gap-3 animate-fade-in">
          {visibleLinks.map((l) => (
            <NavLink
              key={l.to} to={l.to} end={l.to === '/'}
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
          <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
            {user ? (
              <>
                <p className="text-xs text-gray-400 flex items-center gap-1"><FaUser />{user.name ?? user.email}</p>
                <button onClick={handleLogout} className="btn-secondary text-sm text-left flex items-center gap-1.5">
                  <FaSignOutAlt /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-secondary text-sm text-center" onClick={() => setOpen(false)}>Login</Link>
                <Link to="/register" className="btn-primary  text-sm text-center" onClick={() => setOpen(false)}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
