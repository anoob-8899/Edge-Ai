import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { OptiCoachScenario } from "./scenarios";
import { GeminiServiceError } from "./gemini";

// ============================================================================
// ASSESSMENT CRITERIA CONSTANTS & DEFINITIONS
// ============================================================================

export const ASSESSMENT_CRITERIA_KEYS = [
  "customer_needs_discovery",
  "product_knowledge_accuracy",
  "explanation_clarity",
  "recommendation_relevance",
  "handling_questions_and_objections",
  "professional_communication",
] as const;

export type AssessmentCriterionKey = typeof ASSESSMENT_CRITERIA_KEYS[number];

export interface CriterionDefinition {
  id: AssessmentCriterionKey;
  name: string;
  description: string;
  rubric: {
    exemplary: string; // 90-100
    proficient: string; // 75-89
    developing: string; // 60-74
    unsatisfactory: string; // 0-59
  };
}

export const ASSESSMENT_CRITERIA_DEFINITIONS: Record<AssessmentCriterionKey, CriterionDefinition> = {
  customer_needs_discovery: {
    id: "customer_needs_discovery",
    name: "Customer Needs Discovery",
    description: "Proactively uncovering daily visual lifestyle, working distances, screen habits, and personal eyewear pain points.",
    rubric: {
      exemplary: "Proactively probes for specific daily visual tasks (e.g. multi-monitor distance, driving, outdoor hobbies) and uncovers underlying visual frustrations.",
      proficient: "Asks relevant lifestyle and prescription questions; identifies the primary visual complaint and day-to-day requirements.",
      developing: "Asks narrow or closed questions; relies almost entirely on the prescription paper without exploring daily visual environment.",
      unsatisfactory: "Makes assumptions without asking discovery questions; jumps directly to selling without understanding visual needs.",
    },
  },
  product_knowledge_accuracy: {
    id: "product_knowledge_accuracy",
    name: "Product Knowledge Accuracy",
    description: "Precision regarding optical principles, lens materials, refractive indices, coatings, and sunglasses specifications.",
    rubric: {
      exemplary: "Accurately articulates complex optical physics, refractive indices, Abbe values, progressive corridor dynamics, or polarization mechanisms without factual error.",
      proficient: "Accurately conveys key lens/frame attributes and benefits aligned with catalog specifications and optical guidelines.",
      developing: "Displays minor technical inaccuracies or hesitation regarding lens coatings, material trade-offs, or optical terminology.",
      unsatisfactory: "Conveys factually incorrect optical information, misrepresents UV protection or polarization, or invents unverified specifications.",
    },
  },
  explanation_clarity: {
    id: "explanation_clarity",
    name: "Explanation Clarity",
    description: "Translating technical optical jargon into intuitive, relatable analogies and clear patient benefits.",
    rubric: {
      exemplary: "Translates complex optical mechanisms into vivid, easily grasped analogies (e.g. progressive corridor like a tailored camera lens; AR coating like crystal-clear water).",
      proficient: "Communicates clearly and logically, avoiding confusing jargon and checking for customer understanding.",
      developing: "Uses technical optical terms without explaining their practical meaning; customer appears hesitant or confused.",
      unsatisfactory: "Explanations are convoluted, cryptic, or overly academic, leaving the customer puzzled or disengaged.",
    },
  },
  recommendation_relevance: {
    id: "recommendation_relevance",
    name: "Recommendation Relevance",
    description: "Tailoring lenses, frames, and treatments directly to the customer's unique prescription, ergonomics, and budget.",
    rubric: {
      exemplary: "Selects and justifies a tailored eyewear solution directly connected to the customer's prescription, ergonomics, and lifestyle demands.",
      proficient: "Recommends suitable lenses and frames with clear justification matching the customer's core needs.",
      developing: "Suggests generic or semi-relevant options without firmly linking them to customer lifestyle or prescription demands.",
      unsatisfactory: "Recommends inappropriate lenses/frames or pushes aggressive upselling disconnected from patient requirements.",
    },
  },
  handling_questions_and_objections: {
    id: "handling_questions_and_objections",
    name: "Handling Questions and Objections",
    description: "Empathetically addressing skepticism, past adaptation difficulties, price hesitation, and technical questions.",
    rubric: {
      exemplary: "Demonstrates deep empathy for customer doubts (e.g. fear of progressive distortion or cost pushback), validates their concern, and offers reassuring evidence.",
      proficient: "Addresses customer concerns calmly and constructively, offering relevant solutions or reassurance.",
      developing: "Acknowledges objections superficially or shows slight defensiveness; does not fully alleviate customer doubt.",
      unsatisfactory: "Dismisses customer concerns, argues, ignores objections, or fails to address hesitation.",
    },
  },
  professional_communication: {
    id: "professional_communication",
    name: "Professional Communication",
    description: "Maintaining a welcoming, consultative, courteous, and respectful bedside manner throughout the dialogue.",
    rubric: {
      exemplary: "Exhibits exceptional professional warmth, patient pacing, consultative dignity, and patient-first optical stewardship.",
      proficient: "Maintains a courteous, respectful, and professional tone throughout the interaction.",
      developing: "Tone is somewhat hurried, overly casual, or transactional; rapport could be strengthened.",
      unsatisfactory: "Appears disinterested, impatient, curt, or unprofessional in dialogue.",
    },
  },
};

// ============================================================================
// STRICT SERVER-SIDE ZOD SCHEMAS
// ============================================================================

export const CriterionResultSchema = z.object({
  criterionId: z.enum(ASSESSMENT_CRITERIA_KEYS),
  criterionName: z.string().min(1),
  score: z.number().int().min(0).max(100),
  rubricLevel: z.enum(["Unsatisfactory", "Developing", "Proficient", "Exemplary"]),
  rubricDescriptor: z.string().min(1),
  evidence: z.string().min(1),
  isEvidenceObserved: z.boolean(),
  whatWentWell: z.string().min(1),
  whatCouldImprove: z.string().min(1),
  suggestedAlternativeResponse: z.string().min(1),
  recommendedFollowUpExercise: z.string().min(1),
});

export type CriterionResult = z.infer<typeof CriterionResultSchema>;

export const SessionAssessmentSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  rubricGrade: z.enum([
    "Exemplary Mastery",
    "Competency Demonstrated",
    "Practice Recommended",
    "Incomplete Session",
  ]),
  summary: z.string().min(1),
  strengths: z.array(z.string().min(1)).min(1),
  areasForImprovement: z.array(z.string().min(1)).min(1),
  criteria: z.array(CriterionResultSchema).length(6),
  recommendedAction: z.string().min(1),
  generatedAt: z.string(),
  isCompleteSession: z.boolean(),
  staffTurnCount: z.number().int().min(0),
  disclaimers: z.object({
    evidenceVsJudgment: z.string(),
    notObjectiveTruth: z.string(),
    employmentDecisions: z.string(),
  }),
});

export type SessionAssessment = z.infer<typeof SessionAssessmentSchema>;

// ============================================================================
// MANDATORY DISCLAIMERS
// ============================================================================

export const DISCLAIMERS = {
  evidenceVsJudgment:
    "Conversation evidence quotes and documented events are extracted directly from the recorded dialogue transcript. Numerical scores, rubric classifications, and qualitative suggestions represent subjective AI coaching evaluations and do not replace clinical mentorship.",
  notObjectiveTruth:
    "This assessment is generated by an automated AI coaching model applying structured optical rubrics. It is designed for deliberate practice and reflection, and should not be construed as an infallible or perfectly objective clinical measurement.",
  employmentDecisions:
    "In compliance with ethical training standards, automated simulation assessment scores must NEVER be used as the sole or decisive basis for employment decisions, including hiring, promotion, termination, compensation, or disciplinary measures.",
};

// ============================================================================
// HELPER: INCOMPLETE SESSIONS (0 STAFF TURNS)
// ============================================================================

export function buildIncompleteSessionAssessment(params: {
  scenario: OptiCoachScenario;
  staffTurnCount: number;
}): SessionAssessment {
  const { scenario, staffTurnCount } = params;

  const criteriaResults: CriterionResult[] = ASSESSMENT_CRITERIA_KEYS.map((key) => {
    const def = ASSESSMENT_CRITERIA_DEFINITIONS[key];
    return {
      criterionId: key,
      criterionName: def.name,
      score: 0,
      rubricLevel: "Unsatisfactory",
      rubricDescriptor: def.rubric.unsatisfactory,
      evidence: "No staff consultation statements were recorded in this session.",
      isEvidenceObserved: false,
      whatWentWell: "Session was initialized with the scenario customer greeting.",
      whatCouldImprove: `Engage with the patient to practice ${def.name.toLowerCase()} in your dialogue.`,
      suggestedAlternativeResponse:
        key === "customer_needs_discovery"
          ? `Welcome to Edge Opticals! I see your prescription from Dr. Vance. Tell me about your day-to-day visual tasks and where you feel the most eyestrain.`
          : key === "handling_questions_and_objections"
          ? `I completely understand your hesitation. Let's walk through how modern optical lenses address that specific concern.`
          : `Hello! I would be delighted to guide you through our optical solutions tailored to your prescription.`,
      recommendedFollowUpExercise: `Complete a full interactive session with ${scenario.patientPersona.name} focusing on ${def.name}.`,
    };
  });

  return {
    overallScore: 0,
    rubricGrade: "Incomplete Session",
    summary: `Session concluded before staff consultation dialogue was exchanged with patient ${scenario.patientPersona.name}. No clinical dispensing skills were demonstrated.`,
    strengths: ["Scenario initiated"],
    areasForImprovement: [
      "Engage directly with the customer in conversation turns before ending the session to receive comprehensive AI coaching.",
    ],
    criteria: criteriaResults,
    recommendedAction: `Restart scenario "${scenario.title}" and complete at least 2-3 conversation turns addressing ${scenario.patientPersona.name}'s visual requirements.`,
    generatedAt: new Date().toISOString(),
    isCompleteSession: false,
    staffTurnCount,
    disclaimers: DISCLAIMERS,
  };
}

// ============================================================================
// GEMINI CLIENT SETUP
// ============================================================================

function getGeminiClient(): { client: GoogleGenAI; modelName: string } {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new GeminiServiceError(
      "Gemini API key is missing. Please configure GEMINI_API_KEY in the server environment.",
      "GEMINI_API_KEY_MISSING",
      503
    );
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const client = new GoogleGenAI({ apiKey });
  return { client, modelName };
}

// ============================================================================
// GENERATE & VALIDATE ASSESSMENT FROM REAL SAVED CONVERSATIONS
// ============================================================================

export async function generateStrictSessionAssessment(params: {
  scenario: OptiCoachScenario;
  dialogueHistory: Array<{ role: string; content: string }>;
}): Promise<SessionAssessment> {
  const { scenario, dialogueHistory } = params;

  const staffMessages = dialogueHistory.filter((m) => m.role === "staff");
  if (staffMessages.length === 0) {
    return buildIncompleteSessionAssessment({
      scenario,
      staffTurnCount: 0,
    });
  }

  const { client, modelName } = getGeminiClient();

  const criteriaInstructions = ASSESSMENT_CRITERIA_KEYS.map((key) => {
    const def = ASSESSMENT_CRITERIA_DEFINITIONS[key];
    return `### CRITERION: "${def.name}" (ID: "${def.id}")
Description: ${def.description}
RUBRIC LEVELS:
- Exemplary (90-100): ${def.rubric.exemplary}
- Proficient (75-89): ${def.rubric.proficient}
- Developing (60-74): ${def.rubric.developing}
- Unsatisfactory (0-59): ${def.rubric.unsatisfactory}`;
  }).join("\n\n");

  const systemInstruction = `You are the master clinical optical sales director and coach at "Edge Opticals".
You are evaluating a completed sales consultation between a dispensing staff optician and customer "${scenario.patientPersona.name}".

PATIENT PROFILE:
- Name: ${scenario.patientPersona.name} (Age: ${scenario.patientPersona.age})
- Prescription: ${scenario.patientPersona.rxDescription}
- Lifestyle Need: ${scenario.patientPersona.lifestyleNeed}
- Primary Hesitation: ${scenario.patientPersona.primaryHesitation}
- Scenario Title: ${scenario.title} (${scenario.category})

MANDATORY ASSESSMENT GUIDELINES:
1. STRICT EVIDENCE-BASED ANALYSIS:
   - For every criterion's "evidence" field, cite EXACT verbatim quotes spoken in the conversation transcript, or state clearly: "No statement observed in transcript."
   - NEVER invent or hallucinate customer quotes, optician statements, or measurements that do not appear in the transcript.
   - Distinguish verified dialogue evidence from your subjective coaching feedback and scores.
2. OBJECTIVITY & FAIRNESS:
   - Base scores on the defined 4-tier rubric for each criterion.
   - Recognize that this assessment is an AI coaching tool, not an absolute clinical determination.
3. ALL 6 REQUIRED CRITERIA MUST BE EVALUATED:
   You must return exactly 6 criteria entries in the "criteria" array, matching these exact criterionIds:
   - "customer_needs_discovery"
   - "product_knowledge_accuracy"
   - "explanation_clarity"
   - "recommendation_relevance"
   - "handling_questions_and_objections"
   - "professional_communication"

RUBRIC DEFINITIONS:
${criteriaInstructions}

RESPONSE FORMAT:
You MUST return ONLY valid JSON conforming to the following structure (no markdown fences, pure JSON):
{
  "overallScore": 85, // integer 0-100 (weighted average of criteria)
  "rubricGrade": "Exemplary Mastery" | "Competency Demonstrated" | "Practice Recommended",
  "summary": "2-4 sentence executive coaching summary of the staff member's consultation performance",
  "strengths": ["Consultation strength 1", "Consultation strength 2"],
  "areasForImprovement": ["Constructive focus area 1", "Constructive focus area 2"],
  "criteria": [
    {
      "criterionId": "customer_needs_discovery",
      "criterionName": "Customer Needs Discovery",
      "score": 85, // integer 0 to 100
      "rubricLevel": "Exemplary" | "Proficient" | "Developing" | "Unsatisfactory",
      "rubricDescriptor": "Excerpt from the rubric matching this score",
      "evidence": "Direct quote from staff optician or customer in the transcript, or explicit statement of absence",
      "isEvidenceObserved": true, // boolean, false if no quote found
      "whatWentWell": "Specific positive observation",
      "whatCouldImprove": "Specific guidance for refinement",
      "suggestedAlternativeResponse": "Concrete verbatim speech example the staff could have said",
      "recommendedFollowUpExercise": "Specific practice exercise, roleplay drill, or library lesson"
    }
    // ... exactly 6 items total
  ],
  "recommendedAction": "Actionable next learning step in the Optical Library or OptiCoach"
}
`;

  let transcript = `### FULL CONVERSATION TRANSCRIPT:\n`;
  for (const m of dialogueHistory) {
    const speaker =
      m.role === "staff"
        ? "Staff Optician"
        : m.role === "customer"
        ? `Customer (${scenario.patientPersona.name})`
        : "System";
    transcript += `${speaker}: "${m.content}"\n`;
  }
  transcript += `\nEvaluate this recorded conversation against all 6 criteria using the strict rubric. Return pure JSON:`;

  try {
    const response = await Promise.race([
      client.models.generateContent({
        model: modelName,
        contents: transcript,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.3, // Lower temperature for rigorous evaluation consistency
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new GeminiServiceError("Gemini review request timed out after 60s", "TIMEOUT", 504)),
          60000
        )
      ),
    ]);

    const rawText = response.text?.trim() || "";
    if (!rawText) {
      throw new GeminiServiceError("Empty response received from Gemini model", "EMPTY_RESPONSE", 502);
    }

    // Clean markdown code blocks if model included them
    const cleaned = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Attempt heuristic repairs for common LLM JSON syntax artifacts (stray bare strings, trailing commas)
      try {
        const repaired = cleaned
          .replace(/"([^":\n]+)",\s*(?="[^"]+"\s*:)/g, "")
          .replace(/,\s*([}\]])/g, "$1");
        parsed = JSON.parse(repaired);
      } catch (parseErr) {
        console.error("JSON parse error on assessment:", cleaned, parseErr);
        throw new GeminiServiceError(
          "Failed to parse structured assessment JSON from AI evaluator",
          "PARSE_ERROR",
          502
        );
      }
    }

    // Normalize and sanitize criteria array
    const rawCriteria: any[] = Array.isArray(parsed.criteria) ? parsed.criteria : [];
    const normalizedCriteria = ASSESSMENT_CRITERIA_KEYS.map((key) => {
      const def = ASSESSMENT_CRITERIA_DEFINITIONS[key];
      const match = rawCriteria.find(
        (c) =>
          c.criterionId === key ||
          c.criterionName?.toLowerCase().includes(def.name.toLowerCase()) ||
          c.criterionId?.toLowerCase().replace(/_/g, " ") === def.name.toLowerCase()
      );

      const score = typeof match?.score === "number" ? Math.max(0, Math.min(100, Math.round(match.score))) : 70;
      let rubricLevel: "Unsatisfactory" | "Developing" | "Proficient" | "Exemplary" = "Proficient";
      if (score >= 90) rubricLevel = "Exemplary";
      else if (score >= 75) rubricLevel = "Proficient";
      else if (score >= 60) rubricLevel = "Developing";
      else rubricLevel = "Unsatisfactory";

      const rubricDescriptor =
        match?.rubricDescriptor ||
        (rubricLevel === "Exemplary"
          ? def.rubric.exemplary
          : rubricLevel === "Proficient"
          ? def.rubric.proficient
          : rubricLevel === "Developing"
          ? def.rubric.developing
          : def.rubric.unsatisfactory);

      const evidence = match?.evidence?.trim() || "No direct quotation was observed in the transcript.";
      const isEvidenceObserved =
        match?.isEvidenceObserved !== undefined
          ? Boolean(match.isEvidenceObserved)
          : !evidence.toLowerCase().includes("no statement") && !evidence.toLowerCase().includes("not observed");

      return {
        criterionId: key,
        criterionName: def.name,
        score,
        rubricLevel,
        rubricDescriptor,
        evidence,
        isEvidenceObserved,
        whatWentWell: match?.whatWentWell?.trim() || "Maintained engagement with the customer.",
        whatCouldImprove:
          match?.whatCouldImprove?.trim() || `Continue refining ${def.name.toLowerCase()} in subsequent scenarios.`,
        suggestedAlternativeResponse:
          match?.suggestedAlternativeResponse?.trim() ||
          `Here is how you might rephrase: "Let's explore your visual tasks so we can choose the ideal optical solution."`,
        recommendedFollowUpExercise:
          match?.recommendedFollowUpExercise?.trim() ||
          `Practice scenario "${scenario.title}" with a focus on ${def.name}.`,
      };
    });

    const calculatedAvg = Math.round(
      normalizedCriteria.reduce((acc, c) => acc + c.score, 0) / normalizedCriteria.length
    );
    const overallScore =
      typeof parsed.overallScore === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.overallScore)))
        : calculatedAvg;

    let rubricGrade: "Exemplary Mastery" | "Competency Demonstrated" | "Practice Recommended" | "Incomplete Session" =
      "Competency Demonstrated";
    if (overallScore >= 85) rubricGrade = "Exemplary Mastery";
    else if (overallScore >= 70) rubricGrade = "Competency Demonstrated";
    else rubricGrade = "Practice Recommended";

    const candidateAssessment = {
      overallScore,
      rubricGrade,
      summary:
        parsed.summary?.trim() ||
        `Consultation with ${scenario.patientPersona.name} completed. The staff member demonstrated optical communication across the core evaluation criteria.`,
      strengths:
        Array.isArray(parsed.strengths) && parsed.strengths.filter((s: any) => String(s).trim().length > 0).length > 0
          ? parsed.strengths.map((s: any) => String(s).trim()).filter((s: string) => s.length > 0)
          : ["Engaged constructively with the customer."],
      areasForImprovement:
        Array.isArray(parsed.areasForImprovement) && parsed.areasForImprovement.filter((a: any) => String(a).trim().length > 0).length > 0
          ? parsed.areasForImprovement.map((a: any) => String(a).trim()).filter((a: string) => a.length > 0)
          : ["Deepen discovery questions regarding daily visual working distances."],
      criteria: normalizedCriteria,
      recommendedAction:
        parsed.recommendedAction?.trim() || "Review related lessons in the Optical Learning Library.",
      generatedAt: new Date().toISOString(),
      isCompleteSession: true,
      staffTurnCount: staffMessages.length,
      disclaimers: DISCLAIMERS,
    };

    // STRICT SERVER-SIDE SCHEMA VALIDATION USING ZOD
    const validated = SessionAssessmentSchema.parse(candidateAssessment);
    return validated;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("Zod Schema Validation Failure on Assessment:", error.issues);
      throw new GeminiServiceError(
        `AI assessment output failed strict server-side schema validation: ${error.issues.map((i) => i.message).join(", ")}`,
        "SCHEMA_VALIDATION_ERROR",
        502
      );
    }
    if (error instanceof GeminiServiceError) {
      throw error;
    }

    console.error("Gemini API Error in assessment generation:", error);
    const msg = error.message || "Unknown assessment generation failure";
    if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand")) {
      throw new GeminiServiceError(
        "Gemini service is experiencing high demand. Your conversation has been safely preserved; please retry the assessment.",
        "SERVICE_UNAVAILABLE",
        503
      );
    }
    if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
      throw new GeminiServiceError(
        "Gemini API rate limit reached. Your conversation is preserved; please retry shortly.",
        "RATE_LIMIT",
        429
      );
    }
    throw new GeminiServiceError(
      `Assessment generation failed: ${msg}. Your conversation is safely preserved.`,
      "GEMINI_ERROR",
      500
    );
  }
}
