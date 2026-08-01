const fs = require('fs');
const p = 'c:/Users/vinit/Downloads/project-bolt-sb1-vkxjyndf/project/src/pages/police/PoliceFoundPage.tsx';
let c = fs.readFileSync(p, 'utf-8');

// Fix: replace the bad ending
const badEnding = `      )}\n    </div>\n  \n</div>\n  );\n}`;
const goodEnding = `      )}\n    </div>\n  );\n}`;

if (c.endsWith(badEnding)) {
  c = c.slice(0, -badEnding.length) + goodEnding;
} else {
  // Try regex
  c = c.replace(/\n    <\/div>\n  \n<\/div>\n  \);\n\}/, '\n    </div>\n  );\n}');
}

fs.writeFileSync(p, c);
console.log('Fixed PoliceFoundPage.tsx');

const opens = (c.match(/<div[^>]*>/g) || []).length;
const selfClose = (c.match(/<div[^>]*\/\s*>/g) || []).length;
const closes = (c.match(/<\/div>/g) || []).length;
console.log('Opens:', opens, 'SelfClose:', selfClose, 'Real:', opens - selfClose, 'Closes:', closes);
console.log(opens - selfClose === closes ? 'BALANCED' : 'NOT BALANCED');
