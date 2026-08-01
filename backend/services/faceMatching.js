/**
 * Face Matching Service (v2 - FAISS + Multi-Embedding)
 * 
 * Communicates with the Python AI service through JSON subprocess.
 * Python stdout = JSON only. All logging goes to stderr.
 * 
 * Key improvements:
 * - Multi-embedding support (multiple reference images per person)
 * - FAISS vector index for sub-second search across 100K+ embeddings
 * - Blur detection and quality assessment
 * - Configurable thresholds (MATCH >= 0.60, POSSIBLE >= 0.45, LOW >= 0.30)
 * - InsightFace buffalo_l (ArcFace) for recognition
 * - RetinaFace for face detection
 */

const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const AI_SERVICE_SCRIPT = path.join(__dirname, 'ai', 'service.py');
const LEGACY_FACE_MATCH_SCRIPT = path.join(__dirname, 'face_match.py');

// Windows CreateProcess limits the full command line to 32767 characters.
// A single 512-D face embedding serializes to ~6KB of JSON, so bundling many
// embeddings for --compare / --add easily exceeds that limit and makes
// execFile() fail with ENAMETOOLONG. Any JSON argument longer than this
// threshold is written to a temporary file and passed as @<filepath> instead.
const MAX_INLINE_ARG_LENGTH = 4000;

/**
 * Returns true when an argument is a raw JSON payload too large to safely put
 * on the command line.
 */
function isLargeJsonArg(arg) {
  return (
    typeof arg === 'string' &&
    arg.length > MAX_INLINE_ARG_LENGTH &&
    (arg.startsWith('[') || arg.startsWith('{'))
  );
}

/**
 * Write a string payload to a unique temporary JSON file and return its path.
 */
function writeTempJsonFile(data) {
  const tmpPath = path.join(
    os.tmpdir(),
    `findlink-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
  );
  fs.writeFileSync(tmpPath, data, 'utf8');
  return tmpPath;
}

/**
 * Best-effort removal of temporary JSON files created for an invocation.
 */
function cleanupTempFiles(files) {
  for (const f of files || []) {
    try {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    } catch (e) {
      // best effort - ignore
    }
  }
}

/**
 * Test whether a given executable runs Python successfully.
 */
function testPythonExecutable(execPath, args = ['--version']) {
  try {
    const { execFileSync } = require('child_process');
    const result = execFileSync(execPath, args, { timeout: 5000, encoding: 'utf8' });
    const output = (result || '').trim().toLowerCase();
    if (output.includes('python')) {
      return execPath;
    }
  } catch (e) {
    // not found
  }
  return null;
}

/**
 * Detect the Python executable to use.
 */
function getPythonExecutable() {
  const preferredPaths = [
    process.env.PYTHON_PATH,
    'C:/Users/vinit/AppData/Local/Programs/Python/Python312/python.exe',
    'C:\\Users\\vinit\\AppData\\Local\\Programs\\Python\\Python312\\python.exe',
  ].filter(Boolean);

  for (const candidate of preferredPaths) {
    const result = testPythonExecutable(candidate);
    if (result) return result;
  }

  if (process.platform === 'win32') {
    const py3Result = testPythonExecutable('py', ['-3', '--version']);
    if (py3Result) return 'py -3';

    const pyResult = testPythonExecutable('py', ['--version']);
    if (pyResult) return 'py';
  }

  const py3Exe = testPythonExecutable('python3');
  if (py3Exe) return py3Exe;

  const pyExe = testPythonExecutable('python');
  if (pyExe) return pyExe;

  return null;
}

/**
 * Get the match threshold from environment or default.
 */
function getThreshold() {
  const val = parseFloat(process.env.FACE_MATCH_THRESHOLD);
  if (!isNaN(val) && val > 0 && val < 1) {
    return val;
  }
  return 0.50; // default
}

/**
 * Run the Python AI service with given arguments.
 * @param {string[]} args - Arguments to pass to service.py
 * @returns {Promise<object>} Parsed JSON result
 */
function runPythonScript(scriptPath, args) {
  const pythonExec = getPythonExecutable();
  if (!pythonExec) {
    throw new Error(
      'Python is not installed. Face matching is unavailable.\n' +
      'Install Python 3.8+ from https://www.python.org/downloads/'
    );
  }

  // Write oversized JSON arguments to a temporary file, pass @<filepath>.
  const tempFiles = [];
  const processedArgs = (args || []).map((arg) => {
    if (isLargeJsonArg(arg)) {
      const tmpPath = writeTempJsonFile(arg);
      tempFiles.push(tmpPath);
      return '@' + tmpPath;
    }
    return arg;
  });

  const parts = pythonExec.split(' ');
  const cmd = parts[0];
  const allArgs = [...parts.slice(1), scriptPath, ...processedArgs];

  const separator = '======================';
  const logCmd = `${pythonExec} ${processedArgs.join(' ')}`;

  return new Promise((resolve, reject) => {
    const child = execFile(cmd, allArgs, { timeout: 120000, maxBuffer: 50 * 1024 * 1024 }, (err, stdout, stderr) => {
      console.log(separator);
      console.log('COMMAND');
      console.log(separator);
      console.log(logCmd);
      console.log('');

      console.log(separator);
      console.log('EXIT CODE');
      console.log(separator);
      console.log(err ? (err.code !== undefined && err.code !== null ? err.code : 'spawn-failed') : 0);
      console.log('');

      console.log(separator);
      console.log('STDOUT');
      console.log(separator);
      console.log(stdout === undefined || stdout === null || stdout === '' ? '(no stdout)' : stdout);
      console.log('');

      console.log(separator);
      console.log('STDERR');
      console.log(separator);
      console.log(stderr === undefined || stderr === null || stderr === '' ? '(no stderr)' : stderr);
      console.log('');

      if (err) {
        const tracebackMarker = (stderr || '').includes('Traceback');
        console.log(separator);
        console.log('PYTHON TRACEBACK');
        console.log(separator);
        console.log(tracebackMarker ? stderr : '(no Python traceback in stderr)');
        console.log('');

        cleanupTempFiles(tempFiles);
        reject(new Error(
          'Python process error: ' + err.message + '\n' +
          'Command: ' + logCmd + '\n' +
          'Exit code: ' + err.code + '\n' +
          'STDERR:\n' + (stderr || '(no stderr)') + '\n' +
          'STDOUT:\n' + (stdout || '(no stdout)')
        ));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        if (result.error) {
          cleanupTempFiles(tempFiles);
          reject(new Error(result.error));
          return;
        }
        cleanupTempFiles(tempFiles);
        resolve(result);
      } catch (parseErr) {
        cleanupTempFiles(tempFiles);
        reject(new Error('Failed to parse Python output: ' + parseErr.message + '. Raw: ' + stdout.substring(0, 200)));
      }
    });

    child.on('error', (err) => {
      console.log(separator);
      console.log('PYTHON TRACEBACK');
      console.log(separator);
      console.log('Failed to spawn Python process: ' + err.message);
      console.log('');
      cleanupTempFiles(tempFiles);
      reject(new Error('Failed to start Python: ' + err.message + '\nCommand: ' + logCmd));
    });
  });
}

function runPythonService(args) {
  return runPythonScript(AI_SERVICE_SCRIPT, args);
}

/**
 * Compute face embedding for a single image.
 * 
 * @param {string} imagePath - Absolute path to the image file
 * @returns {Promise<{embedding: number[], embedding_norm: number, faceCount: number, quality: object, error: string|null}>}
 */
async function computeEmbedding(imagePath) {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  const result = await runPythonService(['--store', imagePath]);
  
  return {
    embedding: result.embedding,
    embedding_norm: result.embedding_norm,
    faceCount: result.face_count || 1,
    quality: result.quality,
    error: null,
  };
}

/**
 * Add embeddings to the FAISS index.
 * 
 * @param {string} personId - MongoDB _id as string
 * @param {number[][]} embeddings - Array of embedding vectors
 * @param {string} personName - Person's full name
 * @returns {Promise<object>}
 */
async function addToIndex(personId, embeddings, personName = '') {
  const embeddingsJson = JSON.stringify(embeddings);
  const result = await runPythonService(['--add', personId, embeddingsJson, personName]);
  return result;
}

/**
 * Remove a person from the FAISS index.
 * 
 * @param {string} personId - MongoDB _id as string
 * @returns {Promise<object>}
 */
async function removeFromIndex(personId) {
  const result = await runPythonService(['--remove', personId]);
  return result;
}

/**
 * Compare a found person's photo against the FAISS index.
 * 
 * @param {string} foundPhotoUrl - URL/path of the found person's photo
 * @param {Array} missingEmbeddings - Array of missing persons with embeddings (from MongoDB)
 * @param {string} uploadsDir - Absolute path to uploads directory
 * @returns {Promise<{candidates: Array, candidateCount: number, totalSearched: number}>}
 */
async function findMatches(foundPhotoUrl, missingEmbeddings, uploadsDir) {
  // Resolve found photo path
  const foundPhotoName = path.basename(foundPhotoUrl);
  const foundPhotoPath = path.join(uploadsDir, foundPhotoName);

  if (!fs.existsSync(foundPhotoPath)) {
    const error = new Error(`Photo file not found: ${foundPhotoUrl}`);
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmbeddings = (missingEmbeddings || [])
    .filter((person) => person && Array.isArray(person.faceEmbedding) && person.faceEmbedding.length > 0)
    .map((person) => ({
      _id: person._id ? (person._id.toString ? person._id.toString() : String(person._id)) : null,
      faceEmbedding: person.faceEmbedding,
      fullName: person.fullName || person.full_name || '',
    }))
    .filter((person) => person._id);

  if (normalizedEmbeddings.length > 0) {
    const embeddingsJson = JSON.stringify(normalizedEmbeddings);
    const result = await runPythonScript(LEGACY_FACE_MATCH_SCRIPT, ['--compare', foundPhotoPath, embeddingsJson, String(getThreshold())]);

    const candidates = (result.candidates || []).map((candidate) => ({
      ...candidate,
      person_id: candidate.missingPersonId || candidate.person_id || candidate.missing_person_id,
      match_label: candidate.matchLabel || candidate.match_label || 'NO_MATCH',
      match_rank: candidate.matchRank || candidate.match_rank || 0,
      similarity: typeof candidate.similarity === 'number' ? candidate.similarity : 0,
    }));

    return {
      matches: candidates.filter((candidate) => candidate.match_label === 'MATCH' || candidate.match_label === 'POSSIBLE'),
      candidates,
      candidateCount: result.candidateCount || candidates.length,
      totalCompared: result.totalCompared || 0,
      totalPersonsInIndex: normalizedEmbeddings.length,
      queryQuality: null,
    };
  }

  const result = await runPythonService(['--compare', foundPhotoPath, '5']);

  return {
    matches: (result.candidates || []).filter((candidate) => candidate.match_label === 'MATCH' || candidate.match_label === 'POSSIBLE'),
    candidates: result.candidates || [],
    candidateCount: result.candidate_count || 0,
    totalCompared: result.total_searched || 0,
    totalPersonsInIndex: result.total_persons_in_index || 0,
    queryQuality: result.quality || null,
  };
}

/**
 * Get debug information about the face recognition system.
 * 
 * @returns {Promise<object>}
 */
async function getDebugInfo() {
  const result = await runPythonService(['--debug']);
  return result;
}

/**
 * Rebuild/refresh the FAISS index.
 * 
 * @returns {Promise<object>}
 */
async function rebuildIndex() {
  const result = await runPythonService(['--rebuild-index']);
  return result;
}

/**
 * Check if Python and required packages are available.
 */
async function checkPythonAvailability() {
  const pythonExec = getPythonExecutable();

  if (!pythonExec) {
    return {
      available: false,
      executable: null,
      message: 'Python is not installed. Install Python 3.8+ from https://www.python.org/downloads/',
    };
  }

  try {
    const result = await runPythonService(['--debug']);
    return {
      available: true,
      executable: pythonExec,
      message: `Python available: ${pythonExec}`,
      debug: result,
    };
  } catch (e) {
    return {
      available: false,
      executable: pythonExec,
      message: `Python found but service failed: ${e.message}`,
    };
  }
}

module.exports = {
  findMatches,
  computeEmbedding,
  addToIndex,
  removeFromIndex,
  getDebugInfo,
  rebuildIndex,
  checkPythonAvailability,
  getPythonExecutable,
  getThreshold,
};