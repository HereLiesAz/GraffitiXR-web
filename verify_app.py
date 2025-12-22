from playwright.sync_api import sync_playwright, expect

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Ensure we are hitting the preview server.
        page.goto("http://localhost:4173")

        # Wait for the rail to appear
        expect(page.locator(".az-nav-rail")).to_be_visible()
        print("Found .az-nav-rail")

        # Click the menu toggle (header) to expand the menu
        page.locator(".az-nav-rail .header").click()

        # Wait for menu to expand by checking for an item that only appears when expanded
        # "Modes" header is a good candidate
        expect(page.get_by_text("Modes")).to_be_visible()
        print("Menu expanded.")

        # Check for Headers
        headers = ["Modes", "Design", "Settings"]
        for h in headers:
            expect(page.get_by_text(h)).to_be_visible()
            print(f"Found Header '{h}'.")

        # Check for Items
        items = ["AR Mode", "Overlay", "Mockup", "Trace", "Open", "New", "Save", "Load", "Help", "Light", "Lock"]
        for i in items:
            expect(page.get_by_text(i)).to_be_visible()
            print(f"Found Item '{i}'.")

        page.screenshot(path="verification_screenshot.png")
        print("Screenshot taken successfully")

        browser.close()

if __name__ == "__main__":
    verify()
