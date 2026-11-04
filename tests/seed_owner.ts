import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("ERROR: DATABASE_URL environment variable is not defined.");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedInitialOwner() {
  console.log("--------------------------------------------------");
  console.log("OptiTrain.ai - Initial Practice Owner Provisioning");
  console.log("--------------------------------------------------");

  try {
    // 1. Safety check: Check if an OWNER user already exists
    const existingOwner = await prisma.user.findFirst({
      where: { role: "OWNER" },
    });

    if (existingOwner) {
      console.log(`[SAFETY LOCK] An OWNER account already exists (${existingOwner.email}).`);
      console.log("Initial owner bootstrapping is disabled to prevent accidental takeover or overwrite.");
      return;
    }

    const email = (process.env.INITIAL_OWNER_EMAIL || "owner@apex-optics.com").trim().toLowerCase();
    const plainPassword = process.env.INITIAL_OWNER_PASSWORD || "SecureOwner123!";
    const name = (process.env.INITIAL_OWNER_NAME || "Dr. Sarah Lin (Practice Owner)").trim();
    const clinicId = "apex-optics-01";

    if (plainPassword.length < 8) {
      console.error("ERROR: Initial owner password must be at least 8 characters.");
      process.exit(1);
    }

    console.log(`Creating initial owner account for: ${email}`);

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const owner = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "OWNER",
        status: "ACTIVE",
        clinicId,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: owner.id,
        action: "INITIAL_OWNER_BOOTSTRAP",
        metadata: {
          email: owner.email,
          role: "OWNER",
          method: "CLI_SEED_SCRIPT",
        },
      },
    });

    console.log("--------------------------------------------------");
    console.log("SUCCESS: Initial Practice Owner created successfully!");
    console.log(`  ID:        ${owner.id}`);
    console.log(`  Name:      ${owner.name}`);
    console.log(`  Email:     ${owner.email}`);
    console.log(`  Role:      ${owner.role}`);
    console.log(`  Clinic ID: ${owner.clinicId}`);
    console.log("--------------------------------------------------");
  } catch (error) {
    console.error("Provisioning failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seedInitialOwner();
