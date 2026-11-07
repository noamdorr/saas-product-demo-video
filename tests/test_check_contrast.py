"""Offline tests for scripts/check-contrast.py."""
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'skills/saas-product-demo-video/scripts/check-contrast.py'


def run(*args):
    return subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True)


class CheckContrastTest(unittest.TestCase):
    def test_black_on_white_is_21_to_1(self):
        r = run('#000000', '#FFFFFF')
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn('21.00:1', r.stdout)

    def test_light_label_on_light_panel_fails(self):
        r = run('#C8D2DC', '#AAB4BE')
        self.assertEqual(r.returncode, 1)
        self.assertIn('FAIL', r.stdout)

    def test_large_type_passes_at_three(self):
        # #949494 on white is about 3.0:1: a FAIL for labels, a PASS for display type.
        self.assertEqual(run('#949494', '#FFFFFF').returncode, 1)
        self.assertEqual(run('#949494', '#FFFFFF', '--large').returncode, 0)

    def test_short_hex(self):
        self.assertIn('21.00:1', run('#fff', '#000').stdout)

    def test_samples_from_an_image(self):
        try:
            from PIL import Image
        except ImportError:
            self.skipTest('needs Pillow')
        with tempfile.TemporaryDirectory() as d:
            im = Image.new('RGB', (20, 10), (255, 255, 255))
            for x in range(10):
                for y in range(10):
                    im.putpixel((x, y), (0, 0, 0))
            path = Path(d) / 's.png'
            im.save(path)
            r = run('--image', str(path), '--text', '4,4', '--ground', '15,4')
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn('21.00:1', r.stdout)


if __name__ == '__main__':
    unittest.main()
