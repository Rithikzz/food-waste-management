import { useState } from 'react';
import { FaLeaf, FaCheckCircle, FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa';
import DonationForm from '../components/DonationForm';
import FreshnessBar from '../components/FreshnessBar';

const DonateFoodPage = () => {
  const [result, setResult] = useState(null); // { donation, freshnessLabel, isUrgentPickup, suggestedNgos }

  const handleSuccess = (data) => {
    setResult(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-container max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
            <FaLeaf className="text-white" />
          </div>
          <h1 className="section-title">Donate Food</h1>
        </div>
        <p className="text-gray-500">
          List your surplus food so nearby NGOs and volunteers can pick it up before it goes to waste.
        </p>
      </div>

      {result ? (
        <div className="space-y-5 animate-fade-in">
          {/* Success Banner */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-3">
            <FaCheckCircle className="text-green-600 text-xl shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-green-800 text-lg">Donation submitted! 🎉</p>
              <p className="text-sm text-green-700 mt-0.5">
                <strong>{result.donation?.foodName}</strong> —{' '}
                {result.donation?.quantity?.value} {result.donation?.quantity?.unit} listed successfully.
              </p>
            </div>
          </div>

          {/* Freshness Score */}
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-3">Food Freshness Score</h3>
            <FreshnessBar score={result.donation?.freshnessScore ?? 100} />
            {result.isUrgentPickup && (
              <p className="text-xs text-red-600 mt-2 font-medium">
                ⚡ This donation is marked as <strong>Urgent Pickup</strong> — NGOs will be prioritised to collect it immediately.
              </p>
            )}
          </div>

          {/* Suggested NGOs */}
          {result.suggestedNgos?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-1">🏢 Nearest NGOs Notified</h3>
              <p className="text-xs text-gray-400 mb-4">
                These NGOs are closest to your pickup location and will see your donation first.
              </p>
              <div className="space-y-3">
                {result.suggestedNgos.slice(0, 3).map((ngo, i) => (
                  <div
                    key={ngo._id}
                    className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border ${
                      i === 0 ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        i === 0 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">
                          {ngo.ngoProfile?.ngoName ?? ngo.name}
                          {i === 0 && <span className="ml-2 text-xs text-green-600 font-normal">Nearest</span>}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-gray-500">
                          <FaMapMarkerAlt className="text-red-400" />
                          {ngo.distanceKm?.toFixed(1) ?? '—'} km away
                        </p>
                      </div>
                    </div>
                    {ngo.phone && (
                      <a href={`tel:${ngo.phone}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <FaPhoneAlt /> {ngo.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.suggestedNgos?.length === 0 && (
            <div className="card text-center py-6 text-gray-400">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-sm">No NGOs found within 20km. Add GPS coordinates to get NGO suggestions.</p>
            </div>
          )}

          <button
            onClick={() => setResult(null)}
            className="btn-primary w-full"
          >
            + Submit Another Donation
          </button>
        </div>
      ) : (
        <>
          <div className="card">
            <h2 className="font-bold text-gray-700 mb-5 text-lg">Donation Details</h2>
            <DonationForm onSuccess={handleSuccess} />
          </div>

          {/* Tips */}
          <div className="mt-8 bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <h3 className="font-semibold text-amber-800 mb-3 text-sm uppercase tracking-wide">
              📋 Tips for a successful donation
            </h3>
            <ul className="space-y-1.5 text-sm text-amber-700">
              <li>• Ensure food is safely packaged and labelled.</li>
              <li>• Provide GPS coordinates for smart NGO matching.</li>
              <li>• Set pickup time at least 1 hour from now.</li>
              <li>• Be available at the pickup location at the scheduled time.</li>
              <li>• Accurate expiry time helps NGOs plan distribution.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default DonateFoodPage;
