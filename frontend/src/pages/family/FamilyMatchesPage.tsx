import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaceMatch } from '../../types';
import { Spinner, EmptyState } from '../../components/ui';
import { Search, Users, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../../lib/api';

export default function FamilyMatchesPage() {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<FaceMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const mpData: any[] = await api.getMyMissingPersons();
        const mpIds = (mpData ?? []).map((m: any) => m.id);
        if (mpIds.length === 0) {
          setLoading(false);
          return;
        }
        const data = await api.getFaceMatches({ missingPersonIds: mpIds });
        setMatches((data as FaceMatch[]) ?? []);
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, [profile]);

  const handleConfirm = async (matchId: string, missingPersonId: string, foundPersonId: string) => {
    try {
      await api.updateFaceMatchStatus(matchId, 'confirmed');
      await api.updateFoundPersonStatus(foundPersonId, 'identified');
      await api.updateMissingPersonStatus(missingPersonId, 'found');
      setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, status: 'confirmed' } : m));
    } catch (err) { console.error(err); }
  };

  const handleReject = async (matchId: string) => {
    try {
      await api.updateFaceMatchStatus(matchId, 'rejected');
      setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, status: 'rejected' } : m));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Photo Matches</h1>
        <p className="mt-2 text-gray-500">Potential matches between your missing person reports and found records</p>
      </div>
      {matches.length === 0 ? (
        <EmptyState icon={<Search size={48} />} title="No matches found yet" message="When a found person matches your missing person report, it will appear here with a confidence score." />
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <div key={match.id} className="card p-5">
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-2">Missing Person</p>
                    <div className="w-24 h-32 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      {match.missing_person && match.missing_person.photo_url ? (
                        <img src={match.missing_person.photo_url} alt={match.missing_person.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Users size={24} className="text-gray-300" /></div>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-900">{match.missing_person && match.missing_person.full_name}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-2">Found Person</p>
                    <div className="w-24 h-32 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      {match.found_person && match.found_person.photo_url ? (
                        <img src={match.found_person.photo_url} alt="Found" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Users size={24} className="text-gray-300" /></div>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-900">Unknown</p>
                  </div>
                </div>
              </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="badge-blue">Rank #{match.match_rank}</span>
                    <span className="text-lg font-bold text-blue-600">{match.confidence_score}% confidence</span>
                  </div>
                  {match.found_person && match.found_person.found_address && (
                    <p className="text-sm text-gray-500 mb-1">Found at: {match.found_person.found_address}</p>
                  )}
                  {match.found_person && match.found_person.found_date && (
                    <p className="text-sm text-gray-500 mb-1">Found date: {new Date(match.found_person.found_date).toLocaleDateString()}</p>
                  )}
                  {match.found_person && match.found_person.description && (
                    <p className="text-sm text-gray-500 mb-3">Description: {match.found_person.description}</p>
                  )}
                  {match.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleConfirm(match.id, match.missing_person_id, match.found_person_id)} className="btn-primary">
                        <CheckCircle2 size={16} /> Confirm Match
                      </button>
                      <button onClick={() => handleReject(match.id)} className="btn-secondary">
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  ) : (
                    <span className={match.status === 'confirmed' ? 'badge-green' : 'badge-red'}>{match.status}</span>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}