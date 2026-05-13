import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from playwright.async_api import expect

from support import BASE, launch, login


async def run_test():
    pw = browser = context = None
    try:
        pw, browser, context = await launch()
        page = await context.new_page()
        await login(page, "sarah@clinic.com", "doctor123")
        await expect(page.get_by_test_id("doctor-portal")).to_be_visible()

        await page.goto(f"{BASE}/admin")
        await asyncio.sleep(0.5)
        assert "/doctor" in page.url or page.url.rstrip("/").endswith("doctor")
        await expect(page.get_by_test_id("doctor-portal")).to_be_visible()
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()


asyncio.run(run_test())
