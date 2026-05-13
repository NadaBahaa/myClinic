import asyncio
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from playwright.async_api import expect

from support import doctor_open_emma_add_session, launch, login


async def run_test():
    pw = browser = context = None
    try:
        pw, browser, context = await launch()
        page = await context.new_page()
        await login(page, "sarah@clinic.com", "doctor123")

        await doctor_open_emma_add_session(page)
        modal = page.locator("div.fixed.inset-0").filter(has_text="Add Session for")
        await modal.get_by_placeholder("Enter service name").fill("E2E Treatment Session")
        await modal.locator('input[type="number"]').first.fill("99")
        await modal.locator("form").get_by_role("button", name=re.compile(r"^Add Session$")).click()

        await expect(page.get_by_text("Session added successfully")).to_be_visible()
        await expect(page.get_by_text("Treatment Sessions", exact=False)).to_be_visible()
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()


asyncio.run(run_test())
