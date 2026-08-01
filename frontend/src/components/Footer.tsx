import { Link } from 'react-router-dom';
import { Search, Heart, Shield, Users, Mail, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Search size={18} />
              </div>
              <span className="text-base font-bold text-gray-900">FindLink</span>
            </div>
            <p className="text-sm text-gray-500">Missing Person Reunification Platform</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/missing" className="text-sm text-gray-500 hover:text-blue-600">Missing Persons</Link></li>
              <li><Link to="/found" className="text-sm text-gray-500 hover:text-blue-600">Found Persons</Link></li>
              <li><Link to="/about" className="text-sm text-gray-500 hover:text-blue-600">About Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">For Users</h4>
            <ul className="space-y-2">
              <li><Link to="/auth?mode=signup&role=family" className="text-sm text-gray-500 hover:text-blue-600">Family Portal</Link></li>
              <li><Link to="/auth?mode=signup&role=citizen" className="text-sm text-gray-500 hover:text-blue-600">Citizen Portal</Link></li>
              <li><Link to="/auth?mode=signup&role=police" className="text-sm text-gray-500 hover:text-blue-600">Police Portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-500"><Mail size={14} /> help@findlink.in</li>
              <li className="flex items-center gap-2 text-sm text-gray-500"><Phone size={14} /> 1800-MISSING</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">© 2026 FindLink. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Heart size={12} /> Reuniting families</span>
            <span className="flex items-center gap-1"><Shield size={12} /> Secure platform</span>
            <span className="flex items-center gap-1"><Users size={12} /> Community driven</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
