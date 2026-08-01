const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/family/FamilyMatchesPage.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

// Fix: missing closing div for `flex gap-4` div
// Before: `</div>` then `<div className="flex-1">` (missing closing for the inner div)
// After: need `</div><div className="flex-1">`

// The issue: line with `</div>` followed by `<div className="flex-1">` - need an extra `</div>` between them
const fixed = content.replace(
  '                    <p className="mt-1 text-sm font-medium text-gray-900">Unknown</p>\n                  </div>\n                <div className="flex-1">',
  '                    <p className="mt-1 text-sm font-medium text-gray-900">Unknown</p>\n                  </div>\n                </div>\n                <div className="flex-1">'
);

fs.writeFileSync(filePath, fixed, 'utf-8');
console.log('Fixed FamilyMatchesPage.tsx');

// Verify
const updated = fs.readFileSync(filePath, 'utf-8');
const divOpen = (updated.match(/<div/g) || []).length;
const divClose = (updated.match(/<\/div>/g) || []).length;
console.log(`div opens: ${divOpen}, div closes: ${divClose}, diff: ${divOpen - divClose}`);
