import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Search, Menu, X, User as UserIcon, LogOut, Bell, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export function Navbar() {
  const { profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const dashboardLink = profile
    ? profile.role === 'admin'
      ? '/admin'
      : profile.role === 'police'
      ? '/police'
      : profile.role === 'family'
      ? '/family'
      : '/citizen'
    : '/auth';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Search size={20} />
              </div>
              <span className="text-lg font-bold text-gray-900">FindLink</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Home</Link>
              <Link to="/missing" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Missing Persons</Link>
              <Link to="/found" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Found Persons</Link>
              <Link to="/about" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">About</Link>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {profile ? (
              <>
                <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Notifications">
                  <Bell size={20} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link to={dashboardLink} className="btn-secondary">
                  <UserIcon size={16} /> Dashboard
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 transition-colors"
                  >
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-20 animate-scale-in">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name}</p>
                          <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
                          {profile.role === 'police' && profile.approval_status === 'pending' && (
                            <span className="badge-yellow mt-1">Pending Approval</span>
                          )}
                        </div>
                        <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                          <UserIcon size={16} /> Profile
                        </Link>
                        <Link to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                          <Shield size={16} /> Settings
                        </Link>
                        <button onClick={handleSignOut} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/auth" className="btn-ghost">Sign In</Link>
                <Link to="/auth?mode=signup" className="btn-primary">Get Started</Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 animate-slide-up">
            <nav className="flex flex-col gap-1">
              <Link to="/" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Home</Link>
              <Link to="/missing" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Missing Persons</Link>
              <Link to="/found" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Found Persons</Link>
              <Link to="/about" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100" onClick={() => setMobileOpen(false)}>About</Link>
              {profile ? (
                <>
                  <Link to={dashboardLink} className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <Link to="/notifications" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Notifications {unreadCount > 0 && `(${unreadCount})`}</Link>
                  <Link to="/profile" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Profile</Link>
                  <button onClick={handleSignOut} className="px-3 py-2 text-left rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">Sign Out</button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link to="/auth" className="btn-secondary" onClick={() => setMobileOpen(false)}>Sign In</Link>
                  <Link to="/auth?mode=signup" className="btn-primary" onClick={() => setMobileOpen(false)}>Get Started</Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
