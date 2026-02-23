import { describe, it, expect, mock, spyOn, afterEach } from "bun:test";
import {
  createIssueComment,
  getIssueLabels,
  addIssueLabels,
  removeIssueLabel,
} from "../api";

describe("api", () => {
  const owner = "owner";
  const repo = "repo";
  const issueNumber = 123;

  // Clean up mocks after each test
  afterEach(() => {
    mock.restore();
  });

  describe("addIssueLabels", () => {
    it("should add labels to an issue", async () => {
      const addLabelsMock = mock(() => Promise.resolve({}));
      const octokit = {
        rest: {
          issues: {
            addLabels: addLabelsMock,
          },
        },
      } as any;

      const labels = ["bug", "test"];
      await addIssueLabels({ octokit, owner, repo, issueNumber, labels });

      expect(addLabelsMock).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: issueNumber,
        labels,
      });
    });

    it("should handle empty labels array", async () => {
      const addLabelsMock = mock(() => Promise.resolve({}));
      const octokit = {
        rest: {
          issues: {
            addLabels: addLabelsMock,
          },
        },
      } as any;

      const labels: string[] = [];
      await addIssueLabels({ octokit, owner, repo, issueNumber, labels });

      expect(addLabelsMock).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: issueNumber,
        labels: [],
      });
    });

    it("should handle error when adding labels", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("API Error");
      const addLabelsMock = mock(() => Promise.reject(error));
      const octokit = {
        rest: {
          issues: {
            addLabels: addLabelsMock,
          },
        },
      } as any;

      await addIssueLabels({ octokit, owner, repo, issueNumber, labels: ["label"] });

      expect(consoleSpy).toHaveBeenCalledWith("Error adding labels to issue:", error);
      consoleSpy.mockRestore();
    });
  });

  describe("createIssueComment", () => {
    it("should create a comment successfully", async () => {
      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      const createCommentMock = mock(() => Promise.resolve({ status: 201, data: { html_url: "url" } }));
      const octokit = {
        rest: {
          issues: {
            createComment: createCommentMock,
          },
        },
      } as any;

      const body = "comment body";
      const result = await createIssueComment({ octokit, owner, repo, issueNumber, body });

      expect(result).toBe(true);
      expect(createCommentMock).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: issueNumber,
        body,
      });
      consoleSpy.mockRestore();
    });

    it("should return false when comment creation fails", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
      const createCommentMock = mock(() => Promise.resolve({ status: 404 }));
      const octokit = {
        rest: {
          issues: {
            createComment: createCommentMock,
          },
        },
      } as any;

      const result = await createIssueComment({ octokit, owner, repo, issueNumber, body: "test" });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith("Failed to create comment:", 404);
      consoleSpy.mockRestore();
    });

    it("should handle error when creating a comment", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("API Error");
      const createCommentMock = mock(() => Promise.reject(error));
      const octokit = {
        rest: {
          issues: {
            createComment: createCommentMock,
          },
        },
      } as any;

      const result = await createIssueComment({ octokit, owner, repo, issueNumber, body: "test" });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith("Error creating issue comment:", error);
      consoleSpy.mockRestore();
    });
  });

  describe("getIssueLabels", () => {
    it("should return labels for an issue", async () => {
      const listLabelsMock = mock(() => Promise.resolve({ data: [{ name: "label1" }, { name: "label2" }] }));
      const octokit = {
        rest: {
          issues: {
            listLabelsOnIssue: listLabelsMock,
          },
        },
      } as any;

      const result = await getIssueLabels({ octokit, owner, repo, issueNumber });

      expect(result).toEqual(["label1", "label2"]);
      expect(listLabelsMock).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: issueNumber,
      });
    });

    it("should handle error when getting labels", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("API Error");
      const listLabelsMock = mock(() => Promise.reject(error));
      const octokit = {
        rest: {
          issues: {
            listLabelsOnIssue: listLabelsMock,
          },
        },
      } as any;

      const result = await getIssueLabels({ octokit, owner, repo, issueNumber });

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith("Error listing labels on issue:", error);
      consoleSpy.mockRestore();
    });
  });

  describe("removeIssueLabel", () => {
    it("should remove a label from an issue", async () => {
      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      const removeLabelMock = mock(() => Promise.resolve({}));
      const octokit = {
        rest: {
          issues: {
            removeLabel: removeLabelMock,
          },
        },
      } as any;

      const label = "label-to-remove";
      await removeIssueLabel({ octokit, owner, repo, issueNumber, label });

      expect(removeLabelMock).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: issueNumber,
        name: label,
      });
      consoleSpy.mockRestore();
    });

    it("should handle error when removing a label", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("API Error");
      const removeLabelMock = mock(() => Promise.reject(error));
      const octokit = {
        rest: {
          issues: {
            removeLabel: removeLabelMock,
          },
        },
      } as any;

      await removeIssueLabel({ octokit, owner, repo, issueNumber, label: "label" });

      expect(consoleSpy).toHaveBeenCalledWith("Error removing labels from issue:", error);
      consoleSpy.mockRestore();
    });
  });
});
