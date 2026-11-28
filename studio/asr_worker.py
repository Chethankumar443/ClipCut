"""The speech-to-text machine: a tiny service that runs Faster-Whisper on a GPU host for the main ClipCut server.

Run with:  python -m studio.asr_worker
Settings:  CLIPCUT_ASR_PROVIDER=cuda, CLIPCUT_ASR_TOKEN=<shared secret>, CLIPCUT_ASR_PORT (9000),
           CLIPCUT_WHISPER_MODEL (tiny/base/small/medium/large-v3, default base),
           CLIPCUT_ASR_LANGS (optional comma-separated list such as "en,ar"; default "all" for all languages)

It holds nothing: no accounts, no files, no database. It answers only on the private network to callers
that know the shared secret."""
import hmac
import os
import threading
import time

import numpy as np
import uvicorn
from fastapi import FastAPI, HTTPException, Request

from . import fetch_model, transcribe

TOKEN = os.environ.get("CLIPCUT_ASR_TOKEN", "").strip()
PORT = int(os.environ.get("CLIPCUT_ASR_PORT", "9000"))
MAX_BODY = 64 * 1024 * 1024             # about 33 minutes of sound in one request
MAX_PIECE = 16000 * 40                  # pieces are 12 to 24 seconds; 40 is the ceiling

_raw_langs = [x.strip().lower() for x in os.environ.get("CLIPCUT_ASR_LANGS", "all").split(",") if x.strip()]
LANGS = ["all"] if (not _raw_langs or "all" in _raw_langs) else _raw_langs

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
_stats = {"pieces": 0, "audio_s": 0.0, "busy_s": 0.0, "since": time.time()}
_slock = threading.Lock()


@app.get("/healthz")
def healthz():
    with _slock:
        s = dict(_stats)
    cfg = transcribe.speech_settings()
    return {
        "ok": True,
        "engine": "faster-whisper",
        "model": cfg["whisper_model"],
        "provider": transcribe.PROVIDER,
        "langs": LANGS,
        "pieces": s["pieces"],
        "audio_hours": round(s["audio_s"] / 3600, 2),
        "speed": round(s["audio_s"] / s["busy_s"], 1) if s["busy_s"] else None,
    }


@app.post("/decode")
async def decode(request: Request):
    if not TOKEN or not hmac.compare_digest(request.headers.get("authorization", ""), "Bearer " + TOKEN):
        raise HTTPException(401, "no")
    lang = (request.headers.get("x-lang", "") or "auto").strip().lower()
    if "all" not in LANGS and lang not in LANGS:
        raise HTTPException(409, "no model for that language here")
    model_name = (request.headers.get("x-model", "") or transcribe.speech_settings()["whisper_model"]).strip().lower()
    if model_name not in transcribe.WHISPER_MODELS:
        model_name = transcribe.speech_settings()["whisper_model"]
    try:
        lens = [int(x) for x in request.headers.get("x-lens", "").split(",") if x]
    except ValueError:
        raise HTTPException(400, "bad lengths")
    if not lens or len(lens) > 256 or any(n <= 0 or n > MAX_PIECE for n in lens):
        raise HTTPException(400, "bad lengths")
    if int(request.headers.get("content-length") or 0) > MAX_BODY:
        raise HTTPException(413, "too much")
    body = await request.body()
    if len(body) != 2 * sum(lens) or len(body) > MAX_BODY:
        raise HTTPException(400, "lengths do not match the audio")
    audio = np.frombuffer(body, dtype="<i2").astype(np.float32) / 32768.0
    pieces, pos = [], 0
    for n in lens:
        pieces.append(audio[pos:pos + n])
        pos += n

    def work():
        t0 = time.time()
        out = []
        for seg in pieces:
            words = transcribe._transcribe_faster_whisper(seg, lang=lang, model_name=model_name)
            out.append((["▁" + w["w"] for w in words], [float(w["s"]) for w in words]))
        with _slock:
            _stats["pieces"] += len(pieces)
            _stats["audio_s"] += sum(lens) / 16000
            _stats["busy_s"] += time.time() - t0
        return out

    import anyio
    got = await anyio.to_thread.run_sync(work)
    return {"lang": lang, "pieces": [{"tokens": tok, "timestamps": ts} for tok, ts in got]}


def main():
    if not TOKEN:
        raise SystemExit("Set CLIPCUT_ASR_TOKEN: the speech machine refuses to start without a shared secret.")
    model_name = transcribe.speech_settings()["whisper_model"]
    fetch_model.ensure(model_name)
    transcribe._get_whisper(model_name, "cuda" if transcribe.PROVIDER == "cuda" else "cpu",
                           "float16" if transcribe.PROVIDER == "cuda" else "int8")
    print(f"Speech machine ready on port {PORT} ({transcribe.PROVIDER}, faster-whisper {model_name}, langs={','.join(LANGS)})", flush=True)
    uvicorn.run(app, host=os.environ.get("CLIPCUT_ASR_HOST", "0.0.0.0"), port=PORT, log_level="warning")


if __name__ == "__main__":
    main()
