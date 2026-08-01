const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

console.log('=== COMPLETE MIGRATION TO MONGODB ===\n');

// 1. Remove Supabase from frontend package.json
const frontendPkgPath = path.join(ROOT, 'package.json');
const frontendPkg = JSON.parse(fs.readFileSync(frontendPkgPath, 'utf-8'));
delete frontendPkg.dependencies['@supabase/supabase-js'];
fs.writeFileSync(frontendPkgPath, JSON.stringify(frontendPkg, null, 2) + '\n');
console.log('✓ Removed @supabase/supabase-js from frontend package.json');

// 2. Remove Supabase from backend package.json
const backendPkgPath = path.join(ROOT, 'backend', 'package.json');
const backendPkg = JSON.parse(fs.readFileSync(backendPkgPath, 'utf-8'));
delete backendPkg.dependencies['@supabase/supabase-js'];
fs.writeFileSync(backendPkgPath, JSON.stringify(backendPkg, null, 2) + '\n');
console.log('✓ Removed @supabase/supabase-js from backend package.json');

// 3. Remove .env.example with Supabase keys (if exists)
const envExamplePath = path.join(ROOT, '.env.example');
if (fs.existsSync(envExamplePath)) {
  let envExample = fs.readFileSync(envExamplePath, 'utf-8');
  envExample = envExample.replace(/VITE_SUPABASE.*\n?/g, '');
  fs.writeFileSync(envExamplePath, envExample);
  console.log('✓ Cleaned .env.example');
}

// 4. Delete supabase directory
const supabaseDir = path.join(ROOT, 'supabase');
if (fs.existsSync(supabaseDir)) {
  fs.rmSync(supabaseDir, { recursive: true, force: true });
  console.log('✓ Deleted supabase/ directory');
}

// 5. Delete supabase.ts
const supabaseTs = path.join(ROOT, 'src', 'lib', 'supabase.ts');
if (fs.existsSync(supabaseTs)) {
  fs.unlinkSync(supabaseTs);
  console.log('✓ Deleted src/lib/supabase.ts');
}

// 6. Delete old storage.ts (we already replaced it)
// Keep the new one

// 7. Delete old NotificationContext (we already replaced it)
// Keep the new one

// 8. Fix all pages - remove supabase imports and replace with api
const pagesDir = path.join(ROOT, 'src', 'pages');
const fixFiles = [
  'HomePage.tsx', 'MissingPersonsPage.tsx', 'FoundPersonsPage.tsx', 
  'ProfilePage.tsx', 'SettingsPage.tsx',
  'citizen/CitizenDashboard.tsx', 'citizen/SearchMissingPage.tsx',
  'family/FamilyDashboard.tsx', 'family/FamilyMatchesPage.tsx',
  'police/PoliceDashboard.tsx', 'police/PoliceCasesPage.tsx', 'police/PoliceFoundPage.tsx',
  'admin/AdminDashboard.tsx', 'admin/AdminApprovalsPage.tsx', 
  'admin/AdminUsersPage.tsx', 'admin/AdminReportsPage.tsx',
  'admin/AdminAnalyticsPage.tsx', 'admin/AdminAuditPage.tsx',
];

for (const file of fixFiles) {
  const fp = path.join(pagesDir, file);
  if (!fs.existsSync(fp)) continue;
  
  let content = fs.readFileSync(fp, 'utf-8');
  
  // Only fix files that import supabase
  if (content.includes('import { supabase }') || content.includes("from '../lib/supabase'") || content.includes("from '../../lib/supabase'")) {
    // Get the correct relative path
    const isSubdir = file.includes('/');
    const relPath = isSubdir ? '../../lib/supabase' : '../lib/supabase';
    const apiPath = isSubdir ? '../../lib/api' : '../lib/api';
    
    // Find what needs to be imported from api
    content = content.replace(
      new RegExp(`import\\{[^}]*\\} from '${relPath.replace(/\//g, '\\/')}'`),
      ''
    );
    
    // Read the file to understand what functions are used
    console.log(`  ${file} - needs manual verification (was using supabase)`);
  }
}

console.log('\n✓ Base migration complete');
console.log('\n=== NEXT STEPS ===');
console.log('1. npm install in project/ (frontend)');
console.log('2. npm install in project/backend/');
console.log('3. Seed location data: node seed/seed.cjs');
console.log('4. Start backend: cd backend && node server.js');
console.log('5. Start frontend: npm run dev');
