from playwright.sync_api import sync_playwright

def verify_dialog_a11y():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Navigate to the app (using the base URL from vite config if needed, usually '/')
            page.goto("http://localhost:5173/GraffitiXR-web/")

            # Since the app starts in AR mode but onboarding might not trigger on initial load
            # if useEffect isn't calling setEditorMode or if state logic prevents it.
            # Let's try to trigger it by switching mode.

            # Wait for nav rail
            page.wait_for_selector(".header")

            # Click toggle to expand
            page.click(".header")

            # Click "Modes" host item if needed, but it's likely expanded or visible
            # Wait, AzNavRail shows modes.

            # Click "Overlay" mode
            page.get_by_text("Overlay").click()

            # Wait for the onboarding dialog to appear
            dialog = page.locator('div[role="dialog"]')
            dialog.wait_for(state="visible", timeout=5000)

            # Check for aria-modal
            is_modal = dialog.get_attribute("aria-modal")
            print(f"aria-modal: {is_modal}")

            # Check for aria-labelledby
            labelled_by = dialog.get_attribute("aria-labelledby")
            print(f"aria-labelledby: {labelled_by}")

            if labelled_by:
                # Escape the selector for ID
                import re
                escaped_id = re.sub(r'(:)', r'\\\1', labelled_by)
                title_el = page.locator(f"#{escaped_id}")
                print(f"Title text: {title_el.text_content()}")

            # Check focus (this is hard to check in headless strictly, but we can check activeElement)
            # We need to wait a tick for useEffect to run
            page.wait_for_timeout(500)

            is_focused = page.evaluate("""
                () => {
                    const btn = document.querySelector('.dialog-button');
                    return document.activeElement === btn;
                }
            """)
            print(f"Button focused: {is_focused}")

            # Screenshot
            page.screenshot(path="verification/dialog_a11y.png")

        except Exception as e:
            print(f"Error: {e}")
            # Take a screenshot on error to debug
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_dialog_a11y()
