#!/usr/bin/env python3
"""
Open AgentChat platform and take a screenshot to see current state
"""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=False, slow_mo=100)
        context = await browser.new_context(viewport={'width': 1400, 'height': 900})
        page = await context.new_page()
        
        print("🌐 Opening AgentChat platform...")
        
        # Navigate to the platform
        await page.goto('https://agentchat-iota.vercel.app', wait_until='networkidle')
        
        # Wait a moment for everything to load
        await asyncio.sleep(3)
        
        # Take a screenshot
        await page.screenshot(path='/Users/yoshikondo/agentchat/platform_screenshot.png', full_page=True)
        print("📸 Screenshot saved to platform_screenshot.png")
        
        # Check what's on the page
        title = await page.title()
        print(f"\n📝 Page Title: {title}")
        
        # Check for login/register buttons or links
        buttons = await page.query_selector_all('button, a')
        print(f"\n🔘 Found {len(buttons)} interactive elements")
        
        # List all buttons and links
        print("\n📋 Available actions:")
        for i, btn in enumerate(buttons[:20]):  # First 20
            text = await btn.text_content()
            tag = await btn.evaluate('el => el.tagName')
            if text and text.strip():
                print(f"  {i+1}. {tag}: {text.strip()[:50]}")
        
        # Check for login form
        inputs = await page.query_selector_all('input')
        if inputs:
            print(f"\n📝 Found {len(inputs)} input fields (possible login form)")
        
        print("\n✅ Browser is open. You can interact with it.")
        print("Press Ctrl+C to close...")
        
        # Keep browser open for interaction
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            pass
        
        await browser.close()
        print("\n👋 Browser closed")

if __name__ == '__main__':
    asyncio.run(main())
