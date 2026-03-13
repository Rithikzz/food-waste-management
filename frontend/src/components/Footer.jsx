import { Link } from 'react-router-dom';
import { FaLeaf, FaHeart } from 'react-icons/fa';

const LINKS = [
  { to: '/',           label: 'Home' },
  { to: '/donate',     label: 'Donate Food' },
  { to: '/donations',  label: 'Browse Donations' },
  { to: '/volunteer',  label: 'Volunteer' },
  { to: '/admin',      label: 'Admin' },
];

const Footer = () => (
  <footer className="bg-gray-900 text-gray-300 mt-auto">
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FaLeaf className="text-green-400 text-xl" />
            <span className="text-white font-bold text-lg">FoodShare</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Bridging surplus food with those in need.
            Reduce waste, feed communities, track every meal.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <p className="text-white font-semibold mb-3 text-xs uppercase tracking-widest">
            Quick Links
          </p>
          <ul className="space-y-2 text-sm">
            {LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="hover:text-green-400 transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Mission */}
        <div>
          <p className="text-white font-semibold mb-3 text-xs uppercase tracking-widest">
            Our Mission
          </p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>🌱 Zero food to landfill</li>
            <li>🤝 Donors · NGOs · Volunteers</li>
            <li>🚚 End-to-end delivery tracking</li>
            <li>📊 Real-time environmental impact</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
        <p>© {new Date().getFullYear()} FoodShare — Food Waste Management System</p>
        <p className="flex items-center gap-1">
          Made with <FaHeart className="text-red-400 mx-1" /> to fight food waste
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
