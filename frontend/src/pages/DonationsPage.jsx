import { useState, useEffect, useCallback } from 'react';
import { donationsAPI } from '../services/api';
import DonationCard from '../components/DonationCard';
import DonationTable from '../components/DonationTable';
import Loader from '../components/Loader';
import { FaThLarge, FaTable, FaSearch, FaFilter, FaBolt } from 'react-icons/fa';

const STATUSES = ['all', 'available', 'accepted', 'pickedUp', 'delivered', 'cancelled'];

const DonationsPage = () => {
  const [donations, setDonations] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [view,      setView]      = useState('table');
  const [filter,    setFilter]    = useState('all');
  const [search,    setSearch]    = useState('');
  const [urgentOnly, setUrgentOnly] = useState(false);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await donationsAPI.getAll();
      setDonations(data.data?.donations ?? data.data ?? []);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load donations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDonations(); }, [fetchDonations]);

  const urgentCount = donations.filter((d) => d.isUrgentPickup).length;

  const filtered = donations.filter((d) => {
    if (urgentOnly && !d.isUrgentPickup) return false;
    const matchStatus = filter === 'all' || d.status === filter;
    const q = search.toLowerCase();
    const name    = (d.foodName ?? d.foodType ?? '').toLowerCase();
    const address = (d.pickupLocation?.address ?? d.pickupLocation ?? '').toLowerCase();
    const matchSearch = !q || name.includes(q) || address.includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">All Donations</h1>
          <p className="text-gray-500 mt-1">{donations.length} donation{donations.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-2">
          {urgentCount > 0 && (
            <button
              onClick={() => setUrgentOnly((v) => !v)}
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl border transition-all ${
                urgentOnly
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-red-300 text-red-600 hover:bg-red-50'
              }`}
            >
              <FaBolt /> Urgent ({urgentCount})
            </button>
          )}
          <button
            onClick={() => setView('table')}
            className={`p-2.5 rounded-xl border transition-all ${view === 'table' ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            aria-label="Table view"
          >
            <FaTable />
          </button>
          <button
            onClick={() => setView('cards')}
            className={`p-2.5 rounded-xl border transition-all ${view === 'cards' ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            aria-label="Card view"
          >
            <FaThLarge />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text" placeholder="Search by food name or location…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-8 text-sm"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <FaFilter className="text-gray-400 text-xs mr-1" />
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`badge transition-all cursor-pointer ${
                filter === s ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {s === 'all' ? 'All' : s.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Loader text="Loading donations…" />
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-500 mb-3">{error}</p>
          <button onClick={fetchDonations} className="btn-secondary text-sm">Retry</button>
        </div>
      ) : view === 'cards' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.length
            ? filtered.map((d) => <DonationCard key={d._id} donation={d} onUpdate={fetchDonations} />)
            : (
              <div className="col-span-full text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">📭</p>
                <p className="font-medium">No donations match your filters.</p>
              </div>
            )
          }
        </div>
      ) : (
        <DonationTable donations={filtered} onUpdate={fetchDonations} />
      )}
    </div>
  );
};

export default DonationsPage;
