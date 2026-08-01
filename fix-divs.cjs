const fs = require('fs');

// Fix HomePage.tsx
let hp = fs.readFileSync('src/pages/HomePage.tsx', 'utf8');
// Count current
let open = (hp.match(/<div[^>]*>/g) || []).length;
let close = (hp.match(/<\/div>/g) || []).length;
console.log('HomePage before:', open, '/', close, 'diff:', open - close);

// Need to add close - open more </div> tags
// Add them before each </section>
let sections = hp.split('</section>');
let totalNeeded = open - close;
let fixed = '';
let added = 0;

for (let i = 0; i < sections.length; i++) {
  if (i < sections.length - 1) {
    let sectionDivs = (sections[i].match(/<div[^>]*>/g) || []).length;
    let sectionCloses = (sections[i].match(/<\/div>/g) || []).length;
    let needHere = sectionDivs - sectionCloses;
    if (needHere > 0) {
      fixed += sections[i] + '</div>'.repeat(needHere) + '</section>';
      added += needHere;
    } else {
      fixed += sections[i] + '</section>';
    }
  } else {
    fixed += sections[i];
  }
}

if (added > 0) {
  fs.writeFileSync('src/pages/HomePage.tsx', fixed);
  open = (fixed.match(/<div[^>]*>/g) || []).length;
  close = (fixed.match(/<\/div>/g) || []).length;
  console.log('HomePage after:', open, '/', close, 'added', added);
} else {
  console.log('HomePage: no fix needed, adding to last section');
  // Add all remaining at end
  fixed = hp.replace('</div>', '</div></div>');
  fs.writeFileSync('src/pages/HomePage.tsx', fixed);
}

// Fix AboutPage.tsx
let ap = fs.readFileSync('src/pages/AboutPage.tsx', 'utf8');
open = (ap.match(/<div[^>]*>/g) || []).length;
close = (ap.match(/<\/div>/g) || []).length;
console.log('AboutPage before:', open, '/', close, 'diff:', open - close);

// Add remaining </div> at the end
let diff = open - close;
if (diff > 0) {
  ap = ap.replace('</div>', '</div>' + '</div>'.repeat(diff - 1));
  fs.writeFileSync('src/pages/AboutPage.tsx', ap);
  open = (ap.match(/<div[^>]*>/g) || []).length;
  close = (ap.match(/<\/div>/g) || []).length;
  console.log('AboutPage after:', open, '/', close);
}

console.log('Done fixing divs');
