import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle, Search } from 'lucide-react';
import { api, setToken } from '../../lib/api';
import { Spinner } from '../../components/ui';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      const data = await api.signin(email, password);
      if (data.user.role !== 'admin') {
        setError('Access Denied. Admin account required.');
        setLoading(false);
        return;
      }
      setToken(data.token);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md">
              <Search size={22} />
            </div>
            <span className="text-xl font-bold text-gray-900">FindLink</span>
          </Link>
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
              <Shield size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
          <p className="mt-2 text-sm text-gray-500">Secure access to the FindLink Administration Panel</p>
        </div>
        <div className="card p-8 animate-slide-up">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 p-3.5 animate-fade-in">
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="label">Email <span className="text-red-500">*</span></label>
              <input id="admin-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required autoFocus />
            </div>
            <div>
              <label htmlFor="admin-password" className="label">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input id="admin-password" type={showPassword ? 'text' : 'password'} className="input pr-10" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner size={18} className="text-white" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/" className="font-medium text-blue-600 hover:underline">&larr; Back to Home</Link>
        </p>
      </div>
    </div>
  );
}