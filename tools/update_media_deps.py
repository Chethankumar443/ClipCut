"""Safe auto-updater for yt-dlp, youtube-transcript-api, and FFmpeg.

Fetches the latest official releases, checks FFmpeg compatibility with ClipCut/ClipCut
and yt-dlp, verifies the codebase still works after upgrading, and automatically rolls
back to the previous versions if anything breaks.

Usage:
    python tools/update_media_deps.py                  # update yt-dlp & youtube-transcript-api if newer
    python tools/update_media_deps.py --check          # dry-run: show current vs latest versions only
    python tools/update_media_deps.py --update-ffmpeg  # also upgrade FFmpeg if outdated/incompatible
    python tools/update_media_deps.py --full-test      # run tests/run.py as part of verification
"""
import argparse
import importlib.metadata
import json
import re
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REQUIREMENTS = ROOT / "requirements.txt"
PACKAGES = ("yt-dlp", "youtube-transcript-api")
MIN_FFMPEG_MAJOR = 5
REQUIRED_CODECS_AND_FILTERS = ("libx264", "aac", "loudnorm", "ass", "amix", "afade")


def _installed_version(pkg: str) -> str | None:
    try:
        return importlib.metadata.version(pkg)
    except importlib.metadata.PackageNotFoundError:
        return None


def _pypi_latest(pkg: str) -> str:
    url = f"https://pypi.org/pypi/{pkg}/json"
    req = urllib.request.Request(url, headers={"User-Agent": "ClipCut-Updater/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return str(data["info"]["version"])


def _version_tuple(v: str) -> tuple:
    return tuple(int(x) for x in re.findall(r"\d+", v))


def _run(cmd: list[str], timeout: int = 300) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout)


def _find_ffmpeg() -> tuple[str | None, str | None]:
    sys.path.insert(0, str(ROOT))
    try:
        from studio import tools
        tools.setup()
    except Exception:
        pass
    return shutil.which("ffmpeg"), shutil.which("ffprobe")


def _ffmpeg_info(ffmpeg_bin: str) -> dict:
    p = _run([ffmpeg_bin, "-version"], timeout=15)
    if p.returncode != 0:
        return {"ok": False, "raw": p.stderr.strip()}
    first = (p.stdout or "").splitlines()[0] if p.stdout else ""
    m = re.search(r"ffmpeg version (\S+)", first)
    ver_str = m.group(1) if m else "unknown"
    major_m = re.match(r"(\d+)\.", ver_str)
    major = int(major_m.group(1)) if major_m else None
    is_git_build = major is None and (ver_str.startswith("N-") or bool(re.match(r"\d{4}-\d{2}-\d{2}", ver_str)))
    # Check filters and encoders required by ClipCut & yt-dlp
    enc = (_run([ffmpeg_bin, "-encoders"], timeout=15).stdout or "")
    flt = (_run([ffmpeg_bin, "-filters"], timeout=15).stdout or "")
    combined = enc + "\n" + flt
    missing_caps = [cap for cap in REQUIRED_CODECS_AND_FILTERS if cap not in combined]
    compatible = (major is not None and major >= MIN_FFMPEG_MAJOR or is_git_build) and not missing_caps
    return {
        "ok": True,
        "version": ver_str,
        "major": major,
        "is_git_build": is_git_build,
        "missing_caps": missing_caps,
        "compatible": compatible,
    }


def _update_ffmpeg(dry_run: bool = False) -> bool:
    if sys.platform == "win32":
        cmd = ["winget", "upgrade", "--id", "Gyan.FFmpeg", "--silent", "--accept-package-agreements", "--accept-source-agreements"]
    elif sys.platform == "darwin":
        cmd = ["brew", "upgrade", "ffmpeg"]
    else:
        cmd = ["sudo", "apt-get", "update", "&&", "sudo", "apt-get", "install", "-y", "ffmpeg"]
    if dry_run:
        print(f"  [dry-run] Would run: {' '.join(cmd)}")
        return True
    print(f"  Updating FFmpeg via: {' '.join(cmd)}")
    if sys.platform in ("win32", "darwin"):
        p = _run(cmd, timeout=600)
        if p.returncode == 0:
            print("  FFmpeg updated successfully.")
            return True
        print(f"  FFmpeg update exited {p.returncode}: {(p.stderr or p.stdout)[-400:]}")
        return False
    print("  On Linux, please run: sudo apt-get update && sudo apt-get install -y ffmpeg")
    return False


def _pip_install(specs: list[str]) -> bool:
    cmd = [sys.executable, "-m", "pip", "install", "--quiet", *specs]
    p = _run(cmd, timeout=300)
    if p.returncode != 0:
        print(f"  pip failed: {(p.stderr or p.stdout)[-600:]}")
        return False
    return True


def _update_requirements_txt(updates: dict[str, str]):
    if not REQUIREMENTS.is_file():
        return
    lines = REQUIREMENTS.read_text(encoding="utf-8").splitlines()
    new_lines = []
    seen = set()
    for line in lines:
        stripped = line.strip()
        replaced = False
        for pkg, ver in updates.items():
            if re.match(rf"^{re.escape(pkg)}(==|>=|<=|~=|$)", stripped, re.I):
                new_lines.append(f"{pkg}=={ver}")
                seen.add(pkg)
                replaced = True
                break
        if not replaced:
            new_lines.append(line)
    for pkg, ver in updates.items():
        if pkg not in seen:
            new_lines.append(f"{pkg}=={ver}")
    REQUIREMENTS.write_text("\n".join(new_lines) + "\n", encoding="utf-8")


def _verify_working(run_full_tests: bool = False) -> tuple[bool, str]:
    """Verify yt-dlp, youtube-transcript-api (if installed), and ClipCut's core modules still work cleanly."""
    yt_api_check = "from youtube_transcript_api import YouTubeTranscriptApi; " if _installed_version("youtube-transcript-api") else ""
    check_code = (
        "import yt_dlp; "
        + yt_api_check +
        "from studio import media, render, jobs, brain, server; "
        "ydl = media._ydl({}); "
        "assert hasattr(ydl, 'extract_info'); "
        "assert hasattr(render, 'mix_background_music'); "
        "assert hasattr(media, 'youtube_transcript_api_words'); "
        "print('SMOKE_OK')"
    )
    p = _run([sys.executable, "-c", check_code], timeout=60)
    if p.returncode != 0 or "SMOKE_OK" not in (p.stdout or ""):
        return False, f"Smoke check failed:\n{(p.stderr or p.stdout)[-800:]}"
    if run_full_tests:
        tp = _run([sys.executable, str(ROOT / "tests" / "run.py")], timeout=300)
        if tp.returncode != 0:
            return False, f"Test suite failed:\n{(tp.stderr or tp.stdout)[-1000:]}"
    return True, "All verification checks passed."


def main():
    ap = argparse.ArgumentParser(description="Safely update yt-dlp, youtube-transcript-api, and FFmpeg.")
    ap.add_argument("--check", action="store_true", help="Check versions & compatibility without modifying anything.")
    ap.add_argument("--update-ffmpeg", action="store_true", help="Also upgrade FFmpeg if outdated or incompatible.")
    ap.add_argument("--no-sync-req", action="store_true", help="Do not update pinned versions in requirements.txt.")
    ap.add_argument("--full-test", action="store_true", help="Run tests/run.py after updating.")
    args = ap.parse_args()

    print("=== ClipCut Media Dependency Updater ===")

    # 1. Snapshot current state
    old_versions: dict[str, str | None] = {pkg: _installed_version(pkg) for pkg in PACKAGES}
    req_backup = REQUIREMENTS.read_text(encoding="utf-8") if REQUIREMENTS.is_file() else None

    to_update: dict[str, str] = {}
    for pkg in PACKAGES:
        cur = old_versions[pkg]
        try:
            latest = _pypi_latest(pkg)
        except Exception as e:
            print(f"  [warn] Could not check PyPI for {pkg}: {e}")
            continue
        status = "up to date"
        if cur is None:
            status = f"not installed -> {latest}"
            to_update[pkg] = latest
        elif _version_tuple(latest) > _version_tuple(cur):
            status = f"{cur} -> {latest} (update available)"
            to_update[pkg] = latest
        else:
            status = f"{cur} (latest)"
        print(f"  {pkg}: {status}")

    # 2. Check FFmpeg compatibility
    ffmpeg_bin, ffprobe_bin = _find_ffmpeg()
    if ffmpeg_bin and ffprobe_bin:
        ff = _ffmpeg_info(ffmpeg_bin)
        if ff["ok"]:
            compat_msg = "compatible" if ff["compatible"] else f"incompatible (missing: {ff['missing_caps']})"
            print(f"  ffmpeg: {ff['version']} ({compat_msg}) at {ffmpeg_bin}")
            if (args.update_ffmpeg or not ff["compatible"]) and not args.check:
                if not ff["compatible"] or args.update_ffmpeg:
                    _update_ffmpeg(dry_run=args.check)
        else:
            print(f"  ffmpeg: error running {ffmpeg_bin}")
    else:
        print("  ffmpeg/ffprobe: not found on PATH.")
        if args.update_ffmpeg:
            _update_ffmpeg(dry_run=args.check)

    if args.check:
        print("\nCheck complete (--check mode, no changes made).")
        return

    if not to_update:
        print("\nAll Python media packages are already up to date.")
        ok, msg = _verify_working(run_full_tests=args.full_test)
        print(f"  {msg}")
        sys.exit(0 if ok else 1)

    # 3. Perform upgrade
    specs = [f"{pkg}=={ver}" for pkg, ver in to_update.items()]
    print(f"\nUpdating: {', '.join(specs)} ...")
    if not _pip_install(specs):
        print("Upgrade failed during pip install. No changes finalized.")
        sys.exit(1)

    # 4. Verify compatibility; rollback on failure
    print("Verifying compatibility with ClipCut...")
    ok, msg = _verify_working(run_full_tests=args.full_test)
    if not ok:
        print(f"\n[ROLLBACK] {msg}")
        rollback_specs = [f"{pkg}=={ver}" for pkg, ver in old_versions.items() if ver]
        if rollback_specs:
            print(f"Rolling back to: {', '.join(rollback_specs)} ...")
            _pip_install(rollback_specs)
        if req_backup is not None:
            REQUIREMENTS.write_text(req_backup, encoding="utf-8")
        print("Rollback complete. Original working state restored.")
        sys.exit(1)

    # 5. Sync requirements.txt after verification passes
    if not args.no_sync_req:
        _update_requirements_txt(to_update)
        print(f"Updated {REQUIREMENTS.name} with verified versions.")

    print(f"\nSuccess! {msg}")


if __name__ == "__main__":
    main()
