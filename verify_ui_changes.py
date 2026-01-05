from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app (using the default Vite port)
        page.goto("http://localhost:5173/GraffitiXR-web/")

        # Wait for the rail to load
        page.wait_for_selector(".az-nav-rail")

        # 1. Verify "Help" button in the rail (relocated)
        # It might be in the collapsed rail, so it might not have text visible if it is icon-only?
        # But AzNavRail usually shows icons + text in expanded, or just icons in collapsed.
        # Let's expand the rail first by clicking the header.
        page.click(".az-nav-rail .header")
        page.wait_for_timeout(500) # Animation

        help_btn = page.get_by_text("Help")
        if help_btn.count() > 0:
            print("Help button found.")
        else:
            print("Help button NOT found.")

        # 2. Verify "Griding" rename (Host item)
        # We need to switch to AR mode first to see the Grid host
        # Find "AR Mode" or "Modes" host first.
        # "Modes" is a host.
        modes_host = page.get_by_text("Modes")
        if modes_host.count() > 0:
             # It might be already expanded or not.
             # Clicking it might toggle it? No, host items are just headers usually or toggle children.
             # In AzNavRail code: Host Item renders children if expanded.
             pass

        # "AR Mode" is a child of "Modes".
        # Click "AR Mode"
        page.get_by_text("AR Mode").click()

        # Wait for potential lazy loading or state update
        page.wait_for_timeout(1000)

        # Check for "Griding" text
        griding_host = page.get_by_text("Griding")
        if griding_host.count() > 0:
            print("Griding host found.")
        else:
            print("Griding host NOT found. Checking for 'Grid'...")
            grid_host = page.get_by_text("Grid")
            if grid_host.count() > 0:
                 print("Found 'Grid' instead (FAIL).")
            else:
                 print("Neither found.")

        # Take a screenshot
        page.screenshot(path="verification_screenshot.png")
        print("Screenshot saved to verification_screenshot.png")

        browser.close()

if __name__ == "__main__":
    verify_changes()
