"""Regenerate the social preview card at public/og.png.

Run from the project root:  python3 scripts/make_og.py

Poppins is fetched into scripts/fonts on first run. If that is not possible,
the card falls back to whichever sans face the system has.
"""

import os
import urllib.request

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_DIR = os.path.join(ROOT, "scripts", "fonts")
FONT_URL = "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-{}.ttf"
FALLBACKS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans{}.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans{}.ttf",
]

EYEBROW = "R E S E A R C H   P R O P O S A L"
TITLE = "Cutting false alarms in real-time cache side-channel detection"
STANDFIRST = (
    "Roughly 96 percent accurate, yet false alarms remain the open problem. "
    "Can a temporal graph model tell an honest workload from an attacker?"
)
BYLINE = "Ahmed Khan"

W, H = 1200, 630
MARGIN = 84
BG = (17, 17, 19)
FG = (236, 236, 239)
MUTED = (148, 148, 157)
LINE = (43, 43, 48)


def font_path(weight):
    os.makedirs(FONT_DIR, exist_ok=True)
    local = os.path.join(FONT_DIR, f"Poppins-{weight}.ttf")
    if not os.path.exists(local):
        try:
            urllib.request.urlretrieve(FONT_URL.format(weight), local)
        except Exception:
            suffix = "-Bold" if weight == "SemiBold" else ""
            for pattern in FALLBACKS:
                candidate = pattern.format(suffix)
                if os.path.exists(candidate):
                    return candidate
            raise SystemExit("No usable font found. Put Poppins TTFs in scripts/fonts.")
    return local


def main():
    semibold = font_path("SemiBold")
    regular = font_path("Regular")
    image = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(image)

    def wrap(text, font, width):
        lines, current = [], ""
        for word in text.split():
            candidate = (current + " " + word).strip()
            if draw.textlength(candidate, font=font) <= width:
                current = candidate
            else:
                lines.append(current)
                current = word
        if current:
            lines.append(current)
        return lines

    y = 84
    draw.text((MARGIN, y), EYEBROW, font=ImageFont.truetype(regular, 21), fill=MUTED)
    y += 68

    title_font = ImageFont.truetype(semibold, 52)
    for line in wrap(TITLE, title_font, W - 2 * MARGIN):
        draw.text((MARGIN, y), line, font=title_font, fill=FG)
        y += 66

    y += 22
    draw.line([(MARGIN, y), (W - MARGIN, y)], fill=LINE, width=1)
    y += 30

    body_font = ImageFont.truetype(regular, 27)
    for line in wrap(STANDFIRST, body_font, W - 2 * MARGIN):
        draw.text((MARGIN, y), line, font=body_font, fill=MUTED)
        y += 42

    # Sit the byline below the text if a longer title has pushed it down.
    byline_y = max(y + 24, H - MARGIN - 32)
    draw.text((MARGIN, byline_y), BYLINE, font=ImageFont.truetype(regular, 23), fill=MUTED)

    out = os.path.join(ROOT, "public", "og.png")
    image.save(out, optimize=True)
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
