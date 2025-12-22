from playwright.sync_api import sync_playwright
import time

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Ensure we are hitting the preview server.
        page.goto("http://localhost:4173")

        # Wait for the rail to appear
        page.wait_for_selector(".az-nav-rail")
        print("Waiting for .az-nav-rail...")

        # Click the menu toggle (header) to expand the menu
        page.click(".az-nav-rail .header")
        time.sleep(1) # Wait for animation

        # Check for Headers
        headers = ["Modes", "Design", "Settings"]
        for h in headers:
            if page.is_visible(f"text={h}"):
                print(f"Found Header '{h}'.")
            else:
                print(f"ERROR: Header '{h}' NOT found.")

        # Check for Items
        items = ["AR Mode", "Overlay", "Mockup", "Trace", "Open", "New", "Save", "Load", "Help", "Light", "Lock"]
        for i in items:
            if page.is_visible(f"text={i}"):
                print(f"Found Item '{i}'.")
            else:
                print(f"ERROR: Item '{i}' NOT found.")

        page.screenshot(path="verification_screenshot.png")
        print("Screenshot taken successfully")

        browser.close()

if __name__ == "__main__":
    verify()
