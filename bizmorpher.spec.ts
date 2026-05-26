import { test, expect, devices } from "@playwright/test";

const BASE_URL = "https://bizmorpher.com";

// ---------------------------------------------------------------------------
// Homepage
// ---------------------------------------------------------------------------
test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("loads with correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/Bizmorpher/i);
  });

  test("displays the main navigation bar", async ({ page }) => {
    const nav = page.locator("nav, header");
    await expect(nav.first()).toBeVisible();
  });

  test("shows Services, About Us and Contact nav links", async ({ page }) => {
    await expect(page.getByRole("link", { name: /services/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /about us/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /contact/i }).first()).toBeVisible();
  });

  test("shows the three service pillars (Digital, Data & AI, Cloud)", async ({ page }) => {
    await expect(page.getByText(/digital/i).first()).toBeVisible();
    await expect(page.getByText(/data & ai/i).first()).toBeVisible();
    await expect(page.getByText(/cloud/i).first()).toBeVisible();
  });

  test("displays partner logos section", async ({ page }) => {
    // The site shows IBM, AWS, SAP, Microsoft logos
    const logos = page.locator('img[src*="aws"], img[src*="sap"], img[src*="mirco-soft"]');
    await expect(logos.first()).toBeVisible();
  });

  test("shows office contact information in the footer", async ({ page }) => {
    await expect(page.getByText(/australia office/i)).toBeVisible();
    await expect(page.getByText(/pakistan office/i)).toBeVisible();
    await expect(page.getByText(/china office/i)).toBeVisible();
  });

  test("footer contains copyright notice", async ({ page }) => {
    await expect(page.getByText(/© 2024 Bizmorpher/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Navigation – page routing
// ---------------------------------------------------------------------------
test.describe("Navigation", () => {
  test("About Us link navigates to /about-us/", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole("link", { name: /about us/i }).first().click();
    await expect(page).toHaveURL(/about-us/);
    await expect(page).not.toHaveTitle(/404|not found/i);
  });

  test("Contact link navigates to /contact/", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole("link", { name: /contact/i }).first().click();
    await expect(page).toHaveURL(/contact/);
    await expect(page).not.toHaveTitle(/404|not found/i);
  });

  test("Services link navigates to /services/", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole("link", { name: /^services$/i }).first().click();
    await expect(page).toHaveURL(/services/);
    await expect(page).not.toHaveTitle(/404|not found/i);
  });

  test("Logo click returns to homepage from an inner page", async ({ page }) => {
    await page.goto(`${BASE_URL}/about-us/`);
    await page.locator("header a, .site-logo a").first().click();
    await expect(page).toHaveURL(new RegExp(`^${BASE_URL}/?$`));
  });
});

// ---------------------------------------------------------------------------
// Services page
// ---------------------------------------------------------------------------
test.describe("Services page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/services/`);
  });

  test("page loads without a 404", async ({ page }) => {
    await expect(page).not.toHaveTitle(/404|not found/i);
  });

  test("mentions SAP S/4HANA", async ({ page }) => {
    await expect(page.getByText(/SAP S\/4HANA/i).first()).toBeVisible();
  });

  test("mentions Cyber Security", async ({ page }) => {
    await expect(page.getByText(/cyber security/i).first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Contact page
// ---------------------------------------------------------------------------
test.describe("Contact page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/contact/`);
  });

  test("page loads without a 404", async ({ page }) => {
    await expect(page).not.toHaveTitle(/404|not found/i);
  });

  test("displays a contact email address", async ({ page }) => {
    await expect(page.getByText(/ask@bizmorpher\.com/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Sub-service pages – spot-check two clickable links
// ---------------------------------------------------------------------------
test.describe("Sub-service pages", () => {
  test("SAP S/4HANA on RISE page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/sap-s-4hana-on-rise/`);
    await expect(page).not.toHaveTitle(/404|not found/i);
    await expect(page.getByText(/s\/4hana/i).first()).toBeVisible();
  });

  test("IT Service Desk page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/it-service-desk/`);
    await expect(page).not.toHaveTitle(/404|not found/i);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
test.describe("Edge cases", () => {
  test("unknown URL returns a proper error page, not a blank screen", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/this-page-does-not-exist-xyz123/`);
    // Should serve a 404 HTML page, not time out or show nothing
    expect(response?.status()).toBe(404);
    // The page body should still render something meaningful
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(50);
  });

  test("page responds within 5 seconds on a desktop viewport", async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    expect(Date.now() - start).toBeLessThan(5000);
  });

  test("nav links that point to '#' do NOT navigate away from the page", async ({ page }) => {
    await page.goto(BASE_URL);
    const hashLinks = page.locator('a[href="#"]');
    const count = await hashLinks.count();
    // Just verify they exist (the site has placeholder links) and clicking one stays on page
    if (count > 0) {
      const currentUrl = page.url();
      await hashLinks.first().click();
      await expect(page).toHaveURL(currentUrl + "#");
    }
  });

  test("mobile viewport – hamburger menu or nav is accessible", async ({ browser }) => {
    const context = await browser.newContext({
      ...devices["iPhone 13"],
    });
    const page = await context.newPage();
    await page.goto(BASE_URL);
    // On mobile there should be a burger button or the nav links should still be present in DOM
    const mobileNav = page.locator('[class*="burger"], [class*="hamburger"], [class*="menu-toggle"], nav');
    await expect(mobileNav.first()).toBeAttached();
    await context.close();
  });

  test("page title is not empty", async ({ page }) => {
    await page.goto(BASE_URL);
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });
});
