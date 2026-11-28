"""Speech to text with word timestamps through Faster-Whisper (multilingual, 99+ languages & auto-detect).

One Faster-Whisper model handles automatic language detection ("auto") and all spoken languages.
It runs on this machine's processors or graphics card by default, or, when CLIPCUT_ASR_URL is set,
on a separate GPU machine running studio/asr_worker.py (falling back locally if unreachable)."""
import json
import os
import queue
import re
import threading
import time

import numpy as np

from . import fetch_model

_CPUS = os.cpu_count() or 4
PROVIDER = os.environ.get("CLIPCUT_ASR_PROVIDER", "cpu").strip().lower() or "cpu"  # "cuda" on an NVIDIA GPU
THREADS = int(os.environ.get("CLIPCUT_ASR_THREADS") or (4 if _CPUS >= 8 else max(2, _CPUS - 2)))
COPIES = int(os.environ.get("CLIPCUT_ASR_COPIES") or (1 if PROVIDER != "cpu" else max(1, _CPUS // THREADS) if _CPUS >= 8 else 1))
BATCH = int(os.environ.get("CLIPCUT_ASR_BATCH", "1"))
IDLE = int(os.environ.get("CLIPCUT_ASR_IDLE_MINUTES", "15")) * 60

# Optional remote GPU worker running studio/asr_worker.py
REMOTE = os.environ.get("CLIPCUT_ASR_URL", "").strip().rstrip("/")
REMOTE_TOKEN = os.environ.get("CLIPCUT_ASR_TOKEN", "").strip()
REMOTE_BATCH = int(os.environ.get("CLIPCUT_ASR_REMOTE_BATCH", "8"))
REMOTE_PARALLEL = int(os.environ.get("CLIPCUT_ASR_REMOTE_PARALLEL", "4"))
REMOTE_SLOTS = threading.BoundedSemaphore(max(1, int(os.environ.get("CLIPCUT_ASR_REMOTE_INFLIGHT", "6"))))
_remote_down_until = 0.0
_remote_lacks: dict = {}

WHISPER_MODELS = ("tiny", "base", "small", "medium", "large-v3")
SPEECH_LANGUAGES = (
    ("auto", "Auto-detect from video"),
    ("en", "English"),
    ("ar", "Arabic"),
    ("es", "Spanish"),
    ("fr", "French"),
    ("de", "German"),
    ("hi", "Hindi"),
    ("pt", "Portuguese"),
    ("ja", "Japanese"),
    ("ko", "Korean"),
    ("zh", "Chinese"),
    ("ru", "Russian"),
    ("it", "Italian"),
    ("tr", "Turkish"),
    ("nl", "Dutch"),
    ("pl", "Polish"),
    ("uk", "Ukrainian"),
    ("vi", "Vietnamese"),
    ("id", "Indonesian"),
)
_SPEECH_LANG_SET = {k for k, _ in SPEECH_LANGUAGES}

ARABIC_MARKS = re.compile(r"[ً-ْٰـ]")    # vowel marks and the stretching line (tatweel)

_whisper_models: dict = {}
_whisper_busy: dict = {}
_whisper_lock = threading.Lock()


def known_language(lang: str) -> bool:
    """True when `lang` is 'auto' or any supported Faster-Whisper language code."""
    return str(lang or "").strip().lower() in _SPEECH_LANG_SET


def _speech_file():
    from . import config as _cfg
    return _cfg.DATA_DIR / "speech.json"


def speech_settings() -> dict:
    """Saved speech engine ('faster-whisper'), Faster-Whisper model size, and default spoken language."""
    from . import config as _cfg
    out = {
        "engine": "faster-whisper",
        "whisper_model": _cfg.WHISPER_MODEL if _cfg.WHISPER_MODEL in WHISPER_MODELS else "base",
        "language": "auto",
    }
    p = _speech_file()
    if p.is_file():
        try:
            saved = json.loads(p.read_text(encoding="utf-8"))
            if saved.get("whisper_model") in WHISPER_MODELS:
                out["whisper_model"] = saved["whisper_model"]
            if saved.get("language") in _SPEECH_LANG_SET:
                out["language"] = saved["language"]
        except Exception:  # noqa: BLE001
            pass
    return out


def save_speech_settings(body: dict) -> dict:
    cur = speech_settings()
    if "engine" in body:
        eng = str(body["engine"] or "").strip().lower()
        if eng not in ("faster-whisper", "auto"):
            raise ValueError("Unknown speech engine.")
        cur["engine"] = "faster-whisper"
    if "whisper_model" in body:
        wm = str(body["whisper_model"] or "").strip().lower()
        if wm not in WHISPER_MODELS:
            raise ValueError("Unknown Faster-Whisper model size.")
        cur["whisper_model"] = wm
    if "language" in body:
        lg = str(body["language"] or "").strip().lower()
        if lg not in _SPEECH_LANG_SET:
            raise ValueError("Unsupported spoken language.")
        cur["language"] = lg
    p = _speech_file()
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(cur, indent=2), encoding="utf-8")
    return cur


def model_ready(size: str = "") -> bool:
    """True if the active Faster-Whisper model (or remote ASR worker) is ready."""
    if REMOTE:
        return True
    target = size or speech_settings()["whisper_model"]
    return fetch_model.ready(target)


def unload(size: str) -> bool:
    """Release a cached Faster-Whisper model size before deletion. False if currently busy."""
    key_prefix = (size or "").strip().lower()
    with _whisper_lock:
        for k, busy in _whisper_busy.items():
            if k[0] == key_prefix and busy > 0:
                return False
        for k in [k for k in _whisper_models if k[0] == key_prefix]:
            del _whisper_models[k]
    return True


def _chunks(audio: np.ndarray, lo=12.0, hi=24.0):
    """Split at the quietest point between lo and hi seconds so words are not cut in half."""
    sr, hop = 16000, 800  # 50 ms frames
    n = len(audio)
    frames = n // hop
    if frames == 0:
        return
    x = audio[: frames * hop].reshape(frames, hop).astype(np.float32)
    rms = np.sqrt((x ** 2).mean(axis=1))
    pos = 0
    while pos < n:
        if n - pos <= hi * sr:
            yield pos, n
            return
        a, b = (pos + int(lo * sr)) // hop, (pos + int(hi * sr)) // hop
        cut = (a + int(np.argmin(rms[a:b]))) * hop + hop // 2
        yield pos, cut
        pos = cut


def _words(tokens, timestamps, a: int, b: int) -> list:
    """Convert token pieces and start timestamps inside audio[a:b] to word entries."""
    out = []
    tokens = [ARABIC_MARKS.sub("", t) for t in tokens]
    off, seg_end = a / 16000.0, b / 16000.0
    cur, gap = None, False
    for tok, t in zip(tokens, timestamps):
        new_word = tok.startswith((" ", "▁")) or gap
        piece = tok.replace("▁", " ").strip()
        if not piece:
            gap = True
            continue
        gap = False
        is_punct = all(not c.isalnum() for c in piece)
        if cur is None or (new_word and not is_punct):
            if cur:
                out.append(cur)
            cur = {"w": piece, "s": round(off + t, 2), "e": round(off + t + 0.12, 2)}
        else:
            cur["w"] += piece
            cur["e"] = round(off + t + 0.12, 2)
    if cur:
        cur["e"] = min(cur["e"], round(seg_end, 2))
        out.append(cur)
    return out


class RemoteLacks(Exception):
    """The remote GPU worker rejected the language or model."""


def _remote_ok(lang: str = "auto") -> bool:
    code = (lang or "auto").strip().lower()
    return bool(REMOTE) and time.time() >= max(_remote_down_until, _remote_lacks.get(code, 0.0))


def _decode_remote(pieces: list, lang: str = "auto") -> list:
    """Send float32 audio chunks to the remote GPU worker and receive word tokens + timestamps."""
    import httpx
    raw = [np.clip(seg * 32768.0, -32768, 32767).astype("<i2") for seg in pieces]
    code = (lang or "auto").strip().lower()
    r = httpx.post(
        REMOTE + "/decode",
        content=b"".join(x.tobytes() for x in raw),
        timeout=httpx.Timeout(120, connect=4),
        headers={
            "Authorization": "Bearer " + REMOTE_TOKEN,
            "X-Lens": ",".join(str(len(x)) for x in raw),
            "X-Lang": code,
            "X-Model": speech_settings()["whisper_model"],
            "Content-Type": "application/octet-stream",
        },
    )
    if r.status_code == 409:
        raise RemoteLacks(code)
    r.raise_for_status()
    body = r.json()
    if body.get("lang") != code:
        raise RemoteLacks(code)
    got = body["pieces"]
    if len(got) != len(pieces):
        raise ValueError("wrong number of pieces came back")
    return [(p["tokens"], p["timestamps"]) for p in got]


def _get_whisper(model_name: str, device: str, compute: str):
    from faster_whisper import WhisperModel
    root = fetch_model.whisper_root()
    root.mkdir(parents=True, exist_ok=True)
    key = (model_name, device, compute)
    with _whisper_lock:
        m = _whisper_models.get(key)
        if m is None:
            m = _whisper_models[key] = WhisperModel(
                model_name,
                device=device,
                compute_type=compute,
                cpu_threads=THREADS if device == "cpu" else 0,
                download_root=str(root),
            )
        return m


def _transcribe_faster_whisper(audio: np.ndarray, on_progress=None, lang: str = "auto", model_name: str = "") -> list:
    """Transcribe 16 kHz int16 or float32 audio using Faster-Whisper with word-level timestamps."""
    cfg = speech_settings()
    model_name = (model_name or cfg["whisper_model"] or "base").strip().lower()
    device = "cuda" if PROVIDER == "cuda" else "cpu"
    compute = "float16" if device == "cuda" else "int8"
    key = (model_name, device, compute)
    model = _get_whisper(model_name, device, compute)
    with _whisper_lock:
        _whisper_busy[key] = _whisper_busy.get(key, 0) + 1
    try:
        pcm = audio if audio.dtype == np.float32 else audio.astype(np.float32) / 32768.0
        total_dur = max(0.1, len(pcm) / 16000.0)
        whisper_lang = None if (not lang or lang == "auto") else lang
        segments, _ = model.transcribe(pcm, language=whisper_lang, word_timestamps=True, vad_filter=True)
        words = []
        for seg in segments:
            for w in (seg.words or []):
                text = ARABIC_MARKS.sub("", str(w.word or "")).strip()
                if text:
                    words.append({"w": text, "s": round(float(w.start), 2), "e": round(float(w.end), 2)})
            if on_progress:
                on_progress(min(1.0, float(seg.end or 0) / total_dur))
        if on_progress:
            on_progress(1.0)
        return words
    finally:
        with _whisper_lock:
            _whisper_busy[key] = max(0, _whisper_busy.get(key, 1) - 1)


def _transcribe_remote(audio: np.ndarray, on_progress=None, lang: str = "auto") -> list | None:
    """Try the remote GPU Faster-Whisper worker; return None if unreachable/unsuitable so caller runs locally."""
    global _remote_down_until
    todo = []
    for a, b in _chunks(audio):
        seg = audio[a:b].astype(np.float32) / 32768.0
        if len(seg) < 4800 or float(np.sqrt((seg ** 2).mean())) < 0.003:
            continue
        todo.append((a, b, seg))
    if not todo:
        return []
    groups = [todo[i:i + max(1, REMOTE_BATCH)] for i in range(0, len(todo), max(1, REMOTE_BATCH))]
    done = [0]

    def run_group(group):
        global _remote_down_until
        segs = [seg for _, _, seg in group]
        with REMOTE_SLOTS:
            try:
                got = _decode_remote(segs, lang)
            except RemoteLacks:
                _remote_lacks[lang] = time.time() + 600
                raise
            except Exception:  # noqa: BLE001
                _remote_down_until = time.time() + 60
                raise
        out = [_words(tok, ts, a, b) for (a, b, _), (tok, ts) in zip(group, got)]
        done[0] += 1
        if on_progress:
            on_progress(done[0] / len(groups))
        return out

    try:
        if REMOTE_PARALLEL > 1 and len(groups) > 1:
            from concurrent.futures import ThreadPoolExecutor
            with ThreadPoolExecutor(min(REMOTE_PARALLEL, len(groups)), thread_name_prefix="asr") as ex:
                results = list(ex.map(run_group, groups))
        else:
            results = [run_group(g) for g in groups]
    except Exception:  # noqa: BLE001
        return None

    words = []
    for out in results:
        for piece in out:
            for w in piece:
                if words and words[-1]["w"] == w["w"] and words[-1]["s"] == w["s"]:
                    continue
                words.append(w)
    for i, w in enumerate(words):
        nxt = words[i + 1]["s"] if i + 1 < len(words) else w["e"] + 0.4
        w["e"] = round(max(w["s"] + 0.08, min(nxt, max(w["e"], w["s"] + 0.6))), 2)
    return words


def transcribe(audio: np.ndarray, on_progress=None, lang: str = "") -> list:
    """Returns [{'w': word, 's': start_sec, 'e': end_sec}, ...] for 16 kHz audio via Faster-Whisper.
    When `lang` is '' or 'auto', Faster-Whisper detects the spoken language automatically."""
    cfg = speech_settings()
    target_lang = (lang or cfg["language"] or "auto").strip().lower()
    if _remote_ok(target_lang):
        remote_words = _transcribe_remote(audio, on_progress=on_progress, lang=target_lang)
        if remote_words is not None:
            return remote_words
    return _transcribe_faster_whisper(
        audio,
        on_progress=on_progress,
        lang=target_lang,
        model_name=cfg["whisper_model"],
    )
