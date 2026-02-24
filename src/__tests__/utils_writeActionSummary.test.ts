/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, mock, beforeEach } from "bun:test";
import { writeActionSummary } from "../utils";
import * as core from "@actions/core";

// Mock @actions/core
mock.module("@actions/core", () => {
  const summaryMethods = {
    addHeading: mock(function (this: any) {
      return this;
    }),
    addCodeBlock: mock(function (this: any) {
      return this;
    }),
    write: mock(function (this: any) {
      return this;
    }),
  };
  return {
    summary: summaryMethods,
  };
});

describe("writeActionSummary", () => {
  beforeEach(() => {
    // Clear mocks before each test
    // Note: Since we are mocking the module, we need to access the mocked methods
    // via the imported module or the mocked object if exported.
    // In this case, we access via core.summary which refers to the mocked object.
    (core.summary.addHeading as any).mockClear();
    (core.summary.addCodeBlock as any).mockClear();
    (core.summary.write as any).mockClear();
  });

  it("should call summary methods with correct arguments", () => {
    const params = {
      promptFile: "test-prompt.yml",
      aiResponse: "This is a test response",
      assessmentLabel: "ai:test:aligned",
    };

    writeActionSummary(params);

    expect(core.summary.addHeading).toHaveBeenCalledTimes(4);
    expect(core.summary.addCodeBlock).toHaveBeenCalledTimes(3);

    // Check specific calls
    expect(core.summary.addHeading).toHaveBeenCalledWith("Assessment Result");
    expect(core.summary.addHeading).toHaveBeenCalledWith("Assessment");
    expect(core.summary.addCodeBlock).toHaveBeenCalledWith(
      params.assessmentLabel,
    );
    expect(core.summary.addHeading).toHaveBeenCalledWith("Prompt File");
    expect(core.summary.addCodeBlock).toHaveBeenCalledWith(params.promptFile);
    expect(core.summary.addHeading).toHaveBeenCalledWith("Details");
    expect(core.summary.addCodeBlock).toHaveBeenCalledWith(params.aiResponse);
    expect(core.summary.write).toHaveBeenCalled();
  });
});
