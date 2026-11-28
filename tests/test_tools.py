"""The errors people hit on a fresh install: ffmpeg not found ("[WinError 2]"), Faster-Whisper model caching/errors,
and an AI model name the service does not know. Runs against the code directly; nothing is downloaded."""
import os
import shutil
import sys
import tempfile
from pathlib import Path

os.environ["CLIPCUT_DATA"] = tempfile.mkdtemp(prefix="pc-tools-")
os.environ.pop("CLIPCUT_MODELS", None)
os.environ.update(CLIPCUT_AI_PROVIDER="gemini", CLIPCUT_AI_MODELS="gemini-old", CLIPCUT_AI_KEY="test-key-123456")
sys.path.insert(0, ".")
from studio import ai, config, fetch_model, safe, tools  # noqa: E402

fails = []


def check(n, got, want=True):
    ok = want(got) if callable(want) else got == want
    print(("PASS " if ok else "FAIL ") + n + ("" if ok else f"   got {got!r}"))
    ok or fails.append(n)


# ---- ffmpeg
real_path = os.environ.get("PATH", "")
exe = ".exe" if sys.platform == "win32" else ""
hidden = tempfile.mkdtemp(prefix="pc-ff-")
for name in tools.NEEDED:
    f = Path(hidden) / (name + exe)
    f.write_bytes(b"x")
    f.chmod(0o755)
os.environ["PATH"] = tempfile.mkdtemp(prefix="pc-empty-")            # a PATH with no ffmpeg on it
real_places = tools._places
tools._places = lambda: []
check("with ffmpeg nowhere, both programs are reported missing", tools.setup(), ["ffmpeg", "ffprobe"])
err = FileNotFoundError(2, "The system cannot find the file specified")
check("the bare Windows error becomes what to do about it", "ffmpeg" in safe.friendly(err) and "install" in safe.friendly(err), True)
check("...also when it arrives as text", "ffmpeg" in safe.friendly(RuntimeError("[WinError 2] The system cannot find the file specified")), True)
check("an unrelated error is left as it is", safe.friendly(ValueError("That link is a playlist.")), "That link is a playlist.")
tools._places = lambda: [Path(hidden)]
check("installed but not on the PATH yet: found in its folder and used from there", (tools.setup(), bool(shutil.which("ffmpeg"))), ([], True))
os.environ["PATH"] = real_path
os.environ["CLIPCUT_FFMPEG_DIR"] = hidden
tools._places = real_places
check("CLIPCUT_FFMPEG_DIR is looked in first", tools._places()[0], Path(hidden))
tools.setup()

# ---- Faster-Whisper speech model (no built-in English archive model)
check("no English Sherpa-ONNX model registered", fetch_model.MODELS, {})
d = fetch_model.folder("base")
assert str(d).startswith(os.environ["CLIPCUT_DATA"]), "the test must only touch its own folder"
check("no model to begin with", fetch_model.ready("base"), False)
d.mkdir(parents=True)
check("empty folder does not count as ready", fetch_model.ready("base"), False)
shutil.rmtree(d)

real_dl = fetch_model._download_whisper
try:
    def fake_dl(size):
        out = fetch_model.folder(size)
        out.mkdir(parents=True, exist_ok=True)
        (out / "model.bin").write_bytes(b"whisper")
        return out

    fetch_model._download_whisper = fake_dl
    fetch_model.ensure("base")
    check("Faster-Whisper model caches into its folder cleanly", (fetch_model.ready("base"), (d / "model.bin").is_file()), (True, True))
    shutil.rmtree(d)

    def no_internet(size):
        raise OSError("getaddrinfo failed")

    fetch_model._download_whisper = no_internet
    try:
        fetch_model.ensure("base")
        said = ""
    except RuntimeError as e:
        said = str(e)
    check("no internet: said in plain words, and no model left behind", ("internet" in said, fetch_model.ready("base"), d.exists()), (True, False, False))
    check("the real reason is shown too, so it can be fixed", "getaddrinfo failed" in said, True)
    check("and so is how to try again by hand", "python -m studio.fetch_model base" in said, True)

    def slow_dl(size):
        raise TimeoutError("The read operation timed out")

    fetch_model._download_whisper = slow_dl
    try:
        fetch_model.ensure("base")
        said = ""
    except RuntimeError as e:
        said = str(e)
    check("a connection that stalls fails cleanly with its reason", "timed out" in said, True)
    check("a failed download frees the lock", (fetch_model.state["base"]["doing"], fetch_model._locks["base"].locked()), (False, False))
finally:
    fetch_model._download_whisper = real_dl

# ---- the AI
check("an unknown model name", ai.explain("HTTP 404 models/gemini-old is not found for API version v1beta"), lambda s: "gemini-old" in s and "Find models" in s)
check("a refused key", ai.explain("HTTP 400 API key not valid. Please pass a valid API key."), lambda s: "rejected your API key" in s)
check("out of quota", ai.explain("HTTP 429 You exceeded your current quota"), lambda s: "limit" in s)
check("cannot be reached", ai.explain("[Errno 11001] getaddrinfo failed"), lambda s: "Could not reach" in s)
check("anything else is not guessed at", ai.explain("something odd"), "")
ai.note_problem("HTTP 404 model not found")
check("the reason is kept for the dashboard, and cleared when the AI answers again", (bool(ai.problem["text"]), (ai.clear_problem(), ai.problem["text"])[1]), (True, ""))

print("ALL PASSED" if not fails else f"{len(fails)} failed")
shutil.rmtree(os.environ["CLIPCUT_DATA"], ignore_errors=True)
shutil.rmtree(hidden, ignore_errors=True)
sys.exit(1 if fails else 0)
