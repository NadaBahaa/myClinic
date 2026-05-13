import asyncio
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from playwright.async_api import expect

from support import launch, login


async def run_test():
    pw = browser = context = None
    try:
        pw, browser, context = await launch()
        page = await context.new_page()
        await login(page, "admin@clinic.com", "admin123")

        await page.get_by_role("button", name="Materials & Tools").click()
        await page.get_by_role("button", name="Add Item").click()

        name = f"E2E Stock Item {int(time.time())}"
        modal = page.locator("div.fixed.inset-0").filter(has_text="Add Material")
        await modal.get_by_placeholder("Enter name").fill(name)
        await modal.locator('input[type="number"]').first.fill("12.50")
        await modal.locator("form").get_by_role("button", name="Add").click()

        await expect(page.get_by_text(name)).to_be_visible()
        await expect(page.get_by_text("items in inventory", exact=False)).to_be_visible()
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()


asyncio.run(run_test())
