const fs = require('fs');

// Write AboutPage clean JSX
const content = 'import { Brain, Shield, MapPin, Target } from ' + "'lucide-react'" + ';' + '\n' +
'\n' +
'export default function AboutPage() {' + '\n' +
'  return (' + '\n' +
'    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">' + '\n' +
'      <div className="text-center mb-12">' + '\n' +
'        <h1 className="text-4xl font-bold text-gray-900">About FindLink</h1>' + '\n' +
'        <p className="mt-4 text-lg text-gray-500">AI-Based Missing Person Detection System</p>' + '\n' +
'      </div>' + '\n' +
'      <div>' + '\n' +
'        <p className="text-gray-600 leading-relaxed">FindLink uses AI to reunite families.</p>' + '\n' +
'        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Core Technology</h2>' + '\n' +
'        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">' + '\n' +
'          <div className="card p-5"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Brain size={20} /></div><div><h3 className="font-semibold">AI Face Recognition</h3><p className="text-sm text-gray-500 mt-1">OpenCV face recognition with top-5 results.</p></div></div>' + '\n' +
'          <div className="card p-5"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Shield size={20} /></div><div><h3 className="font-semibold">JWT + RBAC</h3><p className="text-sm text-gray-500 mt-1">Secure role-based access control.</p></div></div>' + '\n' +
'          <div className="card p-5"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><MapPin size={20} /></div><div><h3 className="font-semibold">Location DB</h3><p className="text-sm text-gray-500 mt-1">Country to City hierarchy.</p></div></div>' + '\n' +
'        </div>' + '\n' +
'        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Our Mission</h2>' + '\n' +
'        <p className="text-gray-600 leading-relaxed">Every year thousands go missing. FindLink uses AI to match them.</p>' + '\n' +
'        <div className="mt-8 rounded-xl bg-blue-50 border border-blue-200 p-6">' + '\n' +
'          <Target className="text-blue-600" size={24} />' + '\n' +
'          <h3 className="font-semibold text-gray-900 mt-2">Our Goal</h3>' + '\n' +
'          <p className="text-sm text-gray-600">Reunite families through AI-powered technology.</p>' + '\n' +
'        </div>' + '\n' +
'      </div>' + '\n' +
'    </div>' + '\n' +
'  );' + '\n' +
'}' + '\n';

fs.writeFileSync('src/pages/AboutPage.tsx', content, 'utf-8');

// Verify
const d = fs.readFileSync('src/pages/AboutPage.tsx', 'utf-8');
const o = (d.match(/<div/g) || []).length;
const cl = (d.match(/<\/div>/g) || []).length;
console.log('AboutPage - div opens:', o, 'div closes:', cl, 'diff:', o - cl);

// Fix FamilyMatchesPage
let fm = fs.readFileSync('src/pages/family/FamilyMatchesPage.tsx', 'utf-8');
const fmO = (fm.match(/<div[^>]*>/g) || []).length;
const fmC = (fm.match(/<\/div>/g) || []).length;
console.log('FamilyMatches BEFORE - div opens:', fmO, 'div closes:', fmC, 'diff:', fmO - fmC);
