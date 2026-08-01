import { Link2, Shield, MapPin, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">About FindLink</h1>
        <p className="mt-4 text-lg text-gray-500">Missing Person Reunification Platform</p>
      </div>
      <div>
        <p className="text-gray-600 leading-relaxed">
          FindLink helps families, citizens, and law enforcement work together to locate missing persons and verify found individuals.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Core Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Link2 size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Photo Matching</h3>
                <p className="text-sm text-gray-500 mt-1">Compare photos to surface potential matches between missing and found records.</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-semibold">JWT + RBAC</h3>
                <p className="text-sm text-gray-500 mt-1">Secure role-based access control.</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Location DB</h3>
                <p className="text-sm text-gray-500 mt-1">Country to City hierarchy.</p>
              </div>
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Our Mission</h2>
        <p className="text-gray-600 leading-relaxed">
          Every year thousands go missing. FindLink provides a structured way to report cases, share information, and coordinate reunification efforts.
        </p>
        <div className="mt-8 rounded-xl bg-blue-50 border border-blue-200 p-6">
          <Target className="text-blue-600" size={24} />
          <h3 className="font-semibold text-gray-900 mt-2">Our Goal</h3>
          <p className="text-sm text-gray-600">Reunite families through coordinated reporting and verification.</p>
        </div>
      </div>
    </div>
  );
}
