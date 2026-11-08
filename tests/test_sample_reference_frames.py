"""Offline contract tests: reference frame sampling never runs real ffmpeg or network."""
import json
import os
import stat
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / 'skills/saas-product-demo-video/scripts/sample-reference-frames.sh'


def write_executable(path: Path, body: str):
    path.write_text(body)
    path.chmod(path.stat().st_mode | stat.S_IEXEC)


class SampleReferenceFramesTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / 'bin').mkdir()
        self.calls = self.root / 'calls.jsonl'
        video = self.root / 'video.mp4'
        video.write_bytes(b'fake video bytes')
        self.video = video

        ffprobe = self.root / 'bin/ffprobe'
        write_executable(ffprobe, '#!/usr/bin/env python3\nimport sys\nprint("10.0")\n')

        ffmpeg = self.root / 'bin/ffmpeg'
        write_executable(ffmpeg, f'''#!/usr/bin/env python3
import json, os, sys
from pathlib import Path
Path({str(self.calls)!r}).open("a").write(json.dumps(sys.argv[1:]) + "\\n")
args = sys.argv[1:]
out = args[-1] if "-q:v" in args else None
if out and "tile=4x3" in " ".join(args):
    Path(out % 1).write_bytes(b"jpg")
elif out and "tile=8x1" in " ".join(args):
    Path(out).write_bytes(b"jpg")
if "metadata=print:file=" in " ".join(args):
    for a in args:
        if "metadata=print:file=" in a:
            Path(a.split("metadata=print:file=", 1)[1]).write_text(
                "frame:0\\npts_time:0.00\\nscene_score=0.01\\n"
                "frame:1\\npts_time:1.00\\nscene_score=0.40\\n"
                "frame:2\\npts_time:2.00\\nscene_score=0.02\\n")
''')

        self.env = {**os.environ, 'PATH': str(self.root / 'bin') + os.pathsep + os.environ['PATH']}

    def run_script(self, name, extra_env=None):
        env = {**self.env, **(extra_env or {})}
        return subprocess.run(['bash', str(SCRIPT), str(self.video), name],
                              cwd=self.root, env=env, text=True, capture_output=True)

    def out_dir(self, name):
        return self.root / 'references' / f'frames-{name}'

    def test_valid_name_produces_reference_folder(self):
        result = self.run_script('linear-launch')
        self.assertEqual(result.returncode, 0, result.stderr)
        out = self.out_dir('linear-launch')
        self.assertTrue((out / 'index.md').is_file(), sorted(p.name for p in out.glob('*')))
        self.assertTrue(any(out.glob('overview-*.jpg')))
        self.assertTrue(any(out.glob('cut-*.jpg')), 'the mock scores include a cut at 1.00s')

    def test_name_with_path_characters_is_rejected_before_any_tool_runs(self):
        for bad in ['../escape', 'a/b', '..', 'sub/dir/name']:
            with self.subTest(name=bad):
                result = self.run_script(bad)
                self.assertNotEqual(result.returncode, 0, result.stdout)
                self.assertIn('ERROR:', result.stderr)
                self.assertFalse(self.calls.exists(), 'ffmpeg ran despite an invalid name')
                self.assertFalse((self.root / 'references').exists())

    def test_tunable_env_values_are_data_not_executable_source(self):
        result = self.run_script('demo', extra_env={
            'MAX_SHEETS': "12'not-a-number",
        })
        self.assertNotEqual(result.returncode, 0, result.stdout)
        self.assertIn('ERROR:', result.stderr)
        self.assertNotIn('Traceback', result.stderr, 'injected source must not execute')
        self.assertEqual(result.returncode, 2, 'script must fail fast on a non-numeric tunable')

    def test_non_numeric_duration_fails_cleanly(self):
        ffprobe = self.root / 'bin/ffprobe'
        write_executable(ffprobe, '#!/usr/bin/env python3\nimport sys\nprint("not-a-number")\n')
        result = self.run_script('demo')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('ERROR:', result.stderr)
        self.assertNotIn('Traceback', result.stderr)

    def test_symlinked_references_directory_is_rejected(self):
        outside = self.root / 'outside'
        outside.mkdir()
        (self.root / 'references').symlink_to(outside, target_is_directory=True)
        result = self.run_script('demo')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('ERROR:', result.stderr)
        self.assertEqual(list(outside.iterdir()), [])

    def test_removal_stays_inside_the_references_directory(self):
        guard = self.root / 'references' / 'frames-sibling'
        guard.mkdir(parents=True)
        sentinel = guard / 'keep.txt'
        sentinel.write_text('do not delete')
        result = self.run_script('existing')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(sentinel.read_text(), 'do not delete', 'regenerating a name replaces only its own folder')


if __name__ == '__main__':
    unittest.main()
