const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src/pages');

function read(p) {
  return fs.readFileSync(path.join(pagesDir, p), 'utf-8');
}

function write(p, c) {
  fs.writeFileSync(path.join(pagesDir, p), c, 'utf-8');
  console.log('Fixed:', p);
}

// Check what AboutPage looks like now
console.log('=== Current AboutPage.jsx issues check ===');
let aboutContent = read('AboutPage.tsx');
let lines = aboutContent.split('\n');
lines.forEach((line, i) => {
  console.log((i+1) + ': ' + line);
});

// Check ReportMissing
let mp = read('family/ReportMissingPage.tsx');
console.log('\n=== ReportMissingPage.tsx check ===');
let mpLines = mp.split('\n');
mpLines.slice(-10).forEach((line, i) => {
  console.log((mpLines.length - 10 + i + 1) + ': ' + line);
});
