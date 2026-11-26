"""Safe auto-updater for all packages in requirements.txt (including yt-dlp, youtube-transcript-api, and static-ffmpeg).

Checks PyPI for newer official releases of every package listed in requirements.txt,
snapshots the current environment, upgrades, verifies ClipCut still imports and works,
and automatically rolls back if any check fails.

Usage:
    python tools/update_requirements.py             # update outdated packages in requirements.txt
    python tools/update_requirements.py --check     # dry-run: show current vs latest versions only
    python tools/update_requirements.py --full-test # run tests/run.py after updating
"""
import argparse
import importlib.metadata
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REQUIREMENTS = ROOT / "requirements.txt"


def _parse_requirements() -> list[tuple[str, str | None]]:
    """Return [(package_name, pinned_version_or_None), ...] from requirements.txt."""
    if not REQUIREMENTS.is_file():
        return []
    out = []
    for raw in REQUIREMENTS.read_text(encoding="utf-8").splitlines():
        line = raw.split("#", 1)[0].strip()
        if not line:
            continue
        m = re.match(r"^([A-Za-z0-9_.\-]+)\s*(?:==\s*([^\s]+))?", line)
        if m:
            out.append((m.group(1), m.group(2)))
    return out


def _installed_version(pkg: str) -> str | None:
    try:
        return importlib.metadata.version(pkg)
    except importlib.metadata.PackageNotFoundError:
        return None


def _pypi_latest(pkg: str) -> str:
    url = f"https://pypi.org/pypi/{pkg}/json"
    req = urllib.request.Request(url, headers={"User-Agent": "ClipCut-ReqUpdater/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return str(data["info"]["version"])


def _version_tuple(v: str) -> tuple:
    return tuple(int(x) for x in re.findall(r"\d+", v))


def _run(cmd: list[str], timeout: int = 300) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout)


def _pip_install(specs: list[str]) -> bool:
    p = _run([sys.executable, "-m", "pip", "install", "--quiet", *specs], timeout=600)
    if p.returncode != 0:
        print(f"  pip failed: {(p.stderr or p.stdout)[-600:]}")
        return False
    return True


def _update_requirements_txt(updates: dict[str, str]):
    if not REQUIREMENTS.is_file():
        return
    lines = REQUIREMENTS.read_text(encoding="utf-8").splitlines()
    new_lines = []
    for line in lines:
        stripped = line.strip()
        replaced = False
        for pkg, ver in updates.items():
            if re.match(rf"^{re.escape(pkg)}(==|>=|<=|~=|$)", stripped, re.I):
                new_lines.append(f"{pkg}=={ver}")
                replaced = True
                break
        if not replaced:
            new_lines.append(line)
    REQUIREMENTS.write_text("\n".join(new_lines) + "\n", encoding="utf-8")


def _verify_working(run_full_tests: bool = False) -> tuple[bool, str]:
    check_code = (
        "from studio import media, render, jobs, brain, server, tools; "
        "import yt_dlp; "
        "assert hasattr(media, 'youtube_transcript_api_words'); "
        "assert hasattr(render, 'mix_background_music'); "
        "print('REQ_SMOKE_OK')"
    )
    p = _run([sys.executable, "-c", check_code], timeout=60)
    if p.returncode != 0 or "REQ_SMOKE_OK" not in (p.stdout or ""):
        return False, f"Smoke check failed:\n{(p.stderr or p.stdout)[-800:]}"
    if run_full_tests:
        tp = _run([sys.executable, str(ROOT / "tests" / "run.py")], timeout=300)
        if tp.returncode != 0:
            return False, f"Test suite failed:\n{(tp.stderr or tp.stdout)[-1000:]}"
    return True, "All verification checks passed."


def main():
    ap = argparse.ArgumentParser(description="Safely update all packages in requirements.txt.")
    ap.add_argument("--check", action="store_true", help="Show available updates without installing.")
    ap.add_argument("--no-sync-req", action="store_true", help="Do not rewrite requirements.txt.")
    ap.add_argument("--full-test", action="store_true", help="Run tests/run.py after updating.")
    args = ap.parse_args()

    pkgs = _parse_requirements()
    if not pkgs:
        print("No packages found in requirements.txt.")
        sys.exit(1)

    print("=== ClipCut Requirements Updater ===")
    req_backup = REQUIREMENTS.read_text(encoding="utf-8")
    old_versions: dict[str, str | None] = {}
    to_update: dict[str, str] = {}

    for pkg, pinned in pkgs:
        cur = _installed_version(pkg)
        old_versions[pkg] = cur or pinned
        try:
            latest = _pypi_latest(pkg)
        except Exception as e:
            print(f"  [warn] {pkg}: could not check PyPI ({e})")
            continue
        if cur is None:
            print(f"  {pkg}: not installed -> {latest}")
            to_update[pkg] = latest
        elif _version_tuple(latest) > _version_tuple(cur):
            print(f"  {pkg}: {cur} -> {latest} (update available)")
            to_update[pkg] = latest
        else:
            print(f"  {pkg}: {cur} (latest)")

    if args.check:
        print("\nCheck complete (--check mode, no changes made).")
        return

    if not to_update:
        print("\nAll requirements are already up to date.")
        ok, msg = _verify_working(run_full_tests=args.full_test)
        print(f"  {msg}")
        sys.exit(0 if ok else 1)

    specs = [f"{pkg}=={ver}" for pkg, ver in to_update.items()]
    print(f"\nUpdating {len(specs)} package(s): {', '.join(specs)} ...")
    if not _pip_install(specs):
        print("Upgrade failed during pip install.")
        sys.exit(1)

    print("Verifying ClipCut compatibility...")
    ok, msg = _verify_working(run_full_tests=args.full_test)
    if not ok:
        print(f"\n[ROLLBACK] {msg}")
        rollback_specs = [f"{pkg}=={ver}" for pkg, ver in old_versions.items() if pkg in to_update and ver]
        if rollback_specs:
            print(f"Rolling back to: {', '.join(rollback_specs)} ...")
            _pip_install(rollback_specs)
        REQUIREMENTS.write_text(req_backup, encoding="utf-8")
        print("Rollback complete. Original working state restored.")
        sys.exit(1)

    if not args.no_sync_req:
        _update_requirements_txt(to_update)
        print(f"Updated {REQUIREMENTS.name} with verified versions.")

    print(f"\nSuccess! {msg}")


if __name__ == "__main__":
    main()
