import { describe, it, expect, mock, beforeEach, spyOn } from "bun:test";
import * as core from "@actions/core";
import { isUnexpected } from "@azure-rest/ai-inference";
import ModelClient from "@azure-rest/ai-inference";

// Mock @azure-rest/ai-inference
mock.module("@azure-rest/ai-inference", () => {
  return {
    isUnexpected: mock(() => false),
    default: mock(() => ({})),
  };
});

// Mock @actions/core
mock.module("@actions/core", () => {
  return {
    setFailed: mock((msg: string) => msg),
  };
});

import { aiInference } from "../ai";

type ModelClientType = ReturnType<typeof ModelClient>;

describe("aiInference error handling", () => {
  const endpoint = "https://example.com";
  const modelName = "gpt-4";
  const maxTokens = 100;
  const content = "test content";
  const systemPromptMsg = "system prompt";

  beforeEach(() => {
    mock.restore();
    spyOn(console, "log").mockImplementation(() => {});
  });

  it("should call core.setFailed when isUnexpected returns true and body has error", async () => {
    const isUnexpectedMock = isUnexpected as unknown as ReturnType<typeof mock>;
    isUnexpectedMock.mockImplementation(() => true);

    const errorMessage = "AI error message";
    const postMock = mock(() =>
      Promise.resolve({
        status: "400",
        body: {
          error: new Error(errorMessage),
        },
      }),
    );

    const clientMock = {
      path: mock(() => ({
        post: postMock,
      })),
    } as unknown as ModelClientType;

    await aiInference({
      client: clientMock,
      endpoint,
      modelName,
      maxTokens,
      content,
      systemPromptMsg,
    });

    expect(core.setFailed).toHaveBeenCalledWith(errorMessage);
  });

  it("should call core.setFailed with generic message when isUnexpected returns true and body has no error", async () => {
    const isUnexpectedMock = isUnexpected as unknown as ReturnType<typeof mock>;
    isUnexpectedMock.mockImplementation(() => true);

    const postMock = mock(() =>
      Promise.resolve({
        status: "500",
        body: "Internal Server Error",
      }),
    );

    const clientMock = {
      path: mock(() => ({
        post: postMock,
      })),
    } as unknown as ModelClientType;

    await aiInference({
      client: clientMock,
      endpoint,
      modelName,
      maxTokens,
      content,
      systemPromptMsg,
    });

    expect(core.setFailed).toHaveBeenCalledWith(
      "An error occurred while fetching the response (500): Internal Server Error"
    );
  });

  it("should handle non-Error exceptions gracefully", async () => {
    const postMock = mock(() => {
      throw "Something went wrong";
    });

    const clientMock = {
      path: mock(() => ({
        post: postMock,
      })),
    } as unknown as ModelClientType;

    await aiInference({
      client: clientMock,
      endpoint,
      modelName,
      maxTokens,
      content,
      systemPromptMsg,
    });

    expect(core.setFailed).toHaveBeenCalledWith("An unexpected error occurred");
  });
});
