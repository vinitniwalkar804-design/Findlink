const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'src', 'pages', 'citizen', 'CitizenDashboard.tsx');
let c = fs.readFileSync(p, 'utf-8');

// The fix: find the third </Link> which is the inline one and ensure it doesn't have a preceding </div>
// Strategy: split into lines, count, and remove extra </div>

let lines = c.split('\n');
let linkCount = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '</Link>') {
    linkCount++;
    if (linkCount === 3) {
      // This is the inline Link - if previous line is </div>, remove it
      if (i > 0 && lines[i-1].trim() === '</div>') {
        console.log(`Removing extra </div> at line ${i-1}`);
        lines.splice(i-1, 1);
      }
      break;
    }
  }
}

c = lines.join('\n');

const openDivs = (c.match(/<div[^>]*>/g) || []).length;
const closeDivs = (c.match(/<\/div>/g) || []).length;
console.log(`divs: ${openDivs}/${closeDivs} ${openDivs === closeDivs ? 'OK' : 'NEEDS FIX'}`);

fs.writeFileSync(p, c);
