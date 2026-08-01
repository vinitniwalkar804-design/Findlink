

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
          <div className="card p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Brain size={20} /></div>
              <div><h3 className="font-semibold">AI Face Recognition</h3><p className="text-sm text-gray-500 mt-1">OpenCV face recognition with top-5 results.</p></div>
          </div>
          <div className="card p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Shield size={20} /></div>
              <div><h3 className="font-semibold">JWT + RBAC</h3><p className="text-sm text-gray-500 mt-1">Secure role-based access control.</p></div>
          </div>
          <div className="card p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><MapPin size={20} /></div>
              <div><h3 className="font-semibold">Location DB</h3><p className="text-sm text-gray-500 mt-1">Country to City hierarchy.</p></div>
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

// Write AboutPage
fs.writeFileSync('src/pages/AboutPage.tsx', ABOUT_CONTENT, 'utf-8');
console.log('AboutPage written. Length:', ABOUT_CONTENT.length);

// Verify div counts
const divOpen = (ABOUT_CONTENT.match(/<div/g) || []).length;
const divClose = (ABOUT_CONTENT.match(/<\/div>/g) || []).length;
console.log('div opens:', divOpen, 'div closes:', divClose, 'diff:', divOpen - divClose);

// Check FamilyMatchesPage 
let familyMatches = fs.readFileSync('src/pages/family/FamilyMatchesPage.tsx', 'utf-8');
const fmOpen = (familyMatches.match(/<div[^>]*>/g) || []).length;
const fmClose = (familyMatches.match(/<\/div>/g) || []).length;
console.log('FamilyMatches div opens:', fmOpen, 'div closes:', fmClose, 'diff:', fmOpen - fmClose);

// Fix FamilyMatchesPage - add missing closing divs
// The structure should be: text-center > div, flex gap-4 > div, then closing those before flex-1
// Current issue: the </div> for flex gap-4 is missing
familyMatches = familyMatches.replace(
  '</div>\n                <div className="flex-1">\n                  <div className="flex items-center gap-2 mb-3">',
  '</div>\n              </div>\n                <div className="flex-1">\n                  <div className="flex items-center gap-2 mb-3">'
);
fs.writeFileSync('src/pages/family/FamilyMatchesPage.tsx', familyMatches, 'utf-8');

// Recheck
familyMatches = fs.readFileSync('src/pages/family/FamilyMatchesPage.tsx', 'utf-8');
const fmOpen2 = (familyMatches.match(/<div[^>]*>/g) || []).length;
const fmClose2 = (familyMatches.match(/<\/div>/g) || []).length;
console.log('After fix - FamilyMatches div opens:', fmOpen2, 'div closes:', fmClose2, 'diff:', fmOpen2 - fmClose2);
