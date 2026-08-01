# TODO — Debug AI Face Matching Pipeline

## Root Cause
Windows `CreateProcess` command-line length limit (32,767 chars). The backend
passed the entire 512-D embeddings JSON (one embedding ≈ 5.9KB; many persons =
hundreds of KB) as `argv[3]` to `face_match.py --compare`. Beyond 32,767 chars
`child_process.execFile()` fails with `spawn ENAMETOOLONG` → `Python process
error: Command failed` → HTTP 500.

## Steps
- [x] Inspect code that launches `face_match.py` (`backend/services/faceMatching.js`)
- [x] Reproduce failure (large JSON → `ENAMETOOLONG`; small JSON → success)
- [x] Modify `backend/services/faceMatching.js`
  - [x] Write large embeddings JSON to a temp file; pass `@<file>` instead of raw JSON argv
  - [x] Add `COMMAND` / `EXIT CODE` / `STDOUT` / `STDERR` / `PYTHON TRACEBACK` logging (never truncate)
  - [x] Clean up temp JSON files after execution
- [x] Modify `backend/services/face_match.py`
  - [x] Support `@<file>` argument resolution (keep raw-JSON backward compatibility)
  - [x] Print full traceback to stderr on any unhandled exception
- [x] Modify `backend/services/ai/service.py` (same `@<file>` handling for `--add`)
  - [x] Support `@<file>` argument resolution
  - [x] Print full traceback on any unhandled exception
- [x] Verify large embedding payloads no longer fail (`verify_fix.cjs`: 25 persons, 147KB → exit 0, 5 candidates)
- [x] Verify `--add` path (`verify_add.cjs`: 5.8KB embedding → `@tempfile` → added 1 vector)
- [x] Verify comparison completes and candidates are returned

