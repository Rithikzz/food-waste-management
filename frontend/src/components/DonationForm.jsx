import { useState } from 'react';
import { donationsAPI } from '../services/api';

const FOOD_CATEGORIES = [
  { value: 'cooked',    label: '🍲 Cooked Food'    },
  { value: 'raw',       label: '🥦 Raw Vegetables'  },
  { value: 'bakery',    label: '🍞 Bakery Items'    },
  { value: 'dairy',     label: '🥛 Dairy Products'  },
  { value: 'packaged',  label: '📦 Packaged Food'   },
  { value: 'beverages', label: '🧃 Beverages'       },
  { value: 'other',     label: '🍱 Other'           },
];

const UNITS = ['kg', 'litres', 'portions', 'boxes', 'packets'];

const initialState = {
  foodName: '',
  foodCategory: '',
  quantityValue: '',
  quantityUnit: 'kg',
  description: '',
  pickupAddress: '',
  latitude: '',
  longitude: '',
  pickupWindowStart: '',
  expiryTime: '',
};

/**
 * DonationForm — submits to POST /api/donations matching the backend schema.
 * Props:
 *   onSuccess({ donation, suggestedNgos, freshnessLabel, isUrgentPickup }) — called on success.
 */
const DonationForm = ({ onSuccess }) => {
  const [form,     setForm]     = useState(initialState);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.foodName.trim())    e.foodName     = 'Food name is required.';
    if (!form.foodCategory)       e.foodCategory = 'Food category is required.';
    if (!form.quantityValue || isNaN(form.quantityValue) || Number(form.quantityValue) <= 0)
                                  e.quantityValue = 'Enter a valid positive quantity.';
    if (!form.pickupAddress.trim()) e.pickupAddress = 'Pickup address is required.';
    if (!form.pickupWindowStart)  e.pickupWindowStart = 'Pickup time is required.';
    if (!form.expiryTime)         e.expiryTime   = 'Expiry time is required.';
    if (form.pickupWindowStart && form.expiryTime && form.expiryTime <= form.pickupWindowStart)
                                  e.expiryTime   = 'Expiry must be after pickup time.';
    if (form.latitude  && isNaN(parseFloat(form.latitude)))  e.latitude  = 'Invalid latitude.';
    if (form.longitude && isNaN(parseFloat(form.longitude))) e.longitude = 'Invalid longitude.';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // Build coordinates — use provided values or default [0, 0]
    const lat = parseFloat(form.latitude)  || 0;
    const lng = parseFloat(form.longitude) || 0;

    const payload = {
      foodName:     form.foodName.trim(),
      foodCategory: form.foodCategory,
      quantity:     { value: Number(form.quantityValue), unit: form.quantityUnit },
      description:  form.description.trim() || undefined,
      pickupLocation: {
        address:     form.pickupAddress.trim(),
        coordinates: { type: 'Point', coordinates: [lng, lat] },
      },
      pickupWindowStart: new Date(form.pickupWindowStart).toISOString(),
      expiryTime:        new Date(form.expiryTime).toISOString(),
    };

    setLoading(true);
    try {
      const { data } = await donationsAPI.create(payload);
      setForm(initialState);
      onSuccess?.(data.data);
    } catch (err) {
      setApiError(err.response?.data?.message ?? 'Failed to submit donation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ id, label, hint, children, error }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {hint && <span className="text-gray-400 font-normal ml-1 text-xs">({hint})</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {apiError}
        </div>
      )}

      {/* Food Name */}
      <Field id="foodName" label="Food Name" error={errors.foodName}>
        <input
          id="foodName" name="foodName" type="text"
          placeholder="e.g. Vegetable Biryani"
          value={form.foodName} onChange={handleChange}
          className={`input-field ${errors.foodName ? 'border-red-400' : ''}`}
        />
      </Field>

      {/* Food Category */}
      <Field id="foodCategory" label="Food Category" error={errors.foodCategory}>
        <select
          id="foodCategory" name="foodCategory" value={form.foodCategory}
          onChange={handleChange}
          className={`input-field ${errors.foodCategory ? 'border-red-400' : ''}`}
        >
          <option value="">-- Select category --</option>
          {FOOD_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </Field>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
        <div className="flex gap-2">
          <input
            name="quantityValue" type="number" min="0.1" step="0.1"
            placeholder="e.g. 10"
            value={form.quantityValue} onChange={handleChange}
            className={`input-field flex-1 ${errors.quantityValue ? 'border-red-400' : ''}`}
          />
          <select
            name="quantityUnit" value={form.quantityUnit} onChange={handleChange}
            className="input-field w-32"
          >
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        {errors.quantityValue && <p className="text-xs text-red-500 mt-1">{errors.quantityValue}</p>}
      </div>

      {/* Description */}
      <Field id="description" label="Description" hint="optional" error={errors.description}>
        <textarea
          id="description" name="description" rows={2}
          placeholder="Any notes about the food, allergens, packaging…"
          value={form.description} onChange={handleChange}
          className="input-field resize-none"
        />
      </Field>

      {/* Pickup Address */}
      <Field id="pickupAddress" label="Pickup Address" error={errors.pickupAddress}>
        <input
          id="pickupAddress" name="pickupAddress" type="text"
          placeholder="Street address or landmark"
          value={form.pickupAddress} onChange={handleChange}
          className={`input-field ${errors.pickupAddress ? 'border-red-400' : ''}`}
        />
      </Field>

      {/* Coordinates (optional) */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">
          GPS Coordinates <span className="text-gray-400 font-normal text-xs">(optional — enables smart NGO matching)</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              name="latitude" type="number" step="any" placeholder="Latitude (e.g. 12.97)"
              value={form.latitude} onChange={handleChange}
              className={`input-field ${errors.latitude ? 'border-red-400' : ''}`}
            />
            {errors.latitude && <p className="text-xs text-red-500 mt-1">{errors.latitude}</p>}
          </div>
          <div>
            <input
              name="longitude" type="number" step="any" placeholder="Longitude (e.g. 77.59)"
              value={form.longitude} onChange={handleChange}
              className={`input-field ${errors.longitude ? 'border-red-400' : ''}`}
            />
            {errors.longitude && <p className="text-xs text-red-500 mt-1">{errors.longitude}</p>}
          </div>
        </div>
      </div>

      {/* Pickup Start Time */}
      <Field id="pickupWindowStart" label="Pickup Available From" error={errors.pickupWindowStart}>
        <input
          id="pickupWindowStart" name="pickupWindowStart" type="datetime-local"
          value={form.pickupWindowStart} onChange={handleChange}
          className={`input-field ${errors.pickupWindowStart ? 'border-red-400' : ''}`}
        />
      </Field>

      {/* Expiry Time */}
      <Field id="expiryTime" label="Food Expiry Time" error={errors.expiryTime}>
        <input
          id="expiryTime" name="expiryTime" type="datetime-local"
          value={form.expiryTime} onChange={handleChange}
          className={`input-field ${errors.expiryTime ? 'border-red-400' : ''}`}
        />
      </Field>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Submitting…' : '🍱 Submit Donation'}
      </button>
    </form>
  );
};

export default DonationForm;
