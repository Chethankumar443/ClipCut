<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="clipcut-logo.svg" />
  <img src="clipcut-logo-dark.svg" alt="ClipCut" width="520" />
</picture>

**Turn long-form videos, podcasts, and live streams into captioned, publish-ready YouTube Shorts, Instagram Reels, and TikTok clips — locally and for free.**

[![CI](https://github.com/Chethankumar443/ClipCut/actions/workflows/ci.yml/badge.svg)](https://github.com/Chethankumar443/ClipCut/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?logo=ffmpeg&logoColor=white)](https://ffmpeg.org/)
[![yt-dlp](https://img.shields.io/badge/yt--dlp-FF0000?logo=youtube&logoColor=white)](https://github.com/yt-dlp/yt-dlp)
[![Faster-Whisper](https://img.shields.io/badge/Faster--Whisper-Multilingual%20ASR-111111)](https://github.com/SYSTRAN/faster-whisper)
[![Sherpa-ONNX](https://img.shields.io/badge/Sherpa--ONNX-Parakeet%200.6b-2B5B84)](https://github.com/k2-fsa/sherpa-onnx)
[![librosa](https://img.shields.io/badge/librosa-Audio%20Energy-ff7a2f)](https://librosa.org/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-SQLite%20%7C%20PostgreSQL-D71F00?logo=postgresql&logoColor=white)](https://www.sqlalchemy.org/)
[![Astro 5](https://img.shields.io/badge/Astro-5-BC52EE?logo=astro&logoColor=white)](landing-page/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](landing-page/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](landing-page/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](docker-compose.yml)
[![Vercel](https://img.shields.io/badge/Vercel-Ready-000000?logo=vercel&logoColor=white)](landing-page/vercel.json)

</div>

---

## Table of Contents

- [About ClipCut](#about-clipcut)
- [How the Pipeline Works](#how-the-pipeline-works)
- [Key Features](#key-features)
- [Supported AI Providers](#supported-ai-providers)
- [Speech Recognition & Auto Language Detection](#speech-recognition--auto-language-detection)
- [Quick Start (Local)](#quick-start-local)
- [Marketing Landing Page & Documentation (`landing-page/`)](#marketing-landing-page--documentation-landing-page)
- [Docker & Production Deployment](#docker--production-deployment)
- [Configuration Reference](#configuration-reference)
- [Architecture](#architecture)
- [Testing & Maintenance](#testing--maintenance)
- [License](#license)

---

## About ClipCut

**ClipCut** is a free, **open-source OpusClip alternative** and **self-hosted AI video clipping studio** built with **FastAPI**, **FFmpeg**, **yt-dlp**, **librosa**, **sherpa-onnx**, and **faster-whisper**.

Designed for creators, streamers, editors, and agencies looking for an automated **YouTube Shorts generator**, **TikTok clip maker**, **Instagram Reels generator**, or **podcast highlight extractor** with zero subscriptions or watermarks:

- Paste any **YouTube**, **Twitch**, or **Kick** video/VOD URL, upload multi-gigabyte local files via resumable chunked uploads, or monitor live streams 24/7.
- Automatically transcribe speech in **99+ languages** (`faster-whisper` multimodal auto-detect or local `sherpa-onnx` Parakeet 0.6b), detect vocal energy spikes (`librosa`), read **YouTube Most-Replayed** trending sectors, score live chat bursts and streamer facial expressions, synthesize viral hooks autonomously, and render vertical `9:16`, square `1:1`, or landscape `16:9` clips with animated word-level captions and BGM auto-ducking.

---

## How the Pipeline Works

```mermaid
flowchart LR
    A["Link / Chunked Upload / Live Stream"] --> B["yt-dlp & Media Probe"]
    B --> C["Hybrid ASR (YT Captions / Parakeet 0.6b / Faster-Whisper Auto)"]
    C --> D["Trending Signal Engine (Most-Replayed + Mic RMS + Chat + Expression)"]
    D --> E["AI Hook Scoring & Autonomous Hook Synthesis"]
    E --> F["FFmpeg Render (9:16, 1:1, 16:9) + Word-Level ASS Captions"]
    F --> G["Playhead Editor + BGM Auto-Ducking + Export / OAuth Post"]
```

---

## Key Features

### 1. Hybrid Link Ingestion & Resumable Chunked Uploads
- Downloads VODs and streams via `yt-dlp` with smart audio-first and byte/time-range fetching for multi-hour podcasts so ClipCut stays lightweight in RAM.
- Supports resumable multi-part browser uploads (`CLIPCUT_UPLOAD_PART_MB`, default `40 MB`) that work smoothly behind Cloudflare, Nginx, and Caddy request-size limits.

### 2. Trending Signal Engine & Autonomous Hook Creation
- **Recorded Videos (`studio/brain.py`, `studio/media.py`):**
  - Combines **YouTube Most-Replayed** viewer heatmaps (`[MOST REPLAYED]`), `librosa.feature.rms()` microphone vocal energy spikes (`[HIGH ENERGY]`), and overall loudness z-scores.
  - Boosts AI hook scores when moments overlap verified Most-Replayed sectors (`+12`) or vocal spikes (`+8`) so the highest-scored clip is genuinely the most trending segment.
  - When no AI key is configured (or if an AI omits a hook), falls back to weighted Most-Replayed + microphone energy peak ranking and synthesizes hooks directly from spoken transcript phrases (`_auto_hook`).
- **Live Streams (`studio/live.py`, `studio/brain.py`):**
  - Continuously monitors live audio loudness, **most-commented chat bursts** (counting unique Twitch chatters rather than raw spam), and optional **facial expression intensity** (`judge_expression`) via sampled stream frames.
  - Automatically creates and queues clips with synthesized hooks during spikes or `must_clip` windows—even with zero manual clicks or when no external AI key is present.
- **Personalized Taste Profile:** Learns from your 👍 / 👎 clip feedback to prioritize your preferred pacing and topics on future runs.

### 3. Gaming Mode & Automatic Facecam Detection
- Detects **23+ popular games** from stream titles, video titles, or creator settings (`studio/games.py`), adapting hooks, descriptions, and game-specific tags (`GAME_RULES`) automatically ([GAMING.md](GAMING.md)).
- Automatically locates the streamer's webcam (`studio/facecam.py`) using vision AI with a deterministic border/frame detector fallback for split/framed `9:16` layouts.

### 4. Interactive Playhead Studio & BGM Auto-Ducking
- **Word-Synced Transcript Editor:** Click any word in the transcript to seek and adjust clip Start/End timestamps, or double-click any word to fix caption spelling inline without leaving the browser.
- **Caption & Framing Presets:** Preview **Bounce**, **Hype**, and **Clean** animated ASS caption styles across `9:16` (Shorts/Reels/TikTok), `1:1` (Square), and `16:9` (Landscape).
- **BGM Mixer:** Layer built-in tracks or custom MP3/WAV/M4A files with volume slider, fade-in/out, and FFmpeg `sidechaincompress` vocal auto-ducking—rendered via `-c:v copy` for near-instant previews, with non-destructive original reset.

### 5. Clean Studio Navigation, Settings & In-App Feedback
- Streamlined bottom wing navigation (**Home**, **Videos**, **Creators**, **Create**, **Alerts**, **Settings**) with **Stacked Action Cards** across Quick Create and the **Settings** sidebar (**AI usage**, **Take the tour**, **Send feedback**, **Sign out**).
- Dedicated in-app **Send feedback** page (`/app/feedback`) with 1–5 star ratings, topic categories (`Bug report`, `Feature idea`, `Other`), loading state indicator, toast confirmation notifications, and admin triage in `/admin`.

### 6. Direct OAuth Publishing & Multi-User Administration
- Connect **YouTube** (Shorts), **Instagram** (Reels), and **TikTok** accounts in **Settings → Connected apps** to upload or schedule clips directly from the studio.
- Optional multi-user authentication (`CLIPCUT_ACCOUNTS=1`) with Google OAuth, SMTP email verification, per-plan active limits, fair user-round-robin job scheduling (`studio/jobs.py`), SQLite or PostgreSQL storage, and CPU/RAM guardrails (`studio/load.py`).

---

## Supported AI Providers

Configure your AI provider in **Settings → AI** or via `.env` (`CLIPCUT_AI_PROVIDER`, `CLIPCUT_AI_MODELS`, `CLIPCUT_AI_KEY`). Settings saved in the dashboard (`ai.json`) override `.env`.

| Provider ID | Service | Example Model | Key / Setup |
| :--- | :--- | :--- | :--- |
| `gemini` | Google Gemini | `gemini-2.5-flash` | [Google AI Studio](https://aistudio.google.com/apikey) |
| `openai` | OpenAI | `gpt-4o-mini` | [OpenAI API Keys](https://platform.openai.com/api-keys) |
| `xai` | xAI (Grok) | `grok-4` | [xAI Console](https://console.x.ai) |
| `groq` | Groq | `llama-3.3-70b-versatile` | [Groq Console](https://console.groq.com/keys) |
| `openrouter` | OpenRouter | Any listed model ID | [OpenRouter Keys](https://openrouter.ai/keys) |
| `anthropic` | Anthropic (Claude) | Current Claude model ID | [Anthropic Console](https://console.anthropic.com) |
| `ollama` | Local Ollama | `llama3.1` | No API key (`ollama pull llama3.1`) |
| `custom` | OpenAI-Compatible | Custom model ID | Set `CLIPCUT_AI_BASE_URL` |

> `CLIPCUT_AI_MODELS` supports a comma-separated list tried sequentially as automatic fallbacks on errors or rate limits.

---

## Speech Recognition & Auto Language Detection

ClipCut pairs fast local English recognition with multimodal multilingual transcription (`studio/transcribe.py`, configured live in **Settings → Speech** via `/api/speech` and stored in `data/speech.json`):

1. **Existing Video Transcripts:** Reads captions first via `youtube-transcript-api` or `yt-dlp` when available (`CLIPCUT_YT_TRANSCRIPT=1`), running local word-accurate alignment on selected clips.
2. **Faster-Whisper (Multimodal · 99+ Languages):**
   - Automatically detects the spoken language directly from video audio when set to **Auto-detect (`auto`)**, or transcribes an explicitly chosen language (`en`, `ar`, `es`, `fr`, `de`, `hi`, `ja`, `ko`, `pt`, `ru`, `zh`, `it`, `tr`, etc.).
   - Configurable model size (`tiny`, `base`, `small`, `medium`, `large-v3`) directly from **Settings → Speech**, with in-memory model caching and non-English / Hindi / Urdu Romanization fallback (`studio/roman.py`).
3. **English Sherpa-ONNX (`Parakeet TDT 0.6b v2`):**
   - High-speed ~480 MB local CPU/GPU model downloaded automatically on first startup, or ahead of time via:
     ```bash
     python -m studio.fetch_model
     ```
4. **Remote GPU ASR Worker:** Offload heavy speech workloads over HTTP to a separate CUDA machine using `studio/asr_worker.py` and `deploy/gpu/`, with automatic fallback to local CPU if the worker is unreachable.

---

## Quick Start (Local)

### 1. Prerequisites
- **Python 3.10+**
- **FFmpeg & FFprobe** (automatically bundled via `static-ffmpeg` in `requirements.txt`, or install system-wide via `winget install Gyan.FFmpeg`, `brew install ffmpeg`, or `sudo apt install ffmpeg`).

### 2. Clone & Install

> **Windows note:** Install into a short path such as `C:\clipcut` to avoid Windows' 260-character `MAX_PATH` limit when loading native `sherpa-onnx` libraries.

```bash
git clone https://github.com/Chethankumar443/ClipCut.git C:\clipcut   # or ~/clipcut on macOS/Linux
cd C:\clipcut
pip install -r requirements.txt
```

### 3. Configure & Start

```bash
cp .env.example .env
python -m studio.server
```

Open **http://127.0.0.1:8765**. With sign-in off by default (`CLIPCUT_ACCOUNTS=0`), ClipCut opens straight into the local studio.

To launch an isolated sandbox instance without modifying your existing `data/` folder:

```bash
CLIPCUT_DATA=./tmp-data CLIPCUT_PORT=8766 python -m studio.server
```

---

## Marketing Landing Page & Documentation (`landing-page/`)

The [landing-page/](landing-page) workspace is a standalone **Astro 5 + React 19 + Tailwind CSS v4 + shadcn + React Bits + Motion Primitives** product site & documentation portal featuring:
- **Split Interactive Hero:** WebGL2 `Lightfall` shader background, `TextEffect` editorial typography, `Magnet` + WebGL2 `SpecularButton` CTAs, and an interactive `Folder` showcase fanning out 3 real demo clips with full-screen playback.
- **Editorial Showcase Sections:** `ScrollExpand` demo preview, `CurvedLoop` platforms/AI marquee, `CountUp` metrics, interactive `StudioPipeline` stage explorer (`SpotlightCard`), `BorderTrail` Quick Start card, FAQ accordion, and a full-width interactive canvas `ParticleText` (`CLIPCUT`) footer.
- **Documentation & Legal Pages:** Built-in `/docs` portal (`BranchedMenu` sidebar) covering `/docs/quickstart`, `/docs/ai-providers`, `/docs/deployment`, and `/docs/gaming-mode`, plus `/terms`, `/privacy`, and `/acceptable-use`.

### Local Preview & Build
```bash
cd landing-page
npm install --legacy-peer-deps
npm run dev       # local dev server
npm run build     # generates static bundle in landing-page/dist/
```

### Deploying to Vercel
1. Import **`Chethankumar443/ClipCut`** in [Vercel](https://vercel.com/new).
2. Set **Root Directory** to `landing-page`.
3. Vercel automatically detects [vercel.json](landing-page/vercel.json) (**Framework:** `Astro`, **Build:** `npm run build`, **Output:** `dist`, clean URLs enabled).
4. Click **Deploy**.

---

## Docker & Production Deployment

ClipCut ships with a production 3-container Compose stack (**app**, **PostgreSQL**, and **Caddy** automatic HTTPS):

```bash
cp .env.example .env
# Set CLIPCUT_DOMAIN, POSTGRES_PASSWORD, and COMPOSE_PROFILES=own-https in .env
docker compose up -d --build
```

Grant admin rights to your first user (`/admin` returns 404 to non-admins):

```bash
docker compose exec app python -m studio.admin grant you@example.com
```

See [DEPLOY.md](DEPLOY.md) for complete setup guides covering:
- Reverse proxies behind **Nginx** ([deploy/nginx-clipcut.conf](deploy/nginx-clipcut.conf)) or **Traefik** ([deploy/docker-compose.traefik.yml](deploy/docker-compose.traefik.yml))
- **Cloudflare** Origin certificates (`deploy/Caddyfile.origin`)
- **Google OAuth**, **YouTube Data API v3**, **Instagram**, **TikTok**, and **SMTP** email verification
- Dedicated **GPU ASR worker** deployment ([deploy/gpu/](deploy/gpu))

---

## Configuration Reference

All settings are read from `.env` or process environment variables (see [.env.example](.env.example) for full documentation):

| Variable | Default | Description |
| :--- | :--- | :--- |
| `CLIPCUT_DATA` | `./data` | Root directory for videos, clips, `speech.json`, `ai.json`, SQLite DB, and models |
| `CLIPCUT_PORT` | `8765` | HTTP port for `studio.server` |
| `CLIPCUT_PUBLIC_URL` | `http://127.0.0.1:8765` | Public base URL for OAuth redirects and email verification links |
| `DATABASE_URL` | *(empty → SQLite)* | Optional PostgreSQL DSN (`postgresql+psycopg://...`) |
| `CLIPCUT_ACCOUNTS` | `0` (Docker: `1`) | Enable multi-user accounts, authentication, and plan limits |
| `CLIPCUT_AI_PROVIDER` | `gemini` | Default AI provider (`gemini`, `openai`, `xai`, `groq`, `openrouter`, `anthropic`, `ollama`, `custom`) |
| `CLIPCUT_AI_MODELS` | *(empty)* | Comma-separated fallback model IDs |
| `CLIPCUT_AI_KEY` | *(empty)* | API key (or `CLIPCUT_AI_KEY_FILE` for Docker secret mounts) |
| `CLIPCUT_ASR_ENGINE` | `auto` | Default speech engine (`auto`, `faster-whisper`, `sherpa`) |
| `CLIPCUT_WHISPER_MODEL` | `base` | Default Faster-Whisper model size (`tiny`, `base`, `small`, `medium`, `large-v3`) |
| `CLIPCUT_JOB_WORKERS` | CPU count | Max concurrent VOD clipping workers |
| `CLIPCUT_MAX_LIVE` | `2 × CPU count` | Max concurrent live stream recordings |
| `CLIPCUT_UPLOAD_PART_MB` | `40` | Resumable upload chunk size |
| `CLIPCUT_ALLOWED_SITES` | `youtube.com,youtu.be,twitch.tv,kick.com` | Permitted source URL domains |

---

## Architecture

| Path | Responsibility |
| :--- | :--- |
| [studio/server.py](studio/server.py) | FastAPI endpoints (`/api/*`, `/brand/*`, `/pub/*`), middleware, rate limits, and static serving |
| [studio/config.py](studio/config.py) | Environment variable & `*_FILE` secret resolution |
| [studio/jobs.py](studio/jobs.py) | Fair user queue, VOD pipeline orchestration, clip recovery, and BGM mixing |
| [studio/media.py](studio/media.py) | `yt-dlp` fetching, `youtube-transcript-api`, `librosa` energy & replay heatmap extraction |
| [studio/transcribe.py](studio/transcribe.py) | Hybrid ASR (`sherpa-onnx`, Faster-Whisper auto/multilingual, remote GPU worker) |
| [studio/fetch_model.py](studio/fetch_model.py) | Verified Sherpa-ONNX model registry (`MODELS`) and atomic archive downloader |
| [studio/brain.py](studio/brain.py) | Prompt rules, Most-Replayed/energy hook scoring, `_auto_hook`, facial expression judge, taste rules |
| [studio/render.py](studio/render.py) | Multi-aspect FFmpeg rendering (`9:16`, `1:1`, `16:9`), animated ASS captions, BGM auto-ducking |
| [studio/ai.py](studio/ai.py) | Unified chat/vision provider interface (`PROVIDERS`) and dashboard `ai.json` persistence |
| [studio/live.py](studio/live.py) | Live Twitch/Kick/YouTube monitoring, rolling `.ts` buffer, chat/expression/loudness clipping |
| [studio/games.py](studio/games.py) & [studio/facecam.py](studio/facecam.py) | 23+ game detections, gaming metadata rules, and webcam bounding-box detection |
| [studio/posting.py](studio/posting.py) & [studio/accounts.py](studio/accounts.py) | YouTube Shorts, Instagram Reels, and TikTok OAuth & scheduled publishing |
| [studio/roman.py](studio/roman.py) | Romanized script captions for non-Latin speech when captions use default fonts |
| [studio/db.py](studio/db.py) | SQLAlchemy Core tables (SQLite / PostgreSQL) |
| [web/index.html](web/index.html) | Single-file, zero-build Studio web application UI (`web/brand/` dark/light assets) |
| [landing-page/](landing-page) | Standalone Astro + React marketing site & `/docs` configured for Vercel |
| [tools/](tools) | Safe dependency updaters (`update_requirements.py`, `update_media_deps.py`) |
| [tests/](tests) | End-to-end automated integration test runner (`python tests/run.py`) |

---

## Testing & Maintenance

Run the full isolated test suite (runs against temporary directories on a free port—no external keys required):

```bash
python tests/run.py
```

Keep `yt-dlp`, `youtube-transcript-api`, `static-ffmpeg`, and Python packages updated with automatic test verification and rollback on failure:

```bash
python tools/update_requirements.py --check   # preview updates
python tools/update_requirements.py           # apply updates & verify with tests
```

---

## License

Released under the [MIT License](LICENSE). Copyright © 2026 Chethan Kumar Jagadish Ulavi.
