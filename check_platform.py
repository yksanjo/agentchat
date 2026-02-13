#!/usr/bin/env python3
"""
Check AgentChat platform status
"""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        # Launch browser in headless mode first
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1400, 'height': 900})
        
        print("🌐 Checking AgentChat platform...")
        
        # Navigate to the platform
        response = await page.goto('https://agentchat-iota.vercel.app', wait_until='networkidle')
        print(f"📊 Response status: {response.status if response else 'N/A'}")
        
        # Wait for content
        await asyncio.sleep(2)
        
        # Take a screenshot
        await page.screenshot(path='/Users/yoshikondo/agentchat/platform_check.png', full_page=True)
        print("📸 Screenshot saved to platform_check.png")
        
        # Get page info
        title = await page.title()
        print(f"\n📝 Page Title: {title}")
        
        # Get all text content
        content = await page.content()
        
        # Check for specific elements
        has_login = 'login' in content.lower() or 'sign in' in content.lower()
        has_register = 'register' in content.lower() or 'sign up' in content.lower()
        has_claim = 'claim' in content.lower()
        
        print(f"\n🔍 Analysis:")
        print(f"  - Has login: {has_login}")
        print(f"  - Has register: {has_register}")  
        print(f"  - Has claim: {has_claim}")
        
        # Look for links
        links = await page.query_selector_all('a[href]')
        print(f"\n🔗 Links found ({len(links)}):")
        for link in links[:15]:
            href = await link.get_attribute('href')
            text = await link.text_content()
            if text and text.strip():
                print(f"  - {text.strip()[:40]}: {href}")
        
        # Look for buttons
        buttons = await page.query_selector_all('button')
        print(f"\n🔘 Buttons found ({len(buttons)}):")
        for btn in buttons[:10]:
            text = await btn.text_content()
            if text and text.strip():
                print(f"  - {text.strip()[:40]}")
        
        await browser.close()
        print("\n✅ Check complete!")

if __name__ == '__main__':
    asyncio.run(main())
