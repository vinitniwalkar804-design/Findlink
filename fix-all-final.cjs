const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'src', 'pages');

function countTags(content) {
  return {
    divOpen: (content.match(/<div[^>]*>/g) || []).length,
    divClose: (content.match(/<\/div>/g) || []).length,
    linkOpen: (content.match(/<Link[^>]*>/g) || []).length,
    linkClose: (content.match(/<\/Link>/g) || []).length,
    sectionOpen: (content.match(/<section[^>]*>/g) || []).length,
    sectionClose: (content.match(/<\/section>/g) || []).length,
  };
}

function fixFile(filepath) {
  let c = fs.readFileSync(filepath, 'utf-8');
  const before = countTags(c);
  
  // Replace all </Link> with </div></Link> if there's an unclosed div inside Link
  // But the inline <Link ...>text</Link> shouldn't get </div>
  // Strategy: For each <Link>...</Link>, check if inner content has <div without matching </div>
  
  // Simpler: For each </Link> preceded by non-</div>, check if preceding tag opened a div
  c = c.replace(/<Link([^>]*)>([\s\S]*?)<\/Link>/g, (match, attrs, inner) => {
    const innerTrimmed = inner.trim();
    if (innerTrimmed.includes('<div') && !innerTrimmed.endsWith('</div>')) {
      // Need to close inner div before Link
      return `<Link${attrs}>${inner}</div></Link>`;
    }
    return match;
  });
  
  const after = countTags(c);
  fs.writeFileSync(filepath, c);
  
  console.log(path.basename(filepath));
  console.log(`  div: ${before.divOpen}/${before.divClose} -> ${after.divOpen}/${after.divClose} ${after.divOpen === after.divClose ? 'OK' : 'NEEDS FIX'}`);
  
  return after.divOpen === after.divClose && after.linkOpen === after.linkClose;
}

const files = [
  'citizen/CitizenDashboard.tsx',
  'citizen/SearchMissingPage.tsx',
  'family/FamilyDashboard.tsx',
  'family/FamilyMatchesPage.tsx',
  'police/PoliceDashboard.tsx',
  'police/PoliceCasesPage.tsx',
  'police/PoliceFoundPage.tsx',
  'admin/AdminDashboard.tsx',
  'admin/AdminApprovalsPage.tsx',
  'admin/AdminUsersPage.tsx',
  'admin/AdminReportsPage.tsx',
  'admin/AdminAnalyticsPage.tsx',
  'admin/AdminAuditPage.tsx',
  'HomePage.tsx',
  'MissingPersonsPage.tsx',
  'FoundPersonsPage.tsx',
  'ProfilePage.tsx',
  'SettingsPage.tsx',
  'AboutPage.tsx',
];

let allOk = true;
for (const f of files) {
  const fp = path.join(base, f);
  if (fs.existsSync(fp)) {
    const ok = fixFile(fp);
    if (!ok) allOk = false;
  }
}

if (allOk) {
  console.log('\nAll files balanced!');
} else {
  console.log('\nSome files still need fixing');
}
