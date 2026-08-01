import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ImageUpload } from '../../components/ImageUpload';
import { LocationSelector } from '../../components/LocationSelector';
import { Spinner } from '../../components/ui';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function ReportFoundPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState('');
  const [locationId, setLocationId] = useState<string | null>(null);
  const [foundAddress, setFoundAddress] = useState('');
  const [foundDate, setFoundDate] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/reports/found', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reporterId: profile.id,
        photoUrl,
        foundLocationId: locationId,
        foundAddress,
        foundDate: foundDate || null,
        description,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error || 'Failed to submit report');
      setSubmitting(false);
      return;
    }

    navigate('/citizen');
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Report a Found Person</h1>
        <p className="mt-2 text-gray-500">Help identify an unknown person by reporting them here</p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <ImageUpload value={photoUrl} onChange={setPhotoUrl} folder="found" label="Photo" required />

        <LocationSelector value={locationId} onChange={setLocationId} label="Found Location" />

        <div>
          <label className="label">Found Address</label>
          <input className="input" value={foundAddress} onChange={(e) => setFoundAddress(e.target.value)} placeholder="Street, landmark, area..." />
        </div>

        <div>
          <label className="label">Found Date</label>
          <input type="date" className="input" value={foundDate} onChange={(e) => setFoundDate(e.target.value)} />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[100px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Physical description, clothing, condition, circumstances..." />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? <><Spinner size={16} /> Submitting...</> : <><CheckCircle2 size={16} /> Submit Report</>}
        </button>
      </form>
    </div>
  );
}
