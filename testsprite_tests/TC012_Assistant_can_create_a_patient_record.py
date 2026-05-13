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
        await login(page, "assistant@clinic.com", "assistant123")

        await page.get_by_role("button", name="All Patients").click()
        await page.get_by_role("button", name="Add Patient").click()

        label = f"Test Patient {int(time.time())}"
        email = f"e2e.{int(time.time())}@patient.test"

        shell = page.locator("div.fixed.inset-0").filter(has_text="Add New Patient")
        await shell.get_by_label("Full Name *").fill(label)
        await shell.get_by_label("Date of Birth *").fill("1992-06-15")
        await shell.get_by_label("Email *").fill(email)
        await shell.get_by_label("Phone *").fill("5559876543")
        await shell.get_by_role("button", name="Add Patient").click()

        await expect(page.get_by_text(label)).to_be_visible()
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()


asyncio.run(run_test())
