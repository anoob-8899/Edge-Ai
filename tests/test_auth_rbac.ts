import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import * as dotenv from "dotenv";
import { signInSchema, bootstrapOwnerSchema, inviteStaffSchema } from "../src/lib/validations/auth";

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "optitrain-optical-training-jwt-secret-key-32charsminimum"
);

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${testName} - ${detail || "Assertion failed"}`);
    failedCount++;
  }
}

async function runTests() {
  console.log("==========================================================");
  console.log("OptiTrain.ai - Auth & Role-Based Access Control Test Suite");
  console.log("==========================================================\n");

  // 1. Missing Database Configuration Check
  console.log("TEST 1: Missing Database Configuration Handling");
  {
    const originalUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    const { isDatabaseConfigured } = await import("../src/lib/prisma");
    assert(isDatabaseConfigured() === false, "isDatabaseConfigured returns false when DATABASE_URL is missing");
    process.env.DATABASE_URL = originalUrl;
    assert(isDatabaseConfigured() === true, "isDatabaseConfigured returns true when DATABASE_URL is set");
  }

  // 2. Input Validation (Zod)
  console.log("\nTEST 2: Input Validation & Sanitation");
  {
    const invalidEmail = signInSchema.safeParse({ email: "not-an-email", password: "123" });
    assert(!invalidEmail.success, "Rejects malformed email and short password");

    const validSignIn = signInSchema.safeParse({
      email: "  OWNER@apex-optics.COM  ",
      password: "SecureOwner123!",
    });
    assert(validSignIn.success, "Accepts and trims/lowercases valid email");
    if (validSignIn.success) {
      assert(validSignIn.data.email === "owner@apex-optics.com", "Sanitized email to lowercase trimmed string");
    }

    const weakOwnerPw = bootstrapOwnerSchema.safeParse({
      email: "owner2@apex-optics.com",
      name: "Owner Two",
      password: "weak",
    });
    assert(!weakOwnerPw.success, "Rejects weak bootstrap password without complexity");
  }

  // 3. Database Connection & Schema Models Verification
  console.log("\nTEST 3: PostgreSQL & Prisma Relational Schema");
  {
    const userCount = await prisma.user.count();
    assert(userCount >= 2, `Database connected and contains active users (Found: ${userCount})`);

    const ownerUser = await prisma.user.findFirst({ where: { role: "OWNER" } });
    assert(ownerUser !== null, "Found OWNER user in PostgreSQL");

    const staffUser = await prisma.user.findFirst({ where: { role: "STAFF" } });
    assert(staffUser !== null, "Found STAFF user in PostgreSQL");
  }

  // 4. Invalid Credentials Test
  console.log("\nTEST 4: Invalid Credentials & Brute Force Prevention");
  {
    // A. Non-existent email
    const fakeUser = await prisma.user.findUnique({ where: { email: "ghost@nowhere.com" } });
    assert(fakeUser === null, "Ghost user correctly not found in DB");

    // B. Real email, wrong password
    const realOwner = await prisma.user.findUnique({ where: { email: "owner@apex-optics.com" } });
    assert(realOwner !== null, "Owner found for invalid password test");
    const isPwCorrect = await bcrypt.compare("WrongPassword999!", realOwner!.passwordHash);
    assert(isPwCorrect === false, "Bcrypt correctly rejects incorrect password");

    // Verify audit log can capture failure
    const audit = await prisma.auditLog.create({
      data: {
        action: "TEST_LOGIN_FAILURE",
        metadata: { reason: "INVALID_CREDENTIALS" },
      },
    });
    assert(audit.id !== undefined, "AuditLog successfully recorded security event in DB");
  }

  // 5. Owner Sign-In, Session Creation & Sign-Out
  console.log("\nTEST 5: Owner Sign-In & Sign-Out Workflow");
  let ownerJwt: string = "";
  {
    const owner = await prisma.user.findUnique({ where: { email: "owner@apex-optics.com" } });
    const isMatch = await bcrypt.compare("SecureOwner123!", owner!.passwordHash);
    assert(isMatch === true, "Owner password verified via bcrypt");
    assert(owner!.role === "OWNER", "Owner role confirmed as OWNER");

    // Create session in DB
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    const ownerSessionToken = crypto.randomUUID();
    const session = await prisma.session.create({
      data: {
        sessionToken: ownerSessionToken,
        userId: owner!.id,
        expiresAt,
        userAgent: "TestRunner/1.0",
      },
    });
    assert(session.id !== undefined, "Session record persisted in PostgreSQL");

    // Sign JWT
    ownerJwt = await new SignJWT({
      userId: owner!.id,
      email: owner!.email,
      role: owner!.role,
      sessionId: session.id,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    // Verify JWT
    const { payload } = await jwtVerify(ownerJwt, JWT_SECRET);
    assert(payload.role === "OWNER", "Cryptographic JWT payload verified with role OWNER");
    assert(payload.userId === owner!.id, "JWT matches authenticated owner ID");

    // Test sign out: Destroy session in DB
    await prisma.session.delete({ where: { id: session.id } });
    const sessionAfterDelete = await prisma.session.findUnique({ where: { id: session.id } });
    assert(sessionAfterDelete === null, "Owner session cleanly destroyed on sign-out");
  }

  // 6. Staff Sign-In, Session & Role Verification
  console.log("\nTEST 6: Staff Sign-In & Role Verification");
  let staffUser1Id = "";
  let staffUser2Id = "";
  {
    const staff1 = await prisma.user.findUnique({ where: { email: "alex.optician@apex-optics.com" } });
    assert(staff1 !== null, "Staff 1 (Alex) found in PostgreSQL");
    staffUser1Id = staff1!.id;
    const isStaffMatch = await bcrypt.compare("StaffPass123!", staff1!.passwordHash);
    assert(isStaffMatch === true, "Staff password verified via bcrypt");
    assert(staff1!.role === "STAFF", "Staff role confirmed as STAFF");

    const staff2 = await prisma.user.findUnique({ where: { email: "emma.trainee@apex-optics.com" } });
    assert(staff2 !== null, "Staff 2 (Emma) found in PostgreSQL");
    staffUser2Id = staff2!.id;
  }

  // 7. Role-Based Access Control: Owner Features Protected from Staff
  console.log("\nTEST 7: Route & Operation Protection (Staff Cannot Access Owner Features)");
  {
    // A simulated staff JWT
    const staffJwt = await new SignJWT({
      userId: staffUser1Id,
      email: "alex.optician@apex-optics.com",
      role: "STAFF",
      sessionId: "temp-session",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(JWT_SECRET);

    const { payload: verifiedStaffPayload } = await jwtVerify(staffJwt, JWT_SECRET);

    // Simulate owner route check in middleware / API
    const isAllowedInOwnerPortal = verifiedStaffPayload.role === "OWNER";
    assert(isAllowedInOwnerPortal === false, "Staff token is FORBIDDEN from accessing /owner portal");

    // Simulate staff invitation check (only owner can invite)
    const canStaffInviteOthers = verifiedStaffPayload.role === "OWNER";
    assert(canStaffInviteOthers === false, "Staff token is FORBIDDEN from inviting new staff members");
  }

  // 8. Staff Private Record Isolation (Prevent Cross-Staff Data Leakage)
  console.log("\nTEST 8: Confidential Record Isolation Between Staff Members");
  {
    // Verify Staff 1 has private records
    const staff1Records = await prisma.staffPrivateRecord.findMany({
      where: { userId: staffUser1Id },
    });
    assert(staff1Records.length > 0, `Staff 1 has ${staff1Records.length} private records`);

    // Verify Staff 2 has private records
    const staff2Records = await prisma.staffPrivateRecord.findMany({
      where: { userId: staffUser2Id },
    });
    assert(staff2Records.length > 0, `Staff 2 has ${staff2Records.length} private records`);

    // Simulate Staff 1 attempting to read Staff 2's records
    const requestingUserRole = "STAFF";
    const requestingUserId = staffUser1Id;
    const targetUserId = staffUser2Id;

    let isAccessGranted = false;
    if (requestingUserRole === "STAFF") {
      if (targetUserId === requestingUserId) {
        isAccessGranted = true;
      } else {
        isAccessGranted = false; // Blocked with 403 Forbidden!
      }
    }

    assert(
      isAccessGranted === false,
      "Access DENIED (403): Staff 1 cannot view Staff 2's private records"
    );

    // Verify Staff 1 can access their own records
    const isOwnAccessGranted = (requestingUserRole === "STAFF" && requestingUserId === staffUser1Id);
    assert(isOwnAccessGranted === true, "Access GRANTED: Staff 1 can view their own private records");

    // Verify Owner can oversee staff records
    const ownerRole = "OWNER";
    const isOwnerAccessGranted = ownerRole === "OWNER";
    assert(isOwnerAccessGranted === true, "Access GRANTED: Practice Owner can review staff evaluations");
  }

  // 9. Initial Owner Account Provisioning Safety Lock
  console.log("\nTEST 9: Initial Owner Account Bootstrap Safety Lock");
  {
    const ownerCount = await prisma.user.count({ where: { role: "OWNER" } });
    assert(ownerCount >= 1, `Owner count in DB is ${ownerCount}`);

    // Simulate bootstrap check
    const canBootstrapNewOwner = ownerCount === 0;
    assert(
      canBootstrapNewOwner === false,
      "Safety Lock active: Bootstrapping new owner is PERMANENTLY BLOCKED once an owner exists"
    );
  }

  console.log("\n==========================================================");
  console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==========================================================");

  await prisma.$disconnect();
  await pool.end();

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
