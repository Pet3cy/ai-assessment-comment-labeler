import { describe, it, expect, mock, spyOn, afterEach } from "bun:test";
import { GitHub } from "@actions/github/lib/utils";
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

  afterEach(() => {
    mock.restore();
  });

  describe("addIssueLabels", () => {
    it("should add multiple labels to an issue", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
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
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("should add a single label to an issue", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
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
      expect(consoleSpy).not.toHaveBeenCalled();
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
      } as unknown as InstanceType<typeof GitHub>;

      await addIssueLabels({
        octokit,
        owner,
        repo,
        issueNumber,
        labels: ["label"],
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error adding labels to issue:",
        error,
      );
    });

    it("should handle empty labels array", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
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
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    describe("error handling", () => {
    it("should handle 404 Not Found error", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("Not Found");
      // @ts-ignore
      error.status = 404;
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
        labels: ["bug"],
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error adding labels to issue:",
        error,
      );
    });

    it("should handle 403 Forbidden error", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("Forbidden");
      // @ts-ignore
      error.status = 403;
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
        labels: ["bug"],
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error adding labels to issue:",
        error,
      );
    });

    it("should handle 422 Unprocessable Entity error", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("Unprocessable Entity");
      // @ts-ignore
      error.status = 422;
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
        labels: ["bug"],
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error adding labels to issue:",
        error,
      );
    });

    it("should handle 500 Server Error", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("Server Error");
      // @ts-ignore
      error.status = 500;
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
        labels: ["bug"],
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error adding labels to issue:",
        error,
      );
    });
    });
  });

  describe("createIssueComment", () => {
    it("should create a comment successfully", async () => {
      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
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
      expect(consoleSpy).toHaveBeenCalledWith(
        "Comment created successfully:",
        "url",
      );
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
      } as unknown as InstanceType<typeof GitHub>;

      const result = await createIssueComment({
        octokit,
        owner,
        repo,
        issueNumber,
        body: "test",
      });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith("Failed to create comment:", 404);
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
      } as unknown as InstanceType<typeof GitHub>;

      const result = await createIssueComment({
        octokit,
        owner,
        repo,
        issueNumber,
        body: "test",
      });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error creating issue comment:",
        error,
      );
    });

    it("should return false when response data is invalid despite 201 status", async () => {
      const consoleSpy = mock(() => {});
      const originalConsoleError = console.error;
      console.error = consoleSpy as unknown as typeof console.error;

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
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error creating issue comment:",
        expect.any(Error),
      );

      console.error = originalConsoleError;
    });

    it("should return false and log error for 403 Forbidden", async () => {
      const consoleSpy = mock(() => {});
      const originalConsoleError = console.error;
      console.error = consoleSpy as unknown as typeof console.error;

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
      expect(consoleSpy).toHaveBeenCalledWith("Failed to create comment:", 403);

      console.error = originalConsoleError;
    });

    it("should return false and log error for 422 Unprocessable Entity", async () => {
      const consoleSpy = mock(() => {});
      const originalConsoleError = console.error;
      console.error = consoleSpy as unknown as typeof console.error;

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
      expect(consoleSpy).toHaveBeenCalledWith("Failed to create comment:", 422);

      console.error = originalConsoleError;
    });

    it("should handle timeout error", async () => {
      const consoleSpy = mock(() => {});
      const originalConsoleError = console.error;
      console.error = consoleSpy as unknown as typeof console.error;

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
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error creating issue comment:",
        error,
      );

      console.error = originalConsoleError;
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
      const consoleSpy = mock(() => {});
      const originalConsoleError = console.error;
      console.error = consoleSpy as unknown as typeof console.error;

      try {
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
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error listing labels on issue:",
          expect.any(TypeError),
        );
      } finally {
        console.error = originalConsoleError;
      }
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
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
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
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error listing labels on issue:",
        error,
      );
    });
  });

  describe("removeIssueLabel", () => {
    it("should remove a label from an issue", async () => {
      const consoleSpy = mock(() => {});
      const originalConsoleLog = console.log;
      console.log = consoleSpy as unknown as typeof console.log;

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
      expect(consoleSpy).toHaveBeenCalledWith(
        `Label "${label}" removed from issue #${issueNumber}`
      );

      console.log = originalConsoleLog;
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
      } as unknown as InstanceType<typeof GitHub>;

      await removeIssueLabel({
        octokit,
        owner,
        repo,
        issueNumber,
        label: "label",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error removing labels from issue:",
        error,
      );
    });

    it("should handle 404 error when label does not exist", async () => {
      const consoleSpy = mock(() => {});
      const originalConsoleError = console.error;
      console.error = consoleSpy as unknown as typeof console.error;

      const error = new Error("Not Found");
      // @ts-ignore
      error.status = 404;
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
        label: "non-existent-label",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error removing labels from issue:",
        error
      );

      console.error = originalConsoleError;
    });
  });
});
