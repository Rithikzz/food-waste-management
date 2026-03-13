import { Link } from 'react-router-dom';
import { FaLeaf, FaHandHoldingHeart, FaTruck, FaChartBar, FaRecycle, FaUsers } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: <FaHandHoldingHeart />, color: 'green',  title: 'Easy Donation',      desc: 'Submit surplus food in seconds. Fill in type, quantity, and pickup details.' },
  { icon: <FaTruck />,            color: 'blue',   title: 'End-to-End Tracking', desc: 'Follow every donation — Available → Accepted → Picked Up → Delivered.' },
  { icon: <FaUsers />,            color: 'purple', title: 'Volunteer Network',   desc: 'Dedicated volunteers ensure timely pickups and last-mile delivery.' },
  { icon: <FaRecycle />,          color: 'orange', title: 'Zero Food Waste',     desc: 'Redirect surplus food to NGOs before it reaches the landfill.' },
  { icon: <FaChartBar />,         color: 'red',    title: 'Impact Analytics',    desc: 'Real-time stats on meals saved, CO₂ avoided, and communities served.' },
  { icon: <FaLeaf />,             color: 'green',  title: 'Environmental Impact', desc: 'Track tonnes of food saved and carbon emissions avoided.' },
];

const COLOR_MAP = {
  green:  'bg-green-50  text-green-600  border-green-100',
  blue:   'bg-blue-50   text-blue-600   border-blue-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  orange: 'bg-orange-50 text-orange-600 border-orange-100',
  red:    'bg-red-50    text-red-500    border-red-100',
};

const STEPS = [
  { step: '01', title: 'Donors List Food',     desc: 'Register and post surplus food with pickup details.' },
  { step: '02', title: 'NGOs Accept',           desc: 'Nearby NGOs browse and accept available donations.' },
  { step: '03', title: 'Volunteers Deliver',    desc: 'Trained volunteers pick up and deliver to those in need.' },
  { step: '04', title: 'Impact Tracked',        desc: 'Every meal saved is logged and visible on the admin dashboard.' },
];

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 to-green-800 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 0), radial-gradient(circle at 80% 20%, white 1px, transparent 0)', backgroundSize: '60px 60px' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <FaLeaf className="text-green-300" /> Fighting food waste, one meal at a time
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Don't Waste Food.<br />
            <span className="text-green-300">Share It.</span>
          </h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto mb-10">
            FoodShare connects food donors with NGOs and volunteers to ensure surplus meals
            reach people who need them — reducing waste and building community.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {user ? (
              <Link to="/donate" className="bg-white text-green-700 font-bold px-8 py-3 rounded-xl hover:bg-green-50 transition-colors shadow-lg">
                Donate Food Now
              </Link>
            ) : (
              <>
                <Link to="/register" className="bg-white text-green-700 font-bold px-8 py-3 rounded-xl hover:bg-green-50 transition-colors shadow-lg">
                  Get Started Free
                </Link>
                <Link to="/donations" className="border-2 border-white/60 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors">
                  Browse Donations
                </Link>
              </>
            )}
          </div>

          {/* Stat bar */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto text-center">
            {[['10K+', 'Meals Saved'], ['500+', 'Volunteers'], ['200+', 'NGOs Served']].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="text-3xl font-extrabold">{val}</p>
                <p className="text-green-200 text-xs mt-1">{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="page-container">
        <div className="text-center mb-12">
          <h2 className="section-title">Everything You Need</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">
            A complete platform to manage the entire lifecycle of food donation.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon, color, title, desc }) => (
            <div key={title} className={`rounded-2xl border p-6 flex gap-4 items-start ${COLOR_MAP[color]}`}>
              <div className="text-2xl shrink-0 mt-0.5">{icon}</div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold">How It Works</h2>
            <p className="text-gray-400 mt-2">Four simple steps to fight food waste.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <p className="text-4xl font-extrabold text-green-500 mb-3">{step}</p>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="page-container text-center">
          <div className="bg-green-50 border border-green-100 rounded-3xl p-12">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-4">Ready to make a difference?</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Join thousands of donors, NGOs, and volunteers already using FoodShare.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/register" className="btn-primary">Create Account</Link>
              <Link to="/login"    className="btn-secondary">Sign In</Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
