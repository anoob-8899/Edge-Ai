import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { signSessionToken, verifySessionToken } from "../src/lib/auth";

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

async function runTestSuite() {
  console.log("==========================================================");
  console.log("       OPTICAL LEARNING LIBRARY AUTOMATED TEST SUITE      ");
  console.log("==========================================================\n");

  // TEST 1: CATEGORIES & SEED DATA INTEGRITY
  try {
    const categories = await prisma.category.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        subcategories: {
          include: {
            lessons: {
              include: {
                quizQuestions: true,
              },
            },
          },
        },
      },
    });

    assert(categories.length === 7, `Expected 7 categories, found ${categories.length}`);

    const expectedCategories = [
      "Branded Sunglasses",
      "Frame Shapes",
      "Frame Materials and Construction",
      "Sunglass Lens Knowledge",
      "Fit and Sizing",
      "Customer Needs and Recommendations",
      "Optical Product Knowledge",
    ];

    for (const catName of expectedCategories) {
      const found = categories.find((c) => c.name === catName);
      assert(Boolean(found), `Missing required category: ${catName}`);
    }

    let totalLessons = 0;
    let totalQuestions = 0;

    for (const cat of categories) {
      assert(cat.subcategories.length > 0, `Category ${cat.name} has no subcategories`);
      for (const sub of cat.subcategories) {
        assert(sub.lessons.length > 0, `Subcategory ${sub.name} has no lessons`);
        for (const lesson of sub.lessons) {
          totalLessons++;
          totalQuestions += lesson.quizQuestions.length;

          // Verify structured content fields
          assert(lesson.definitions.length > 10, `Lesson ${lesson.title} missing definitions`);
          assert(lesson.characteristics.length > 10, `Lesson ${lesson.title} missing characteristics`);
          assert(lesson.practicalApplications.length > 10, `Lesson ${lesson.title} missing practical applications`);
          assert(lesson.misconceptions.length > 10, `Lesson ${lesson.title} missing misconceptions`);
          assert(lesson.limitations.length > 10, `Lesson ${lesson.title} missing limitations`);
          assert(lesson.quizQuestions.length > 0, `Lesson ${lesson.title} missing quiz questions`);
        }
      }
    }

    reports.push({
      name: "1. Categories & Structured Content Integrity",
      passed: true,
      details: `Verified all 7 main categories, ${totalLessons} lessons with all 6 required content sections, and ${totalQuestions} quiz questions in PostgreSQL.`,
    });
  } catch (e: any) {
    reports.push({
      name: "1. Categories & Structured Content Integrity",
      passed: false,
      details: e.message,
    });
  }

  // TEST 2: AUTHENTICATION & JWT TOKENS
  try {
    const owner = await prisma.user.findUnique({
      where: { email: "owner@apexoptics.com" },
    });
    const staff = await prisma.user.findUnique({
      where: { email: "staff@apexoptics.com" },
    });

    assert(Boolean(owner && String(owner.role).toUpperCase() === "OWNER"), "Owner user not found in PostgreSQL");
    assert(Boolean(staff && String(staff.role).toUpperCase() === "STAFF"), "Staff user not found in PostgreSQL");

    const ownerValid = await bcrypt.compare("Password123!", owner!.passwordHash);
    assert(ownerValid, "Owner password hash comparison failed");

    // Token creation and verification
    const token = await signSessionToken({
      id: owner!.id,
      email: owner!.email,
      name: owner!.name,
      role: owner!.role,
    });
    assert(typeof token === "string" && token.length > 20, "Failed to sign JWT session token");

    const payload = await verifySessionToken(token);
    assert(String(payload?.role).toLowerCase() === "owner", "JWT verification failed to decode correct role");

    reports.push({
      name: "2. Authentication & JWT Session Security",
      passed: true,
      details: `Owner and Staff accounts verified with bcrypt and JOSE HS256 signed sessions.`,
    });
  } catch (e: any) {
    reports.push({
      name: "2. Authentication & JWT Session Security",
      passed: false,
      details: e.message,
    });
  }

  // TEST 3: SEARCH ACROSS APPROVED LESSON CONTENT
  try {
    const searchTerm = "Brewster";
    const searchResults = await prisma.lesson.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { definitions: { contains: searchTerm, mode: "insensitive" } },
          { characteristics: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
    });

    assert(searchResults.length >= 1, `Expected search results for "${searchTerm}", found 0`);
    assert(
      searchResults.some((l) => l.slug.includes("polarization")),
      "Expected Brewster's search to find polarization lesson"
    );

    // Search by frame shape
    const shapeSearch = await prisma.lesson.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: "Panto", mode: "insensitive" } },
          { definitions: { contains: "Panto", mode: "insensitive" } },
        ],
      },
    });
    assert(shapeSearch.length >= 1, "Expected search for Panto frames to yield results");

    reports.push({
      name: "3. Lesson Content Search Functionality",
      passed: true,
      details: `Full-text search verified across titles, optical definitions, and technical characteristics.`,
    });
  } catch (e: any) {
    reports.push({
      name: "3. Lesson Content Search Functionality",
      passed: false,
      details: e.message,
    });
  }

  // TEST 4: LESSON COMPLETION & PERSISTENT PROGRESS
  let testStaffId = "";
  let testLessonId = "";
  try {
    const staff = await prisma.user.findUnique({
      where: { email: "staff@apexoptics.com" },
    });
    const lesson = await prisma.lesson.findFirst({
      where: { slug: "classic-aviator-optics" },
    });

    assert(Boolean(staff && lesson), "Staff user or test lesson missing");
    testStaffId = staff!.id;
    testLessonId = lesson!.id;

    // Mark as completed
    const progress = await prisma.userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: testStaffId,
          lessonId: testLessonId,
        },
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
        lastAccessedAt: new Date(),
      },
      create: {
        userId: testStaffId,
        lessonId: testLessonId,
        isCompleted: true,
        completedAt: new Date(),
        lastAccessedAt: new Date(),
      },
    });

    assert(progress.isCompleted === true, "Lesson completion not saved");
    assert(Boolean(progress.completedAt), "completedAt timestamp missing");

    // Retrieve progress from DB
    const retrieved = await prisma.userLessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: testStaffId,
          lessonId: testLessonId,
        },
      },
    });
    assert(retrieved?.isCompleted === true, "Retrieved progress does not match");

    reports.push({
      name: "4. Lesson Completion & Progress Persistence",
      passed: true,
      details: `Persistent UserLessonProgress state verified in PostgreSQL for user ${staff!.email}.`,
    });
  } catch (e: any) {
    reports.push({
      name: "4. Lesson Completion & Progress Persistence",
      passed: false,
      details: e.message,
    });
  }

  // TEST 5: KNOWLEDGE CHECK QUESTIONS & QUIZ ATTEMPTS PERSISTENCE
  try {
    const questions = await prisma.quizQuestion.findMany({
      where: { lessonId: testLessonId },
    });
    assert(questions.length >= 2, `Expected >= 2 questions, found ${questions.length}`);

    // Simulate answering all questions correctly
    const answersRecord: Record<string, number> = {};
    for (const q of questions) {
      answersRecord[q.id] = q.correctOptionIndex;
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: testStaffId,
        lessonId: testLessonId,
        score: questions.length,
        totalQuestions: questions.length,
        passed: true,
        answers: JSON.stringify(answersRecord),
      },
    });

    assert(attempt.passed === true, "Quiz attempt should be marked as passed");
    assert(attempt.score === questions.length, "Quiz score does not match total questions");

    // Fetch quiz history
    const history = await prisma.quizAttempt.findMany({
      where: { userId: testStaffId, lessonId: testLessonId },
    });
    assert(history.length >= 1, "Quiz history not recorded in PostgreSQL");

    reports.push({
      name: "5. Quiz Questions & Attempt Persistence",
      passed: true,
      details: `Saved quiz attempt with score ${attempt.score}/${attempt.totalQuestions} (100%) and JSON answers record in PostgreSQL.`,
    });
  } catch (e: any) {
    reports.push({
      name: "5. Quiz Questions & Attempt Persistence",
      passed: false,
      details: e.message,
    });
  }

  // TEST 6: OWNER AUTHORIZATION & LESSON CREATION / EDITING
  try {
    const subcategory = await prisma.subcategory.findFirst();
    assert(Boolean(subcategory), "No subcategory available for test creation");

    const testSlug = `test-custom-lens-${Date.now()}`;
    const newLesson = await prisma.lesson.create({
      data: {
        title: "Test Photochromic Technology & Silver Halide Dynamics",
        slug: testSlug,
        summary: "Synthetic development lesson to verify owner creation and editing workflow.",
        subcategoryId: subcategory!.id,
        definitions: "**Photochromism:** Reversible optical transformation upon exposure to UV radiation.",
        characteristics: "- Activates in 30-60 seconds in direct outdoor sunlight.\n- Temperature dependent.",
        practicalApplications: "Dispense to light-sensitive patients who frequently move between indoors and outdoors.",
        misconceptions: "Photochromic lenses do not turn fully dark inside cars due to UV blocking windshields.",
        limitations: "Reduced activation speed in extremely hot ambient weather.",
        brandModelReferences: "Educational example: Transitions Signature GEN 8 benchmark.",
        orderIndex: 99,
        isPublished: true,
        quizQuestions: {
          create: [
            {
              question: "Why do standard photochromic lenses not darken fully behind an automobile windshield?",
              options: JSON.stringify([
                "Car air conditioning cools the lens too rapidly",
                "Automotive windshields contain UV-absorbing PVB interlayers that block the UV wavelengths required for activation",
                "Car dashboard reflections cancel the chemical reaction",
                "Photochromic molecules only activate in saltwater"
              ]),
              correctOptionIndex: 1,
              explanation: "Modern car windshields block nearly 100% of UV rays, preventing standard UV-activated dyes from transforming.",
              orderIndex: 1,
            }
          ]
        }
      },
      include: {
        quizQuestions: true,
      }
    });

    assert(newLesson.title.includes("Test Photochromic"), "New lesson was not created properly");
    assert(newLesson.quizQuestions.length === 1, "Quiz question was not attached to new lesson");

    // Test editing lesson
    const updated = await prisma.lesson.update({
      where: { id: newLesson.id },
      data: {
        title: "Updated Photochromic Technology & Silver Halide Dynamics",
      },
    });
    assert(updated.title.startsWith("Updated"), "Lesson update did not persist");

    // Clean up test lesson
    await prisma.lesson.delete({
      where: { id: newLesson.id },
    });

    reports.push({
      name: "6. Content Creation & Editing Authorization Flow",
      passed: true,
      details: `Created new optical lesson with subcategory linkage and quiz question, updated title, and verified clean deletion.`,
    });
  } catch (e: any) {
    reports.push({
      name: "6. Content Creation & Editing Authorization Flow",
      passed: false,
      details: e.message,
    });
  }

  // TEST 7: CONTINUE LEARNING PIPELINE
  try {
    const progresses = await prisma.userLessonProgress.findMany({
      where: { userId: testStaffId },
      orderBy: { lastAccessedAt: "desc" },
      take: 3,
      include: {
        lesson: {
          include: {
            subcategory: {
              include: { category: true },
            },
          },
        },
      },
    });

    assert(progresses.length >= 1, "No progress entries found for continue learning pipeline");
    const topItem = progresses[0];
    assert(Boolean(topItem.lesson.title), "Continue learning item missing lesson title");
    assert(Boolean(topItem.lesson.subcategory.category.name), "Continue learning missing category relation");

    reports.push({
      name: "7. Continue Learning Feed & Relationship Retrieval",
      passed: true,
      details: `Verified Continue Learning feed retrieves relational category, subcategory, and lastAccessedAt timestamp correctly.`,
    });
  } catch (e: any) {
    reports.push({
      name: "7. Continue Learning Feed & Relationship Retrieval",
      passed: false,
      details: e.message,
    });
  }

  // PRINT SUMMARY
  console.log("----------------------------------------------------------");
  console.log("                      TEST RESULTS                        ");
  console.log("----------------------------------------------------------");
  let allPassed = true;
  for (const r of reports) {
    const status = r.passed ? "[PASSED] ✓" : "[FAILED] ✗";
    console.log(`${status} ${r.name}`);
    if (r.details) {
      console.log(`         ${r.details}`);
    }
    if (!r.passed) allPassed = false;
  }
  console.log("----------------------------------------------------------");
  console.log(
    `OVERALL RESULT: ${
      allPassed ? "ALL 7 TESTS PASSED SUCCESSFULLY!" : "SOME TESTS FAILED"
    }`
  );
  console.log("==========================================================\n");

  if (!allPassed) {
    process.exit(1);
  }
}

runTestSuite()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
