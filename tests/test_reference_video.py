"""Offline contract tests: never contact Gemini or use a real API key."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'skills/saas-product-demo-video/scripts/analyze-reference-video.sh'


class ReferenceVideoTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / 'bin').mkdir()
        curl = self.root / 'bin/curl'
        curl.write_text('#!/usr/bin/env python3\nimport json, os, sys\nfrom pathlib import Path\nPath("request.json").write_text(json.dumps(sys.argv[1:]))\nPath("headers.txt").write_text(sys.stdin.read())\nprint(os.environ["MOCK_RESPONSE"])\nsys.exit(int(os.environ.get("MOCK_EXIT", "0")))\n')
        curl.chmod(0o755)
        self.output = self.root / 'references/demo.md'
        self.env = {**os.environ, 'PATH': str(self.root / 'bin') + os.pathsep + os.environ['PATH'], 'GEMINI_API_KEY': 'offline-test-key', 'MODEL': 'gemini-pro-latest'}

    def run_script(self, response, exit_code=0, name='demo'):
        return subprocess.run(['bash', str(SCRIPT), 'https://youtu.be/example', name], cwd=self.root, env={**self.env, 'MOCK_RESPONSE': response, 'MOCK_EXIT': str(exit_code)}, text=True, capture_output=True)

    def test_success_writes_project_output_with_provenance(self):
        response = {'candidates': [{'content': {'parts': [{'text': 'Hidden thought', 'thought': True}, {'text': '# Shot one\n'}, {'text': 'Push through.'}]}}]}
        result = self.run_script(json.dumps(response))
        self.assertEqual(result.returncode, 0, result.stderr)
        content = self.output.read_text()
        self.assertIn('source: https://youtu.be/example\nmodel: gemini-pro-latest\ngenerated:', content)
        self.assertIn('# Shot one\nPush through.', content)
        self.assertNotIn('Hidden thought', content)
        args = json.loads((self.root / 'request.json').read_text())
        body = json.loads(args[args.index('-d') + 1])
        self.assertEqual(body['contents'][0]['parts'][0]['fileData']['fileUri'], 'https://youtu.be/example')
        self.assertTrue(body['contents'][0]['parts'][1]['text'])

    def test_failures_do_not_create_or_replace_a_breakdown(self):
        cases = [('HTTP failure', '{"error":{"message":"unavailable"}}', 22), ('API error', '{"error":{"message":"invalid model"}}', 0), ('no candidates', '{}', 0), ('empty candidates', '{"candidates":[]}', 0), ('missing content', '{"candidates":[{}]}', 0), ('null content', '{"candidates":[{"content":null}]}', 0), ('empty parts', '{"candidates":[{"content":{"parts":[]}}]}', 0), ('whitespace', '{"candidates":[{"content":{"parts":[{"text":"  "}]}}]}', 0), ('invalid JSON', 'not JSON', 0)]
        for label, response, code in cases:
            for existing in [False, True]:
                with self.subTest(label=label, existing=existing):
                    self.output.parent.mkdir(exist_ok=True)
                    if existing:
                        self.output.write_text('keep the previous breakdown')
                    else:
                        self.output.unlink(missing_ok=True)
                    result = self.run_script(response, code)
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn('ERROR:', result.stderr)
                    if existing:
                        self.assertEqual(self.output.read_text(), 'keep the previous breakdown')
                    else:
                        self.assertFalse(self.output.exists())

    def test_model_override(self):
        self.env['MODEL'] = 'test-model'
        result = self.run_script('{"candidates":[{"content":{"parts":[{"text":"ok"}]}}]}')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('model: test-model', self.output.read_text())

    def test_key_is_not_passed_in_process_arguments(self):
        result = self.run_script('{"candidates":[{"content":{"parts":[{"text":"ok"}]}}]}')
        self.assertEqual(result.returncode, 0, result.stderr)
        args = json.loads((self.root / 'request.json').read_text())
        self.assertNotIn(self.env['GEMINI_API_KEY'], ' '.join(args))
        self.assertIn('--header', args)
        self.assertIn('@-', args)
        self.assertEqual((self.root / 'headers.txt').read_text(),
                         'X-goog-api-key: ' + self.env['GEMINI_API_KEY'] + '\n')

    def test_missing_key_does_not_source_project_environment(self):
        self.env.pop('GEMINI_API_KEY')
        # A marker assignment is sufficient: no executable payload is needed.
        (self.root / '.env').write_text('GEMINI_API_KEY=offline-from-dotenv\n')
        result = self.run_script('{}')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('GEMINI_API_KEY not set', result.stderr)
        self.assertFalse((self.root / 'request.json').exists())

    def test_header_newlines_are_rejected_before_api(self):
        self.env['GEMINI_API_KEY'] = 'offline-test-key\nnot-a-header'
        result = self.run_script('{}')
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.root / 'request.json').exists())

    def test_symlinked_output_paths_are_rejected_before_api(self):
        outside = self.root / 'outside'
        outside.mkdir()
        target = outside / 'keep.md'
        target.write_text('preserve')
        for parent_link in [True, False]:
            with self.subTest(parent_link=parent_link):
                refs = self.root / 'references'
                if refs.is_symlink():
                    refs.unlink()
                elif refs.exists():
                    self.output.unlink(missing_ok=True)
                    refs.rmdir()
                if parent_link:
                    refs.symlink_to(outside, target_is_directory=True)
                else:
                    refs.mkdir()
                    self.output.symlink_to(target)
                result = self.run_script('{"candidates":[{"content":{"parts":[{"text":"ok"}]}}]}')
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(target.read_text(), 'preserve')
                self.assertFalse((self.root / 'request.json').exists())

    def test_invalid_name_stops_before_api(self):
        result = self.run_script('{}', name='../escape')
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.root / 'request.json').exists())


if __name__ == '__main__':
    unittest.main()
