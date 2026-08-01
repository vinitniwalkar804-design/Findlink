const fs = require('fs');

// ============== HomePage.tsx ==============
// We need to restore the full page. HomePage has 21 opens/23 closes (2 extra)
// Easiest: restore from known-good source with proper div balance
// We already restored via restore-homepage.cjs, the issue is div imbalance from botched edits
// Let's just strip the 2 extra </div> tags

let hp = fs.readFileSync('src/pages/HomePage.tsx', 'utf8');
let opens = (hp.match(/<div[^>]*>/g) || []).length;
let closes = (hp.match(/<\/div>/g) || []).length;
let diff = opens - closes;
console.log('HomePage: opens=' + opens + ' closes=' + closes + ' diff=' + diff);

if (diff < 0) {
  // Too many closes, remove the extras from end
  let count = Math.abs(diff);
  for (let i = 0; i < count; i++) {
    // Remove last occurrence of </div>
    let lastIdx = hp.lastIndexOf('</div>');
    if (lastIdx > -1) {
      hp = hp.substring(0, lastIdx) + hp.substring(lastIdx + 6);
    }
  }
  fs.writeFileSync('src/pages/HomePage.tsx', hp);
  opens = (hp.match(/<div[^>]*>/g) || []).length;
  closes = (hp.match(/<\/div>/g) || []).length;
  console.log('  Fixed: opens=' + opens + ' closes=' + closes);
}

// ============== AboutPage.tsx ==============
let ap = fs.readFileSync('src/pages/AboutPage.tsx', 'utf8');
opens = (ap.match(/<div[^>]*>/g) || []).length;
closes = (ap.match(/<\/div>/g) || []).length;
diff = opens - closes;
console.log('AboutPage: opens=' + opens + ' closes=' + closes + ' diff=' + diff);

if (diff > 0) {
  // Add missing closes before final </div> or at end
  let count = diff;
  // Find the last > character (end of last tag)
  let lastTagClose = ap.lastIndexOf('>');
  let insertPos = ap.lastIndexOf('</');
  if (insertPos === -1) insertPos = ap.length;
  ap = ap.substring(0, insertPos) + '</div>'.repeat(count) + ap.substring(insertPos);
  fs.writeFileSync('src/pages/AboutPage.tsx', ap);
  opens = (ap.match(/<div[^>]*>/g) || []).length;
  closes = (ap.match(/<\/div>/g) || []).length;
  console.log('  Fixed: opens=' + opens + ' closes=' + closes);
}

// ============== Final full scan ==============
const pages = [
  'src/pages/HomePage.tsx', 'src/pages/MissingPersonsPage.tsx',
  'src/pages/FoundPersonsPage.tsx', 'src/pages/ProfilePage.tsx',
  'src/pages/SettingsPage.tsx', 'src/pages/AboutPage.tsx',
  'src/pages/AuthPage.tsx', 'src/pages/NotificationsPage.tsx',
  'src/pages/admin/AdminDashboard.tsx', 'src/pages/admin/AdminApprovalsPage.tsx',
  'src/pages/admin/AdminUsersPage.tsx', 'src/pages/admin/AdminAnalyticsPage.tsx',
  'src/pages/admin/AdminReportsPage.tsx', 'src/pages/admin/AdminAuditPage.tsx',
  'src/pages/citizen/CitizenDashboard.tsx', 'src/pages/citizen/ReportFoundPage.tsx',
  'src/pages/citizen/SearchMissingPage.tsx', 'src/pages/family/FamilyDashboard.tsx',
  'src/pages/family/FamilyMatchesPage.tsx', 'src/pages/family/ReportMissingPage.tsx',
  'src/pages/police/PoliceDashboard.tsx', 'src/pages/police/PoliceCasesPage.tsx',
  'src/pages/police/PoliceFoundPage.tsx', 'src/pages/police/PolicePendingPage.tsx'
];

console.log('\n=== Final check of all pages ===');
let allOk = true;
for (const p of pages) {
  if (!fs.existsSync(p)) { console.log('MISSING: ' + p); allOk = false; continue; }
  const c = fs.readFileSync(p, 'utf8');
  const o = (c.match(/<div[^>]*>/g) || []).length;
  const cl = (c.match(/<\/div>/g) || []).length;
  const hasSup = c.includes('supabase') || c.includes('Supabase') || c.includes('@supabase');
  const ok = o === cl && !hasSup;
  if (!ok) console.log((o === cl ? 'DIV OK' : 'DIV: ' + o + '/' + cl) + ' ' + (hasSup ? 'HAS SUPABASE!' : '') + ' | ' + p);
  if (o !== cl || hasSup) allOk = false;
}
console.log(allOk ? 'ALL PAGES OK!' : 'ISSUES FOUND');
