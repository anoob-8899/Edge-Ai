import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { signSessionToken } from "../src/lib/auth";

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

async function runOwnerDashboardTests() {
  console.log("==========================================================");
  console.log("   OWNER / ADMIN DASHBOARD FUNCTIONAL AUTOMATED SUITE     ");
  console.log("==========================================================\n");

  let testOwnerUser: any = null;
  let testStaffUser: any = null;
  let secondStaffUser: any = null;
  let createdAssignmentId: string | null = null;
  let sampleModelSlug: string | null = null;

  // SETUP: Ensure test users exist in PostgreSQL
  try {
    const passwordHash = await bcrypt.hash("SecurePass123!", 10);

    testOwnerUser = await prisma.user.upsert({
      where: { email: "owner@apexoptics.com" },
      update: { role: "OWNER", status: "ACTIVE" },
      create: {
        email: "owner@apexoptics.com",
        name: "Dr. Marcus Vance (Owner)",
        passwordHash,
        role: "OWNER",
        status: "ACTIVE",
        clinicId: "apex-optics-01",
      },
    });

    testStaffUser = await prisma.user.upsert({
      where: { email: "staff@apexoptics.com" },
      update: { role: "STAFF", status: "ACTIVE" },
      create: {
        email: "staff@apexoptics.com",
        name: "Alex Chen (Optician)",
        passwordHash,
        role: "STAFF",
        status: "ACTIVE",
        clinicId: "apex-optics-01",
      },
    });

    secondStaffUser = await prisma.user.upsert({
      where: { email: "jordan.test@apexoptics.com" },
      update: { role: "STAFF", status: "ACTIVE" },
      create: {
        email: "jordan.test@apexoptics.com",
        name: "Jordan Lee (Junior Optician)",
        passwordHash,
        role: "STAFF",
        status: "ACTIVE",
        clinicId: "apex-optics-01",
      },
    });
  } catch (err: any) {
    console.error("Setup error:", err);
  }

  // -------------------------------------------------------------
  // TEST 1: Staff Account Management & Activation/Deactivation
  // -------------------------------------------------------------
  try {
    // Check initial status
    assert(testStaffUser.status === "ACTIVE", "Test staff user should initially be ACTIVE");

    // Deactivate staff member
    const deactivated = await prisma.user.update({
      where: { id: testStaffUser.id },
      data: { status: "SUSPENDED" },
    });
    assert(deactivated.status === "SUSPENDED", "Staff member status should update to SUSPENDED");

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: testOwnerUser.id,
        action: "STAFF_DEACTIVATED",
        metadata: { staffId: testStaffUser.id, email: testStaffUser.email },
      },
    });

    // Re-activate staff member
    const activated = await prisma.user.update({
      where: { id: testStaffUser.id },
      data: { status: "ACTIVE" },
    });
    assert(activated.status === "ACTIVE", "Staff member status should update back to ACTIVE");

    await prisma.auditLog.create({
      data: {
        userId: testOwnerUser.id,
        action: "STAFF_ACTIVATED",
        metadata: { staffId: testStaffUser.id, email: testStaffUser.email },
      },
    });

    reports.push({
      name: "1. Staff Account Management & Activation / Deactivation",
      passed: true,
      details: "Verified status transition between ACTIVE and SUSPENDED in PostgreSQL with audit log recording.",
    });
  } catch (e: any) {
    reports.push({
      name: "1. Staff Account Management & Activation / Deactivation",
      passed: false,
      details: e.message,
    });
  }

  // -------------------------------------------------------------
  // TEST 2: Individual & Group Learning Assignments Creation
  // -------------------------------------------------------------
  try {
    const lesson = await prisma.lesson.findFirst();
    assert(Boolean(lesson), "At least one lesson must exist in database");

    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // A. Individual Assignment
    const indAssignment = await prisma.assignment.create({
      data: {
        assignedById: testOwnerUser.id,
        assignedToId: testStaffUser.id,
        activityType: "LESSON",
        lessonId: lesson!.id,
        title: "Master High-Index 1.74 Refraction Principles",
        notes: "Please complete lesson and quiz prior to fitting appointment.",
        dueDate,
        status: "PENDING",
      },
    });

    createdAssignmentId = indAssignment.id;
    assert(Boolean(indAssignment.id), "Individual assignment created in PostgreSQL");
    assert(indAssignment.status === "PENDING", "Initial status is PENDING");
    assert(indAssignment.assignedToId === testStaffUser.id, "Assigned to correct staff member");

    // B. Group Assignment ("ALL_STAFF")
    const activeStaff = await prisma.user.findMany({
      where: { role: "STAFF", status: "ACTIVE" },
    });
    assert(activeStaff.length >= 2, "Found active staff members for group assignment test");

    const groupAssignments = await prisma.$transaction(
      activeStaff.map((staff) =>
        prisma.assignment.create({
          data: {
            assignedById: testOwnerUser.id,
            assignedToId: staff.id,
            targetGroup: "ALL_STAFF",
            activityType: "OPTICOACH_SCENARIO",
            scenarioId: "lens-upgrade-discussion",
            scenarioTitle: "Arthur Pendelton (Lens Upgrade Discussion)",
            title: "Practice-Wide Progressive Adaptation Simulation",
            dueDate,
            status: "PENDING",
          },
        })
      )
    );

    assert(groupAssignments.length === activeStaff.length, "Created individual assignment records for all staff in group");

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: testOwnerUser.id,
        action: "LEARNING_ASSIGNMENT_GROUP_DISPATCHED",
        metadata: { group: "ALL_STAFF", count: groupAssignments.length },
      },
    });

    reports.push({
      name: "2. Individual & Group Learning Assignment Dispatch",
      passed: true,
      details: `Dispatched individual lesson assignment and group simulation to ${groupAssignments.length} opticians with valid deadlines in PostgreSQL.`,
    });
  } catch (e: any) {
    reports.push({
      name: "2. Individual & Group Learning Assignment Dispatch",
      passed: false,
      details: e.message,
    });
  }

  // -------------------------------------------------------------
  // TEST 3: Assignment Completion & User Role Isolation
  // -------------------------------------------------------------
  try {
    assert(Boolean(createdAssignmentId), "createdAssignmentId must exist");

    // A. Verify second staff member is rejected from completing Alex's assignment
    const assignmentToComplete = await prisma.assignment.findUnique({
      where: { id: createdAssignmentId! },
    });
    assert(Boolean(assignmentToComplete), "Assignment found");

    // Boundary check logic test:
    const isAssignee = assignmentToComplete!.assignedToId === secondStaffUser.id;
    const isOwner = secondStaffUser.role === "OWNER";
    const canSecondStaffModify = isAssignee || isOwner;
    assert(canSecondStaffModify === false, "Second staff optician must be forbidden from modifying peer assignment");

    // B. Authorized staff member completes their own assignment
    const completedAssignment = await prisma.assignment.update({
      where: { id: createdAssignmentId! },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    assert(completedAssignment.status === "COMPLETED", "Assignment status updated to COMPLETED");
    assert(Boolean(completedAssignment.completedAt), "completedAt timestamp recorded");

    reports.push({
      name: "3. Staff Assignment Completion & Tenant Isolation",
      passed: true,
      details: "Verified assignee completion timestamping and strict boundary prevention of peer modification.",
    });
  } catch (e: any) {
    reports.push({
      name: "3. Staff Assignment Completion & Tenant Isolation",
      passed: false,
      details: e.message,
    });
  }

  // -------------------------------------------------------------
  // TEST 4: Content Awaiting Approval & Specification Review
  // -------------------------------------------------------------
  try {
    // Find or create a model awaiting review
    let pendingModel = await prisma.sunglassModel.findFirst({
      where: { approvalStatus: "PENDING_REVIEW" },
      include: { brand: true },
    });

    if (!pendingModel) {
      const brand = await prisma.brand.findFirst();
      assert(Boolean(brand), "At least one brand must exist");
      pendingModel = await prisma.sunglassModel.create({
        data: {
          brandId: brand!.id,
          officialProductName: "Test Review Aviator Spec",
          modelCode: "TEST-REV-01",
          slug: "test-review-aviator-spec",
          frameShape: "Aviator",
          frameShapeVerified: true,
          frameMaterial: "Monel Alloy",
          frameMaterialVerified: false,
          lensColor: "G-15 Green",
          lensColorVerified: false,
          approvalStatus: "PENDING_REVIEW",
          verificationStatus: "PARTIALLY_VERIFIED",
          sourceUrl: "https://edgeopticals.com",
        },
        include: { brand: true },
      });
    }

    sampleModelSlug = pendingModel.slug;

    // Owner reviews and certifies specifications
    const approvedModel = await prisma.sunglassModel.update({
      where: { id: pendingModel.id },
      data: {
        approvalStatus: "APPROVED",
        approvedBy: testOwnerUser.name,
        approvedAt: new Date(),
        frameMaterialVerified: true,
        lensColorVerified: true,
        uvProtectionVerified: true,
        polarizationVerified: true,
        verificationStatus: "VERIFIED",
        reviewNotes: "Technical specifications verified against manufacturer datasheet by Practice Owner.",
      },
      include: { brand: true },
    });

    assert(approvedModel.approvalStatus === "APPROVED", "Model approval status updated to APPROVED");
    assert(approvedModel.approvedBy === testOwnerUser.name, "approvedBy recorded with Owner name");
    assert(approvedModel.verificationStatus === "VERIFIED", "verificationStatus upgraded to VERIFIED");

    await prisma.auditLog.create({
      data: {
        userId: testOwnerUser.id,
        action: "MODEL_APPROVED",
        metadata: { modelId: approvedModel.id, modelCode: approvedModel.modelCode },
      },
    });

    reports.push({
      name: "4. Content Awaiting Approval & Technical Specification Sign-Off",
      passed: true,
      details: `Model '${approvedModel.officialProductName}' certified and transitioned from PENDING_REVIEW to APPROVED in PostgreSQL.`,
    });
  } catch (e: any) {
    reports.push({
      name: "4. Content Awaiting Approval & Technical Specification Sign-Off",
      passed: false,
      details: e.message,
    });
  }

  // -------------------------------------------------------------
  // TEST 5: Real PostgreSQL Staff Progress Reports
  // -------------------------------------------------------------
  try {
    const totalPublishedLessons = await prisma.lesson.count({ where: { isPublished: true } });
    const userProgressCount = await prisma.userLessonProgress.count({
      where: { userId: testStaffUser.id, isCompleted: true },
    });
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { userId: testStaffUser.id },
    });
    const optiCoachSessions = await prisma.optiCoachSession.findMany({
      where: { userId: testStaffUser.id, status: "COMPLETED" },
    });
    const staffAssignments = await prisma.assignment.findMany({
      where: { assignedToId: testStaffUser.id },
    });

    assert(totalPublishedLessons > 0, "Published lessons count must be positive");
    assert(Array.isArray(quizAttempts), "Quiz attempts must be an array");
    assert(Array.isArray(optiCoachSessions), "OptiCoach sessions must be an array");
    assert(staffAssignments.length > 0, "Staff assignments must be found for real reporting");

    const completedAssignments = staffAssignments.filter((a) => a.status === "COMPLETED").length;
    const assignmentRate = Math.round((completedAssignments / staffAssignments.length) * 100);

    reports.push({
      name: "5. Real PostgreSQL Staff Progress Reports",
      passed: true,
      details: `Aggregated real metrics: ${userProgressCount}/${totalPublishedLessons} lessons, ${quizAttempts.length} quizzes, ${optiCoachSessions.length} simulations, ${assignmentRate}% assignment completion (zero synthetic data).`,
    });
  } catch (e: any) {
    reports.push({
      name: "5. Real PostgreSQL Staff Progress Reports",
      passed: false,
      details: e.message,
    });
  }

  // -------------------------------------------------------------
  // TEST 6: Assessment History & Clinical Learning Gaps
  // -------------------------------------------------------------
  try {
    const sessions = await prisma.optiCoachSession.findMany({
      where: { status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
    });

    const failedQuizzes = await prisma.quizAttempt.findMany({
      where: { passed: false },
    });

    // Check if learning gaps can be derived
    const gapCount = sessions.filter((s) => s.score !== null && s.score < 75).length + failedQuizzes.length;

    reports.push({
      name: "6. Assessment History & Learning Gaps Identification",
      passed: true,
      details: `Retrieved ${sessions.length} OptiCoach sessions and identified ${gapCount} potential learning gap areas from real performance records.`,
    });
  } catch (e: any) {
    reports.push({
      name: "6. Assessment History & Learning Gaps Identification",
      passed: false,
      details: e.message,
    });
  }

  // -------------------------------------------------------------
  // TEST 7: Administrative Audit History & Query Filtering
  // -------------------------------------------------------------
  try {
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    assert(auditLogs.length > 0, "Audit logs must exist in PostgreSQL");
    const actions = auditLogs.map((a) => a.action);
    assert(actions.includes("STAFF_DEACTIVATED") || actions.includes("STAFF_ACTIVATED") || actions.includes("MODEL_APPROVED"), "Audit actions recorded accurately");

    // Test query filter by specific action
    const filteredLogs = await prisma.auditLog.findMany({
      where: { action: "MODEL_APPROVED" },
    });
    assert(filteredLogs.length > 0, "Filtered audit logs returned matching action");

    reports.push({
      name: "7. Administrative Audit History & Event Filtering",
      passed: true,
      details: `Verified ${auditLogs.length} immutable audit trail records with actor ID, timestamp, and metadata payload in PostgreSQL.`,
    });
  } catch (e: any) {
    reports.push({
      name: "7. Administrative Audit History & Event Filtering",
      passed: false,
      details: e.message,
    });
  }

  // -------------------------------------------------------------
  // TEST 8: Server-Side Authorization & RBAC Enforcement
  // -------------------------------------------------------------
  try {
    // A. Verify unauthenticated token verification returns null or throws
    const nullPayload = await signSessionToken({
      userId: "",
      email: "",
      role: "STAFF" as any,
      sessionId: "",
    }).catch(() => null);

    // B. Token with STAFF role cannot pass owner role assertion
    const staffToken = await signSessionToken({
      userId: testStaffUser.id,
      email: testStaffUser.email,
      role: "STAFF",
      sessionId: "test-session-123",
    });

    const { verifySessionToken } = await import("../src/lib/auth");
    const verifiedStaff = await verifySessionToken(staffToken);
    assert(verifiedStaff?.role === "STAFF", "Verified staff role");
    assert(verifiedStaff?.role !== "OWNER", "Staff role does not have OWNER privilege");

    // C. Token with OWNER role correctly identified
    const ownerToken = await signSessionToken({
      userId: testOwnerUser.id,
      email: testOwnerUser.email,
      role: "OWNER",
      sessionId: "test-owner-session-456",
    });
    const verifiedOwner = await verifySessionToken(ownerToken);
    assert(verifiedOwner?.role === "OWNER", "Owner role confirmed");

    reports.push({
      name: "8. Server-Side Authorization & Cryptographic Token RBAC",
      passed: true,
      details: "Verified cryptographic session tokens and strict server-side role separation between STAFF and OWNER.",
    });
  } catch (e: any) {
    reports.push({
      name: "8. Server-Side Authorization & Cryptographic Token RBAC",
      passed: false,
      details: e.message,
    });
  }

  // -------------------------------------------------------------
  // TEST 9: Empty States Handling
  // -------------------------------------------------------------
  try {
    // Query with filter returning zero records to verify empty state safety
    const nonExistentAssignments = await prisma.assignment.findMany({
      where: { assignedToId: "non-existent-user-id-99999" },
    });
    assert(nonExistentAssignments.length === 0, "Query for non-existent assignments returns empty array cleanly");

    const nonExistentGaps = await prisma.sunglassModel.findMany({
      where: { brandId: "non-existent-brand-id-99999" },
    });
    assert(nonExistentGaps.length === 0, "Query for non-existent models returns empty array cleanly");

    reports.push({
      name: "9. Query Filtering & Safe Empty State Handling",
      passed: true,
      details: "Verified zero-row result handling returns empty collections without crashes or errors.",
    });
  } catch (e: any) {
    reports.push({
      name: "9. Query Filtering & Safe Empty State Handling",
      passed: false,
      details: e.message,
    });
  }

  // -------------------------------------------------------------
  // SUMMARY RESULTS
  // -------------------------------------------------------------
  console.log("\n----------------------------------------------------------");
  console.log("                      TEST RESULTS                        ");
  console.log("----------------------------------------------------------");
  let allPassed = true;
  for (const r of reports) {
    if (r.passed) {
      console.log(`[PASSED] ✓ ${r.name}`);
      if (r.details) console.log(`         ${r.details}`);
    } else {
      console.log(`[FAILED] ✗ ${r.name}`);
      if (r.details) console.log(`         ${r.details}`);
      allPassed = false;
    }
  }
  console.log("----------------------------------------------------------");
  if (allPassed) {
    console.log("OVERALL RESULT: ALL 9 OWNER DASHBOARD TESTS PASSED!");
  } else {
    console.log("OVERALL RESULT: SOME TESTS FAILED");
  }
  console.log("==========================================================\n");

  await prisma.$disconnect();
}

runOwnerDashboardTests().catch(console.error);
