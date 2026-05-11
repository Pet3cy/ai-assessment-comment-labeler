import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mock dependencies
const mockGetInput = mock();
const mockGetBooleanInput = mock();
const mockSetOutput = mock();

mock.module("@actions/core", () => ({
  getInput: mockGetInput,
  getBooleanInput: mockGetBooleanInput,
  setOutput: mockSetOutput,
  info: () => {},
  error: () => {},
  warning: () => {},
  debug: () => {},
  summary: {
    addHeading: () => ({
      addHeading: () => ({
        addCodeBlock: () => ({
          addHeading: () => ({
            addCodeBlock: () => ({
              addHeading: () => ({
                addCodeBlock: () => ({
                  write: () => {},
                }),
              }),
            }),
          }),
        }),
      }),
    }),
  },
}));

const mockListLabelsOnIssue = mock();
const mockRemoveLabel = mock();
const mockCreateComment = mock();
const mockAddLabels = mock();

const mockGetOctokit = mock();
mock.module("@actions/github", () => ({
  context: {
    repo: { owner: "test-owner", repo: "test-repo" },
    payload: { issue: { number: 1, labels: [] } },
  },
  getOctokit: mockGetOctokit,
}));

// We need a working mock for ai-inference
mock.module("@azure-rest/ai-inference", () => {
  return {
    default: mock(() => ({
      path: mock(() => ({
        post: mock().mockResolvedValue({
          status: "200",
          body: {
            choices: [{ message: { content: "Mock response" } }],
          },
        }),
      })),
    })),
    isUnexpected: () => false,
  };
});

mock.module("@azure/core-auth", () => ({
  AzureKeyCredential: mock(),
}));

import { main } from "../index";

describe("main", () => {
  beforeEach(() => {
    mockGetInput.mockClear();
    mockGetBooleanInput.mockClear();
    mockSetOutput.mockClear();
    mockListLabelsOnIssue.mockClear();
    mockRemoveLabel.mockClear();
    mockCreateComment.mockClear();
    mockAddLabels.mockClear();

    // Setup default inputs
    mockGetInput.mockImplementation((name) => {
      switch (name) {
        case "token":
          return "test-token";
        case "owner":
          return "test-owner";
        case "repo_name":
          return "test-repo";
        case "issue_number":
          return "1";
        case "issue_body":
          return "test body";
        case "prompts_directory":
          return "src/__tests__/test_prompts";
        case "ai_review_label":
          return "bug"; // Matches test-bug.yml in test_prompts
        case "labels_to_prompts_mapping":
          return "bug,test-bug.yml";
        case "model":
          return "gpt-4";
        case "endpoint":
          return "https://example.com";
        default:
          return "";
      }
    });

    mockGetBooleanInput.mockImplementation(() => false);

    // Mock Octokit methods
    mockListLabelsOnIssue.mockResolvedValue({ data: [{ name: "bug" }] });
    mockRemoveLabel.mockResolvedValue({});
    mockCreateComment.mockResolvedValue({ status: 201, data: {} });
    mockAddLabels.mockResolvedValue({});

    mockGetOctokit.mockReturnValue({
      rest: {
        issues: {
          listLabelsOnIssue: mockListLabelsOnIssue,
          removeLabel: mockRemoveLabel,
          createComment: mockCreateComment,
          addLabels: mockAddLabels,
        },
      },
    });
  });

  it("should use getBooleanInput for suppress_labels and suppress_comments", async () => {
    await main();
    expect(mockGetBooleanInput).toHaveBeenCalledWith("suppress_labels");
    expect(mockGetBooleanInput).toHaveBeenCalledWith("suppress_comments");
  });

  it("should not add labels if suppress_labels is true", async () => {
    mockGetBooleanInput.mockImplementation((name) => {
      if (name === "suppress_labels") return true;
      return false;
    });

    await main();

    expect(mockAddLabels).not.toHaveBeenCalled();
    expect(mockSetOutput).toHaveBeenCalledWith(
      "ai_assessments",
      expect.any(String),
    );
  });

  it("should not create comment if suppress_comments is true", async () => {
    mockGetBooleanInput.mockImplementation((name) => {
      if (name === "suppress_comments") return true;
      return false;
    });

    await main();

    expect(mockCreateComment).not.toHaveBeenCalled();
  });

  it("should NOT proceed if ai_review_label does not match any issue label", async () => {
    // Return "feature" label. "bug" != "feature"
    mockListLabelsOnIssue.mockResolvedValue({ data: [{ name: "feature" }] });

    await main();

    expect(mockRemoveLabel).not.toHaveBeenCalled();
  });

  it("should proceed if ai_review_label matches an issue label", async () => {
    // Return "bug" label. "bug" === "bug"
    mockListLabelsOnIssue.mockResolvedValue({ data: [{ name: "bug" }] });

    await main();

    expect(mockRemoveLabel).toHaveBeenCalled();
  });

  it("should throw an error if createIssueComment fails", async () => {
    // Return "bug" label to proceed to AI assessment
    mockListLabelsOnIssue.mockResolvedValue({ data: [{ name: "bug" }] });
    // Mock createComment to return failure status
    mockCreateComment.mockResolvedValue({ status: 500 });

    await expect(main()).rejects.toThrow("Failed to create comment");
  });

  it("should throw an error with the exact message 'Failed to create comment' when createComment returns status 500", async () => {
    mockListLabelsOnIssue.mockResolvedValue({ data: [{ name: "bug" }] });
    mockCreateComment.mockResolvedValue({ status: 500 });

    await expect(main()).rejects.toThrow("Failed to create comment");
    // Confirm no broader/different error is thrown
    await expect(main()).rejects.not.toThrow("Failed to add labels");
  });

  it("should throw an error if createIssueComment returns status 200 (only 201 is success)", async () => {
    mockListLabelsOnIssue.mockResolvedValue({ data: [{ name: "bug" }] });
    // Status 200 is not the expected 201 created status
    mockCreateComment.mockResolvedValue({ status: 200 });

    await expect(main()).rejects.toThrow("Failed to create comment");
  });

  it("should throw an error if createIssueComment returns status 404", async () => {
    mockListLabelsOnIssue.mockResolvedValue({ data: [{ name: "bug" }] });
    mockCreateComment.mockResolvedValue({ status: 404 });

    await expect(main()).rejects.toThrow("Failed to create comment");
  });

  it("should throw an error if createComment call itself throws (network error)", async () => {
    mockListLabelsOnIssue.mockResolvedValue({ data: [{ name: "bug" }] });
    // When createComment throws, handleGitHubApiCall catches it and returns false,
    // causing main() to throw "Failed to create comment"
    mockCreateComment.mockRejectedValue(new Error("Network error"));

    await expect(main()).rejects.toThrow("Failed to create comment");
  });

  it("should not throw if createIssueComment returns status 201 (success)", async () => {
    mockListLabelsOnIssue.mockResolvedValue({ data: [{ name: "bug" }] });
    mockCreateComment.mockResolvedValue({ status: 201, data: { html_url: "https://example.com" } });

    await expect(main()).resolves.not.toThrow();
    expect(mockCreateComment).toHaveBeenCalled();
  });

  it("should call createComment with correct parameters", async () => {
    mockListLabelsOnIssue.mockResolvedValue({ data: [{ name: "bug" }] });
    mockCreateComment.mockResolvedValue({ status: 201, data: { html_url: "https://example.com" } });

    await main();

    expect(mockCreateComment).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "test-owner",
        repo: "test-repo",
        issue_number: 1,
        body: expect.any(String),
      }),
    );
  });
});
