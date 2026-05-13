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

        await page.goto(f"{BASE}/doctor")
        await page.get_by_role("button", name="My Schedule").click()
        await expect(page.get_by_text("Today's Appointments", exact=False)).to_be_visible()
        await expect(page.get_by_text("Doctor Portal", exact=False)).to_be_visible()
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()


asyncio.run(run_test())
