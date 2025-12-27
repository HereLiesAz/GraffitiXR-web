from playwright.sync_api import sync_playwright

def verify_accessibility_attributes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173/GraffitiXR-web/")

        # 1. Verify AzNavRail Header accessibility
        header = page.locator(".az-nav-rail .header")
        role = header.get_attribute("role")
        tabindex = header.get_attribute("tabindex")
        aria_label = header.get_attribute("aria-label")

        print(f"Header role: {role}")
        print(f"Header tabindex: {tabindex}")
        print(f"Header aria-label: {aria_label}")

        if role != "button":
            print("ERROR: Header missing role='button'")
        if tabindex != "0":
            print("ERROR: Header missing tabindex='0'")
        if aria_label != "Toggle navigation":
            print("ERROR: Header missing aria-label='Toggle navigation'")

        # Click to expand to see menu items
        header.click()

        # Wait for animation or state update
        page.wait_for_timeout(1000)

        # 2. Verify Menu Items are Buttons
        # The selector might need to be specific if they are dynamically loaded
        try:
            page.wait_for_selector(".menu-item", timeout=5000)
            menu_items = page.locator(".menu-item").all()
            print(f"Found {len(menu_items)} menu items")

            for i, item in enumerate(menu_items):
                tag_name = item.evaluate("el => el.tagName")
                print(f"Menu item {i} tag: {tag_name}")
                if tag_name.lower() != "button":
                    print(f"ERROR: Menu item {i} is not a button")
        except Exception as e:
            print(f"Could not find menu items: {e}")
            # Dump page content to debug
            # print(page.content())

        # 3. Take screenshot
        page.screenshot(path="verification_accessibility.png")
        browser.close()

if __name__ == "__main__":
    verify_accessibility_attributes()
