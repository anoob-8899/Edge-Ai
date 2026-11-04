export interface OptiCoachScenario {
  id: string;
  title: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  durationMinutes: number;
  patientPersona: {
    name: string;
    age: number;
    rxDescription: string;
    lifestyleNeed: string;
    primaryHesitation: string;
    stylePreference?: string;
  };
  initialMessage: string;
  learningGoals: string[];
  skills: string[];
  keywordsForRAG: string[];
  quickPrompts: string[];
}

export const OPTICAL_SCENARIOS: OptiCoachScenario[] = [
  {
    id: "sc-first-time-buyer",
    title: "First-Time Eyewear Buyer",
    category: "Consultation & Discovery",
    difficulty: "Beginner",
    durationMinutes: 6,
    patientPersona: {
      name: "Maya Lin",
      age: 24,
      rxDescription: "OD: +0.75 -0.50 x 180 | OS: +0.75 -0.50 x 175 | ADD: N/A",
      lifestyleNeed: "Junior graphic designer staring at color-critical retina displays 9 hours a day. Starting to get late-afternoon tension headaches.",
      primaryHesitation: "Worried that wearing glasses will alter her facial appearance and make her look nerdy or unapproachable.",
      stylePreference: "Subtle, lightweight, minimalist aesthetic (clear acetate or thin titanium).",
    },
    initialMessage: "Hi... I just got this prescription from Dr. Patel. I've never worn prescription glasses in my life and honestly, looking at these display racks is completely overwhelming. I don't even know what looks good on me or what these numbers on my slip mean.",
    learningGoals: [
      "Welcome warmly and demystify the mild prescription in plain language without intimidating medical terms",
      "Conduct empathetic lifestyle discovery about monitor distance, desk lighting, and daily screen habits",
      "Recommend lightweight, complementary frame silhouettes that suit her facial features",
      "Introduce anti-reflective and blue-filtering or premium lens coatings for screen fatigue",
    ],
    skills: [
      "Empathy & Active Listening",
      "Lifestyle Needs Discovery",
      "Frame Silhouette Guidance",
      "Prescription Demystification",
    ],
    keywordsForRAG: ["anti-reflective", "blue-light", "polycarbonate", "cr-39", "frame fit", "lightweight", "acetate"],
    quickPrompts: [
      "Welcome Maya and explain her mild prescription in friendly, reassuring terms",
      "Ask about her daily workspace setup and screen viewing distances",
      "Recommend a subtle, lightweight clear or titanium frame that won't overwhelm her face",
      "Explain how an anti-reflective coating reduces screen glare and eye strain",
    ],
  },
  {
    id: "sc-lens-upgrade",
    title: "Lens Upgrade Discussion",
    category: "Prescription Lenses",
    difficulty: "Intermediate",
    durationMinutes: 8,
    patientPersona: {
      name: "Arthur Pendelton",
      age: 52,
      rxDescription: "OD: -2.00 -0.50 x 090 | OS: -2.25 -0.75 x 085 | ADD: +2.00 OU",
      lifestyleNeed: "Senior architectural consultant who constantly switches between dual 4K CAD monitors, paper blueprints, and active building sites.",
      primaryHesitation: "Friend told him that progressive lenses cause nausea, peripheral swim effect, and make walking down stairs dangerous.",
      stylePreference: "Structured classic frame with adequate vertical lens depth for progressive corridors.",
    },
    initialMessage: "Good afternoon. Dr. Chen wrote an 'ADD +2.00' on my prescription and suggested progressive lenses. But my colleague warned me that progressives give you dizzy spells and that stairs look warped. Why would I pay a premium for digital progressives instead of sticking with over-the-counter reading glasses?",
    learningGoals: [
      "Validate Arthur's hesitation empathetically without being dismissive of his colleague's experience",
      "Clearly explain how progressive corridors work (distance, intermediate corridor, reading zone) in everyday language",
      "Differentiate older conventional progressive lenses from modern digital free-form lenses that minimize swim distortion",
      "Coach practical adaptation strategies (pointing the nose toward the target, head movement vs eye darting)",
    ],
    skills: [
      "Objection Empathy",
      "Progressive Corridor Explanation",
      "Digital Free-Form Differentiation",
      "Patient Adaptation Coaching",
    ],
    keywordsForRAG: ["progressive lenses", "corridor", "free-form", "digital progressive", "anti-reflective", "swim effect", "fitting height"],
    quickPrompts: [
      "Acknowledge Arthur's friend's experience and ask about his typical daily viewing distances",
      "Explain the three visual zones of a progressive lens in plain, non-jargon terms",
      "Highlight how digital free-form technology minimizes peripheral distortion and swim",
      "Provide actionable advice on adaptation and how to glance with the head rather than eyes",
    ],
  },
  {
    id: "sc-brand-compare",
    title: "Customer Comparing Branded Sunglasses",
    category: "Branded Sunglasses",
    difficulty: "Intermediate",
    durationMinutes: 8,
    patientPersona: {
      name: "Jordan Reed",
      age: 34,
      rxDescription: "Plano (Non-prescription sunglass buyer)",
      lifestyleNeed: "Weekend trail runner, fly fisherman, and automotive enthusiast seeking a versatile premium pair.",
      primaryHesitation: "Holding Ray-Ban Aviator (RB3025) in one hand and Oakley Holbrook (OO9102) in the other; confused why one is mineral glass and metal while the other is lightweight polymer.",
      stylePreference: "Durable, high-clarity optics with timeless appeal.",
    },
    initialMessage: "Hey there! I'm trying to decide between these two sunglasses. On one hand, I love this classic Ray-Ban Aviator with the gold metal frame and green glass. On the other hand, the Oakley Holbrook feels much lighter on my face. What are the actual differences between mineral glass and Oakley's Plutonite lenses, and which frame is better for outdoor activities?",
    learningGoals: [
      "Compare optical crystal/mineral glass (Ray-Ban G-15) scratch resistance and weight vs Plutonite impact safety",
      "Detail frame chassis differences: metal wire alloy with adjustable nose pads vs O Matter stress-resistant nylon",
      "Analyze use cases: driving and casual elegance vs active sports and perspiration retention",
      "Check polarization availability and frame fit on Jordan's facial structure",
    ],
    skills: [
      "Brand Heritage & Identity",
      "Lens Material Comparison (Glass vs Plutonite)",
      "Frame Chassis Ergonomics (Metal vs O Matter)",
      "Activity-Specific Recommendation",
    ],
    keywordsForRAG: ["RB3025", "Aviator Classic", "Ray-Ban", "Oakley", "Holbrook", "OO9102", "G-15", "Plutonite", "O Matter", "mineral glass"],
    quickPrompts: [
      "Ask Jordan about the primary environments he plans to wear the sunglasses in",
      "Compare Ray-Ban G-15 mineral glass scratch resistance with Oakley Plutonite impact resistance",
      "Contrast the metal alloy chassis and silicone pads with Oakley's lightweight O Matter frame",
      "Recommend the optimal pair based on whether trail running or driving takes priority",
    ],
  },
  {
    id: "sc-polarization-inquiry",
    title: "Customer Asking About Polarization",
    category: "Specialty Optics",
    difficulty: "Beginner",
    durationMinutes: 7,
    patientPersona: {
      name: "David Kim",
      age: 45,
      rxDescription: "OD: -1.25 SPH | OS: -1.00 -0.25 x 090",
      lifestyleNeed: "Daily highway commuter facing brutal morning and evening sunrise glare, plus occasional weekend boating.",
      primaryHesitation: "Heard that polarized lenses black out dashboard navigation displays and head-up displays (HUD), wondering if it's worth the price.",
      stylePreference: "Modern rectangular wrap or navigator.",
    },
    initialMessage: "I'm looking for sunglasses for my morning highway commute and weekend fishing trips. The sales tag mentions 'Polarized' lenses with a significant upcharge. What exactly does polarization do that normal dark tint doesn't? And is it true that I won't be able to read my car's digital dashboard or smartphone screen with them?",
    learningGoals: [
      "Explain the physics of horizontal reflected glare off asphalt, hoods, and water in accessible terms",
      "Contrast standard tinted lenses (which only dim light) with polarized filters (which selectively block blinding reflected rays)",
      "Acknowledge the digital screen / LCD polarization interaction honestly and explain testing methods",
      "Confirm whether polarized lenses are recommended for driving and water activities",
    ],
    skills: [
      "Glare Mechanics Explanation",
      "Tint vs Polarization Contrast",
      "Digital Display Limitation Transparency",
      "Safety Value Articulation",
    ],
    keywordsForRAG: ["polarized", "polarization", "glare", "horizontal light", "LCD screen", "water", "driving", "anti-reflective"],
    quickPrompts: [
      "Explain how horizontal reflected glare creates optical blindness and how polarized filters eliminate it",
      "Clarify the difference between dimming overall light with tint versus canceling blinding glare",
      "Address the LCD screen concern honestly, explaining why certain instrument angles cross polarize",
      "Demonstrate polarization in-store with a polarization test card or reflection sample",
    ],
  },
  {
    id: "sc-uv-protection",
    title: "Customer Asking About UV Protection",
    category: "Ocular Health & Safety",
    difficulty: "Beginner",
    durationMinutes: 6,
    patientPersona: {
      name: "Sophia Martinez",
      age: 29,
      rxDescription: "Plano (Non-prescription)",
      lifestyleNeed: "Outdoor enthusiast, avid beachgoer, and amateur runner.",
      primaryHesitation: "Believes that the darker the sunglass tint, the better the UV protection. Looking at cheap fashion glasses with pitch-black tint.",
      stylePreference: "Chic oversized or cat-eye silhouette.",
    },
    initialMessage: "I usually buy dark sunglasses from fashion stores because I figured as long as the lenses are really dark black, my eyes are protected from the sun. Why would I pay for certified UV400 lenses here when very dark fashion glasses seem to block more light?",
    learningGoals: [
      "Debunk the widespread dangerous myth: lens tint darkness does NOT equal UV absorption",
      "Explain the biological risk: dark lenses without UV protection cause pupils to dilate, letting MORE harmful UV radiation enter the crystalline lens and retina",
      "Define UV400 certification (blocking 100% of UVA and UVB up to 400 nanometers)",
      "Educate on long-term ocular conditions associated with UV exposure: cataracts, pterygium, and macular damage",
    ],
    skills: [
      "Myth Busting with Scientific Accuracy",
      "Pupillary Dilation Risk Education",
      "UV400 Standard Articulation",
      "Preventive Eye Health Counseling",
    ],
    keywordsForRAG: ["UV400", "ultraviolet", "pupil dilation", "cataracts", "pterygium", "tint darkness", "UVA", "UVB"],
    quickPrompts: [
      "Kindly address the common myth and explain why tint darkness does not correlate with UV filtration",
      "Explain how dark uncertified lenses cause the pupil to dilate and absorb more harmful radiation",
      "Define what UV400 protection actually means (blocking 99-100% of rays up to 400nm)",
      "Explain the long-term ocular health benefits of certified UV protection for preventing cataracts and eye damage",
    ],
  },
  {
    id: "sc-frame-fit-uncertainty",
    title: "Customer Unsure Which Frame Suits Their Needs",
    category: "Frame Styling & Ergonomics",
    difficulty: "Intermediate",
    durationMinutes: 8,
    patientPersona: {
      name: "Priya Patel",
      age: 38,
      rxDescription: "OD: -4.00 -1.00 x 010 | OS: -4.25 -0.75 x 170 | ADD: N/A",
      lifestyleNeed: "Product manager frequently on video conference calls, needing stylish frames that stay comfortable all day.",
      primaryHesitation: "Has a low nasal bridge and prominent cheekbones. Every pair of plastic frames she's owned slides down her nose and rubs on her cheeks when smiling.",
      stylePreference: "Sophisticated modern look, but comfort is now her #1 priority.",
    },
    initialMessage: "I really need help finding a frame that actually fits my face. In the past, whenever I bought acetate frames, they constantly slid down my nose bridge, and the bottom rims rested right against my cheekbones. When I smile, the glasses literally lift off my face. Can you show me what to look for so this doesn't happen again?",
    learningGoals: [
      "Analyze anatomical fit factors: bridge width, nose pad adjustability, pantoscopic tilt, and temple spread",
      "Explain the benefits of Universal Fit (Asian Fit) acetate frames or frames with adjustable titanium silicone nose pads",
      "Factor in her -4.00D prescription: recommend modest eye sizes to keep temporal edge thickness minimal",
      "Guide frame geometry to ensure the bottom eyewire clears her zygomatic arch during smiling",
    ],
    skills: [
      "Facial Anatomy & Bridge Analysis",
      "Universal / Low-Bridge Fit Knowledge",
      "Lens Thickness / Frame Size Synergy",
      "Practical Dispensing Adjustment",
    ],
    keywordsForRAG: ["bridge fit", "universal fit", "nose pads", "pantoscopic tilt", "high-index", "cheek clearance", "frame geometry"],
    quickPrompts: [
      "Examine Priya's bridge anatomy and explain why standard European acetate bridges slide on low nasal profiles",
      "Recommend frames with adjustable nose pads or built-up Universal/Asian fit bridges",
      "Demonstrate checking cheek clearance when smiling before committing to a style",
      "Explain how keeping the lens diameter compact will also reduce edge thickness for her -4.00D Rx",
    ],
  },
  {
    id: "sc-budget-conscious",
    title: "Budget-Conscious Customer",
    category: "Value Communication",
    difficulty: "Intermediate",
    durationMinutes: 7,
    patientPersona: {
      name: "Kevin Miller",
      age: 22,
      rxDescription: "OD: -3.75 -0.50 x 090 | OS: -4.00 SPH | ADD: N/A",
      lifestyleNeed: "University student working part-time; wearing 4-year-old scratched glasses with chipped coating.",
      primaryHesitation: "Very tight monthly budget. Scared that optical shops push expensive add-ons that he doesn't truly need.",
      stylePreference: "Clean, durable everyday frame with good price-to-performance ratio.",
    },
    initialMessage: "I need to get new glasses because my old ones are super scratched, but I have a really strict budget. When I see the prices add up for anti-glare, scratch resistance, and thinner lenses, it feels like buying a new car with endless extras. Can't I just get the most basic plastic lenses with no coatings to keep the price down?",
    learningGoals: [
      "Empathize with Kevin's budget constraints respectfully without making him feel pressured",
      "Explain the practical cost of skipping coatings: untreated plastic scratches easily, causing premature replacement costs",
      "Demonstrate cost-per-day/wear calculation over a 2-year lifespan",
      "Prioritize essential features: AR coating + durable hard coat over luxury aesthetic upgrades",
    ],
    skills: [
      "Empathetic Budget Respect",
      "Cost-per-Wear Framing",
      "Transparent Feature Prioritization",
      "Preventing False Economy Decisions",
    ],
    keywordsForRAG: ["anti-reflective", "hard coat", "polycarbonate", "cr-39", "scratch resistance", "lens durability", "warranty"],
    quickPrompts: [
      "Acknowledge Kevin's budget honestly and reassure him that you will only recommend what provides genuine value",
      "Explain why raw uncoated plastic scratches quickly and becomes unwearable within months",
      "Break down the cost difference on a daily cost-per-wear basis over 2 years",
      "Recommend an essential tier lens package that bundles scratch resistance and anti-glare without unnecessary luxury markups",
    ],
  },
  {
    id: "sc-objection-handling",
    title: "Handling a Customer Objection",
    category: "Objection Handling",
    difficulty: "Advanced",
    durationMinutes: 9,
    patientPersona: {
      name: "Marcus Vance",
      age: 41,
      rxDescription: "OD: -3.50 -1.25 x 015 | OS: -3.25 -1.00 x 165 | ADD: +1.25 OU",
      lifestyleNeed: "Corporate executive who values precision and style, but prides himself on being a savvy, cost-conscious negotiator.",
      primaryHesitation: "Holds up his phone showing an online eyewear discount site offering progressive glasses for $49: 'Why should I pay $350 here?'",
      stylePreference: "Modern rectangular designer frame.",
    },
    initialMessage: "Look here on my phone. This online eyewear site is offering complete progressive glasses with frames and lenses for $49 with free shipping. Your quote is over $300. In this day and age, isn't buying glasses in a physical optical store just paying for your retail rent and markups? Why should I spend six times more here?",
    learningGoals: [
      "Remain completely calm, respectful, and never disparage online retailers or argue defensively",
      "Articulate precise in-person clinical metrics: pantoscopic tilt, vertex distance, monocular pupillary distance, and optical fitting height",
      "Explain the risk of induced prism, optical distortion, and corridor misplacement when buying complex astigmatic progressives online",
      "Detail the value of in-person custom adjustments, lens warranty, and the non-adapt guarantee",
    ],
    skills: [
      "Graceful De-escalation",
      "Clinical Measurement Value Articulation",
      "Induced Prism & Optical Centration Education",
      "In-Person Service & Warranty Justification",
    ],
    keywordsForRAG: ["progressive lenses", "pupillary distance", "fitting height", "pantoscopic tilt", "vertex distance", "optical center", "warranty", "adjustments"],
    quickPrompts: [
      "Acknowledge the price difference calmly without criticizing online retailers",
      "Explain how monocular pupillary distance and segment height must be measured accurately on the patient's face",
      "Describe what happens when a progressive optical center is off by just 1-2mm (induced prism, headaches, eye strain)",
      "Highlight our comprehensive in-person fitting warranty, complimentary ultrasonic adjustments, and adaptation guarantee",
    ],
  },
  {
    id: "sc-product-knowledge",
    title: "General Product Knowledge Practice",
    category: "Comprehensive Practice",
    difficulty: "Advanced",
    durationMinutes: 10,
    patientPersona: {
      name: "Brenda Wallace",
      age: 58,
      rxDescription: "OD: +1.50 -0.75 x 080 | OS: +1.75 -0.50 x 095 | ADD: +2.25 OU",
      lifestyleNeed: "Active CEO who splits time between indoor video presentations, client lunches, and weekend coastal sailing.",
      primaryHesitation: "Overwhelmed by whether photochromic (Transitions) lenses, clip-ons, or a dedicated second prescription sunglass pair is the best solution.",
      stylePreference: "High-end luxury acetate or titanium with refined elegance (Gucci, Prada, or Ray-Ban).",
    },
    initialMessage: "Good morning! I need a comprehensive optical overhaul. I spend half my day in conference rooms under fluorescent tubes presenting on screen, and my weekends sailing on the water. I'm torn: should I get one pair of photochromic lenses that darken outside, or should I invest in a primary pair of digital progressives and a dedicated pair of prescription polarized sunglasses?",
    learningGoals: [
      "Analyze the optical limitations of photochromic lenses inside automobiles (windshield blocks UV required for darkening) and on open water (lack of polarization against water glare)",
      "Explain the tailored benefits of a two-pair dispensing strategy: anti-reflective clear progressives for office + polarized prescription sunglasses for sailing",
      "Reference verified heritage brands (Gucci, Prada, Ray-Ban) matching her aesthetic and durability requirements",
      "Deliver a seamless, consultative recommendation that addresses all visual scenarios with authority",
    ],
    skills: [
      "Multi-Pair Dispensing Strategy",
      "Photochromic vs Polarized Technology Comparison",
      "Automotive & Marine Light Environment Analysis",
      "Luxury Brand Curation & Guidance",
    ],
    keywordsForRAG: ["photochromic", "polarized", "transitions", "water glare", "windshield UV", "two-pair", "Ray-Ban", "Prada", "Gucci", "anti-reflective"],
    quickPrompts: [
      "Commend Brenda on thinking ahead and ask how much driving and open-water sailing she does",
      "Explain why photochromic lenses do not darken behind car windshields and lack horizontal glare polarization",
      "Propose the optimal two-pair solution: clear digital progressives with AR coating for indoors, plus polarized sunglasses for sailing",
      "Present verified luxury frame options from Ray-Ban, Prada, or Gucci that pair style with optical performance",
    ],
  },
];

export function getScenarioById(id: string): OptiCoachScenario | undefined {
  return OPTICAL_SCENARIOS.find((s) => s.id === id);
}
