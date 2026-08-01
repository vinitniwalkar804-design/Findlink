/**
 * REPRODUCTION SCRIPT
 * Determines whether the failure is:
 *  (a) Windows command-line length limit (large JSON in argv)
 *  (b) A Python crash / non-zero exit even with a small JSON
 *  (c) Something else
 *
 * Runs exactly what faceMatching.js does, with the SAME python executable.
 */
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const PYTHON = 'C:/Users/vinit/AppData/Local/Programs/Python/Python312/python.exe';
const SCRIPT = path.join(__dirname, 'backend', 'services', 'face_match.py');
const UPLOADS = path.join(__dirname, 'backend', 'uploads');

const files = fs.readdirSync(UPLOADS).filter((f) => /\.(jpe?g|png)$/i.test(f));
const PHOTO = path.join(UPLOADS, files[0]);
console.log('Python   :', PYTHON);
console.log('Script   :', SCRIPT);
console.log('Photo    :', PHOTO, '| exists:', fs.existsSync(PHOTO));
console.log('Photo size:', fs.existsSync(PHOTO) ? fs.statSync(PHOTO).size : 'N/A');

function makeEmbedding() {
  const arr = [];
  for (let i = 0; i < 512; i++) arr.push(+(Math.random() * 2 - 1).toFixed(8));
  return arr;
}
function makePerson(id) {
  return { _id: id, faceEmbedding: makeEmbedding(), fullName: 'Person ' + id };
}

function run(label, persons) {
  return new Promise((resolve) => {
    const json = JSON.stringify(persons);
    const args = [SCRIPT, '--compare', PHOTO, json, '0.5'];
    const fullCmd = PYTHON + ' ' + args.join(' ');
    const t0 = Date.now();
    console.log('\n==============================================');
    console.log('TEST:', label);
    console.log('Persons:', persons.length, '| JSON length:', json.length, '| full command length:', fullCmd.length);
    console.log('(Windows CreateProcess limit = 32767 chars)');
    console.log('==============================================');

    const child = execFile(PYTHON, args, { timeout: 90000, maxBuffer: 50 * 1024 * 1024 }, (err, stdout, stderr) => {
      const elapsed = Date.now() - t0;
      console.log('Elapsed ms:', elapsed);
      console.log('EXIT CODE:', err ? (err.code !== undefined && err.code !== null ? err.code : 'spawn-fail/' + err.code) : 0);
      console.log('SIGNAL:', err ? err.signal : null);
      console.log('KILLED:', err ? err.killed : false);
      if (err) console.log('ERR TYPE:', err.name || 'Error', '| message head:', err.message.split('\n')[0]);
      console.log('STDOUT (first 600):');
      console.log((stdout || '(empty)').substring(0, 600));
      console.log('STDERR (first 600):');
      console.log((stderr || '(empty)').substring(0, 600));
      if (!err) {
        try { console.log('Parsed JSON ok. candidates:', JSON.parse(stdout).candidates ? JSON.parse(stdout).candidates.length : 'N/A'); }
        catch (e) { console.log('JSON parse FAILED:', e.message); }
      }
      resolve();
    });
    child.on('error', (e) => {
      console.log('spawn error event:', e.message);
    });
  });
}

(async () => {
  // TEST 1: small JSON (1 person) — checks whether Python pipeline itself works
  await run('SMALL (1 person, ~10KB JSON)', [makePerson('aaa111')]);

  // TEST 2: large JSON (25 persons) — exceeds Windows 32767 command-line limit
  const many = [];
  for (let i = 0; i < 25; i++) many.push(makePerson('person-' + i));
  await run('LARGE (25 persons, ~250KB JSON)', many);

  console.log('\n=== REPRODUCTION COMPLETE ===');
  process.exit(0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });

