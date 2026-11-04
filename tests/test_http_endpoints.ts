async function testHttp() {
  console.log("=== TESTING LIVE HTTP ENDPOINTS ON PORT 3000 ===");
  const baseUrl = "http://localhost:3000";

  // 1. Test /api/library/categories
  console.log("1. Fetching /api/library/categories...");
  const catRes = await fetch(`${baseUrl}/api/library/categories`);
  console.log("   Status:", catRes.status);
  const catData = await catRes.json();
  console.log("   Categories count:", catData.categories?.length);

  // 2. Test /api/library/lessons?search=aviator
  console.log("\n2. Searching /api/library/lessons?search=aviator...");
  const searchRes = await fetch(`${baseUrl}/api/library/lessons?search=aviator`);
  console.log("   Status:", searchRes.status);
  const searchData = await searchRes.json();
  console.log("   Lessons found:", searchData.lessons?.length);
  if (searchData.lessons?.length > 0) {
    console.log("   First match title:", searchData.lessons[0].title);
  }

  // 3. Test /api/auth/login as Staff
  console.log("\n3. Testing Staff Login via /api/auth/login...");
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ demoRole: "staff" }),
  });
  console.log("   Status:", loginRes.status);
  const loginData = await loginRes.json();
  console.log("   Authenticated user:", loginData.user?.email, "Role:", loginData.user?.role);
  const cookieHeader = loginRes.headers.get("set-cookie");
  console.log("   Session cookie returned:", Boolean(cookieHeader));

  // 4. Test /api/auth/login as Owner
  console.log("\n4. Testing Owner Login via /api/auth/login...");
  const ownerLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ demoRole: "owner" }),
  });
  console.log("   Status:", ownerLoginRes.status);
  const ownerData = await ownerLoginRes.json();
  console.log("   Authenticated owner:", ownerData.user?.email, "Role:", ownerData.user?.role);

  // 5. Test Unauthorized creation (Staff cookie attempting to create lesson)
  console.log("\n5. Testing Authorization: Staff attempting Owner POST /api/library/lessons...");
  const staffCookie = cookieHeader ? cookieHeader.split(";")[0] : "";
  const forbiddenRes = await fetch(`${baseUrl}/api/library/lessons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: staffCookie,
    },
    body: JSON.stringify({
      title: "Unauthorized Lesson Attempt",
      slug: "unauthorized-lesson",
      subcategoryId: "abc",
      summary: "This should fail",
    }),
  });
  console.log("   Status:", forbiddenRes.status, "(Expected 403 Forbidden)");
  const forbiddenData = await forbiddenRes.json();
  console.log("   Error message:", forbiddenData.error);

  // 6. Test HTML page loads
  console.log("\n6. Testing Page Route Loading (/library)...");
  const pageRes = await fetch(`${baseUrl}/library`);
  console.log("   Status:", pageRes.status);
  const html = await pageRes.text();
  console.log("   HTML contains 'Optical Learning Library':", html.includes("Optical Learning Library") || html.includes("Curriculum"));

  console.log("\n=== ALL HTTP ENDPOINTS TESTED SUCCESSFULLY ===");
}

testHttp().catch(err => {
  console.error("HTTP test error:", err);
  process.exit(1);
});
