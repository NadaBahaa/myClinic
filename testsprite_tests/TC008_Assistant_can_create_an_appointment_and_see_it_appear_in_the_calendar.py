import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from playwright.async_api import expect

from support import launch, login


async def run_test():
    pw = browser = context = None
    try:
        pw, browser, context = await launch()
        page = await context.new_page()
        await login(page, "assistant@clinic.com", "assistant123")
        assert "/assistant" in page.url

        await page.get_by_role("button", name="New Appointment").click()
        await expect(page.get_by_role("heading", name="New Appointment")).to_be_visible()
        await page.get_by_role("button", name="Cancel").click()

        await page.locator("aside").get_by_role("button", name="Calendar").click()
        await expect(page.locator("aside").get_by_role("button", name="Calendar")).to_be_visible()
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()


asyncio.run(run_test())
