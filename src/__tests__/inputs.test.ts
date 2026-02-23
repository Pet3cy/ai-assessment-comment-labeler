import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mocks
const mockGetInput = mock((name: string) => {
  if (name === "token") return "token";
  if (name === "owner") return "owner";
  if (name === "repo_name") return "repo";
  if (name === "issue_number") return "1";
  if (name === "issue_body") return "body";
  if (name === "prompts_directory") return "prompts";
  if (name === "ai_review_label") return "ai-review";
  if (name === "labels_to_prompts_mapping") return "mapping";
  return "";
});

const mockGetBooleanInput = mock(() => false);

mock.module("@actions/core", () => ({
  getInput: mockGetInput,
  getBooleanInput: mockGetBooleanInput,
  setOutput: mock(() => {}),
  summary: {
    addHeading: () => ({
      addHeading: () => ({
        addCodeBlock: () => ({
          addHeading: () => ({
            addCodeBlock: () => ({
              addHeading: () => ({ addCodeBlock: () => ({ write: () => {} }) }),
            }),
          }),
        }),
      }),
    }),
  },
}));

const mockOctokit = {
  rest: {
    issues: {
      listLabelsOnIssue: mock(() => Promise.resolve({ data: [] })),
      removeLabel: mock(() => Promise.resolve({})),
      createComment: mock(() => Promise.resolve({ status: 201 })),
      addLabels: mock(() => Promise.resolve({})),
    },
  },
};

mock.module("@actions/github", () => ({
  context: {
    repo: { owner: "owner", repo: "repo" },
    payload: { issue: { number: 1, labels: [] } },
  },
  getOctokit: mock(() => mockOctokit),
}));

// Mock utils to avoid file system and other side effects
mock.module("../utils", () => ({
  getPromptFilesFromLabels: mock(() => []),
  getAILabelAssessmentValue: mock(() => ""),
  writeActionSummary: mock(() => {}),
  getPromptOptions: mock(() => ({})),
  getRegexFromString: mock(() => /test/),
  getBaseFilename: mock(() => ""),
}));

// Mock AI to avoid network calls
mock.module("../ai", () => ({
  aiInference: mock(() => Promise.resolve("")),
}));

// Do NOT mock ../api. main will use the real api module, which will use our mocked octokit.

import { main } from "../index";

describe("Input Handling", () => {
  beforeEach(() => {
    mockGetInput.mockClear();
    mockGetBooleanInput.mockClear();
  });

  it("should call getBooleanInput for suppress_labels and suppress_comments", async () => {
    await main();
    expect(mockGetBooleanInput).toHaveBeenCalledWith("suppress_labels");
    expect(mockGetBooleanInput).toHaveBeenCalledWith("suppress_comments");
  });
});
