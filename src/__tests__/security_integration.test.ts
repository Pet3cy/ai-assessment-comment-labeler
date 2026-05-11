import {
  describe,
  it,
  expect,
  mock,
  beforeEach,
  spyOn,
  afterEach,
} from "bun:test";

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
  setFailed: () => {},
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

// Do NOT mock "../ai" directly to avoid leaking mocks to other tests
// Instead rely on mocking the Azure client which is passed to it

// Mock filesystem reading
mock.module("fs", () => ({
  readFileSync: mock().mockReturnValue(
    "messages:\n  - role: system\n    content: system prompt\nmodel: gpt-4",
  ),
}));

const mockPost = mock().mockResolvedValue({
  status: "200",
  body: {
    choices: [{ message: { content: "### Assessment: benign" } }],
  },
});

mock.module("@azure-rest/ai-inference", () => {
  return {
    default: mock(() => ({
      path: mock(() => ({
        post: mockPost,
      })),
    })),
    isUnexpected: () => false,
  };
});

mock.module("@azure/core-auth", () => ({
  AzureKeyCredential: mock(),
}));

import { main } from "../index";

describe("Log Injection Reproduction", () => {
  const logs: string[] = [];
  const consoleLogSpy = spyOn(console, "log").mockImplementation((msg) => {
    logs.push(String(msg));
  });

  afterEach(() => {
    consoleLogSpy.mockClear();
    logs.length = 0;
  });

  beforeEach(() => {
    mockGetInput.mockClear();
    mockGetBooleanInput.mockClear();
    mockSetOutput.mockClear();
    mockListLabelsOnIssue.mockClear();
    mockRemoveLabel.mockClear();
    mockCreateComment.mockClear();
    mockAddLabels.mockClear();
    mockPost.mockClear();

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
          return "prompts";
        case "ai_review_label":
          return "bug";
        // INJECTION HERE: malicious filename with newline
        case "labels_to_prompts_mapping":
          return "bug,malicious\nfile.yml";
        case "model":
          return "gpt-4";
        case "endpoint":
          return "https://example.com";
        case "assessment_regex_pattern":
          return "### Assessment: (.*)";
        default:
          return "";
      }
    });

    mockGetBooleanInput.mockReturnValue(false);
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

  it("should log sanitized labels", async () => {
    await main();

    const joinedLogs = logs.join("\n");
    expect(joinedLogs).toContain("Using prompt file: malicious\\nfile.yml");
    expect(joinedLogs).toContain(
      "Adding labels: ai:malicious\\nfile.yml:benign",
    );
  });
});
