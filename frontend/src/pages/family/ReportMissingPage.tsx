import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ImageUpload } from '../../components/ImageUpload';
import { LocationSelector } from '../../components/LocationSelector';
import { Spinner } from '../../components/ui';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function ReportMissingPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [locationId, setLocationId] = useState<string | null>(null);
  const [lastSeenAddress, setLastSeenAddress] = useState('');
  const [lastSeenDate, setLastSeenDate] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/reports/missing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reporterId: profile.id,
        fullName,
        age: age ? parseInt(age) : null,
        gender,
        photoUrl,
        lastSeenLocationId: locationId,
        lastSeenAddress,
        lastSeenDate: lastSeenDate || null,
        description,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error || 'Failed to submit report');
      setSubmitting(false);
      return;
    }

    navigate('/family');
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Report a Missing Person</h1>
        <p className="mt-2 text-gray-500">Provide as much detail as possible to help find your loved one</p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label">Full Name <span className="text-red-500">*</span></label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Full name of the missing person" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Age</label>
            <input type="number" className="input" value={age} onChange={(e) => setAge(e.target.value)} min="0" max="150" />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <ImageUpload value={photoUrl} onChange={setPhotoUrl} folder="missing" label="Photo" required />

        <LocationSelector value={locationId} onChange={setLocationId} label="Last Seen Location" />

        <div>
          <label className="label">Last Seen Address</label>
          <input className="input" value={lastSeenAddress} onChange={(e) => setLastSeenAddress(e.target.value)} placeholder="Street, landmark, area..." />
        </div>

        <div>
          <label className="label">Last Seen Date</label>
          <input type="date" className="input" value={lastSeenDate} onChange={(e) => setLastSeenDate(e.target.value)} />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[100px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Physical description, clothing, identifying marks, circumstances..." />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? <><Spinner size={16} /> Submitting...</> : <><CheckCircle2 size={16} /> Submit Report</>}
        </button>
      </form>
    </div>
  );
}
