import { prisma } from "../src/lib/prisma";
import {
  ASSESSMENT_CRITERIA_KEYS,
  ASSESSMENT_CRITERIA_DEFINITIONS,
  CriterionResultSchema,
  SessionAssessmentSchema,
  buildIncompleteSessionAssessment,
  DISCLAIMERS,
} from "../src/lib/opticoach/assessment";
import { getScenarioById } from "../src/lib/opticoach/scenarios";

const BASE_URL = "http://localhost:3000";

let staffCookie = "";
let ownerCookie = "";
let staffUserId = "";
let ownerUserId = "";

async function runAssessmentWorkflowTests() {
  console.log("================================================================================");
  console.log("      OPTICOACH REAL CONVERSATION ASSESSMENT & SESSION-REVIEW TEST SUITE       ");
  console.log("================================================================================\n");

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

  // --------------------------------------------------------------------------
  // TEST 1: STRICT SERVER-SIDE SCHEMA & MALFORMED AI OUTPUT VALIDATION
  // --------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("1. Testing Server-Side Zod Schemas & Malformed AI Output Handling");
  console.log("--------------------------------------------------------------------------------");

  assert(
    ASSESSMENT_CRITERIA_KEYS.length === 6,
    "Exactly 6 assessment criteria keys defined",
    `Keys: ${ASSESSMENT_CRITERIA_KEYS.join(", ")}`
  );

  for (const key of ASSESSMENT_CRITERIA_KEYS) {
    const def = ASSESSMENT_CRITERIA_DEFINITIONS[key];
    assert(
      !!def && !!def.name && !!def.description && !!def.rubric.exemplary && !!def.rubric.unsatisfactory,
      `Criterion definition complete for "${key}"`,
      `Name: ${def.name}`
    );
  }

  // Test malformed criterion: missing required fields
  const malformedCriterionMissingField = {
    criterionId: "customer_needs_discovery",
    criterionName: "Customer Needs Discovery",
    score: 85,
    // missing rubricLevel, evidence, etc.
  };
  const parseResult1 = CriterionResultSchema.safeParse(malformedCriterionMissingField);
  assert(
    !parseResult1.success,
    "Zod schema rejects criterion with missing required fields",
    "Missing rubricLevel, evidence, whatWentWell correctly caused validation failure"
  );

  // Test malformed criterion: invalid score range (> 100)
  const malformedCriterionScore = {
    criterionId: "customer_needs_discovery",
    criterionName: "Customer Needs Discovery",
    score: 120, // invalid > 100
    rubricLevel: "Exemplary",
    rubricDescriptor: "Valid descriptor text here",
    evidence: "Verbatim quote",
    isEvidenceObserved: true,
    whatWentWell: "Good listening",
    whatCouldImprove: "Could explore computer distance",
    suggestedAlternativeResponse: "What distance is your monitor?",
    recommendedFollowUpExercise: "Practice computer distance discovery",
  };
  const parseResult2 = CriterionResultSchema.safeParse(malformedCriterionScore);
  assert(
    !parseResult2.success,
    "Zod schema rejects criterion with score > 100",
    "Score 120 failed max(100) check"
  );

  // Test malformed assessment: only 5 criteria instead of 6
  const malformedAssessmentMissingCriteria = {
    overallScore: 80,
    rubricGrade: "Competency Demonstrated",
    summary: "Good session overall with solid clinical discovery.",
    strengths: ["Clear communication"],
    areasForImprovement: ["Probe screen distance"],
    criteria: [
      {
        criterionId: "customer_needs_discovery",
        criterionName: "Customer Needs Discovery",
        score: 80,
        rubricLevel: "Proficient",
        rubricDescriptor: "Asks relevant lifestyle and prescription questions.",
        evidence: "How many hours do you spend on the computer?",
        isEvidenceObserved: true,
        whatWentWell: "Asked computer usage",
        whatCouldImprove: "Ask about hobbies",
        suggestedAlternativeResponse: "Do you also do outdoor sports?",
        recommendedFollowUpExercise: "Complete lifestyle intake exercise",
      },
    ], // only 1 criterion
    recommendedAction: "Review progressive corridor designs.",
    generatedAt: new Date().toISOString(),
    isCompleteSession: true,
    staffTurnCount: 2,
    disclaimers: DISCLAIMERS,
  };
  const parseResult3 = SessionAssessmentSchema.safeParse(malformedAssessmentMissingCriteria);
  assert(
    !parseResult3.success,
    "Zod schema rejects assessment with fewer than 6 criteria",
    "criteria.length !== 6 correctly triggered validation error"
  );

  // Test valid incomplete session assessment generation
  const testScenario = getScenarioById("sc-lens-upgrade")!;
  const incompleteAssessment = buildIncompleteSessionAssessment({
    scenario: testScenario,
    staffTurnCount: 0,
  });
  const incompleteParse = SessionAssessmentSchema.safeParse(incompleteAssessment);
  assert(
    incompleteParse.success,
    "Incomplete session assessment satisfies strict Zod schema",
    `Score: ${incompleteAssessment.overallScore}, Grade: "${incompleteAssessment.rubricGrade}", Criteria count: ${incompleteAssessment.criteria.length}`
  );
  assert(
    incompleteAssessment.overallScore === 0 && incompleteAssessment.rubricGrade === "Incomplete Session",
    "Incomplete session assigns 0 score and 'Incomplete Session' rubric grade",
    "Prevents unearned scores when 0 staff dialogue turns were taken"
  );
  assert(
    incompleteAssessment.criteria.every((c) => !c.isEvidenceObserved && c.evidence.includes("No staff consultation statements were recorded")),
    "Incomplete session marks all criteria as unobserved with factual absence note",
    "Never invents fake evidence for unobserved turns"
  );

  // --------------------------------------------------------------------------
  // TEST 2: AUTHENTICATION & RBAC PERMISSIONS SETUP
  // --------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("2. Testing Authentication & User Permissions (Staff vs Owner)");
  console.log("--------------------------------------------------------------------------------");

  // Login as Staff
  const staffLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ demoRole: "staff" }),
  });
  assert(staffLoginRes.status === 200, "Staff login successful (HTTP 200)");
  const staffCookieHeader = staffLoginRes.headers.get("set-cookie") || "";
  staffCookie = staffCookieHeader ? staffCookieHeader.split(";")[0] : "";
  const staffData = await staffLoginRes.json();
  staffUserId = staffData.user.id;
  assert(staffData.user.role.toLowerCase() === "staff", "Staff user has role 'staff'");

  // Login as Owner
  const ownerLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ demoRole: "owner" }),
  });
  assert(ownerLoginRes.status === 200, "Owner login successful (HTTP 200)");
  const ownerCookieHeader = ownerLoginRes.headers.get("set-cookie") || "";
  ownerCookie = ownerCookieHeader ? ownerCookieHeader.split(";")[0] : "";
  const ownerData = await ownerLoginRes.json();
  ownerUserId = ownerData.user.id;
  assert(ownerData.user.role.toLowerCase() === "owner", "Owner user has role 'owner'");

  // Unauthenticated request to /api/opticoach/sessions -> 401
  const unauthRes = await fetch(`${BASE_URL}/api/opticoach/sessions`);
  assert(
    unauthRes.status === 401,
    "Unauthenticated request to /api/opticoach/sessions is rejected with HTTP 401"
  );

  // Staff querying another user's sessions -> 403
  const staffForbiddenRes = await fetch(
    `${BASE_URL}/api/opticoach/sessions?userId=${ownerUserId}`,
    {
      headers: { Cookie: staffCookie },
    }
  );
  assert(
    staffForbiddenRes.status === 403,
    "Staff user querying another user's sessions is rejected with HTTP 403 Forbidden"
  );

  // Owner querying all staff sessions -> 200 with populated user details
  const ownerQueryRes = await fetch(`${BASE_URL}/api/opticoach/sessions?limit=50`, {
    headers: { Cookie: ownerCookie },
  });
  const ownerResBody = await ownerQueryRes.text();
  assert(
    ownerQueryRes.status === 200,
    "Owner querying practice assessment records returns HTTP 200",
    `Status: ${ownerQueryRes.status}, Body: ${ownerResBody}`
  );
  const ownerSessions = JSON.parse(ownerResBody);
  assert(
    Array.isArray(ownerSessions.sessions),
    "Owner receives array of practice sessions",
    `Found ${ownerSessions.sessions.length} sessions in practice history`
  );
  if (ownerSessions.sessions.length > 0) {
    const sample = ownerSessions.sessions[0];
    assert(
      sample.user && sample.user.name && sample.user.email,
      "Owner session record includes populated staff user details (name, email, role)",
      `Sample user: ${sample.user.name} (${sample.user.role})`
    );
  }

  // --------------------------------------------------------------------------
  // TEST 3: INCOMPLETE SESSION WORKFLOW (0 STAFF TURNS)
  // --------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("3. Testing Incomplete Session Evaluation (0 Staff Turns Taken)");
  console.log("--------------------------------------------------------------------------------");

  const createIncompleteRes = await fetch(`${BASE_URL}/api/opticoach/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: staffCookie,
    },
    body: JSON.stringify({ scenarioId: "sc-budget-conscious" }),
  });
  assert(createIncompleteRes.status === 201, "Created new session for incomplete test (HTTP 201)");
  const incompleteSessionData = await createIncompleteRes.json();
  const incompleteSessionId = incompleteSessionData.session.id;

  // Complete immediately without any staff dialogue turns
  const completeIncompleteRes = await fetch(
    `${BASE_URL}/api/opticoach/sessions/${incompleteSessionId}/complete`,
    {
      method: "POST",
      headers: { Cookie: staffCookie },
    }
  );
  assert(
    completeIncompleteRes.status === 200,
    "Incomplete session completed gracefully without crashing (HTTP 200)"
  );
  const incompleteResult = await completeIncompleteRes.json();
  assert(
    incompleteResult.assessment.overallScore === 0,
    "Incomplete session assessment score is 0"
  );
  assert(
    incompleteResult.assessment.rubricGrade === "Incomplete Session",
    "Incomplete session rubric grade is 'Incomplete Session'"
  );
  assert(
    incompleteResult.assessment.criteria.length === 6,
    "Incomplete session provides all 6 criteria entries with constructive suggestions"
  );
  assert(
    incompleteResult.assessment.disclaimers &&
      incompleteResult.assessment.disclaimers.employmentDecisions.includes("NEVER be used as the sole or decisive basis"),
    "Incomplete assessment includes mandatory employment decision disclaimer"
  );

  // --------------------------------------------------------------------------
  // TEST 4: COMPLETED SESSION WORKFLOW WITH REAL CONVERSATION TURNS
  // --------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("4. Testing Completed Session with Real Dialogue Turns & Gemini Assessment");
  console.log("--------------------------------------------------------------------------------");

  // Create real consultation session
  const createRealRes = await fetch(`${BASE_URL}/api/opticoach/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: staffCookie,
    },
    body: JSON.stringify({ scenarioId: "sc-lens-upgrade" }),
  });
  assert(createRealRes.status === 201, "Created consultation session for lens upgrade (HTTP 201)");
  const realSessionData = await createRealRes.json();
  const realSessionId = realSessionData.session.id;

  // Turn 1: Staff asks discovery and recommends digital freeform progressive lenses
  console.log("   -> Sending Staff Turn 1 (Discovery & Explanation)...");
  const turn1Res = await fetch(
    `${BASE_URL}/api/opticoach/sessions/${realSessionId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
      body: JSON.stringify({
        content:
          "Good afternoon David! I see Dr. Vance prescribed an ADD of +2.00 for your presbyopia. What daily visual tasks give you the most trouble, and how many hours do you spend between dual monitors and reading paperwork?",
      }),
    }
  );
  const turn1Text = await turn1Res.text();
  assert(turn1Res.status === 200, "Turn 1 successfully processed by Gemini simulation (HTTP 200)", `Status: ${turn1Res.status}, Body: ${turn1Text.slice(0, 120)}`);
  const turn1Data = JSON.parse(turn1Text);
  assert(
    turn1Data.customerMessage && turn1Data.customerMessage.content.length > 10,
    "Customer replied realistically to staff discovery question",
    `Customer: "${turn1Data.customerMessage.content.slice(0, 70)}..."`
  );

  // Turn 2: Staff explains progressive corridors and recommends anti-reflective high index lenses
  console.log("   -> Sending Staff Turn 2 (Product Knowledge & Objection Handling)...");
  const turn2Res = await fetch(
    `${BASE_URL}/api/opticoach/sessions/${realSessionId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: staffCookie,
      },
      body: JSON.stringify({
        content:
          "I completely understand your hesitation from that swim feeling years ago. Traditional progressives had narrow corridors with abrupt peripheral blur. We now use digital freeform progressive lenses point-by-point computed to your exact frame fit. It broadens your intermediate corridor by over 30% and virtually eliminates swim effect when moving your eyes between monitors.",
      }),
    }
  );
  const turn2Text = await turn2Res.text();
  assert(turn2Res.status === 200, "Turn 2 successfully processed by Gemini simulation (HTTP 200)", `Status: ${turn2Res.status}, Body: ${turn2Text.slice(0, 120)}`);
  const turn2Data = JSON.parse(turn2Text);
  assert(
    turn2Data.customerMessage && turn2Data.customerMessage.content.length > 10,
    "Customer replied to progressive lens explanation",
    `Customer: "${turn2Data.customerMessage.content.slice(0, 70)}..."`
  );

  // Finalize session with real Gemini assessment
  console.log("   -> Finalizing session and requesting strict AI assessment...");
  const completeRealRes = await fetch(
    `${BASE_URL}/api/opticoach/sessions/${realSessionId}/complete`,
    {
      method: "POST",
      headers: { Cookie: staffCookie },
    }
  );
  assert(completeRealRes.status === 200, "Session completed & AI assessment generated (HTTP 200)");
  const completeRealData = await completeRealRes.json();
  const assessment = completeRealData.assessment;

  assert(
    typeof assessment.overallScore === "number" && assessment.overallScore > 0 && assessment.overallScore <= 100,
    `Overall score generated accurately: ${assessment.overallScore}/100`
  );
  assert(
    ["Exemplary Mastery", "Competency Demonstrated", "Practice Recommended"].includes(assessment.rubricGrade),
    `Rubric grade assigned: "${assessment.rubricGrade}"`
  );
  assert(
    assessment.criteria.length === 6,
    "Assessment contains all 6 required clinical criteria"
  );

  // Verify all 6 criteria details
  for (const criterion of assessment.criteria) {
    assert(
      ASSESSMENT_CRITERIA_KEYS.includes(criterion.criterionId),
      `Criterion key valid: ${criterion.criterionId}`,
      `Score: ${criterion.score}/100, Rubric Level: ${criterion.rubricLevel}`
    );
    assert(
      criterion.evidence && criterion.evidence.length > 5,
      `Evidence documented for ${criterion.criterionName}`,
      `Observed: ${criterion.isEvidenceObserved} | Evidence: "${criterion.evidence.slice(0, 60)}..."`
    );
    assert(
      criterion.whatWentWell && criterion.whatWentWell.length > 5,
      `What went well populated for ${criterion.criterionName}`
    );
    assert(
      criterion.whatCouldImprove && criterion.whatCouldImprove.length > 5,
      `What could improve populated for ${criterion.criterionName}`
    );
    assert(
      criterion.suggestedAlternativeResponse && criterion.suggestedAlternativeResponse.length > 5,
      `Alternative response suggested for ${criterion.criterionName}`,
      `Sample: "${criterion.suggestedAlternativeResponse.slice(0, 60)}..."`
    );
    assert(
      criterion.recommendedFollowUpExercise && criterion.recommendedFollowUpExercise.length > 5,
      `Follow-up exercise recommended for ${criterion.criterionName}`
    );
  }

  // Verify Ethical Disclaimers
  assert(
    assessment.disclaimers &&
      assessment.disclaimers.evidenceVsJudgment.includes("Conversation evidence quotes") &&
      assessment.disclaimers.notObjectiveTruth.includes("not be construed as an infallible or perfectly objective") &&
      assessment.disclaimers.employmentDecisions.includes("NEVER be used as the sole or decisive basis for employment decisions"),
    "All three mandatory ethical and clinical disclaimers present in assessment"
  );

  // --------------------------------------------------------------------------
  // TEST 5: DATABASE PERSISTENCE & CONVERSATION PRESERVATION VERIFICATION
  // --------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("5. Testing PostgreSQL Database Persistence & Integrity");
  console.log("--------------------------------------------------------------------------------");

  const dbSession = await prisma.optiCoachSession.findUnique({
    where: { id: realSessionId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      user: true,
    },
  });

  assert(!!dbSession, "Session successfully retrieved from PostgreSQL database");
  assert(dbSession?.status === "COMPLETED", "Session status is 'COMPLETED'");
  assert(dbSession?.score === assessment.overallScore, `DB score matches AI assessment: ${dbSession?.score}`);
  assert(!!dbSession?.completedAt, `Session completedAt timestamp saved: ${dbSession?.completedAt?.toISOString()}`);
  assert((dbSession?.durationSeconds ?? 0) >= 0, `Session duration saved: ${dbSession?.durationSeconds}s`);
  assert(
    (dbSession?.messages.length ?? 0) >= 5, // Greeting + 2 Staff turns + 2 Customer turns
    `Conversation messages preserved intact in PostgreSQL (${dbSession?.messages.length} messages)`
  );

  // Verify feedbackSummary in DB parses with strict schema
  const parsedDbAssessment = SessionAssessmentSchema.safeParse(
    JSON.parse(dbSession?.feedbackSummary || "{}")
  );
  assert(
    parsedDbAssessment.success,
    "feedbackSummary stored in PostgreSQL is 100% compliant with SessionAssessmentSchema"
  );

  // --------------------------------------------------------------------------
  // TEST 6: PAST SESSION REVIEW & PERMISSION ENFORCEMENT
  // --------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("6. Testing Past Session Review Endpoints & Access Control");
  console.log("--------------------------------------------------------------------------------");

  // Staff reviewing own session
  const staffReviewRes = await fetch(`${BASE_URL}/api/opticoach/sessions/${realSessionId}`, {
    headers: { Cookie: staffCookie },
  });
  assert(staffReviewRes.status === 200, "Staff can review own completed session (HTTP 200)");
  const staffReviewData = await staffReviewRes.json();
  assert(
    staffReviewData.session.id === realSessionId && !!staffReviewData.assessment && !!staffReviewData.scenario,
    "Staff review includes hydrated assessment report and scenario details"
  );

  // Staff attempting to access another user's session
  // Create an owner-owned session first
  const createOwnerSessionRes = await fetch(`${BASE_URL}/api/opticoach/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: ownerCookie,
    },
    body: JSON.stringify({ scenarioId: "sc-polarization-inquiry" }),
  });
  const ownerSessionText = await createOwnerSessionRes.text();
  assert(
    createOwnerSessionRes.status === 201,
    "Created owner-owned session (HTTP 201)",
    `Status: ${createOwnerSessionRes.status}, Body: ${ownerSessionText}`
  );
  const ownerSessionData = JSON.parse(ownerSessionText);
  const ownerSessionId = ownerSessionData.session.id;

  // Staff attempts to complete or review owner's session -> 403
  const staffAccessOwnerRes = await fetch(`${BASE_URL}/api/opticoach/sessions/${ownerSessionId}`, {
    headers: { Cookie: staffCookie },
  });
  assert(
    staffAccessOwnerRes.status === 403,
    "Staff forbidden from viewing another user's session (HTTP 403)"
  );

  const staffCompleteOwnerRes = await fetch(
    `${BASE_URL}/api/opticoach/sessions/${ownerSessionId}/complete`,
    {
      method: "POST",
      headers: { Cookie: staffCookie },
    }
  );
  assert(
    staffCompleteOwnerRes.status === 403,
    "Staff forbidden from evaluating another user's session (HTTP 403)"
  );

  // Owner reviewing staff's completed session -> 200 OK
  const ownerReviewStaffRes = await fetch(`${BASE_URL}/api/opticoach/sessions/${realSessionId}`, {
    headers: { Cookie: ownerCookie },
  });
  assert(
    ownerReviewStaffRes.status === 200,
    "Authorized owner can inspect staff assessment records (HTTP 200)"
  );
  const ownerReviewData = await ownerReviewStaffRes.json();
  assert(
    ownerReviewData.session.user.id === staffUserId,
    "Owner receives staff member attribution in session review",
    `Staff practitioner: ${ownerReviewData.session.user.name}`
  );

  // --------------------------------------------------------------------------
  // TEST 7: RETRY & CONVERSATION PRESERVATION CAPABILITY
  // --------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("7. Testing Assessment Retry & Dialogue Preservation");
  console.log("--------------------------------------------------------------------------------");

  // Calling complete on already saved conversation re-evaluates and succeeds without data loss
  const retryRes = await fetch(`${BASE_URL}/api/opticoach/sessions/${realSessionId}/complete`, {
    method: "POST",
    headers: { Cookie: staffCookie },
  });
  assert(retryRes.status === 200, "Assessment retry on existing session succeeds (HTTP 200)");
  const retryData = await retryRes.json();
  assert(
    retryData.assessment.criteria.length === 6,
    "Retry preserves full 6-criterion assessment structure"
  );

  const afterRetryDbSession = await prisma.optiCoachSession.findUnique({
    where: { id: realSessionId },
    include: { messages: true },
  });
  assert(
    afterRetryDbSession?.messages.length === dbSession?.messages.length,
    "Retry did not duplicate or corrupt conversation messages",
    `Preserved count: ${afterRetryDbSession?.messages.length} messages`
  );

  // --------------------------------------------------------------------------
  // TEST SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`        ALL ${passed}/${total} ASSESSMENT WORKFLOW TESTS PASSED SUCCESSFULLY!`);
  console.log("================================================================================\n");
}

runAssessmentWorkflowTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
