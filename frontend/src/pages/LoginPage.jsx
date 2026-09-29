import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as apiRegister } from '../api/auth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regRole, setRegRole] = useState('tenant');
  const [regErrors, setRegErrors] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(loginEmail, loginPassword);
      toast.success(`Welcome back, ${user.full_name}`);
      navigate(user.role === 'tenant' ? '/tenant' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const validateRegister = () => {
    const errors = {};
    if (!regName.trim()) errors.name = 'Full name is required';
    else if (regName.trim().length < 2) errors.name = 'Name must be at least 2 characters';
    if (!regEmail.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) errors.email = 'Please enter a valid email';
    if (!regPassword) errors.password = 'Password is required';
    else {
      if (regPassword.length < 8) errors.password = 'Password must be at least 8 characters';
      else if (!/[A-Z]/.test(regPassword)) errors.password = 'Password must contain an uppercase letter';
      else if (!/[a-z]/.test(regPassword)) errors.password = 'Password must contain a lowercase letter';
      else if (!/\d/.test(regPassword)) errors.password = 'Password must contain a number';
    }
    if (!regConfirm) errors.confirm = 'Please confirm your password';
    else if (regPassword !== regConfirm) errors.confirm = 'Passwords do not match';
    setRegErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;
    setLoading(true);
    try {
      await apiRegister({
        full_name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole,
      });
      toast.success('Account created! Please sign in.');
      setMode('login');
      setLoginEmail(regEmail.trim());
      setLoginPassword('');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirm('');
      setRegRole('tenant');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        const msgs = detail.map(d => d.msg).join('. ');
        toast.error(msgs);
      } else {
        toast.error(detail || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (error) =>
    `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
      error ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
    }`;

  return (
    <div className="min-h-screen flex">
      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {mode === 'login' ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to your account</h2>
              <p className="text-sm text-gray-500 mb-8">Enter your credentials to continue</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <button onClick={() => setMode('register')} className="text-primary-600 hover:text-primary-700 font-medium">
                  Create one
                </button>
              </p>


            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h2>
              <p className="text-sm text-gray-500 mb-8">Fill in the details to get started</p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => { setRegName(e.target.value); if (regErrors.name) setRegErrors(p => ({ ...p, name: '' })); }}
                    className={inputClass(regErrors.name)}
                    placeholder="Alex Morgan"
                  />
                  {regErrors.name && <p className="mt-1 text-xs text-red-600">{regErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => { setRegEmail(e.target.value); if (regErrors.email) setRegErrors(p => ({ ...p, email: '' })); }}
                    className={inputClass(regErrors.email)}
                    placeholder="you@example.com"
                  />
                  {regErrors.email && <p className="mt-1 text-xs text-red-600">{regErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => { setRegPassword(e.target.value); if (regErrors.password) setRegErrors(p => ({ ...p, password: '' })); }}
                    className={inputClass(regErrors.password)}
                    placeholder="Min. 8 characters"
                  />
                  {regErrors.password && <p className="mt-1 text-xs text-red-600">{regErrors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={regConfirm}
                    onChange={(e) => { setRegConfirm(e.target.value); if (regErrors.confirm) setRegErrors(p => ({ ...p, confirm: '' })); }}
                    className={inputClass(regErrors.confirm)}
                    placeholder="Re-enter password"
                  />
                  {regErrors.confirm && <p className="mt-1 text-xs text-red-600">{regErrors.confirm}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="landlord">Landlord</option>
                    <option value="property_manager">Property Manager</option>
                    <option value="tenant">Tenant</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-primary-600 hover:text-primary-700 font-medium">
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
