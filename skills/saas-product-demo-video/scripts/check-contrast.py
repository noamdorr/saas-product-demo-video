#!/usr/bin/env python3
"""check-contrast.py - measure the contrast of text against what it sits on.

Usage:
  check-contrast.py '#FFFFFF' '#767676'            two colors: text, then ground
  check-contrast.py --image still.png --text 812,440 --ground 800,470
                                                   sample both from a rendered still
  check-contrast.py ... --large                    display type (24 px and up): 3:1 passes

Prints the WCAG 2 contrast ratio and PASS or FAIL against 4.5:1 for labels and
body text, 3:1 with --large. Exit status 1 on FAIL, so a check can run in a loop
over a film's text-on-color pairs.

Sample the text color from the middle of a stroke, not its anti-aliased edge,
and the ground from a clean patch beside it. A color you read off a still beats
the hex in the theme: a tint, an opacity or a blend mode changes what lands.
"""
import argparse
import sys


def parse_hex(s):
    s = s.strip().lstrip('#')
    if len(s) == 3:
        s = ''.join(c * 2 for c in s)
    if len(s) != 6:
        raise ValueError(f'not a hex color: {s!r}')
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def luminance(rgb):
    def lin(c):
        c = c / 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a, b):
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def sample(image, xy):
    from PIL import Image  # only needed for --image
    x, y = (int(v) for v in xy.split(','))
    im = Image.open(image).convert('RGB')
    # A 3x3 median steadies a sample against dither and anti-aliasing.
    px = sorted(im.getpixel((min(max(x + dx, 0), im.width - 1), min(max(y + dy, 0), im.height - 1)))
                for dx in (-1, 0, 1) for dy in (-1, 0, 1))
    return px[4]


def main(argv=None):
    p = argparse.ArgumentParser(description='WCAG contrast of text against its ground.')
    p.add_argument('colors', nargs='*', help='text color, then ground color, as hex')
    p.add_argument('--image', help='a rendered still to sample from')
    p.add_argument('--text', help='x,y of a pixel inside a text stroke')
    p.add_argument('--ground', help='x,y of a pixel of the ground beside it')
    p.add_argument('--large', action='store_true', help='display type: pass at 3:1')
    a = p.parse_args(argv)

    if a.image:
        if not (a.text and a.ground):
            p.error('--image needs --text and --ground')
        text, ground = sample(a.image, a.text), sample(a.image, a.ground)
    elif len(a.colors) == 2:
        text, ground = parse_hex(a.colors[0]), parse_hex(a.colors[1])
    else:
        p.error('give two hex colors, or --image with --text and --ground')

    r = ratio(text, ground)
    need = 3.0 if a.large else 4.5
    verdict = 'PASS' if r >= need else 'FAIL'
    hexs = lambda c: '#%02X%02X%02X' % c
    print(f'{hexs(text)} on {hexs(ground)}: {r:.2f}:1  {verdict} (needs {need}:1)')
    return 0 if r >= need else 1


if __name__ == '__main__':
    sys.exit(main())
