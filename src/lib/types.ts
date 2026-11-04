export type AppRole = "OWNER" | "STAFF" | "owner" | "staff" | "admin";
export type UserRole = "staff" | "owner" | "admin" | "STAFF" | "OWNER";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  clinicId?: string | null;
  status: "ACTIVE" | "SUSPENDED" | "INVITED";
  createdAt?: string;
  lastLoginAt?: string | null;
}

export interface AuthSession {
  user: AuthUser;
  expiresAt: string;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string;
  isOwnerOnly?: boolean;
}

export type ScenarioDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface OpticalScenario {
  id: string;
  title: string;
  category: "Prescription Lenses" | "Frame Styling" | "Specialty Coatings" | "Objection Handling";
  difficulty: ScenarioDifficulty;
  durationMinutes: number;
  patientPersona: {
    name: string;
    age: number;
    rxDescription: string;
    lifestyleNeed: string;
    primaryHesitation: string;
  };
  learningGoals: string[];
}

export interface CompetencyScore {
  id: string;
  name: string;
  currentScore: number;
  targetScore: number;
  status: "pending" | "in-progress" | "mastered";
}

export type VerificationStatusType = "VERIFIED" | "PARTIALLY_VERIFIED" | "UNVERIFIED";
export type ApprovalStatusType = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export interface BrandItem {
  id: string;
  slug: string;
  name: string;
  parentCompany: string | null;
  countryOfOrigin: string | null;
  heritage: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  orderIndex: number;
  modelCount?: number;
  verifiedCount?: number;
  pendingCount?: number;
}

export interface SunglassModelItem {
  id: string;
  brandId: string;
  brand: {
    id: string;
    slug: string;
    name: string;
    parentCompany?: string | null;
    countryOfOrigin?: string | null;
  };
  officialProductName: string;
  modelCode: string;
  subName?: string | null;
  slug: string;
  category: string;
  gender?: string | null;
  frameShape: string;
  frameShapeVerified: boolean;
  frameMaterial?: string | null;
  frameMaterialVerified: boolean;
  frameFinish?: string | null;
  frameFinishVerified: boolean;
  lensColor?: string | null;
  lensColorVerified: boolean;
  lensMaterial?: string | null;
  lensMaterialVerified: boolean;
  uvProtection?: string | null;
  uvProtectionVerified: boolean;
  isPolarized?: boolean | null;
  polarizationVerified: boolean;
  lensTechnology?: string | null;
  lensTechnologyVerified: boolean;
  lensWidthMm?: number | null;
  bridgeWidthMm?: number | null;
  templeLengthMm?: number | null;
  lensHeightMm?: number | null;
  dimensionsVerified: boolean;
  variants?: string | null;
  imageUrl?: string | null;
  sourceUrl: string;
  sourceName: string;
  verificationStatus: VerificationStatusType;
  lastVerifiedAt?: string | null;
  verifiedBy?: string | null;
  verificationNotes?: string | null;
  approvalStatus: ApprovalStatusType;
  approvedBy?: string | null;
  approvedAt?: string | null;
  reviewNotes?: string | null;
  opticalLearningNotes?: string | null;
}

