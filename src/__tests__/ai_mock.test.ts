import { describe, it, expect, mock } from "bun:test";
import ModelClient from "@azure-rest/ai-inference";

// Mock @azure-rest/ai-inference
mock.module("@azure-rest/ai-inference", () => {
  return {
    isUnexpected: () => false,
    default: mock(() => ({})),
  };
});

import { aiInference } from "../ai";

type ModelClientType = ReturnType<typeof ModelClient>;

describe("aiInference", () => {
  it("should use the passed client to make a request", async () => {
    const postMock = mock(() =>
      Promise.resolve({
        status: "200",
        body: {
          choices: [{ message: { content: "Mock response" } }],
        },
      }),
    );

    const clientMock = {
      path: mock(() => ({
        post: postMock,
      })),
    };

    const result = await aiInference({
      client: clientMock as unknown as ModelClientType,
      endpoint: "https://example.com",
      modelName: "gpt-4",
      maxTokens: 100,
      content: "test content",
      systemPromptMsg: "system prompt",
    });

    expect(result).toBe("Mock response");
    expect(clientMock.path).toHaveBeenCalledWith("/chat/completions");
    expect(postMock).toHaveBeenCalled();
  });
});
