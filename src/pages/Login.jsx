/**
 * Login.jsx — Combined Login / Register page.
 * Toggles between two forms via tab state.
 * On success navigates to the page the user originally intended (or "/").
 */
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaLeaf, FaSpinner, FaEye, FaEyeSlash } from "react-icons/fa";

const ROLES = ["donor", "ngo", "volunteer", "admin"];

const ROLE_LABELS = {
  donor:     "🥗 Donor — I have food to donate",
  ngo:       "🏢 NGO — We accept & distribute food",
  volunteer: "🚴 Volunteer — I deliver food",
  admin:     "🛡 Admin — Platform administrator",
};

// Small reusable field wrapper
const Field = ({ label, error, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-semibold text-gray-700">{label}</label>
    {children}
    {error && <p className="text-red-500 text-xs">{error}</p>}
  </div>
);

const inputCls =
  "border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 w-full";

// ── Login Form ────────────────────────────────────────────────────────────────
const LoginForm = ({ onSuccess }) => {
  const { login } = useAuth();
  const [form, setForm]     = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim())    e.email    = "Email is required";
    if (!form.password.trim()) e.password = "Password is required";
    return e;
  };

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    if (apiError) setApiError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setApiError("");
    try {
      await login(form.email, form.password);
      onSuccess();
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {apiError}
        </div>
      )}

      <Field label="Email Address" error={errors.email}>
        <input name="email" type="email" value={form.email} onChange={handle}
          className={inputCls} placeholder="you@example.com" />
      </Field>

      <Field label="Password" error={errors.password}>
        <div className="relative">
          <input name="password" type={showPw ? "text" : "password"}
            value={form.password} onChange={handle}
            className={inputCls + " pr-10"} placeholder="••••••••" />
          <button type="button" onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPw ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </Field>

      <button type="submit" disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
        {loading ? <><FaSpinner className="animate-spin" /> Logging in…</> : "Log In"}
      </button>
    </form>
  );
};

// ── Register Form ─────────────────────────────────────────────────────────────
const INIT_REG = { name: "", email: "", password: "", role: "", phone: "" };

const RegisterForm = ({ onSuccess }) => {
  const { register } = useAuth();
  const [form, setForm]     = useState(INIT_REG);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email address";
    if (!form.password)     e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Min 6 characters";
    if (!form.role)         e.role = "Please select a role";
    return e;
  };

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    if (apiError) setApiError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setApiError("");
    try {
      // Send default location coordinates (can be updated in profile)
      await register({
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        role:     form.role,
        phone:    form.phone.trim() || undefined,
        location: { type: "Point", coordinates: [0, 0] },
      });
      onSuccess();
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {apiError}
        </div>
      )}

      <Field label="Full Name" error={errors.name}>
        <input name="name" value={form.name} onChange={handle}
          className={inputCls} placeholder="Jane Doe" />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email Address" error={errors.email}>
          <input name="email" type="email" value={form.email} onChange={handle}
            className={inputCls} placeholder="you@example.com" />
        </Field>

        <Field label="Phone (optional)">
          <input name="phone" type="tel" value={form.phone} onChange={handle}
            className={inputCls} placeholder="+91 98765 43210" />
        </Field>
      </div>

      <Field label="Password" error={errors.password}>
        <div className="relative">
          <input name="password" type={showPw ? "text" : "password"}
            value={form.password} onChange={handle}
            className={inputCls + " pr-10"} placeholder="Min 6 characters" />
          <button type="button" onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPw ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </Field>

      <Field label="Role" error={errors.role}>
        <select name="role" value={form.role} onChange={handle}
          className={inputCls + " bg-white"}>
          <option value="">— Select your role —</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </Field>

      <button type="submit" disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
        {loading ? <><FaSpinner className="animate-spin" /> Creating account…</> : "Create Account"}
      </button>
    </form>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const Login = () => {
  const [tab, setTab]     = useState("login");
  const navigate          = useNavigate();
  const location          = useLocation();
  const from              = location.state?.from?.pathname || "/";

  const onSuccess = () => navigate(from, { replace: true });

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <FaLeaf className="text-green-600 text-3xl" />
          <span className="text-2xl font-extrabold text-green-700">FoodShare</span>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {["login", "register"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === t ? "bg-white shadow text-green-700" : "text-gray-500 hover:text-gray-700"
              }`}>
              {t === "login" ? "Log In" : "Register"}
            </button>
          ))}
        </div>

        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {tab === "login" ? "Welcome back 👋" : "Create your account"}
        </h2>

        {tab === "login"
          ? <LoginForm    onSuccess={onSuccess} />
          : <RegisterForm onSuccess={onSuccess} />}
      </div>
    </div>
  );
};

export default Login;
