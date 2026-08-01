import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';
import { ImageUpload } from '../components/ImageUpload';
import { Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone);
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    try {
      const data = await api.updateUser(profile.id, {
        full_name: fullName,
        phone,
        avatar_url: avatarUrl,
      });
      if (data) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        refreshProfile();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update profile' });
    }
    setSaving(false);
  };

  if (!profile) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-500">Manage your personal information</p>
      </div>

      {message && (
        <div className={`mb-4 flex items-start gap-2 rounded-lg p-3 ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" /> : <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />}
          <p className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-xl font-semibold text-blue-700">
              {fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{profile.full_name}</p>
            <span className="badge-blue capitalize">{profile.role}</span>
            {profile.role === 'police' && (
              <span className={`ml-2 ${profile.approval_status === 'approved' ? 'badge-green' : profile.approval_status === 'pending' ? 'badge-yellow' : 'badge-red'}`}>{profile.approval_status}</span>
            )}
          </div>
        </div>

        <div>
          <label className="label">Full Name</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="label">Phone Number</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <ImageUpload value={avatarUrl} onChange={setAvatarUrl} folder="profile" label="Profile Photo" />

        {profile.role === 'police' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Badge Number</label>
              <input className="input bg-gray-50" value={profile.badge_number} disabled />
            </div>
            <div>
              <label className="label">Department</label>
              <input className="input bg-gray-50" value={profile.department} disabled />
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? <><Spinner size={16} /> Saving...</> : <><Save size={16} /> Save Changes</>}
        </button>
      </form>
    </div>
  );
}
