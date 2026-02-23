import { describe, it, expect, mock, beforeEach } from "bun:test";
import { GitHub } from "@actions/github/lib/utils";

const infoMock = mock(() => {});
const errorMock = mock(() => {});

mock.module("@actions/core", () => ({
  info: infoMock,
  error: errorMock,
}));

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

  beforeEach(() => {
    infoMock.mockClear();
    errorMock.mockClear();
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
      } as unknown as InstanceType<typeof GitHub>;

      const labels = ["bug", "test"];
      await addIssueLabels({ octokit, owner, repo, issueNumber, labels });

      expect(addLabelsMock).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: issueNumber,
        labels,
      });
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

      expect(errorMock).toHaveBeenCalledWith(
        `Error adding labels to issue: ${error}`,
      );
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
      expect(infoMock).toHaveBeenCalledWith(
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
      expect(errorMock).toHaveBeenCalledWith("Failed to create comment: 404");
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
      expect(errorMock).toHaveBeenCalledWith(
        `Error creating issue comment: ${error}`,
      );
    });
  });

  describe("getIssueLabels", () => {
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
      expect(errorMock).toHaveBeenCalledWith(
        `Error listing labels on issue: ${error}`,
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
      // The test previously didn't check for success log, but now I can
      expect(infoMock).toHaveBeenCalledWith(
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

      expect(errorMock).toHaveBeenCalledWith(
        `Error removing labels from issue: ${error}`,
      );
    });
  });
});
