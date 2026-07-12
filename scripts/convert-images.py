#!/usr/bin/env python3
"""
Extract the visitor photos referenced by the spreadsheet from the ZIP and
convert them from HEIC to web-friendly JPG, named by artwork ID.

Input : scripts/artworks.raw.json  (imageRef -> "Modern Art LEVEL 4/<Artist>/IMG_XXXX.jpg")
Zip   : the "Modern Art LEVEL 4.zip" (HEIC files, folders may have trailing spaces)
Output: public/artworks/<ID>.jpg   (e.g. public/artworks/A001.jpg)

Also writes scripts/image-map.json : { id -> { localImage, sourcePhoto, converted } }

Requires macOS `sips` (built in) for HEIC->JPG.
"""
import json, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE)
RAW = os.path.join(HERE, 'artworks.raw.json')
ZIP = os.environ.get(
    'ART_ZIP',
    '/Users/jacobli/Downloads/Modern Art LEVEL 4.zip',
)
OUT_DIR = os.path.join(APP, 'public', 'artworks')
MAP_OUT = os.path.join(HERE, 'image-map.json')
MAX_DIM = 1600  # px, longest side
ZIP_ROOT = 'Modern Art LEVEL 4'


def zip_entries():
    out = subprocess.run(['unzip', '-Z1', ZIP], capture_output=True, text=True).stdout
    return [l for l in out.splitlines()
            if l.endswith('.HEIC') and not l.startswith('__MACOSX')]


def norm(s):
    return re.sub(r'\s+', ' ', s).strip().lower()


def build_index(entries):
    """Map (artist_folder_normalized, img_basename) -> real zip path."""
    idx = {}
    for e in entries:
        # e = 'Modern Art LEVEL 4/<Artist folder>/IMG_XXXX.HEIC'
        rel = e[len(ZIP_ROOT) + 1:] if e.startswith(ZIP_ROOT + '/') else e
        parts = rel.split('/')
        if len(parts) < 2:
            continue
        artist_folder = parts[0]
        base = os.path.splitext(parts[-1])[0]
        idx[(norm(artist_folder), base.upper())] = e
    return idx


def main():
    recs = json.load(open(RAW))
    entries = zip_entries()
    idx = build_index(entries)
    os.makedirs(OUT_DIR, exist_ok=True)

    image_map = {}
    ok = 0
    misses = []

    with tempfile.TemporaryDirectory() as tmp:
        for r in recs:
            aid = r['id']
            ref = r.get('imageRef') or ''
            m = re.search(re.escape(ZIP_ROOT) + r'/(.+)', ref)
            if not m:
                misses.append((aid, 'no path in imageRef'))
                continue
            relpath = m.group(1)                      # '<Artist>/IMG_XXXX.jpg'
            rel_parts = relpath.split('/')
            artist_folder = rel_parts[0]
            base = os.path.splitext(rel_parts[-1])[0]  # IMG_XXXX
            key = (norm(artist_folder), base.upper())
            zip_path = idx.get(key)
            if not zip_path:
                # fall back: match by basename alone if unique
                cands = [v for (a, b), v in idx.items() if b == base.upper()]
                zip_path = cands[0] if len(cands) == 1 else None
            if not zip_path:
                misses.append((aid, f'no HEIC for {relpath}'))
                continue

            # extract that single entry
            subprocess.run(['unzip', '-o', '-j', ZIP, zip_path, '-d', tmp],
                           capture_output=True, text=True)
            heic = os.path.join(tmp, os.path.basename(zip_path))
            if not os.path.exists(heic):
                misses.append((aid, f'extract failed {zip_path}'))
                continue

            out_jpg = os.path.join(OUT_DIR, f'{aid}.jpg')
            res = subprocess.run(
                ['sips', '-s', 'format', 'jpeg', '-Z', str(MAX_DIM),
                 heic, '--out', out_jpg],
                capture_output=True, text=True)
            if res.returncode != 0 or not os.path.exists(out_jpg):
                misses.append((aid, f'sips failed: {res.stderr.strip()[:80]}'))
                continue

            os.remove(heic)
            image_map[aid] = {
                'localImage': f'/artworks/{aid}.jpg',
                'sourcePhoto': f'{ZIP_ROOT}/{relpath}',
                'converted': True,
            }
            ok += 1

    json.dump(image_map, open(MAP_OUT, 'w'), ensure_ascii=False, indent=1)
    print(f'Converted {ok}/{len(recs)} images -> {OUT_DIR}')
    if misses:
        print(f'MISSES ({len(misses)}):')
        for aid, why in misses[:30]:
            print(f'  {aid}: {why}')
        sys.exit(1)


if __name__ == '__main__':
    main()
