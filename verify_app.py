from playwright.sync_api import sync_playwright, expect
import re

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:4173")

        # Check if rail is initially collapsed
        rail = page.locator(".az-nav-rail")
        expect(rail).to_be_visible()
        expect(rail).to_have_class(re.compile(r"collapsed"))
        print("Rail is collapsed by default.")

        # Expand
        page.locator(".az-nav-rail .header").click()
        expect(rail).to_have_class(re.compile(r"expanded"))
        print("Rail expanded.")

        # Check Headers
        headers = ["Modes", "Design", "Settings"]
        for h in headers:
            expect(page.get_by_text(h)).to_be_visible()
            print(f"Found Header '{h}'.")

        # Check Items
        items = ["AR Mode", "Overlay", "Mockup", "Trace", "Open", "New", "Save", "Load", "Help", "Light", "Lock"]
        for i in items:
            expect(page.get_by_text(i)).to_be_visible()
            print(f"Found Item '{i}'.")

        page.screenshot(path="verification_screenshot.png")
        print("Screenshot taken successfully")

        browser.close()

if __name__ == "__main__":
    verify()
