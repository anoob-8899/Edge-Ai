import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

// Clearly labeled seed data - Never presented as real staff activity.
console.log("=== SEEDING OPTICAL LEARNING LIBRARY (DEVELOPMENT SEED DATA) ===");

async function main() {
  // 1. Seed System Users
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@apexoptics.com" },
    update: {
      name: "Dr. Marcus Vance (Practice Owner)",
      role: "OWNER",
      passwordHash,
    },
    create: {
      email: "owner@apexoptics.com",
      name: "Dr. Marcus Vance (Practice Owner)",
      role: "OWNER",
      passwordHash,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@apexoptics.com" },
    update: {
      name: "Alex Chen (Staff Optician)",
      role: "STAFF",
      passwordHash,
    },
    create: {
      email: "staff@apexoptics.com",
      name: "Alex Chen (Staff Optician)",
      role: "STAFF",
      passwordHash,
    },
  });

  console.log(`Users seeded: Owner (${owner.email}), Staff (${staff.email})`);

  // 2. Define the 7 Required Categories with Subcategories, Lessons, and Quizzes
  const categoriesData = [
    {
      slug: "branded-sunglasses",
      name: "Branded Sunglasses",
      description: "Iconic eyewear archetypes, heritage frame silhouettes, and performance sport shields.",
      icon: "Sun",
      orderIndex: 1,
      subcategories: [
        {
          slug: "heritage-aviator",
          name: "Heritage & Aviator Eyewear",
          description: "Aviation-origin silhouettes, teardrop coverage, and thin wire double-bridge construction.",
          orderIndex: 1,
          lessons: [
            {
              slug: "classic-aviator-optics",
              title: "Classic Aviator Silhouette & Teardrop Optical Coverage",
              summary: "Explore the dual-bridge architecture, expanded lower-quadrant field of vision, and vertex considerations of pilot frames.",
              definitions: `**Aviator Frame:** An iconic metal or acetate frame geometry characterized by a teardrop lens shape, dual or triple brow-bar bridges, and thin temples designed originally in the 1930s for aviators needing glare protection while glancing down at flight instruments.

**Brow Bar (Sweat Bar):** A secondary horizontal reinforcing cross-wire positioned above the primary bridge to stabilize thin wire chassis and historically prevent perspiration from rolling onto lenses.`,
              characteristics: `• **Expanded Lower-Quadrant Coverage:** Drooping convex lower perimeter shields reflected glare coming from below (such as instrument panels, cockpits, or open water).
• **Dual/Triple Bridge:** Increases torsional rigidity across large lens apertures, preventing frame twist under minor stress.
• **Base Curve Geometry:** Typically utilizes a flatter 6-base curve in vintage optical models, requiring precise lens beveling to prevent pop-outs in thin metal rims.
• **Bayonet or Cable Temples:** Straight temples engineered to slide easily under flight helmets or ear-defenders without curling behind the mastoid bone.`,
              practicalApplications: `• **Patient Lifestyle Discovery:** Excellent recommendation for drivers, boaters, and outdoor enthusiasts who need wide vertical peripheral vision without tilting the head downward.
• **Dispensing Technique:** Ensure the teardrop contour clears the patient's zygomatic arch (cheekbones) when smiling; otherwise, cheek movement will push the frame upward.
• **Prescription Limitations Guidance:** Advise patients with moderate-to-high minus prescriptions (> -3.00D) that large eye sizes (>58mm) will show pronounced edge thickness in the temporal and inferior corners.`,
              misconceptions: `• **Misconception:** All aviators are universally suitable for progressive lenses without adjustment.
• **Reality:** While the vertical depth (B-measurement) is generous, extreme lower nasal tapering can cut off the near reading corridor if progressive fitting heights are not meticulously verified.`,
              limitations: `• Lower cheek clearance issues on individuals with high cheekbones or flatter nasal bridges.
• Heavy optical glass lenses in large aviator sizes can cause nose pad slippage if silicone pads are not correctly aligned.`,
              brandModelReferences: `*Educational Design Examples (General Reference Only):*
• **Ray-Ban RB3025 Aviator Classic:** Hallmark teardrop wire frame with G-15 mineral glass lenses and adjustable crystal pads.
• **Randolph Engineering Aviator:** Military-spec squared-off teardrop with 23k gold plating and signature straight bayonet temples.
• **American Optical Original Pilot:** Compact aviator contour engineered for fighter pilots with minimal helmet interference.`,
              orderIndex: 1,
              quizQuestions: [
                {
                  question: "Why was the teardrop lower perimeter originally designed for pilot aviators?",
                  options: JSON.stringify([
                    "To reduce frame manufacturing costs by using less wire",
                    "To provide expansive downward coverage when reading cockpit instrument panels",
                    "To prevent eyelashes from touching the front lens surface",
                    "To force progressive corridors into a horizontal configuration"
                  ]),
                  correctOptionIndex: 1,
                  explanation: "The distinctive downward slope of the teardrop lens was engineered so pilots could glance down at cockpit dials and maps with full UV and glare coverage without moving their head.",
                  orderIndex: 1,
                },
                {
                  question: "What physical fit issue commonly occurs when fitting an oversized teardrop aviator on high cheekbones?",
                  options: JSON.stringify([
                    "The frame temple length becomes artificially shortened",
                    "The lower rim touches the cheekbones and lifts up during smiling or facial expressions",
                    "The pantoscopic tilt spontaneously increases by 15 degrees",
                    "The pupillary distance shrinks automatically"
                  ]),
                  correctOptionIndex: 1,
                  explanation: "Because aviator lenses have deep vertical drops, patients with high cheekbones frequently experience the bottom rim resting on their cheeks, which pushes the frame upward whenever they smile.",
                  orderIndex: 2,
                }
              ]
            },
            {
              slug: "wayfarer-bold-acetate",
              title: "Wayfarer Silhouette & Trapezoidal Acetate Styling",
              summary: "Analyze mid-century trapezoidal frames, substantial pantoscopic tilt, and facial contour balancing.",
              definitions: `**Wayfarer Silhouette:** A trapezoidal frame geometry introduced in the 1950s that transitioned eyewear from thin wire metals to thick, hand-polished cellulose acetate.

**Pantoscopic Tilt:** The angle of the frame front relative to the vertical plane when worn, angling the lower rims toward the wearer's cheeks. Classic Wayfarers feature an aggressive forward tilt (approx. 10°–14°).`,
              characteristics: `• **Trapezoidal Lens Apertures:** Wider across the upper browline, tapering subtly toward a narrower squared base.
• **Pronounced Pantoscopic Rake:** Creates an assertive aesthetic profile but requires careful optical alignment.
• **Solid 5-Barrel or 7-Barrel Hinges:** Pinned through the acetate face for robust hinge longevity and tactile resistance.
• **Integrated Keyhole or Saddle Bridge:** Distributes frame weight over a broader nasal surface area without nose pads.`,
              practicalApplications: `• **Face Shape Balancing:** The angular top line balances oval, round, and heart-shaped faces by adding structured horizontal definition.
• **Everyday Durability:** Cellulose acetate absorbs daily handling stress better than brittle injection-molded plastics.
• **RX Dispensing Caution:** High pantoscopic tilt requires compensating optical center (OC) height rules (e.g., Martin's Rule of Tilt: drop OC by 1mm for every 2 degrees of tilt).`,
              misconceptions: `• **Misconception:** Classic Wayfarers fit every bridge type comfortably right out of the case.
• **Reality:** Due to fixed acetate bridge geometry, patients with flat or wide nasal bridges may experience bridge gap or cheek resting. Alternative fit (low-bridge fit) versions with built-up nose pads are often required.`,
              limitations: `• Fixed acetate bridge cannot be adjusted like screw-in metal pads.
• Aggressive factory tilt can cause eyelashes to rub against upper lens bevels on deep-set eyes.`,
              brandModelReferences: `*Educational Design Examples (General Reference Only):*
• **Ray-Ban Original Wayfarer RB2140:** Original 1952 mold with pronounced pantoscopic tilt and heavy-gauge acetate temples.
• **Ray-Ban New Wayfarer RB2132:** Modernized iteration with reduced pantoscopic angle, softer contours, and lighter temporal gauge.`,
              orderIndex: 2,
              quizQuestions: [
                {
                  question: "What optical dispensing adjustment rule must be considered when fitting frames with high pantoscopic tilt like the classic Wayfarer?",
                  options: JSON.stringify([
                    "Increase the cylinder power by 0.50D",
                    "Lower the optical center by 1mm for every 2 degrees of pantoscopic tilt",
                    "Rotate the cylinder axis by 90 degrees",
                    "Double the vertex distance"
                  ]),
                  correctOptionIndex: 1,
                  explanation: "According to Martin's Rule of Tilt, whenever a frame possesses pantoscopic tilt, the optical center must be lowered by 1mm for every 2 degrees of tilt relative to the pupil center to eliminate induced astigmatism.",
                  orderIndex: 1,
                }
              ]
            }
          ]
        },
        {
          slug: "sport-performance",
          name: "Sport Performance Eyewear",
          description: "High-wrap aerodynamic frames, shatterproof shields, and interchangeable retention ergonomics.",
          orderIndex: 2,
          lessons: [
            {
              slug: "high-wrap-toric-shields",
              title: "High-Wrap Base Curves & Impact-Resistant Toric Shields",
              summary: "Master 8-base wrap physics, peripheral wind protection, and prism compensation in wrap sunglasses.",
              definitions: `**Base Curve:** The front surface curvature of a lens blank measured in diopters, where 4-base is relatively flat, 6-base is standard lifestyle curvature, and 8-base is a wrap-around sports profile.

**Face Form Angle (Frame Wrap):** The dihedral angle between the frame planes of the two eyes, curving around the face for peripheral coverage and aerodynamic shielding.`,
              characteristics: `• **8-Base / 9-Base Wrap:** Closely follows cranial contours to block unfiltered ambient light, wind, and airborne debris.
• **Hydrophilic Elastomer Grips (e.g., Unobtainium):** Nose pads and temple socks that increase friction and grip when exposed to moisture and sweat.
• **Toric Single-Shield Lenses:** Cylindrical or toroidal curved shields providing seamless panoramic vision without a central bridge seam.`,
              practicalApplications: `• **Cyclists, Runners, & Golfers:** Prevents wind-induced dry eye, stabilizes position during intense head movement, and expands peripheral visual field.
• **Prescription Dispensing Rule:** High wrap induces oblique astigmatism and unwanted base-out prism. Must use digitally compensated digital free-form lenses that calculate compensated Rx powers.`,
              misconceptions: `• **Misconception:** Any standard optical lab can edge standard single-vision lenses into an 8-base sports frame.
• **Reality:** Standard flat prescription bevels will either slip out of high-wrap frame grooves or introduce severe optical distortion and peripheral blur. High-wrap specific bevel profiles and digital ray-tracing calculation are mandatory.`,
              limitations: `• Prescription power range is typically restricted (e.g., +2.00D to -4.00D with cylinder <= 2.00D) unless using stepped-edge inserts or prescription dock adapters.`,
              brandModelReferences: `*Educational Design Examples (General Reference Only):*
• **Oakley Radar EV Path:** Extended vertical view 1-piece toric shield with upper surge vents for cycling.
• **Oakley Flak 2.0 XL:** Dual-lens semi-rimless performance frame with standard 8.75 base curvature and interchangeable lens options.`,
              orderIndex: 1,
              quizQuestions: [
                {
                  question: "What optical artifact is induced when a standard prescription lens is placed into an 8-base high wrap sports frame without digital compensation?",
                  options: JSON.stringify([
                    "Unwanted oblique astigmatism and base-out prismatic effect",
                    "Excessive blue-light transmission",
                    "Reduction in Abbe value to zero",
                    "Spontaneous progressive corridor lengthening"
                  ]),
                  correctOptionIndex: 0,
                  explanation: "Tilting or wrapping a lens induces unwanted cylinder power (oblique astigmatism) and prismatic power. Digitally compensated lenses are required to offset these optical aberrations.",
                  orderIndex: 1,
                }
              ]
            }
          ]
        }
      ]
    },
    {
      slug: "frame-shapes",
      name: "Frame Shapes",
      description: "Geometry, facial symmetry balancing, optical centration, and vintage vs. contemporary archetypes.",
      icon: "Shapes",
      orderIndex: 2,
      subcategories: [
        {
          slug: "geometric-contours",
          name: "Geometric & Classic Contours",
          description: "Rectangles, squares, pantos, and rounds analyzed through facial proportions.",
          orderIndex: 1,
          lessons: [
            {
              slug: "rectangular-and-square-frames",
              title: "Rectangular, Square, and Angular Frames",
              summary: "How structured straight edges provide vertical proportion balancing and accommodate diverse prescription powers.",
              definitions: `**Angular Frame Geometry:** Eyewear profiles dominated by straight horizontal brows and vertical temporal walls, creating clear rectangular or square borders.

**Geometric Contrast Principle:** The visual styling principle of selecting a frame geometry that contrasts with the natural skeletal contours of the wearer's face.`,
              characteristics: `• **Definitive Horizontal Browline:** Accentuates eye level and creates the perception of greater facial width on narrow faces.
• **Crisp Corners:** Offers sharp angles that complement and contrast soft, rounded jawlines and fuller cheeks.
• **Lens Centration Dynamics:** Rectangles keep the vertical B-measurement compact, making them well-suited for high-minus lenses where vertical edge thickness needs containment.`,
              practicalApplications: `• **Face Matching:** Ideal for Round and Oval face types seeking structure and elongation.
• **High Minus Prescriptions:** A narrow rectangular frame minimizes lateral and vertical lens edge thickness compared to round or oversized silhouettes.`,
              misconceptions: `• **Misconception:** Square frames are universally bad for square jawlines.
• **Reality:** Soft-cornered or rounded-square (wayfarer-hybrid) frames can look striking on square jaws if the width of the frame front slightly exceeds the widest portion of the cheekbones.`,
              limitations: `• Ultra-shallow rectangular frames (B-measurement < 28mm) are unsuitable for modern progressive lenses, as the reading corridor will be cut off.`,
              brandModelReferences: `*Educational Design Examples (General Reference Only):*
• **Classic Soft-Square Acetate:** Timeless 52-18 rectangular frame balancing business professional attire with robust acetate construction.`,
              orderIndex: 1,
              quizQuestions: [
                {
                  question: "Why does a compact rectangular frame benefit a customer with a high minus prescription (-6.00D)?",
                  options: JSON.stringify([
                    "Because rectangular frames eliminate the need for anti-reflective coatings",
                    "Because smaller vertical and horizontal dimensions reduce edge thickness at the perimeters",
                    "Because minus lenses do not have edge thickness in rectangular shapes",
                    "Because rectangular frames prevent progressive prism thinning"
                  ]),
                  correctOptionIndex: 1,
                  explanation: "In minus lenses, thickness increases towards the periphery. Reducing the frame's eye size (A) and vertical depth (B) trims away the thickest outer borders of the finished lens.",
                  orderIndex: 1,
                }
              ]
            },
            {
              slug: "round-oval-panto-shapes",
              title: "Round, Oval, and Panto Frame Geometries",
              summary: "Examine circular symmetry, panto pantoscopic proportions, and center-pupil alignment advantages.",
              definitions: `**Panto Geometry:** A classic optical silhouette combining a high, flattened top brow with a fully rounded or ovalized lower curve, mimicking the natural orbital bone socket.

**Pupillary Centration:** The degree to which the patient's pupil sits in the geometric center of the frame lens aperture.`,
              characteristics: `• **Optimal Optical Decentration:** Round and panto shapes generally place the patient's pupil closer to the optical center of the blank, minimizing lens blank waste and reducing decentration thickness.
• **Soft Orbital Harmony:** Mimics human eye socket anatomy, creating a friendly, scholarly, and approachable aesthetic.
• **Keyhole Bridge Synergy:** Panto frames frequently pair with keyhole bridges to rest gracefully on the sides of the nose crest.`,
              practicalApplications: `• **High Plus Prescriptions:** Round frames minimize center thickness for hyperopic lenses by reducing effective diameter (ED).
• **Square & Angular Faces:** Softens prominent, chiseled jawlines and strong cheekbones through organic curvaceous contrast.`,
              misconceptions: `• **Misconception:** Perfectly circular frames suit all face shapes.
• **Reality:** Completely spherical round frames draw extreme attention to facial symmetry and can accentuate facial roundness on circular faces. Panto or soft oval styles offer far broader aesthetic compatibility.`,
              limitations: `• High astigmatism prescriptions with round lenses require secure bevel locking; if the lens rotates even 2-3 degrees inside a loose round eyewire, the cylinder axis is ruined.`,
              brandModelReferences: `*Educational Design Examples (General Reference Only):*
• **Moscot Lemtosh / Tart Arnel Archetype:** Iconic mid-century panto shape with diamond rivets and keyhole bridge.`,
              orderIndex: 2,
              quizQuestions: [
                {
                  question: "What is an important technical laboratory consideration when mounting lenses with strong astigmatism into completely round frames?",
                  options: JSON.stringify([
                    "Lenses in round eyewires can rotate if not tightly beveled, throwing off the cylinder axis",
                    "Round eyewires require base 10 curve lenses exclusively",
                    "Round frames cannot be made in acetate",
                    "Astigmatism cannot be corrected in round frames"
                  ]),
                  correctOptionIndex: 0,
                  explanation: "Because a circle has no corners to mechanically lock the lens, any slight looseness in sizing can allow the lens to spin in the eyewire, which misaligns the prescribed astigmatism axis.",
                  orderIndex: 1,
                }
              ]
            }
          ]
        }
      ]
    },
    {
      slug: "frame-materials",
      name: "Frame Materials and Construction",
      description: "Cellulose acetate, metals, titanium alloys, memory wire, and hypoallergenic considerations.",
      icon: "Wrench",
      orderIndex: 3,
      subcategories: [
        {
          slug: "polymers-and-plastics",
          name: "Cellulose & High-Tech Polymers",
          description: "Acetate block curation vs. injection-molded nylon, propionate, and Optyl.",
          orderIndex: 1,
          lessons: [
            {
              slug: "cellulose-acetate-vs-injection-molded",
              title: "Cellulose Acetate vs. Injection-Molded Polyamide & TR-90",
              summary: "Understand heat-adjustability, wire cores, molecular structure, and hypoallergenic qualities in eyewear plastics.",
              definitions: `**Cellulose Acetate:** A semi-synthetic polymer derived from cotton flock and wood pulp, plasticized into cured sheets, cut with CNC mills, and hand-tumbled for superior sheen and thermal adjustability.

**TR-90 (Grilamid) / Polyamide:** A thermoplastic nylon material characterized by extreme flexibility, lightness, memory retention, and high heat resistance.`,
              characteristics: `• **Cellulose Acetate:**
  - Contains metal core wire in temples for custom anatomical bending.
  - Can be heated gently on a frame warmer to reshape bridge and temple curves.
  - Deep luster and rich tortoiseshell variegation throughout the entire sheet depth.
• **Injection Polyamide (TR-90):**
  - Ultra-lightweight (often 20% lighter than acetate).
  - High elasticity that returns to its original molded shape ("memory effect").
  - Molded into final shape; does not accept permanent cold or warm bends easily.`,
              practicalApplications: `• **Custom Fitting:** Recommend cellulose acetate when the patient has asymmetric ear heights or unique mastoid contours requiring manual temple adjustments.
• **Athletes & Children:** Recommend TR-90 or injection polymers when weight reduction, shatter resistance, and active sweat resistance are paramount.`,
              misconceptions: `• **Misconception:** Acetate frames and cheap plastic sunglasses found at convenience stores are the same material.
• **Reality:** Cheap frames use petroleum-based injection-molded polycarbonate or polystyrene that is brittle, painted on the surface (peels over time), and snaps when heated.`,
              limitations: `• Acetate can dry out and develop whitish oxidation after years of exposure to skin acids and UV if not polished.
• TR-90 cannot be easily adjusted; attempting to forcefully bend cold TR-90 will cause it to snap back or stress-whiten.`,
              brandModelReferences: `*Educational Design Examples (General Reference Only):*
• **Mazzucchelli 1849 Acetate:** Premium Italian cellulose acetate renowned for rich tactile warmth and artisanal color formulations.`,
              orderIndex: 1,
              quizQuestions: [
                {
                  question: "Why is a metal wire core inserted into cellulose acetate temples during manufacturing?",
                  options: JSON.stringify([
                    "To conduct electrical grounding for smart eyewear",
                    "To allow the optician to adjust and hold custom bends behind the wearer's ear",
                    "To make the frame magnetic so it sticks to optical displays",
                    "To reduce the cost of acetate material"
                  ]),
                  correctOptionIndex: 1,
                  explanation: "Cellulose acetate is thermoplastic; the embedded metal wire core provides structural integrity and allows the dispensing optician to bend and hold custom contours for the patient's ears.",
                  orderIndex: 1,
                }
              ]
            }
          ]
        },
        {
          slug: "metals-and-alloys",
          name: "Metals & Advanced Alloys",
          description: "Monel, pure titanium, beta-titanium, and memory alloys analyzed for weight and durability.",
          orderIndex: 2,
          lessons: [
            {
              slug: "titanium-vs-monel-and-memory-metal",
              title: "Monel, Pure Titanium, and Beta-Titanium Alloys",
              summary: "Compare tensile strength, nickel allergies, corrosion resistance, and soldering characteristics in metal chassis.",
              definitions: `**Monel:** A ductile copper-nickel-iron alloy commonly used for standard metal frames, typically electroplated with protective coatings.

**Beta-Titanium (Beta-Titanium):** An advanced alloy composed of pure titanium blended with elements like vanadium and aluminum, offering remarkable flexibility and spring-back memory while remaining hypoallergenic.`,
              characteristics: `• **Pure Titanium:** 48% lighter than nickel-silver/monel, 100% hypoallergenic, impervious to sweat corrosion and saltwater.
• **Monel:** Economical and easy to solder and adjust in the clinic, but contains nickel which can cause contact dermatitis if the protective plating wears down.
• **Beta-Titanium:** Allows ultra-thin flexible temple wires that flex outward over wide craniums without permanent deformation.`,
              practicalApplications: `• **Patients with Nickel Sensitivity:** Always recommend 100% Pure Titanium or Beta-Titanium to prevent skin erythema, itching, and dermatitis.
• **Corrosion Environments:** Ideal for patients who perspire heavily, live in coastal marine environments, or work outdoors.`,
              misconceptions: `• **Misconception:** All metal frames with 'Titanium' written on the temple are 100% pure titanium throughout the entire frame.
• **Reality:** Frames are often hybrid: pure titanium front with beta-titanium flexible temples, or only the bridge may be titanium. Opticians must check manufacturer stamps (e.g., 'Pure Titanium' vs. 'Titanium Alloy').`,
              limitations: `• Pure titanium requires specialized argon laser welding equipment and cannot be repaired using standard clinic solder torches.
• Pure titanium has lower elasticity than beta-titanium, making it stiffer during bridge alignment.`,
              brandModelReferences: `*Educational Design Examples (General Reference Only):*
• **Japanese Precision Titanium:** Renowned for high-tolerance ion-plated titanium frames that provide decades of rust-free longevity.`,
              orderIndex: 1,
              quizQuestions: [
                {
                  question: "Which metal frame material should be recommended to a patient who reports an allergic reaction (dermatitis) to nickel jewelry?",
                  options: JSON.stringify([
                    "Uncoated Monel",
                    "Standard Nickel-Silver (German Silver)",
                    "100% Pure Titanium or Beta-Titanium",
                    "Plated brass"
                  ]),
                  correctOptionIndex: 2,
                  explanation: "Pure Titanium and Beta-Titanium are biocompatible and 100% nickel-free, making them the gold standard for patients with contact metal allergies.",
                  orderIndex: 1,
                }
              ]
            }
          ]
        }
      ]
    },
    {
      slug: "sunglass-lens-knowledge",
      name: "Sunglass Lens Knowledge",
      description: "Polarization physics, Brewster's angle, absorption tint curves, and mirror coatings.",
      icon: "SunMedium",
      orderIndex: 4,
      subcategories: [
        {
          slug: "polarization-science",
          name: "Polarization & Glare Suppression",
          description: "Dichroic PVA film alignment, horizontal glare extinction, and technical limitations.",
          orderIndex: 1,
          lessons: [
            {
              slug: "linear-polarization-mechanics",
              title: "Linear Polarization Mechanics & Brewster's Angle",
              summary: "How polyvinyl alcohol (PVA) stretched iodine filters extinguish blinding horizontal glare without darkening the visual field excessively.",
              definitions: `**Polarized Lens:** A sunglass lens containing an embedded microscopic dichroic iodine-dyed stretched polyvinyl alcohol (PVA) film that selectively blocks horizontally polarized reflected light.

**Brewster's Angle:** The angle of incidence at which light with a particular polarization is perfectly transmitted through a surface without reflection (e.g., approx. 53° for water, 56° for asphalt). At this angle, reflected glare is 100% horizontally polarized.`,
              characteristics: `• **Microscopic Polarizing Axis:** Aligned strictly vertically at 90° to cancel horizontal glare waves reflected off flat planes.
• **Contrast Sharpening:** Removes the obscuring white haze of surface reflections, revealing rich underlying hues and optical clarity.
• **Superior Visual Comfort:** Substantially reduces pupil constriction strain and squints during midday driving or water navigation.`,
              practicalApplications: `• **Maritime & Fishing:** Enables anglers to see beneath the water's surface by extinguishing blinding surface reflection.
• **Highway Driving:** Eradicates reflective glare coming off wet asphalt and preceding vehicle windshields.
• **Post-Refractive Surgery:** Enhances contrast sensitivity for patients recovering from LASIK or cataract procedures.`,
              misconceptions: `• **Misconception:** Polarized lenses block 100% of UV rays simply because they are polarized.
• **Reality:** Polarization eliminates glare, NOT ultraviolet radiation. UV400 protection requires specific chemical UV absorbers in the lens substrate or coating, independent of the polarizing filter.`,
              limitations: `• **LCD & HUD Screen Blackout:** Can cause dark patterns or total blackout when viewing polarized cockpit instrument panels, smartphone screens in landscape orientation, or automotive Heads-Up Displays (HUD).
• **Snowboarding & Skiing:** Eliminates the reflective shine off icy patches, making it harder for high-speed skiers to detect dangerous black ice patches.`,
              brandModelReferences: `*Educational Design Examples (General Reference Only):*
• **Maui Jim PolarizedPlus2:** High-efficiency polarizing filter combined with rare-earth element lens infusion for vibrant color contrast.
• **Costa 580G Mineral Glass Polar:** 580nm harsh yellow light elimination layer embedded in scratch-resistant glass lenses.`,
              orderIndex: 1,
              quizQuestions: [
                {
                  question: "Why can polarized sunglasses pose a safety drawback for high-speed downhill skiers?",
                  options: JSON.stringify([
                    "They cause the snow to melt faster due to heat absorption",
                    "They extinguish the telltale reflective glare that indicates patches of slick ice on the slopes",
                    "They decrease the field of vision to under 40 degrees",
                    "They alter the refractive index of the ski goggles"
                  ]),
                  correctOptionIndex: 1,
                  explanation: "Because ice reflects light horizontally, polarized lenses eliminate that shine. On a ski slope, that shine warns skiers of ice patches; removing it makes ice invisible until skied upon.",
                  orderIndex: 1,
                },
                {
                  question: "What optical mechanism causes horizontal glare to be blocked by polarized sunglasses?",
                  options: JSON.stringify([
                    "A mirror coating that reflects 100% of incoming light",
                    "A vertically oriented dichroic filter that blocks horizontally oscillating light waves",
                    "A thick layer of blue-blocker pigment",
                    "A convex lens shape that bends light outwards"
                  ]),
                  correctOptionIndex: 1,
                  explanation: "Polarizing filters contain stretched iodine PVA crystal chains oriented vertically, allowing vertical light waves to pass while blocking horizontal waves.",
                  orderIndex: 2,
                }
              ]
            }
          ]
        },
        {
          slug: "tints-and-coatings",
          name: "Tints, Gradients, and Flash Coatings",
          description: "Transmission curves of Grey, Brown, Green (G-15), and gradient optical treatments.",
          orderIndex: 2,
          lessons: [
            {
              slug: "absorption-tint-spectra",
              title: "Absorption Tint Curves: Grey, Brown, and G-15 Green",
              summary: "Learn spectral transmission curves, color fidelity versus contrast enhancement, and category luminous transmittance.",
              definitions: `**Luminous Transmittance (VLT%):** The percentage of visible light that passes through a lens. Category 3 sunglasses transmit between 8% and 18% VLT.

**G-15 Green Tint:** A military-developed lens formulation transmitting 15% green/grey light, closely matching the human eye's peak sensitivity curve for natural color balance.`,
              characteristics: `• **Neutral Grey:** Provides true color rendition across all visible wavelengths without color distortion; best for general bright sunlight.
• **Brown / Amber:** Selectively absorbs blue light waves, boosting edge contrast, depth perception, and distance foliage recognition.
• **G-15 Neutral Green:** Highlights green-yellow wavelengths while dampening harsh glare, creating soothing visual comfort for prolonged wear.
• **Gradient Tints:** 80% absorption at the top fading to 20% at the bottom; optimal for driving where the dashboard needs clear illumination while the sky is shielded.`,
              practicalApplications: `• **Golfers & Hunters:** Recommend Amber/Brown to pop targets and ball trajectories against green terrain.
• **Pilots & Photographers:** Recommend Neutral Grey for accurate terrain color evaluation and color-critical field assessments.`,
              misconceptions: `• **Misconception:** The darker the lens tint, the better the UV protection.
• **Reality:** A dark lens with poor UV protection dilates the wearer's pupil, allowing dangerous UVA and UVB rays to flood into the dilated eye, causing more retinal damage than wearing no glasses at all.`,
              limitations: `• Category 4 lenses (VLT < 8%) are legally prohibited for driving due to extreme light restriction.`,
              brandModelReferences: `*Educational Design Examples (General Reference Only):*
• **Classic G-15 Green Mineral Glass:** Renowned for calm neutral contrast that mirrors human photopic ocular sensitivity.`,
              orderIndex: 1,
              quizQuestions: [
                {
                  question: "Why is a dark Category 3 sunglass lens with NO UV protection more hazardous than wearing no sunglasses at all?",
                  options: JSON.stringify([
                    "It causes the frame to heat up and burn the skin",
                    "It dilates the pupil in the dark environment, allowing more harmful unfiltered UV rays to enter the eye",
                    "It causes immediate astigmatism",
                    "It breaks the lens bevel"
                  ]),
                  correctOptionIndex: 1,
                  explanation: "Dark lenses reduce visible light, prompting the eye's natural pupil to expand (dilate). If UV-blocking chemistry is absent, the enlarged pupil absorbs significantly more damaging UV radiation than a constricted pupil in bright sunlight.",
                  orderIndex: 1,
                }
              ]
            }
          ]
        }
      ]
    },
    {
      slug: "fit-and-sizing",
      name: "Fit and Sizing",
      description: "Boxing system nomenclature, bridge alignment, temple ergonomics, and low-bridge considerations.",
      icon: "Ruler",
      orderIndex: 5,
      subcategories: [
        {
          slug: "boxing-system-measurements",
          name: "Anatomical Measurements & Boxing System",
          description: "Understanding A, B, DBL, ED, temple length, vertex distance, and pantoscopic tilt.",
          orderIndex: 1,
          lessons: [
            {
              slug: "boxing-system-explained",
              title: "The Boxing System: A, B, DBL, and Effective Diameter (ED)",
              summary: "Decipher standard eyewear dimensional notation [52 [] 18 - 140] and its real-world physical and optical fitting consequences.",
              definitions: `**Boxing System:** The international standardized method (ISO / ANSI) of measuring optical frame dimensions inside imaginary bounding rectangles around the lens apertures.

• **A-Measurement:** The horizontal distance between the two vertical bounding lines of the lens aperture.
• **B-Measurement:** The vertical distance between the two horizontal bounding lines of the lens aperture.
• **DBL (Distance Between Lenses):** The minimum horizontal distance between the nasal eyewires (bridge width).
• **ED (Effective Diameter):** Twice the distance from the geometric center of the lens to the farthest corner/edge, determining the minimum blank size required for edging.`,
              characteristics: `• **Frame PD:** Calculated as \`A + DBL\`. When Frame PD equals the patient's anatomical Pupillary Distance (PD), lens decentration is zero!
• **Minimum Blank Size (MBS) Formula:** \`MBS = ED + 2(Decentration) + 2mm allowance\`.
• **Temple Length:** Stamped as the third number (e.g., 140mm or 145mm), measured from the hinge screw to the end of the bent temple tip.`,
              practicalApplications: `• **Optical Decentration Management:** To minimize high-prescription lens thickness, select a frame whose Frame PD closely matches the customer's anatomical PD.
• **Progressive Lens Fitting:** Always ensure the B-measurement accommodates the progressive design's minimum fitting height (typically >= 14mm to 18mm from pupil center to bottom eyewire).`,
              misconceptions: `• **Misconception:** The A-measurement alone indicates whether a frame will fit the width of a patient's head.
• **Reality:** Total frame front width depends on \`A + DBL + endpiece extensions\`. A 50mm frame with wide extended hinges can fit wider than a 54mm frame with flush hinges.`,
              limitations: `• The stamped numbers only represent internal eyewire dimensions, not external chassis boundaries or facial temple clearance.`,
              brandModelReferences: `*Educational Design Examples (General Reference Only):*
• **Standard Optical Stamping:** Example: \`54 [] 17 140\` stamped on the inner left temple or bridge underside.`,
              orderIndex: 1,
              quizQuestions: [
                {
                  question: "If a frame is stamped '52 [] 18 140' and the patient has an anatomical Pupillary Distance (PD) of 62mm, what is the total decentration required?",
                  options: JSON.stringify([
                    "0mm (Zero decentration)",
                    "8mm total (4mm per eye inward)",
                    "16mm total (8mm per eye outward)",
                    "2mm total"
                  ]),
                  correctOptionIndex: 1,
                  explanation: "Frame PD = A (52) + DBL (18) = 70mm. The patient's PD is 62mm. The difference is 70mm - 62mm = 8mm total decentration (4mm inward per lens).",
                  orderIndex: 1,
                }
              ]
            },
            {
              slug: "bridge-types-and-low-bridge-fit",
              title: "Bridge Anatomy: Saddle, Keyhole, and Low-Bridge (Asian Fit)",
              summary: "Analyze nasal weight distribution, crest clearance, silicone nose pad mechanics, and alternative fit geometry.",
              definitions: `**Saddle Bridge:** A continuous arched bridge that rests flush across the entire top crest of the nose, spreading frame weight evenly.

**Keyhole Bridge:** A bridge styled like an antique keyhole that flares at the top to clear the nasal crest, resting primarily on the lateral sides of the nose.

**Low-Bridge Fit (Alternative / Asian Fit):** Eyewear engineered with built-up nasal pads, reduced frame curvature, and narrower bridge spacing for wearers with lower nasal bridges and higher cheekbones.`,
              characteristics: `• **Adjustable Guard Arms:** Metal arms with screw-in or click-in pads that can be adjusted in three dimensions (splay, frontal angle, vertical height).
• **Nose Pad Splay Angle:** The angle the pads make with the face when viewed from above (approx. 25°–30°).
• **Nose Pad Frontal Angle:** The vertical angle matching the downward slope of the nose sides (approx. 20°).`,
              practicalApplications: `• **Preventing Slippage:** For flatter nasal bridges, choose frames with adjustable silicone pads or dedicated low-bridge acetate builds rather than heavy fixed saddle bridges.
• **Sore Spots on Nose:** If a patient complains of red indentations on their nasal crest, switch from a saddle bridge to a keyhole bridge or adjust pad splay to increase contact surface area.`,
              misconceptions: `• **Misconception:** Tightening the temple tips behind the ears is the primary way to stop a frame from slipping down the nose.
• **Reality:** 90% of frame slippage is caused by poor bridge contact and incorrect nose pad splay. Over-tightening temples behind the ears causes head pain and actually pushes the frame forward!`,
              limitations: `• Fixed acetate bridge pads cannot be easily bent; custom stick-on silicone pads or retrofitted titanium guard arms may be required for difficult anatomies.`,
              brandModelReferences: `*Educational Design Examples (General Reference Only):*
• **Global Fit / Low-Bridge Architecture:** Features extended 12mm silicone nose pads and shortened pantoscopic rake.`,
              orderIndex: 2,
              quizQuestions: [
                {
                  question: "What is the primary cause of optical frame slippage down a patient's nose?",
                  options: JSON.stringify([
                    "The frame temple length is too long by 2mm",
                    "Incorrect bridge width and mismatched nose pad contact angles relative to the nasal slope",
                    "The lenses have too much anti-reflective coating",
                    "The patient's pupillary distance is too wide"
                  ]),
                  correctOptionIndex: 1,
                  explanation: "The nasal bridge supports the majority of the frame's weight. If the bridge is too wide or the pad angles do not match the nose contours, friction is lost and the frame slides forward.",
                  orderIndex: 1,
                }
              ]
            }
          ]
        }
      ]
    },
    {
      slug: "customer-needs-recommendations",
      name: "Customer Needs and Recommendations",
      description: "Lifestyle discovery questioning, occupational needs, overcoming price resistance, and value-based dispensing.",
      icon: "UserCheck",
      orderIndex: 6,
      subcategories: [
        {
          slug: "lifestyle-discovery",
          name: "Lifestyle & Occupational Discovery",
          description: "Uncovering visual demands, driving habits, digital screen hours, and outdoor hobbies.",
          orderIndex: 1,
          lessons: [
            {
              slug: "open-ended-lifestyle-inquiry",
              title: "Open-Ended Lifestyle Inquiry & Needs Analysis",
              summary: "Master structured lifestyle questioning to uncover hidden visual pain points before recommending lens packages.",
              definitions: `**Lifestyle Dispensing:** The optical consultation practice of formulating lens recommendations based on a customer's real daily tasks, lighting environments, and hobbies rather than simply matching Rx numbers.

**Open-Ended Questioning:** Questions that cannot be answered with a simple 'yes' or 'no', encouraging patients to describe their daily visual struggles and routines.`,
              characteristics: `• **The 3-Sphere Inquiry:**
  1. *Professional / Occupational:* Desk setup, screen count, monitor distances, blue-light exposure, safety hazards.
  2. *Active / Outdoor:* Driving hours, watersports, cycling, golf, bright glare environments.
  3. *Leisure / Aesthetic:* Reading in bed, fine craftwork, evening driving glare, fashion identity.`,
              practicalApplications: `• **Transforming Price Hesitation:** When a patient understands *why* a lens feature (e.g., photochromic transition or polarized filter) solves their specific commute glare problem, price becomes secondary to value.
• **Second-Pair Prescribing:** Recommending dedicated prescription sunglasses or computer-specific task lenses alongside their primary general-purpose pair.`,
              misconceptions: `• **Misconception:** Asking lifestyle questions feels like an aggressive 'sales pitch' to the customer.
• **Reality:** Optical customers expect expert healthcare guidance. When opticians fail to ask about lifestyle, patients leave with inappropriate single-pair compromises that lead to eye strain and non-adaptation returns.`,
              limitations: `• Opticians must avoid making assumptions based on patient age or appearance; always verify actual daily routines.`,
              brandModelReferences: `*Educational Consultation Method:*
• **The Optical Consultation Protocol:** Structured patient discovery framework connecting Rx cylinder to daily driving and computer ergonomics.`,
              orderIndex: 1,
              quizQuestions: [
                {
                  question: "Which of the following is an effective open-ended lifestyle discovery question for an optical patient?",
                  options: JSON.stringify([
                    "Do you want anti-glare coating on your lenses today?",
                    "Can you describe your computer setup at work and what distances your monitors are placed?",
                    "Do your glasses feel heavy?",
                    "Are you looking for cheap frames?"
                  ]),
                  correctOptionIndex: 1,
                  explanation: "Asking the patient to describe their workspace setup and monitor distances opens up detailed information regarding intermediate focal lengths, posture, and glare demands.",
                  orderIndex: 1,
                }
              ]
            }
          ]
        }
      ]
    },
    {
      slug: "optical-product-knowledge",
      name: "Optical Product Knowledge",
      description: "Prescription lens materials, Abbe values, index of refraction, digital surfacing, and premium coatings.",
      icon: "Sparkles",
      orderIndex: 7,
      subcategories: [
        {
          slug: "lens-materials-and-indices",
          name: "Lens Materials & Refractive Indices",
          description: "CR-39, Polycarbonate, Trivex, 1.60, 1.67, and 1.74 materials analyzed for dispersion and thickness.",
          orderIndex: 1,
          lessons: [
            {
              slug: "refractive-index-and-abbe-value",
              title: "Index of Refraction Spectrum: From CR-39 (1.50) to High-Index 1.74",
              summary: "Analyze the trade-offs between refractive index, specific gravity, chromatic aberration (Abbe value), and tensile strength.",
              definitions: `**Index of Refraction (n):** The ratio of the speed of light in a vacuum to the speed of light in the lens material. Higher index materials bend light more efficiently, allowing a thinner lens curve.

**Abbe Value (Chromatic Dispersion):** A number measuring the optical dispersion of a material. Higher Abbe values mean less chromatic aberration (color fringing around high-contrast edges). Lower Abbe values induce peripheral chromatic distortion.`,
              characteristics: `• **CR-39 (n = 1.498, Abbe = 58):** Superior optical clarity and zero chromatic aberration, but thickest edge profile and brittle in rimless mounts.
• **Polycarbonate (n = 1.586, Abbe = 30):** Outstanding impact resistance (ANSI Z87.1 safety rated) and light weight, but low Abbe value induces rainbow chromatic aberration in moderate-to-high prescriptions.
• **Trivex (n = 1.53, Abbe = 45):** Combines 100% impact resistance, ultra-low density (lightest lens on earth at 1.11 g/cm³), crisp optics (Abbe 45), and high tensile strength ideal for rimless drill-mounts.
• **1.67 High-Index (n = 1.67, Abbe = 32):** Up to 35% thinner than CR-39; standard choice for Rx range -4.00D to -7.00D.
• **1.74 Ultra High-Index (n = 1.74, Abbe = 33):** Up to 50% thinner than CR-39; highest organic index available for strong prescriptions exceeding -6.00D.`,
              practicalApplications: `• **Children & Monocular Patients:** Always prescribe Polycarbonate or Trivex for legally mandated impact safety protection.
• **Rimless Drill-Mount Frames:** Prescribe Trivex or 1.60/1.67 material. Never use CR-39 (cracks easily) or standard polycarbonate (develops stress fractures around drill holes when exposed to alcohol cleaners).
• **Prescription > -6.00D:** Recommend 1.74 high index paired with an anti-reflective coating and a small, centered frame to shave edge profile thickness.`,
              misconceptions: `• **Misconception:** High-index 1.74 lenses provide 'clearer vision' than standard CR-39 plastic.
• **Reality:** Optically, CR-39 has a much higher Abbe value (58 vs 33) and technically less chromatic aberration. 1.74 provides superior cosmetic thinness and reduced weight, but requires a premium anti-reflective coating to counteract high surface reflectivity.`,
              limitations: `• As refractive index rises, surface reflections increase proportionally according to Fresnel's reflection formula: \`R = ((n-1)/(n+1))²\`. Therefore, premium AR coating is non-negotiable on all high-index lenses.`,
              brandModelReferences: `*Educational Optical Material Guidelines:*
• **Material Selection Matrix:** Standard dispensing benchmark matching patient dioptric power to optimal Abbe efficiency.`,
              orderIndex: 1,
              quizQuestions: [
                {
                  question: "Why must an Anti-Reflective (AR) coating always be included when dispensing high-index (1.67 or 1.74) lenses?",
                  options: JSON.stringify([
                    "To change the color of the patient's eyes",
                    "Because high-index materials reflect significantly more surface light, causing distracting internal reflections without AR",
                    "To make the lens darker like sunglasses",
                    "To prevent the lens from melting in sunlight"
                  ]),
                  correctOptionIndex: 1,
                  explanation: "Higher refractive index materials have higher surface reflectance (Fresnel reflection). An untreated 1.74 lens reflects almost 15% of light away, producing severe ghost images and reducing contrast unless anti-reflective coating is applied.",
                  orderIndex: 1,
                },
                {
                  question: "Which lens material is considered the gold standard for rimless three-piece drill-mounted frames due to its superior tensile strength and resistance to cracking?",
                  options: JSON.stringify([
                    "Standard CR-39 (1.50)",
                    "Crown Glass",
                    "Trivex (1.53)",
                    "Polystyrene"
                  ]),
                  correctOptionIndex: 2,
                  explanation: "Trivex possesses exceptional tensile strength and structural integrity, meaning it does not crack, spiderweb, or chip under the mechanical torque of drilled mounting pins.",
                  orderIndex: 2,
                }
              ]
            }
          ]
        },
        {
          slug: "multicoatings-and-treatments",
          name: "Multicoatings & Surface Enhancements",
          description: "Anti-reflective destructive interference stacks, oleophobic layers, and thermal crazing.",
          orderIndex: 2,
          lessons: [
            {
              slug: "anti-reflective-coating-physics",
              title: "Anti-Reflective (AR), Hydrophobic, and Oleophobic Physics",
              summary: "Examine vacuum-deposited metal oxide stack layers, quarter-wavelength destructive interference, and cleaning protocols.",
              definitions: `**Anti-Reflective (AR) Coating:** A microscopic multilayer stack of alternating high and low refractive index metal oxides (like silicon dioxide and zirconium oxide) vapor-deposited under high vacuum onto the lens surface.

**Destructive Interference:** The optical phenomenon where reflected light waves from the coating's outer surface and the coating-substrate boundary are 180° out of phase, canceling each other out to allow 99.5%+ light transmission.`,
              characteristics: `• **Transmittance Boost:** Increases visible light transmission through the lens from ~92% up to 99.6%.
• **Night Driving Clarity:** Eliminates dangerous starbursts, halos, and ghost reflections around oncoming LED vehicle headlights.
• **Top-Coat Hydrophobic/Oleophobic Layer:** Nanoscale fluorine layer that repels water droplets (beading angle > 110°) and resists fingerprint oils.`,
              practicalApplications: `• **Video Calls & Public Speaking:** Allows observers to see the wearer's eyes clearly without distracting white glare on the glasses.
• **Computer Users:** Reduces distracting room lighting reflections bouncing off the front and back surfaces of the lenses.`,
              misconceptions: `• **Misconception:** Wiping AR lenses with hot tap water and a dish towel is harmless.
• **Reality:** Hot water expands the plastic substrate faster than the ultra-thin ceramic metal oxide stack, causing the coating to crack into a web of micro-fractures known as 'thermal crazing'. Cellulose fibers in paper towels also scratch the delicate coatings.`,
              limitations: `• Requires proper care instructions: cold/lukewarm water, neutral pH lens spray, and clean microfiber cloths only. Never leave AR glasses on a car dashboard in direct sunlight.`,
              brandModelReferences: `*Educational Coating Benchmark:*
• **Vacuum Deposition Stack Standard:** Modern 9-layer AR stack featuring integrated hard-coat primer and antistatic fluorocarbon seal.`,
              orderIndex: 1,
              quizQuestions: [
                {
                  question: "What physical mechanism allows modern anti-reflective coatings to virtually eliminate surface reflections?",
                  options: JSON.stringify([
                    "Absorbing light and turning it into heat energy",
                    "Destructive interference between light waves reflecting off multiple vacuum-deposited oxide layers",
                    "Scattering light randomly in all directions",
                    "Applying a dark grey polarized film"
                  ]),
                  correctOptionIndex: 1,
                  explanation: "AR coatings use quarter-wavelength destructive interference: light waves reflecting off the outer layer and inner layer meet 180 degrees out of phase, canceling each other's amplitude and transmitting the light through.",
                  orderIndex: 1,
                }
              ]
            }
          ]
        }
      ]
    }
  ];

  for (const catData of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: catData.slug },
      update: {
        name: catData.name,
        description: catData.description,
        icon: catData.icon,
        orderIndex: catData.orderIndex,
      },
      create: {
        slug: catData.slug,
        name: catData.name,
        description: catData.description,
        icon: catData.icon,
        orderIndex: catData.orderIndex,
      },
    });

    console.log(`Seeded Category: ${category.name}`);

    for (const subData of catData.subcategories) {
      const subcategory = await prisma.subcategory.upsert({
        where: {
          categoryId_slug: {
            categoryId: category.id,
            slug: subData.slug,
          },
        },
        update: {
          name: subData.name,
          description: subData.description,
          orderIndex: subData.orderIndex,
        },
        create: {
          categoryId: category.id,
          slug: subData.slug,
          name: subData.name,
          description: subData.description,
          orderIndex: subData.orderIndex,
        },
      });

      console.log(`  Subcategory: ${subcategory.name}`);

      for (const lessonData of subData.lessons) {
        const lesson = await prisma.lesson.upsert({
          where: {
            subcategoryId_slug: {
              subcategoryId: subcategory.id,
              slug: lessonData.slug,
            },
          },
          update: {
            title: lessonData.title,
            summary: lessonData.summary,
            definitions: lessonData.definitions,
            characteristics: lessonData.characteristics,
            practicalApplications: lessonData.practicalApplications,
            misconceptions: lessonData.misconceptions,
            limitations: lessonData.limitations,
            brandModelReferences: lessonData.brandModelReferences,
            orderIndex: lessonData.orderIndex,
            isPublished: true,
          },
          create: {
            subcategoryId: subcategory.id,
            slug: lessonData.slug,
            title: lessonData.title,
            summary: lessonData.summary,
            definitions: lessonData.definitions,
            characteristics: lessonData.characteristics,
            practicalApplications: lessonData.practicalApplications,
            misconceptions: lessonData.misconceptions,
            limitations: lessonData.limitations,
            brandModelReferences: lessonData.brandModelReferences,
            orderIndex: lessonData.orderIndex,
            isPublished: true,
          },
        });

        console.log(`    Lesson: ${lesson.title}`);

        // Delete existing questions to re-seed clean set
        await prisma.quizQuestion.deleteMany({
          where: { lessonId: lesson.id },
        });

        for (const q of lessonData.quizQuestions) {
          await prisma.quizQuestion.create({
            data: {
              lessonId: lesson.id,
              question: q.question,
              options: q.options,
              correctOptionIndex: q.correctOptionIndex,
              explanation: q.explanation,
              orderIndex: q.orderIndex,
            },
          });
        }
      }
    }
  }

  console.log("=== SEEDING COMPLETED SUCCESSFULLY ===");

  // Seed Branded Sunglasses Catalogue
  const { seedCatalogue } = await import("./seed_catalogue");
  await seedCatalogue();
}

main()

  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
