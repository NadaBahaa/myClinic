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

        await page.get_by_role("button", name="Users").click()
        await page.get_by_role("button", name="Add User").click()

        name = f"Clinic User {int(time.time())}"
        email = f"clinic.user.{int(time.time())}@test.com"

        shell = page.locator("div.fixed.inset-0").filter(has_text="Add New User")
        await shell.get_by_label("Full Name *").fill(name)
        await shell.get_by_label("Email *").fill(email)
        await shell.locator('input[type="password"]').fill("secret123")
        await shell.locator("label.cursor-pointer").nth(2).click()
        await shell.get_by_role("button", name="Add User").click()

        await expect(page.get_by_text(name)).to_be_visible()
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()


asyncio.run(run_test())
