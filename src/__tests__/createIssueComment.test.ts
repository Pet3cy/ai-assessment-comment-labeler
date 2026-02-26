import { describe, it, expect, mock, spyOn, afterEach } from "bun:test";
import { GitHub } from "@actions/github/lib/utils";
import { createIssueComment } from "../api";

describe("createIssueComment", () => {
  const owner = "owner";
  const repo = "repo";
  const issueNumber = 123;
  const body = "comment body";

  afterEach(() => {
    mock.restore();
  });

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
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
    // Mock response with 201 status but undefined data, causing TypeError on access
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
  });

  it("should return false and log error for 403 Forbidden", async () => {
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
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
  });

  it("should return false and log error for 422 Unprocessable Entity", async () => {
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
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
  });

  it("should handle timeout error", async () => {
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
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
  });

  it("should handle missing html_url in successful response", async () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    const createCommentMock = mock(() =>
      Promise.resolve({ status: 201, data: {} }),
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
      body,
    });

    expect(result).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Comment created successfully:",
      undefined,
    );
  });

  it("should handle non-Error object thrown", async () => {
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
    const errorString = "Just a string error";
    const createCommentMock = mock(() => Promise.reject(errorString));
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
      body,
    });

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error creating issue comment:",
      errorString,
    );
  });

  it("should handle response missing status", async () => {
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
    const createCommentMock = mock(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Promise.resolve({ data: {} } as any),
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
      body,
    });

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to create comment:",
      undefined,
    );
  });
});
