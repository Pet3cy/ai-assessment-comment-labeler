import { describe, it, expect, mock, beforeEach } from "bun:test";
import { GitHub } from "@actions/github/lib/utils";
import {
  createIssueComment,
  getIssueLabels,
  addIssueLabels,
  removeIssueLabel,
} from "../api";

const mockInfo = mock(() => {});
const mockError = mock(() => {});

mock.module("@actions/core", () => ({
  info: mockInfo,
  error: mockError,
}));

describe("api", () => {
  const owner = "owner";
  const repo = "repo";
  const issueNumber = 123;

  beforeEach(() => {
    mockInfo.mockClear();
    mockError.mockClear();
  });

  describe("addIssueLabels", () => {
    it("should add multiple labels to an issue", async () => {
      const addLabelsMock = mock(() => Promise.resolve({}));
      const octokit = {
        rest: {
          issues: {
            addLabels: addLabelsMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const labels = ["bug", "test"];
      await addIssueLabels({ octokit, owner, repo, issueNumber, labels });

      expect(addLabelsMock).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: issueNumber,
        labels,
      });
      expect(mockError).not.toHaveBeenCalled();
    });

    it("should add a single label to an issue", async () => {
      const addLabelsMock = mock(() => Promise.resolve({}));
      const octokit = {
        rest: {
          issues: {
            addLabels: addLabelsMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const labels = ["bug"];
      await addIssueLabels({ octokit, owner, repo, issueNumber, labels });

      expect(addLabelsMock).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: issueNumber,
        labels,
      });
      expect(mockError).not.toHaveBeenCalled();
    });

    it("should handle error when adding labels", async () => {
      const error = new Error("API Error");
      const addLabelsMock = mock(() => Promise.reject(error));
      const octokit = {
        rest: {
          issues: {
            addLabels: addLabelsMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      await addIssueLabels({
        octokit,
        owner,
        repo,
        issueNumber,
        labels: ["label"],
      });

      expect(mockError).toHaveBeenCalledWith(
        expect.stringContaining("Error adding labels to issue:"),
      );
    });

    it("should handle empty labels array", async () => {
      const addLabelsMock = mock(() => Promise.resolve({}));
      const octokit = {
        rest: {
          issues: {
            addLabels: addLabelsMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const labels: string[] = [];
      await addIssueLabels({ octokit, owner, repo, issueNumber, labels });

      expect(addLabelsMock).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: issueNumber,
        labels,
      });
      expect(mockError).not.toHaveBeenCalled();
    });
  });

  describe("createIssueComment", () => {
    it("should create a comment successfully", async () => {
      const createCommentMock = mock(() =>
        Promise.resolve({ status: 201, data: { html_url: "url" } }),
      );
      const octokit = {
        rest: {
          issues: {
            createComment: createCommentMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const body = "comment body";
      const result = await createIssueComment({
        octokit,
        owner,
        repo,
        issueNumber,
        body,
      });

      expect(result).toBe(true);
      expect(createCommentMock).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: issueNumber,
        body,
      });
      expect(mockInfo).toHaveBeenCalledWith(
        "Comment created successfully: url",
      );
    });

    it("should return false when comment creation fails", async () => {
      const createCommentMock = mock(() => Promise.resolve({ status: 404 }));
      const octokit = {
        rest: {
          issues: {
            createComment: createCommentMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const result = await createIssueComment({
        octokit,
        owner,
        repo,
        issueNumber,
        body: "test",
      });

      expect(result).toBe(false);
      expect(mockError).toHaveBeenCalledWith("Failed to create comment: 404");
    });

    it("should handle error when creating a comment", async () => {
      const error = new Error("API Error");
      const createCommentMock = mock(() => Promise.reject(error));
      const octokit = {
        rest: {
          issues: {
            createComment: createCommentMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const result = await createIssueComment({
        octokit,
        owner,
        repo,
        issueNumber,
        body: "test",
      });

      expect(result).toBe(false);
      expect(mockError).toHaveBeenCalledWith(
        expect.stringContaining("Error creating issue comment:"),
      );
    });

    it("should return false when response data is invalid despite 201 status", async () => {
      // Mock response with 201 status but undefined data
      const createCommentMock = mock(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Promise.resolve({ status: 201, data: undefined } as any),
      );
      const octokit = {
        rest: {
          issues: {
            createComment: createCommentMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const result = await createIssueComment({
        octokit,
        owner,
        repo,
        issueNumber,
        body: "test",
      });

      expect(result).toBe(false);
      expect(mockError).toHaveBeenCalledWith(
        expect.stringContaining("Error creating issue comment:"),
      );
    });

    it("should return false and log error for 403 Forbidden", async () => {
      const createCommentMock = mock(() => Promise.resolve({ status: 403 }));
      const octokit = {
        rest: {
          issues: {
            createComment: createCommentMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const result = await createIssueComment({
        octokit,
        owner,
        repo,
        issueNumber,
        body: "test",
      });

      expect(result).toBe(false);
      expect(mockError).toHaveBeenCalledWith("Failed to create comment: 403");
    });

    it("should return false and log error for 422 Unprocessable Entity", async () => {
      const createCommentMock = mock(() => Promise.resolve({ status: 422 }));
      const octokit = {
        rest: {
          issues: {
            createComment: createCommentMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const result = await createIssueComment({
        octokit,
        owner,
        repo,
        issueNumber,
        body: "",
      });

      expect(result).toBe(false);
      expect(mockError).toHaveBeenCalledWith("Failed to create comment: 422");
    });

    it("should handle timeout error", async () => {
      const error = new Error("Request timed out");
      const createCommentMock = mock(() => Promise.reject(error));
      const octokit = {
        rest: {
          issues: {
            createComment: createCommentMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const result = await createIssueComment({
        octokit,
        owner,
        repo,
        issueNumber,
        body: "test",
      });

      expect(result).toBe(false);
      expect(mockError).toHaveBeenCalledWith(
        expect.stringContaining("Error creating issue comment:"),
      );
    });
  });

  describe("getIssueLabels", () => {
    it("should return an empty array if no labels are found", async () => {
      const listLabelsMock = mock(() => Promise.resolve({ data: [] }));
      const octokit = {
        rest: {
          issues: {
            listLabelsOnIssue: listLabelsMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const result = await getIssueLabels({
        octokit,
        owner,
        repo,
        issueNumber,
      });

      expect(result).toEqual([]);
      expect(listLabelsMock).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: issueNumber,
      });
    });

    it("should handle malformed response", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listLabelsMock = mock(() => Promise.resolve({} as any));
      const octokit = {
        rest: {
          issues: {
            listLabelsOnIssue: listLabelsMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const result = await getIssueLabels({
        octokit,
        owner,
        repo,
        issueNumber,
      });

      expect(result).toBeUndefined();
      expect(mockError).toHaveBeenCalledWith(
        expect.stringContaining("Error listing labels on issue:"),
      );
    });

    it("should return labels for an issue", async () => {
      const listLabelsMock = mock(() =>
        Promise.resolve({ data: [{ name: "label1" }, { name: "label2" }] }),
      );
      const octokit = {
        rest: {
          issues: {
            listLabelsOnIssue: listLabelsMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const result = await getIssueLabels({
        octokit,
        owner,
        repo,
        issueNumber,
      });

      expect(result).toEqual(["label1", "label2"]);
      expect(listLabelsMock).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: issueNumber,
      });
    });

    it("should handle error when getting labels", async () => {
      const error = new Error("API Error");
      const listLabelsMock = mock(() => Promise.reject(error));
      const octokit = {
        rest: {
          issues: {
            listLabelsOnIssue: listLabelsMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const result = await getIssueLabels({
        octokit,
        owner,
        repo,
        issueNumber,
      });

      expect(result).toBeUndefined();
      expect(mockError).toHaveBeenCalledWith(
        expect.stringContaining("Error listing labels on issue:"),
      );
    });
  });

  describe("removeIssueLabel", () => {
    it("should remove a label from an issue", async () => {
      const removeLabelMock = mock(() => Promise.resolve({}));
      const octokit = {
        rest: {
          issues: {
            removeLabel: removeLabelMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const label = "label-to-remove";
      await removeIssueLabel({ octokit, owner, repo, issueNumber, label });

      expect(removeLabelMock).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: issueNumber,
        name: label,
      });
      expect(mockInfo).toHaveBeenCalledWith(
        `Label "${label}" removed from issue #${issueNumber}`,
      );
    });

    it("should handle error when removing a label", async () => {
      const error = new Error("API Error");
      const removeLabelMock = mock(() => Promise.reject(error));
      const octokit = {
        rest: {
          issues: {
            removeLabel: removeLabelMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      await removeIssueLabel({
        octokit,
        owner,
        repo,
        issueNumber,
        label: "label",
      });

      expect(mockError).toHaveBeenCalledWith(
        expect.stringContaining("Error removing labels from issue:"),
      );
    });
  });
});
