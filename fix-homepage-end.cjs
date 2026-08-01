
let c = fs.readFileSync(filePath, 'utf-8');

// Show the last 10 lines
const lines = c.split('\n');
console.log('Last 10 lines:');
for (let i = Math.max(0, lines.length - 10); i < lines.length; i++) {
  console.log(i+1 + ': ' + JSON.stringify(lines[i]));
}

// Fix the ending - remove the extra closing div and proper closing
c = c.replace(/\n<\/div>\n\);\n\}$/, '\n  );\n}');

fs.writeFileSync(filePath, c);
console.log('\nFixed. Now checking:');
const newLines = c.split('\n');
for (let i = Math.max(0, newLines.length - 5); i < newLines.length; i++) {
  console.log(i+1 + ': ' + JSON.stringify(newLines[i]));
}

// Count divs
const opens = (c.match(/<div[^>]*>/g) || []).length;
const closes = (c.match(/<\/div>/g) || []).length;
console.log('\ndiv opens:', opens, 'closes:', closes);
console.log(opens === closes ? 'BALANCED' : 'NOT BALANCED - diff: ' + (opens - closes));
