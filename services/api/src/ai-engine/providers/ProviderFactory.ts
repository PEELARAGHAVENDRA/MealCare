// ─────────────────────────────────────────────────────────────────────────────
// services/api/src/ai-engine/providers/ProviderFactory.ts
//
// Reads AI_PROVIDER env var and returns the correct AIProvider.
// If the primary provider fails on any call, transparently falls back
// to the RulesEngine and logs the event.
//
// ENV config:
//   AI_PROVIDER=gemini | mock     (default: gemini)
//   GEMINI_API_KEY=<your key>
//   MODEL_NAME=gemini-2.5-flash   (optional)
//   AI_TIMEOUT_MS=30000           (optional)
// ─────────────────────────────────────────────────────────────────────────────

import { AIProvider } from "./AIProvider.interface";
import { GeminiProvider } from "./GeminiProvider";
import { MockProvider } from "./MockProvider";
import { RulesEngine } from "../fallback/RulesEngine";

// Singleton instances (created once, reused)
let _primary: AIProvider | null = null;
let _fallback: AIProvider | null = null;

function createPrimary(): AIProvider {
  const providerName = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();

  switch (providerName) {
    case "gemini":
      return new GeminiProvider();
    case "mock":
      return new MockProvider();
    default:
      console.warn(`[ProviderFactory] Unknown AI_PROVIDER="${providerName}", defaulting to mock.`);
      return new MockProvider();
  }
}

/**
 * Returns the singleton primary provider wrapped with automatic fallback.
 * On any unrecoverable error the RulesEngine is used and a warning is emitted.
 */
export function getAIProvider(): AIProvider {
  if (!_primary) _primary = createPrimary();
  if (!_fallback) _fallback = new RulesEngine();

  const primary = _primary;
  const fallback = _fallback;

  // Methods that should NOT be wrapped in async (they are synchronous getters)
  const syncMethods = new Set(["getLastUsageStats"]);

  // Wrap every async method with try-catch → fallback
  return new Proxy(primary, {
    get(target, prop) {
      const original = (target as any)[prop];
      if (typeof original !== "function") return original;

      // Don't wrap synchronous utility methods
      if (syncMethods.has(String(prop))) {
        return original.bind(target);
      }

      return async (...args: unknown[]) => {
        try {
          return await original.apply(target, args);
        } catch (err) {
          console.error(
            `[AI Fallback] ${String(prop)} failed on provider "${target.name}":`,
            (err as Error).message
          );
          console.warn(`[AI Fallback] Switching to rules engine for this request.`);

          const fallbackMethod = (fallback as any)[prop];
          if (typeof fallbackMethod === "function") {
            return await fallbackMethod.apply(fallback, args);
          }
          throw err;
        }
      };
    },
  });
}

/**
 * Allow hot-swapping the provider at runtime (e.g. admin switches from gemini → mock).
 * The new provider takes effect on the next request.
 */
export function setAIProvider(name: "gemini" | "mock"): void {
  process.env.AI_PROVIDER = name;
  _primary = null; // force re-creation on next getAIProvider() call
  console.info(`[ProviderFactory] Provider switched to "${name}".`);
}

/**
 * Exposed for admin/monitoring: returns current provider name.
 */
export function getCurrentProviderName(): string {
  return _primary?.name ?? (process.env.AI_PROVIDER ?? "gemini");
}
