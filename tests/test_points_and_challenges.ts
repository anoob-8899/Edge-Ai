import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { awardPoints, getStaffLeaderboard, getMasteryTier, POINT_VALUES } from "../src/lib/points";
import { evaluateChallengeProgress, getChallengeReport, parseRequirements } from "../src/lib/challenges";
import { NextRequest } from "next/server";
import { POST as staffPointsGuard, PUT as staffPointsPut, PATCH as staffPointsPatch } from "../src/app/api/staff/points/route";
import { POST as staffScoresGuard, PATCH as staffScoresPatch } from "../src/app/api/staff/scores/route";

interface TestReport {
  name: string;
  passed: boolean;
  details?: string;
}

const reports: TestReport[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runPointsAndChallengesTests() {
  console.log("================================================================================");
  console.log("       OPTITRAIN.AI - REAL POINTS & WEEKLY CHALLENGES TEST SUITE       ");
  console.log("================================================================================\n");

  let testOwner: any = null;
  let testStaffA: any = null;
  let testStaffB: any = null;
  let sampleLesson: any = null;

  try {
    // --------------------------------------------------------------------------
    // SETUP: Provision test users and sample lesson in PostgreSQL
    // --------------------------------------------------------------------------
    const passwordHash = await bcrypt.hash("TestPass123!", 10);

    testOwner = await prisma.user.upsert({
      where: { email: "owner_pts_test@apexoptics.com" },
      update: { role: "OWNER", status: "ACTIVE" },
      create: {
        email: "owner_pts_test@apexoptics.com",
        name: "Dr. Elena Frost (Practice Owner)",
        passwordHash,
        role: "OWNER",
        status: "ACTIVE",
        clinicId: "apex-optics-01",
      },
    });

    testStaffA = await prisma.user.upsert({
      where: { email: "staff_pts_a@apexoptics.com" },
      update: { role: "STAFF", status: "ACTIVE", totalPoints: 0 },
      create: {
        email: "staff_pts_a@apexoptics.com",
        name: "Clara Oswald (Dispensing Optician)",
        passwordHash,
        role: "STAFF",
        status: "ACTIVE",
        clinicId: "apex-optics-01",
        totalPoints: 0,
      },
    });

    testStaffB = await prisma.user.upsert({
      where: { email: "staff_pts_b@apexoptics.com" },
      update: { role: "STAFF", status: "ACTIVE", totalPoints: 0 },
      create: {
        email: "staff_pts_b@apexoptics.com",
        name: "Rory Williams (Junior Dispenser)",
        passwordHash,
        role: "STAFF",
        status: "ACTIVE",
        clinicId: "apex-optics-01",
        totalPoints: 0,
      },
    });

    sampleLesson = await prisma.lesson.findFirst();
    if (!sampleLesson) {
      // Find or create dummy lesson if library not yet populated
      const category = await prisma.category.upsert({
        where: { slug: "test-category" },
        update: {},
        create: { slug: "test-category", name: "Test Category", description: "Testing" },
      });
      const subcat = await prisma.subcategory.upsert({
        where: { categoryId_slug: { categoryId: category.id, slug: "test-sub" } },
        update: {},
        create: { categoryId: category.id, slug: "test-sub", name: "Test Subcategory", description: "Testing" },
      });
      sampleLesson = await prisma.lesson.upsert({
        where: { subcategoryId_slug: { subcategoryId: subcat.id, slug: "test-lesson-lens" } },
        update: {},
        create: {
          subcategoryId: subcat.id,
          slug: "test-lesson-lens",
          title: "High-Index Aspheric Lens Design",
          summary: "Optical principles of aspheric surfaces.",
          definitions: "Aspheric geometry reduces peripheral aberrations.",
          characteristics: "Flatter base curves and thinner edges.",
          practicalApplications: "High minus and plus prescription fitting.",
          misconceptions: "Aspheric is not progressive.",
          limitations: "Requires exact optical center height alignment.",
        },
      });
    }

    // Clean up previous test ledger and challenges for clean slate
    await prisma.pointLedger.deleteMany({
      where: { userId: { in: [testStaffA.id, testStaffB.id] } },
    });
    await prisma.challengeProgress.deleteMany({
      where: { userId: { in: [testStaffA.id, testStaffB.id] } },
    });
    await prisma.user.updateMany({
      where: { id: { in: [testStaffA.id, testStaffB.id] } },
      data: { totalPoints: 0 },
    });
  } catch (err: any) {
    console.error("Test environment setup error:", err);
    throw err;
  }

  // ============================================================================
  // TEST 1: Duplicate Submissions & Idempotent Points Awarding
  // ============================================================================
  console.log("--------------------------------------------------------------------------------");
  console.log("1. Testing Duplicate Submissions & Idempotent Points Awarding");
  console.log("--------------------------------------------------------------------------------");
  try {
    const testReference = `lesson-ref-${Date.now()}`;

    // 1A. First submission for lesson completion
    const award1 = await awardPoints({
      userId: testStaffA.id,
      activityType: "LESSON_COMPLETION",
      referenceId: testReference,
      description: `Completed lesson: ${sampleLesson.title}`,
      points: 50,
      metadata: { lessonId: sampleLesson.id },
    });

    assert(award1.awarded === true, "First point award must succeed");
    assert(award1.points === 50, "Points awarded must equal 50");
    assert(award1.newTotalPoints === 50, "User total points must update to 50");
    assert(award1.reason === "SUCCESS", "Reason must be SUCCESS");

    // 1B. Duplicate submission for the SAME completion event
    const award2 = await awardPoints({
      userId: testStaffA.id,
      activityType: "LESSON_COMPLETION",
      referenceId: testReference,
      description: `Completed lesson again: ${sampleLesson.title}`,
      points: 50,
      metadata: { lessonId: sampleLesson.id },
    });

    assert(award2.awarded === false, "Duplicate point award must be rejected");
    assert(award2.points === 0, "No duplicate points should be awarded");
    assert(award2.newTotalPoints === 50, "Total points must remain 50");
    assert(award2.reason === "ALREADY_AWARDED", "Reason must be ALREADY_AWARDED");

    // 1C. Verify database state: exactly 1 row in PointLedger
    const ledgerEntries = await prisma.pointLedger.findMany({
      where: {
        userId: testStaffA.id,
        activityType: "LESSON_COMPLETION",
        referenceId: testReference,
      },
    });
    assert(ledgerEntries.length === 1, "PointLedger must contain exactly 1 entry (no duplicate rows)");

    // 1D. Verify User.totalPoints in PostgreSQL
    const freshStaffA = await prisma.user.findUnique({
      where: { id: testStaffA.id },
      select: { totalPoints: true },
    });
    assert(freshStaffA?.totalPoints === 50, "Database user totalPoints must be strictly 50");

    reports.push({
      name: "1. Duplicate Submissions & Idempotency",
      passed: true,
      details: "Verified first award (+50 pts) succeeds while identical second submission is safely rejected with ALREADY_AWARDED.",
    });
    console.log("[PASSED] ✓ Duplicate submission prevented with zero point inflation.\n");
  } catch (e: any) {
    reports.push({
      name: "1. Duplicate Submissions & Idempotency",
      passed: false,
      details: e.message,
    });
    console.error(`[FAILED] ✗ Duplicate submission test failed: ${e.message}\n`);
  }

  // ============================================================================
  // TEST 2: Concurrent Requests & Race Condition Prevention
  // ============================================================================
  console.log("--------------------------------------------------------------------------------");
  console.log("2. Testing Concurrent Requests & Race Condition Prevention");
  console.log("--------------------------------------------------------------------------------");
  try {
    const concurrentReference = `concurrent-sim-${Date.now()}`;
    const concurrentCount = 10;

    // Fire 10 simultaneous requests to award points for the same simulation completion
    const requests = Array.from({ length: concurrentCount }, (_, i) =>
      awardPoints({
        userId: testStaffA.id,
        activityType: "OPTICOACH_COMPLETED",
        referenceId: concurrentReference,
        points: 150,
        description: `OptiCoach consultation simulation #${i + 1}`,
      })
    );

    const outcomes = await Promise.all(requests);

    const successes = outcomes.filter((o) => o.awarded === true);
    const rejected = outcomes.filter((o) => o.awarded === false);

    assert(
      successes.length === 1,
      `Exactly 1 concurrent request must succeed. Found: ${successes.length}`
    );
    assert(
      rejected.length === concurrentCount - 1,
      `Exactly ${concurrentCount - 1} concurrent requests must be rejected. Found: ${rejected.length}`
    );

    // Verify all rejected had reason ALREADY_AWARDED
    for (const rej of rejected) {
      assert(rej.reason === "ALREADY_AWARDED", "Concurrent duplicate reason must be ALREADY_AWARDED");
      assert(rej.points === 0, "Rejected points must be 0");
    }

    // Verify ledger in PostgreSQL
    const concurrentLedger = await prisma.pointLedger.findMany({
      where: {
        userId: testStaffA.id,
        activityType: "OPTICOACH_COMPLETED",
        referenceId: concurrentReference,
      },
    });
    assert(
      concurrentLedger.length === 1,
      "PostgreSQL unique constraint guarantees exactly 1 ledger record under concurrent assault"
    );

    // Verify total points updated by exactly 150 (50 from test 1 + 150 = 200)
    const staffAfterConcurrent = await prisma.user.findUnique({
      where: { id: testStaffA.id },
      select: { totalPoints: true },
    });
    assert(
      staffAfterConcurrent?.totalPoints === 200,
      `User totalPoints must be 200, received ${staffAfterConcurrent?.totalPoints}`
    );

    reports.push({
      name: "2. Concurrent Requests & Race Condition Prevention",
      passed: true,
      details: `10 simultaneous concurrent requests fired; exactly 1 succeeded, 9 safely blocked by PostgreSQL transaction & unique constraint.`,
    });
    console.log("[PASSED] ✓ Race conditions tested: exactly 1 award granted across 10 concurrent requests.\n");
  } catch (e: any) {
    reports.push({
      name: "2. Concurrent Requests & Race Condition Prevention",
      passed: false,
      details: e.message,
    });
    console.error(`[FAILED] ✗ Concurrent requests test failed: ${e.message}\n`);
  }

  // ============================================================================
  // TEST 3: Unauthorized Point Changes & Assessment Score Protection
  // ============================================================================
  console.log("--------------------------------------------------------------------------------");
  console.log("3. Testing Unauthorized Point Changes & Assessment Score Protection");
  console.log("--------------------------------------------------------------------------------");
  try {
    // 3A. Test staff points security guard endpoint
    const postReq = new NextRequest("http://localhost:3000/api/staff/points", {
      method: "POST",
      body: JSON.stringify({ points: 5000, reason: "Self-awarded bonus" }),
    });
    const postRes = await staffPointsGuard(postReq);
    assert(postRes.status === 403, "Direct POST to /api/staff/points must return HTTP 403 Forbidden");

    const postData = await postRes.json();
    assert(
      postData.code === "DIRECT_POINTS_MODIFICATION_FORBIDDEN",
      "Error code must be DIRECT_POINTS_MODIFICATION_FORBIDDEN"
    );

    // 3B. Test PATCH to /api/staff/points
    const patchReq = new NextRequest("http://localhost:3000/api/staff/points", {
      method: "PATCH",
      body: JSON.stringify({ points: 999 }),
    });
    const patchRes = await staffPointsPatch(patchReq);
    assert(patchRes.status === 403, "Direct PATCH to /api/staff/points must return HTTP 403 Forbidden");

    // 3C. Test staff scores security guard endpoint
    const scoreReq = new NextRequest("http://localhost:3000/api/staff/scores", {
      method: "POST",
      body: JSON.stringify({ score: 100, scenarioId: "test" }),
    });
    const scoreRes = await staffScoresGuard(scoreReq);
    assert(scoreRes.status === 403, "Direct POST to /api/staff/scores must return HTTP 403 Forbidden");

    const scoreData = await scoreRes.json();
    assert(
      scoreData.code === "DIRECT_SCORE_MODIFICATION_FORBIDDEN",
      "Error code must be DIRECT_SCORE_MODIFICATION_FORBIDDEN"
    );

    // 3D. Test PATCH to /api/staff/scores
    const scorePatchReq = new NextRequest("http://localhost:3000/api/staff/scores", {
      method: "PATCH",
      body: JSON.stringify({ score: 98 }),
    });
    const scorePatchRes = await staffScoresPatch(scorePatchReq);
    assert(scorePatchRes.status === 403, "Direct PATCH to /api/staff/scores must return HTTP 403 Forbidden");

    // 3E. Verify audit log was recorded for security breach attempts
    const auditAttempts = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ["UNAUTHORIZED_POINTS_MODIFICATION_ATTEMPT", "UNAUTHORIZED_SCORE_MODIFICATION_ATTEMPT"],
        },
      },
    });
    assert(auditAttempts.length >= 2, "Audit logs must record unauthorized modification attempts");

    reports.push({
      name: "3. Unauthorized Point & Score Changes Protection",
      passed: true,
      details: "Verified HTTP 403 Forbidden on all direct point/score manipulation endpoints with immutable security audit logging.",
    });
    console.log("[PASSED] ✓ Unauthorized point and score edits strictly blocked with audit logging.\n");
  } catch (e: any) {
    reports.push({
      name: "3. Unauthorized Point & Score Changes Protection",
      passed: false,
      details: e.message,
    });
    console.error(`[FAILED] ✗ Unauthorized point change test failed: ${e.message}\n`);
  }

  // ============================================================================
  // TEST 4: Leaderboard Calculations & Mastery Tier Thresholds
  // ============================================================================
  console.log("--------------------------------------------------------------------------------");
  console.log("4. Testing Leaderboard Calculations & Mastery Tier Thresholds");
  console.log("--------------------------------------------------------------------------------");
  try {
    // 4A. Verify Mastery Tier function
    const tier1 = getMasteryTier(50);
    assert(tier1.tierName === "Apprentice Optician" && tier1.level === 1, "0-199 pts is Apprentice Optician");

    const tier2 = getMasteryTier(250);
    assert(tier2.tierName === "Certified Optical Dispenser" && tier2.level === 2, "200-499 pts is Certified Optical Dispenser");

    const tier3 = getMasteryTier(650);
    assert(tier3.tierName === "Senior Refractionist" && tier3.level === 3, "500-999 pts is Senior Refractionist");

    const tier4 = getMasteryTier(1250);
    assert(tier4.tierName === "Master Optical Specialist" && tier4.level === 4, "1000+ pts is Master Optical Specialist");

    // 4B. Award points to Staff B so we have different ranks
    // Staff A currently has 200 pts. Let's give Staff B 350 pts
    await awardPoints({
      userId: testStaffB.id,
      activityType: "LESSON_COMPLETION",
      referenceId: `b-lesson-${Date.now()}`,
      points: 100,
      description: "Completed lesson 1",
    });
    await awardPoints({
      userId: testStaffB.id,
      activityType: "QUIZ_PASSED",
      referenceId: `b-quiz-${Date.now()}`,
      points: 250,
      description: "Passed progressive lens fitting quiz",
    });

    // 4C. Fetch leaderboard
    const leaderboard = await getStaffLeaderboard();
    assert(leaderboard.length >= 2, "Leaderboard must include both test staff");

    // Find staff in leaderboard
    const entryB = leaderboard.find((e) => e.userId === testStaffB.id);
    const entryA = leaderboard.find((e) => e.userId === testStaffA.id);

    assert(Boolean(entryB && entryA), "Both test staff members must be present on leaderboard");
    assert(entryB!.totalPoints === 350, `Staff B total points must be 350, received ${entryB!.totalPoints}`);
    assert(entryA!.totalPoints === 200, `Staff A total points must be 200, received ${entryA!.totalPoints}`);

    // Verify Staff B is ranked higher than Staff A
    assert(entryB!.rank < entryA!.rank, `Staff B (rank ${entryB!.rank}) must be ranked ahead of Staff A (rank ${entryA!.rank})`);

    // 4D. Verify 100% parity between PointLedger sum and leaderboard points for every single participant
    for (const participant of leaderboard) {
      const ledgerSum = await prisma.pointLedger.aggregate({
        where: { userId: participant.userId },
        _sum: { points: true },
      });
      const expectedTotal = ledgerSum._sum.points || 0;
      assert(
        participant.totalPoints === expectedTotal,
        `Ledger audit parity mismatch for ${participant.name}: reported ${participant.totalPoints}, ledger sum ${expectedTotal}`
      );
    }

    reports.push({
      name: "4. Leaderboard Calculations & Mastery Tiers",
      passed: true,
      details: "Verified exact descending sort by points, 4-tier mastery hierarchy, and 100% audit parity against PostgreSQL PointLedger.",
    });
    console.log("[PASSED] ✓ Leaderboard rankings and mastery tiers verified with 100% ledger parity.\n");
  } catch (e: any) {
    reports.push({
      name: "4. Leaderboard Calculations & Mastery Tiers",
      passed: false,
      details: e.message,
    });
    console.error(`[FAILED] ✗ Leaderboard test failed: ${e.message}\n`);
  }

  // ============================================================================
  // TEST 5: Challenge Deadlines & Status Transitions
  // ============================================================================
  console.log("--------------------------------------------------------------------------------");
  console.log("5. Testing Challenge Deadlines & Status Transitions");
  console.log("--------------------------------------------------------------------------------");
  let activeChallenge: any = null;
  let expiredChallenge: any = null;
  try {
    const now = new Date();

    // 5A. Create an EXPIRED weekly challenge (deadline: -2 days ago)
    expiredChallenge = await prisma.weeklyChallenge.create({
      data: {
        creatorId: testOwner.id,
        title: "Expired Optical Heritage Sprint",
        description: "This challenge deadline has already passed.",
        startDate: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000), // started 9 days ago
        endDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // ended 2 days ago
        pointsReward: 500,
        isActive: true,
        requirements: {
          requiredLessons: 1,
          requiredQuizzes: 0,
          requiredSimulations: 0,
        },
      },
    });

    // 5B. Evaluate Staff A for expired challenge
    const expiredEval = await evaluateChallengeProgress(testStaffA.id);
    const expiredRecord = await prisma.challengeProgress.findUnique({
      where: {
        challengeId_userId: {
          challengeId: expiredChallenge.id,
          userId: testStaffA.id,
        },
      },
    });
    assert(expiredRecord?.status === "EXPIRED", "Incomplete challenge with past deadline must be marked EXPIRED");
    assert(expiredRecord?.isCompleted === false, "Expired challenge cannot be completed");
    assert(expiredRecord?.pointsAwarded === false, "No points should be awarded for expired challenge");

    // 5C. Create an ACTIVE weekly challenge (deadline: +7 days)
    activeChallenge = await prisma.weeklyChallenge.create({
      data: {
        creatorId: testOwner.id,
        title: "Active Presbyopia Progressive Sprint",
        description: "Master progressive fitting and pass 1 quiz before Sunday.",
        startDate: new Date(now.getTime() - 1000 * 60 * 60), // started 1 hour ago
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // ends in 7 days
        pointsReward: 300,
        isActive: true,
        requirements: {
          requiredLessons: 1,
          requiredQuizzes: 1,
          requiredSimulations: 0,
        },
      },
    });

    // 5D. Fulfill requirements for ACTIVE challenge
    // Requirement: 1 lesson completed in window + 1 quiz passed in window
    await prisma.userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: testStaffA.id,
          lessonId: sampleLesson.id,
        },
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
      },
      create: {
        userId: testStaffA.id,
        lessonId: sampleLesson.id,
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    await prisma.quizAttempt.create({
      data: {
        userId: testStaffA.id,
        lessonId: sampleLesson.id,
        score: 5,
        totalQuestions: 5,
        passed: true,
        answers: "{}",
        createdAt: new Date(),
      },
    });

    // Evaluate active challenge
    const activeEval = await evaluateChallengeProgress(testStaffA.id);
    const matchedActive = activeEval.find((r) => r.challengeId === activeChallenge.id);

    assert(Boolean(matchedActive), "Evaluation must return status for active challenge");
    assert(matchedActive?.isCompleted === true, "Challenge must be completed when requirements are met before deadline");
    assert(matchedActive?.pointsAwarded === 300, "Must award challenge reward of 300 points");

    // Verify progress in PostgreSQL
    const activeRecord = await prisma.challengeProgress.findUnique({
      where: {
        challengeId_userId: {
          challengeId: activeChallenge.id,
          userId: testStaffA.id,
        },
      },
    });
    assert(activeRecord?.status === "COMPLETED", "Status in database must be COMPLETED");
    assert(activeRecord?.pointsAwarded === true, "pointsAwarded flag must be true");

    // 5E. Re-evaluating immediately afterwards should be idempotent and not award bonus again
    const repeatEval = await evaluateChallengeProgress(testStaffA.id);
    const repeatActive = repeatEval.find((r) => r.challengeId === activeChallenge.id);
    assert(repeatActive?.alreadyCompleted === true, "Repeated evaluation must recognize alreadyCompleted: true");

    reports.push({
      name: "5. Challenge Deadlines & Status Transitions",
      passed: true,
      details: "Verified active challenge completion (+300 pts) before deadline and strict EXPIRED status blocking past-deadline bonuses.",
    });
    console.log("[PASSED] ✓ Challenge deadlines and status transitions verified.\n");
  } catch (e: any) {
    reports.push({
      name: "5. Challenge Deadlines & Status Transitions",
      passed: false,
      details: e.message,
    });
    console.error(`[FAILED] ✗ Challenge deadlines test failed: ${e.message}\n`);
  }

  // ============================================================================
  // TEST 6: Persistent Auditable Ledger & Owner Reports on Challenge Completion
  // ============================================================================
  console.log("--------------------------------------------------------------------------------");
  console.log("6. Testing Persistent Auditable Ledger & Owner Reports");
  console.log("--------------------------------------------------------------------------------");
  try {
    // 6A. Verify PointLedger persistence in PostgreSQL
    const allStaffALedger = await prisma.pointLedger.findMany({
      where: { userId: testStaffA.id },
      orderBy: { createdAt: "desc" },
    });

    assert(allStaffALedger.length >= 3, `Expected at least 3 ledger entries for Staff A, found ${allStaffALedger.length}`);

    // Every entry must have valid non-null fields
    for (const entry of allStaffALedger) {
      assert(Boolean(entry.id), "Ledger entry must have unique id");
      assert(Boolean(entry.userId), "Ledger entry must have userId");
      assert(Boolean(entry.activityType), "Ledger entry must have activityType");
      assert(Boolean(entry.referenceId), "Ledger entry must have referenceId");
      assert(Boolean(entry.description), "Ledger entry must have description");
      assert(entry.points > 0, "Ledger entry points must be positive");
      assert(Boolean(entry.createdAt), "Ledger entry must have immutable timestamp");
    }

    // Check challenge completion ledger entry exists
    const challengeLedgerEntry = allStaffALedger.find(
      (e) => e.activityType === "CHALLENGE_COMPLETED" && e.referenceId === activeChallenge.id
    );
    assert(Boolean(challengeLedgerEntry), "PointLedger must contain challenge completion bonus record");
    assert(challengeLedgerEntry?.points === 300, "Challenge bonus must be 300 points");

    // 6B. Generate full Owner Challenge Completion Report
    const report = await getChallengeReport(activeChallenge.id);
    assert(Boolean(report), "Owner challenge report must be generated");
    assert(report?.metrics.totalStaff >= 2, "Report must reflect total active staff opticians");
    assert(report?.metrics.completedCount >= 1, "Report must count completed staff opticians");
    assert(report?.metrics.completionRate > 0, "Report must calculate real completion percentage");

    // Check staff report item
    const staffAReport = report?.staffReport.find((s) => s.staffId === testStaffA.id);
    assert(Boolean(staffAReport), "Staff A must appear in owner completion breakdown");
    assert(staffAReport?.isCompleted === true, "Staff A must be marked isCompleted: true");
    assert(staffAReport?.pointsAwarded === 300, "Staff A pointsAwarded must be 300");
    assert(Boolean(staffAReport?.completedAt), "Staff A completedAt timestamp must be recorded");

    reports.push({
      name: "6. Persistent Auditable Ledger & Owner Reports",
      passed: true,
      details: "Verified persistent PostgreSQL PointLedger records with complete metadata and real-time owner challenge completion reports.",
    });
    console.log("[PASSED] ✓ Persistent auditable ledger and owner challenge reports verified.\n");
  } catch (e: any) {
    reports.push({
      name: "6. Persistent Auditable Ledger & Owner Reports",
      passed: false,
      details: e.message,
    });
    console.error(`[FAILED] ✗ Persistent ledger test failed: ${e.message}\n`);
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("================================================================================");
  console.log("                           TEST EXECUTION SUMMARY                               ");
  console.log("================================================================================");
  let allPassed = true;
  for (const rep of reports) {
    const symbol = rep.passed ? "[PASSED] ✓" : "[FAILED] ✗";
    console.log(`${symbol} ${rep.name}`);
    if (rep.details) console.log(`         ${rep.details}`);
    if (!rep.passed) allPassed = false;
  }
  console.log("================================================================================");
  if (allPassed) {
    console.log("RESULT: ALL 6 POINTS & WEEKLY CHALLENGE TEST SUITES PASSED PERFECTLY!");
  } else {
    console.error("RESULT: SOME TESTS FAILED.");
    process.exit(1);
  }
  console.log("================================================================================\n");

  await prisma.$disconnect();
}

runPointsAndChallengesTests().catch(async (e) => {
  console.error("Fatal test runner error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
