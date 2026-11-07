"""Offline tests for the scaffold's real motion blur tools. Remotion is not involved: samples are made here."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

try:
    import numpy as np
    from PIL import Image
except ImportError:
    np = None

MB = Path(__file__).resolve().parents[1] / 'skills/saas-product-demo-video/assets/scaffold/tools/mb'


@unittest.skipIf(np is None, 'needs numpy and Pillow')
class MotionBlurTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)

    def blend(self, samples, *flags):
        """samples: uint8 arrays for one frame, 40 of them at most. Returns the blended frame."""
        sdir = self.root / 's'
        sdir.mkdir(exist_ok=True)
        for i, im in enumerate(samples):
            Image.fromarray(im).save(sdir / f'element-{i:02d}.png')
        man = self.root / 'm.json'
        man.write_text(json.dumps([{'frame': 7, 'first': 0, 'n': len(samples)}]))
        out = self.root / 'out'
        subprocess.run([sys.executable, str(MB / 'blend.py'), str(man), str(sdir), str(out), *flags], check=True, capture_output=True)
        self.assertEqual(sorted(p.name for p in out.iterdir()), ['f00007.png'])
        return np.asarray(Image.open(out / 'f00007.png').convert('RGB'))

    def test_half_covered_pixel_averages_in_linear_light(self):
        black, white = np.zeros((8, 8, 3), np.uint8), np.full((8, 8, 3), 255, np.uint8)
        linear = self.blend([black, white])
        self.assertTrue(((linear >= 187) & (linear <= 189)).all(), linear.ravel()[:6])
        stored = self.blend([black, white], '--gamma')
        self.assertTrue(((stored >= 127) & (stored <= 129)).all(), stored.ravel()[:6])

    def test_pixels_every_sample_agrees_on_stay_byte_exact(self):
        rng = np.random.default_rng(1)
        still = rng.integers(0, 256, (64, 64, 3), dtype=np.uint8)
        moved = still.copy()
        moved[:8] = 255 - moved[:8]
        out = self.blend([still, moved, still, moved])
        self.assertTrue((out[8:] == still[8:]).all())
        self.assertFalse((out[:8] == still[:8]).all())

    def test_one_sample_is_the_frame_itself(self):
        rng = np.random.default_rng(2)
        still = rng.integers(0, 256, (16, 16, 3), dtype=np.uint8)
        self.assertTrue((self.blend([still]) == still).all())

    def test_plan_reads_motion_into_sample_counts(self):
        base = self.root / 'base'
        base.mkdir()
        flat = np.full((90, 160, 3), 128, np.uint8)
        # Frames 3 and 4 hold; frame 5 changes everything.
        for f, im in [(3, flat), (4, flat), (5, 255 - flat // 8)]:
            Image.fromarray(im).save(base / f'f{f:05d}.png')
        out = self.root / 'plan.json'
        subprocess.run([sys.executable, str(MB / 'plan.py'), str(base), str(out)], check=True, capture_output=True)
        self.assertEqual(json.loads(out.read_text()), {'3': 1, '4': 24, '5': 24})


class EncodeTest(unittest.TestCase):
    def test_refuses_a_gap_in_the_frames(self):
        with tempfile.TemporaryDirectory() as tmp:
            for f in (10, 11, 13):
                (Path(tmp) / f'f{f:05d}.png').write_bytes(b'')
            result = subprocess.run(['bash', str(MB / 'encode.sh'), tmp, '-', str(Path(tmp) / 'x.mp4')], text=True, capture_output=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn('missing', result.stderr)

    def test_join_refuses_a_gap_or_an_overlap(self):
        for names, wanted in [(['seg-00000-00009.mp4', 'seg-00012-00020.mp4'], 'start at frame 10'), (['seg-00000-00009.mp4', 'seg-00005-00020.mp4'], 'start at frame 10')]:
            with tempfile.TemporaryDirectory() as tmp:
                for name in names:
                    (Path(tmp) / name).write_bytes(b'')
                result = subprocess.run(['bash', str(MB / 'join.sh'), tmp, '-', str(Path(tmp) / 'x.mp4')], text=True, capture_output=True)
            self.assertEqual(result.returncode, 1)
            self.assertIn(wanted, result.stderr)


if __name__ == '__main__':
    unittest.main()
