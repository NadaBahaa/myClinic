import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from playwright.async_api import expect

from support import BASE, launch


async def run_test():
    pw = browser = context = None
    try:
        pw, browser, context = await launch()
        page = await context.new_page()
        await page.goto(f"{BASE}/login")
        await page.locator("#email").fill("admin@clinic.com")
        await page.locator("#password").fill("definitely-wrong-password")
        await page.locator("form").get_by_role("button", name="Login").click()

        await expect(page.get_by_test_id("login-error")).to_contain_text("Invalid email or password")
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()


asyncio.run(run_test())
