/**
 * Donate.jsx — Form for donors to submit food donations.
 * Fields match the backend POST /api/donations schema exactly.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDonations } from "../context/DonationContext";
import { FaLeaf, FaCheckCircle, FaSpinner } from "react-icons/fa";

const FOOD_CATEGORIES = ["cooked", "raw", "bakery", "dairy", "packaged", "beverages", "other"];
const QUANTITY_UNITS  = ["kg", "litres", "portions", "boxes", "packets"];

// Reusable labelled field wrapper
const Field = ({ label, error, required, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-semibold text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
  </div>
);

const inputCls =
  "border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400";
const selectCls = inputCls + " bg-white";

const INITIAL = {
  foodName:          "",
  foodCategory:      "",
  quantityValue:     "",
  quantityUnit:      "kg",
  pickupAddress:     "",
  pickupWindowStart: "",
  expiryTime:        "",
  description:       "",
};

const Donate = () => {
  const { addDonation } = useDonations();
  const navigate = useNavigate();

  const [form, setForm]     = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors]   = useState({});
  const [apiError, setApiError] = useState("");

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name])  setErrors((p)  => ({ ...p, [name]: "" }));
    if (apiError)      setApiError("");
  };

  // Client-side validation
  const validate = () => {
    const e = {};
    if (!form.foodName.trim())      e.foodName      = "Food name is required";
    if (!form.foodCategory)         e.foodCategory  = "Food category is required";
    if (!form.quantityValue)        e.quantityValue = "Quantity is required";
    else if (isNaN(form.quantityValue) || Number(form.quantityValue) <= 0)
                                    e.quantityValue = "Quantity must be a positive number";
    if (!form.pickupAddress.trim()) e.pickupAddress = "Pickup address is required";
    if (!form.pickupWindowStart)    e.pickupWindowStart = "Pickup time is required";
    if (!form.expiryTime)           e.expiryTime    = "Expiry time is required";
    else if (new Date(form.expiryTime) <= new Date())
                                    e.expiryTime    = "Expiry time must be in the future";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError("");
    try {
      await addDonation({
        foodName:          form.foodName.trim(),
        foodCategory:      form.foodCategory,
        quantity:          { value: Number(form.quantityValue), unit: form.quantityUnit },
        pickupLocation:    { address: form.pickupAddress.trim() },
        pickupWindowStart: form.pickupWindowStart,
        expiryTime:        form.expiryTime,
        description:       form.description.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate("/donations"), 1500);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm">
          <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Donation Submitted!</h2>
          <p className="text-gray-500 text-sm">
            Thank you for your generosity. Redirecting to donations list…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <FaLeaf className="text-green-600 text-3xl" />
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Donate Food</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Fill in the details below to post your food donation.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 flex flex-col gap-5"
      >
        {/* API-level error */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {apiError}
          </div>
        )}

        {/* Row: Food Name + Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Food Name" error={errors.foodName} required>
            <input name="foodName" value={form.foodName} onChange={handle}
              className={inputCls} placeholder="e.g. Vegetable Biryani" />
          </Field>

          <Field label="Food Category" error={errors.foodCategory} required>
            <select name="foodCategory" value={form.foodCategory} onChange={handle}
              className={selectCls}>
              <option value="">— Select category —</option>
              {FOOD_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Row: Quantity value + unit */}
        <div className="grid grid-cols-2 gap-5">
          <Field label="Quantity" error={errors.quantityValue} required>
            <input name="quantityValue" type="number" min="0.1" step="0.1"
              value={form.quantityValue} onChange={handle}
              className={inputCls} placeholder="e.g. 5" />
          </Field>

          <Field label="Unit" required>
            <select name="quantityUnit" value={form.quantityUnit} onChange={handle}
              className={selectCls}>
              {QUANTITY_UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Pickup Address */}
        <Field label="Pickup Address" error={errors.pickupAddress} required>
          <input name="pickupAddress" value={form.pickupAddress} onChange={handle}
            className={inputCls} placeholder="Full address or landmark" />
        </Field>

        {/* Row: Pickup Window Start + Expiry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Pickup From (start)" error={errors.pickupWindowStart} required>
            <input name="pickupWindowStart" type="datetime-local"
              value={form.pickupWindowStart} onChange={handle} className={inputCls} />
          </Field>

          <Field label="Expiry Time" error={errors.expiryTime} required>
            <input name="expiryTime" type="datetime-local"
              value={form.expiryTime} onChange={handle} className={inputCls} />
          </Field>
        </div>

        {/* Description */}
        <Field label="Description (optional)">
          <textarea name="description" value={form.description} onChange={handle}
            rows={3}
            className={inputCls + " resize-none"}
            placeholder="Any notes about the food, packaging, allergens…" />
        </Field>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 mt-2">
          {loading
            ? <><FaSpinner className="animate-spin" /> Submitting…</>
            : <><FaLeaf /> Submit Donation</>}
        </button>
      </form>
    </div>
  );
};

export default Donate;
