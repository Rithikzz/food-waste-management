// Footer.jsx – Site footer with links and copyright
import { FaLeaf, FaGithub, FaEnvelope } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-green-800 text-green-100 mt-auto">
    <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Brand */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FaLeaf className="text-green-300 text-2xl" />
          <span className="text-xl font-bold text-white">FoodShare</span>
        </div>
        <p className="text-sm text-green-300 leading-relaxed">
          Connecting donors, volunteers, and communities to reduce food waste
          and fight hunger — one meal at a time.
        </p>
      </div>

      {/* Quick links */}
      <div>
        <h4 className="text-white font-semibold mb-3">Quick Links</h4>
        <ul className="space-y-2 text-sm">
          {[
            { to: "/donate", label: "Donate Food" },
            { to: "/donations", label: "View Donations" },
            { to: "/volunteer", label: "Volunteer" },
            { to: "/admin", label: "Admin Dashboard" },
          ].map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className="hover:text-green-300 transition-colors"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Contact */}
      <div>
        <h4 className="text-white font-semibold mb-3">Contact</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <FaEnvelope className="text-green-300" />
            <span>contact@foodshare.org</span>
          </li>
          <li className="flex items-center gap-2">
            <FaGithub className="text-green-300" />
            <span>github.com/foodshare</span>
          </li>
        </ul>
      </div>
    </div>

    <div className="border-t border-green-700 text-center py-4 text-xs text-green-400">
      © {new Date().getFullYear()} Food Waste Management System — College Mini
      Project
    </div>
  </footer>
);

export default Footer;
