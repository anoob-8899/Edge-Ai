import { prisma } from "../src/lib/prisma";
import { OPTICAL_SCENARIOS, getScenarioById } from "../src/lib/opticoach/scenarios";
import { retrieveOpticalKnowledge } from "../src/lib/opticoach/rag";
import { generateCustomerSimulationTurn, generateSessionReview } from "../src/lib/opticoach/gemini";

const BASE_URL = "http://localhost:3000";

let staffCookie = "";
let createdSessionId = "";

async function runTestSuite() {
  console.log("==========================================================");
  console.log("        OPTICOACH AI INTEGRATION AUTOMATED TEST SUITE     ");
  console.log("==========================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, title: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASSED] ✓ ${title}`);
      if (detail) console.log(`         ${detail}`);
    } else {
      console.error(`[FAILED] ✗ ${title}`);
      if (detail) console.error(`         Failure detail: ${detail}`);
      throw new Error(`Test assertion failed: ${title}`);
    }
  }

  // ----------------------------------------------------
  // TEST 1: ALL 9 INITIAL SCENARIOS DEFINITIONS
  // ----------------------------------------------------
  console.log("----------------------------------------------------------");
  console.log("1. Testing 9 Initial OptiCoach Scenarios Integrity");
  console.log("----------------------------------------------------------");
  assert(
    OPTICAL_SCENARIOS.length === 9,
    "Exactly 9 initial scenarios defined",
    `Found ${OPTICAL_SCENARIOS.length} scenarios.`
  );

  const expectedTitles = [
    "First-Time Eyewear Buyer",
    "Lens Upgrade Discussion",
    "Customer Comparing Branded Sunglasses",
    "Customer Asking About Polarization",
    "Customer Asking About UV Protection",
    "Customer Unsure Which Frame Suits Their Needs",
    "Budget-Conscious Customer",
    "Handling a Customer Objection",
    "General Product Knowledge Practice",
  ];

  for (let i = 0; i < expectedTitles.length; i++) {
    const sc = OPTICAL_SCENARIOS[i];
    assert(
      sc.title === expectedTitles[i],
      `Scenario ${i + 1} matches: "${expectedTitles[i]}"`,
      `Persona: ${sc.patientPersona.name}, Category: ${sc.category}, Difficulty: ${sc.difficulty}`
    );
  }

  // ----------------------------------------------------
  // TEST 2: RAG KNOWLEDGE RETRIEVAL & GROUNDING
  // ----------------------------------------------------
  console.log("\n----------------------------------------------------------");
  console.log("2. Testing RAG Knowledge Retrieval from Library & Catalogue");
  console.log("----------------------------------------------------------");
  const scenarioLens = getScenarioById("sc-lens-upgrade")!;
  const retrievedData = await retrieveOpticalKnowledge(
    "How does progressive corridor and digital free-form minimize swim effect?",
    scenarioLens
  );

  assert(
    retrievedData.relevantLessons.length > 0,
    "Retrieved optical lessons from Learning Library for progressive query",
    `Matched ${retrievedData.relevantLessons.length} lessons. Sample: "${retrievedData.relevantLessons[0]?.title}"`
  );

  const scenarioBrand = getScenarioById("sc-brand-compare")!;
  const retrievedBrandData = await retrieveOpticalKnowledge(
    "Ray-Ban Aviator RB3025 vs Oakley Holbrook OO9102",
    scenarioBrand
  );

  assert(
    retrievedBrandData.relevantModels.length > 0,
    "Retrieved branded models from Catalogue for sunglasses query",
    `Found ${retrievedBrandData.relevantModels.length} models: ${retrievedBrandData.relevantModels
      .map((m) => `${m.brandName} ${m.officialProductName}`)
      .join(", ")}`
  );

  assert(
    retrievedBrandData.groundingText.includes("VERIFIED") &&
      retrievedBrandData.groundingText.includes("IMPORTANT"),
    "Grounding text format isolates untrusted content and labels verification state",
    "Grounding payload structure validated."
  );

  // ----------------------------------------------------
  // TEST 3: AUTHENTICATION ENFORCEMENT ON OPTICOACH APIS
  // ----------------------------------------------------
  console.log("\n----------------------------------------------------------");
  console.log("3. Testing Authentication & Permissions Enforcement");
  console.log("----------------------------------------------------------");
  // Anonymous request to /api/opticoach/sessions should be 401
  const anonRes = await fetch(`${BASE_URL}/api/opticoach/sessions`);
  assert(
    anonRes.status === 401,
    "Unauthenticated request to /api/opticoach/sessions rejected with 401 Unauthorized",
    `HTTP Status: ${anonRes.status}`
  );

  // Authenticate as Staff Optician
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ demoRole: "staff" }),
  });
  assert(
    loginRes.status === 200,
    "Staff Optician authenticated successfully",
    "Session established via /api/auth/login"
  );
  const cookieHeader = loginRes.headers.get("set-cookie");
  staffCookie = cookieHeader ? cookieHeader.split(";")[0] : "";
  assert(Boolean(staffCookie), "Session JWT cookie captured for OptiCoach requests");

  // ----------------------------------------------------
  // TEST 4: SESSION INITIALIZATION & PERSISTENCE
  // ----------------------------------------------------
  console.log("\n----------------------------------------------------------");
  console.log("4. Testing Session Creation & Persistence in PostgreSQL");
  console.log("----------------------------------------------------------");
  const initRes = await fetch(`${BASE_URL}/api/opticoach/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: staffCookie,
    },
    body: JSON.stringify({ scenarioId: "sc-lens-upgrade" }),
  });

  assert(
    initRes.status === 201,
    "New OptiCoach session created via HTTP POST",
    `Status: ${initRes.status}`
  );
  const initData = await initRes.json();
  createdSessionId = initData.session?.id;
  assert(
    Boolean(createdSessionId),
    "Session ID returned from database",
    `Session ID: ${createdSessionId}`
  );
  assert(
    initData.session?.messages?.length === 1,
    "Initial customer greeting seeded into conversation transcript",
    `Customer: "${initData.session?.messages[0]?.content.slice(0, 70)}..."`
  );

  // Verify in Prisma DB directly
  const dbSession = await prisma.optiCoachSession.findUnique({
    where: { id: createdSessionId },
    include: { messages: true },
  });
  assert(
    dbSession !== null && dbSession.status === "ACTIVE",
    "Session verified directly in PostgreSQL database with ACTIVE status",
    `DB status: ${dbSession?.status}, Scenario: ${dbSession?.scenarioTitle}`
  );

  // ----------------------------------------------------
  // TEST 5: REAL GEMINI API REQUEST & CUSTOMER SIMULATION TURN
  // ----------------------------------------------------
  console.log("\n----------------------------------------------------------");
  console.log("5. Testing Real Gemini Model Request & Customer Simulation");
  console.log("----------------------------------------------------------");
  console.log("   Sending staff response to Arthur Pendelton regarding progressive lenses...");

  const turnRes = await fetch(`${BASE_URL}/api/opticoach/sessions/${createdSessionId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: staffCookie,
    },
    body: JSON.stringify({
      content:
        "Good afternoon Mr. Pendelton. I completely understand why you're cautious about progressives. With your work as an architect alternating between CAD monitors and blueprints, modern digital free-form progressives are custom-surfaced to give you wide intermediate vision and eliminate the swim effect older lenses had. Let's measure your exact workstation viewing distance.",
    }),
  });

  if (turnRes.status !== 200) {
    const errBody = await turnRes.text();
    console.error("   Turn error body:", errBody);
    console.log("   Retrying simulation turn after 3s...");
    await new Promise((r) => setTimeout(r, 3000));
    turnRes = await fetch(`${BASE_URL}/api/opticoach/sessions/${createdSessionId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
      body: JSON.stringify({
        content:
          "Good afternoon Mr. Pendelton. I completely understand why you're cautious about progressives. With your work as an architect alternating between CAD monitors and blueprints, modern digital free-form progressives are custom-surfaced to give you wide intermediate vision and eliminate the swim effect older lenses had. Let's measure your exact workstation viewing distance.",
      }),
    });
  }

  assert(
    turnRes.status === 200,
    "Gemini processed simulation turn and returned HTTP 200",
    `Status: ${turnRes.status}`
  );

  const turnData = await turnRes.json();
  assert(
    Boolean(turnData.customerMessage?.content),
    "Gemini generated real customer roleplay reply in character",
    `Arthur Pendelton: "${turnData.customerMessage?.content}"`
  );
  assert(
    Boolean(turnData.customerMood),
    `Customer mood evaluated: ${turnData.customerMood}`,
    `Mood badge: ${turnData.customerMood}`
  );
  assert(
    Boolean(turnData.coachingNotes),
    "OptiCoach generated real-time coaching feedback whisper",
    `Coach note: "${turnData.coachingNotes}"`
  );

  // Verify turn was persisted in DB
  const dbTurnMessages = await prisma.optiCoachMessage.findMany({
    where: { sessionId: createdSessionId },
    orderBy: { createdAt: "asc" },
  });
  assert(
    dbTurnMessages.length === 3,
    "All 3 messages (initial customer, staff reply, Gemini customer response) persisted in DB",
    `Total stored messages: ${dbTurnMessages.length}`
  );

  // ----------------------------------------------------
  // TEST 6: END SESSION & GEMINI COMPREHENSIVE REVIEW
  // ----------------------------------------------------
  console.log("\n----------------------------------------------------------");
  console.log("6. Testing End Session & Gemini Review Evaluation");
  console.log("----------------------------------------------------------");
  console.log("   Waiting 1.5s to prevent API spike before review evaluation...");
  await new Promise((r) => setTimeout(r, 1500));

  let reviewRes = await fetch(`${BASE_URL}/api/opticoach/sessions/${createdSessionId}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: staffCookie,
    },
  });

  if (reviewRes.status !== 200) {
    const errText = await reviewRes.text();
    console.log("   Review request status " + reviewRes.status + ", error: " + errText + ", retrying after 3s...");
    await new Promise((r) => setTimeout(r, 3000));
    reviewRes = await fetch(`${BASE_URL}/api/opticoach/sessions/${createdSessionId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
    });
  }

  assert(
    reviewRes.status === 200,
    "Session completed and evaluated successfully via Gemini",
    `HTTP Status: ${reviewRes.status}`
  );

  const reviewData = await reviewRes.json();
  const review = reviewData.review;
  assert(
    typeof review?.overallScore === "number" && review.overallScore >= 0 && review.overallScore <= 100,
    `Overall score generated by Gemini: ${review?.overallScore}/100`,
    `Score: ${review?.overallScore}`
  );
  assert(
    Array.isArray(review?.strengths) && review.strengths.length > 0,
    "Consultation strengths identified",
    `Strengths count: ${review?.strengths?.length}. Top: "${review?.strengths[0]}"`
  );
  assert(
    Array.isArray(review?.areasForImprovement) && review.areasForImprovement.length > 0,
    "Areas for improvement identified",
    `Improvement count: ${review?.areasForImprovement?.length}. Top: "${review?.areasForImprovement[0]}"`
  );

  // Verify session status updated to COMPLETED in database
  const finalDbSession = await prisma.optiCoachSession.findUnique({
    where: { id: createdSessionId },
  });
  assert(
    finalDbSession?.status === "COMPLETED" && finalDbSession?.score !== null,
    "PostgreSQL session status transitioned to COMPLETED with score and timestamp",
    `DB Status: ${finalDbSession?.status}, Final Score: ${finalDbSession?.score}%, CompletedAt: ${finalDbSession?.completedAt}`
  );

  // ----------------------------------------------------
  // TEST 7: MISSING GEMINI API KEY & ERROR RESILIENCE
  // ----------------------------------------------------
  console.log("\n----------------------------------------------------------");
  console.log("7. Testing Missing API Key & Error Handling Resilience");
  console.log("----------------------------------------------------------");

  // Temporarily clear GEMINI_API_KEY to test missing key behavior
  const savedKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "";

  try {
    // Attempt turn without API key
    await generateCustomerSimulationTurn({
      scenario: scenarioLens,
      dialogueHistory: [],
      latestStaffMessage: "Hello",
      groundingText: "",
    });
    assert(false, "Should have thrown GEMINI_API_KEY_MISSING error");
  } catch (err: any) {
    assert(
      err.code === "GEMINI_API_KEY_MISSING" && err.statusCode === 503,
      "Missing GEMINI_API_KEY properly caught with code GEMINI_API_KEY_MISSING and 503 status",
      `Error caught: ${err.message}`
    );
  } finally {
    // Restore API key
    process.env.GEMINI_API_KEY = savedKey;
  }

  // Test invalid session ID message submission
  const invalidSessionRes = await fetch(`${BASE_URL}/api/opticoach/sessions/invalid-session-999/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: staffCookie,
    },
    body: JSON.stringify({ content: "Test message" }),
  });
  assert(
    invalidSessionRes.status === 404,
    "Invalid session ID yields 404 Not Found cleanly",
    `Status: ${invalidSessionRes.status}`
  );

  // Test empty message submission
  const emptyMsgRes = await fetch(`${BASE_URL}/api/opticoach/sessions/${createdSessionId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: staffCookie,
    },
    body: JSON.stringify({ content: "   " }),
  });
  assert(
    emptyMsgRes.status === 400,
    "Empty message submission rejected with 400 Bad Request",
    `Status: ${emptyMsgRes.status}`
  );

  // ----------------------------------------------------
  // TEST 8: SAVED SESSION HISTORY RETRIEVAL
  // ----------------------------------------------------
  console.log("\n----------------------------------------------------------");
  console.log("8. Testing Saved Session History Retrieval");
  console.log("----------------------------------------------------------");

  const historyRes = await fetch(`${BASE_URL}/api/opticoach/sessions`, {
    headers: { Cookie: staffCookie },
  });
  assert(
    historyRes.status === 200,
    "Session history retrieved successfully",
    `Status: ${historyRes.status}`
  );
  const historyData = await historyRes.json();
  const foundSession = historyData.sessions?.find((s: any) => s.id === createdSessionId);
  assert(
    Boolean(foundSession) && foundSession.status === "COMPLETED",
    "Created session present in practitioner's past history with score",
    `Session ID ${foundSession?.id} found with score ${foundSession?.score}%`
  );

  console.log("\n----------------------------------------------------------");
  console.log(`OVERALL RESULT: ALL ${passed} / ${total} OPTICOACH TESTS PASSED!`);
  console.log("==========================================================");
}

runTestSuite()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
