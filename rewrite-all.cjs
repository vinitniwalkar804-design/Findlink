const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

function writeFile(relPath, content) {
  const full = path.join(ROOT, relPath);
  fs.writeFileSync(full, content);
  console.log('✓ Rewrote ' + relPath);
}

// === HomePage.tsx ===
writeFile('src/pages/HomePage.tsx', `import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Shield, Brain, MapPin, Bell, ArrowRight, Heart, HandHeart, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { MissingPerson } from '../types';

export default function HomePage() {
  const [stats, setStats] = useState({ missing: 0, found: 0, reunited: 0 });
  const [recentMissing, setRecentMissing] = useState<MissingPerson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getStats();
        setStats({ missing: data.activeMissing || 0, found: data.foundPersons || 0, reunited: data.reunited || 0 });
        const rec = await api.getMissingPersons('active');
        setRecentMissing((rec || []).slice(0, 6));
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-50 mb-6 animate-fade-in"><Brain size={14} /> AI-Powered Face Recognition</div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight max-w-3xl mx-auto leading-tight">Reuniting Families with <span className="text-blue-200">AI Technology</span></h1>
            <p className="mt-6 text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">FindLink uses advanced AI face recognition to match missing persons with found individuals.</p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?mode=signup&role=family" className="btn bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 text-base shadow-lg">Report a Missing Person <ArrowRight size={18} /></Link>
              <Link to="/auth?mode=signup&role=citizen" className="btn bg-blue-500/30 text-white border border-white/30 hover:bg-blue-500/50 px-6 py-3 text-base backdrop-blur">Report a Found Person</Link>
            </div>
        </div>
      </section>

      <section className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 mx-auto mb-3"><AlertCircle size={24} className="text-amber-600" /></div>
              <p className="text-3xl font-bold text-gray-900">{stats.missing}</p>
              <p className="text-sm text-gray-500 mt-1">Active Missing Cases</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 mx-auto mb-3"><Users size={24} className="text-blue-600" /></div>
              <p className="text-3xl font-bold text-gray-900">{stats.found}</p>
              <p className="text-sm text-gray-500 mt-1">Found Persons</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 mx-auto mb-3"><Heart size={24} className="text-green-600" /></div>
              <p className="text-3xl font-bold text-gray-900">{stats.reunited}</p>
              <p className="text-sm text-gray-500 mt-1">Reunited</p>
            </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How FindLink Works</h2>
            <p className="mt-3 text-gray-500 max-w-2xl mx-auto">A comprehensive platform connecting families, citizens, and law enforcement</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: 'AI Face Recognition', desc: 'Advanced computer vision matches missing persons with found individuals using top-5 confidence scoring.', color: 'bg-blue-100 text-blue-600' },
              { icon: Users, title: 'Four User Roles', desc: 'Dedicated portals for Family, Citizen, Police, and Admin with role-based access control.', color: 'bg-green-100 text-green-600' },
              { icon: MapPin, title: 'India Location Database', desc: 'Dynamic hierarchy: Country to City coverage.', color: 'bg-amber-100 text-amber-600' },
              { icon: Shield, title: 'Police Verification', desc: 'Admin approval workflow ensures only verified officers access police tools.', color: 'bg-red-100 text-red-600' },
              { icon: Bell, title: 'Real-time Notifications', desc: 'Instant alerts when AI finds a potential match.', color: 'bg-purple-100 text-purple-600' },
              { icon: Search, title: 'Public Search', desc: 'Browse missing and found person records.', color: 'bg-teal-100 text-teal-600' },
            ].map((f) => (
              <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
                <div className={\`flex items-center justify-center w-12 h-12 rounded-xl \${f.color} mb-4\`}><f.icon size={24} /></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
      </section>

      <section className="bg-blue-700 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Join the FindLink Community</h2>
          <p className="mt-3 text-blue-100">Every report counts. Every share matters. Every reunion is a victory.</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth?mode=signup" className="btn bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 text-base shadow-lg">Create an Account</Link>
            <Link to="/about" className="btn bg-blue-600/50 text-white border border-white/30 hover:bg-blue-600 px-6 py-3 text-base">Learn More</Link>
          </div>
      </section>
    </div>
  );
}
`);

// === AboutPage.tsx ===
writeFile('src/pages/AboutPage.tsx', `import { Brain, Shield, MapPin, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">About FindLink</h1>
        <p className="mt-4 text-lg text-gray-500">AI-Based Missing Person Detection System</p>
      </div>
      <div>
        <p className="text-gray-600 leading-relaxed">FindLink uses AI to reunite families.</p>
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Core Technology</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Brain size={20} /></div><div><h3 className="font-semibold">AI Face Recognition</h3><p className="text-sm text-gray-500 mt-1">OpenCV face recognition with top-5 results.</p></div></div>
          <div className="card p-5"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Shield size={20} /></div><div><h3 className="font-semibold">JWT + RBAC</h3><p className="text-sm text-gray-500 mt-1">Secure role-based access control.</p></div></div>
          <div className="card p-5"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><MapPin size={20} /></div><div><h3 className="font-semibold">Location DB</h3><p className="text-sm text-gray-500 mt-1">Country to City hierarchy.</p></div></div>
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Our Mission</h2>
        <p className="text-gray-600 leading-relaxed">Every year thousands go missing. FindLink uses AI to match them.</p>
        <div className="mt-8 rounded-xl bg-blue-50 border border-blue-200 p-6">
          <Target className="text-blue-600" size={24} />
          <h3 className="font-semibold text-gray-900 mt-2">Our Goal</h3>
          <p className="text-sm text-gray-600">Reunite families through AI-powered technology.</p>
        </div>
    </div>
  );
}
`);

// === AdminApprovalsPage.tsx ===
writeFile('src/pages/admin/AdminApprovalsPage.tsx', `import { useEffect, useState } from 'react';
import { getToken } from '../../lib/api';
import { Spinner, EmptyState } from '../../components/ui';
import { UserCheck, CheckCircle2, XCircle, Shield } from 'lucide-react';

const API_BASE = '/api';

interface PendingPolice {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  approval_status: string;
  badge_number: string;
  department: string;
  avatar_url: string;
  created_at: string;
}

export default function AdminApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingPolice[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadPending(); }, []);

  const loadPending = async () => {
    setLoading(true); setError(null);
    try {
      const token = getToken();
      const res = await fetch(API_BASE + '/admin/pending-police', {
        headers: token ? { Authorization: 'Bearer ' + token } : {},
      });
      if (!res.ok) throw new Error('Failed to load pending police');
      const data = await res.json();
      setPending(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending police');
    } finally { setLoading(false); }
  };

  const approve = async (id: string) => {
    setProcessing(id); setError(null);
    try {
      const token = getToken();
      const res = await fetch(API_BASE + '/admin/approve-police', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: JSON.stringify({ police_id: id }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Approval failed');
      setPending(prev => prev.filter(p => p.id !== id));
    } catch (err: any) { setError(err.message); }
    setProcessing(null);
  };

  const reject = async (id: string) => {
    setProcessing(id); setError(null);
    try {
      const token = getToken();
      const res = await fetch(API_BASE + '/admin/reject-police', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: JSON.stringify({ police_id: id }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Rejection failed');
      setPending(prev => prev.filter(p => p.id !== id));
    } catch (err: any) { setError(err.message); }
    setProcessing(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Police Approvals</h1>
        <p className="mt-2 text-gray-500">Review and approve police officer registrations</p>
      </div>
      {error && <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4"><p className="text-sm text-red-700">{error}</p></div>}
      {pending.length === 0 ? (
        <EmptyState icon={<UserCheck size={48} />} title="No pending approvals" message="All police registrations have been processed" />
      ) : (
        <div className="space-y-4">
          {pending.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 shrink-0"><Shield size={24} /></div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{p.full_name}</h3>
                  <div className="mt-1 space-y-0.5">
                    <p className="text-sm text-gray-500">Badge: {p.badge_number || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Department: {p.department || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Phone: {p.phone || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Registered: {new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => approve(p.id)} disabled={processing === p.id} className="btn-primary">
                    {processing === p.id ? <Spinner size={16} /> : <><CheckCircle2 size={16} /> Approve</>}
                  </button>
                  <button onClick={() => reject(p.id)} disabled={processing === p.id} className="btn-danger">
                    <XCircle size={16} /> Reject
                  </button>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`);

// === AdminDashboard.tsx - just fix closing tags ===
const dashPath = path.join(ROOT, 'src/pages/admin/AdminDashboard.tsx');
let dashContent = fs.readFileSync(dashPath, 'utf8');
// Fix: remove extra </div> at end and add missing closing tags
dashContent = dashContent.replace(/\s*<\/div>\s*$/m, '');
dashContent = dashContent.replace(/\n\s*\);\s*$/m, '\n  );\n}\n');
if (!dashContent.trim().endsWith('}')) {
  dashContent += '\n}\n';
}
fs.writeFileSync(dashPath, dashContent);
console.log('✓ Fixed AdminDashboard.tsx');

// === AdminAnalyticsPage.tsx ===
const analPath = path.join(ROOT, 'src/pages/admin/AdminAnalyticsPage.tsx');
let analContent = fs.readFileSync(analPath, 'utf8');
analContent = analContent.replace(/\n<\/div>\s*$/, '');
fs.writeFileSync(analPath, analContent);
console.log('✓ Fixed AdminAnalyticsPage.tsx');

// === AdminUsersPage.tsx ===
const usersPath = path.join(ROOT, 'src/pages/admin/AdminUsersPage.tsx');
let usersContent = fs.readFileSync(usersPath, 'utf8');
usersContent = usersContent.replace(/\n<\/div>\s*$/, '');
fs.writeFileSync(usersPath, usersContent);
console.log('✓ Fixed AdminUsersPage.tsx');

// === PoliceCasesPage.tsx ===
const casesPath = path.join(ROOT, 'src/pages/police/PoliceCasesPage.tsx');
let casesContent = fs.readFileSync(casesPath, 'utf8');
// Fix extra div closing tags
let casesLines = casesContent.split('\n');
// Check last lines for extra divs
casesContent = casesContent.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\);$/, '\n    </div>\n  );\n}\n');
casesContent = casesContent.replace(/<\/div>\s*<\/div>\s*\);\s*$/, '\n    </div>\n  );\n}\n');
if (casesContent.includes('        </div>\n        </div>\n  );')) {
  casesContent = casesContent.replace('        </div>\n        </div>\n  );', '        </div>\n      </div>\n    </div>\n  );\n}');
}
fs.writeFileSync(casesPath, casesContent);
console.log('✓ Fixed PoliceCasesPage.tsx');

// === PoliceFoundPage.tsx ===
const foundPath = path.join(ROOT, 'src/pages/police/PoliceFoundPage.tsx');
let foundContent = fs.readFileSync(foundPath, 'utf8');
foundContent = foundContent.replace(/\n\s*<\/div>\s*$/, '');
if (!foundContent.trim().endsWith('}')) {
  foundContent += '\n}\n';
}
fs.writeFileSync(foundPath, foundContent);
console.log('✓ Fixed PoliceFoundPage.tsx');

console.log('\n=== All files rewritten ===');
</parameter>
</invoke>
</tool_calls>
