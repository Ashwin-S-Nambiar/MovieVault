from pathlib import Path
import argparse
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("variant", nargs="?", choices=["search", "vault", "universes"])
variant = parser.parse_args().variant
root = Path(__file__).resolve().parent.parent
source = root / "docs" / (f"og-{variant}.html" if variant else "og.html")
output = root / "public" / (f"og/{variant}.jpg" if variant else "og.jpg")

with sync_playwright() as playwright:
    try:
        browser = playwright.chromium.launch(channel="chrome", headless=True)
    except Exception:
        browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(source.as_uri(), wait_until="networkidle")
    page.evaluate("document.fonts.ready")
    page.evaluate("""async () => {
        await Promise.all([...document.images].map(image => image.decode()));
        if ([...document.fonts].some(font => font.status === 'error')) {
            throw new Error('A share-card font failed to load');
        }
    }""")
    if errors:
        raise RuntimeError("\n".join(errors))
    page.screenshot(path=str(output), type="jpeg", quality=92)
    browser.close()
print(f"Rendered {output} (1200 × 630)")
