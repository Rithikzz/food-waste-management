// Home.jsx – Landing page with hero section, feature highlights, and CTAs
import { Link } from "react-router-dom";
import {
  FaLeaf,
  FaHandsHelping,
  FaRecycle,
  FaUsers,
  FaChartBar,
  FaArrowRight,
} from "react-icons/fa";
import { useDonations } from "../context/DonationContext";

// Individual feature card component
const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center text-center gap-3 hover:shadow-lg transition-shadow border border-gray-100">
    <div className="text-4xl text-green-500">{icon}</div>
    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    <p className="text-sm text-gray-500">{desc}</p>
  </div>
);

// Small stat badge shown in hero
const StatBadge = ({ value, label }) => (
  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3 text-center text-white">
    <p className="text-3xl font-bold">{value}</p>
    <p className="text-xs mt-1 opacity-90">{label}</p>
  </div>
);

const Home = () => {
  const { stats } = useDonations();

  return (
    <div className="flex flex-col">
      {/* ── Hero Section ── */}
      <section className="bg-gradient-to-br from-green-700 to-green-500 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <FaLeaf className="text-green-200 text-6xl animate-bounce" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-5">
            Food Waste Management System
          </h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Every year, millions of tons of food go to waste while people go
            hungry. Our platform bridges the gap — connecting generous donors
            with volunteers who ensure surplus food reaches those in need.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/donate"
              className="flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-3 rounded-full hover:bg-green-50 active:scale-95 transition-all shadow-lg text-base"
            >
              <FaHandsHelping /> Donate Food
            </Link>
            <Link
              to="/donations"
              className="flex items-center gap-2 bg-transparent border-2 border-white text-white font-bold px-8 py-3 rounded-full hover:bg-white/20 active:scale-95 transition-all text-base"
            >
              <FaArrowRight /> View Donations
            </Link>
          </div>

          {/* Live Stats */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <StatBadge value={stats.total} label="Total Donations" />
            <StatBadge value={stats.accepted} label="Accepted" />
            <StatBadge value={stats.delivered} label="Delivered" />
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
            How It Works
          </h2>
          <p className="text-center text-gray-500 mb-10">
            Three simple steps to reduce food waste in your community
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Donors Submit",
                desc: "Food donors fill in a quick form with food details, quantity, and pickup time.",
                color: "bg-green-500",
              },
              {
                step: "02",
                title: "Volunteers Accept",
                desc: "Volunteers browse available donations and accept the ones they can collect.",
                color: "bg-blue-500",
              },
              {
                step: "03",
                title: "Food Delivered",
                desc: "Food is picked up and delivered to shelters, needy families, or community centres.",
                color: "bg-orange-500",
              },
            ].map(({ step, title, desc, color }) => (
              <div
                key={step}
                className="bg-white rounded-2xl shadow p-6 border border-gray-100 flex flex-col gap-3 hover:shadow-lg transition-shadow"
              >
                <div
                  className={`${color} text-white text-lg font-bold w-10 h-10 flex items-center justify-center rounded-full`}
                >
                  {step}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
            Platform Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<FaHandsHelping />}
              title="Easy Donation"
              desc="Submit food details in under 2 minutes with our clean form."
            />
            <FeatureCard
              icon={<FaRecycle />}
              title="Reduce Waste"
              desc="Ensure surplus food finds a home instead of a landfill."
            />
            <FeatureCard
              icon={<FaUsers />}
              title="Volunteer Network"
              desc="A growing team of volunteers ready to pick up and deliver."
            />
            <FeatureCard
              icon={<FaChartBar />}
              title="Live Dashboard"
              desc="Track total, accepted, and delivered donations in real time."
            />
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-green-600 text-white py-16 px-4 text-center">
        <h2 className="text-3xl font-bold mb-3">Ready to Make a Difference?</h2>
        <p className="text-green-100 mb-8 max-w-xl mx-auto">
          Join hundreds of donors and volunteers who are already fighting food
          waste in their communities.
        </p>
        <Link
          to="/donate"
          className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-10 py-3 rounded-full hover:bg-green-50 transition-all shadow-lg active:scale-95"
        >
          <FaLeaf /> Get Started
        </Link>
      </section>
    </div>
  );
};

export default Home;
