const fs = require('fs');
const path = require('path');

const content = `import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Shield, Brain, MapPin, Bell, ArrowRight, Heart, HandHeart, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { MissingPerson } from '../types';

const features = [
  { icon: Brain, title: 'AI Face Recognition', desc: 'Advanced computer vision matches missing persons with found individuals using top-5 confidence scoring.', color: 'bg-blue-100 text-blue-600' },
  { icon: Users, title: 'Four User Roles', desc: 'Dedicated portals for Family, Citizen, Police, and Admin with role-based access control.', color: 'bg-green-100 text-green-600' },
  { icon: MapPin, title: 'India Location Database', desc: 'Dynamic hierarchy: Country to City coverage.', color: 'bg-amber-100 text-amber-600' },
  { icon: Shield, title: 'Police Verification', desc: 'Admin approval workflow ensures only verified officers access police tools.', color: 'bg-red-100 text-red-600' },
  { icon: Bell, title: 'Real-time Notifications', desc: 'Instant alerts when AI finds a potential match.', color: 'bg-purple-100 text-purple-600' },
  { icon: Search, title: 'Public Search', desc: 'Browse missing and found person records.', color: 'bg-teal-100 text-teal-600' },
];

export default function HomePage() {
  const [stats, setStats] = useState({ missing: 0, found: 0, reunited: 0 });
  const [recentMissing, setRecentMissing] = useState([]);
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
              <Link to={"/auth?mode=signup&role=family"} className="btn bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 text-base shadow-lg">Report a Missing Person <ArrowRight size={18} /></Link>
              <Link to={"/auth?mode=signup&role=citizen"} className="btn bg-blue-500/30 text-white border border-white/30 hover:bg-blue-500/50 px-6 py-3 text-base backdrop-blur">Report a Found Person</Link>
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
            {features.map((f) => (
              <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
                <div className={'flex items-center justify-center w-12 h-12 rounded-xl ' + f.color + ' mb-4'}><f.icon size={24} /></div>
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
`;

const filePath = path.join(__dirname, 'src', 'pages', 'HomePage.tsx');
fs.writeFileSync(filePath, content, 'utf-8');
console.log('Written HomePage.tsx successfully');
console.log('File size:', content.length, 'bytes');

// Count opening and closing tags
const opens = (content.match(/<div[^>]*>/g) || []).length;
const closes = (content.match(/<\/div>/g) || []).length;
console.log('div opens:', opens, 'closes:', closes);

const secOpens = (content.match(/<section[^>]*>/g) || []).length;
const secCloses = (content.match(/<\/section>/g) || []).length;
console.log('section opens:', secOpens, 'closes:', secCloses);

const linkOpens = (content.match(/<Link[^>]*>/g) || []).length;
const linkCloses = (content.match(/<\/Link>/g) || []).length;
console.log('Link opens:', linkOpens, 'closes:', linkCloses);
