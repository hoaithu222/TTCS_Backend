// Script to test Gemini models availability
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// New SDK automatically picks up GEMINI_API_KEY from env
const genAI = new GoogleGenAI({});

const modelsToTest = [
  "gemini-2.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-001",
  "gemini-1.5-flash",
  "gemini-1.5-pro-latest",
  "gemini-1.5-pro",
  "gemini-pro",
];

async function testModel(modelName: string): Promise<boolean> {
  try {
    const response = await genAI.models.generateContent({
      model: modelName,
      contents: "Test connection - reply with OK",
    });
    
    const text = response.text || "";
    console.log(`✅ ${modelName}: SUCCESS`);
    console.log(`   Response: ${text.substring(0, 50)}...`);
    return true;
  } catch (error: any) {
    const status = error?.status || error?.statusCode || "unknown";
    const message = error?.message || "Unknown error";
    console.log(`❌ ${modelName}: FAILED (${status})`);
    console.log(`   Error: ${message.substring(0, 100)}`);
    return false;
  }
}

async function testAllModels() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not found in environment variables");
    console.log("Please add GEMINI_API_KEY to your .env file");
    process.exit(1);
  }

  console.log("🔍 Testing Gemini models availability...\n");
  console.log(`API Key: ${process.env.GEMINI_API_KEY.substring(0, 10)}...\n`);

  const results: Array<{ model: string; success: boolean }> = [];

  for (const modelName of modelsToTest) {
    const success = await testModel(modelName);
    results.push({ model: modelName, success });
    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("\n📊 Summary:");
  console.log("=".repeat(50));
  const workingModels = results.filter((r) => r.success);
  const failedModels = results.filter((r) => !r.success);

  if (workingModels.length > 0) {
    console.log("\n✅ Working models:");
    workingModels.forEach((r) => console.log(`   - ${r.model}`));
    console.log(
      `\n💡 Recommended: Use "${workingModels[0].model}" in your .env file`
    );
  }

  if (failedModels.length > 0) {
    console.log("\n❌ Failed models:");
    failedModels.forEach((r) => console.log(`   - ${r.model}`));
  }

  if (workingModels.length === 0) {
    console.log(
      "\n⚠️  No working models found. Please check your API key and account permissions."
    );
    process.exit(1);
  }
}

testAllModels().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

