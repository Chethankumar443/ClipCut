"""Faster-Whisper speech model management: one multi-language model transcribes all languages.

A single Faster-Whisper model handles automatic language detection ("auto") as well as 99+ spoken
languages. Models live under CLIPCUT_DATA/models/whisper (or CLIPCUT_MODELS/whisper) and are
downloaded on first use or ahead of time with `python -m studio.fetch_model [size]`."""
import shutil
import sys
import threading
import time
from pathlib import Path

from . import config, safe

# Registered per-language archive models (empty: Faster-Whisper handles all languages from one model).
MODELS = {}
DEFAULT = ""
WAIT = 60

# Faster-Whisper model sizes: name -> (label, approximate download size in MB, credit)
WHISPER_MODELS = {
    "tiny": ("Tiny", 75, "Faster-Whisper tiny (multilingual, MIT)"),
    "base": ("Base", 145, "Faster-Whisper base (multilingual, MIT)"),
    "small": ("Small", 465, "Faster-Whisper small (multilingual, MIT)"),
    "medium": ("Medium", 1500, "Faster-Whisper medium (multilingual, MIT)"),
    "large-v3": ("Large v3", 3000, "Faster-Whisper large-v3 (multilingual, MIT)"),
}

_locks = {k: threading.Lock() for k in WHISPER_MODELS}
state = {k: {"doing": False, "percent": 0, "error": ""} for k in WHISPER_MODELS}


def whisper_root() -> Path:
    return config.MODELS_DIR / "whisper"


def _active_size() -> str:
    try:
        from . import transcribe
        sz = transcribe.speech_settings()["whisper_model"]
        if sz in WHISPER_MODELS:
            return sz
    except Exception:  # noqa: BLE001
        pass
    return config.WHISPER_MODEL if config.WHISPER_MODEL in WHISPER_MODELS else "base"


def known(target: str) -> bool:
    return str(target or "").strip().lower() in WHISPER_MODELS


def label(target: str) -> str:
    key = str(target or "").strip().lower()
    return f"Faster-Whisper ({WHISPER_MODELS[key][0]})" if key in WHISPER_MODELS else f"Faster-Whisper ({target})"


def folder(size: str = "") -> Path:
    key = (size or _active_size()).strip().lower()
    return whisper_root() / f"models--Systran--faster-whisper-{key}"


def ready(size: str = "") -> bool:
    """True if this Faster-Whisper model size is already cached locally on disk."""
    key = (size or _active_size()).strip().lower()
    if key not in WHISPER_MODELS:
        return False
    root = whisper_root()
    if not root.exists():
        return False
    d = folder(key)
    if (d / "model.bin").is_file() or any(d.glob("snapshots/*/model.bin")):
        return True
    try:
        from faster_whisper import download_model
        got = Path(download_model(key, cache_dir=str(root), local_files_only=True))
        return got.is_dir() and any(got.iterdir())
    except Exception:  # noqa: BLE001
        return False


def status(size: str = "") -> str:
    """'ready', 'downloading' or 'missing'."""
    key = (size or _active_size()).strip().lower()
    if key not in WHISPER_MODELS:
        return "missing"
    return "ready" if ready(key) else "downloading" if state[key]["doing"] else "missing"


def list_models(active_size: str = "") -> list:
    active = (active_size or _active_size()).strip().lower()
    return [
        {
            "id": k,
            "lang": k,
            "label": info[0],
            "size_mb": info[1],
            "credit": info[2],
            "state": status(k),
            "percent": state[k]["percent"],
            "error": state[k]["error"],
            "active": k == active,
            "default": k == active,
        }
        for k, info in WHISPER_MODELS.items()
    ]


def _download_whisper(size: str) -> Path:
    from faster_whisper import download_model
    root = whisper_root()
    root.mkdir(parents=True, exist_ok=True)
    return Path(download_model(size, cache_dir=str(root), local_files_only=False))


def _fetch(size: str) -> None:
    st = state[size]
    mb = WHISPER_MODELS[size][1]
    st.update(doing=True, percent=0, error="")
    print(f"\n  Downloading {label(size)} speech model (one time, about {mb} MB)...\n", flush=True)
    try:
        _download_whisper(size)
        st["percent"] = 100
        print(f"  {label(size)} speech model ready.\n", flush=True)
    except Exception as e:  # noqa: BLE001
        st["error"] = safe.friendly(e, 200)
        raise RuntimeError(
            f"ClipCut couldn't download {label(size)} (about {mb} MB, needed once). "
            "Check the internet connection and free disk space, then try again, or run "
            f"python -m studio.fetch_model {size} to see what goes wrong. What it reported: {st['error']}"
        ) from e
    finally:
        st["doing"] = False


def ensure(size: str = "", start: bool = True) -> None:
    """Make sure the Faster-Whisper model is on this machine, downloading it if needed."""
    key = (size or _active_size()).strip().lower()
    if key in ("auto", "faster-whisper", "whisper", ""):
        key = _active_size()
    if key not in WHISPER_MODELS:
        raise ValueError(f"Unknown Faster-Whisper model size {key!r}. Choose one of: {', '.join(WHISPER_MODELS)}")
    if ready(key):
        return
    if not start:
        while state[key]["doing"] and not ready(key):
            time.sleep(1)
        if ready(key):
            return
        raise RuntimeError(
            f"{label(key)} isn't cached yet. Open Settings -> Speech, download it, or allow automatic download."
        )
    with _locks[key]:
        if not ready(key):
            _fetch(key)


def start(size: str) -> None:
    """Begin downloading a Faster-Whisper size in the background; progress is in state[size]."""
    key = (size or _active_size()).strip().lower()
    if key not in WHISPER_MODELS:
        raise ValueError(f"Unknown Faster-Whisper model size {key!r}.")
    if ready(key) or state[key]["doing"]:
        return
    state[key].update(doing=True, percent=0, error="")

    def run():
        try:
            with _locks[key]:
                if not ready(key):
                    _fetch(key)
        except Exception:  # noqa: BLE001 - reason is kept in state[key]["error"]
            pass
        finally:
            state[key]["doing"] = False

    threading.Thread(target=run, daemon=True, name=f"fetch-{key}").start()


def remove(size: str) -> None:
    """Delete a cached Faster-Whisper model size to free disk space."""
    from . import transcribe
    key = (size or "").strip().lower()
    if key not in WHISPER_MODELS:
        raise ValueError("ClipCut has no speech model size by that name.")
    if key == _active_size():
        raise ValueError("Switch to another Faster-Whisper model size before removing the active one.")
    with _locks[key]:
        if state[key]["doing"]:
            raise RuntimeError(f"{label(key)} is still downloading.")
        if not transcribe.unload(key):
            raise RuntimeError(f"{label(key)} is being used right now. Try again when videos finish.")
        try:
            shutil.rmtree(folder(key))
        except FileNotFoundError:
            pass
        except OSError as e:
            raise RuntimeError(f"Couldn't delete {label(key)}: {e}") from e
        state[key].update(percent=0, error="")


def main():
    arg = sys.argv[1] if len(sys.argv) > 1 else _active_size()
    key = _active_size() if arg in ("auto", "whisper", "faster-whisper", "") else arg.strip().lower()
    if key not in WHISPER_MODELS:
        raise SystemExit(f"Unknown model size {key!r}. Known: {', '.join(WHISPER_MODELS)}")
    if ready(key):
        print(f"{label(key)} speech model already present.")
        return
    ensure(key)


if __name__ == "__main__":
    main()
