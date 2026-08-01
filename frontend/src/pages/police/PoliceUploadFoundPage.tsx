import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, AlertCircle, MapPin, Calendar, Users, Phone } from 'lucide-react';
import { ImageUpload } from '../../components/ImageUpload';
import { Spinner, EmptyState } from '../../components/ui';
import { api } from '../../lib/api';

interface MatchResult {
  id: string;
  found_person_id: string;
  missing_person_id: string;
  confidence_score: number;
  match_rank: number;
  status: string;
  created_at: string;
  missing_person: {
    id: string;
    full_name: string;
    photo_url: string;
    last_seen_address: string;
    last_seen_date: string;
    age: number;
    gender: string;
    description: string;
    status: string;
    reporter: any;
  };
}

export default function PoliceUploadFoundPage() {
  const [photoUrl, setPhotoUrl] = useState('');
  const [possibleName, setPossibleName] = useState('');
  const [gender, setGender] = useState('');
  const [estimatedAge, setEstimatedAge] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ found_person: any; matches: MatchResult[]; match_count: number } | null>(null);

  const handleRunMatch = async () => {
    if (!photoUrl) {
      setError('Please upload a photo first.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.policeUploadFound({
        photoUrl,
        possibleName: possibleName || undefined,
        gender: gender || undefined,
        estimatedAge: estimatedAge || undefined,
        description: description || undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process upload');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoChange = (url: string) => {
    setPhotoUrl(url);
    setResult(null);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload Found Person</h1>
        <p className="mt-2 text-gray-500">
          Upload a photo of an unidentified person. The system will compare it against active missing person reports.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="card p-6 space-y-5">
        <ImageUpload value={photoUrl} onChange={handlePhotoChange} folder="found" label="Photo" required />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Possible Name</label>
            <input className="input" value={possibleName} onChange={(e) => setPossibleName(e.target.value)} placeholder="If known (optional)" />
          </div>
          <div>
            <label className="label">Estimated Age</label>
            <input type="number" className="input" value={estimatedAge} onChange={(e) => setEstimatedAge(e.target.value)} min="0" max="150" placeholder="Optional" />
          </div>
        </div>

        <div>
          <label className="label">Gender</label>
          <select className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Not specified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Physical description, clothing, distinguishing features, condition (optional)..." />
        </div>

        <button
          onClick={handleRunMatch}
          disabled={submitting || !photoUrl}
          className="btn-primary w-full"
        >
          {submitting ? (
            <><Spinner size={16} /> Running Match...</>
          ) : (
            <><Search size={16} /> Run Photo Match</>
          )}
        </button>
      </div>

      {/* Results Section */}
      {result && (
        <div className="mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {result.match_count > 0 ? `${result.match_count} Possible Match${result.match_count > 1 ? 'es' : ''} Found` : 'No Match Found'}
            </h2>
            <p className="text-gray-500">
              {result.match_count > 0
                ? 'Match results sorted by confidence score.'
                : 'No matching missing person found. The found person record has been saved.'}
            </p>
          </div>

          {result.match_count === 0 ? (
            <div className="card p-8">
              <EmptyState icon={<Users size={48} />} title="No matching missing person found." message="The found person record has been saved for future reference." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.matches.map((match) => (
                <div key={match.id} className="card overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex">
                    <div className="w-36 shrink-0 bg-gray-100">
                      {match.missing_person.photo_url ? (
                        <img src={match.missing_person.photo_url} alt={match.missing_person.full_name} className="w-full h-full object-cover aspect-[3/4]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users size={32} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900">{match.missing_person.full_name}</h3>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          match.confidence_score >= 0.7 ? 'bg-green-100 text-green-700' :
                          match.confidence_score >= 0.4 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {(match.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-gray-500 mb-3">
                        {match.missing_person.age && (
                          <p>{match.missing_person.age} years old{match.missing_person.gender ? `, ${match.missing_person.gender}` : ''}</p>
                        )}
                        {match.missing_person.last_seen_date && (
                          <p className="flex items-center gap-1">
                            <Calendar size={12} /> Last seen: {new Date(match.missing_person.last_seen_date).toLocaleDateString()}
                          </p>
                        )}
                        {match.missing_person.last_seen_address && (
                          <p className="flex items-center gap-1">
                            <MapPin size={12} /> {match.missing_person.last_seen_address}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link
                          to={`/missing`}
                          className="text-xs btn-primary py-1.5 px-3"
                        >
                          View Full Report
                        </Link>
                        {match.missing_person.reporter && (
                          <a
                            href={`tel:${match.missing_person.reporter.phone}`}
                            className="text-xs btn-secondary py-1.5 px-3 flex items-center gap-1"
                          >
                            <Phone size={12} /> Contact Family
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Uploaded Found Person Summary */}
          <div className="mt-6 card p-4 bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white shrink-0">
                {result.found_person.photo_url && (
                  <img src={result.found_person.photo_url} alt="Found" className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Found Person Record Saved</p>
                <p className="text-xs text-gray-500 mt-1">
                  {result.found_person.possible_name && <span>Name: {result.found_person.possible_name} · </span>}
                  {result.found_person.estimated_age && <span>Age: {result.found_person.estimated_age} · </span>}
                  {result.found_person.gender && <span>Gender: {result.found_person.gender} · </span>}
                  Status: {result.found_person.status}
                </p>
                <Link to="/police/found" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                  View all found persons →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
