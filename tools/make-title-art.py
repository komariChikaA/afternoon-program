"""Photographic title plate and OFL type subset. References are not game assets."""
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
from fontTools import subset
import numpy as np
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/generated/ui'
CACHE = ROOT / 'output/references'
OUT.mkdir(parents=True, exist_ok=True)
CACHE.mkdir(parents=True, exist_ok=True)
W, H = 1920, 1080
paper = Image.new('RGBA', (W, H), '#f7f4ee')

def pale_photo(name, size, pos, opacity, angle=0):
    im = Image.open(ROOT / name).convert('RGBA')
    alpha = im.getchannel('A')
    grey = ImageOps.grayscale(im)
    toned = ImageOps.colorize(grey, '#655956', '#faf6ee').convert('RGBA')
    toned.putalpha(alpha)
    toned.thumbnail(size, Image.Resampling.LANCZOS)
    if angle:
        toned = toned.rotate(angle, Image.Resampling.BICUBIC, expand=True)
    toned.putalpha(toned.getchannel('A').point(lambda x: round(x * opacity)))
    paper.alpha_composite(toned, pos)

# Empty clothes and a silent screen: use the same real objects as the ending.
pale_photo('assets/generated/cg/shirt-cutout.png', (500, 640), (430, -74), .38, -13)
pale_photo('assets/generated/cg/scarf-cutout.png', (590, 570), (1090, -75), .25, 17)
pale_photo('assets/generated/tv/cabinet.png', (820, 580), (550, 20), .80)

# Photographic highlights dissolve into paper; the logo and navigation stay HTML.
a = np.asarray(paper.convert('RGB')).astype(np.float32)
yy, xx = np.indices((H, W))
fade = np.clip((yy - 355) / 240, 0, 1)[..., None]
edge = np.clip((np.abs(xx - W / 2) - 610) / 260, 0, 1)[..., None]
fade = np.maximum(fade, edge)
base = np.array([247, 244, 238], dtype=np.float32)
a = a * (1 - fade) + base * fade
rng = np.random.default_rng(1432)
a += rng.normal(0, .65, (H, W, 1))
Image.fromarray(np.clip(a, 0, 255).astype('uint8')).save(OUT / 'title-plate.jpg', quality=93)

font_url = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf'
for file, url in [('NotoSerifSC.ttf', font_url), ('OFL.txt', 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/OFL.txt')]:
    if not (CACHE / file).exists():
        urllib.request.urlretrieve(url, CACHE / file)
text = ''.join(p.read_text(encoding='utf-8') for pattern in ['story/*.json', 'game/*.js', 'app.html'] for p in ROOT.glob(pattern))
options = subset.Options()
options.flavor = 'woff'
font = subset.load_font(str(CACHE / 'NotoSerifSC.ttf'), options)
worker = subset.Subsetter(options=options)
worker.populate(text=text + ''.join(chr(i) for i in range(32, 127)))
worker.subset(font)
subset.save_font(font, str(OUT / 'reading-serif.woff'), options)
(OUT / 'FONT-OFL.txt').write_bytes((CACHE / 'OFL.txt').read_bytes())
print('Title photograph and local variable serif subset generated')

icons = {
    'history': '<path d="M5 5h14v14H5zM8 9h8M8 12h8M8 15h5"/>',
    'save': '<path d="M5 5h14v14H5zM8 5v6h8V5M8 19v-5h8v5"/>',
    'load': '<path d="M4 8h6l2 2h8l-2 9H4zM4 8V5h7l2 3"/>',
    'auto': '<path d="M9 5l10 7-10 7zM4 5v14"/>',
    'skip': '<path d="M3 6l8 6-8 6zM11 6l8 6-8 6zM21 6v12"/>',
    'settings': '<path d="M5 4v16M12 4v16M19 4v16M2 8h6M9 15h6M16 9h6"/>',
    'title': '<path d="M4 5h16v14H4zM7 8h10M12 8v8"/>',
}
for name, paths in icons.items():
    (OUT / (name + '.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round">{paths}</svg>', encoding='utf-8')
