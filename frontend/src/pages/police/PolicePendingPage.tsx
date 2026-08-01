import { Shield, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PolicePendingPage() {
  const { profile, signOut } = useAuth();

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 mx-auto mb-6">
        <Shield size={32} className="text-amber-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Pending Admin Approval</h1>
      <p className="text-gray-500 mb-6">
        Hello {profile?.full_name}, your police registration is currently pending admin approval.
        You will be notified once an administrator reviews your request.
      </p>

      <div className="card p-6 text-left mb-6">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Name</span>
            <span className="font-medium text-gray-900">{profile?.full_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Badge Number</span>
            <span className="font-medium text-gray-900">{profile?.badge_number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Department</span>
            <span className="font-medium text-gray-900">{profile?.department}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="badge-yellow">{profile?.approval_status}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
        <div className="flex items-start gap-2">
          <Clock size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 text-left">
            Please wait for an administrator to approve your account. This usually takes 1-2 business days.
            You will receive a notification when approved.
          </p>
        </div>
      </div>

      <button onClick={signOut} className="btn-secondary w-full">Sign Out</button>
    </div>
  );
}
