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
        await login(page, "admin@clinic.com", "admin123")
        await expect(page.get_by_role("heading", name="Admin Dashboard")).to_be_visible()

        await page.get_by_role("button", name="Logout").click()
        await expect(page.get_by_text("Modern Beauty Clinic Management", exact=False)).to_be_visible()

        await page.goto(f"{BASE}/login")
        await expect(page.get_by_text("Login to Your Account", exact=False)).to_be_visible()
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()


asyncio.run(run_test())
