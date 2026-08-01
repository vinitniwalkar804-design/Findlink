import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { FullPageLoader } from './ui';
import { UserRole } from '../types';

interface Props {
  children: ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: Props) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!profile) return <FullPageLoader message="Loading profile..." />;

  if (roles && !roles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  if (profile.role === 'police' && profile.approval_status === 'pending' && !location.pathname.startsWith('/police/pending')) {
    return <Navigate to="/police/pending" replace />;
  }

  return <>{children}</>;
}
