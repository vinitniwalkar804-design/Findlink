const fs = require('fs');

// Read the broken AboutPage
const filePath = 'src/pages/AboutPage.tsx';
const content = fs.readFileSync(filePath, 'utf-8');

// The problem: missing closing divs for the map block
// Fix by completely rewriting it with proper JSX
const newContent = `import { Brain, Shield, MapPin, Target } from 'lucide-react';

export default function AboutPage() {
  const items = [
    { icon: Brain, title: 'AI Face Recognition', desc: 'OpenCV face recognition powers the matching engine with top-5 results and confidence scores.' },
    { icon: Shield, title: 'JWT + RBAC', desc: 'Secure authentication with role-based access control for Family, Citizen, Police, and Admin users.' },
    { icon: MapPin, title: 'India Location Database', desc: 'Dynamic hierarchy from Country to City level for precise location tracking.' },
  ];
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">About FindLink</h1>
        <p className="mt-4 text-lg text-gray-500">AI-Based Missing Person Detection and Reunification System</p>
      </div>
      <div>
        <p className="text-gray-600 leading-relaxed">FindLink uses AI to reunite missing persons with their families across India.</p>
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Core Technology</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((t, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600 shrink-0">
                  <t.icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{t.desc}</p>
                </div>
            </div>
          ))}
        </div>
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
`;

fs.writeFileSync(filePath, newContent.trim() + '\n', 'utf-8');
console.log('Written AboutPage.tsx');
console.log('Length:', fs.readFileSync(filePath, 'utf-8').length);
console.log('Ends with }):', newContent.trim().endsWith('}'));
