import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaLeaf, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'donor',     label: '🍱 Donor',     desc: 'I have surplus food to donate'     },
  { value: 'ngo',       label: '🏠 NGO',        desc: 'We receive and distribute food'    },
  { value: 'volunteer', label: '🚴 Volunteer',  desc: 'I can help pick up and deliver'    },
];

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'donor',
  });
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Name is required.';
    if (!form.email)        e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password)         e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters.';
    if (form.password !== form.confirmPassword)
                                e.confirmPassword = 'Passwords do not match.';
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
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      const user = await register(payload);
      const dest = user.role === 'admin' ? '/admin' : user.role === 'volunteer' ? '/volunteer' : '/donate';
      navigate(dest, { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-128px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="card">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
              <FaLeaf className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-800">Join FoodShare</h1>
            <p className="text-gray-400 text-sm mt-1">Create your free account</p>
          </div>

          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input name="name" type="text" placeholder="Jane Doe"
                value={form.name} onChange={handleChange}
                className={`input-field ${errors.name ? 'border-red-400' : ''}`} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input name="email" type="email" autoComplete="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange}
                className={`input-field ${errors.email ? 'border-red-400' : ''}`} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input name="password" type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password" placeholder="Min. 6 characters"
                  value={form.password} onChange={handleChange}
                  className={`input-field pr-10 ${errors.password ? 'border-red-400' : ''}`} />
                <button type="button" onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input name="confirmPassword" type="password" autoComplete="new-password"
                placeholder="Repeat password"
                value={form.confirmPassword} onChange={handleChange}
                className={`input-field ${errors.confirmPassword ? 'border-red-400' : ''}`} />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Role picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a…</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ROLES.map((r) => (
                  <label key={r.value}
                    className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col gap-1 transition-all ${
                      form.role === r.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <input type="radio" name="role" value={r.value}
                      checked={form.role === r.value} onChange={handleChange}
                      className="sr-only" />
                    <span className="font-semibold text-sm text-gray-800">{r.label}</span>
                    <span className="text-xs text-gray-400">{r.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
