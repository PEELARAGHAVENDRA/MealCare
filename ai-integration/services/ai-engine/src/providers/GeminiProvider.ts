// ─────────────────────────────────────────────────────────────────────────────
// services/ai-engine/src/providers/GeminiProvider.ts
// Implements AIProvider using Google Gemini API (gemini-2.5-flash / gemini-1.5-pro).
// All LLM calls are routed through this class.
// ─────────────────────────────────────────────────────────────────────────────

import { AIProvider } from "./AIProvider.interface";
import {
  NutritionInput,
  NutritionOutput,
  MealPlanInput,
  MealPlanOutput,
  ParticipationInput,
  ParticipationOutput,
  WasteInput,
  WasteOutput,
  InventoryItem,
  InventoryAnalysisOutput,
  HolidayPlanInput,
  HolidayPlanOutput,
  RecommendationOutput,
  AIUsageStats,
  AIProviderName,
} from "../../../../packages/shared-contracts/src/ai/types";
import {
  SYSTEM_PROMPT,
  nutritionPrompt,
  plannerPrompt,
  predictionPrompt,
  wastagePrompt,
  inventoryPrompt,
  holidayPrompt,
  recommendationPrompt,
} from "../prompts";

// ── Gemini REST API types (minimal) ──────────────────────────────────────────

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
    usageMetadata?: {
      promptTokenCount: number;
      candidatesTokenCount: number;
      totalTokenCount: number;
    };
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export class GeminiProvider implements AIProvider {
  readonly name: AIProviderName = "gemini";
  readonly model: string;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private lastUsageStats: AIUsageStats;
  private readonly timeoutMs: number;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY ?? "";
    this.model = process.env.MODEL_NAME ?? "gemini-2.5-flash";
    this.timeoutMs = parseInt(process.env.AI_TIMEOUT_MS ?? "30000", 10);
    this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;

    this.lastUsageStats = {
      provider: "gemini",
      model: this.model,
      tokensUsed: 0,
      requestType: "none",
      latencyMs: 0,
      success: false,
      fallbackUsed: false,
    };

    if (!this.apiKey) {
      console.warn(
        "[GeminiProvider] GEMINI_API_KEY is not set. " +
          "Provider will throw on real calls. Set key in .env to activate."
      );
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private async callGemini<T>(
    userPrompt: string,
    requestType: string
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const start = Date.now();

    const body = JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,       // low temp → more deterministic JSON
        topP: 0.8,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    const data: GeminiResponse = await response.json();
    const latencyMs = Date.now() - start;

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const tokens =
      data.usageMetadata?.totalTokenCount ??
      data.candidates?.[0]?.usageMetadata?.totalTokenCount ??
      0;

    this.lastUsageStats = {
      provider: "gemini",
      model: this.model,
      tokensUsed: tokens,
      requestType,
      latencyMs,
      success: true,
      fallbackUsed: false,
    };

    try {
      // Strip accidental markdown fences
      const clean = rawText.replace(/```json|```/g, "").trim();
      return JSON.parse(clean) as T;
    } catch {
      throw new Error(
        `Gemini returned invalid JSON for ${requestType}: ${rawText.slice(0, 200)}`
      );
    }
  }

  // ── AIProvider implementation ───────────────────────────────────────────────

  async analyzeNutrition(input: NutritionInput): Promise<NutritionOutput> {
    return this.callGemini<NutritionOutput>(
      nutritionPrompt(input),
      "nutrition-analysis"
    );
  }

  async generateWeeklyPlan(input: MealPlanInput): Promise<MealPlanOutput> {
    return this.callGemini<MealPlanOutput>(
      plannerPrompt(input),
      "meal-plan-generation"
    );
  }

  async predictParticipation(
    input: ParticipationInput
  ): Promise<ParticipationOutput> {
    return this.callGemini<ParticipationOutput>(
      predictionPrompt(input),
      "participation-prediction"
    );
  }

  async predictFoodWaste(input: WasteInput): Promise<WasteOutput> {
    return this.callGemini<WasteOutput>(wastagePrompt(input), "waste-prediction");
  }

  async recommendIngredients(
    inventory: InventoryItem[],
    nutritionGaps: string[]
  ): Promise<RecommendationOutput> {
    return this.callGemini<RecommendationOutput>(
      recommendationPrompt(inventory, nutritionGaps),
      "ingredient-recommendation"
    );
  }

  async analyzeInventory(
    inventory: InventoryItem[]
  ): Promise<InventoryAnalysisOutput> {
    return this.callGemini<InventoryAnalysisOutput>(
      inventoryPrompt(inventory),
      "inventory-analysis"
    );
  }

  async suggestHolidayAdjustments(
    input: HolidayPlanInput
  ): Promise<HolidayPlanOutput> {
    return this.callGemini<HolidayPlanOutput>(
      holidayPrompt(input),
      "holiday-planning"
    );
  }

  async optimizeMeals(input: MealPlanInput): Promise<MealPlanOutput> {
    // Re-use planner prompt with an optimization prefix
    const prompt =
      "Re-optimize the following meal plan for better nutrition and cost efficiency.\n\n" +
      plannerPrompt(input);
    return this.callGemini<MealPlanOutput>(prompt, "meal-optimization");
  }

  getLastUsageStats(): AIUsageStats {
    return { ...this.lastUsageStats };
  }
}
