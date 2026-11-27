"""Isolated real-Git concurrency regression for File Steward report publication.

Uses two local clones of a bare remote, no GitHub credentials, user data,
network, or production report files. Rejects force/rebase-and-ignore behavior.
"""
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
PUBLISHER = HERE / "ci_publish_file_steward.py"
REPORTS = (
    "reports/file-governance/FILE_GOVERNANCE.json",
    "reports/file-governance/FILE_GOVERNANCE.md",
    "reports/file-governance/SUMMARY.json",
    "docs/audits/FILE_GOVERNANCE_LOG.md",
)
FAKE_AUDITOR = r'''
from pathlib import Path
import os, subprocess
root=Path(__file__).resolve().parents[1]
marker=os.environ.get("STEWARD_TEST_RACE_MARKER")
if marker and Path(marker).exists():
    Path(marker).unlink()
    other=Path(os.environ["STEWARD_TEST_OTHER_CLONE"])
    (other/"feature.txt").write_text("concurrent real source edit\n")
    for args in (("add","feature.txt"),("commit","-m","concurrent feature"),("push","origin","main")):
        subprocess.run(["git","-C",str(other),*args],check=True,stdout=subprocess.DEVNULL)
revision=subprocess.check_output(["git","-C",str(root),"rev-parse","HEAD"],text=True).strip()
for rel in (
    "reports/file-governance/FILE_GOVERNANCE.json",
    "reports/file-governance/FILE_GOVERNANCE.md",
    "reports/file-governance/SUMMARY.json",
    "docs/audits/FILE_GOVERNANCE_LOG.md",
):
    target=root/rel
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text("audited revision="+revision+"\n")
'''


def git(*args, cwd=None, check=True):
    return subprocess.run(["git", *map(str,args)], cwd=cwd, check=check,
                          capture_output=True, text=True)


class FileStewardPublicationTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.base = Path(temp.name)
        self.remote = self.base/"remote.git"
        self.writer = self.base/"writer"
        self.concurrent = self.base/"concurrent"
        git("init","-q","--bare","-b","main",self.remote)
        git("clone","-q",self.remote,self.writer)
        for key,val in (("user.name","CI"),("user.email","ci@example.invalid")):
            git("-C",self.writer,"config",key,val)
        (self.writer/"tools").mkdir()
        (self.writer/"tools/repository_file_auditor.py").write_text(FAKE_AUDITOR)
        (self.writer/"README.md").write_text("Synthetic fixture, not user data\n")
        git("-C",self.writer,"add",".")
        git("-C",self.writer,"commit","-qm","seed source")
        git("-C",self.writer,"push","-q","origin","main")
        git("clone","-q",self.remote,self.concurrent)
        for key,val in (("user.name","Concurrent"),("user.email","other@example.invalid")):
            git("-C",self.concurrent,"config",key,val)

    def publish(self, *args, env=None):
        return subprocess.run(
            [sys.executable,str(PUBLISHER),"--repo",str(self.writer),*args],
            capture_output=True,text=True,
            env={**os.environ,**(env or {})},
        )

    def test_writes_only_generated_reports_then_detects_unchanged(self):
        result=self.publish()
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertIn("FILE_STEWARD_PUBLISHED",result.stdout)
        changed=git("--git-dir",self.remote,"diff-tree","--no-commit-id",
                    "--name-only","-r","main").stdout.splitlines()
        self.assertEqual(set(changed),set(REPORTS))
        second=self.publish()
        self.assertEqual(second.returncode,0,second.stderr)
        # A deterministic fixture writing its audited main SHA may itself be
        # new after a commit. The important safety guarantee is no extra files.
        self.assertNotIn("force",second.stdout.lower())

    def test_real_concurrent_push_regenerates_from_new_remote_commit(self):
        marker=self.base/"race.once"
        marker.write_text("trigger")
        result=self.publish(env={
            "STEWARD_TEST_RACE_MARKER":str(marker),
            "STEWARD_TEST_OTHER_CLONE":str(self.concurrent),
        })
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertIn("FILE_STEWARD_PUSH_REJECTED: attempt 1",result.stderr)
        self.assertIn("FILE_STEWARD_PUBLISHED: fresh main, attempt 2",result.stdout)
        main=git("--git-dir",self.remote,"rev-parse","refs/heads/main").stdout.strip()
        feature=git("--git-dir",self.remote,"log","--format=%H","--",
                    "feature.txt").stdout.splitlines()
        self.assertEqual(len(feature),1)
        self.assertEqual(
            git("--git-dir",self.remote,"merge-base","--is-ancestor",
                feature[0],main).returncode,0
        )
        prior=git("--git-dir",self.remote,"rev-parse",main+"^").stdout.strip()
        report=git("--git-dir",self.remote,"show",
                   main+":reports/file-governance/SUMMARY.json").stdout
        self.assertIn("audited revision="+prior,report,
                      "retry must rescan concurrent main, not rebase stale report")

    def test_denied_push_fails_closed_without_force(self):
        hook=self.remote/"hooks/pre-receive"
        hook.write_text("#!/bin/sh\nexit 1\n")
        hook.chmod(0o755)
        before=git("--git-dir",self.remote,"rev-parse","refs/heads/main").stdout
        result=self.publish("--max-attempts","2")
        self.assertNotEqual(result.returncode,0)
        self.assertIn("did not succeed after fresh rescans",result.stderr)
        after=git("--git-dir",self.remote,"rev-parse","refs/heads/main").stdout
        self.assertEqual(after,before)

    def test_no_arbitrary_report_or_repository_deletion(self):
        script=PUBLISHER.read_text()
        self.assertNotIn("push --force",script)
        self.assertNotIn('"rebase"',script)
        self.assertNotIn('"reset", "--hard"',script)
        self.assertEqual(len(REPORTS),4)
        self.assertIn('git(repo, "add", "--", *REPORTS)',script)


if __name__ == "__main__":
    unittest.main()
