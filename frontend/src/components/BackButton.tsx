import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  if (location.pathname === '/') {
    return null;
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }

    const fallback = profile?.role === 'admin'
      ? '/admin'
      : profile?.role === 'police'
      ? '/police'
      : profile?.role === 'family'
      ? '/family'
      : profile?.role === 'citizen'
      ? '/citizen'
      : '/';

    navigate(fallback);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Go back"
    >
      <ArrowLeft size={16} />
      <span>Back</span>
    </button>
  );
}
