#!/usr/bin/env python3
"""Publish generated File Steward reports against fresh main, without force push.

GitHub Actions can start from an outdated push SHA while another writer advances
main. Never rebase a *generated report* commit over a different report commit:
rescan the newest tracked tree and regenerate the four allowed report files.
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

REPORTS = (
    "reports/file-governance/FILE_GOVERNANCE.json",
    "reports/file-governance/FILE_GOVERNANCE.md",
    "reports/file-governance/SUMMARY.json",
    "docs/audits/FILE_GOVERNANCE_LOG.md",
)
BRANCH = "file-steward-publish"


def git(repo: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", "-C", str(repo), *args], text=True, check=check,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )


def publish(repo: Path, max_attempts: int = 6) -> str:
    if not 1 <= max_attempts <= 12:
        raise ValueError("max_attempts must be between 1 and 12")
    if not (repo / "tools/repository_file_auditor.py").is_file():
        raise RuntimeError("Missing canonical repository-local File Steward auditor")

    git(repo, "config", "user.name", "github-actions[bot]")
    git(repo, "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com")

    for attempt in range(1, max_attempts + 1):
        # Re-read the complete current main snapshot, NOT the stale triggering
        # checkout. This is safe because the workflow performs no unrelated edits.
        git(repo, "fetch", "origin", "main")
        git(repo, "checkout", "-B", BRANCH, "origin/main")
        subprocess.run(
            [sys.executable, str(repo / "tools/repository_file_auditor.py"),
             "--repo", str(repo)], cwd=repo, check=True
        )
        git(repo, "add", "--", *REPORTS)
        if git(repo, "diff", "--cached", "--quiet", check=False).returncode == 0:
            print("FILE_STEWARD_UP_TO_DATE: origin/main, no generated delta", flush=True)
            return "unchanged"

        staged = git(repo, "diff", "--cached", "--name-only").stdout.splitlines()
        if any(path not in REPORTS for path in staged):
            raise RuntimeError("File Steward attempted to stage a non-report path")
        git(repo, "commit", "-m", "chore(file-steward): refresh local audit findings [skip ci]")
        pushed = git(repo, "push", "origin", "HEAD:refs/heads/main", check=False)
        if pushed.returncode == 0:
            print(f"FILE_STEWARD_PUBLISHED: fresh main, attempt {attempt}", flush=True)
            return "published"

        print(f"FILE_STEWARD_PUSH_REJECTED: attempt {attempt}; refreshing and rescanning",
              file=sys.stderr, flush=True)
        # A permission error is also fail-closed. No force pushes or rebasing
        # generated reports across concurrent main updates; retry is bounded.

    raise RuntimeError("File Steward push did not succeed after fresh rescans; no force push")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", type=Path, default=Path("."))
    ap.add_argument("--max-attempts", type=int, default=6)
    args = ap.parse_args()
    publish(args.repo.resolve(), args.max_attempts)


if __name__ == "__main__":
    main()
