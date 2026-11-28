# Working on ClipCut

A short map for contributors and AI coding assistants.

## Installing or updating ClipCut for someone

**Before installing, ask the person where to put it**, and suggest a short, permanent folder: `C:\clipcut` on
Windows, `~/clipcut` on a Mac or Linux. Do not just clone into the folder you happen to be running in: AI assistants
often run in a temporary, scratch or session workspace, which gets deleted, and whose path is long enough that
Windows cannot load the speech library (Windows can't open files whose full path is over 260 characters; the error
is "DLL load failed ... The filename or extension is too long"). Tell the person where you put it.

**When updating**, look at where ClipCut is first. If its folder path is long (roughly over 100 characters) or inside
a temporary or assistant workspace, ask the person whether to move it to `C:\clipcut` (or `~/clipcut`) as part of the
update. Moving is safe when done like this: clone the latest version into the new folder, copy over `.env`,
`storage.json` and the `data` folder if there is one (the videos and clips; `storage.json` may point to a data folder
elsewhere, which then stays where it is), install the requirements, start it from the new folder, check the clips
are there, and only then offer to delete the old folder. Never delete anything without asking.

## Run and test

- Run: `python -m studio.server` (settings from `.env`; see `.env.example`). Needs Python 3.10+ and `ffmpeg`.
- ClipCut uses Faster-Whisper by default: one multi-language model (about 145 MB for `base`) handles
  auto-detection and 99+ languages, downloading on first start or ahead of time with
  `python -m studio.fetch_model [tiny|base|small|medium|large-v3]`.
- Tests: `python tests/run.py`. It starts a throwaway copy on a spare port with an empty data folder. Run it
  before and after any change to `studio/`. No keys needed.
- To try a risky change by hand without touching real data:
  `CLIPCUT_DATA=<temp folder> CLIPCUT_PORT=8766 python -m studio.server`.

## Where things are

| File | What it does |
|---|---|
| `studio/server.py` | Every web route, and the gate that runs before each request (who is asking, limits, headers) |
| `studio/config.py` | Every setting, read from environment variables |
| `studio/ai.py` | The only code that talks to an AI service, and the AI settings saved from the dashboard (`ai.json` in the data folder) |
| `studio/brain.py` | The prompts: finding clips, live judging, hooks and titles, caption fixes |
| `studio/usage.py` | The record of AI calls and tokens shown on the AI usage page |
| `studio/jobs.py` | The video pipeline and the fair queue |
| `studio/live.py` | Live recording and clipping |
| `studio/transcribe.py`, `studio/asr_worker.py` | Multi-language speech to text with Faster-Whisper, here or on a second GPU machine |
| `studio/fetch_model.py` | Faster-Whisper model sizes (`WHISPER_MODELS`) and downloading/caching them |
| `studio/render.py` | Cutting, layouts and captions (ffmpeg and Pillow) |
| `studio/media.py` | Downloading (yt-dlp), probing, audio |
| `studio/auth.py`, `studio/account.py`, `studio/admin.py` | Sign-in, deleting things, the admin dashboard |
| `studio/db.py` | Database tables (SQLAlchemy core; SQLite or PostgreSQL) |
| `web/index.html` | The whole signed-in app, one file, no build step |

## Rules worth knowing

- **Sign-in is off by default** (`config.ACCOUNTS`): every request then belongs to one built-in owner
  (`auth.local_user()`). With `CLIPCUT_ACCOUNTS=1` it is a normal multi-user site. Both paths are tested.
- **Who is asking** always comes from the session (`ctx.uid()`), never from the request body. Background threads
  set it themselves with `ctx.as_user(...)`.
- **Anything that changes what a user sees must call `ctx.bump()`**. The page polls `/api/sync`, which answers
  from memory when that user's counter has not moved.
- **Text from videos is untrusted**: it goes into prompts through `brain._safe` and out through `brain._text`.
- **Adding an AI provider**: add a row to `PROVIDERS` in `studio/ai.py`. If it speaks the OpenAI chat format that
  is all; otherwise add one function that returns `(parsed JSON, tokens in, tokens out)`.
- **Adding a spoken language**: add a `(code, label)` entry to `SPEECH_LANGUAGES` in `studio/transcribe.py`. One
  Faster-Whisper model handles `"auto"` detection and all supported languages; the language comes from
  `options["lang"]` (or a creator's `lang`) and is passed to `transcribe.transcribe(..., lang=...)`.
- **Clips are rendered in a short temporary folder** and moved into place (`render.render_clip`): ffmpeg's caption
  step cannot open paths longer than 260 characters on Windows.
- **Secrets** are read from the environment or from files named by `*_FILE` settings. Never write a key, a real
  address or a personal path into a tracked file.
- **Pages** are plain HTML, CSS and JavaScript. Keep the existing palette, no shadows, and hover states that
  change colour only.
- Comments and messages are written in plain language for people who do not program. Keep that tone.

## Default FFmpeg rules (`ffmpeg-skill`)

Whenever cutting, trimming, reframing, syncing audio, normalizing loudness, burning captions, or exporting video/audio, treat the workspace skill at `.agents/skills/ffmpeg-skill/SKILL.md` (along with `references/workflow.md`, `references/gotchas.md`, and `references/flags.md`) as the default instruction set and rules:

- **Use `ffmpeg-skill` scripts when editing standalone media**: prefer `.agents/skills/ffmpeg-skill/scripts/<tool>.py` (`probe.py`, `cut.py`, `fit.py`, `caption.py`, `audio.py`, `loudness.py`, `export.py`, `check.py`, `look.py`) with `--json` over hand-written ad-hoc `ffmpeg` commands.
- **Follow the Probe → Plan → Edit → Verify order**: probe real dimensions/fps/colour tags (`probe.py`), keep user originals intact (never overwrite sources silently), prefer lossless stream copy (`cut.py` / `mix_background_music` `-c:v copy`) when no picture change is needed, and verify non-empty output dimensions, duration, and framing (`check.py` / `look.py`).
- **Protect frame geometry, colour, and audio**: always apply geometric changes (scale/crop/pad) and even output dimensions *before* burning captions (`render._filter` before `ass=`), conform VFR/seek cuts with `fps` + `aresample=async=1:first_pts=0`, tag H.264 SDR outputs BT.709 `yuv420p` (never mislabel HDR BT.2020 pixels), and protect mixed audio against clipping (`loudnorm` / `-1.5 dBTP` limiter).
