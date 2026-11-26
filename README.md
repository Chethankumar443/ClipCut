<div align="center">

<img src="ClipCut_Transparent_Premium.svg" alt="ClipCut" width="760" />

**Turn long-form videos, podcasts, and live streams into captioned, publish-ready short clips.**

[![CI](https://github.com/Chethankumar443/ClipCut/actions/workflows/ci.yml/badge.svg)](https://github.com/Chethankumar443/ClipCut/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/downloads/)

</div>

---

## Overview

ClipCut is a self-hosted, end-to-end video clipping studio built with **FastAPI**, **FFmpeg**, **yt-dlp**, **librosa**, and local/cloud AI models. Paste a YouTube, Twitch, or Kick link, upload a video file, or monitor live streams—ClipCut transcribes the audio, detects high-energy & most-replayed moments, scores hooks with AI, renders vertical/square/landscape clips with animated word-level captions, and lets you mix background music before downloading or publishing.

## Key Features

- **Hybrid Link Ingestion & Transcription**
  - Downloads source media via `yt-dlp` (with smart audio-first + range-only fetching for long podcasts).
  - Fetches timestamped transcripts via `youtube-transcript-api` first, falling back to `yt-dlp` captions, local `sherpa-onnx` (Parakeet 0.6b), or `faster-whisper` (multilingual / Arabic support).
- **Vocal Energy, Most-Replayed & Personalized AI Scoring**
  - Uses `librosa.feature.rms()` to tag vocal energy spikes as `[HIGH ENERGY]` and `yt-dlp` viewer replay heatmaps as `[MOST REPLAYED]`.
  - Evaluates opening hooks for curiosity gaps, bold claims, and pattern interrupts using **Gemini**, **Ollama** (local), **OpenRouter**, **OpenAI**, **Claude**, **Groq**, **Grok**, or any OpenAI-compatible endpoint.
  - Learns from your 👍 / 👎 clip feedback to personalize future recommendations while still surfacing standout moments across the video.
- **Interactive Studio Editor & Real-Time Preview**
  - **Live Preview**: Preview `9:16` (Shorts/Reels), `1:1` (Square), and `16:9` (Landscape) aspect ratios, caption styles (`Bounce`, `Hype`, `Clean`), layouts, and hook banners in real time before re-rendering.
  - **Playhead-Synced Transcript**: Click any word to seek and set Start/End times; double-click any word to fix caption spelling inline.
  - **Background Music Mixer**: Choose a built-in starter track or drop your own MP3/WAV/M4A with volume, fade-in/out, and `sidechaincompress` auto-ducking—rendered via `-c:v copy` for near-instant previews, with non-destructive reset.
- **Creators Hub & Live Auto-Clipping**
  - Monitor creators in a dedicated sidebar workspace, toggle auto-recording when they go live, and clip live moments on demand.
- **Self-Hosted & Production Ready**
  - Fair multi-user job queue, optional user accounts (`CLIPCUT_ACCOUNTS=1`), SQLite or PostgreSQL, Docker Compose with Caddy/Traefik/Nginx configs, and one-click in-app updates with automatic dependency rollback.

---

## Quick Start

### 1. Prerequisites

- **Python 3.10+**
- **FFmpeg & FFprobe** (automatically bundled via `static-ffmpeg` in `requirements.txt`, or install system-wide with `winget install Gyan.FFmpeg` / `brew install ffmpeg` / `sudo apt install ffmpeg`).

### 2. Clone & Install

> **Windows note:** Install into a short path such as `C:\clipcut` to avoid Windows' 260-character path limit when loading native speech libraries.

```bash
git clone https://github.com/Chethankumar443/ClipCut.git C:\clipcut   # or ~/clipcut on macOS/Linux
cd C:\clipcut
pip install -r requirements.txt
```

### 3. Configure & Run

```bash
cp .env.example .env
python -m studio.server
```

Open **http://127.0.0.1:8765** in your browser. You can configure your AI provider (e.g., Gemini API key or local Ollama) directly from **Settings → AI** in the dashboard.

### Docker Deployment

```bash
cp .env.example .env
docker compose up -d --build
```

See [DEPLOY.md](DEPLOY.md) for reverse-proxy setups with Caddy, Traefik (`deploy/docker-compose.traefik.yml`), Nginx (`deploy/nginx-clipcut.conf`), and dedicated GPU ASR workers (`deploy/gpu/`).

---

## Architecture

| Path | Purpose |
| :--- | :--- |
| `studio/server.py` | FastAPI routes, auth/rate-limit gate, media streaming, and admin endpoints |
| `studio/jobs.py` | Fair multi-user job queue, video pipeline orchestration, and audio-mix helpers |
| `studio/media.py` | `yt-dlp` ingestion, `youtube-transcript-api`, `librosa` energy & heatmap extraction |
| `studio/transcribe.py` | Hybrid ASR (`sherpa-onnx`, remote GPU worker, and `faster-whisper`) |
| `studio/brain.py` | Prompt engineering, `[HIGH ENERGY]` / `[MOST REPLAYED]` tagging, and taste profile |
| `studio/render.py` | Multi-aspect FFmpeg rendering (`9:16`, `1:1`, `16:9`), ASS captions, and BGM mixing |
| `studio/ai.py` | Unified client for Gemini, Ollama, OpenRouter, OpenAI, Anthropic, Groq, and xAI |
| `web/index.html` | Single-file, zero-build studio web application |
| `tools/` | Safe dependency & media updaters (`update_requirements.py`, `update_media_deps.py`) |
| `tests/` | Automated test suite (`python tests/run.py`) |

---

## Testing & Maintenance

Run the test suite against an isolated temporary data directory (no API keys required):

```bash
python tests/run.py
```

Keep `yt-dlp`, `youtube-transcript-api`, `static-ffmpeg`, and all Python dependencies up to date with automatic compatibility checks and rollback:

```bash
python tools/update_requirements.py --check   # preview available updates
python tools/update_requirements.py           # update & verify (rolls back on failure)
```

---

## License

Released under the [MIT License](LICENSE). Copyright © 2026 Chethan Kumar Jagadish Ulavi.
