const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'src', 'pages');

// CitizenDashboard.tsx  
const citizenDashboard = `import { Link } from 'react-router-dom';
import { UserPlus, Search, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Spinner, EmptyState } from '../../components/ui';

export default function CitizenDashboard() {
  const { profile } = useAuth();
  const [foundPersons, setFoundPersons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    api.getMyFoundPersons()
      .then((data) => { setFoundPersons(data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [profile]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Citizen Dashboard</h1>
        <p className="mt-2 text-gray-500">Welcome, {profile?.full_name}. Help reunite families.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link to="/citizen/report-found" className="card p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform"><UserPlus size={24} /></div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Report a Found Person</h2>
              <p className="text-sm text-gray-500">Found someone who may be lost or missing?</p>
            </div>
        </Link>
        <Link to="/citizen/search" className="card p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 text-green-600 group-hover:scale-110 transition-transform"><Search size={24} /></div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Search Missing Persons</h2>
              <p className="text-sm text-gray-500">Browse the missing persons database</p>
            </div>
        </Link>
      </div>
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Found Person Reports</h2>
          <Link to="/citizen/report-found" className="btn-primary"><UserPlus size={16} /> Report Found</Link>
        </div>
        {foundPersons.length === 0 ? (
          <EmptyState icon={<Users size={48} />} title="No reports yet" message="Report a found person to help reunite them with their family" />
        ) : (
          <div className="space-y-3">
            {foundPersons.map((fp) => (
              <div key={fp._id || fp.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {fp.photoUrl || fp.photo_url ? <img src={fp.photoUrl || fp.photo_url} alt="Found" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Users size={20} /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{fp.foundAddress || fp.found_address || 'Unknown location'}</p>
                  <p className="text-sm text-gray-500">{fp.foundDate || fp.found_date ? new Date(fp.foundDate || fp.found_date).toLocaleDateString() : ''}</p>
                </div>
                <span className={
                  fp.status === 'unidentified' ? 'badge-yellow' :
                  fp.status === 'identified' ? 'badge-blue' :
                  'badge-green'
                }>{fp.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
  );
}`;

const files = {
  'citizen/CitizenDashboard.tsx': citizenDashboard,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(base, relativePath);
  fs.writeFileSync(fullPath, content);
  console.log('Written:', fullPath);
  
  // Verify balances
  const divOpen = (content.match(/<div[^>]*>/g) || []).length;
  const divClose = (content.match(/<\/div>/g) || []).length;
  const linkOpen = (content.match(/<Link[^>]*>/g) || []).length;
  const linkClose = (content.match(/<\/Link>/g) || []).length;
  const sectionOpen = (content.match(/<section[^>]*>/g) || []).length;
  const sectionClose = (content.match(/<\/section>/g) || []).length;
  
  console.log(`  div: ${divOpen}/${divClose} ${divOpen === divClose ? 'OK' : 'MISMATCH'}`);
  console.log(`  Link: ${linkOpen}/${linkClose} ${linkOpen === linkClose ? 'OK' : 'MISMATCH'}`);
  console.log(`  section: ${sectionOpen}/${sectionClose} ${sectionOpen === sectionClose ? 'OK' : 'MISMATCH'}`);
}

// Now fix all remaining files by checking tag balance
function fixTags(filepath) {
  let c = fs.readFileSync(filepath, 'utf-8');
  let lines = c.split('\n');
  
  // Count all tag types
  const divOpens = (c.match(/<div[^>]*>/g) || []).length;
  const divCloses = (c.match(/<\/div>/g) || []).length;
  const linkOpens = (c.match(/<Link[^>]*>/g) || []).length;
  const linkCloses = (c.match(/<\/Link>/g) || []).length;
  const sectionOpens = (c.match(/<section[^>]*>/g) || []).length;
  const sectionCloses = (c.match(/<\/section>/g) || []).length;
  
  const divDiff = divOpens - divCloses;
  const linkDiff = linkOpens - linkCloses;
  
  if (divDiff === 0 && linkDiff === 0) {
    return; // Already balanced
  }
  
  console.log(`\nFixing ${filepath}: divDiff=${divDiff}, linkDiff=${linkDiff}`);
  
  // Find the last return statement close
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === ');') {
      // Add missing closing tags before the );
      for (let d = 0; d < divDiff; d++) {
        lines.splice(i, 0, '        </div>');
      }
      for (let l = 0; l < linkDiff; l++) {
        lines.splice(i, 0, '        </Link>');
      }
      break;
    }
  }
  
  c = lines.join('\n');
  const newDivOpens = (c.match(/<div[^>]*>/g) || []).length;
  const newDivCloses = (c.match(/<\/div>/g) || []).length;
  const newLinkOpens = (c.match(/<Link[^>]*>/g) || []).length;
  const newLinkCloses = (c.match(/<\/Link>/g) || []).length;
  
  console.log(`  div: ${newDivOpens}/${newDivCloses} ${newDivOpens === newDivCloses ? 'OK' : 'MISMATCH'}`);
  console.log(`  Link: ${newLinkOpens}/${newLinkCloses} ${newLinkOpens === newLinkCloses ? 'OK' : 'MISMATCH'}`);
  
  fs.writeFileSync(filepath, c);
}

// Fix all page files
const pageFiles = [
  'family/FamilyDashboard.tsx',
  'family/FamilyMatchesPage.tsx',
  'citizen/SearchMissingPage.tsx',
  'police/PoliceDashboard.tsx',
  'police/PoliceCasesPage.tsx',
  'police/PoliceFoundPage.tsx',
  'admin/AdminDashboard.tsx',
  'admin/AdminApprovalsPage.tsx',
  'admin/AdminUsersPage.tsx',
  'admin/AdminReportsPage.tsx',
  'admin/AdminAnalyticsPage.tsx',
  'admin/AdminAuditPage.tsx',
  'MissingPersonsPage.tsx',
  'FoundPersonsPage.tsx',
  'ProfilePage.tsx',
  'SettingsPage.tsx',
];

for (const f of pageFiles) {
  const fp = path.join(base, f);
  if (fs.existsSync(fp)) {
    fixTags(fp);
  }
}
