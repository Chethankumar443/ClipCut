"""Speech models & transcription: Faster-Whisper single multi-language default, auto-detect across 99+ languages,
model size caching/removal, language selection on videos and creators, Romanized captions, and remote GPU worker checks."""
import os
import shutil
import sys
import tempfile
import time
from types import SimpleNamespace

os.environ["CLIPCUT_DATA"] = tempfile.mkdtemp(prefix="pc-speech-")
os.environ.pop("CLIPCUT_MODELS", None)
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

# ---- English Sherpa model removed completely; Faster-Whisper is the single multi-language default
check("no English Parakeet/Sherpa archive model remains", (fetch_model.MODELS, fetch_model.DEFAULT), ({}, ""))
check("Faster-Whisper is configured as default speech engine",
      (config.ASR_ENGINE, config.WHISPER_MODEL), ("faster-whisper", "base"))

sp_init = c.get("/api/speech").json()
check("speech API reports Faster-Whisper engine, sizes, and multi-language list",
      (sp_init["engine"],
       [m["id"] for m in sp_init["models"]],
       sp_init["whisper_models"],
       any(l["code"] == "auto" for l in sp_init["languages"]) and any(l["code"] == "es" for l in sp_init["languages"])),
      ("faster-whisper", ["tiny", "base", "small", "medium", "large-v3"], ["tiny", "base", "small", "medium", "large-v3"], True))
check("speech settings default to faster-whisper and auto-detect language",
      sp_init["settings"], {"engine": "faster-whisper", "whisper_model": "base", "language": "auto"})

check("status brief exposes Faster-Whisper multi-language options",
      (c.get("/api/status").json()["speech"]["engine"], c.get("/api/status").json()["speech"]["default"]),
      ("faster-whisper", "auto"))

check("wrong Origin cannot change speech settings",
      c.put("/api/speech", json={"language": "es"}, headers={"Origin": "https://evil.example"}).status_code, 403)
check("invalid speech engine is rejected",
      c.put("/api/speech", json={"engine": "sherpa"}, headers=ORIGIN).status_code, 400)
check("invalid Whisper model size is rejected",
      c.put("/api/speech", json={"whisper_model": "huge"}, headers=ORIGIN).status_code, 400)
check("unknown language is rejected in settings",
      c.put("/api/speech", json={"language": "xx"}, headers=ORIGIN).status_code, 400)

sp_saved = c.put("/api/speech", json={"engine": "faster-whisper", "whisper_model": "small", "language": "es"}, headers=ORIGIN)
check("speech settings save Faster-Whisper size and spoken language",
      (sp_saved.status_code, sp_saved.json()["settings"]),
      (200, {"engine": "faster-whisper", "whisper_model": "small", "language": "es"}))
sp_auto = c.put("/api/speech", json={"engine": "faster-whisper", "language": "auto", "whisper_model": "base"}, headers=ORIGIN)
check("Auto restores auto-detect language on Faster-Whisper",
      (sp_auto.status_code, sp_auto.json()["settings"]),
      (200, {"engine": "faster-whisper", "whisper_model": "base", "language": "auto"}))

# ---- Pre-downloading & deleting Faster-Whisper sizes cleanly (with mocked downloader)
downloads = []
fail_next = False
real_dl = fetch_model._download_whisper


def fake_download_whisper(size: str):
    downloads.append(size)
    if fail_next:
        raise OSError("network offline")
    d = fetch_model.folder(size)
    d.mkdir(parents=True, exist_ok=True)
    (d / "model.bin").write_bytes(b"weights")
    return d


fetch_model._download_whisper = fake_download_whisper
try:
    check("nothing downloaded to begin with", (fetch_model.ready("base"), fetch_model.ready("small")), (False, False))
    check("unknown model or old English route is refused",
          (c.post("/api/speech/en", headers=ORIGIN).status_code, c.delete("/api/speech/en", headers=ORIGIN).status_code),
          (400, 400))
    check("another website cannot start a download",
          c.post("/api/speech/small", headers={"Origin": "https://evil.example"}).status_code, 403)
    check("...and nothing was downloaded", downloads, [])

    fail_next = True
    try:
        fetch_model.ensure("small")
        said = ""
    except RuntimeError as e:
        said = str(e)
    check("a failed download explains what happened and stores error",
          ("network offline" in said and "python -m studio.fetch_model small" in said,
           "network offline" in fetch_model.state["small"]["error"]),
          (True, True))
    fail_next = False
    downloads.clear()

    check("the owner can start pre-downloading a Faster-Whisper size",
          c.post("/api/speech/small", headers=ORIGIN).status_code, 200)
    for _ in range(100):
        if fetch_model.status("small") == "ready":
            break
        time.sleep(0.05)
    check("downloaded size arrives ready inside models/whisper",
          (fetch_model.ready("small"), (fetch_model.folder("small") / "model.bin").is_file()), (True, True))
    check("asking again downloads nothing more",
          (c.post("/api/speech/small", headers=ORIGIN).status_code, downloads.count("small")), (200, 1))

    # Active size stays protected until user switches sizes; inactive busy size stays protected too
    check("currently active size cannot be deleted directly",
          c.delete("/api/speech/base", headers=ORIGIN).status_code, 400)
    with transcribe._whisper_lock:
        transcribe._whisper_busy[("small", "cpu", "int8")] = 1
    check("size in active use refuses deletion",
          (c.delete("/api/speech/small", headers=ORIGIN).status_code, fetch_model.ready("small")), (409, True))
    with transcribe._whisper_lock:
        transcribe._whisper_busy.pop(("small", "cpu", "int8"), None)
    check("unused size can be removed cleanly",
          (c.delete("/api/speech/small", headers=ORIGIN).status_code, fetch_model.folder("small").exists()), (200, False))
finally:
    fetch_model._download_whisper = real_dl

# ---- Single Faster-Whisper model transcribes multiple languages cleanly
whisper_calls = []


class FakeWhisper:
    def transcribe(self, pcm, language=None, word_timestamps=True, vad_filter=True):
        whisper_calls.append({"language": language, "len": len(pcm), "word_timestamps": word_timestamps})
        segs = [
            SimpleNamespace(
                end=1.0,
                words=[
                    SimpleNamespace(word=" الكتابُ", start=0.1, end=0.5),
                    SimpleNamespace(word=" hola", start=0.6, end=0.9),
                ],
            )
        ]
        return iter(segs), None


real_get_whisper = transcribe._get_whisper
transcribe._get_whisper = lambda model_name, device, compute: FakeWhisper()
try:
    sample_audio = transcribe.np.zeros(16000, dtype=transcribe.np.int16)
    got_auto = transcribe.transcribe(sample_audio, lang="auto")
    got_es = transcribe.transcribe(sample_audio, lang="es")
    got_ar = transcribe.transcribe(sample_audio, lang="ar")
finally:
    transcribe._get_whisper = real_get_whisper

check("auto language passes None so Faster-Whisper auto-detects", whisper_calls[0]["language"], None)
check("explicit languages pass their language code to Faster-Whisper",
      (whisper_calls[1]["language"], whisper_calls[2]["language"]), ("es", "ar"))
check("Arabic vowel marks are stripped cleanly on Faster-Whisper words",
      [w["w"] for w in got_auto], ["الكتاب", "hola"])

# ---- Choosing the language on videos and creators (auto-detect + multilingual)
check("a video can be marked as auto-detect", jobs.clean_options({"lang": "auto"}), {"lang": "auto"})
check("a video can be marked with any Faster-Whisper language", jobs.clean_options({"lang": "es"}), {"lang": "es"})
check("an unknown language falls back to auto", jobs.clean_options({"lang": "xx"}), {"lang": "auto"})
check("videos default to auto unless chosen", jobs.DEFAULTS["lang"], "auto")
check("a creator can speak Spanish or Arabic",
      (creators._clean({"lang": "es"}), creators._clean({"lang": "ar"})), ({"lang": "es"}, {"lang": "ar"}))
check("...but not a made-up language", creators._clean({"lang": "<b>"}), {"lang": "auto"})

r = c.post("/api/creators", json={"name": "Arabic speaker"}, headers=ORIGIN)
cid = r.json()["id"]
c.put(f"/api/creators/{cid}", json={"lang": "ar"}, headers=ORIGIN)
with ctx.as_user(auth.local_user().id):
    cr = creators.get(cid)
    check("the creator's language is kept", cr.get("lang"), "ar")
    real_missing = tools.missing
    real_start = live.Session.start
    tools.missing = lambda: []
    live.Session.start = lambda self: None
    try:
        live_job = live.start_session(cr, "https://www.twitch.tv/someone")
    finally:
        tools.missing = real_missing
        live.Session.start = real_start
    check("live recording works immediately for non-English creators with Faster-Whisper",
          live_job.get("lang"), "ar")

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


# ---- Remote GPU worker language consistency checks
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
check("a remote reply missing the requested lang tag is refused", got, "refused")

httpx.post = lambda *a, **k: Reply(409, {})
try:
    transcribe._decode_remote(piece, "ar")
    got = "used"
except transcribe.RemoteLacks:
    got = "refused"
check("a remote machine refusing the language raises RemoteLacks", got, "refused")

httpx.post = lambda *a, **k: Reply(200, dict(old, lang="ar"))
check("a remote machine returning matching lang is accepted",
      transcribe._decode_remote(piece, "ar"), [(["▁hi"], [0.0])])
httpx.post = lambda *a, **k: Reply(200, dict(old, lang="auto"))
check("...including auto language detection",
      transcribe._decode_remote(piece, "auto"), [(["▁hi"], [0.0])])
httpx.post = real_post

print("ALL PASSED" if not fails else f"{len(fails)} failed")
shutil.rmtree(os.environ["CLIPCUT_DATA"], ignore_errors=True)
sys.exit(1 if fails else 0)
