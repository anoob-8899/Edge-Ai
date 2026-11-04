import * as dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY environment variable is not defined.");
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey });

async function testModels() {
  const modelsToTry = [
    "gemini-3.8-flash",
    "gemini-3.5-flash",
  ];

  for (const m of modelsToTry) {
    try {
      console.log(`Testing model: ${m}...`);
      const response = await ai.models.generateContent({
        model: m,
        contents: "Hello, reply with one word: 'CONNECTED'",
      });
      console.log(`Success with ${m}:`, response.text?.trim());
      return m;
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.log(`Failed with ${m}:`, e.message);
    }
  }
}

testModels().then((workingModel) => {
  console.log("Working model determined:", workingModel);
  process.exit(0);
});
