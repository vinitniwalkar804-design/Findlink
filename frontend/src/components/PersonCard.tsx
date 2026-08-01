import { Link } from 'react-router-dom';
import { MapPin, Calendar, Users } from 'lucide-react';
import { MissingPerson, FoundPerson } from '../types';

export function PersonCard({ person, type }: { person: MissingPerson | FoundPerson; type: 'missing' | 'found' }) {
  const isMissing = type === 'missing';
  const mp = person as MissingPerson;
  const fp = person as FoundPerson;

  const statusColors: Record<string, string> = {
    active: 'badge-yellow',
    found: 'badge-green',
    closed: 'badge-gray',
    unidentified: 'badge-yellow',
    identified: 'badge-blue',
    reunited: 'badge-green',
  };

  const status = isMissing ? mp.status : fp.status;

  return (
    <Link to={isMissing ? `/missing` : `/found`} className="card overflow-hidden hover:shadow-md transition-shadow group">
      <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
        {person.photo_url ? (
          <img src={person.photo_url} alt={isMissing ? mp.full_name : 'Found person'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users size={40} className="text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 truncate">{isMissing ? mp.full_name : 'Unknown Person'}</h3>
          <span className={statusColors[status] ?? 'badge-gray'}>{status}</span>
        </div>
        {isMissing && mp.age && (
          <p className="text-sm text-gray-500 mb-1">{mp.age} years old{mp.gender ? `, ${mp.gender}` : ''}</p>
        )}
        {isMissing && mp.last_seen_date && (
          <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
            <Calendar size={12} /> Last seen: {new Date(mp.last_seen_date).toLocaleDateString()}
          </p>
        )}
        {!isMissing && fp.found_date && (
          <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
            <Calendar size={12} /> Found: {new Date(fp.found_date).toLocaleDateString()}
          </p>
        )}
        {isMissing && mp.last_seen_address && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <MapPin size={12} /> {mp.last_seen_address}
          </p>
        )}
        {!isMissing && fp.found_address && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <MapPin size={12} /> {fp.found_address}
          </p>
        )}
      </div>
    </Link>
  );
}
