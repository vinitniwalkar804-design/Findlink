import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Search, Users, Shield, User, AlertCircle, CheckCircle2 } from 'lucide-react';

const roleOptions: { value: UserRole; label: string; icon: typeof User; desc: string }[] = [
  { value: 'family', label: 'Family', icon: User, desc: 'Report a missing family member' },
  { value: 'citizen', label: 'Citizen', icon: Users, desc: 'Report a found person' },
  { value: 'police', label: 'Police', icon: Shield, desc: 'Law enforcement officer' },
];

export default function AuthPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp, user, profile } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'signin');
  const [role, setRole] = useState<UserRole>((params.get('role') as UserRole) || 'citizen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && profile) {
      const dest = profile.role === 'admin' ? '/admin' : profile.role === 'police' ? '/police' : profile.role === 'family' ? '/family' : '/citizen';
      navigate(dest);
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        setSubmitting(false);
      }
    } else {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setSubmitting(false);
        return;
      }
      const { error } = await signUp({ email, password, full_name: fullName, phone, role, badge_number: badgeNumber, department });
      if (error) {
        setError(error);
        setSubmitting(false);
      } else {
        if (role === 'police') {
          setSuccess('Account created! Your police registration is pending admin approval. You can sign in now.');
        } else {
          setSuccess('Account created! You can now sign in.');
        }
        setMode('signin');
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Search size={22} />
          </div>
          <span className="text-xl font-bold text-gray-900">FindLink</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="mt-2 text-sm text-gray-500">{mode === 'signin' ? 'Sign in to access your dashboard' : 'Join FindLink to help reunite families'}</p>
      </div>

      <div className="card p-6">
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 animate-fade-in">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 p-3 animate-fade-in">
            <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="label">I am a...</label>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all ${
                        role === opt.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <opt.icon size={20} />
                      <span className="text-xs font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-gray-500">{roleOptions.find((r) => r.value === role)?.desc}</p>
              </div>
              <div>
                <label className="label">Full Name <span className="text-red-500">*</span></label>
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>
              {role === 'police' && (
                <>
                  <div>
                    <label className="label">Badge Number <span className="text-red-500">*</span></label>
                    <input className="input" value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} placeholder="e.g. MH-1234" required />
                  </div>
                  <div>
                    <label className="label">Department <span className="text-red-500">*</span></label>
                    <input className="input" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Mumbai Police" required />
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xs text-amber-700">Police registrations require admin approval before access is granted.</p>
                  </div>
                </>
              )}
            </>
          )}

          <div>
            <label className="label">Email <span className="text-red-500">*</span></label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password <span className="text-red-500">*</span></label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {mode === 'signin' ? (
            <>Don't have an account? <button onClick={() => setMode('signup')} className="font-medium text-blue-600 hover:underline">Sign up</button></>
          ) : (
            <>Already have an account? <button onClick={() => setMode('signin')} className="font-medium text-blue-600 hover:underline">Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}
