const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

function writeFile(rel, content) {
  fs.writeFileSync(path.join(ROOT, rel), content);
  console.log('  Wrote:', rel);
}

const pagesToFix = [
  'src/pages/AboutPage.tsx',
  'src/pages/HomePage.tsx',
  'src/pages/admin/AdminApprovalsPage.tsx',
  'src/pages/admin/AdminDashboard.tsx',
  'src/pages/admin/AdminAnalyticsPage.tsx',
  'src/pages/admin/AdminUsersPage.tsx',
  'src/pages/police/PoliceCasesPage.tsx',
  'src/pages/police/PoliceFoundPage.tsx',
];

for (const page of pagesToFix) {
  const fullPath = path.join(ROOT, page);
  if (!fs.existsSync(fullPath)) {
    console.log('  Missing:', page);
    continue;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  
  const divOpen = (content.match(/<div[^>]*>/g) || []).length;
  const divClose = (content.match(/<\/div>/g) || []).length;
  const diff = divOpen - divClose;
  
  if (diff !== 0) {
    console.log('  Fixing ' + page + ': need +' + diff + ' divs');
    if (diff > 0) {
      const lastCloseParen = content.lastIndexOf(')');
      if (lastCloseParen > 0) {
        const before = content.slice(0, lastCloseParen);
        const after = content.slice(lastCloseParen);
        const extraDivs = '\n' + Array(diff).fill('</div>').join('\n') + '\n';
        content = before + extraDivs + after;
      }
    }
    if (diff < 0) {
      const toRemove = Math.abs(diff);
      for (let i = 0; i < toRemove; i++) {
        const lastDivClose = content.lastIndexOf('</div>');
        if (lastDivClose > 0) {
          content = content.slice(0, lastDivClose) + content.slice(lastDivClose + 6);
        }
      }
    }
    writeFile(page, content);
  } else {
    console.log('  OK: ' + page + ' (' + divOpen + ' divs balanced)');
  }
}

const allPages = [
  'src/pages/HomePage.tsx', 'src/pages/AboutPage.tsx', 'src/pages/AuthPage.tsx',
  'src/pages/FoundPersonsPage.tsx', 'src/pages/MissingPersonsPage.tsx',
  'src/pages/NotificationsPage.tsx', 'src/pages/ProfilePage.tsx', 'src/pages/SettingsPage.tsx',
  'src/pages/admin/AdminApprovalsPage.tsx', 'src/pages/admin/AdminDashboard.tsx',
  'src/pages/admin/AdminAnalyticsPage.tsx', 'src/pages/admin/AdminAuditPage.tsx',
  'src/pages/admin/AdminLoginPage.tsx', 'src/pages/admin/AdminReportsPage.tsx',
  'src/pages/admin/AdminUsersPage.tsx', 'src/pages/citizen/CitizenDashboard.tsx',
  'src/pages/citizen/ReportFoundPage.tsx', 'src/pages/citizen/SearchMissingPage.tsx',
  'src/pages/family/FamilyDashboard.tsx', 'src/pages/family/FamilyMatchesPage.tsx',
  'src/pages/family/ReportMissingPage.tsx', 'src/pages/police/PoliceCasesPage.tsx',
  'src/pages/police/PoliceDashboard.tsx', 'src/pages/police/PoliceFoundPage.tsx',
  'src/pages/police/PolicePendingPage.tsx',
];

console.log('\n=== Checking all pages ===');
for (const page of allPages) {
  const fullPath = path.join(ROOT, page);
  if (!fs.existsSync(fullPath)) {
    console.log('  MISSING: ' + page);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  const divOpen = (content.match(/<div[^>]*>/g) || []).length;
  const divClose = (content.match(/<\/div>/g) || []).length;
  const diff = divOpen - divClose;
  const sectionOpen = (content.match(/<section[^>]*>/g) || []).length;
  const sectionClose = (content.match(/<\/section>/g) || []).length;
  const sDiff = sectionOpen - sectionClose;
  const isSingleLine = lines.length <= 3;
  
  if (isSingleLine) { console.log('  CORRUPTED(Single line): ' + page); }
  else if (diff !== 0) { console.log('  UNBALANCED(div:' + diff + '): ' + page); }
  else if (sDiff !== 0) { console.log('  UNBALANCED(section:' + sDiff + '): ' + page); }
  else { console.log('  OK: ' + page); }
}

console.log('\n=== Done ===');
