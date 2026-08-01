import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';
import { Lock, Bell, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setSaving(true);
    try {
      await api.updatePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update password' });
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-500">Manage your account settings</p>
      </div>

      {message && (
        <div className={`mb-4 flex items-start gap-2 rounded-lg p-3 ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" /> : <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />}
          <p className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{message.text}</p>
        </div>
      )}

      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <><Spinner size={16} /> Updating...</> : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={20} className="text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        </div>
        <p className="text-sm text-gray-500">You receive in-app notifications for matches, status updates, and approval changes. Real-time updates are enabled.</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={20} className="text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-900">Account</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-900">{user?.email}</span>
          </div>
        </div>
        <button onClick={signOut} className="btn-secondary mt-4 w-full">Sign Out</button>
      </div>
    </div>
  );
}
