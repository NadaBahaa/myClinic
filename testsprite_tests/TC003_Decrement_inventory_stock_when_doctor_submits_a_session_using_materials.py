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
        await modal.get_by_placeholder("Enter service name").fill("E2E Stock Session")
        await modal.locator('input[type="number"]').first.fill("120")

        mat_select = modal.locator("select").first
        await expect(mat_select).to_be_visible()
        await expect(mat_select.locator("option").nth(1)).to_be_attached(timeout=30000)
        await mat_select.select_option(index=1)
        await modal.locator("button.bg-blue-600").click()
        await expect(modal.get_by_text("Net Profit", exact=False)).to_be_visible()

        await modal.locator("form").get_by_role("button", name=re.compile(r"^Add Session$")).click()
        await expect(page.get_by_text("Session added successfully")).to_be_visible()
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()


asyncio.run(run_test())
