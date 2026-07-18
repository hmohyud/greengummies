# Builds the hero-plate expression frames (public/marks/spin/) from source art.
#
# The five frames share one pixel-identical reconstructed G so the hero plate
# can swap expressions with zero jitter. The G comes from the layered
# g-rilla-roar-logo.svg trace, whose letter-g path has a head-shaped bite;
# this script rebuilds the missing outline (fitted inner boundary + smoothed
# hook edge), color-corrects the green to the production hires art, then
# composites cleaned expression heads (grid2 cutouts) plus the vector roar.
#
# Requires: python (pillow, numpy, scipy), node with @resvg/resvg-js
# (auto-installed into tools/node_modules on first run).
#
# Usage: python tools/build-plate-frames.py

import json
import os
import re
import subprocess
import sys

import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.interpolate import PchipInterpolator

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS = os.path.join(REPO, 'tools')
OUT_DIR = os.path.join(REPO, 'public', 'marks', 'spin')
CLEAN_DIR = os.path.join(REPO, 'public', 'marks', 'png', 'clean')
TOUCHED_DIR = os.path.join(REPO, 'public', 'marks', 'png', 'touched')
SRC_SVG = os.path.join(REPO, 'public', 'g-rilla-roar-logo.svg')
COMPLETE_SVG = os.path.join(REPO, 'public', 'g-rilla-roar-logo-complete.svg')
HIRES = os.path.join(REPO, 'public', 'marks', 'g-rilla-roar-full-hires.png')

# canvas: crop window in the SVG's 1254-space and export size (matches the
# old g-rilla-roar-full.png so the plate's on-screen geometry is unchanged)
CROP = (134, 116, 1112, 1118)
EXPORT = (523, 536)

# speed ladder: name -> (head height as fraction of the roar head, centre x/y
# in 1254-space). The roar frame uses the SVG gorilla layers at native coords.
HEADS = {
    # scale, centre x, centre y — scaled about the centre so a size change
    # never shifts the head's anchor
    'pleased': (0.924, 552, 612),
    'focus':   (0.87, 552, 608),
    'strain':  (0.91, 550, 608),
    'scowl':   (0.95, 548, 606),
    'laugh':   (0.97, 549, 602),
}
ROAR_H = 759.0  # roar head alpha height in 1254-space
FRAMES = ['pleased', 'focus', 'strain', 'scowl', 'roar', 'laugh']
# heads published to clean/ for the speck lab but not (yet) built as frames
CANDIDATES = []


def ensure_resvg():
    if os.path.isdir(os.path.join(TOOLS, 'node_modules', '@resvg')):
        return
    subprocess.run(['npm', 'install', '--no-audit', '--no-fund', '--prefix', TOOLS,
                    '@resvg/resvg-js'], check=True, shell=(os.name == 'nt'))


def render_svg(svg_text, width):
    src = os.path.join(TOOLS, '_render_in.svg')
    dst = os.path.join(TOOLS, '_render_out.png')
    with open(src, 'w', encoding='utf-8') as f:
        f.write(svg_text)
    js = (
        "const{Resvg}=require('@resvg/resvg-js');const fs=require('fs');"
        f"const s=fs.readFileSync({json.dumps(src)},'utf8');"
        f"fs.writeFileSync({json.dumps(dst)},new Resvg(s,{{fitTo:{{mode:'width',value:{width}}}}}).render().asPng());"
    )
    subprocess.run(['node', '-e', js], check=True, cwd=TOOLS, shell=(os.name == 'nt'))
    im = Image.open(dst).convert('RGBA')
    os.remove(src)
    os.remove(dst)
    return im


def strip_group(svg, gid):
    a = svg.index('<g id="' + gid + '"')
    b = svg.index('</g>', a)
    return svg[:a] + svg[b + 4:]


def complete_g_path(svg):
    """Rebuild the letter-g outline: the traced path follows the gorilla bite;
    replace the damaged stretch with the surviving hook + a fitted inner arc."""
    i = svg.index('<g id="letter-g"')
    j = svg.index('</g>', i)
    d_attr = re.search(r'(?<![a-zA-Z])d="([^"]+)"', svg[i:j]).group(1)
    nums = re.findall(r'-?\d+\.?\d*', d_attr)
    pts = np.array([[float(nums[k]), float(nums[k + 1])] for k in range(0, len(nums) - 1, 2)])

    # outer boundary, bar and stem survive untouched: indices 209..226 + 0..36
    outer = [tuple(pts[k]) for k in list(range(209, 227)) + list(range(0, 37))]

    # bar: the top edge continues left until the head silhouette bounds it
    # (per the source art the bar has no visible terminus — the face meets
    # it). x=710 sits >=30px under every frame's head across the bar band,
    # so the tip edge is never exposed. Then the hook step + stem inner edge.
    hook = [(710.0, 575.0), (710.0, 731.0)]
    hook += [tuple(pts[k]) for k in range(47, 50)]  # (918,731) (920,734) (919,859)

    # inner boundary: periodic-pchip radius over trusted surviving points
    trusted = ([tuple(pts[49])] + [tuple(pts[k]) for k in range(50, 56)]
               + [(481, 850), (470, 829), (793, 498)])
    cx, cy = 640.0, 700.0
    th = np.array([np.arctan2(p[1] - cy, p[0] - cx) for p in trusted])
    rr = np.array([np.hypot(p[0] - cx, p[1] - cy) for p in trusted])
    o = np.argsort(th)
    th, rr = th[o], rr[o]
    f = PchipInterpolator(np.concatenate([th - 2 * np.pi, th, th + 2 * np.pi]),
                          np.concatenate([rr, rr, rr]))
    a0 = np.arctan2(pts[49][1] - cy, pts[49][0] - cx)
    a1 = np.arctan2(498 - cy, 793 - cx)
    if a1 <= a0:
        a1 += 2 * np.pi
    A = np.linspace(a0, a1, 160)
    R = f(((A + np.pi) % (2 * np.pi)) - np.pi)
    arc = np.c_[cx + R * np.cos(A), cy + R * np.sin(A)]
    d0 = pts[49] - arc[0]
    d1 = np.array([793, 498]) - arc[-1]
    tt = np.linspace(0, 1, len(arc))[:, None]
    arc = arc + (1 - tt) * d0 + tt * d1

    poly = outer + hook + [tuple(p) for p in arc]
    new_d = 'M ' + ' L '.join(f'{x:.1f} {y:.1f}' for x, y in poly) + ' Z'
    return svg[:i] + svg[i:j].replace(d_attr, new_d) + svg[j:], d_attr


def _gfamily(a):
    r, g, b = a[:, :, 0].astype(int), a[:, :, 1].astype(int), a[:, :, 2].astype(int)
    return (a[:, :, 3] > 200) & (g > r + 20) & (g > b + 20) & (g > 60)


def register_prod(base_arr):
    """Fit scale+offset mapping the production hires art into base 1254-space
    by aligning the two Gs (bbox seed, mask-overlap refinement)."""
    prod = np.array(Image.open(HIRES).convert('RGBA'))
    pg, bg = _gfamily(prod), _gfamily(base_arr)

    def bbox(m):
        ys, xs = np.where(m)
        return xs.min(), xs.max(), ys.min(), ys.max()

    px0, px1, py0, py1 = bbox(pg)
    bx0, bx1, by0, by1 = bbox(bg)
    s0 = ((bx1 - bx0) / (px1 - px0) + (by1 - by0) / (py1 - py0)) / 2
    small_b = ndimage.zoom(bg.astype(float), 0.25, order=1) > 0.5
    best = (0, s0, bx0 - px0 * s0, by0 - py0 * s0)
    for s in np.linspace(s0 * 0.985, s0 * 1.015, 7):
        for dx in np.arange(bx0 - px0 * s - 4, bx0 - px0 * s + 4.1, 2):
            for dy in np.arange(by0 - py0 * s - 4, by0 - py0 * s + 4.1, 2):
                ys, xs = np.where(pg[::8, ::8])
                tx = ((xs * 8 * s + dx) * 0.25).astype(int)
                ty = ((ys * 8 * s + dy) * 0.25).astype(int)
                ok = (tx >= 0) & (tx < small_b.shape[1]) & (ty >= 0) & (ty < small_b.shape[0])
                score = small_b[ty[ok], tx[ok]].mean()
                if score > best[0]:
                    best = (score, s, dx, dy)
    score, s, dx, dy = best
    print(f'production art registration: scale {s:.4f}, offset ({dx:.0f},{dy:.0f}), G overlap {score:.1%}')
    return prod, s, dx, dy


def paint_base_green(base_arr, prod, s, dx, dy):
    """Recolor the base G with the production art's green: fit its shading as
    a smooth quadratic field over registered coordinates and evaluate that
    field on the base G. Kills the SVG trace's diagonal gradient entirely."""
    a = base_arr.astype(float)
    pg = _gfamily(prod)
    ys, xs = np.where(pg)
    sub = np.random.default_rng(3).choice(len(ys), min(20000, len(ys)), replace=False)
    ys, xs = ys[sub], xs[sub]
    # production sample coords in base space, normalized to the base G bbox
    bys, bxs = np.where(_gfamily(base_arr))
    nx0, nx1, ny0, ny1 = bxs.min(), bxs.max(), bys.min(), bys.max()
    u = (xs * s + dx - nx0) / (nx1 - nx0)
    v = (ys * s + dy - ny0) / (ny1 - ny0)
    A = np.c_[np.ones(len(u)), u, v, u * u, u * v, v * v]
    coefs = [np.linalg.lstsq(A, prod[ys, xs, c].astype(float), rcond=None)[0] for c in range(3)]

    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    m = np.clip((g - np.maximum(r, b) - 5) / 25.0, 0, 1) * (a[:, :, 3] > 0)
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    uu = (xx - nx0) / (nx1 - nx0)
    vv = (yy - ny0) / (ny1 - ny0)
    AA = np.stack([np.ones_like(uu), uu, vv, uu * uu, uu * vv, vv * vv], axis=-1)
    for c in range(3):
        field = AA @ coefs[c]
        a[:, :, c] = a[:, :, c] * (1 - m) + field * m
    return np.clip(a, 0, 255).astype(np.uint8)


def extract_roar_head(base_arr, prod, s, dx, dy):
    """Cut the hand-touched roar head out of the production hires art and
    place it in base 1254-space with the registered transform. Keeping the
    production head (not the SVG trace) preserves the plate's current look."""
    # head = opaque, not green; largest component; push colors past the rim so
    # green-blended edge pixels do not fringe, then feather the alpha
    hm = (prod[:, :, 3] > 40) & ~ndimage.binary_dilation(_gfamily(prod), iterations=1)
    lab, n = ndimage.label(hm)
    if n > 1:
        sizes = ndimage.sum(hm, lab, range(1, n + 1))
        hm = lab == (1 + np.argmax(sizes))
    dist, (iy, ix) = ndimage.distance_transform_edt(~hm, return_indices=True)
    rgb = prod[:, :, :3].copy()
    rgb[~hm] = rgb[iy[~hm], ix[~hm]]
    alpha = np.minimum(prod[:, :, 3], np.clip((ndimage.gaussian_filter(hm.astype(float), 0.7) - 0.2) / 0.55, 0, 1) * 255)
    head = Image.fromarray(np.dstack([rgb, alpha.astype(np.uint8)]))

    W = round(head.width * s)
    layer = Image.new('RGBA', (base_arr.shape[1], base_arr.shape[0]))
    layer.alpha_composite(head.resize((W, round(head.height * s)), Image.LANCZOS),
                          (round(dx), round(dy)))
    return layer


def crisp_upscale(im):
    """2x upscale for the small grid-1 heads: LANCZOS, then re-crisp the
    flat two-tone art — silhouette re-antialiased, interior line edges pushed
    back toward black/white so the enlargement doesn't read soft."""
    up = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
    a = np.array(up).astype(float)
    m = a[:, :, 3] > 128
    alpha = np.clip((ndimage.gaussian_filter(m.astype(float), 0.7) - 0.25) / 0.5, 0, 1) * 255
    lum = a[:, :, :3].mean(axis=2, keepdims=True)
    contrast = np.clip((lum - 128) * 1.8 + 128, 0, 255)
    blend = np.clip(np.abs(lum - 128) / 96, 0, 1)  # push mid-grays hardest
    a[:, :, :3] = a[:, :, :3] + (contrast - lum) * (1 - blend) * 0.85
    a[:, :, 3] = alpha
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def clean_head(path):
    """Strip chroma-key/shadow residue off a grid2 head cutout and re-antialias."""
    a = np.array(Image.open(path).convert('RGBA')).astype(float)
    r, g, b, al = a[:, :, 0], a[:, :, 1], a[:, :, 2], a[:, :, 3]
    al = np.where((g > r + 12) & (g > b + 12), 0, al)
    m = al > 100
    lab, n = ndimage.label(m)
    if n > 1:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        m = lab == (1 + np.argmax(sizes))
    dist, (iy, ix) = ndimage.distance_transform_edt(~m, return_indices=True)
    rgb = a[:, :, :3].copy()
    rgb[~m] = rgb[iy[~m], ix[~m]]
    alpha = np.clip((ndimage.gaussian_filter(m.astype(float), 0.8) - 0.25) / 0.5, 0, 1) * 255
    return Image.fromarray(np.dstack([rgb, alpha]).astype(np.uint8))


def main():
    ensure_resvg()
    os.makedirs(OUT_DIR, exist_ok=True)
    svg = open(SRC_SVG, encoding='utf-8').read()

    fixed_svg, _ = complete_g_path(svg)
    with open(COMPLETE_SVG, 'w', encoding='utf-8') as f:
        f.write(fixed_svg)

    base_svg = strip_group(strip_group(strip_group(fixed_svg, 'gorilla-white'), 'gorilla-details'), 'background')
    base_arr = np.array(render_svg(base_svg, 1254))
    prod, s, dx, dy = register_prod(base_arr)
    base_arr = paint_base_green(base_arr, prod, s, dx, dy)
    base = Image.fromarray(base_arr)
    ape = extract_roar_head(base_arr, prod, s, dx, dy)

    exports = []
    os.makedirs(CLEAN_DIR, exist_ok=True)
    for name in CANDIDATES:
        touched = os.path.join(TOUCHED_DIR, f'g-rilla-{name}-head-touched.png')
        h = (Image.open(touched).convert('RGBA') if os.path.exists(touched)
             else clean_head(os.path.join(REPO, 'public', 'marks', 'png', f'g-rilla-{name}-head.png')))
        h.save(os.path.join(CLEAN_DIR, f'g-rilla-{name}-head-clean.png'))
    for name in FRAMES:
        fr = base.copy()
        if name == 'roar':
            fr.alpha_composite(ape)
        else:
            # a hand-touched head (made with head-touchup.html) wins over auto-clean
            touched = os.path.join(TOUCHED_DIR, f'g-rilla-{name}-head-touched.png')
            if os.path.exists(touched):
                h = Image.open(touched).convert('RGBA')
            else:
                h = clean_head(os.path.join(REPO, 'public', 'marks', 'png', f'g-rilla-{name}-head.png'))
            # publish the auto-cleaned head for the touchup tool to load
            h.save(os.path.join(CLEAN_DIR, f'g-rilla-{name}-head-clean.png'))
            if h.height < 200:
                h = crisp_upscale(h)
            t, cx, cy = HEADS[name]
            s = t * ROAR_H / h.height
            hs = h.resize((round(h.width * s), round(t * ROAR_H)), Image.LANCZOS)
            fr.alpha_composite(hs, (round(cx - hs.width / 2), round(cy - hs.height / 2)))
        exports.append(fr.crop(CROP).resize(EXPORT, Image.LANCZOS))

    # quantize against ONE shared palette so base pixels stay bit-identical
    # across frames (per-frame palettes would add sub-threshold G shimmer)
    stack = Image.new('RGBA', (EXPORT[0], EXPORT[1] * len(exports)))
    for k, im in enumerate(exports):
        stack.paste(im, (0, k * EXPORT[1]))
    qstack = stack.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    for i, (name, im) in enumerate(zip(FRAMES, exports)):
        q = qstack.crop((0, i * EXPORT[1], EXPORT[0], (i + 1) * EXPORT[1]))
        q.save(os.path.join(OUT_DIR, f'g-rilla-spin-{i}-{name}.png'), optimize=True)
        print('wrote', f'g-rilla-spin-{i}-{name}.png')

    # registration check: every pixel outside the head zone must be identical
    frames = [np.array(Image.open(os.path.join(OUT_DIR, f'g-rilla-spin-{i}-{n}.png')).convert('RGBA')).astype(int)
              for i, n in enumerate(FRAMES)]
    ref = frames[0]
    changed = np.zeros(ref.shape[:2], bool)
    for fr in frames[1:]:
        changed |= np.abs(fr - ref).sum(axis=2) > 0
    ys, xs = np.where(changed)
    frac_outside = changed.sum() / changed.size
    print(f'head-change zone: x {xs.min()}-{xs.max()}, y {ys.min()}-{ys.max()} '
          f'({changed.sum()} px, {frac_outside:.1%} of frame); every other pixel is bit-identical')


if __name__ == '__main__':
    sys.exit(main())
