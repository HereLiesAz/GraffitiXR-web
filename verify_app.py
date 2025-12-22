from playwright.sync_api import sync_playwright
import time

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Ensure we are hitting the preview server. Port 4173 is standard for `npm run preview`
        page.goto("http://localhost:4173")

        # Wait for the rail to appear
        page.wait_for_selector(".az-nav-rail")
        print("Waiting for .az-nav-rail...")

        # Click the menu toggle (header) to expand the menu
        page.click(".az-nav-rail .header")
        time.sleep(1) # Wait for animation

        # Check if "Import Image" text exists in the menu (it was added to navItems)
        # It's an item in the menu now.
        if page.is_visible("text=Import Image"):
            print("Found 'Import Image' menu item.")
        else:
            print("ERROR: 'Import Image' menu item NOT found.")

        if page.is_visible("text=Undo"):
             print("Found 'Undo' menu item.")

        if page.is_visible("text=Redo"):
             print("Found 'Redo' menu item.")

        if page.is_visible("text=Save Project"):
             print("Found 'Save Project' menu item.")

        if page.is_visible("text=Load Project"):
             print("Found 'Load Project' menu item.")

        page.screenshot(path="verification_screenshot.png")
        print("Screenshot taken successfully")

        browser.close()

if __name__ == "__main__":
    verify()
