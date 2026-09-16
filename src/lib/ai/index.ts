import { MockAIProvider } from "./mock-provider";
import type { AIProvider } from "./types";

export * from "./types";

// AI_PROVIDER selects the implementation. "mock" (default) needs no
// credentials and never calls out to the network — safe for local/offline
// demo use. A production deployment would add e.g. an AnthropicProvider or
// AzureOpenAIProvider implementing the same AIProvider interface here;
// nothing that calls `ai.generate(...)` elsewhere in the app would change.
function createAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? "mock";
  switch (provider) {
    case "mock":
    default:
      return new MockAIProvider();
  }
}

export const ai = createAIProvider();
