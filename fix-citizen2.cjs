const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'src', 'pages', 'citizen', 'CitizenDashboard.tsx');
let c = fs.readFileSync(p, 'utf-8');

// Fix the inline link: remove the extra </div> that appears inside the Link and its standalone counterpart
// Line 51 has: 'Report Found</div>' instead of 'Report Found'
// Line 53 has an extra standalone </div>

let lines = c.split('\n');
for (let i = 0; i < lines.length; i++) {
  // Fix the inline link itself
  if (lines[i].includes('Report Found') && lines[i].includes('<Link')) {
    lines[i] = lines[i].replace('</div>', '');
  }
  // Also remove the extra </div> caused by the replace in the script
}

// Re-count
c = lines.join('\n');
const o = (c.match(/<div[^>]*>/g) || []).length;
const cl = (c.match(/<\/div>/g) || []).length;
console.log('After fix 1 - div:', o, cl);

// If still not matched, find standalone </div> on its own line that's extra
if (o !== cl) {
  lines = c.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === '</div>') {
      // Check if removing this brings balance
      let temp = lines.slice();
      temp.splice(i, 1);
      let tc = temp.join('\n');
      let to = (tc.match(/<div[^>]*>/g) || []).length;
      let tcl = (tc.match(/<\/div>/g) || []).length;
      if (to === tcl) {
        console.log('Removing extra </div> at line', i + 1);
        lines.splice(i, 1);
        break;
      }
    }
  }
  c = lines.join('\n');
}

const o2 = (c.match(/<div[^>]*>/g) || []).length;
const cl2 = (c.match(/<\/div>/g) || []).length;
console.log('Final - div:', o2, cl2, 'OK:', o2 === cl2);
fs.writeFileSync(p, c);
