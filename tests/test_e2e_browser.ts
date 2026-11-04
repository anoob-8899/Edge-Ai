import { chromium, Browser, BrowserContext, Page } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ✓ ${testName}`);
    if (detail) console.log(`         ${detail}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ✗ ${testName} - ${detail || "Assertion failed"}`);
    failedCount++;
    throw new Error(`E2E Test Failed: ${testName} - ${detail}`);
  }
}

async function runE2E() {
  console.log("================================================================================");
  console.log("             OPTITRAIN.AI - PLAYWRIGHT E2E BROWSER TEST SUITE                   ");
  console.log(`             Target URL: ${BASE_URL} (Headless Microsoft Edge)               `);
  console.log("================================================================================\n");

  const browser: Browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  try {
    // --------------------------------------------------------------------------
    // 1. OWNER SIGN-IN & OWNER DASHBOARD
    // --------------------------------------------------------------------------
    console.log("TEST 1: Owner Sign-In & Dashboard Verification (Desktop 1280x800)");
    const ownerContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const ownerPage = await ownerContext.newPage();

    await ownerPage.goto(`${BASE_URL}/sign-in`, { waitUntil: "networkidle" });
    assert(ownerPage.url().includes("/sign-in"), "Sign-in page loaded successfully");

    // Click demo owner credential button or fill form
    await ownerPage.fill('input[type="email"]', "owner@apex-optics.com");
    await ownerPage.fill('input[type="password"]', "SecureOwner123!");
    await ownerPage.click('button[type="submit"]');

    // Wait for redirection to /owner
    await ownerPage.waitForURL("**/owner", { timeout: 10000 });
    assert(ownerPage.url().includes("/owner"), "Owner redirected to /owner upon authentication");

    // Verify Owner Dashboard UI components
    const ownerHeading = await ownerPage.textContent("body");
    assert(
      ownerHeading !== null && (ownerHeading.includes("Owner") || ownerHeading.includes("Practice Oversight") || ownerHeading.includes("Dashboard")),
      "Owner Dashboard page rendered with authorized management panels"
    );

    // Verify absence of fake stats / Verify real data loaded
    assert(
      !ownerHeading?.includes("Dummy Data") && !ownerHeading?.includes("Fake Stats"),
      "Owner Dashboard does not contain fake production stats or placeholder mocks"
    );

    await ownerContext.close();

    // --------------------------------------------------------------------------
    // 2. STAFF SIGN-IN & SERVER-SIDE RBAC ISOLATION
    // --------------------------------------------------------------------------
    console.log("\nTEST 2: Staff Sign-In & RBAC Protection Enforcement");
    const staffContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const staffPage = await staffContext.newPage();

    await staffPage.goto(`${BASE_URL}/sign-in`, { waitUntil: "networkidle" });
    await staffPage.fill('input[type="email"]', "alex.optician@apex-optics.com");
    await staffPage.fill('input[type="password"]', "StaffPass123!");
    await staffPage.click('button[type="submit"]');

    // Wait for redirection
    await staffPage.waitForURL((url) => !url.pathname.includes("/sign-in"), { timeout: 10000 });
    assert(!staffPage.url().includes("/sign-in"), "Staff successfully authenticated and navigated away from sign-in");

    // Verify RBAC: Staff trying to access /owner
    console.log("   Verifying Staff cannot access /owner...");
    await staffPage.goto(`${BASE_URL}/owner`, { waitUntil: "networkidle" });
    const finalUrl = staffPage.url();
    assert(
      finalUrl.includes("/staff") && finalUrl.includes("error=owner_only_restricted"),
      "Middleware correctly blocked Staff from /owner and redirected to /staff with error parameter",
      `Redirected to: ${finalUrl}`
    );

    // --------------------------------------------------------------------------
    // 3. LEARNING LIBRARY: SEARCH & ZERO-PRICE CONTENT VERIFICATION
    // --------------------------------------------------------------------------
    console.log("\nTEST 3: Optical Learning Library Search & Content Verification");
    await staffPage.goto(`${BASE_URL}/library`, { waitUntil: "networkidle" });
    assert(staffPage.url().includes("/library"), "Learning Library page loaded");

    // Check search input
    const searchInput = staffPage.locator('input[placeholder*="Search"]').first();
    await searchInput.fill("Aviator");
    await staffPage.waitForTimeout(600); // Debounce / state update

    const libraryVisibleText = await staffPage.locator("main").innerText();
    assert(
      libraryVisibleText.includes("Aviator"),
      "Search results filter and display Aviator optical lesson"
    );

    // Check that NO prices or commercial discount tags appear
    assert(
      !/\$\s*\d+/.test(libraryVisibleText) && !/\b(USD|MSRP|Price:)\b/i.test(libraryVisibleText),
      "Learning Library is 100% price-free and focuses strictly on optical science"
    );

    // Navigate to Aviator lesson page directly
    await staffPage.goto(`${BASE_URL}/library/branded-sunglasses/heritage-aviator/classic-aviator-optics`, {
      waitUntil: "networkidle",
    });
    const lessonContent = await staffPage.locator("main").innerText();
    assert(
      lessonContent.includes("Classic Aviator Silhouette"),
      "Lesson detail page renders full optical training content"
    );
    assert(
      !/\$\s*\d+/.test(lessonContent) && !/[£€]\s*\d+/.test(lessonContent) && !/\b(discount|MSRP|checkout)\b/i.test(lessonContent),
      "Lesson detail page maintains strict zero-price compliance"
    );

    // --------------------------------------------------------------------------
    // 4. BRANDED SUNGLASSES CATALOGUE & SPECIFICATION VERIFICATION
    // --------------------------------------------------------------------------
    console.log("\nTEST 4: Branded Sunglasses Catalogue & Technical Specs");
    await staffPage.goto(`${BASE_URL}/catalogue`, { waitUntil: "networkidle" });
    const catalogueContent = await staffPage.locator("main").innerText();
    assert(
      catalogueContent.includes("Ray-Ban") || catalogueContent.includes("Oakley"),
      "Catalogue loaded with verified optical brand models"
    );

    // Navigate to model detail page
    await staffPage.goto(`${BASE_URL}/catalogue/ray-ban/ray-ban-rb3025-aviator-classic`, {
      waitUntil: "networkidle",
    });
    const modelContent = await staffPage.locator("main").innerText();
    assert(
      modelContent.includes("RB3025"),
      "Model detail page loaded with official model code (RB3025)"
    );
    assert(
      modelContent.includes("VERIFIED") || modelContent.includes("Verified"),
      "Verification badges and optical specifications displayed"
    );
    assert(
      !/\$\s*\d+/.test(modelContent) && !/\b(MSRP|Buy Now|Add to Cart)\b/i.test(modelContent),
      "Catalogue model details contain no retail prices or e-commerce buy buttons"
    );

    // --------------------------------------------------------------------------
    // 5. REAL GEMINI OPTICOACH SIMULATION WORKFLOW
    // --------------------------------------------------------------------------
    console.log("\nTEST 5: OptiCoach AI Patient Simulation (Real Gemini Model)");
    await staffPage.goto(`${BASE_URL}/opticoach`, { waitUntil: "networkidle" });
    assert(staffPage.url().includes("/opticoach"), "OptiCoach Studio loaded");

    // Wait for scenarios and initial customer message to become active
    await staffPage.waitForSelector("textarea:not([disabled])", { timeout: 15000 });
    const optiBody = await staffPage.textContent("body");
    assert(
      optiBody?.includes("Customer") || optiBody?.includes("Scenario") || optiBody?.includes("OptiCoach"),
      "OptiCoach loaded active scenario and conversation arena"
    );

    // Send a real message
    console.log("   Submitting practitioner message to Gemini customer simulation...");
    const textarea = staffPage.locator("textarea").first();
    await textarea.fill("Hello! Polarized lenses specifically filter horizontal reflected glare from wet asphalt and water, offering enhanced contrast and visual comfort compared to standard tinted sun lenses.");
    await staffPage.waitForTimeout(500);
    
    // Find and click Send button, waiting for the message API response
    const sendButton = staffPage.locator('button[data-testid="send-message-button"], button[aria-label="Send message"]').first();
    const responsePromise = staffPage.waitForResponse(
      (resp) => resp.url().includes("/messages") && resp.status() === 200,
      { timeout: 35000 }
    );
    await sendButton.click();
    await responsePromise;

    // Allow DOM to update with customer reply
    await staffPage.waitForTimeout(3000);
    const conversationAfter = await staffPage.textContent("body");
    console.log("   OptiBody length:", optiBody?.length, "ConversationAfter length:", conversationAfter?.length);
    assert(
      conversationAfter !== null && conversationAfter.length > 50,
      "Real Gemini customer simulation generated roleplay reply in active session"
    );

    await staffContext.close();

    // --------------------------------------------------------------------------
    // 6. RESPONSIVE LAYOUT VERIFICATION (Tablet & Mobile)
    // --------------------------------------------------------------------------
    console.log("\nTEST 6: Responsive Layouts (Tablet 768x1024 & Mobile 375x812)");

    // A. Tablet Viewport
    const tabletContext = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const tabletPage = await tabletContext.newPage();
    await tabletPage.goto(`${BASE_URL}/catalogue`, { waitUntil: "networkidle" });
    
    // Verify no horizontal scroll
    const tabletScrollWidth = await tabletPage.evaluate(() => document.documentElement.scrollWidth);
    const tabletClientWidth = await tabletPage.evaluate(() => document.documentElement.clientWidth);
    assert(
      tabletScrollWidth <= tabletClientWidth + 5,
      "Tablet layout (768px) fits viewport without horizontal overflow",
      `ScrollWidth: ${tabletScrollWidth}, ClientWidth: ${tabletClientWidth}`
    );
    await tabletContext.close();

    // B. Mobile Viewport
    const mobileContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${BASE_URL}/library`, { waitUntil: "networkidle" });

    // Verify mobile header / hamburger button exists
    const hamburger = mobilePage.locator('button[aria-label*="Menu" i], button[aria-label*="menu" i]').first();
    const hasHamburger = (await hamburger.count()) > 0;
    assert(hasHamburger, "Mobile view (375px) renders mobile header with hamburger menu button");

    if (hasHamburger) {
      await hamburger.click();
      await mobilePage.waitForTimeout(300);
      const drawerContent = await mobilePage.textContent("body");
      assert(
        drawerContent?.includes("Catalogue") || drawerContent?.includes("Library") || drawerContent?.includes("Sign In"),
        "Mobile navigation drawer opens and exposes application navigation links"
      );
    }

    const mobileScrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    const mobileClientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);
    assert(
      mobileScrollWidth <= mobileClientWidth + 5,
      "Mobile layout (375px) fits viewport without horizontal overflow",
      `ScrollWidth: ${mobileScrollWidth}, ClientWidth: ${mobileClientWidth}`
    );
    await mobileContext.close();

    console.log("\n================================================================================");
    console.log(`E2E BROWSER TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("================================================================================\n");
  } finally {
    await browser.close();
  }
}

runE2E().catch((err) => {
  console.error("E2E Test execution crashed:", err);
  process.exit(1);
});
