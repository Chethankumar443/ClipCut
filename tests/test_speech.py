"""Speech models & transcription: English Sherpa-ONNX, Faster-Whisper multilingual + auto-detect,
downloading/removing custom models safely, language selection on videos and creators, Romanized captions,
and the remote GPU worker never returning the wrong language's model."""
import hashlib
import io
import os
import shutil
import sys
import tarfile
import tempfile
import threading
import time
from pathlib import Path

os.environ["CLIPCUT_DATA"] = tempfile.mkdtemp(prefix="pc-speech-")
os.environ.pop("CLIPCUT_MODELS", None)          # models are made and removed: only ever inside this test's folder
os.environ.update(DATABASE_URL="", CLIPCUT_ACCOUNTS="0", CLIPCUT_FETCH_MODEL="0", CLIPCUT_AI_KEY="", CLIPCUT_AI_KEY_FILE="",
                  CLIPCUT_PUBLIC_URL="http://127.0.0.1:8765")
sys.path.insert(0, ".")
from fastapi.testclient import TestClient  # noqa: E402

from studio import auth, brain, config, creators, ctx, db, fetch_model, jobs, live, server, tools, transcribe  # noqa: E402

db.init()
fails = []
BASE = "http://127.0.0.1:8765"
ORIGIN = {"Origin": BASE}
c = TestClient(server.app, base_url=BASE, follow_redirects=False)


def check(name, got, want=True):
    ok = want(got) if callable(want) else got == want
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else f"   got {ascii(got)}"))
    ok or fails.append(name)


assert str(config.MODELS_DIR).startswith(os.environ["CLIPCUT_DATA"]), "the test must only touch its own folder"
downloads = []


def archive(name):
    """A tiny stand-in for the real archive: the right folder name, the four files."""
    src = Path(tempfile.mkdtemp(prefix="pc-tar-")) / name
    src.mkdir()
    for n in ("tokens.txt", "encoder.int8.onnx", "decoder.int8.onnx", "joiner.int8.onnx"):
        (src / n).write_bytes(b"model")
    out = io.BytesIO()
    with tarfile.open(fileobj=out, mode="w:bz2") as t:
        t.add(src, arcname=name)
    return out.getvalue()


# ---- built-in models and Faster-Whisper multimodal settings
check("English is the built-in Sherpa-ONNX model (Arabic removed from UI list)", sorted(fetch_model.MODELS), ["en"])
check("faster-whisper is configured for multilingual transcription", bool(config.WHISPER_MODEL and config.ASR_ENGINE), True)

sp_init = c.get("/api/speech").json()
check("speech API lists English model and Faster-Whisper metadata",
      ([m["lang"] for m in sp_init["models"]],
       "base" in sp_init["whisper_models"],
       any(l["code"] == "auto" for l in sp_init["languages"])),
      (["en"], True, True))
check("speech settings default to auto engine and auto-detect language",
      (sp_init["settings"]["engine"], sp_init["settings"]["language"]), ("auto", "auto"))

check("wrong Origin cannot change speech settings",
      c.put("/api/speech", json={"engine": "faster-whisper"}, headers={"Origin": "https://evil.example"}).status_code, 403)
check("invalid speech engine is rejected",
      c.put("/api/speech", json={"engine": "invalid"}, headers=ORIGIN).status_code, 400)
sp_saved = c.put("/api/speech", json={"engine": "faster-whisper", "whisper_model": "small", "language": "es"}, headers=ORIGIN)
check("speech settings can save Faster-Whisper engine, size, and language",
      (sp_saved.status_code, sp_saved.json()["settings"]),
      (200, {"engine": "faster-whisper", "whisper_model": "small", "language": "es"}))
sp_auto = c.put("/api/speech", json={"engine": "auto", "language": "auto", "whisper_model": "base"}, headers=ORIGIN)
check("Auto button restores auto engine and auto-detect language",
      (sp_auto.status_code, sp_auto.json()["settings"]["language"]), (200, "auto"))

# ---- Register a second local Sherpa model transiently to verify downloader, SHA-256, locks, and remote checks
test_ar_name = "sherpa-onnx-test-ar-int8"
test_ar_arch = archive(test_ar_name)
test_en_arch = archive(fetch_model.MODELS["en"][1])
ARCHIVES = {"en": test_en_arch, "ar": test_ar_arch}
tampered = set()

fetch_model.MODELS["ar"] = ("Arabic", test_ar_name, "https://mirror.example/ar.tar.bz2", 107,
                            "FastConformer Arabic (test)", hashlib.sha256(test_ar_arch).hexdigest())
fetch_model._locks["ar"] = threading.Lock()
fetch_model.state["ar"] = {"doing": False, "percent": 0, "error": ""}


class Answer(io.BytesIO):
    def __init__(self, data):
        super().__init__(data)
        self.headers = {"Content-Length": str(len(data))}


def fake_open(url, timeout=None):
    downloads.append(url)
    lang = next(k for k, m in fetch_model.MODELS.items() if m[2] == url)
    return Answer(ARCHIVES[lang] + (b"changed" if lang in tampered else b""))


fetch_model.urllib.request.urlopen = fake_open
check("each language has its own folder", fetch_model.folder("ar") != fetch_model.folder("en"), True)
check("nothing is here to begin with", (fetch_model.status("en"), fetch_model.status("ar")), ("missing", "missing"))

try:
    fetch_model.ensure("ar", start=False)
    said = ""
except RuntimeError as e:
    said = str(e)
check("a video needing an un-downloaded local model says what to do instead of downloading",
      ("Speech models" in said, downloads), (True, []))
try:
    transcribe._new("ar")
    said = ""
except RuntimeError as e:
    said = str(e)
check("...and so does loading the model for transcribing", ("Speech models" in said, downloads), (True, []))

# ---- the routes: list, download, remove
r = c.get("/api/speech").json()["models"]
check("the page lists registered local models with their size",
      [(m["lang"], m["state"], m["size_mb"] > 0) for m in r],
      [("en", "missing", True), ("ar", "missing", True)])
check("an unknown language is refused", c.post("/api/speech/xx", headers=ORIGIN).status_code, 400)
check("another website cannot start a download",
      c.post("/api/speech/ar", headers={"Origin": "https://evil.example"}).status_code, 403)
check("...and nothing was downloaded", downloads, [])
tampered.add("ar")
try:
    fetch_model.ensure("ar")
    said = ""
except RuntimeError as e:
    said = str(e)
check("a downloaded file with the wrong fingerprint is refused, in plain words",
      ("not the one it expects" in said and "Nothing was unpacked" in said, fetch_model.ready("ar")), (True, False))
check("...it says which fingerprint it got and which it expected",
      fetch_model.MODELS["ar"][5] in said and "SHA-256" in said, True)
check("...the reason is shown on the Speech models page",
      "not the expected one" in fetch_model.state["ar"]["error"], True)
check("...and nothing is left behind",
      sorted(p.name for p in config.MODELS_DIR.iterdir()) if config.MODELS_DIR.exists() else [], [])
tampered.clear()
downloads.clear()
check("the owner can start a model download", c.post("/api/speech/ar", headers=ORIGIN).status_code, 200)
for _ in range(100):
    if fetch_model.status("ar") == "ready":
        break
    time.sleep(0.05)
check("downloaded model arrives whole, in its own folder",
      (fetch_model.ready("ar"), sorted(p.name for p in fetch_model.folder("ar").iterdir())),
      (True, ["decoder.int8.onnx", "encoder.int8.onnx", "joiner.int8.onnx", "tokens.txt"]))
check("English was not touched", fetch_model.ready("en"), False)
check("nothing is left over from the download",
      sorted(p.name for p in config.MODELS_DIR.iterdir()), [fetch_model.MODELS["ar"][1]])
check("the status tells every page the downloaded model is ready",
      c.get("/api/status").json()["speech"]["ar"]["state"], "ready")
check("asking again downloads nothing more", (c.post("/api/speech/ar", headers=ORIGIN).status_code, len(downloads)), (200, 1))
check("English can't be removed", c.delete("/api/speech/en", headers=ORIGIN).status_code, 400)

transcribe._pool("ar").made += 1
check("a model in use is not removed",
      (c.delete("/api/speech/ar", headers=ORIGIN).status_code, fetch_model.ready("ar")), (409, True))
transcribe._pool("ar").made -= 1
check("optional model can be removed when nothing uses it",
      (c.delete("/api/speech/ar", headers=ORIGIN).status_code, fetch_model.folder("ar").exists()), (200, False))

# ---- choosing the language (multilingual + auto-detect + validation)
check("a video can be marked as auto-detect", jobs.clean_options({"lang": "auto"}), {"lang": "auto"})
check("a video can be marked with any Faster-Whisper language", jobs.clean_options({"lang": "es"}), {"lang": "es"})
check("an unknown language becomes English", jobs.clean_options({"lang": "xx"}), {"lang": "en"})
check("videos default to English unless chosen", jobs.DEFAULTS["lang"], "en")
check("a creator can speak Spanish or Arabic",
      (creators._clean({"lang": "es"}), creators._clean({"lang": "ar"})), ({"lang": "es"}, {"lang": "ar"}))
check("...but not a made-up language", creators._clean({"lang": "<b>"}), {"lang": "en"})
r = c.post("/api/creators", json={"name": "Arabic speaker"}, headers=ORIGIN)
cid = r.json()["id"]
c.put(f"/api/creators/{cid}", json={"lang": "ar"}, headers=ORIGIN)
with ctx.as_user(auth.local_user().id):
    cr = creators.get(cid)
    check("the creator's language is kept", cr.get("lang"), "ar")
    real_missing = tools.missing
    tools.missing = lambda: []
    try:
        live.start_session(cr, "https://www.twitch.tv/someone")
        said = ""
    except ValueError as e:
        said = str(e)
    finally:
        tools.missing = real_missing
    check("recording a creator whose local model isn't ready says what to do", "Speech models" in said, True)

# ---- Arabic words & Romanization
tokens = ["▁ال", "ك", "ت", "ا", "بُ", "▁جـ", "ميل", "،", "▁ok"]
words = transcribe._words(tokens, [0.0, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 1.0], 0, 32000)
check("Arabic pieces join into words, vowel marks and the stretching line removed, punctuation kept",
      [w["w"] for w in words], ["الكتاب", "جميل،", "ok"])
check("live word matching works in Arabic letters", (live._plain("الكتابُ"), live._plain("Clip-That!")), ("الكتاب", "clipthat"))

from studio import roman  # noqa: E402
check("Arabic without the AI is spelled in Roman letters the caption font can draw, hamza and commas too",
      roman.to_roman("قابلت نوران أنا، إن شاء الله؟"), lambda t: not roman.OTHER_SCRIPT.search(t) and "," in t and "?" in t)

arabic = "[1] " + "مرحبا بكم في الحلقة الجديدة سبسكرايب " * 3
check("an Arabic transcript gets the note", brain.ARABIC_NOTE in brain._rules(15, 60, arabic), True)
check("an English one does not", brain.ARABIC_NOTE in brain._rules(15, 60, "[1] hello and welcome back " * 5), False)


# ---- the second machine: never the wrong language's model
class Reply:
    def __init__(self, code, body):
        self.status_code, self.body = code, body

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(self.status_code)

    def json(self):
        return self.body


import httpx  # noqa: E402
real_post = httpx.post
piece = [transcribe.np.zeros(16000, dtype="float32")]
old = {"pieces": [{"tokens": ["▁hi"], "timestamps": [0.0]}]}
httpx.post = lambda *a, **k: Reply(200, old)
try:
    transcribe._decode_remote(piece, "ar")
    got = "used"
except transcribe.RemoteLacks:
    got = "refused"
check("an older machine's English answer is not used for Arabic", got, "refused")
check("...but still used for English", transcribe._decode_remote(piece, "en"), [(["▁hi"], [0.0])])
httpx.post = lambda *a, **k: Reply(409, {})
try:
    transcribe._decode_remote(piece, "ar")
    got = "used"
except transcribe.RemoteLacks:
    got = "refused"
check("a machine without the Arabic model says so", got, "refused")
httpx.post = lambda *a, **k: Reply(200, dict(old, lang="ar"))
check("a machine with the Arabic model is used", transcribe._decode_remote(piece, "ar"), [(["▁hi"], [0.0])])
httpx.post = real_post

# Restore MODELS to built-in default
fetch_model.MODELS.pop("ar", None)
fetch_model._locks.pop("ar", None)
fetch_model.state.pop("ar", None)

print("ALL PASSED" if not fails else f"{len(fails)} failed")
shutil.rmtree(os.environ["CLIPCUT_DATA"], ignore_errors=True)
sys.exit(1 if fails else 0)
