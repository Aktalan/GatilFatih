from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


def _unblend_from_white(channel: int, alpha: int) -> int:
    if alpha <= 0:
        return 0
    a = alpha / 255.0
    v = (channel - (1.0 - a) * 255.0) / a
    return max(0, min(255, int(round(v))))


def remove_light_background(img: Image.Image, white_threshold: int = 238) -> Image.Image:
    rgba = img.convert("RGBA")
    pixels = list(rgba.getdata())
    out = []
    for r, g, b, a in pixels:
        if r >= white_threshold and g >= white_threshold and b >= white_threshold:
            out.append((r, g, b, 0))
        elif a < 255:
            # Decontaminate antialiased edges from white matte to avoid halos on dark backgrounds.
            out.append((_unblend_from_white(r, a), _unblend_from_white(g, a), _unblend_from_white(b, a), a))
        else:
            out.append((r, g, b, a))
    rgba.putdata(out)
    return rgba


def tighten_crop(img: Image.Image, pad: int = 14) -> Image.Image:
    alpha = img.split()[-1]
    bbox = alpha.getbbox()
    if not bbox:
        return img
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(img.width, right + pad)
    bottom = min(img.height, bottom + pad)
    return img.crop((left, top, right, bottom))


def upscale_and_sharpen(img: Image.Image, target_w: int = 1200) -> Image.Image:
    ratio = target_w / img.width
    target_h = int(img.height * ratio)
    up = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    up = ImageEnhance.Contrast(up).enhance(1.08)
    up = ImageEnhance.Sharpness(up).enhance(1.22)
    up = up.filter(ImageFilter.UnsharpMask(radius=1.2, percent=120, threshold=2))
    return up


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    src = root / "assets" / "logo.png"
    out = root / "assets" / "logo-clean.png"
    if not src.exists():
        raise FileNotFoundError(f"Logo not found: {src}")

    img = Image.open(src)
    img = remove_light_background(img, white_threshold=238)
    img = tighten_crop(img, pad=12)
    img = upscale_and_sharpen(img, target_w=1200)
    img.save(out, "PNG")
    print(out)


if __name__ == "__main__":
    main()
